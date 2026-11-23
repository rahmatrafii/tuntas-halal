import {createClient} from "@supabase/supabase-js";
import type {Database} from "../src/lib/supabase/database.types";
import type {ActiveOrganization} from "../src/features/caseload/access";
import {actor,org} from "./caseload-fixture";
import {taskRow,caseRow} from "./draft-fixture";
export const context:ActiveOrganization={status:"active",userId:actor,organizationId:org,name:"LP3H Uji",role:"companion",timezone:"Asia/Jakarta"};
export function queueRow(id:string,status:typeof taskRow.status|"needs_review"|"awaiting_reply"|"completed",date:string|null=null){
 return {...taskRow,id,status,follow_up_on:date,cases:{...caseRow,contact:{business_name:"Usaha Fiktif"}}};
}
export function queueFixture(rows:ReturnType<typeof queueRow>[],fail=false){
 const calls:{url:URL;method:string}[]=[];
 const client=createClient<Database>("https://database.example.test","public-test-key",{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:async(input,init)=>{
  const url=new URL(String(input)),method=init?.method??"GET";calls.push({url,method});
  if(fail)return new Response(JSON.stringify({message:"private diagnostic"}),{status:400});
  let filtered=rows.filter(r=>url.searchParams.get("status")===`eq.${r.status}`);
  const due=url.searchParams.get("follow_up_on");
  if(due)filtered=filtered.filter(r=>r.follow_up_on!==null&&r.follow_up_on<=due.slice(4));
  if(url.searchParams.get("or"))filtered=filtered.filter(r=>r.follow_up_on===null||r.follow_up_on>"2026-11-23");
  const total=filtered.length,start=Number(url.searchParams.get("offset")??0),limit=Number(url.searchParams.get("limit")??20);
  filtered=filtered.sort((a,b)=>(a.follow_up_on??"9999").localeCompare(b.follow_up_on??"9999")||a.created_at.localeCompare(b.created_at)||a.id.localeCompare(b.id)).slice(start,start+limit);
  return new Response(method==="HEAD"?null:JSON.stringify(filtered),{headers:{"content-type":"application/json","content-range":`*/${total}`}});
 }}});
 return {client,calls};
}
