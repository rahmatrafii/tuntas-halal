-- PostgREST 14 retries SQLSTATE 40001 indefinitely. A stale user version is final.
create or replace function private.check_version(p_current integer,p_expected integer) returns void
language plpgsql set search_path = '' as $$
begin
  if p_expected is null or p_current<>p_expected then
    raise exception using errcode='PT409', message='Data sudah berubah. Muat versi terbaru sebelum mencoba lagi.';
  end if;
end;
$$;
