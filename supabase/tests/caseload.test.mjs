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
  function formFromHtml(html,label){
    const form=document(html).querySelector(`form[aria-label="${label}"]`);
    assert(Boolean(form),"expected native business form is available");
    const body=new FormData();for(const input of form.querySelectorAll("input[name],textarea[name],select[name]"))if(!["checkbox","radio"].includes(input.type)||input.checked)body.append(input.name,input.value);
    return body;
  }
  async function nativeForm(path,label,jar){return formFromHtml((await request(path,jar)).html,label);}
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
    const emptyQueue=await request(`${base}/antrean`,a);
    assert([...document(emptyQueue.html).querySelectorAll("h1")].some(h=>h.textContent==="Antrean tindakan"),"F07 queue route renders for an active companion after the streaming shell");
    assert(emptyQueue.html.includes("Belum ada revisi aktif"),"F07 real empty state");
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
    assert.match(continued.response.headers.get("location")??"",/^https:\/\/api\.whatsapp\.com\/send\?phone=6281200000103&text=/,"native continuation validates and redirects without following external chat");
    const foreignDraft=await submit(draftPath,draftLabel,{continueChat:"",draftRequest:JSON.stringify({...draftPayload,selected:[randomUUID()]})},a,draftForm);
    assert(foreignDraft.html.includes("Pilihan revisi berubah"),"foreign task is not composed");
    assert.deepEqual(safe(await admin.from("revision_tasks").select("*").eq("case_id",caseId),"after draft readback"),beforeDraft,"compose does not change tasks");
    assert.equal(safe(await admin.from("audit_events").select("id").eq("case_id",caseId),"after draft audit").length,auditBefore);

    // F06: native status/date forms, receipts, partial changes and audit on the real local database.
    const statusPath=`${casePath}/revisi/${revisionId}/status`,statusLabel="Simpan status revisi";
    const statusSeed=await nativeForm(statusPath,statusLabel,a),staleStatus=await nativeForm(statusPath,statusLabel,a);
    const noConfirm=await submit(statusPath,statusLabel,{status:"completed",completion:""},a,statusSeed);
    assert(noConfirm.html.includes("Konfirmasikan pemeriksaan"));
    const beforeStatusAudit=safe(await admin.from("audit_events").select("id").eq("case_id",caseId),"status audit baseline").length;
    const completed=await submit(statusPath,statusLabel,{status:"completed",completion:"on",followUpOn:"2026-12-02"},a,statusSeed);
    assert.equal(destination(completed),casePath);
    const completedRow=safe(await admin.from("revision_tasks").select("*").eq("id",revisionId).single(),"completed readback");
    assert.equal(completedRow.status,"completed");assert.equal(completedRow.follow_up_on,"2026-12-02");assert.equal(completedRow.instruction,"Isian sesi kedua");
    assert.equal(destination(await submit(statusPath,statusLabel,{status:"completed",completion:"on",followUpOn:"2026-12-02"},a,statusSeed)),casePath,"lost response retry reaches status receipt");
    assert.equal(safe(await admin.from("audit_events").select("id").eq("case_id",caseId),"status audit after retry").length,beforeStatusAudit+1);
    assert((await request(casePath,a)).html.includes("Kasus tuntas."));
    const staleStatusReply=await submit(statusPath,statusLabel,{status:"needs_review",completion:"",followUpOn:""},a,staleStatus);
    assert(staleStatusReply.html.includes("Tinjau data terbaru")&&staleStatusReply.html.includes("Selesai"));
    const reviewButton=document(staleStatusReply.html).querySelector('button[name="reviewVersions"]');assert(reviewButton,"native explicit review button contains fresh versions");
    assert.equal(destination(await submit(statusPath,statusLabel,{status:"needs_review",completion:"",followUpOn:"",reviewVersions:reviewButton.value},a,staleStatus)),casePath,"native conflict review applies fresh versions");
    assert.equal(destination(await submit(statusPath,statusLabel,{status:"completed",completion:"on",followUpOn:""},a)),casePath);
    const dateOnly=await nativeForm(statusPath,statusLabel,a);
    assert.equal(destination(await submit(statusPath,statusLabel,{status:"completed",completion:"",followUpOn:"2026-12-03"},a,dateOnly)),casePath);
    assert.equal(destination(await submit(statusPath,statusLabel,{status:"needs_review",completion:"",followUpOn:"2026-12-03"},a)),casePath);
    assert.equal(destination(await submit(statusPath,statusLabel,{status:"completed",completion:"",followUpOn:"2026-12-03"},a,dateOnly)),casePath,"date-only completed receipt remains retryable after reopen");
    assert.equal(safe(await admin.from("revision_tasks").select("status").eq("id",revisionId).single(),"reopened after retry").status,"needs_review");
    assert(!(await request(statusPath,users.coordinator.jar)).html.includes(`aria-label="${statusLabel}"`));
    assert(!destination(await submit(statusPath,statusLabel,{status:"needs_review"},users.coordinator.jar,statusSeed)));
    assert(!(await request(`${siblingPath}/revisi/${revisionId}/status`,a)).html.includes(`aria-label="${statusLabel}"`));
    assert.equal(destination(await submit(statusPath,statusLabel,{status:"needs_sending",followUpOn:"",completion:""},a)),casePath);
    const deliveryPath=`${casePath}/pengiriman?pilih=${revisionId}`,deliveryLabel="Catat pengiriman revisi";
    const delivery=await nativeForm(deliveryPath,deliveryLabel,a);
    assert.equal(delivery.get("datePolicy"),"");
    assert.equal(destination(await submit(deliveryPath,deliveryLabel,{sent:"on",datePolicy:"same",followUpOn:"2026-12-05"},a,delivery)),casePath);
    assert.equal(destination(await submit(deliveryPath,deliveryLabel,{sent:"on",datePolicy:"same",followUpOn:"2026-12-05"},a,delivery)),casePath,"batch receipt survives eligibility change");
    assert.equal(safe(await admin.from("revision_tasks").select("status").eq("id",revisionId).single(),"sent readback").status,"awaiting_reply");
    assert((await request(casePath,a)).html.includes("Kasus belum tuntas."));
    const same=await nativeForm(statusPath,statusLabel,a);const noopBaseline=safe(await admin.from("audit_events").select("id").eq("case_id",caseId),"noop audit before").length;
    const noop=await submit(statusPath,statusLabel,{sent:"on"},a,same);assert.equal(destination(noop),casePath);
    assert.equal(safe(await admin.from("audit_events").select("id").eq("case_id",caseId),"noop audit after").length,noopBaseline);
    const historyHtml=(await request(casePath,a)).html;assert(historyHtml.includes("Riwayat perubahan")&&historyHtml.includes("Status revisi diubah"));
    const batchIds=[randomUUID(),randomUUID()];
    safe(await admin.from("revision_tasks").insert(batchIds.map((id,i)=>({id,case_id:caseId,instruction:`Batch F06 ${i}`}))),"batch status fixtures");
    const batchPath=`${casePath}/pengiriman?${batchIds.map(id=>`pilih=${id}`).join("&")}`;
    const manualPage=await request(`${casePath}/pengiriman`,a);assert.equal(document(manualPage.html).querySelector('#status-submit').hasAttribute("disabled"),false,"native manual selection has an available submit");
    const partial=await nativeForm(`${casePath}/pengiriman`,deliveryLabel,a);partial.delete("taskId");partial.append("taskId",batchIds[0]);
    assert.equal(destination(await submit(batchPath,deliveryLabel,{sent:"on",datePolicy:"none"},a,partial)),casePath);
    let batchRead=safe(await admin.from("revision_tasks").select("id,status").in("id",batchIds),"partial send readback");
    assert.equal(batchRead.find(t=>t.id===batchIds[0]).status,"awaiting_reply");assert.equal(batchRead.find(t=>t.id===batchIds[1]).status,"needs_sending");
    const batchSingle=`${casePath}/revisi/${batchIds[0]}/status`;
    assert.equal(destination(await submit(batchSingle,statusLabel,{status:"needs_sending",sent:"",followUpOn:""},a)),casePath);
    const batchStale=await nativeForm(batchPath,deliveryLabel,a);
    safe(await admin.from("revision_tasks").update({follow_up_on:"2026-12-10"}).eq("id",batchIds[1]),"concurrent batch date");
    const batchBefore=safe(await admin.from("revision_tasks").select("*").in("id",batchIds).order("id"),"batch before stale");
    const batchAuditBefore=safe(await admin.from("audit_events").select("id").eq("case_id",caseId),"batch audit before stale").length;
    assert((await submit(batchPath,deliveryLabel,{sent:"on",datePolicy:"none"},a,batchStale)).html.includes("Tinjau data terbaru"));
    assert.deepEqual(safe(await admin.from("revision_tasks").select("*").in("id",batchIds).order("id"),"batch after stale"),batchBefore,"stale batch rolls back every task");
    assert.equal(safe(await admin.from("audit_events").select("id").eq("case_id",caseId),"batch audit after stale").length,batchAuditBefore);
    assert.equal(destination(await submit(batchPath,deliveryLabel,{sent:"on",datePolicy:"same",followUpOn:"2026-12-12"},a)),casePath);
    assert.equal(destination(await submit(batchSingle,statusLabel,{status:"needs_review",sent:"",followUpOn:"2026-12-12"},a)),casePath);
    batchRead=safe(await admin.from("revision_tasks").select("id,status").in("id",batchIds),"partial reply readback");
    assert.equal(batchRead.find(t=>t.id===batchIds[0]).status,"needs_review");assert.equal(batchRead.find(t=>t.id===batchIds[1]).status,"awaiting_reply");
    assert(!(await request(draftPath,users.coordinator.jar)).html.includes(`aria-label="${draftLabel}"`));
    assert(!(await request(draftPath,users.b.jar)).html.includes(`aria-label="${draftLabel}"`));
    const rejectedDraft=await submit(draftPath,draftLabel,{draftRequest:JSON.stringify(draftPayload)},users.coordinator.jar,draftForm);
    assert(!rejectedDraft.html.includes("Draf sudah diperiksa"),"direct coordinator action rejected");
    const savedCaseForm=await nativeForm(`${casePath}/edit`,"Simpan kasus usaha",a);
    assert.equal(destination(await submit(`${casePath}/edit`,"Simpan kasus usaha",{reference:"REF-F03"},a,savedCaseForm)),casePath);
    assert((await request(casePath,a)).html.includes("REF-F03"));
    // F07: real PostgREST embedded OR, literal search, global pages and read-only access.
    const queueContact=randomUUID(),queueForeignContact=randomUUID(),queueCase=randomUUID(),queueSibling=randomUUID(),queueHidden=randomUUID(),queueForeign=randomUUID();
    const specialName='F07 Usaha [100%_*] (A), "B" \\';
    safe(await admin.from("business_contacts").insert([{id:queueContact,organization_id:orgA,owner_id:users.a.id,business_name:specialName,whatsapp_number:"6281200000881"},{id:queueForeignContact,organization_id:orgB,owner_id:users.b.id,business_name:"F07 TENANT SECRET",whatsapp_number:"6281200000882"}]),"F07 contacts");
    safe(await admin.from("cases").insert([{id:queueCase,organization_id:orgA,contact_id:queueContact,assignee_id:users.a.id,official_reference:"F07-REF-A"},{id:queueSibling,organization_id:orgA,contact_id:queueContact,assignee_id:users.a.id,official_reference:"F07-SIBLING"},{id:queueHidden,organization_id:orgA,contact_id:queueContact,assignee_id:users.next.id,official_reference:"F07-ASSIGNEE-SECRET"},{id:queueForeign,organization_id:orgB,contact_id:queueForeignContact,assignee_id:users.b.id,official_reference:"F07-TENANT-SECRET"}]),"F07 cases");
    const today=new Intl.DateTimeFormat("sv-SE",{timeZone:"Asia/Jakarta"}).format(new Date());
    safe(await admin.from("revision_tasks").insert([
      {case_id:queueCase,instruction:"F07 due past",status:"awaiting_reply",follow_up_on:"2000-01-01"},{case_id:queueCase,instruction:"F07 due today",status:"awaiting_reply",follow_up_on:today},
      {case_id:queueCase,instruction:"F07 review",status:"needs_review"},{case_id:queueCase,instruction:"F07 send",status:"needs_sending"},
      {case_id:queueCase,instruction:"F07 future",status:"awaiting_reply",follow_up_on:"2099-01-01"},{case_id:queueCase,instruction:"F07 null date",status:"awaiting_reply"},
      {case_id:queueCase,instruction:"F07 completed",status:"completed"},...Array.from({length:21},(_,i)=>({case_id:queueCase,instruction:`F07 page ${String(i).padStart(2,"0")}`})),
      {case_id:queueSibling,instruction:"F07 sibling"},{case_id:queueHidden,instruction:"F07 ASSIGNEE SECRET"},{case_id:queueForeign,instruction:"F07 TENANT SECRET"},
    ].map(row=>({status:"needs_sending",follow_up_on:null,...row}))),"F07 tasks");
    const queuePath=`${base}/antrean`,queueRows=html=>[...document(html).querySelectorAll(".queue-task")],queueText=html=>queueRows(html).map(row=>row.textContent).join(" ");
    const queueBefore=safe(await admin.from("revision_tasks").select("id,status,follow_up_on,version").eq("case_id",queueCase).order("id"),"F07 tasks before");
    const queueAuditBefore=safe(await admin.from("audit_events").select("id").eq("case_id",queueCase),"F07 audit before").length;
    let queuePage=await request(`${queuePath}?q=F07-REF-A`,a);
    assert.equal(queueRows(queuePage.html).length,20,"F07 global first page is bounded");
    assert(queueText(queuePage.html).includes("F07 due past")&&queueText(queuePage.html).includes("F07 review"),"F07 includes due then review");
    assert(!queueText(queuePage.html).includes("F07 completed"),"F07 completed hidden by default");
    const groupTitles=[...document(queuePage.html).querySelectorAll('h2[id^="queue-"]')].map(h=>h.id);
    assert.deepEqual(groupTitles,["queue-contact_today","queue-needs_review","queue-needs_sending"]);
    const nextQueue=document(queuePage.html).querySelector('[aria-label="Halaman antrean"] a');assert(Boolean(nextQueue),"F07 next page exists");
    assert.equal(new URL(nextQueue.href,origin).searchParams.get("q"),"F07-REF-A");
    const queueSecond=await request(nextQueue.getAttribute("href"),a);assert.equal(queueRows(queueSecond.html).length,7);assert(queueText(queueSecond.html).includes("F07 future")&&queueText(queueSecond.html).includes("F07 null date"));
    assert.equal(queueRows((await request(`${queuePath}?q=F07-REF-A&page=10000`,a)).html).length,7,"F07 high page clamps to last");
    queuePage=await request(`${queuePath}?q=${encodeURIComponent("f07 usaha")}&status=completed`,a);assert.equal(queueRows(queuePage.html).length,1,"F07 case-insensitive contact search OR reference");assert(queueText(queuePage.html).includes("F07 completed"));
    for(const literal of ['[100%_*] (A), "B" \\','%_*']){
      const found=await request(`${queuePath}?q=${encodeURIComponent(literal)}&status=completed`,a);assert.equal(queueRows(found.html).length,1,"F07 punctuation searches literally");
    }
    const emptyInjection=await request(`${queuePath}?q=${encodeURIComponent('missing),status.eq.completed,(')}`,a);assert.equal(queueRows(emptyInjection.html).length,0,"F07 special query cannot inject a filter");assert(emptyInjection.html.includes("Tidak ada revisi yang cocok"));
    assert.equal(queueRows((await request(`${queuePath}?q=F07-REF-A&status=awaiting_reply`,a)).html).length,4,"F07 waiting filter includes due and future/null dates");
    assert.equal(queueRows((await request(`${queuePath}?q=F07-REF-A&status=contact_today`,a)).html).length,2,"F07 due filter uses local today");
    const ownQueue=await request(`${queuePath}?q=F07&assignee_id=${users.next.id}`,a);assert(!queueText(ownQueue.html).includes("ASSIGNEE SECRET")&&!queueText(ownQueue.html).includes("TENANT SECRET"),"F07 forged assignee cannot widen reads");
    const coordinatorQueue=await request(`${queuePath}?q=F07-ASSIGNEE`,users.coordinator.jar);assert(queueText(coordinatorQueue.html).includes("F07 ASSIGNEE SECRET"));assert([...document(coordinatorQueue.html).querySelectorAll('.queue-task .button')].every(link=>link.textContent==="Lihat kasus"));
    assert.equal(queueRows((await request(`${queuePath}?q=F07`,users.b.jar)).html).length,0,"F07 other LP3H denied");
    assert.equal(destination(await request(queuePath)),"/staf/login","F07 anonymous denied");
    const picker=await request(`${base}/kasus?pilih=revisi`,a);assert(document(picker.html).querySelector(`.record-list a[href$="/revisi/baru"]`),"F07 add revision chooses a case");
    assert.deepEqual(safe(await admin.from("revision_tasks").select("id,status,follow_up_on,version").eq("case_id",queueCase).order("id"),"F07 tasks after"),queueBefore,"F07 reads never mutate tasks");
    assert.equal(safe(await admin.from("audit_events").select("id").eq("case_id",queueCase),"F07 audit after").length,queueAuditBefore,"F07 reads add no audit");
    assert(!(await request(`${base}/kontak`,users.b.jar)).html.includes("Nama terbaru F03"),"other tenant sees no contact");
    assert(!(await request(`${base}/kontak/baru`,users.coordinator.jar)).html.includes('aria-label="Simpan kontak usaha"'),"coordinator has no mutation form");
    const forged=await submit(`${contactPath}/edit`,"Simpan kontak usaha",{businessName:"FORGED",ownerId:users.coordinator.id},users.coordinator.jar,concurrent);
    assert(!destination(forged),"direct coordinator POST is denied");
    assert.equal(safe(await admin.from("business_contacts").select("business_name").eq("id",contactId).single(),"coordinator rejection readback").business_name,"Nama terbaru F03");
    const crossForm=await nativeForm(`${otherBase}/kontak/baru`,"Simpan kontak usaha",users.b.jar);
    const otherOrgPost=await submit(`${otherBase}/kontak/baru`,"Simpan kontak usaha",{businessName:"CROSS-TENANT",phone:"081200000998"},a,crossForm);
    assert(!destination(otherOrgPost),"cross-tenant direct mutation is denied");
    assert.equal(safe(await admin.from("business_contacts").select("id").eq("id",crossForm.get("resourceId")),"cross tenant write rejection").length,0);
    const oldForm=await nativeForm(`${casePath}/edit`,"Simpan kasus usaha",a);
    const coordinator=users.coordinator.jar, transferPath=`${casePath}/alih`, transferLabel="Alihkan penanggung jawab";
    const filteredCases=await request(`${base}/kasus?pendamping=${users.next.id}`,coordinator);
    assert.equal(document(filteredCases.html).querySelector('select[name="pendamping"]')?.value,users.next.id);
    assert(!filteredCases.html.includes("REF-F03")&&filteredCases.html.includes("F07-ASSIGNEE-SECRET"),"F08 coordinator filters by current assignee");
    assert(!(await request(transferPath,a)).html.includes(`aria-label="${transferLabel}"`),"F08 transfer form is coordinator-only");
    const transferPage=await request(transferPath,coordinator);
    const recipientOptions=[...document(transferPage.html).querySelectorAll('select[name="recipient"] option')].map(option=>option.value).filter(Boolean);
    assert.deepEqual(recipientOptions,[users.next.id],"F08 only offers another active companion in this organization");
    const transferSeed=formFromHtml(transferPage.html,transferLabel);
    const attempt=(values,jar=coordinator,prepared=new FormData())=>{
      if(!prepared.has("seed")) for(const [key,value] of transferSeed)prepared.append(key,value);
      return submit(transferPath,transferLabel,values,jar,prepared);
    };
    assert((await attempt({recipient:users.next.id})).html.includes("Centang konfirmasi"));
    for(const recipient of [users.b.id,users.a.id,users.coordinator.id]){
      assert((await attempt({recipient,confirm:"on"})).html.includes("Pilih pendamping aktif yang berbeda"));
    }
    assert(!destination(await attempt({recipient:users.next.id,confirm:"on"},a)),"F08 direct companion transfer is rejected");
    safe(await admin.from("memberships").update({is_active:false}).eq("organization_id",orgA).eq("user_id",users.next.id),"deactivate transfer candidate");
    assert((await attempt({recipient:users.next.id,confirm:"on"})).html.includes("Pilih pendamping aktif yang berbeda"));
    safe(await admin.from("memberships").update({is_active:true}).eq("organization_id",orgA).eq("user_id",users.next.id),"restore transfer candidate");
    safe(await admin.from("cases").update({official_reference:"REF-F03"}).eq("id",caseId),"concurrent case version");
    const staleTransfer=await attempt({recipient:users.next.id,confirm:"on"});
    assert(staleTransfer.html.includes("Penanggung jawab terbaru"));
    const reviewed=()=>formFromHtml(staleTransfer.html,transferLabel);
    const reviewedVersion=document(staleTransfer.html).querySelector('button[name="reviewVersion"]')?.value;
    assert.equal(reviewedVersion,"3");
    assert(!destination(await attempt({recipient:users.next.id,confirm:"on"},coordinator,reviewed())),"F08 conflict requires review");
    assert.equal(destination(await attempt({reviewVersion:reviewedVersion},coordinator,reviewed())),casePath,"F08 reviewed transfer succeeds");
    assert.equal(destination(await attempt({reviewVersion:reviewedVersion},coordinator,reviewed())),casePath,"F08 retry returns existing receipt");
    const transferAudit=safe(await admin.from("audit_events").select("actor_id,before,after").eq("case_id",caseId).eq("event_type","case_transferred"),"F08 audit");
    assert.equal(transferAudit.length,1);
    assert.equal(transferAudit[0].actor_id,users.coordinator.id);
    assert.equal(transferAudit[0].before.assignee_id,users.a.id);
    assert.equal(transferAudit[0].after.assignee_id,users.next.id);
    const transferDetail=await request(`${casePath}?hasil=dialihkan`,coordinator);
    assert(transferDetail.html.includes("Pengalihan kasus tercatat")&&transferDetail.html.includes("Pendamping dialihkan"));
    assert(!(await request(casePath,a)).html.includes("REF-F03"),"old assignee loses transferred case");
    assert.equal(queueRows((await request(`${queuePath}?q=REF-F03`,a)).html).length,0,"F07 old assignee loses transferred revisions");
    assert(queueRows((await request(`${queuePath}?q=REF-F03`,users.next.jar)).html).length>0,"F07 receiving assignee sees transferred revisions");
    assert(!(await submit(draftPath,draftLabel,{continueChat:"",draftRequest:JSON.stringify(draftPayload)},a,draftForm)).html.includes("Draf sudah diperiksa"),"stale draft action denied after transfer");
    assert(!destination(await submit(revisionEdit,revisionLabel,{instruction:"OLD ASSIGNEE"},a,oldRevisionForm)),"old assignee task mutation denied");
    assert(!destination(await submit(revisionEdit,revisionLabel,{},a,revisionUpdate)),"old task receipt cannot recover transferred access");
    assert.equal(destination(await submit(revisionEdit,revisionLabel,{instruction:"Penerima pindahan"},users.next.jar)),casePath,"new assignee may edit task despite not owning contact");
    const nextRevisionForm=await nativeForm(revisionEdit,revisionLabel,users.next.jar);
    safe(await admin.from("memberships").update({is_active:false}).eq("organization_id",orgA).eq("user_id",users.next.id),"revoke task assignee");
    assert.equal(destination(await request(queuePath,users.next.jar)),"/staf/akses-terbatas","F07 revoked membership cannot read queue");
    assert.equal(destination(await submit(revisionEdit,revisionLabel,{},users.next.jar,nextRevisionForm)),"/staf/akses-terbatas","revoked assignee cannot mutate task");
    safe(await admin.from("memberships").update({is_active:true}).eq("organization_id",orgA).eq("user_id",users.next.id),"restore local task assignee");
    safe(await admin.from("revision_tasks").insert(Array.from({length:21},(_,i)=>({case_id:caseId,instruction:`Revisi halaman ${i}`}))),"task pagination fixtures");
    const revisionPageTwo=await request(`${casePath}?page=2`,users.next.jar);
    assert((await request(draftPath,users.next.jar)).html.includes("Revisi halaman 20"),"draft context includes tasks beyond first twenty");
    assert.equal(document(revisionPageTwo.html).querySelectorAll('[aria-label="Daftar revisi"] > li').length,4,"all tasks reachable beyond first page");
    assert(document((await request(`${casePath}?history=2`,users.next.jar)).html).querySelectorAll('.status-history > li').length>0,"audit pagination has a second page");
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
