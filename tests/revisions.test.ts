import assert from "node:assert/strict";
import {test} from "node:test";
import {fixture,org,otherOrg,actor,resource,seed,contact} from "./caseload-fixture";
import {saveTask} from "../src/features/revisions/mutations";
import {getTask,listTasks} from "../src/features/revisions/queries";
import {organizationAccess} from "../src/features/caseload/access";

const caseId="dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const caseRow={id:caseId,organization_id:org,contact_id:contact.id,assignee_id:actor,official_reference:null,version:1,created_at:contact.created_at,business_contacts:contact};
const task={id:resource,case_id:caseId,instruction:"Instruksi lama",status:"completed",follow_up_on:"2026-11-25",version:2,created_at:contact.created_at,updated_at:contact.created_at};
function form(extra:Record<string,string>={}){const result=new FormData();for(const [k,v] of Object.entries({resourceId:resource,intentSeed:seed,instruction:"  Perbaiki foto\nlabel  ",expectedVersion:"2",...extra}))result.set(k,v);return result;}
const rows={cases:[caseRow],revision_tasks:[task]};

test("revision validation rejects empty, long, duplicate and malformed fields retaining text",async()=>{
  for(const extra of [{instruction:"\t\n\uFEFF"},{instruction:"x".repeat(2001)},{resourceId:"bad"},{expectedVersion:"0"},{expectedVersion:"2147483648"}] as Record<string,string>[]){
    const f=fixture({rows}),body=form(extra);
    const result=await saveTask(f.client,org,caseId,"update",body);
    assert.equal(result.status,"invalid");assert.equal(result.values.instruction,body.get("instruction"));
    assert(!f.calls.some(c=>c.url.pathname.includes("/rpc/")));
  }
  const body=form();body.append("instruction","second");
  assert.equal((await saveTask(fixture({rows}).client,org,caseId,"update",body)).status,"invalid");
});
test("revision create normalizes text, ignores forged status and uses stable intent IDs",async()=>{
  const f=fixture({rows:{cases:[caseRow]}}),body=form({status:"completed",follow_up_on:"2028-01-01"});
  assert.equal((await saveTask(f.client,org,caseId,"create",body)).status,"saved");
  await saveTask(f.client,org,caseId,"create",body);
  await saveTask(f.client,org,caseId,"create",form({instruction:"Berbeda"}));
  const writes=f.calls.filter(c=>c.url.pathname.endsWith("create_task")).map(c=>c.body!);
  assert.equal(writes[0].p_instruction,"Perbaiki foto\nlabel");assert.equal(writes[0].p_follow_up_on,null);
  assert.equal(writes[0].p_case_id,caseId);assert.equal(writes[0].p_id,resource);
  assert.equal(writes[0].p_request_id,writes[1].p_request_id);assert.notEqual(writes[0].p_request_id,writes[2].p_request_id);
  assert(!("p_status" in writes[0]));
});
test("instruction-only update reaches receipt with stale version and excludes status/date",async()=>{
  const f=fixture({rows}),body=form({expectedVersion:"1",status:"needs_sending"});
  assert.equal((await saveTask(f.client,org,caseId,"update",body)).status,"saved");
  await saveTask(f.client,org,caseId,"update",body);
  const writes=f.calls.filter(c=>c.url.pathname.endsWith("update_task_instruction")).map(c=>c.body!);
  assert.equal(writes.length,2);assert.equal(writes[0].p_expected_version,1);
  assert.equal(writes[0].p_request_id,writes[1].p_request_id);
  assert.deepEqual(Object.keys(writes[0]).sort(),["p_expected_version","p_id","p_instruction","p_request_id"]);
});
test("native CRLF and hydrated LF textarea submissions represent the same revision intent",async()=>{
  const f=fixture({rows:{cases:[caseRow]}});
  await saveTask(f.client,org,caseId,"create",form({instruction:"Foto label\r\nTerbaca"}));
  await saveTask(f.client,org,caseId,"create",form({instruction:"Foto label\nTerbaca"}));
  const writes=f.calls.filter(c=>c.url.pathname.endsWith("create_task")).map(c=>c.body!);
  assert.equal(writes[0].p_request_id,writes[1].p_request_id);
  assert.equal(writes[0].p_instruction,"Foto label\nTerbaca");
  assert.equal((await saveTask(f.client,org,caseId,"create",form({instruction:"x".repeat(1990)+"\r\n".repeat(10)}))).status,"saved");
});
test("revision writes reject other tenants, coordinator, assignee and mismatched parent",async()=>{
  for(const [f,organization] of [[fixture({role:"coordinator",rows}),org],[fixture({rows}),otherOrg],[fixture({rows:{...rows,cases:[{...caseRow,assignee_id:seed}]}}),org],[fixture({rows:{...rows,revision_tasks:[{...task,case_id:seed}]}}),org]] as const){
    assert.equal((await saveTask(f.client,organization,caseId,"update",form())).status,"forbidden");
    assert(!f.calls.some(c=>c.url.pathname.includes("/rpc/")));
  }
});
test("revision conflict preserves input and shows current accessible status/date/version",async()=>{
  const f=fixture({rows,rpcError:{code:"PT409",message:"private diagnostic"}});
  const result=await saveTask(f.client,org,caseId,"update",form({expectedVersion:"1"}));
  assert.equal(result.status,"conflict");assert.equal(result.values.instruction,"  Perbaiki foto\nlabel  ");
  assert.equal(result.latest?.values.instruction,"Instruksi lama");assert.equal(result.latest?.values.status,"completed");assert.equal(result.latest?.version,2);
  const options={rows,active:true,rpcError:{code:"PT409",message:"private"},onRpc:()=>{options.active=false;}};
  const revoked=await saveTask(fixture(options).client,org,caseId,"update",form());
  assert.equal(revoked.status,"forbidden");assert.equal(revoked.latest,undefined);
});
test("revision errors and reviewed native retries retain text and effective version",async()=>{
  const f=fixture({rows,rpcThrows:true}),body=form({expectedVersion:"1",reviewVersion:"2"});
  const result=await saveTask(f.client,org,caseId,"update",body);
  assert.equal(result.status,"error");assert.equal(result.values.expectedVersion,"2");assert.equal(result.values.instruction,body.get("instruction"));
  assert(!JSON.stringify(result).includes("private"));
  const retry=form(result.values);await saveTask(f.client,org,caseId,"update",retry);
  const writes=f.calls.filter(c=>c.url.pathname.endsWith("update_task_instruction"));
  assert.equal(writes[0].body?.p_request_id,writes[1].body?.p_request_id);
});
test("uncertain create with changed data exposes saved task instead of a second resource",async()=>{
  const f=fixture({rows,rpcError:{code:"22023",message:"ID tugas sudah digunakan untuk data berbeda."}});
  const result=await saveTask(f.client,org,caseId,"create",form());
  assert.equal(result.status,"conflict");assert.equal(result.savedId,resource);
});
test("task reads require authorized parent and case filter; pagination and errors are explicit",async()=>{
  const f=fixture({rows:{...rows,revision_tasks:Array.from({length:21},()=>task)}}),context=await organizationAccess(f.client,org);
  assert(context.status==="active");
  const page=await listTasks(f.client,context,caseId,2);assert.equal(page.items.length,20);assert.equal(page.hasNext,true);
  const read=f.calls.find(c=>c.url.pathname.endsWith("revision_tasks"))!;
  assert.equal(read.url.searchParams.get("case_id"),`eq.${caseId}`);assert.equal(read.url.searchParams.get("offset"),"20");
  assert.equal(await getTask(fixture({rows:{cases:[]}}).client,context,caseId,resource),null);
  await assert.rejects(listTasks(fixture({rows,queryError:"revision_tasks"}).client,context,caseId),/Data belum dapat dimuat/);
});
