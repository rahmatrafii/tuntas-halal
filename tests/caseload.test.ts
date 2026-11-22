import assert from "node:assert/strict";
import {test} from "node:test";
import {fixture, org, otherOrg, actor, contact} from "./caseload-fixture";
import {organizationAccess} from "../src/features/caseload/access";
import {listContacts, getContact} from "../src/features/caseload/queries";
import {saveContact, saveCase} from "../src/features/caseload/mutations";
import {resource,seed} from "./caseload-fixture";

function form(extra:Record<string,string>={}) {
  const body=new FormData();
  for(const [key,value] of Object.entries({resourceId:resource,intentSeed:seed,businessName:"  Usaha Baru  ",phone:"0812 0000 0102",greeting:" Ibu ",...extra}))body.set(key,value);
  return body;
}

test("organization context is explicit and derived only from verified active membership", async () => {
  const f=fixture();
  const context=await organizationAccess(f.client,org);
  assert.deepEqual(context,{status:"active",userId:actor,organizationId:org,name:"LP3H Fiktif",role:"companion",timezone:"Asia/Jakarta"});
  assert.equal((await organizationAccess(f.client,otherOrg)).status,"forbidden");
  assert.equal((await organizationAccess(f.client,"bad-id")).status,"forbidden");
  assert.equal((await organizationAccess(fixture({active:false}).client,org)).status,"restricted");
  assert.equal((await organizationAccess(fixture({authError:true}).client,org)).status,"unavailable");
});

test("contact validation and tenant/role checks reject malformed or unprivileged writes", async()=>{
  for(const extra of [{businessName:"\t\n"},{phone:"invalid"},{resourceId:"bad"},{businessName:"x".repeat(161)}] as Record<string,string>[]) {
    const f=fixture(); assert.equal((await saveContact(f.client,org,"create",form(extra))).status,"invalid");
    assert(!f.calls.some(call=>call.url.pathname.includes("/rpc/")));
  }
  const coordinator=fixture({role:"coordinator"});
  assert.equal((await saveContact(coordinator.client,org,"create",form())).status,"forbidden");
  assert.equal((await saveContact(fixture().client,otherOrg,"create",form())).status,"forbidden");
});

test("same intent retries use the same request/resource and changed input changes only the request",async()=>{
  const f=fixture();
  assert.equal((await saveContact(f.client,org,"create",form({ownerId:"forged"}))).status,"saved");
  await saveContact(f.client,org,"create",form());
  await saveContact(f.client,org,"create",form({businessName:"Usaha Diperbarui"}));
  const writes=f.calls.filter(call=>call.url.pathname.endsWith("create_contact")).map(call=>call.body!);
  assert.equal(writes.length,3);
  assert.equal(writes[0].p_request_id,writes[1].p_request_id);
  assert.notEqual(writes[0].p_request_id,writes[2].p_request_id);
  assert(writes.every(payload=>payload.p_id===resource&&!('ownerId' in payload)));
  assert.equal(writes[0].p_whatsapp_number,"6281200000102");
  assert.equal(writes[0].p_business_name,"Usaha Baru");
});

test("duplicate contacts require explicit confirmation and queries stay within the verified owner",async()=>{
  const existing={...contact,id:"dddddddd-dddd-4ddd-8ddd-dddddddddddd"};
  const f=fixture({rows:{business_contacts:[existing]}});
  const duplicate=await saveContact(f.client,org,"create",form());
  assert.equal(duplicate.status,"duplicate");
  assert.equal(duplicate.values.businessName,"  Usaha Baru  ");
  const lookup=f.calls.find(call=>call.url.searchParams.has("whatsapp_number"))!;
  assert.equal(lookup.url.searchParams.get("owner_id"),`eq.${actor}`);
  assert.equal(lookup.url.searchParams.get("organization_id"),`eq.${org}`);
  assert.equal((await saveContact(f.client,org,"create",form({confirmDuplicate:"on",confirmedPhone:"6281200000102"}))).status,"saved");
  assert.equal((await saveContact(f.client,org,"create",form({confirmDuplicate:"on",confirmedPhone:"6281200000999"}))).status,"duplicate");
});

test("contact update checks ownership and expected version and conflict preserves entered data",async()=>{
  const f=fixture({rows:{business_contacts:[contact]},rpcError:{code:"PT409",message:"private SQL text"}});
  assert.equal((await saveContact(f.client,org,"update",form({expectedVersion:"bad"}))).status,"invalid");
  const result=await saveContact(f.client,org,"update",form({expectedVersion:"1",businessName:"Edit saya"}));
  assert.equal(result.status,"conflict");
  assert.equal(result.values.businessName,"Edit saya");
  assert.equal(result.latest?.values.businessName,"Usaha Fiktif");
  assert.equal(result.latest?.version,2);
  assert(!JSON.stringify(result).includes("private SQL"));
  const foreign=fixture({rows:{business_contacts:[{...contact,owner_id:"other-user"}]}});
  assert.equal((await saveContact(foreign.client,org,"update",form({expectedVersion:"2"}))).status,"forbidden");
});

test("uncertain creates with an existing different payload show saved data without another write",async()=>{
  const f=fixture({rows:{business_contacts:[contact]}});
  const result=await saveContact(f.client,org,"create",form());
  assert.equal(result.status,"conflict");
  assert.equal(result.savedId,resource);
  assert.equal(result.values.phone,"0812 0000 0102");
  assert(!f.calls.some(call=>call.url.pathname.includes("/rpc/")));
});

test("RPC and network failures preserve bounded inputs and do not expose provider diagnostics",async()=>{
  for(const options of [{rpcThrows:true},{rpcError:{code:"42501",message:"private SQL"}},{rpcError:{code:"22023",message:"private SQL"}}]) {
    const result=await saveContact(fixture(options).client,org,"create",form());
    assert.notEqual(result.status,"saved");
    assert.equal(result.values.phone,"0812 0000 0102");
    assert.equal(result.resourceId,resource);
    assert(!JSON.stringify(result).includes("private"));
  }
});

test("a committed create retry reaches its receipt even when another confirmed duplicate now exists",async()=>{
  const f=fixture({rows:{business_contacts:[contact,{...contact,id:"dddddddd-dddd-4ddd-8ddd-dddddddddddd"}]}});
  const result=await saveContact(f.client,org,"create",form({businessName:"Usaha Fiktif",phone:"081200000101"}));
  assert.equal(result.status,"saved");
});

test("case creation accepts only own contacts and normalizes the optional reference",async()=>{
  const f=fixture({rows:{business_contacts:[contact]}});
  const input=form({resourceId:"eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee",contactId:resource,reference:" \t ",ownerId:"forged"});
  assert.equal((await saveCase(f.client,org,"create",input)).status,"saved");
  const write=f.calls.find(call=>call.url.pathname.endsWith("create_case"))!;
  assert.equal(write.body?.p_official_reference,null);
  assert.equal(write.body?.p_contact_id,resource);
  const foreign=fixture({rows:{business_contacts:[{...contact,owner_id:"other-user"}]}});
  assert.equal((await saveCase(foreign.client,org,"create",input)).status,"forbidden");
});

test("case version conflicts retain the user's reference and return only an accessible latest snapshot",async()=>{
  const item={id:resource,organization_id:org,contact_id:resource,assignee_id:actor,official_reference:"TERBARU",version:2,created_at:contact.created_at,business_contacts:contact};
  const f=fixture({rows:{cases:[item]},rpcError:{code:"PT409",message:"private SQL"}});
  const result=await saveCase(f.client,org,"update",form({reference:"ISIAN-SAYA",expectedVersion:"1"}));
  assert.equal(result.status,"conflict");assert.equal(result.values.reference,"ISIAN-SAYA");assert.equal(result.latest?.values.reference,"TERBARU");
  const revoked={active:true,rows:{cases:[item]},rpcError:{code:"PT409",message:"private SQL"},onRpc:()=>{revoked.active=false;}};
  const denied=await saveCase(fixture(revoked).client,org,"update",form({reference:"ISIAN-SAYA",expectedVersion:"1"}));
  assert.equal(denied.status,"forbidden");assert.equal(denied.latest,undefined);
});

test("query failures remain service failures rather than empty contact lists",async()=>{
  const f=fixture({queryError:"business_contacts"}),context=await organizationAccess(f.client,org);
  assert(context.status==="active");
  await assert.rejects(listContacts(f.client,context),/Data belum dapat dimuat/);
});

test("native reviewed update failures return the reviewed version for identical retry",async()=>{
  const f=fixture({rows:{business_contacts:[contact]},rpcThrows:true});
  const result=await saveContact(f.client,org,"update",form({expectedVersion:"1",reviewVersion:"2"}));
  assert.equal(result.status,"error");assert.equal(result.values.expectedVersion,"2");
  await saveContact(f.client,org,"update",form(result.values));
  const requests=f.calls.filter(call=>call.url.pathname.endsWith("update_contact"));
  assert.equal(requests[0].body?.p_request_id,requests[1].body?.p_request_id);
});

test("contact reads are scoped to selected organization and related cases are independently scoped", async () => {
  const f=fixture({rows:{business_contacts:[contact],cases:[]}});
  const context=await organizationAccess(f.client,org);
  assert(context.status==="active");
  const page=await listContacts(f.client,context,1,true);
  assert.equal(page.items[0].business_name,"Usaha Fiktif");
  await getContact(f.client,context,contact.id);
  const reads=f.calls.filter(call=>call.url.pathname.endsWith("business_contacts"));
  assert(reads.length>=2);
  assert(reads.every(call=>call.url.searchParams.get("organization_id")===`eq.${org}`));
  assert.equal(reads[0].url.searchParams.get("owner_id"),`eq.${actor}`);
});
