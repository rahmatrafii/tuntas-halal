import type {SupabaseClient} from "@supabase/supabase-js";
import type {Database} from "../../lib/supabase/database.types";
import {staffAccess} from "../staff/auth";

export type UserClient = SupabaseClient<Database>;
export type ActiveOrganization = {status:"active"; userId:string; organizationId:string;
  name:string; role:"companion"|"coordinator"; timezone:string};
export const isUuid = (value:unknown): value is string => typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
export const organizationPath = (id:string) => `/staf/lembaga/${id}`;

export async function organizationAccess(client:UserClient, organizationId:string): Promise<ActiveOrganization|{
  status:"signed_out"|"restricted"|"forbidden"|"unavailable";
}> {
  const staff=await staffAccess(client);
  if(staff.status!=="active") return {status:staff.status};
  const membership=isUuid(organizationId) ? staff.memberships.find(item=>item.organizationId===organizationId) : undefined;
  return membership ? {status:"active",userId:staff.userId,...membership} : {status:"forbidden"};
}
