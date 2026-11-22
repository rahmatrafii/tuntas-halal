create function private.require_member(p_org uuid, p_role public.membership_role) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform 1 from public.memberships m where m.organization_id=p_org and m.user_id=auth.uid()
    and m.role=p_role and m.is_active for share;
  if not found then raise exception using errcode='42501', message='Akses tidak diizinkan.'; end if;
end;
$$;
create function private.lock_case(p_id uuid, p_coordinator boolean default false) returns public.cases
language plpgsql security definer set search_path = '' as $$
declare v_case public.cases;
begin
  select * into v_case from public.cases where id=p_id for update;
  if not found then raise exception using errcode='42501', message='Akses tidak diizinkan.'; end if;
  perform private.require_member(v_case.organization_id, case when p_coordinator then 'coordinator'::public.membership_role else 'companion'::public.membership_role end);
  if not p_coordinator and v_case.assignee_id<>auth.uid() then
    raise exception using errcode='42501', message='Hanya pendamping penanggung jawab yang dapat mengubah kasus.';
  end if;
  return v_case;
end;
$$;
create function private.lock_contact(p_id uuid) returns public.business_contacts
language plpgsql security definer set search_path = '' as $$
declare v_contact public.business_contacts;
begin
  select * into v_contact from public.business_contacts where id=p_id for update;
  if not found or v_contact.owner_id is distinct from auth.uid() then
    raise exception using errcode='42501', message='Hanya pemilik kontak yang dapat mengubah kontak.';
  end if;
  perform private.require_member(v_contact.organization_id,'companion');
  return v_contact;
end;
$$;
create function private.lock_task(p_id uuid) returns public.revision_tasks
language plpgsql security definer set search_path = '' as $$
declare v_case_id uuid; v_task public.revision_tasks;
begin
  select case_id into v_case_id from public.revision_tasks where id=p_id;
  if not found then raise exception using errcode='42501', message='Akses tidak diizinkan.'; end if;
  -- All child writes lock the case first, including transfers, to prevent assignment races.
  perform private.lock_case(v_case_id);
  select * into strict v_task from public.revision_tasks where id=p_id for update;
  return v_task;
end;
$$;

create function private.claim_request(p_request_id uuid, p_operation text, p_payload jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v_actor uuid:=auth.uid(); v_hash text; v_inserted integer; v_previous private.mutation_requests;
begin
  if v_actor is null then raise exception using errcode='42501', message='Sesi diperlukan.'; end if;
  if p_request_id is null then raise exception using errcode='22023', message='ID intent diperlukan.'; end if;
  v_hash:=encode(extensions.digest(convert_to(p_payload::text,'UTF8'),'sha256'),'hex');
  insert into private.mutation_requests(actor_id,request_id,operation,payload_hash)
    values(v_actor,p_request_id,p_operation,v_hash) on conflict(actor_id,request_id) do nothing;
  get diagnostics v_inserted=row_count;
  if v_inserted=1 then return null; end if;
  select * into strict v_previous from private.mutation_requests where actor_id=v_actor and request_id=p_request_id;
  if v_previous.operation<>p_operation or v_previous.payload_hash<>v_hash then
    raise exception using errcode='22023', message='ID intent sudah digunakan untuk perubahan berbeda.';
  end if;
  return v_previous.result;
end;
$$;
create function private.finish_request(p_request_id uuid,p_result jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
begin
  update private.mutation_requests set result=p_result where actor_id=auth.uid() and request_id=p_request_id;
  return p_result;
end;
$$;
create function private.check_version(p_current integer,p_expected integer) returns void
language plpgsql set search_path = '' as $$
begin
  if p_expected is null or p_current<>p_expected then
    raise exception using errcode='40001', message='Data sudah berubah. Muat versi terbaru sebelum mencoba lagi.';
  end if;
end;
$$;
create function private.check_completion(p_old public.revision_status,p_new public.revision_status,p_confirmed boolean) returns void
language plpgsql set search_path = '' as $$
begin
  if p_new is null then raise exception using errcode='22023', message='Status diperlukan.'; end if;
  if p_new='completed' and p_old<>'completed' and p_confirmed is not true then
    raise exception using errcode='22023', message='Konfirmasikan pemeriksaan koreksi dan pembaruan resmi.';
  end if;
end;
$$;
create function private.expected_version(p_versions jsonb,p_id uuid) returns integer
language plpgsql set search_path = '' as $$
begin
  return (p_versions->>p_id::text)::integer;
exception when invalid_text_representation or numeric_value_out_of_range then
  raise exception using errcode='22023', message='Versi tugas tidak valid.';
end;
$$;
create function private.normalize_phone(p_phone text) returns text
language plpgsql immutable set search_path = '' as $$
declare v_phone text:=btrim(p_phone);
begin
  if v_phone is null or v_phone!~'^\+?[0-9[:space:]().-]+$' then
    raise exception using errcode='22023', message='Nomor WhatsApp tidak valid.';
  end if;
  v_phone:=regexp_replace(v_phone,'[^0-9]','','g');
  if left(v_phone,1)='0' then v_phone:='62'||substr(v_phone,2); end if;
  if v_phone!~'^[1-9][0-9]{7,14}$' then raise exception using errcode='22023', message='Nomor WhatsApp tidak valid.'; end if;
  return v_phone;
end;
$$;
create function private.check_duplicate_phone(p_org uuid,p_id uuid,p_phone text,p_confirmed boolean) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform pg_advisory_xact_lock(hashtextextended(p_org::text||auth.uid()::text,0));
  if p_confirmed is not true and exists(select 1 from public.business_contacts
    where organization_id=p_org and owner_id=auth.uid() and whatsapp_number=p_phone and id<>p_id) then
    raise exception using errcode='22023', message='Nomor ini sudah tersimpan. Konfirmasikan sebagai usaha berbeda.';
  end if;
end;
$$;

create function public.create_contact(p_request_id uuid,p_id uuid,p_organization_id uuid,p_business_name text,p_whatsapp_number text,p_greeting_name text,p_confirm_duplicate boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_old public.business_contacts; v_phone text; v_name text:=btrim(p_business_name); v_greeting text:=btrim(coalesce(p_greeting_name,'')); v_result jsonb;
begin
  perform private.require_member(p_organization_id,'companion');
  if p_id is null or v_name is null or v_name='' then raise exception using errcode='22023', message='ID dan nama usaha diperlukan.'; end if;
  v_phone:=private.normalize_phone(p_whatsapp_number);
  perform pg_advisory_xact_lock(hashtextextended(p_organization_id::text||auth.uid()::text,0));
  select * into v_old from public.business_contacts where id=p_id for update;
  if found and (v_old.owner_id<>auth.uid() or v_old.organization_id<>p_organization_id) then
    raise exception using errcode='42501', message='Akses tidak diizinkan.';
  end if;
  v_result:=private.claim_request(p_request_id,'create_contact',jsonb_build_object('id',p_id,'org',p_organization_id,'name',v_name,'phone',v_phone,'greeting',v_greeting,'confirmed',coalesce(p_confirm_duplicate,false)));
  if v_result is not null then return v_result; end if;
  if v_old.id is not null then
    if v_old.business_name<>v_name or v_old.whatsapp_number<>v_phone or v_old.greeting_name<>v_greeting then
      raise exception using errcode='22023', message='ID kontak sudah digunakan untuk data berbeda.';
    end if;
  else
    perform private.check_duplicate_phone(p_organization_id,p_id,v_phone,p_confirm_duplicate);
    insert into public.business_contacts(id,organization_id,owner_id,business_name,whatsapp_number,greeting_name)
      values(p_id,p_organization_id,auth.uid(),v_name,v_phone,v_greeting) returning * into v_old;
  end if;
  return private.finish_request(p_request_id,jsonb_build_object('id',v_old.id,'version',v_old.version));
end;
$$;
create function public.update_contact(p_request_id uuid,p_id uuid,p_expected_version integer,p_business_name text,p_whatsapp_number text,p_greeting_name text,p_confirm_duplicate boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_old public.business_contacts; v_phone text; v_name text:=btrim(p_business_name); v_greeting text:=btrim(coalesce(p_greeting_name,'')); v_result jsonb;
begin
  v_old:=private.lock_contact(p_id);
  if v_name is null or v_name='' then raise exception using errcode='22023', message='Nama usaha diperlukan.'; end if;
  v_phone:=private.normalize_phone(p_whatsapp_number);
  v_result:=private.claim_request(p_request_id,'update_contact',jsonb_build_object('id',p_id,'version',p_expected_version,'name',v_name,'phone',v_phone,'greeting',v_greeting,'confirmed',coalesce(p_confirm_duplicate,false)));
  if v_result is not null then return v_result; end if;
  perform private.check_version(v_old.version,p_expected_version);
  perform private.check_duplicate_phone(v_old.organization_id,p_id,v_phone,p_confirm_duplicate);
  update public.business_contacts set business_name=v_name,whatsapp_number=v_phone,greeting_name=v_greeting where id=p_id returning * into v_old;
  return private.finish_request(p_request_id,jsonb_build_object('id',v_old.id,'version',v_old.version));
end;
$$;
create function public.create_case(p_request_id uuid,p_id uuid,p_organization_id uuid,p_contact_id uuid,p_official_reference text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_old public.cases; v_reference text:=nullif(btrim(p_official_reference),''); v_result jsonb;
begin
  perform private.require_member(p_organization_id,'companion');
  if p_id is null then raise exception using errcode='22023', message='ID kasus diperlukan.'; end if;
  perform 1 from public.business_contacts where id=p_contact_id and organization_id=p_organization_id and owner_id=auth.uid() for share;
  if not found then raise exception using errcode='42501', message='Kontak tidak dapat digunakan untuk kasus baru.'; end if;
  -- Recheck an existing resource before its receipt: a transfer revokes the old owner's access.
  select * into v_old from public.cases where id=p_id for update;
  if found and (v_old.organization_id<>p_organization_id or v_old.assignee_id<>auth.uid()) then
    raise exception using errcode='42501', message='Akses tidak diizinkan.';
  end if;
  v_result:=private.claim_request(p_request_id,'create_case',jsonb_build_object('id',p_id,'org',p_organization_id,'contact',p_contact_id,'reference',v_reference));
  if v_result is not null then return v_result; end if;
  if v_old.id is not null then
    if v_old.contact_id<>p_contact_id or v_old.official_reference is distinct from v_reference then
      raise exception using errcode='22023', message='ID kasus sudah digunakan untuk data berbeda.';
    end if;
  else
    insert into public.cases(id,organization_id,contact_id,assignee_id,official_reference)
      values(p_id,p_organization_id,p_contact_id,auth.uid(),v_reference) returning * into v_old;
  end if;
  return private.finish_request(p_request_id,jsonb_build_object('id',v_old.id,'version',v_old.version));
end;
$$;
create function public.update_case(p_request_id uuid,p_id uuid,p_expected_version integer,p_official_reference text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_old public.cases; v_reference text:=nullif(btrim(p_official_reference),''); v_result jsonb;
begin
  v_old:=private.lock_case(p_id);
  v_result:=private.claim_request(p_request_id,'update_case',jsonb_build_object('id',p_id,'version',p_expected_version,'reference',v_reference));
  if v_result is not null then return v_result; end if;
  perform private.check_version(v_old.version,p_expected_version);
  update public.cases set official_reference=v_reference where id=p_id returning * into v_old;
  return private.finish_request(p_request_id,jsonb_build_object('id',v_old.id,'version',v_old.version));
end;
$$;
create function public.create_task(p_request_id uuid,p_id uuid,p_case_id uuid,p_instruction text,p_follow_up_on date)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_old public.revision_tasks; v_instruction text:=btrim(p_instruction); v_result jsonb;
begin
  perform private.lock_case(p_case_id);
  if p_id is null or v_instruction is null or v_instruction='' then raise exception using errcode='22023', message='ID dan instruksi revisi diperlukan.'; end if;
  select * into v_old from public.revision_tasks where id=p_id for update;
  if found and v_old.case_id<>p_case_id then raise exception using errcode='42501', message='Akses tidak diizinkan.'; end if;
  v_result:=private.claim_request(p_request_id,'create_task',jsonb_build_object('id',p_id,'case',p_case_id,'instruction',v_instruction,'follow_up_on',p_follow_up_on));
  if v_result is not null then return v_result; end if;
  if v_old.id is not null then
    if v_old.instruction<>v_instruction or v_old.follow_up_on is distinct from p_follow_up_on then
      raise exception using errcode='22023', message='ID tugas sudah digunakan untuk data berbeda.';
    end if;
  else
    insert into public.revision_tasks(id,case_id,instruction,follow_up_on) values(p_id,p_case_id,v_instruction,p_follow_up_on) returning * into v_old;
  end if;
  return private.finish_request(p_request_id,jsonb_build_object('id',v_old.id,'version',v_old.version));
end;
$$;
create function public.update_task(p_request_id uuid,p_id uuid,p_expected_version integer,p_instruction text,p_status public.revision_status,p_follow_up_on date,p_completion_confirmed boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_old public.revision_tasks; v_instruction text:=btrim(p_instruction); v_result jsonb;
begin
  v_old:=private.lock_task(p_id);
  if v_instruction is null or v_instruction='' then raise exception using errcode='22023', message='Instruksi revisi diperlukan.'; end if;
  v_result:=private.claim_request(p_request_id,'update_task',jsonb_build_object('id',p_id,'version',p_expected_version,'instruction',v_instruction,'status',p_status,'follow_up_on',p_follow_up_on,'confirmed',coalesce(p_completion_confirmed,false)));
  if v_result is not null then return v_result; end if;
  perform private.check_version(v_old.version,p_expected_version);
  perform private.check_completion(v_old.status,p_status,p_completion_confirmed);
  update public.revision_tasks set instruction=v_instruction,status=p_status,follow_up_on=p_follow_up_on where id=p_id returning * into v_old;
  return private.finish_request(p_request_id,jsonb_build_object('id',v_old.id,'version',v_old.version));
end;
$$;
create function public.set_task_statuses(p_request_id uuid,p_case_id uuid,p_task_ids uuid[],p_expected_versions jsonb,p_status public.revision_status,p_follow_up_on date,p_completion_confirmed boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_task public.revision_tasks; v_ids uuid[]; v_result jsonb;
begin
  perform private.lock_case(p_case_id);
  if p_task_ids is null or cardinality(p_task_ids)=0 or array_position(p_task_ids,null) is not null
    or cardinality(p_task_ids)<>(select count(distinct x) from unnest(p_task_ids) x)
    or jsonb_typeof(p_expected_versions) is distinct from 'object' then
    raise exception using errcode='22023', message='Pilih tugas unik dengan versi dari satu kasus.';
  end if;
  select array_agg(x order by x) into v_ids from unnest(p_task_ids) x;
  if (select count(*) from public.revision_tasks where case_id=p_case_id and id=any(v_ids))<>cardinality(v_ids) then
    raise exception using errcode='22023', message='Pilih revisi dari satu kasus.';
  end if;
  v_result:=private.claim_request(p_request_id,'set_task_statuses',jsonb_build_object('case',p_case_id,'ids',v_ids,'versions',p_expected_versions,'status',p_status,'follow_up_on',p_follow_up_on,'confirmed',coalesce(p_completion_confirmed,false)));
  if v_result is not null then return v_result; end if;
  for v_task in select * from public.revision_tasks where id=any(v_ids) order by id for update loop
    perform private.check_version(v_task.version,private.expected_version(p_expected_versions,v_task.id));
    perform private.check_completion(v_task.status,p_status,p_completion_confirmed);
  end loop;
  update public.revision_tasks set status=p_status,follow_up_on=p_follow_up_on where id=any(v_ids);
  select jsonb_build_object('case_id',p_case_id,'versions',jsonb_object_agg(id::text,version)) into v_result from public.revision_tasks where id=any(v_ids);
  return private.finish_request(p_request_id,v_result);
end;
$$;
create function public.transfer_case(p_request_id uuid,p_id uuid,p_expected_version integer,p_assignee_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_old public.cases; v_result jsonb;
begin
  v_old:=private.lock_case(p_id,true);
  v_result:=private.claim_request(p_request_id,'transfer_case',jsonb_build_object('id',p_id,'version',p_expected_version,'assignee',p_assignee_id));
  if v_result is not null then return v_result; end if;
  perform private.check_version(v_old.version,p_expected_version);
  perform 1 from public.memberships where organization_id=v_old.organization_id and user_id=p_assignee_id and role='companion' and is_active for share;
  if not found or p_assignee_id=v_old.assignee_id then
    raise exception using errcode='22023', message='Pilih pendamping aktif yang berbeda pada LP3H yang sama.';
  end if;
  update public.cases set assignee_id=p_assignee_id where id=p_id returning * into v_old;
  return private.finish_request(p_request_id,jsonb_build_object('id',v_old.id,'version',v_old.version));
end;
$$;

revoke all on all functions in schema private from public, anon, authenticated, service_role;
grant execute on function private.is_active_member(uuid,public.membership_role), private.can_read_case(uuid), private.can_read_contact(uuid) to authenticated;
revoke all on function public.create_contact(uuid,uuid,uuid,text,text,text,boolean),public.update_contact(uuid,uuid,integer,text,text,text,boolean),
public.create_case(uuid,uuid,uuid,uuid,text),public.update_case(uuid,uuid,integer,text),public.create_task(uuid,uuid,uuid,text,date),
public.update_task(uuid,uuid,integer,text,public.revision_status,date,boolean),public.set_task_statuses(uuid,uuid,uuid[],jsonb,public.revision_status,date,boolean),
public.transfer_case(uuid,uuid,integer,uuid) from public,anon;
grant execute on function public.create_contact(uuid,uuid,uuid,text,text,text,boolean),public.update_contact(uuid,uuid,integer,text,text,text,boolean),
public.create_case(uuid,uuid,uuid,uuid,text),public.update_case(uuid,uuid,integer,text),public.create_task(uuid,uuid,uuid,text,date),
public.update_task(uuid,uuid,integer,text,public.revision_status,date,boolean),public.set_task_statuses(uuid,uuid,uuid[],jsonb,public.revision_status,date,boolean),
public.transfer_case(uuid,uuid,integer,uuid) to authenticated;
