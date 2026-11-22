begin;
create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;
select no_plan();

insert into auth.users (id, email) values
('00000000-0000-0000-0000-000000000001', 'a1@example.test'),
('00000000-0000-0000-0000-000000000002', 'a2@example.test'),
('00000000-0000-0000-0000-000000000003', 'ak@example.test'),
('00000000-0000-0000-0000-000000000004', 'inactive@example.test'),
('00000000-0000-0000-0000-000000000005', 'b1@example.test'),
('00000000-0000-0000-0000-000000000006', 'bk@example.test');
insert into organizations(id, name) values
('10000000-0000-0000-0000-000000000001', 'LP3H A Fiktif'),
('10000000-0000-0000-0000-000000000002', 'LP3H B Fiktif');
insert into memberships(organization_id, user_id, role, is_active) values
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'companion', true),
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'companion', true),
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'coordinator', true),
('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 'companion', false),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', 'companion', true),
('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000006', 'coordinator', true);
insert into business_contacts(id, organization_id, owner_id, business_name, whatsapp_number) values
('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Usaha A1', '6281200000101'),
('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Usaha A2', '6281200000102'),
('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000005', 'Usaha B1', '6281200000103');
insert into cases(id, organization_id, contact_id, assignee_id) values
('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002'),
('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000002'),
('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000005');
insert into revision_tasks(id, case_id, instruction) values
('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', 'Koreksi A pindahan'),
('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', 'Koreksi A lama'),
('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', 'Koreksi A2'),
('40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000004', 'Koreksi B');

set local role anon;
select throws_ok('select * from public.cases', '42501', null, 'anonymous cannot read business data');
select throws_ok('insert into public.organizations(name) values (''Spoof'')', '42501', null, 'anonymous cannot provision a tenant');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000001', true);
select is((select count(*) from organizations), 1::bigint, 'companion sees own organization');
select is((select count(*) from cases), 1::bigint, 'former assignee sees only remaining case');
select is((select count(*) from business_contacts), 1::bigint, 'owner still sees own contact');
select is((select count(*) from revision_tasks), 1::bigint, 'task access follows case assignment');
select is((select count(*) from audit_events where case_id = '30000000-0000-0000-0000-000000000001'), 0::bigint, 'former assignee cannot read transferred history');
select throws_ok('update public.revision_tasks set status = ''completed''', '42501', null, 'direct task writes cannot bypass checked RPCs');
select throws_ok('update public.memberships set role = ''coordinator''', '42501', null, 'client cannot elevate its role');
select throws_ok('delete from public.audit_events', '42501', null, 'client cannot delete audit');
select throws_ok('insert into public.audit_events(case_id,event_type) values (''30000000-0000-0000-0000-000000000002'',''spoof'')', '42501', null, 'client cannot forge audit');
select throws_ok('select * from private.mutation_requests', '42501', null, 'receipt payloads are not readable to clients');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000002', true);
select is((select count(*) from cases), 2::bigint, 'new companion sees assigned cases');
select is((select count(*) from business_contacts), 2::bigint, 'new assignee sees own and required transferred contact');
select is((select count(*) from cases where id = '30000000-0000-0000-0000-000000000002'), 0::bigint, 'contact access does not expose another case');
select is((select count(*) from revision_tasks where id = '40000000-0000-0000-0000-000000000002'), 0::bigint, 'contact access does not expose another task');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000003', true);
select is((select count(*) from cases), 3::bigint, 'coordinator reads own tenant cases');
select is((select count(*) from business_contacts), 2::bigint, 'coordinator sees only contacts required by own tenant cases');
select is((select count(*) from organizations), 1::bigint, 'coordinator cannot enumerate other tenants');
select throws_ok('update public.cases set assignee_id = ''00000000-0000-0000-0000-000000000003''', '42501', null, 'coordinator cannot bypass transfer validation');

select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000004', true);
select is((select count(*) from cases), 0::bigint, 'inactive member cannot read cases');
select is((select count(*) from business_contacts), 0::bigint, 'inactive member cannot read contacts');
select is((select count(*) from memberships), 0::bigint, 'inactive member cannot enumerate staff');
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-000000000005', true);
select is((select count(*) from cases), 1::bigint, 'second tenant companion sees own case only');
select is((select count(*) from audit_events where case_id <> '30000000-0000-0000-0000-000000000004'), 0::bigint, 'audit is isolated between tenants');
reset role;

select throws_ok($$insert into organizations(name,timezone) values ('Invalid zone','Mars/Nowhere')$$, '23514', null, 'timezone must be a recognized IANA zone');
select throws_ok($$insert into revision_tasks(case_id,instruction) values ('30000000-0000-0000-0000-000000000002','   ')$$, '23514', null, 'blank instructions are rejected');
select throws_ok($$insert into cases(organization_id,contact_id,assignee_id) values ('10000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000005')$$, '23503', null, 'case cannot reference another tenant contact');
select throws_ok($$update cases set assignee_id='00000000-0000-0000-0000-000000000004' where id='30000000-0000-0000-0000-000000000002'$$, '22023', null, 'inactive target is rejected');
select throws_ok($$update cases set assignee_id='00000000-0000-0000-0000-000000000003' where id='30000000-0000-0000-0000-000000000002'$$, '22023', null, 'coordinator is not a companion assignment target');
select lives_ok($$insert into business_contacts(organization_id,owner_id,business_name,whatsapp_number) values ('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000001','Second business','6281200000101')$$, 'phone number is intentionally not unique');
select throws_ok('delete from audit_events', '42501', null, 'audit remains append-only even for maintenance SQL');
set local role service_role;
select lives_ok($$insert into public.organizations(name,timezone) values ('Administrative fixture','Asia/Jakarta')$$, 'administrative provisioning can validate the timezone CHECK');
reset role;
select * from finish();
rollback;
