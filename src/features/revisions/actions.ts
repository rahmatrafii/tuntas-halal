"use server";

import {redirect} from "next/navigation";
import {revalidatePath} from "next/cache";
import {createClient} from "@/lib/supabase/server";
import {isUuid,organizationPath} from "../caseload/access";
import type {RecordFormState} from "../caseload/mutations";
import {saveTask} from "./mutations";

export async function taskAction(organizationId:string,caseId:string,mode:"create"|"update",_previous:RecordFormState,form:FormData):Promise<RecordFormState>{
  const result=await saveTask(await createClient(),organizationId,caseId,mode,form);
  if(result.status!=="saved"||!isUuid(result.savedId))return result;
  const path=`${organizationPath(organizationId)}/kasus/${caseId}`;
  revalidatePath(path,"layout");
  redirect(path);
}
