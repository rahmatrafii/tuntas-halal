import assert from "node:assert/strict";
import {test} from "node:test";
import {saveTransfer} from "../src/features/caseload/transfer";
import {fixture, org, otherOrg, actor, seed} from "./caseload-fixture";
import {caseId, caseRow} from "./draft-fixture";

const recipient = "99999999-9999-4999-8999-999999999999";
function body(values: Record<string, string> = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    recipient, seed, version: "1", confirm: "on", ...values,
  })) data.set(key, value);
  return data;
}
const state = {status: "idle" as const, recipient: "", seed, version: 1, confirmed: false};
const coordinator = {role: "coordinator" as const, rows: {cases: [caseRow]}};

test("transfer requires confirmation and a valid recipient before calling the RPC", async () => {
  const f = fixture(coordinator);
  for (const data of [body({confirm:""}), body({recipient:"bad"}), body({version:"1e1"})]) {
    assert.equal((await saveTransfer(f.client,org,caseId,state,data)).status,"invalid");
  }
  assert.equal(f.calls.filter(call => call.body).length,0);
});

test("transfer requires a coordinator and a case in the selected organization", async () => {
  for (const options of [{...coordinator,role:"companion" as const}, {...coordinator,active:false}, {...coordinator,rows:{cases:[{...caseRow,organization_id:otherOrg}]}}]) {
    const f = fixture(options);
    assert.equal((await saveTransfer(f.client,org,caseId,state,body())).status,"forbidden");
    assert.equal(f.calls.filter(call => call.body).length,0);
  }
});

test("transfer lets the RPC recover the same intent after the case has moved", async () => {
  const f = fixture({...coordinator,rows:{cases:[{...caseRow,assignee_id:recipient,version:2}]},rpcData:{id:caseId,version:2}});
  for(let attempt=0;attempt<2;attempt++) assert.equal((await saveTransfer(f.client,org,caseId,state,body())).status,"saved");
  const calls=f.calls.filter(call=>call.url.pathname.endsWith("/transfer_case"));
  assert.equal(calls.length,2);
  assert.deepEqual(calls[0].body,calls[1].body);
  assert.equal(calls[0].body?.p_expected_version,1);
  assert.equal(calls[0].body?.p_assignee_id,recipient);
});

test("transfer conflict shows current assignee and requires an explicit review to use the new version", async () => {
  const f = fixture({...coordinator,rows:{cases:[{...caseRow,assignee_id:actor,version:2}]},rpcError:{code:"PT409",message:"private diagnostic"}});
  const conflict=await saveTransfer(f.client,org,caseId,state,body());
  assert.equal(conflict.status,"conflict");
  assert.deepEqual(conflict.latest,{assignee:actor,version:2});
  assert.equal(conflict.recipient,recipient);
  const success=fixture({...coordinator,rpcData:{id:caseId,version:3}});
  assert.equal((await saveTransfer(success.client,org,caseId,conflict,body())).status,"conflict");
  assert.equal((await saveTransfer(success.client,org,caseId,conflict,body({reviewVersion:"2"}))).status,"saved");
  assert.equal(success.calls.find(call=>call.body)?.body?.p_expected_version,2);
});

test("ineligible recipients and transport errors retain the proposed recipient without leaking diagnostics", async () => {
  for(const [f,expected] of [[fixture({...coordinator,rpcError:{code:"22023",message:"private diagnostic"}}),"invalid"],[fixture({...coordinator,rpcThrows:true}),"error"]] as const) {
    const result=await saveTransfer(f.client,org,caseId,state,body());
    assert.equal(result.status,expected);
    assert.equal(result.recipient,recipient);
    assert.equal(result.confirmed,true);
    assert(!JSON.stringify(result).includes("private diagnostic"));
  }
});
