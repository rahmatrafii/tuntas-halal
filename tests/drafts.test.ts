import assert from "node:assert/strict";
import {test} from "node:test";
import {fixture,org,otherOrg,seed,contact} from "./caseload-fixture";
import {caseId,taskId,caseRow,taskRow,draftRequest} from "./draft-fixture";
import {loadDraftContext,prepareDraft} from "../src/features/drafts/service";
import {whatsappChatUrl} from "../src/lib/domain/whatsapp";
const rows={cases:[caseRow],business_contacts:[contact],revision_tasks:[taskRow]};
test("export keeps text at exactly 8000 encoded URL characters and falls back above that limit",async()=>{
  const prefixLength=whatsappChatUrl(contact.whatsapp_number,"x")!.length-1;
  for(const length of [8000,8001]){
    const message="x".repeat(length-prefixLength),f=fixture({rows});
    assert.equal(whatsappChatUrl(contact.whatsapp_number,message)!.length,length);
    const reply=await prepareDraft(f.client,org,caseId,{...draftRequest,message});
    assert.equal(reply.status,"ready");assert.equal(reply.longUrl,length>8000);
    const url=new URL(reply.url!);
    assert.equal(url.searchParams.get("text"),length===8000?message:null);
    if(length>8000)assert.equal(reply.url,"https://wa.me/6281200000101");
    assert(!f.calls.some(c=>c.body));assert.equal(taskRow.status,"needs_sending");
  }
});
test("draft context requires active assigned companion and scoped reads without mutation",async()=>{
  const f=fixture({rows}),reply=await loadDraftContext(f.client,org,caseId);
  assert.equal(reply.status,"ready");assert.equal(reply.context?.phone,"6281200000101");assert.equal(reply.context?.tasks.length,1);
  const query=f.calls.find(c=>c.url.pathname.endsWith("revision_tasks"))!;
  assert.equal(query.url.searchParams.get("case_id"),`eq.${caseId}`);
  assert(!f.calls.some(c=>c.body||c.url.pathname.includes("/rpc/")));
  for(const [f,id] of [[fixture({rows,role:"coordinator"}),org],[fixture({rows,active:false}),org],[fixture({rows}),otherOrg],[fixture({rows:{...rows,cases:[{...caseRow,assignee_id:seed}]}}),org]] as const)
    assert.equal((await loadDraftContext(f.client,id,caseId)).status,"forbidden");
});
test("draft export rejects foreign completed duplicate IDs and unsafe requests",async()=>{
  for(const extra of [{selected:[seed]},{selected:[taskId,taskId]},{selected:[]},{message:" "},{message:"x".repeat(64001)},{intent:"unknown"},{versions:{[taskId]:"1"}}]){
    const reply=await prepareDraft(fixture({rows}).client,org,caseId,{...draftRequest,...extra});
    assert.notEqual(reply.status,"ready");assert.equal(reply.url,undefined);
  }
  assert.notEqual((await prepareDraft(fixture({rows:{...rows,revision_tasks:[{...taskRow,status:"completed"}]}}).client,org,caseId,draftRequest)).status,"ready");
});
test("export uses current server recipient and encodes characters without business writes",async()=>{
  const f=fixture({rows}),reply=await prepareDraft(f.client,org,caseId,{...draftRequest,phone:"6281999999999"});
  assert.equal(reply.status,"ready");assert.equal(new URL(reply.url!).searchParams.get("phone"),"6281200000101");
  assert.equal(new URL(reply.url!).searchParams.get("text"),draftRequest.message);
  assert(!f.calls.some(c=>c.body));
});
test("changed instruction contact or case requires review and preserves client message",async()=>{
  for(const extra of [{versions:{[taskId]:2}},{contactVersion:1},{caseVersion:2}]){
    const reply=await prepareDraft(fixture({rows}).client,org,caseId,{...draftRequest,...extra});
    assert.equal(reply.status,"changed");assert.equal(reply.url,undefined);assert(reply.context);
  }
});
test("compose validates every task and long URL or invalid phone keeps copy available",async()=>{
  const f=fixture({rows});const reply=await prepareDraft(f.client,org,caseId,{...draftRequest,intent:"compose"});
  assert.match(reply.message!,/1\. Perbaiki foto label/);
  const long=await prepareDraft(f.client,org,caseId,{...draftRequest,message:"😀".repeat(1000)});
  assert.equal(long.status,"ready");assert.equal(long.longUrl,true);assert.equal(long.url,"https://wa.me/6281200000101");
  const invalid={...rows,business_contacts:[{...contact,whatsapp_number:"bad"}]};
  assert.equal((await prepareDraft(fixture({rows:invalid}).client,org,caseId,{...draftRequest,intent:"open"})).status,"invalid");
  assert.equal((await prepareDraft(fixture({rows:invalid}).client,org,caseId,{...draftRequest,intent:"copy"})).status,"ready");
  assert.equal((await prepareDraft(f.client,org,caseId,{...draftRequest,message:"\uD800"})).status,"invalid");
});
test("provider failures are retryable rather than an empty accessible draft",async()=>{
  assert.equal((await loadDraftContext(fixture({rows,queryError:"revision_tasks"}).client,org,caseId)).status,"error");
});
test("draft reads every database page rather than silently truncating at a range limit",async()=>{
  const tasks=Array.from({length:101},(_,i)=>({...taskRow,id:`90000000-0000-4000-8000-${String(i).padStart(12,"0")}`}));
  const f=fixture({paginate:true,rows:{...rows,revision_tasks:tasks}});
  const reply=await loadDraftContext(f.client,org,caseId);
  assert.equal(reply.context?.tasks.length,101);
  assert.equal(f.calls.filter(c=>c.url.pathname.endsWith("revision_tasks")).length,2);
  assert.equal(reply.context?.tasks.at(-1)?.id,"90000000-0000-4000-8000-000000000100");
});
