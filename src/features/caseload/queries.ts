import type {Database} from "../../lib/supabase/database.types";
import {isUuid, type ActiveOrganization, type UserClient} from "./access";

export type Contact = Pick<Database["public"]["Tables"]["business_contacts"]["Row"],
  "id"|"organization_id"|"owner_id"|"business_name"|"whatsapp_number"|"greeting_name"|"version"|"created_at">;
export type CaseRecord = Pick<Database["public"]["Tables"]["cases"]["Row"],
  "id"|"organization_id"|"contact_id"|"assignee_id"|"official_reference"|"version"|"created_at"> & {
  business_contacts: Pick<Contact,"id"|"business_name"|"whatsapp_number"|"greeting_name">;
};
export type Page<T> = {items:T[];page:number;hasNext:boolean};
const contacts="id,organization_id,owner_id,business_name,whatsapp_number,greeting_name,version,created_at" as const;
const cases="id,organization_id,contact_id,assignee_id,official_reference,version,created_at,business_contacts!cases_organization_id_contact_id_fkey(id,business_name,whatsapp_number,greeting_name)" as const;
export const serviceFailure = () => new Error("Data belum dapat dimuat. Silakan coba lagi.");
export function pageNumber(value:unknown) {const number=Number(value); return Number.isSafeInteger(number)&&number>0&&number<=10000 ? number : 1;}

export async function listContacts(client:UserClient, context:ActiveOrganization, input:unknown=1, ownOnly=false):Promise<Page<Contact>> {
  const page=pageNumber(input), start=(page-1)*20;
  let query=client.from("business_contacts").select(contacts).eq("organization_id",context.organizationId);
  if(ownOnly)query=query.eq("owner_id",context.userId);
  const {data,error}=await query.order("created_at",{ascending:false}).order("id").range(start,start+20);
  if(error||!data)throw serviceFailure();
  return {items:data.slice(0,20),page,hasNext:data.length>20};
}
export async function getContact(client:UserClient, context:ActiveOrganization,id:string):Promise<Contact|null> {
  if(!isUuid(id))return null;
  const {data,error}=await client.from("business_contacts").select(contacts).eq("organization_id",context.organizationId).eq("id",id).maybeSingle();
  if(error)throw serviceFailure();
  return data;
}
export async function listCases(client:UserClient, context:ActiveOrganization, input:unknown=1, contactId?:string):Promise<Page<CaseRecord>> {
  const page=pageNumber(input), start=(page-1)*20;
  let query=client.from("cases").select(cases).eq("organization_id",context.organizationId);
  if(contactId)query=query.eq("contact_id",contactId);
  const {data,error}=await query.order("created_at",{ascending:false}).order("id").range(start,start+20);
  if(error||!data||data.some(item=>!item.business_contacts))throw serviceFailure();
  return {items:data.slice(0,20),page,hasNext:data.length>20};
}
export async function getCase(client:UserClient,context:ActiveOrganization,id:string):Promise<CaseRecord|null> {
  if(!isUuid(id))return null;
  const {data,error}=await client.from("cases").select(cases).eq("organization_id",context.organizationId).eq("id",id).maybeSingle();
  if(error)throw serviceFailure();
  if(data&&!data.business_contacts)throw serviceFailure();
  return data;
}
