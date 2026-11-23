import type {ActiveOrganization,UserClient} from "../caseload/access";
import {pageNumber,serviceFailure} from "../caseload/queries";
import {localCalendarDate,queueGroup,queueOrder,revisionStatuses,type QueueGroup,type RevisionStatus} from "../../lib/domain/revisions";

export const queueFilters=["all","contact_today",...revisionStatuses] as const;
export type QueueInput={q:string;status:typeof queueFilters[number];page:number;notice?:string};
export type QueueItem={id:string;caseId:string;businessName:string;reference:string|null;instruction:string;status:RevisionStatus;followUpOn:string|null;group:QueueGroup};
export type QueuePage={input:QueueInput;today:string;items:QueueItem[];groups:{id:QueueGroup;count:number}[];total:number;page:number;hasNext:boolean};
type RawInput=Record<string,string|string[]|undefined>;
export function queueInput(raw:RawInput):QueueInput{
 const q=typeof raw.q==="string"?raw.q.trim():"";
 const status=queueFilters.find(s=>s===raw.status)??"all";
 return {q:q.slice(0,160),status,page:pageNumber(raw.page),...(q.length>160?{notice:"Pencarian dibatasi 160 karakter. Hasil memakai 160 karakter pertama."}:{})};
}
const columns="id,case_id,instruction,status,follow_up_on,created_at,cases!inner(id,organization_id,assignee_id,official_reference,contact:business_contacts!cases_organization_id_contact_id_fkey!inner(business_name),name_match:business_contacts!cases_organization_id_contact_id_fkey())" as const;

export async function listQueue(client:UserClient,context:ActiveOrganization,raw:RawInput,now=new Date()):Promise<QueuePage>{
 const input=queueInput(raw),today=localCalendarDate(now,context.timezone);
 const groups:QueueGroup[]=input.status==="completed"?["completed"]:queueOrder.filter(g=>input.status==="all"||g===input.status||(input.status==="awaiting_reply"&&g==="contact_today"));
 function query(group:QueueGroup,head=false){
  let q=client.from("revision_tasks").select(columns,{count:"exact",head}).eq("cases.organization_id",context.organizationId);
  if(context.role==="companion")q=q.eq("cases.assignee_id",context.userId);
  if(input.q){
   const pattern=input.q.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
   q=q.filter("cases.name_match.business_name","imatch",pattern).or(`official_reference.imatch.${JSON.stringify(pattern)},name_match.not.is.null`,{referencedTable:"cases"});
  }
  q=q.eq("status",group==="contact_today"?"awaiting_reply":group);
  if(group==="contact_today")q=q.lte("follow_up_on",today);
  if(group==="awaiting_reply")q=q.or(`follow_up_on.is.null,follow_up_on.gt.${today}`);
  return q;
 }
 const counts=await Promise.all(groups.map(async id=>{
  const {count,error}=await query(id,true);if(error||count===null)throw serviceFailure();return {id,count};
 }));
 const total=counts.reduce((n,g)=>n+g.count,0),page=Math.min(input.page,Math.max(1,Math.ceil(total/20)));
 let offset=(page-1)*20,remaining=20;
 const ranges:{id:QueueGroup;start:number;size:number}[]=[];
 for(const g of counts){if(offset>=g.count){offset-=g.count;continue;}const size=Math.min(remaining,g.count-offset);if(size)ranges.push({id:g.id,start:offset,size});remaining-=size;offset=0;if(!remaining)break;}
 const pages=await Promise.all(ranges.map(async range=>{
  const {data,error}=await query(range.id).order("follow_up_on",{ascending:true,nullsFirst:false}).order("created_at").order("id").range(range.start,range.start+range.size-1);
  if(error||!data)throw serviceFailure();
  return data.map(row=>{
   const c=row.cases;
   if(!c?.contact||c.id!==row.case_id||c.organization_id!==context.organizationId||(context.role==="companion"&&c.assignee_id!==context.userId)||queueGroup(row.status,row.follow_up_on,today)!==range.id)throw serviceFailure();
   return {id:row.id,caseId:row.case_id,businessName:c.contact.business_name,reference:c.official_reference,instruction:row.instruction,status:row.status,followUpOn:row.follow_up_on,group:range.id};
  });
 }));
 return {input,today,items:pages.flat(),groups:counts,total,page,hasNext:page*20<total};
}
