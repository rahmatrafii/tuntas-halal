import "server-only";
import {notFound, redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {organizationAccess} from "./access";

export async function requireOrganization(organizationId:string, write=false) {
  const client=await createClient();
  const context=await organizationAccess(client,organizationId);
  if(context.status==="signed_out")redirect("/staf/login");
  if(context.status==="restricted")redirect("/staf/akses-terbatas");
  if(context.status==="unavailable")throw new Error("Layanan staf belum tersedia. Silakan coba lagi.");
  if(context.status!=="active"||(write&&context.role!=="companion"))notFound();
  return {client,context};
}
