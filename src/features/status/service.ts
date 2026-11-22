import {isUuid,organizationAccess,type UserClient} from "../caseload/access";
import {getCase} from "../caseload/queries";
import {requestId} from "../caseload/mutations";
import {isCalendarDate,revisionStatuses,type RevisionStatus} from "../../lib/domain/revisions";
import {allTasks} from "./queries";
import type {StatusMode,StatusState} from "./types";
const unavailable="Belum dapat menyimpan status. Isian tetap tersedia; coba lagi.";
export async function saveStatus(client:UserClient,org:string,caseId:string,mode:StatusMode,form:FormData):Promise<StatusState>{
 const values:Record<string,string>={},errors:Record<string,string>={};
 for(const key of ["seed","status","followUpOn","datePolicy","sent","completion","versions","reviewVersions"]){const v=form.get(key);values[key]=typeof v==="string"?v:"";if(form.getAll(key).length>1||(v!==null&&typeof v!=="string")||values[key].length>(key==="versions"?900000:20000))errors.form="Permintaan tidak valid.";}
 const selected=form.getAll("taskId").map(v=>typeof v==="string"?v:"");
 let versions:Record<string,number>={};try{const v=JSON.parse(values.versions);if(v&&typeof v==="object"&&!Array.isArray(v))versions=v;else errors.form="Versi tidak valid.";}catch{errors.form="Versi tidak valid.";}
 if(form.has("reviewVersions")){try{const reviewed=JSON.parse(values.reviewVersions);if(!reviewed||typeof reviewed!=="object"||Array.isArray(reviewed))throw Error();versions={...versions,...reviewed};}catch{errors.form="Versi peninjauan tidak valid.";}}
 const state:StatusState={status:"idle",seed:values.seed,selected,versions,values,errors};
 const fail=(status:StatusState["status"],message:string):StatusState=>({...state,status,message});
 try{
 const access=await organizationAccess(client,org);if(access.status==="unavailable")return fail("error",unavailable);
 if(access.status!=="active"||access.role!=="companion")return fail("forbidden","Anda tidak memiliki akses untuk mengubah status.");
 const parent=await getCase(client,access,caseId);if(!parent||parent.assignee_id!==access.userId)return fail("forbidden","Kasus tidak tersedia untuk diubah.");
 if(!isUuid(state.seed)||!selected.length||selected.length>100||!selected.every(isUuid)||new Set(selected).size!==selected.length||(mode==="single"&&selected.length!==1))errors.form="Pilih 1–100 revisi yang sah tanpa pilihan ganda.";
 if(!selected.every(id=>Number.isSafeInteger(versions[id])&&versions[id]>0&&versions[id]<=2147483647))errors.form="Versi revisi tidak valid.";
 if(!revisionStatuses.includes(values.status as RevisionStatus)||(mode==="send"&&values.status!=="awaiting_reply"))errors.status="Pilih status yang valid.";
 if(values.status==="awaiting_reply"&&values.sent!=="on")errors.sent="Konfirmasikan revisi yang sudah dikirim.";
 if(mode==="send"&&!["none","same"].includes(values.datePolicy))errors.datePolicy="Pilih aturan tanggal tindak lanjut.";
 const date=mode==="send"&&values.datePolicy==="none"?null:values.followUpOn||null;
 if((mode==="send"&&values.datePolicy==="same"&&!date)||(date!==null&&!isCalendarDate(date)))errors.followUpOn="Isi tanggal kalender yang valid.";
 if(Object.keys(errors).length)return fail("invalid","Periksa isian berikut.");
 const tasks=await allTasks(client,access,caseId),byId=new Map(tasks.map(t=>[t.id,t]));
 if(selected.some(id=>!byId.has(id)))return fail("forbidden","Revisi pilihan tidak tersedia.");
 const current=selected.map(id=>byId.get(id)!);
 if(values.status==="completed"&&current.some(t=>t.version===versions[t.id]&&t.status!=="completed")&&values.completion!=="on"){errors.completion="Konfirmasikan pemeriksaan koreksi dan pembaruan resmi.";return fail("invalid","Periksa isian berikut.");}
 // Retry must reach the receipt even if a previous successful write changed the current status/version.
 if(mode==="send"&&current.some(t=>t.version===versions[t.id]&&t.status!=="needs_sending")){errors.form="Konfirmasi pengiriman hanya untuk revisi Perlu dikirim.";return fail("invalid","Tinjau pilihan revisi.");}
 if(current.every(t=>t.version===versions[t.id]&&t.status===values.status&&t.follow_up_on===date))return fail("unchanged","Tidak ada perubahan status atau tanggal.");
 const ids=[...selected].sort(),expected=Object.fromEntries(ids.map(id=>[id,versions[id]]));
 // The generated RPC type omits nullable arguments; PostgREST accepts null to clear the date.
 const args={p_case_id:caseId,p_task_ids:ids,p_expected_versions:expected,p_status:values.status as RevisionStatus,p_follow_up_on:date as string,p_completion_confirmed:values.completion==="on"};
 const reply=await client.rpc("set_task_statuses",{...args,p_request_id:requestId(state.seed,"set_task_statuses",args)});
 if(reply.error){
 if(reply.error.code==="42501")return fail("forbidden","Akses Anda berubah. Buka kembali kasus.");
 if(reply.error.code==="PT409"){
 const check=await organizationAccess(client,org);if(check.status!=="active"||check.role!=="companion")return fail("forbidden","Akses Anda berubah.");
 const p=await getCase(client,check,caseId);if(!p||p.assignee_id!==check.userId)return fail("forbidden","Akses Anda berubah.");
 const latest=(await allTasks(client,check,caseId)).filter(t=>selected.includes(t.id));
 if(latest.length!==selected.length)return fail("forbidden","Pilihan tidak lagi tersedia.");
 return {...state,status:"conflict",latest,message:"Data berubah di sesi lain. Periksa data terbaru, lalu pilih untuk menerapkan isian Anda."};}
 return fail("error",unavailable);}
 const output=reply.data as {case_id?:string;versions?:Record<string,number>}|null;
 if(output?.case_id!==caseId||!output.versions||ids.some(id=>!Number.isSafeInteger(output.versions![id])))return fail("error",unavailable);
 return fail("saved","Status revisi tersimpan.");
 }catch{return fail("error",unavailable);}
}
