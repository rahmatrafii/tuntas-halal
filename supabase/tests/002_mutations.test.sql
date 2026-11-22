begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();
insert into auth.users(id,email) values
('00000000-0000-0000-0000-000000000001','a1@example.test'),
('00000000-0000-0000-0000-000000000002','a2@example.test'),
('00000000-0000-0000-0000-000000000003','ak@example.test'),
('00000000-0000-0000-0000-000000000004','inactive@example.test'),
('00000000-0000-0000-0000-000000000005','b1@example.test');
insert into organizations(id,name) values
('10000000-0000-0000-0000-000000000001','LP3H A Fiktif'),
('10000000-0000-0000-0000-000000000002','LP3H B Fiktif');
insert into memberships(organization_id,user_id,role,is_active) values
('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','companion',true),
('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','companion',true),
('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000003','coordinator',true),
('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000004','companion',false),
('10000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000005','companion',true);
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
select lives_ok($$select create_contact('50000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001',' Usaha Fiktif ','0812 0000 0101',' Bu Rina ',false)$$,'companion creates own contact');
select is((select whatsapp_number from business_contacts), '6281200000101', 'phone is normalized at the database boundary');
select lives_ok($$select create_contact('50000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001',' Usaha Fiktif ','0812 0000 0101',' Bu Rina ',false)$$,'same intent retries safely');
select is((select count(*) from business_contacts),1::bigint,'retry does not create a second contact');
select throws_ok($$select create_contact('50000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','Changed','0812 0000 0101','Bu Rina',false)$$,'22023',null,'changed payload cannot reuse an intent');
select throws_ok($$select create_contact('50000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','Usaha Kedua','6281200000101','',false)$$,'22023',null,'duplicate phone needs explicit confirmation');
select lives_ok($$select create_contact('50000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000002','10000000-0000-0000-0000-000000000001','Usaha Kedua','6281200000101','',true)$$,'confirmed duplicate phone is permitted');
select lives_ok($$select update_contact('50000000-0000-0000-0000-000000000003','20000000-0000-0000-0000-000000000002',1,'Usaha Kedua Ubah','6281200000102','Ibu',false)$$,'owner edits contact with expected version');
select throws_ok($$select create_contact('50000000-0000-0000-0000-000000000004','20000000-0000-0000-0000-000000000004','10000000-0000-0000-0000-000000000002','Spoof tenant','6281200000999','',false)$$,'42501',null,'tenant from client is checked');
select lives_ok($$select create_case('50000000-0000-0000-0000-000000000010','30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',null)$$,'companion creates assigned case');
select is(case_is_complete('30000000-0000-0000-0000-000000000001'),false,'empty case is not complete');
select lives_ok($$select update_case('50000000-0000-0000-0000-000000000011','30000000-0000-0000-0000-000000000001',1,'SH-DEMO')$$,'assignee updates official reference');
select throws_ok($$select update_case('50000000-0000-0000-0000-000000000012','30000000-0000-0000-0000-000000000001',1,'STALE')$$,'PT409',null,'stale case update is rejected');
select is((select official_reference from cases),'SH-DEMO','stale write preserves official reference');
select lives_ok($$select create_task('50000000-0000-0000-0000-000000000020','40000000-0000-0000-0000-000000000001','30000000-0000-0000-0000-000000000001',' Instruksi awal ',null)$$,'assignee creates first task');
select lives_ok($$select create_task('50000000-0000-0000-0000-000000000021','40000000-0000-0000-0000-000000000002','30000000-0000-0000-0000-000000000001','Instruksi kedua',null)$$,'assignee creates another task');
select throws_ok($$select create_task('50000000-0000-0000-0000-000000000022','40000000-0000-0000-0000-000000000003','30000000-0000-0000-0000-000000000001','   ',null)$$,'22023',null,'RPC rejects blank instructions');
select lives_ok($$select update_task('50000000-0000-0000-0000-000000000023','40000000-0000-0000-0000-000000000001',1,' Instruksi diperjelas ','needs_review','2026-11-21',false)$$,'task edit/status/date save is atomic');
select is((select instruction from revision_tasks where id='40000000-0000-0000-0000-000000000001'),'Instruksi diperjelas','instruction is trimmed');
select is((select follow_up_on::text from revision_tasks where id='40000000-0000-0000-0000-000000000001'),'2026-11-21','follow-up stays a calendar date');
select throws_ok($$select update_task('50000000-0000-0000-0000-000000000024','40000000-0000-0000-0000-000000000001',2,'Instruksi diperjelas','completed',null,false)$$,'22023',null,'completion requires explicit review confirmation');
select is((select version from revision_tasks where id='40000000-0000-0000-0000-000000000001'),2,'rejected completion preserves task version');
select lives_ok($$select update_task('50000000-0000-0000-0000-000000000024','40000000-0000-0000-0000-000000000001',2,'Instruksi diperjelas','completed',null,true)$$,'confirmed completion succeeds');
select is(case_is_complete('30000000-0000-0000-0000-000000000001'),false,'one completed task does not complete the case');
select lives_ok($$select update_task('50000000-0000-0000-0000-000000000025','40000000-0000-0000-0000-000000000001',3,'Instruksi diperjelas','needs_sending',null,false)$$,'manual correction reopens a task');
select is((select count(*) from audit_events),7::bigint,'successful writes have matching audit events');
select throws_ok($$select set_task_statuses('50000000-0000-0000-0000-000000000030','30000000-0000-0000-0000-000000000001',array['40000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000002']::uuid[],'{"40000000-0000-0000-0000-000000000001":4,"40000000-0000-0000-0000-000000000002":999}','awaiting_reply',null,false)$$,'PT409',null,'one stale task rejects the entire batch');
select is((select count(*) from revision_tasks where status='awaiting_reply'),0::bigint,'failed batch changes no status');
select is((select count(*) from audit_events),7::bigint,'failed batch creates no audit');
select throws_ok($$select set_task_statuses('50000000-0000-0000-0000-000000000031','30000000-0000-0000-0000-000000000001',array['40000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000001']::uuid[],'{}','awaiting_reply',null,false)$$,'22023',null,'duplicate selected task IDs are rejected');
select lives_ok($$select set_task_statuses('50000000-0000-0000-0000-000000000030','30000000-0000-0000-0000-000000000001',array['40000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000002']::uuid[],'{"40000000-0000-0000-0000-000000000001":4,"40000000-0000-0000-0000-000000000002":1}','completed',null,true)$$,'all selected tasks complete atomically');
select is(case_is_complete('30000000-0000-0000-0000-000000000001'),true,'case completion is derived from all tasks');
select lives_ok($$select set_task_statuses('50000000-0000-0000-0000-000000000030','30000000-0000-0000-0000-000000000001',array['40000000-0000-0000-0000-000000000001','40000000-0000-0000-0000-000000000002']::uuid[],'{"40000000-0000-0000-0000-000000000001":4,"40000000-0000-0000-0000-000000000002":1}','completed',null,true)$$,'retry returns the completed intent despite old expected versions');
select is((select count(*) from audit_events),9::bigint,'retry does not append duplicate audit');
select is((select count(*) from audit_events where before ? 'instruction' or after ? 'instruction'),0::bigint,'audit contains no instruction snapshots');

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000003',true);
select throws_ok($$select update_task('50000000-0000-0000-0000-000000000040','40000000-0000-0000-0000-000000000001',5,'Spoof','needs_review',null,false)$$,'42501',null,'coordinator cannot edit task status/instruction');
select throws_ok($$select transfer_case('50000000-0000-0000-0000-000000000041','30000000-0000-0000-0000-000000000001',2,'00000000-0000-0000-0000-000000000004')$$,'22023',null,'transfer to inactive member is rejected');
select throws_ok($$select transfer_case('50000000-0000-0000-0000-000000000042','30000000-0000-0000-0000-000000000001',2,'00000000-0000-0000-0000-000000000005')$$,'22023',null,'transfer to another tenant is rejected');
select lives_ok($$select transfer_case('50000000-0000-0000-0000-000000000043','30000000-0000-0000-0000-000000000001',2,'00000000-0000-0000-0000-000000000002')$$,'coordinator transfers to active companion');
select lives_ok($$select transfer_case('50000000-0000-0000-0000-000000000043','30000000-0000-0000-0000-000000000001',2,'00000000-0000-0000-0000-000000000002')$$,'transfer retry is idempotent');
select is((select count(*) from audit_events where event_type='case_transferred'),1::bigint,'transfer has one audit event');
select is((select count(*) from business_contacts),1::bigint,'coordinator cannot read unused contacts');

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000001',true);
select is((select count(*) from cases),0::bigint,'old companion loses the case');
select is((select count(*) from revision_tasks),0::bigint,'old companion loses tasks');
select is((select count(*) from audit_events),0::bigint,'old companion loses audit');
select throws_ok($$select create_case('50000000-0000-0000-0000-000000000010','30000000-0000-0000-0000-000000000001','10000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000001',null)$$,'42501',null,'create retry does not reveal a receipt after transfer');
select throws_ok($$select update_task('50000000-0000-0000-0000-000000000023','40000000-0000-0000-0000-000000000001',1,' Instruksi diperjelas ','needs_review','2026-11-21',false)$$,'42501',null,'update retry rechecks current authority');

select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000002',true);
select is((select count(*) from cases),1::bigint,'new assignee sees transferred case');
select is((select count(*) from business_contacts),1::bigint,'new assignee receives only needed contact');
select throws_ok($$select update_contact('50000000-0000-0000-0000-000000000050','20000000-0000-0000-0000-000000000001',1,'Spoof','6281200000101','',false)$$,'42501',null,'contact read access is not edit ownership');
select lives_ok($$select update_task('50000000-0000-0000-0000-000000000051','40000000-0000-0000-0000-000000000001',5,'Instruksi diperjelas','needs_review',null,false)$$,'new assignee can work on the transferred task');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000005',true);
select throws_ok($$select update_case('50000000-0000-0000-0000-000000000060','30000000-0000-0000-0000-000000000001',3,'Spoof')$$,'42501',null,'cross-tenant mutation is rejected');
select is((select count(*) from cases),0::bigint,'cross-tenant denied write does not grant read access');
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000004',true);
select throws_ok($$select create_contact('50000000-0000-0000-0000-000000000070','20000000-0000-0000-0000-000000000070','10000000-0000-0000-0000-000000000001','Inactive','6281200000170','',false)$$,'42501',null,'inactive member cannot create data');
reset role;
set local role anon;
select throws_ok($$select create_contact('50000000-0000-0000-0000-000000000080','20000000-0000-0000-0000-000000000080','10000000-0000-0000-0000-000000000001','Anonymous','6281200000180','',false)$$,'42501',null,'anonymous cannot execute write RPC');
reset role;
select * from finish();
rollback;
