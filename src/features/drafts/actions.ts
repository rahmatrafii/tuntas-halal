"use server";
import {createClient} from "@/lib/supabase/server";
import {redirect} from "next/navigation";
import {prepareDraft} from "./service";
import type {DraftReply} from "./types";
export async function draftAction(organizationId:string,caseId:string,_previous:DraftReply,form:FormData):Promise<DraftReply>{
  let result:DraftReply;
  let intent:unknown;
  try{
    const raw=form.get("draftRequest");
    if(typeof raw!=="string"||raw.length>900000||form.getAll("draftRequest").length!==1)return {status:"invalid",notice:"Permintaan draf tidak valid."};
    const request=JSON.parse(raw);intent=request?.intent;
    result=await prepareDraft(await createClient(),organizationId,caseId,request);
  }catch{return {status:"error",notice:"Draf belum dapat diperiksa. Isian tetap tersedia; coba lagi."};}
  // Native continuation rechecks access and uses an HTTP redirect, avoiding popup activation.
  if(form.get("continueChat")==="1"&&intent==="open"&&result.status==="ready"&&result.url)redirect(result.url);
  return result;
}
