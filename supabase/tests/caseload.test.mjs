import assert from "node:assert/strict";
import {test} from "node:test";
import {spawn} from "node:child_process";
import {once} from "node:events";
import {randomUUID} from "node:crypto";
import {createClient} from "@supabase/supabase-js";
import {JSDOM} from "jsdom";
import {assertLocalEndpoints} from "../../scripts/database.mjs";
import {assertPortAvailable,waitForOwnedServer} from "./auth-harness.mjs";

assertLocalEndpoints({API_URL:process.env.SUPABASE_TEST_URL,DB_URL:"postgresql://127.0.0.1/local-test"});
const origin="http://127.0.0.1:3150";
const safe=(response,operation)=>{assert(!response.error,`${operation} succeeded (private response suppressed)`);return response.data;};
const document=html=>new JSDOM(html).window.document;
function destination(result){
  const location=result.response.headers.get("location")??document(result.html).querySelector('meta[http-equiv="refresh"]')?.getAttribute("content")?.split("url=")[1];
  return location?new URL(location,origin).pathname:null;
}

test("F03 native forms and real local sessions enforce CRUD, retry, conflict, tenants and transfer",{timeout:240000},async()=>{
  await assertPortAvailable(3150);
  const server=spawn(process.execPath,["node_modules/next/dist/bin/next","dev","--hostname","127.0.0.1","--port","3150"],{
    env:{...process.env,SIHALAL_AUTH_TEST:"1",APP_URL:origin,NEXT_PUBLIC_SUPABASE_URL:process.env.SUPABASE_TEST_URL,NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:process.env.SUPABASE_TEST_PUBLISHABLE_KEY},stdio:["ignore","pipe","pipe"],
  });
  const ended=once(server,"exit");server.stderr.resume();
  async function request(path,jar=new Map(),init={}){
    assert(server.exitCode===null,"owned Next child is alive");
    const response=await fetch(new URL(path,origin),{...init,redirect:"manual",signal:AbortSignal.timeout(20000),headers:{...init.headers,origin,cookie:[...jar].map(([k,v])=>`${k}=${v}`).join(";")}});
    for(const value of response.headers.getSetCookie()){
      const pair=value.split(";")[0],split=pair.indexOf("="),name=pair.slice(0,split),content=pair.slice(split+1);
      if(content)jar.set(name,content);else jar.delete(name);
    }
    return {response,html:await response.text()};
  }
  async function nativeForm(path,label,jar){
    const page=await request(path,jar),form=document(page.html).querySelector(`form[aria-label="${label}"]`);
    assert(Boolean(form),"expected native business form is available");
    const body=new FormData();for(const input of form.querySelectorAll("input[name],textarea[name]"))if(!["checkbox","radio"].includes(input.type)||input.checked)body.append(input.name,input.value);
    return body;
  }
  async function submit(path,label,values,jar,prepared){
    const body=prepared??await nativeForm(path,label,jar);
    for(const [key,value]of Object.entries(values))body.set(key,value);
    return request(path,jar,{method:"POST",body});
  }
  const admin=createClient(process.env.SUPABASE_TEST_URL,process.env.SUPABASE_TEST_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
  try{
    await waitForOwnedServer(server);
    const tag=randomUUID(),orgA=randomUUID(),orgB=randomUUID(),users={};
    safe(await admin.from("organizations").insert([{id:orgA,name:`LP3H A F03 ${tag}`},{id:orgB,name:`LP3H B F03 ${tag}`}]),"local organizations");
    for(const label of ["a","next","coordinator","b"]){
      const email=`f03-${label}-${tag}@example.test`;
      const user=safe(await admin.auth.admin.createUser({email,email_confirm:true}),"local Auth fixture").user;
      safe(await admin.from("memberships").insert({organization_id:label==="b"?orgB:orgA,user_id:user.id,role:label==="coordinator"?"coordinator":"companion"}),"local membership");
      const link=safe(await admin.auth.admin.generateLink({type:"magiclink",email}),"local token");
      const jar=new Map();await request(`/auth/confirm?token_hash=${link.properties.hashed_token}&type=email`,jar);
      users[label]={id:user.id,jar};
    }
    const base=`/staf/lembaga/${orgA}`,otherBase=`/staf/lembaga/${orgB}`,a=users.a.jar;
    assert.equal(destination(await request(`${base}/kontak`)),"/staf/login");
    const initialPage=await request(`${base}/kontak`,a);
    assert.equal(initialPage.response.status,200,"contacts route exists for active staff");
    assert(initialPage.html.includes("Belum ada kontak"),"real empty list is shown");
    const created=await submit(`${base}/kontak/baru`,"Simpan kontak usaha",{businessName:"Usaha Pertama F03",phone:"0812 0000 0101",greeting:"Bu"},a);
    const contactPath=destination(created);
    assert(Boolean(contactPath?.startsWith(`${base}/kontak/`)),"contact save redirects to confirmed record");
    const contactId=contactPath.split("/").at(-1);
    const stored=safe(await admin.from("business_contacts").select("*").eq("id",contactId).single(),"stored contact");
    assert.equal(stored.whatsapp_number,"6281200000101");assert.equal(stored.owner_id,users.a.id);
    const invalid=await submit(`${base}/kontak/baru`,"Simpan kontak usaha",{businessName:"Isian bertahan",phone:"bad-number"},a);
    assert.equal(document(invalid.html).querySelector('[name="businessName"]').value,"Isian bertahan","native failed POST retains values");
    const duplicate=await submit(`${base}/kontak/baru`,"Simpan kontak usaha",{businessName:"Usaha Kedua F03",phone:"081200000101"},a);
    assert(duplicate.html.includes("Ini usaha berbeda"),"own duplicate requires explicit confirmation");
    const dupeForm=new FormData();for(const input of document(duplicate.html).querySelectorAll('form[aria-label="Simpan kontak usaha"] input[name]'))if(input.type!=="checkbox")dupeForm.append(input.name,input.value);
    const confirmed=await submit(`${base}/kontak/baru`,"Simpan kontak usaha",{confirmDuplicate:"on"},a,dupeForm);
    assert(Boolean(destination(confirmed)),"confirmed duplicate is saved");
    const editing=await nativeForm(`${contactPath}/edit`,"Simpan kontak usaha",a);
    const concurrent=await nativeForm(`${contactPath}/edit`,"Simpan kontak usaha",a);
    const edited=await submit(`${contactPath}/edit`,"Simpan kontak usaha",{businessName:"Nama terbaru F03",phone:"081200000103"},a,editing);
    assert.equal(destination(edited),contactPath);
    const retry=await submit(`${contactPath}/edit`,"Simpan kontak usaha",{},a,editing);
    assert.equal(destination(retry),contactPath,"same native intent retry returns saved result");
    assert.equal(safe(await admin.from("business_contacts").select("version").eq("id",contactId).single(),"retry version").version,2,"retry does not mutate twice");
    const conflict=await submit(`${contactPath}/edit`,"Simpan kontak usaha",{businessName:"Edit sesi kedua"},a,concurrent);
    assert(conflict.html.includes("Data terbaru")&&conflict.html.includes("Nama terbaru F03"),"stale version shows current snapshot");
    assert.equal(document(conflict.html).querySelector('[name="businessName"]').value,"Edit sesi kedua");
    const noSelection=await request(`${base}/kasus/baru`,a);
    assert(noSelection.html.includes("Pilih kontak"),"new case requires explicit contact selection");
    const casePath=destination(await submit(`${base}/kasus/baru?kontak=${contactId}`,"Simpan kasus usaha",{reference:""},a));
    assert(Boolean(casePath?.startsWith(`${base}/kasus/`)),"case created with optional reference");
    const caseId=casePath.split("/").at(-1);
    const siblingPath=destination(await submit(`${base}/kasus/baru?kontak=${contactId}`,"Simpan kasus usaha",{reference:"SAUDARA-TERSEMBUNYI"},a));
    assert(siblingPath&&siblingPath!==casePath,"contact reused for another case");
    const detail=await request(casePath,a);assert(detail.html.includes("Belum ada revisi"),"case without tasks is not falsely completed");
    // F04: native form round trips against real Auth/RLS/RPC, without email.
    const revisionNew=`${casePath}/revisi/baru`,revisionLabel="Simpan tugas revisi";
    const revisionCreate=await nativeForm(revisionNew,revisionLabel,a);
    const revisionId=revisionCreate.get("resourceId"),revisionEdit=`${casePath}/revisi/${revisionId}/edit`;
    assert.equal(destination(await submit(revisionNew,revisionLabel,{instruction:"  Perbaiki foto label\nA & B <jelas>  ",status:"completed"},a,revisionCreate)),casePath);
    let revision=safe(await admin.from("revision_tasks").select("*").eq("id",revisionId).single(),"created revision");
    assert.equal(revision.status,"needs_sending");assert.equal(revision.follow_up_on,null);assert.equal(revision.instruction,"Perbaiki foto label\nA & B <jelas>");
    assert.equal(destination(await submit(revisionNew,revisionLabel,{},a,revisionCreate)),casePath,"create retry confirmed without duplication");
    assert.equal(safe(await admin.from("revision_tasks").select("id").eq("case_id",caseId),"one revision after retry").length,1);
    const longInstruction="x".repeat(2001);
    const invalidRevision=await submit(revisionNew,revisionLabel,{instruction:longInstruction},a);
    assert.equal(document(invalidRevision.html).querySelector('[name="instruction"]').value,longInstruction,"overlong native input retained without truncation");
    const blankRevision=await submit(revisionNew,revisionLabel,{instruction:"\t\n\uFEFF"},a);assert(blankRevision.html.includes("2.000 karakter"));
    const revisionUpdate=await nativeForm(revisionEdit,revisionLabel,a),staleRevision=await nativeForm(revisionEdit,revisionLabel,a);
    assert.equal(destination(await submit(revisionEdit,revisionLabel,{instruction:"Instruksi terbaru"},a,revisionUpdate)),casePath);
    safe(await admin.from("revision_tasks").update({status:"awaiting_reply",follow_up_on:"2026-12-01"}).eq("id",revisionId),"later status fixture");
    assert.equal(destination(await submit(revisionEdit,revisionLabel,{},a,revisionUpdate)),casePath,"old committed update retry reaches receipt after later status change");
    revision=safe(await admin.from("revision_tasks").select("*").eq("id",revisionId).single(),"update retry readback");
    assert.equal(revision.version,3);assert.equal(revision.status,"awaiting_reply");assert.equal(revision.follow_up_on,"2026-12-01");
    const revisionConflict=await submit(revisionEdit,revisionLabel,{instruction:"Isian sesi kedua"},a,staleRevision);
    assert(revisionConflict.html.includes("Instruksi terbaru")&&revisionConflict.html.includes("Menunggu balasan"));
    assert.equal(document(revisionConflict.html).querySelector('[name="instruction"]').value,"Isian sesi kedua");
    staleRevision.set("reviewVersion","3");
    assert.equal(destination(await submit(revisionEdit,revisionLabel,{},a,staleRevision)),casePath,"explicit conflict review applies instruction only");
    revision=safe(await admin.from("revision_tasks").select("*").eq("id",revisionId).single(),"reviewed instruction");
    assert.equal(revision.instruction,"Isian sesi kedua");assert.equal(revision.status,"awaiting_reply");assert.equal(revision.follow_up_on,"2026-12-01");
    const revisionDetail=await request(casePath,a);assert(revisionDetail.html.includes("Isian sesi kedua"),"fresh reload reads persisted instruction");
    assert(!(await request(`${siblingPath}/revisi/${revisionId}/edit`,a)).html.includes(`aria-label="${revisionLabel}"`),"task cannot be edited through another parent");
    assert(!(await request(revisionEdit,users.b.jar)).html.includes("Isian sesi kedua"),"other tenant cannot read task");
    assert((await request(casePath,users.coordinator.jar)).html.includes("Isian sesi kedua"),"coordinator can read task");
    assert(!(await request(revisionEdit,users.coordinator.jar)).html.includes(`aria-label="${revisionLabel}"`),"coordinator has no edit form");
    assert(!destination(await submit(revisionEdit,revisionLabel,{instruction:"FORGED"},users.coordinator.jar,revisionUpdate)),"direct coordinator mutation denied");
    const oldRevisionForm=await nativeForm(revisionEdit,revisionLabel,a);
    const draftPath=`${casePath}/pesan`,draftLabel="Periksa draf WhatsApp";
    const draftForm=await nativeForm(draftPath,draftLabel,a);
    const draftPayload={intent:"compose",userId:users.a.id,selected:[revisionId],versions:{[revisionId]:revision.version},caseVersion:1,contactVersion:2,message:"Pesan F05"};
    const beforeDraft=safe(await admin.from("revision_tasks").select("*").eq("case_id",caseId),"before draft readback");
    const auditBefore=safe(await admin.from("audit_events").select("id").eq("case_id",caseId),"before draft audit").length;
    const preparedDraft=await submit(draftPath,draftLabel,{draftRequest:JSON.stringify(draftPayload)},a,draftForm);
    assert(preparedDraft.html.includes("Draf sudah diperiksa"),"native read-only draft action succeeds");
    const continued=await submit(draftPath,draftLabel,{draftRequest:JSON.stringify({...draftPayload,intent:"open"}),continueChat:"1"},a,draftForm);
    assert.match(continued.response.headers.get("location")??"",/^https:\/\/wa\.me\/6281200000103\?text=/,"native continuation validates and redirects without following external chat");
    const foreignDraft=await submit(draftPath,draftLabel,{continueChat:"",draftRequest:JSON.stringify({...draftPayload,selected:[randomUUID()]})},a,draftForm);
    assert(foreignDraft.html.includes("Pilihan revisi berubah"),"foreign task is not composed");
    assert.deepEqual(safe(await admin.from("revision_tasks").select("*").eq("case_id",caseId),"after draft readback"),beforeDraft,"compose does not change tasks");
    assert.equal(safe(await admin.from("audit_events").select("id").eq("case_id",caseId),"after draft audit").length,auditBefore);
    assert(!(await request(draftPath,users.coordinator.jar)).html.includes(`aria-label="${draftLabel}"`));
    assert(!(await request(draftPath,users.b.jar)).html.includes(`aria-label="${draftLabel}"`));
    const rejectedDraft=await submit(draftPath,draftLabel,{draftRequest:JSON.stringify(draftPayload)},users.coordinator.jar,draftForm);
    assert(!rejectedDraft.html.includes("Draf sudah diperiksa"),"direct coordinator action rejected");
    const savedCaseForm=await nativeForm(`${casePath}/edit`,"Simpan kasus usaha",a);
    assert.equal(destination(await submit(`${casePath}/edit`,"Simpan kasus usaha",{reference:"REF-F03"},a,savedCaseForm)),casePath);
    assert((await request(casePath,a)).html.includes("REF-F03"));
    assert(!(await request(`${base}/kontak`,users.b.jar)).html.includes("Nama terbaru F03"),"other tenant sees no contact");
    assert(!(await request(`${base}/kontak/baru`,users.coordinator.jar)).html.includes('aria-label="Simpan kontak usaha"'),"coordinator has no mutation form");
    const forged=await submit(`${contactPath}/edit`,"Simpan kontak usaha",{businessName:"FORGED",ownerId:users.coordinator.id},users.coordinator.jar,concurrent);
    assert(!destination(forged),"direct coordinator POST is denied");
    assert.equal(safe(await admin.from("business_contacts").select("business_name").eq("id",contactId).single(),"coordinator rejection readback").business_name,"Nama terbaru F03");
    const crossForm=await nativeForm(`${otherBase}/kontak/baru`,"Simpan kontak usaha",users.b.jar);
    const otherOrgPost=await submit(`${otherBase}/kontak/baru`,"Simpan kontak usaha",{businessName:"CROSS-TENANT",phone:"081200000998"},a,crossForm);
    assert(!destination(otherOrgPost),"cross-tenant direct mutation is denied");
    assert.equal(safe(await admin.from("business_contacts").select("id").eq("id",crossForm.get("resourceId")),"cross tenant write rejection").length,0);
    const writeClient=createClient(process.env.SUPABASE_TEST_URL,process.env.SUPABASE_TEST_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
    const key=[...users.coordinator.jar.keys()].find(key=>/^sb-.*-auth-token(?:\.0)?$/.test(key)).replace(/\.0$/,"");
    const encoded=users.coordinator.jar.get(key)??[...users.coordinator.jar].filter(([name])=>name.startsWith(`${key}.`)).sort(([a],[b])=>a.localeCompare(b)).map(([,v])=>v).join("");
    const session=JSON.parse(Buffer.from(encoded.replace(/^base64-/,""),"base64url").toString());
    safe(await writeClient.auth.setSession(session),"coordinator local session");
    const oldForm=await nativeForm(`${casePath}/edit`,"Simpan kasus usaha",a);
    safe(await writeClient.rpc("transfer_case",{p_id:caseId,p_expected_version:2,p_assignee_id:users.next.id,p_request_id:randomUUID()}),"local fixture transfer");
    assert(!(await request(casePath,a)).html.includes("REF-F03"),"old assignee loses transferred case");
    assert(!(await submit(draftPath,draftLabel,{continueChat:"",draftRequest:JSON.stringify(draftPayload)},a,draftForm)).html.includes("Draf sudah diperiksa"),"stale draft action denied after transfer");
    assert(!destination(await submit(revisionEdit,revisionLabel,{instruction:"OLD ASSIGNEE"},a,oldRevisionForm)),"old assignee task mutation denied");
    assert(!destination(await submit(revisionEdit,revisionLabel,{},a,revisionUpdate)),"old task receipt cannot recover transferred access");
    assert.equal(destination(await submit(revisionEdit,revisionLabel,{instruction:"Penerima pindahan"},users.next.jar)),casePath,"new assignee may edit task despite not owning contact");
    const nextRevisionForm=await nativeForm(revisionEdit,revisionLabel,users.next.jar);
    safe(await admin.from("memberships").update({is_active:false}).eq("organization_id",orgA).eq("user_id",users.next.id),"revoke task assignee");
    assert.equal(destination(await submit(revisionEdit,revisionLabel,{},users.next.jar,nextRevisionForm)),"/staf/akses-terbatas","revoked assignee cannot mutate task");
    safe(await admin.from("memberships").update({is_active:true}).eq("organization_id",orgA).eq("user_id",users.next.id),"restore local task assignee");
    safe(await admin.from("revision_tasks").insert(Array.from({length:21},(_,i)=>({case_id:caseId,instruction:`Revisi halaman ${i}`}))),"task pagination fixtures");
    const revisionPageTwo=await request(`${casePath}?page=2`,users.next.jar);
    assert((await request(draftPath,users.next.jar)).html.includes("Revisi halaman 20"),"draft context includes tasks beyond first twenty");
    assert.equal(document(revisionPageTwo.html).querySelectorAll('[aria-label="Daftar revisi"] > li').length,2,"all tasks reachable beyond first page");
    const nextDetail=await request(contactPath,users.next.jar);
    assert(nextDetail.html.includes("Nama terbaru F03")&&!nextDetail.html.includes("SAUDARA-TERSEMBUNYI"),"new assignee sees contact and only transferred case");
    assert(!(await request(`${contactPath}/edit`,users.next.jar)).html.includes('aria-label="Simpan kontak usaha"'),"transferred contact cannot be edited by assignee");
    assert(!(await request(`${base}/kasus/baru?kontak=${contactId}`,users.next.jar)).html.includes('aria-label="Simpan kasus usaha"'),"transferred contact cannot create another case");
    assert.equal(destination(await submit(`${casePath}/edit`,"Simpan kasus usaha",{reference:"REF-NEXT"},users.next.jar)),casePath,"new assignee can update the transferred case reference");
    assert(!destination(await submit(`${casePath}/edit`,"Simpan kasus usaha",{reference:"OLD-ASSIGNEE"},a,oldForm)),"stale assignee direct POST denied");
    assert(!destination(await submit(`${casePath}/edit`,"Simpan kasus usaha",{},a,savedCaseForm)),"old successful receipt cannot recover transferred access");
    assert.equal(safe(await admin.from("cases").select("official_reference").eq("id",caseId).single(),"transferred case unchanged by old actor").official_reference,"REF-NEXT");
    const pageContacts=Array.from({length:21},(_,i)=>({id:randomUUID(),organization_id:orgA,owner_id:users.a.id,business_name:`Pagination ${i}`,whatsapp_number:`628120000${String(i).padStart(4,"0")}`}));
    safe(await admin.from("business_contacts").insert(pageContacts),"local pagination contacts");
    const pageTwo=await request(`${base}/kasus/baru?page=2`,a);
    const choice=document(pageTwo.html).querySelector(`a[href*="/kasus/baru?kontak="]`);
    assert(choice,"own contact picker exposes second page");
    assert((await request(choice.getAttribute("href"),a)).html.includes('aria-label="Simpan kasus usaha"'),"later-page contact is selectable");
    const revokeForm=await nativeForm(`${base}/kontak/baru`,"Simpan kontak usaha",a);
    safe(await admin.from("memberships").update({is_active:false}).eq("organization_id",orgA).eq("user_id",users.a.id),"revoke local membership");
    const revoked=await submit(`${base}/kontak/baru`,"Simpan kontak usaha",{businessName:"REVOKED",phone:"081200000999"},a,revokeForm);
    assert.equal(destination(revoked),"/staf/akses-terbatas","revoked membership redirects during the native response render");
    const rejected=safe(await admin.from("business_contacts").select("id").eq("id",revokeForm.get("resourceId")),"denied write inspection");
    assert.equal(rejected.length,0,"revoked membership never writes a contact");
    assert.equal(destination(await submit(`${contactPath}/edit`,"Simpan kontak usaha",{},a,editing)),"/staf/akses-terbatas","old successful receipt remains denied after membership revocation");
    assert.equal(destination(await request(`${base}/kontak`,a)),"/staf/akses-terbatas");
  }finally{if(server.exitCode===null)server.kill();await ended;}
});
