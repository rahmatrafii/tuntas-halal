import {requireStaff} from "@/features/staff/session";
import {logoutAction} from "@/features/staff/actions";
import {LogoutForm} from "@/features/staff/forms";
import {StaffFrame} from "@/features/staff/ui";
import Link from "next/link";

export default async function Page() {
  const staff = await requireStaff();
  return <StaffFrame title="Akun staf Anda">
    <p className="page-description">Sesi terverifikasi untuk <strong>{staff.email ?? "staf undangan"}</strong>.</p>
    <h2>Keanggotaan aktif</h2>
    <ul className="staff-memberships">{staff.memberships.map(item => <li key={item.organizationId}>
      <strong>{item.name}</strong>
      <span>{item.role === "coordinator" ? "Koordinator LP3H" : "Pendamping PPH"} · {item.timezone}</span>
      <div className="record-actions"><Link className="button outline" href={`/staf/lembaga/${item.organizationId}/kontak`}>Kontak usaha</Link><Link className="button primary" href={`/staf/lembaga/${item.organizationId}/kasus`}>Kasus usaha</Link></div>
    </li>)}</ul>
    <p className="notice">Pilih LP3H untuk membuka kontak dan kasus sesuai akses Anda. Pengelolaan revisi belum tersedia di area staf; demo tetap memakai data contoh.</p>
    <LogoutForm action={logoutAction} />
  </StaffFrame>;
}
