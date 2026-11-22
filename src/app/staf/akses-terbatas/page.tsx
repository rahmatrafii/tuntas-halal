import {redirect} from "next/navigation";
import {currentStaff} from "@/features/staff/session";
import {logoutAction} from "@/features/staff/actions";
import {LogoutForm} from "@/features/staff/forms";
import {StaffFrame} from "@/features/staff/ui";

export default async function Page() {
  const access = await currentStaff();
  if (access.status === "signed_out") redirect("/staf/login");
  if (access.status === "active") redirect("/staf");
  if (access.status !== "restricted") throw new Error("Keanggotaan belum dapat diperiksa. Silakan coba lagi.");
  return <StaffFrame title="Akses staf belum tersedia">
    <p className="page-description">Akun {access.email ?? "Anda"} belum memiliki keanggotaan LP3H yang aktif. Hubungi pengelola LP3H untuk memeriksa akses Anda.</p>
    <LogoutForm action={logoutAction} />
  </StaffFrame>;
}
