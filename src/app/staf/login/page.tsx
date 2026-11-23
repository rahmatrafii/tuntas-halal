import {redirect} from "next/navigation";
import {hasSupabaseConfig} from "@/lib/env";
import {currentStaff} from "@/features/staff/session";
import {loginAction} from "@/features/staff/actions";
import {LoginForm} from "@/features/staff/forms";
import {StaffFrame} from "@/features/staff/ui";

export const dynamic = "force-dynamic";

export default async function Page({searchParams}: {searchParams: Promise<{error?: string; keluar?: string}>}) {
  const params = await searchParams;
  const access = hasSupabaseConfig() ? await currentStaff() : {status: "unavailable"};
  if (access.status === "active") redirect("/staf");
  if (access.status === "restricted") redirect("/staf/akses-terbatas");
  return <StaffFrame title="Masuk staf">
    <p className="page-description">Kami akan mengirim tautan masuk ke email Anda.</p>
    {params.error === "tautan" && <p className="notice error" role="alert">Tautan tidak valid, sudah dipakai, atau kedaluwarsa. Minta tautan masuk yang baru.</p>}
    {params.keluar === "1" && <p className="notice" role="status">Sesi pada perangkat ini sudah diakhiri.</p>}
    {access.status === "unavailable" && <p className="notice error" role="alert">Layanan masuk belum tersedia. Silakan coba lagi atau hubungi pengelola aplikasi.</p>}
    <LoginForm action={loginAction} />
    <p className="staff-help">Belum mendapat undangan? Hubungi pengelola LP3H Anda.</p>
  </StaffFrame>;
}
