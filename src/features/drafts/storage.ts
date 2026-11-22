import {isUuid} from "../caseload/access";
import {composeWhatsAppDraft} from "../../lib/domain/whatsapp";
import type {DraftContext,DraftRequest} from "./types";
type Scope=Pick<DraftContext,"userId"|"organizationId"|"caseId">;
export type LocalDraft=Omit<DraftRequest,"intent">&Scope&{schema:1;edited:boolean;needsReview:boolean;revision:string};
type StorageAccess=Pick<Storage,"getItem"|"setItem">;
export type DraftRead={status:"empty"|"ready"|"corrupt"|"error";draft?:LocalDraft;raw:string|null};
export function draftKey(scope:Scope){return `tuntashalal:staff-draft:1:${scope.userId}:${scope.organizationId}:${scope.caseId}`;}
export function snapshotDraft(draft:LocalDraft,context:DraftContext):LocalDraft{
  return {...draft,caseVersion:context.caseVersion,contactVersion:context.contactVersion,versions:Object.fromEntries(context.tasks.map(t=>[t.id,t.version]))};
}
export function newDraft(context:DraftContext,selectedId?:string):LocalDraft{
  const tasks=selectedId&&context.tasks.some(t=>t.id===selectedId)?context.tasks.filter(t=>t.id===selectedId):context.tasks;
  return snapshotDraft({schema:1,userId:context.userId,organizationId:context.organizationId,caseId:context.caseId,selected:tasks.map(t=>t.id),
    message:tasks.length?composeWhatsAppDraft({businessName:context.businessName,greetingName:context.greetingName,tasks:tasks.map(t=>({...t,caseId:context.caseId}))}):"",
    edited:false,needsReview:false,revision:crypto.randomUUID(),versions:{},caseVersion:context.caseVersion,contactVersion:context.contactVersion},context);
}
function valid(input:unknown,scope:Scope):input is LocalDraft{
  if(!input||typeof input!=="object")return false;
  const d=input as LocalDraft;
  return d.schema===1&&d.userId===scope.userId&&d.organizationId===scope.organizationId&&d.caseId===scope.caseId
    &&typeof d.message==="string"&&d.message.length<=64000&&typeof d.edited==="boolean"&&typeof d.needsReview==="boolean"&&isUuid(d.revision)
    &&Number.isSafeInteger(d.contactVersion)&&d.contactVersion>0&&Number.isSafeInteger(d.caseVersion)&&d.caseVersion>0
    &&Array.isArray(d.selected)&&d.selected.every(isUuid)&&new Set(d.selected).size===d.selected.length
    &&Boolean(d.versions)&&typeof d.versions==="object"&&!Array.isArray(d.versions)&&Object.entries(d.versions).every(([key,value])=>isUuid(key)&&Number.isSafeInteger(value)&&value>0);
}
export function readDraft(storage:Pick<Storage,"getItem">,key:string,scope:Scope):DraftRead{
  let raw:string|null=null;
  try{raw=storage.getItem(key);if(raw===null)return {status:"empty",raw};
    if(raw.length>1024*1024)return {status:"corrupt",raw};
    const draft:unknown=JSON.parse(raw);return valid(draft,scope)?{status:"ready",draft,raw}:{status:"corrupt",raw};
  }catch{return {status:raw===null?"error":"corrupt",raw};}
}
export function writeDraft(storage:StorageAccess,key:string,draft:LocalDraft,expectedRaw:string|null):{status:"saved"|"conflict"|"error";draft?:LocalDraft;raw?:string}{
  try{
    if(storage.getItem(key)!==expectedRaw)return {status:"conflict"};
    if(!valid(draft,draft)||key!==draftKey(draft))return {status:"error"};
    const next={...draft,revision:crypto.randomUUID()},raw=JSON.stringify(next);
    if(raw.length>1024*1024)return {status:"error"};
    storage.setItem(key,raw);return {status:"saved",draft:next,raw};
  }catch{return {status:"error"};}
}
