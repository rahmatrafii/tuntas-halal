import type {Database} from "../../lib/supabase/database.types";
import {isUuid,type ActiveOrganization,type UserClient} from "../caseload/access";
import {getCase,pageNumber,serviceFailure,type Page} from "../caseload/queries";

export type RevisionTask=Database["public"]["Tables"]["revision_tasks"]["Row"];
const columns="id,case_id,instruction,status,follow_up_on,version,created_at,updated_at" as const;

export async function getTask(client:UserClient,context:ActiveOrganization,caseId:string,id:string):Promise<RevisionTask|null>{
  if(!isUuid(id)||!await getCase(client,context,caseId))return null;
  const {data,error}=await client.from("revision_tasks").select(columns).eq("case_id",caseId).eq("id",id).maybeSingle();
  if(error)throw serviceFailure();
  return data?.case_id===caseId?data:null;
}
export async function listTasks(client:UserClient,context:ActiveOrganization,caseId:string,input:unknown=1):Promise<Page<RevisionTask>>{
  const page=pageNumber(input),start=(page-1)*20;
  if(!await getCase(client,context,caseId))throw serviceFailure();
  const {data,error}=await client.from("revision_tasks").select(columns).eq("case_id",caseId)
    .order("created_at",{ascending:false}).order("id").range(start,start+20);
  if(error||!data)throw serviceFailure();
  return {items:data.slice(0,20),page,hasNext:data.length>20};
}
