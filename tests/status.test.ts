import assert from "node:assert/strict";
import {test} from "node:test";
import {fixture,org,seed,actor,otherOrg} from "./caseload-fixture";
import {caseId,caseRow,taskId,taskRow} from "./draft-fixture";
import {saveStatus} from "../src/features/status/service";
import {allTasks,caseProgress,listHistory} from "../src/features/status/queries";
const rows={cases:[caseRow],revision_tasks:[taskRow]};
function form(extra:Record<string,string|undefined>={}){const f=new FormData();for(const [k,v] of Object.entries({seed,status:"awaiting_reply",followUpOn:"2026-11-22",datePolicy:"same",sent:"on",completion:"",versions:JSON.stringify({[taskId]:1}),...extra}))if(v!==undefined)f.set(k,v);f.append("taskId",taskId);return f;}
const success={case_id:caseId,versions:{[taskId]:2}};
test("status writes use scoped RPC only and retry payload retains identity despite current status",async()=>{
  const f=fixture({rows,rpcData:success});const first=await saveStatus(f.client,org,caseId,"send",form());assert.equal(first.status,"saved");
  const retry=fixture({rows:{...rows,revision_tasks:[{...taskRow,status:"awaiting_reply",version:2}]},rpcData:success});assert.equal((await saveStatus(retry.client,org,caseId,"send",form())).status,"saved");
  const a=f.calls.find(c=>c.body)!,b=retry.calls.find(c=>c.body)!;assert.deepEqual(a.body,b.body);assert(a.url.pathname.endsWith("set_task_statuses"));assert.equal(a.body?.p_status,"awaiting_reply");assert(!("p_instruction" in a.body!));
});
test("status rejects missing confirmations invalid dates malformed selections and forged access",async()=>{
  for(const extra of [{sent:""},{datePolicy:""},{followUpOn:"2026-02-30"},{versions:"{}"},{seed:"bad"},{status:"completed"}]){const f=fixture({rows});assert.equal((await saveStatus(f.client,org,caseId,"send",form(extra))).status,"invalid");assert(!f.calls.some(c=>c.body));}
  const d=form();d.append("taskId",taskId);assert.equal((await saveStatus(fixture({rows}).client,org,caseId,"send",d)).status,"invalid");
  for(const f of [fixture({rows,role:"coordinator"}),fixture({rows,active:false}),fixture({rows:{...rows,cases:[{...caseRow,assignee_id:seed}]}})])assert.equal((await saveStatus(f.client,org,caseId,"single",form())).status,"forbidden");
  assert.equal((await saveStatus(fixture({rows}).client,otherOrg,caseId,"single",form())).status,"forbidden");
});
test("single status allows partial reply and explicit completion, clears calendar date and no-op avoids RPC",async()=>{
  const f=fixture({rows,rpcData:success});assert.equal((await saveStatus(f.client,org,caseId,"single",form({status:"needs_review",sent:"",followUpOn:""}))).status,"saved");assert.equal(f.calls.find(c=>c.body)?.body?.p_follow_up_on,null);
  assert.equal((await saveStatus(fixture({rows}).client,org,caseId,"single",form({status:"completed",completion:""}))).status,"invalid");
  assert.equal((await saveStatus(fixture({rows,rpcData:success}).client,org,caseId,"single",form({status:"completed",completion:"on"}))).status,"saved");
  const noop=fixture({rows});assert.equal((await saveStatus(noop.client,org,caseId,"single",form({status:"needs_sending",followUpOn:""}))).status,"unchanged");assert(!noop.calls.some(c=>c.body));
});
test("status conflict returns accessible latest without exposing provider errors and preserves intent",async()=>{
  const r=await saveStatus(fixture({rows,rpcError:{code:"PT409",message:"secret"}}).client,org,caseId,"single",form());assert.equal(r.status,"conflict");assert.equal(r.seed,seed);assert.equal(r.latest?.[0].id,taskId);assert.equal(r.values.followUpOn,"2026-11-22");assert(!JSON.stringify(r).includes("secret"));
  assert.equal((await saveStatus(fixture({rows,rpcThrows:true}).client,org,caseId,"single",form())).status,"error");
});
test("native explicit conflict review applies posted latest versions with a new intent",async()=>{
 const f=fixture({rows:{...rows,revision_tasks:[{...taskRow,version:2}]},rpcData:success});
 const body=form({status:"needs_review",reviewVersions:JSON.stringify({[taskId]:2})});
 assert.equal((await saveStatus(f.client,org,caseId,"single",body)).status,"saved");
 assert.deepEqual(f.calls.find(c=>c.body)?.body?.p_expected_versions,{[taskId]:2});
});
test("completion date-only receipt retry still reaches RPC after another session reopens task",async()=>{
 const f=fixture({rows:{...rows,revision_tasks:[{...taskRow,status:"needs_review",version:3}]},rpcData:success});
 assert.equal((await saveStatus(f.client,org,caseId,"single",form({status:"completed",completion:"",versions:JSON.stringify({[taskId]:1})}))).status,"saved");
 assert(f.calls.some(c=>c.body));
});
test("task pagination, progress and history query stay scoped and failures never become empty history",async()=>{
 const context={status:"active" as const,organizationId:org,userId:actor,name:"LP3H",timezone:"Asia/Jakarta",role:"companion" as const};
 const tasks=Array.from({length:101},(_,i)=>({...taskRow,id:`90000000-0000-4000-8000-${String(i).padStart(12,"0")}`,status:i===100?"completed":"needs_sending"}));
 const f=fixture({paginate:true,rows:{...rows,revision_tasks:tasks,audit_events:[]}});assert.equal((await allTasks(f.client,context,caseId)).length,101);assert.deepEqual(caseProgress(tasks as typeof taskRow[]),{completed:1,total:101,complete:false});assert.equal(caseProgress([]).complete,false);
 await listHistory(f.client,context,caseId,1);const q=f.calls.find(c=>c.url.pathname.endsWith("audit_events"))!;assert.equal(q.url.searchParams.get("case_id"),`eq.${caseId}`);
 await assert.rejects(listHistory(fixture({rows,queryError:"audit_events"}).client,context,caseId,1));
});
test("batch caps input and rejects foreign selections before any business write",async()=>{
 const f=fixture({rows});const tooMany=form();tooMany.delete("taskId");for(let i=0;i<101;i++)tooMany.append("taskId",`90000000-0000-4000-8000-${String(i).padStart(12,"0")}`);
 assert.equal((await saveStatus(f.client,org,caseId,"send",tooMany)).status,"invalid");assert(!f.calls.some(c=>c.body));
 const foreign=form({versions:JSON.stringify({[seed]:1})});foreign.set("taskId",seed);
 assert.equal((await saveStatus(f.client,org,caseId,"single",foreign)).status,"forbidden");assert(!f.calls.some(c=>c.body));
 const revoked={rows,rpcError:{code:"PT409",message:"private"},active:true,onRpc:()=>{revoked.active=false;}};
 assert.equal((await saveStatus(fixture(revoked).client,org,caseId,"single",form())).status,"forbidden");
});
