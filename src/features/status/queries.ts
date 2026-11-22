import type {Database} from "../../lib/supabase/database.types";
import type {ActiveOrganization,UserClient} from "../caseload/access";
import {getCase,pageNumber,serviceFailure} from "../caseload/queries";
import type {RevisionTask} from "../revisions/queries";
export async function allTasks(client:UserClient,context:ActiveOrganization,caseId:string):Promise<RevisionTask[]>{
 if(!await getCase(client,context,caseId))throw serviceFailure();
 const tasks:RevisionTask[]=[];
 for(let offset=0;;offset+=100){const {data,error}=await client.from("revision_tasks").select("id,case_id,instruction,status,follow_up_on,version,created_at,updated_at").eq("case_id",caseId).order("created_at").order("id").range(offset,offset+99);
 if(error||!data||data.some(t=>t.case_id!==caseId))throw serviceFailure();tasks.push(...data);if(data.length<100)return tasks;}
}
export function caseProgress(tasks:Pick<RevisionTask,"status">[]){const completed=tasks.filter(t=>t.status==="completed").length;return {completed,total:tasks.length,complete:tasks.length>0&&completed===tasks.length};}
export type AuditEvent=Database["public"]["Tables"]["audit_events"]["Row"];
export async function listHistory(client:UserClient,context:ActiveOrganization,caseId:string,input:unknown){
 if(!await getCase(client,context,caseId))throw serviceFailure();const page=pageNumber(input);
 const {data,error}=await client.from("audit_events").select("id,case_id,task_id,actor_id,event_type,before,after,created_at").eq("case_id",caseId).order("created_at",{ascending:false}).order("id",{ascending:false}).range((page-1)*20,page*20);
 if(error||!data||data.some(e=>e.case_id!==caseId))throw serviceFailure();return {items:data.slice(0,20),page,hasNext:data.length>20};
}
