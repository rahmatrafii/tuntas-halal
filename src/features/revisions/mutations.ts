import {isUuid,organizationAccess,type UserClient} from "../caseload/access";
import {requestId,type RecordFormState} from "../caseload/mutations";
import {getCase} from "../caseload/queries";
import {getTask,type RevisionTask} from "./queries";

const denied="Data tidak tersedia atau Anda tidak memiliki akses untuk menyimpannya.";
const unavailable="Belum dapat menyimpan. Isian tetap tersedia; silakan coba lagi.";
function snapshot(state:RecordFormState,task:RevisionTask,created=false):RecordFormState{
  return {...state,status:"conflict",message:created?"Penyimpanan sebelumnya sudah tercatat. Tinjau tugas tersimpan sebelum melanjutkan.":"Data sudah berubah. Tinjau versi terbaru sebelum menyimpan isian Anda.",
    latest:{version:task.version,values:{instruction:task.instruction,status:task.status,followUpOn:task.follow_up_on??""}},...(created?{savedId:task.id}:{})};
}
export async function saveTask(client:UserClient,organizationId:string,caseId:string,mode:"create"|"update",form:FormData):Promise<RecordFormState>{
  const values:Record<string,string>={},errors:Record<string,string>={};
  for(const key of ["instruction","expectedVersion","resourceId","intentSeed","reviewVersion"]){
    const value=form.get(key);values[key]=typeof value==="string"?value:"";
    if(form.getAll(key).length>1||(value!==null&&typeof value!=="string"))errors.form="Isian tidak valid.";
  }
  if(form.has("reviewVersion"))values.expectedVersion=values.reviewVersion;
  const state:RecordFormState={status:"idle",values,resourceId:values.resourceId,intentSeed:values.intentSeed,errors};
  const fail=(status:RecordFormState["status"],message:string):RecordFormState=>({...state,status,message});
  try{
    const context=await organizationAccess(client,organizationId);
    if(context.status==="unavailable")return fail("error",unavailable);
    if(context.status!=="active"||context.role!=="companion")return fail("forbidden",denied);
    if(!isUuid(state.resourceId)||!isUuid(state.intentSeed))errors.form="Identitas penyimpanan tidak valid. Buka kembali formulir.";
    // Native multipart normalizes textarea line endings to CRLF; hydrated forms use LF.
    const instruction=values.instruction.replace(/\r\n?/g,"\n");
    if(!instruction.trim()||instruction.length>2000)errors.instruction="Isi instruksi revisi, maksimal 2.000 karakter.";
    const version=Number(values.expectedVersion);
    if(mode==="update"&&(!/^[1-9]\d*$/.test(values.expectedVersion)||!Number.isSafeInteger(version)||version>2147483647))errors.form="Versi penyimpanan tidak valid. Buka kembali formulir.";
    if(Object.keys(errors).length)return fail("invalid","Periksa isian berikut.");
    const parent=await getCase(client,context,caseId);
    if(!parent||parent.assignee_id!==context.userId)return fail("forbidden",denied);
    if(mode==="update"&&!await getTask(client,context,caseId,state.resourceId))return fail("forbidden",denied);
    const operation=mode==="create"?"create_task":"update_task_instruction";
    const args=mode==="create"?{p_id:state.resourceId,p_case_id:caseId,p_instruction:instruction.trim(),p_follow_up_on:null}
      :{p_id:state.resourceId,p_expected_version:version,p_instruction:instruction.trim()};
    const result=await client.rpc(operation,{...args,p_request_id:requestId(state.intentSeed,operation,args)} as never);
    if(!result.error){
      const output=result.data as {id?:string}|null;
      return output?.id===state.resourceId?{...state,status:"saved",savedId:output.id}:fail("error",unavailable);
    }
    if(result.error.code==="42501")return fail("forbidden",denied);
    if(result.error.code==="PT409"||(mode==="create"&&result.error.code==="22023")){
      const latestContext=await organizationAccess(client,organizationId);
      if(latestContext.status==="unavailable")return fail("error",unavailable);
      if(latestContext.status!=="active")return fail("forbidden",denied);
      const latest=await getTask(client,latestContext,caseId,state.resourceId);
      if(latest)return snapshot(state,latest,mode==="create");
      return fail("forbidden",denied);
    }
    return fail("error",unavailable);
  }catch{return fail("error",unavailable);}
}
