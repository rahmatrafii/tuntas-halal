begin;
create extension if not exists pgtap with schema extensions;
set local search_path=public,extensions;
select no_plan();
insert into auth.users(id,email) values
('00000000-0000-4000-8000-000000000041','f04-owner@example.test'),
('00000000-0000-4000-8000-000000000042','f04-coordinator@example.test');
insert into organizations(id,name) values('10000000-0000-4000-8000-000000000041','LP3H F04 Fiktif');
insert into memberships(organization_id,user_id,role) values
('10000000-0000-4000-8000-000000000041','00000000-0000-4000-8000-000000000041','companion'),
('10000000-0000-4000-8000-000000000041','00000000-0000-4000-8000-000000000042','coordinator');
insert into business_contacts(id,organization_id,owner_id,business_name,whatsapp_number) values
('20000000-0000-4000-8000-000000000041','10000000-0000-4000-8000-000000000041','00000000-0000-4000-8000-000000000041','Usaha F04','6281200000041');
insert into cases(id,organization_id,contact_id,assignee_id) values
('30000000-0000-4000-8000-000000000041','10000000-0000-4000-8000-000000000041','20000000-0000-4000-8000-000000000041','00000000-0000-4000-8000-000000000041');
insert into revision_tasks(id,case_id,instruction,status,follow_up_on) values
('40000000-0000-4000-8000-000000000041','30000000-0000-4000-8000-000000000041','Awal','completed','2026-11-25');
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000041',true);
select lives_ok($$select update_task_instruction('50000000-0000-4000-8000-000000000041','40000000-0000-4000-8000-000000000041',1,E' \tPerjelas instruksi\n ')$$,'instruction-only RPC exists and edits completed task');
select is((select instruction from revision_tasks where id='40000000-0000-4000-8000-000000000041'),'Perjelas instruksi','trim instruction');
select is((select status::text from revision_tasks where id='40000000-0000-4000-8000-000000000041'),'completed','edit retains completed status');
select is((select follow_up_on::text from revision_tasks where id='40000000-0000-4000-8000-000000000041'),'2026-11-25','edit retains date');
select is((select version from revision_tasks where id='40000000-0000-4000-8000-000000000041'),2,'one edit increments version once');
select lives_ok($$select update_task_instruction('50000000-0000-4000-8000-000000000041','40000000-0000-4000-8000-000000000041',1,'Perjelas instruksi')$$,'retry returns receipt before version check');
select is((select version from revision_tasks where id='40000000-0000-4000-8000-000000000041'),2,'retry does not increment version');
select is((select count(*)::integer from audit_events where task_id='40000000-0000-4000-8000-000000000041'),2,'create plus one update audit only');
select throws_ok($$select update_task_instruction('50000000-0000-4000-8000-000000000042','40000000-0000-4000-8000-000000000041',1,'Stale')$$,'PT409',null,'stale intent conflicts');
select throws_ok($$select update_task_instruction('50000000-0000-4000-8000-000000000041','40000000-0000-4000-8000-000000000041',1,'Different')$$,'22023',null,'same key with changed payload rejected');
select throws_ok($$select update_task_instruction('50000000-0000-4000-8000-000000000043','40000000-0000-4000-8000-000000000041',2,chr(160)||chr(65279))$$,'22023',null,'Unicode whitespace rejected');
select update_task('50000000-0000-4000-8000-000000000044','40000000-0000-4000-8000-000000000041',2,'Perjelas instruksi','awaiting_reply','2026-12-01',false);
select lives_ok($$select update_task_instruction('50000000-0000-4000-8000-000000000041','40000000-0000-4000-8000-000000000041',1,'Perjelas instruksi')$$,'lost response receipt survives later status change');
select is((select status::text from revision_tasks where id='40000000-0000-4000-8000-000000000041'),'awaiting_reply','retry preserves latest status');
select is((select follow_up_on::text from revision_tasks where id='40000000-0000-4000-8000-000000000041'),'2026-12-01','retry preserves latest date');
select is((select version from revision_tasks where id='40000000-0000-4000-8000-000000000041'),3,'old receipt causes no extra update');
select ok(not exists(select 1 from audit_events where task_id='40000000-0000-4000-8000-000000000041' and (before::text||after::text) like '%Perjelas%'),'audit never stores instruction');
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000042',true);
select throws_ok($$select update_task_instruction('50000000-0000-4000-8000-000000000045','40000000-0000-4000-8000-000000000041',3,'Coordinator')$$,'42501',null,'coordinator cannot edit instruction');
reset role;
update memberships set is_active=false where user_id='00000000-0000-4000-8000-000000000041';
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000041',true);
select throws_ok($$select update_task_instruction('50000000-0000-4000-8000-000000000041','40000000-0000-4000-8000-000000000041',1,'Perjelas instruksi')$$,'42501',null,'revocation checked before old successful receipt');
set local role anon;
select throws_ok($$select update_task_instruction('50000000-0000-4000-8000-000000000046','40000000-0000-4000-8000-000000000041',3,'Anonymous')$$,'42501',null,'anonymous cannot execute');
reset role;
select * from finish();
rollback;
