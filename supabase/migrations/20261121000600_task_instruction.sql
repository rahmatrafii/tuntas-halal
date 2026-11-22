-- Instruction edits must not carry status/date snapshots into retry payloads.
create function public.update_task_instruction(p_request_id uuid,p_id uuid,p_expected_version integer,p_instruction text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_task public.revision_tasks; v_instruction text:=private.trim_text(p_instruction); v_result jsonb;
begin
  v_task:=private.lock_task(p_id);
  if v_instruction is null or v_instruction='' then
    raise exception using errcode='22023', message='Instruksi revisi diperlukan.';
  end if;
  v_result:=private.claim_request(p_request_id,'update_task_instruction',jsonb_build_object('id',p_id,'version',p_expected_version,'instruction',v_instruction));
  if v_result is not null then return v_result; end if;
  perform private.check_version(v_task.version,p_expected_version);
  update public.revision_tasks set instruction=v_instruction where id=p_id returning * into v_task;
  return private.finish_request(p_request_id,jsonb_build_object('id',v_task.id,'version',v_task.version));
end;
$$;
revoke all on function public.update_task_instruction(uuid,uuid,integer,text) from public,anon;
grant execute on function public.update_task_instruction(uuid,uuid,integer,text) to authenticated;
