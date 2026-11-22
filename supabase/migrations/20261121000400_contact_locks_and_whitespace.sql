-- Keep JavaScript trim semantics at the database boundary, including Unicode whitespace.
create function private.trim_text(p_value text) returns text
language sql immutable strict set search_path = '' as $$
  select btrim(p_value, U&'\0009\000A\000B\000C\000D\0020\00A0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200A\2028\2029\202F\205F\3000\FEFF');
$$;
revoke all on function private.trim_text(text) from public,anon,authenticated;
grant execute on function private.trim_text(text) to service_role;
alter table public.organizations drop constraint organizations_name_check,
  add constraint organizations_name_check check(private.trim_text(name)<>'');
alter table public.business_contacts drop constraint business_contacts_business_name_check,
  add constraint business_contacts_business_name_check check(private.trim_text(business_name)<>'');
alter table public.cases drop constraint cases_official_reference_check,
  add constraint cases_official_reference_check check(official_reference is null or private.trim_text(official_reference)<>'');
alter table public.revision_tasks drop constraint revision_tasks_instruction_check,
  add constraint revision_tasks_instruction_check check(private.trim_text(instruction)<>'');

-- Match create_contact's owner-advisory-before-row order; validate again after locking.
create or replace function private.lock_contact(p_id uuid) returns public.business_contacts
language plpgsql security definer set search_path = '' as $$
declare v_contact public.business_contacts; v_org uuid;
begin
  select * into v_contact from public.business_contacts where id=p_id;
  if not found or v_contact.owner_id is distinct from auth.uid() then
    raise exception using errcode='42501', message='Hanya pemilik kontak yang dapat mengubah kontak.';
  end if;
  v_org:=v_contact.organization_id;
  perform private.require_member(v_org,'companion');
  perform pg_advisory_xact_lock(hashtextextended(v_org::text||auth.uid()::text,0));
  select * into v_contact from public.business_contacts where id=p_id for update;
  if not found or v_contact.owner_id is distinct from auth.uid() or v_contact.organization_id<>v_org then
    raise exception using errcode='42501', message='Akses kontak sudah berubah.';
  end if;
  perform private.require_member(v_org,'companion');
  return v_contact;
end;
$$;

create or replace function public.create_contact(p_request_id uuid,p_id uuid,p_organization_id uuid,p_business_name text,p_whatsapp_number text,p_greeting_name text,p_confirm_duplicate boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_old public.business_contacts; v_phone text; v_name text:=private.trim_text(p_business_name); v_greeting text:=private.trim_text(coalesce(p_greeting_name,'')); v_result jsonb;
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
create or replace function public.update_contact(p_request_id uuid,p_id uuid,p_expected_version integer,p_business_name text,p_whatsapp_number text,p_greeting_name text,p_confirm_duplicate boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_old public.business_contacts; v_phone text; v_name text:=private.trim_text(p_business_name); v_greeting text:=private.trim_text(coalesce(p_greeting_name,'')); v_result jsonb;
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
create or replace function public.create_case(p_request_id uuid,p_id uuid,p_organization_id uuid,p_contact_id uuid,p_official_reference text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_old public.cases; v_reference text:=nullif(private.trim_text(p_official_reference),''); v_result jsonb;
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
create or replace function public.update_case(p_request_id uuid,p_id uuid,p_expected_version integer,p_official_reference text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_old public.cases; v_reference text:=nullif(private.trim_text(p_official_reference),''); v_result jsonb;
begin
  v_old:=private.lock_case(p_id);
  v_result:=private.claim_request(p_request_id,'update_case',jsonb_build_object('id',p_id,'version',p_expected_version,'reference',v_reference));
  if v_result is not null then return v_result; end if;
  perform private.check_version(v_old.version,p_expected_version);
  update public.cases set official_reference=v_reference where id=p_id returning * into v_old;
  return private.finish_request(p_request_id,jsonb_build_object('id',v_old.id,'version',v_old.version));
end;
$$;
create or replace function public.create_task(p_request_id uuid,p_id uuid,p_case_id uuid,p_instruction text,p_follow_up_on date)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_old public.revision_tasks; v_instruction text:=private.trim_text(p_instruction); v_result jsonb;
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
create or replace function public.update_task(p_request_id uuid,p_id uuid,p_expected_version integer,p_instruction text,p_status public.revision_status,p_follow_up_on date,p_completion_confirmed boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_old public.revision_tasks; v_instruction text:=private.trim_text(p_instruction); v_result jsonb;
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
