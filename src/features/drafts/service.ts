import {organizationAccess,isUuid,type UserClient} from "../caseload/access";
import {getCase,getContact} from "../caseload/queries";
import {composeWhatsAppDraft,normalizeWhatsAppNumber,whatsappChatUrl} from "../../lib/domain/whatsapp";
import type {DraftContext,DraftReply,DraftRequest} from "./types";

const forbidden=():DraftReply=>({status:"forbidden",notice:"Draf tidak tersedia atau akses Anda telah berubah."});
const unavailable=():DraftReply=>({status:"error",notice:"Data belum dapat diperiksa. Isian tetap tersedia; coba lagi."});
export async function loadDraftContext(client:UserClient,organizationId:string,caseId:string):Promise<DraftReply>{
  try{
    const access=await organizationAccess(client,organizationId);
    if(access.status==="unavailable")return unavailable();
    if(access.status!=="active"||access.role!=="companion")return forbidden();
    const parent=await getCase(client,access,caseId);
    if(!parent||parent.assignee_id!==access.userId)return forbidden();
    const contact=await getContact(client,access,parent.contact_id);if(!contact)return forbidden();
    const tasks:DraftContext["tasks"]=[];
    for(let offset=0;;offset+=100){
      const {data,error}=await client.from("revision_tasks").select("id,case_id,instruction,status,version").eq("case_id",caseId)
        .order("created_at").order("id").range(offset,offset+99);
      if(error||!data)return unavailable();
      if(data.some(t=>t.case_id!==caseId))return forbidden();
      tasks.push(...data.filter(t=>t.status!=="completed").map(({id,instruction,status,version})=>({id,instruction,status,version})));
      if(data.length<100)break;
    }
    return {status:"ready",context:{userId:access.userId,organizationId,caseId,caseVersion:parent.version,contactVersion:contact.version,contactId:contact.id,contactOwnerId:contact.owner_id,
      businessName:contact.business_name,greetingName:contact.greeting_name,phone:contact.whatsapp_number,tasks}};
  }catch{return unavailable();}
}
export async function prepareDraft(client:UserClient,organizationId:string,caseId:string,input:unknown):Promise<DraftReply>{
  const loaded=await loadDraftContext(client,organizationId,caseId);if(!loaded.context)return loaded;
  const context=loaded.context;
  const invalid=(notice:string):DraftReply=>({status:"invalid",notice});
  if(!input||typeof input!=="object")return invalid("Permintaan draf tidak valid.");
  const request=input as DraftRequest;
  if(request.userId!==context.userId)return forbidden();
  loaded.notice="Draf sudah diperiksa. Status revisi tidak berubah.";
  if(!["refresh","compose","copy","open"].includes(request.intent))return invalid("Tindakan tidak valid.");
  if(request.intent==="refresh")return loaded;
  if(!Array.isArray(request.selected)||!request.selected.length||!request.selected.every(isUuid)||new Set(request.selected).size!==request.selected.length)return invalid("Pilih minimal satu revisi yang sah tanpa pilihan ganda.");
  const selected=new Set(request.selected),tasks=context.tasks.filter(t=>selected.has(t.id));
  if(tasks.length!==selected.size)return {...loaded,status:"changed",notice:"Pilihan revisi berubah. Tinjau kembali draf Anda."};
  if(request.intent==="compose")return {...loaded,message:composeWhatsAppDraft({businessName:context.businessName,greetingName:context.greetingName,tasks:tasks.map(t=>({...t,caseId}))})};
  if(!request.versions||typeof request.versions!=="object"||Array.isArray(request.versions)||!Number.isSafeInteger(request.caseVersion)||!Number.isSafeInteger(request.contactVersion)
    ||tasks.some(t=>!Number.isSafeInteger(request.versions[t.id])))return invalid("Versi peninjauan tidak valid.");
  if(request.caseVersion!==context.caseVersion||request.contactVersion!==context.contactVersion||tasks.some(t=>request.versions[t.id]!==t.version))return {...loaded,status:"changed",notice:"Instruksi atau penerima berubah. Tinjau data terbaru sebelum melanjutkan."};
  if(typeof request.message!=="string"||!request.message.trim()||request.message.length>64000||!request.message.isWellFormed())return invalid("Isi pesan yang valid, maksimal 64.000 karakter.");
  if(request.intent==="copy")return loaded;
  const number=normalizeWhatsAppNumber(context.phone);if(!number)return invalid("Nomor WhatsApp belum valid. Koreksi kontak atau salin pesan.");
  const url=whatsappChatUrl(number,request.message)!;
  return {...loaded,url:url.length<=8000?url:`https://wa.me/${number}`,longUrl:url.length>8000};
}
