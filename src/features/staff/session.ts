import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { staffAccess } from "./auth";

export async function currentStaff() {
  return staffAccess(await createClient());
}

export async function requireStaff() {
  const access = await currentStaff();
  if (access.status === "signed_out") redirect("/staf/login");
  if (access.status === "restricted") redirect("/staf/akses-terbatas");
  if (access.status !== "active") throw new Error("Layanan staf belum tersedia. Silakan coba lagi.");
  return access;
}
