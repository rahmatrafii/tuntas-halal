"use server";
import {redirect} from "next/navigation";
import {revalidatePath} from "next/cache";
import {createClient} from "@/lib/supabase/server";
import {organizationPath} from "../caseload/access";
import {saveStatus} from "./service";
import type {StatusMode,StatusState} from "./types";
export async function statusAction(org:string,caseId:string,mode:StatusMode,_previous:StatusState,body:FormData):Promise<StatusState>{
 const reply=await saveStatus(await createClient(),org,caseId,mode,body);
 if(reply.status!=="saved"&&reply.status!=="unchanged")return reply;
 const path=`${organizationPath(org)}/kasus/${caseId}`;revalidatePath(path,"layout");redirect(`${path}?hasil=${reply.status==="saved"?"status":"tetap"}`);
}
