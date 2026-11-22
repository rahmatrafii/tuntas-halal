import {createHash} from "node:crypto";
import {normalizeWhatsAppNumber} from "../../lib/domain/whatsapp";
import {isUuid, organizationAccess, type UserClient, type ActiveOrganization} from "./access";
import {getCase,getContact,type Contact,type CaseRecord} from "./queries";

export type RecordFormState = {
  status:"idle"|"invalid"|"error"|"duplicate"|"conflict"|"forbidden"|"saved";
  values:Record<string,string>; resourceId:string; intentSeed:string; errors?:Record<string,string>; message?:string;
  duplicates?:{id:string;name:string}[]; latest?:{version:number;values:Record<string,string>}; savedId?:string;
};
const contactValues=(item:Contact)=>({businessName:item.business_name,phone:item.whatsapp_number,greeting:item.greeting_name});
const caseValues=(item:CaseRecord)=>({reference:item.official_reference??"",contactId:item.contact_id});
const denied="Data tidak tersedia atau Anda tidak memiliki akses untuk menyimpannya.";
const unavailable="Belum dapat menyimpan. Isian tetap tersedia; silakan coba lagi.";

function input(form:FormData):RecordFormState {
  const values:Record<string,string>={};
  const errors:Record<string,string>={};
  for(const key of ["businessName","phone","greeting","reference","contactId","expectedVersion","confirmDuplicate","confirmedPhone"]){
    const value=form.get(key);
    values[key]=typeof value==="string" ? value.slice(0,1000) : "";
    if(form.getAll(key).length>1 || (value!==null && typeof value!=="string"))errors[key]="Isian tidak valid.";
  }
  const resourceId=form.get("resourceId"), intentSeed=form.get("intentSeed");
  const reviewed=form.get("reviewVersion");
  if(reviewed!==null){
    if(typeof reviewed!=="string"||form.getAll("reviewVersion").length!==1)errors.form="Versi peninjauan tidak valid.";
    else values.expectedVersion=reviewed.slice(0,1000);
  }
  if(!isUuid(resourceId)||!isUuid(intentSeed)||form.getAll("resourceId").length!==1||form.getAll("intentSeed").length!==1)errors.form="Identitas penyimpanan tidak valid. Buka kembali formulir.";
  return {status:"idle",values,resourceId:typeof resourceId==="string"?resourceId:"",intentSeed:typeof intentSeed==="string"?intentSeed:"",errors};
}
// A random form seed plus canonical payload gives identical native/JS retries one request ID.
export function requestId(seed:string,operation:string,payload:unknown) {
  const bytes=createHash("sha256").update(JSON.stringify([seed,operation,payload])).digest().subarray(0,16);
  bytes[6]=(bytes[6]&15)|128; bytes[8]=(bytes[8]&63)|128;
  const hex=bytes.toString("hex");
  return `${hex.slice(0,8)}-${hex.slice(8,12)}-${hex.slice(12,16)}-${hex.slice(16,20)}-${hex.slice(20)}`;
}
function failed(state:RecordFormState,status:RecordFormState["status"],message:string):RecordFormState {
  return {...state,status,message};
}
function conflict(state:RecordFormState,item:Contact|CaseRecord,kind:"contact"|"case",created=false):RecordFormState {
  return {...state,status:"conflict",message:created ? "Penyimpanan sebelumnya sudah tercatat dengan isian berbeda. Tinjau data tersimpan sebelum melanjutkan." : "Data sudah berubah. Tinjau versi terbaru sebelum menyimpan isian Anda.",
    latest:{version:item.version,values:kind==="contact"?contactValues(item as Contact):caseValues(item as CaseRecord)},
    ...(created?{savedId:item.id}:{})};
}
async function duplicates(client:UserClient,context:ActiveOrganization,id:string,phone:string) {
  const {data,error}=await client.from("business_contacts").select("id,business_name").eq("organization_id",context.organizationId)
    .eq("owner_id",context.userId).eq("whatsapp_number",phone).neq("id",id).limit(20);
  if(error||!data)throw new Error("Duplicate lookup unavailable");
  return data.map(item=>({id:item.id,name:item.business_name}));
}

async function save(client:UserClient,organizationId:string,kind:"contact"|"case",mode:"create"|"update",form:FormData):Promise<RecordFormState> {
  const state=input(form), values=state.values, errors=state.errors!;
  try {
    const context=await organizationAccess(client,organizationId);
    if(context.status==="unavailable")return failed(state,"error",unavailable);
    if(context.status!=="active"||context.role!=="companion")return failed(state,"forbidden",denied);
    const versionText=values.expectedVersion;
    const expectedVersion=Number(versionText);
    if(mode==="update"&&(!/^[1-9]\d*$/.test(String(versionText))||!Number.isSafeInteger(expectedVersion)||expectedVersion>2147483647))errors.form="Version penyimpanan tidak valid. Buka kembali formulir.";
    const phone=normalizeWhatsAppNumber(values.phone);
    if(kind==="contact"){
      if(!values.businessName.trim()||values.businessName.length>160)errors.businessName="Isi nama usaha, maksimal 160 karakter.";
      if(!phone||values.phone.length>160)errors.phone="Isi nomor WhatsApp dengan format 08 atau +62 yang valid.";
      if(values.greeting.length>160)errors.greeting="Nama sapaan maksimal 160 karakter.";
    }else{
      if(mode==="create"&&!isUuid(values.contactId))errors.contactId="Pilih kontak usaha milik Anda.";
      if(values.reference.length>160)errors.reference="Nomor pengajuan maksimal 160 karakter.";
    }
    if(Object.keys(errors).length)return failed(state,"invalid","Periksa isian berikut.");
    const current=kind==="contact" ? await getContact(client,context,state.resourceId) : await getCase(client,context,state.resourceId);
    if(mode==="update"&&!current)return failed(state,"forbidden",denied);
    if(current && (kind==="contact"?(current as Contact).owner_id:(current as CaseRecord).assignee_id)!==context.userId)return failed(state,"forbidden",denied);
    const confirmed=values.confirmDuplicate==="on"&&values.confirmedPhone===phone;
    const payload=kind==="contact" ? {p_id:state.resourceId,p_business_name:values.businessName.trim(),p_whatsapp_number:phone!,p_greeting_name:values.greeting.trim(),p_confirm_duplicate:confirmed}
      : {p_id:state.resourceId,p_official_reference:values.reference.trim()||null};
    if(mode==="create"&&current){
      const previous:Record<string,string>=kind==="contact"?contactValues(current as Contact):caseValues(current as CaseRecord);
      const matches=kind==="contact" ? previous.businessName===values.businessName.trim()&&previous.phone===phone&&previous.greeting===values.greeting.trim()
        : previous.reference===(values.reference.trim())&&previous.contactId===values.contactId;
      if(!matches)return conflict(state,current,kind,true);
    }
    if(kind==="contact"&&!confirmed&&!current){
      const found=await duplicates(client,context,state.resourceId,phone!);
      if(found.length)return {...state,status:"duplicate",duplicates:found,values:{...values,confirmedPhone:phone!},message:"Nomor ini sudah tersimpan. Gunakan kontak tersebut atau konfirmasikan usaha berbeda."};
    }
    if(kind==="case"&&mode==="create"){
      const selected=await getContact(client,context,values.contactId);
      if(!selected||selected.owner_id!==context.userId)return failed(state,"forbidden",denied);
    }
    const operation=`${mode}_${kind}` as "create_contact"|"update_contact"|"create_case"|"update_case";
    const args={...payload,...(mode==="create"?{p_organization_id:organizationId,...(kind==="case"?{p_contact_id:values.contactId}:{})}:{p_expected_version:expectedVersion})};
    const response=await client.rpc(operation,{...args,p_request_id:requestId(state.intentSeed,operation,args)} as never);
    if(!response.error){
      const output=response.data as {id?:string;version?:number}|null;
      if(output?.id!==state.resourceId)return failed(state,"error",unavailable);
      return {...state,status:"saved",savedId:output.id};
    }
    if(response.error.code==="42501")return failed(state,"forbidden",denied);
    if(response.error.code==="PT409"){
      const latestContext=await organizationAccess(client,organizationId);
      if(latestContext.status!=="active")return failed(state,latestContext.status==="unavailable"?"error":"forbidden",latestContext.status==="unavailable"?unavailable:denied);
      const latest=kind==="contact"?await getContact(client,latestContext,state.resourceId):await getCase(client,latestContext,state.resourceId);
      if(!latest)return failed(state,"forbidden",denied);
      return conflict(state,latest,kind);
    }
    if(kind==="contact"&&response.error.code==="22023"&&response.error.message==="Nomor ini sudah tersimpan. Konfirmasikan sebagai usaha berbeda."){
      const found=await duplicates(client,context,state.resourceId,phone!);
      return {...state,status:"duplicate",duplicates:found,values:{...values,confirmedPhone:phone!},message:"Nomor ini baru tersimpan. Konfirmasikan usaha berbeda atau gunakan kontak yang tersedia."};
    }
    return failed(state,"error",response.error.code==="22023"?"Isian belum dapat disimpan. Tinjau data atau buka kembali versi terbaru.":unavailable);
  }catch{return failed(state,"error",unavailable);}
}
export const saveContact=(client:UserClient,organizationId:string,mode:"create"|"update",form:FormData)=>save(client,organizationId,"contact",mode,form);
export const saveCase=(client:UserClient,organizationId:string,mode:"create"|"update",form:FormData)=>save(client,organizationId,"case",mode,form);
