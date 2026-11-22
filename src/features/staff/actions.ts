"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { applicationOrigin, sendLoginLink, type LoginState } from "./auth";

export async function loginAction(_previous: LoginState, form: FormData): Promise<LoginState> {
  const value = form.get("email");
  const email = typeof value === "string" ? value.slice(0,254) : "";
  try {
    const origin = applicationOrigin(process.env.APP_URL);
    return {...await sendLoginLink(await createClient(), email, origin), email};
  } catch {
    return {status: "error", message: "Layanan masuk belum dikonfigurasi. Hubungi pengelola aplikasi.", email};
  }
}

export async function logoutAction(): Promise<{message?: string}> {
  try {
    const {error} = await (await createClient()).auth.signOut({scope: "local"});
    if (error) return {message: "Belum dapat keluar. Silakan coba lagi."};
  } catch {
    return {message: "Layanan keluar belum tersedia. Silakan coba lagi."};
  }
  redirect("/staf/login?keluar=1");
}
