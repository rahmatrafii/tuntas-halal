import assert from "node:assert/strict";
import {test} from "node:test";
import {queueInput,listQueue} from "../src/features/queue/queries";
import {context,queueFixture,queueRow} from "./queue-fixture";
import {actor,org} from "./caseload-fixture";
const now=new Date("2026-11-22T18:00:00Z");

test("queue normalizes untrusted URL values and bounds literal search",()=>{
 assert.deepEqual(queueInput({q:"  Nama usaha ",status:"completed",page:"2",owner:"forged"}),{q:"Nama usaha",status:"completed",page:2});
 const bad=queueInput({q:["a","b"],status:"forged",page:"-1"});assert.equal(bad.q,"");assert.equal(bad.status,"all");assert.equal(bad.page,1);
 const long=queueInput({q:"a".repeat(161)});assert.equal(long.q.length,160);assert(long.notice);
});
test("queue scopes every count/read, uses LP3H date and keeps the four groups ordered",async()=>{
 const f=queueFixture([queueRow("send","needs_sending"),queueRow("future","awaiting_reply","2026-11-24"),queueRow("review","needs_review"),queueRow("today","awaiting_reply","2026-11-23"),queueRow("past","awaiting_reply","2026-11-20"),queueRow("null","awaiting_reply"),queueRow("done","completed")]);
 const result=await listQueue(f.client,context,{},now);
 assert.equal(result.today,"2026-11-23");assert.equal(result.total,6);
 assert.deepEqual(result.items.map(r=>r.id),["past","today","review","send","future","null"]);
 assert(f.calls.every(c=>c.url.searchParams.get("cases.organization_id")===`eq.${org}`&&c.url.searchParams.get("cases.assignee_id")===`eq.${actor}`));
 assert(f.calls.every(c=>["GET","HEAD"].includes(c.method)&&!c.url.searchParams.get("select")?.includes("whatsapp_number")));
});
test("waiting filter includes due rows while completed is explicitly opt-in",async()=>{
 const f=queueFixture([queueRow("today","awaiting_reply","2026-11-23"),queueRow("later","awaiting_reply"),queueRow("done","completed")]);
 assert.deepEqual((await listQueue(f.client,context,{status:"awaiting_reply"},now)).items.map(r=>r.id),["today","later"]);
 assert.deepEqual((await listQueue(f.client,context,{status:"completed"},now)).items.map(r=>r.id),["done"]);
});
test("queue pagination crosses group boundaries and clamps oversized pages without loading all tasks",async()=>{
 const f=queueFixture([...Array.from({length:18},(_,i)=>queueRow(`a${String(i).padStart(2,"0")}`,"needs_review")),...Array.from({length:1005},(_,i)=>queueRow(`b${String(i).padStart(4,"0")}`,"needs_sending"))]);
 const first=await listQueue(f.client,context,{},now);assert.equal(first.items.length,20);assert.equal(first.items[18].id,"b0000");assert(first.hasNext);assert.equal(first.total,1023);
 const second=await listQueue(f.client,context,{page:"2"},now);assert.equal(second.items[0].id,"b0002");
 const last=await listQueue(f.client,context,{page:"10000"},now);assert.equal(last.page,52);assert.equal(last.items.length,3);assert.equal(last.hasNext,false);
 assert(f.calls.filter(c=>c.method==="GET").every(c=>Number(c.url.searchParams.get("limit"))<=20));
});
test("search is a quoted literal OR across name/reference, with no role broadening",async()=>{
 const f=queueFixture([]),q='A.* %_(x),"\\';
 await listQueue(f.client,context,{q,assignee_id:"forged"},now);
 for(const {url} of f.calls){
  const pattern=url.searchParams.get("cases.name_match.business_name")!;
  assert(pattern.startsWith("imatch."));const regex=new RegExp(pattern.slice(7),"i");assert(regex.test(q));assert.equal(regex.test("Anything x"),false);
  assert.equal(url.searchParams.get("cases.or"),`(official_reference.imatch.${JSON.stringify(pattern.slice(7))},name_match.not.is.null)`);
  assert.equal(url.searchParams.get("cases.assignee_id"),`eq.${actor}`);
 }
 const coordinator=queueFixture([]);await listQueue(coordinator.client,{...context,role:"coordinator"},{},now);
 assert(coordinator.calls.every(c=>!c.url.searchParams.has("cases.assignee_id")&&c.url.searchParams.get("cases.organization_id")===`eq.${org}`));
});
test("queue service failures stay errors and zero is a real empty result",async()=>{
 await assert.rejects(listQueue(queueFixture([],true).client,context,{},now),/Data belum dapat dimuat/);
 const f=queueFixture([]),result=await listQueue(f.client,context,{},now);assert.equal(result.total,0);assert.deepEqual(result.items,[]);assert.equal(result.page,1);
});
