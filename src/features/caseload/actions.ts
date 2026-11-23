"use server";

import {redirect} from "next/navigation";
import {revalidatePath} from "next/cache";
import {createClient} from "@/lib/supabase/server";
import {isUuid,organizationPath} from "./access";
import {saveContact,saveCase,type RecordFormState} from "./mutations";
import {saveTransfer,type TransferState} from "./transfer";

export async function contactAction(organizationId:string,mode:"create"|"update",_previous:RecordFormState,form:FormData):Promise<RecordFormState> {
  const result=await saveContact(await createClient(),organizationId,mode,form);
  if(result.status!=="saved"||!isUuid(result.savedId))return result;
  const base=organizationPath(organizationId);
  revalidatePath(base,"layout");
  redirect(mode==="create"&&form.get("continueCase")==="1" ? `${base}/kasus/baru?kontak=${result.savedId}` : `${base}/kontak/${result.savedId}`);
}
export async function caseAction(organizationId:string,mode:"create"|"update",_previous:RecordFormState,form:FormData):Promise<RecordFormState> {
  const result=await saveCase(await createClient(),organizationId,mode,form);
  if(result.status!=="saved"||!isUuid(result.savedId))return result;
  const base=organizationPath(organizationId);
  revalidatePath(base,"layout");
  redirect(`${base}/kasus/${result.savedId}`);
}

export async function transferAction(organizationId:string,caseId:string,previous:TransferState,form:FormData):Promise<TransferState> {
  const result = await saveTransfer(await createClient(),organizationId,caseId,previous,form);
  if (result.status !== "saved") return result;
  const base = organizationPath(organizationId);
  revalidatePath(base,"layout");
  redirect(`${base}/kasus/${caseId}?hasil=dialihkan`);
}
