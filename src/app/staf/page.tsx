import {requireStaff} from "@/features/staff/session";
import {logoutAction} from "@/features/staff/actions";
import {LogoutForm} from "@/features/staff/forms";
import {StaffFrame} from "@/features/staff/ui";
import Link from "next/link";

export default async function Page() {
  const staff = await requireStaff();
  return <StaffFrame title="Akun staf Anda">
    <p className="page-description">Masuk sebagai <strong>{staff.email ?? "staf undangan"}</strong>.</p>
    <h2>Keanggotaan aktif</h2>
    <ul className="staff-memberships">{staff.memberships.map(item => <li key={item.organizationId}>
      <strong>{item.name}</strong>
      <span>{item.role === "coordinator" ? "Koordinator LP3H" : "Pendamping PPH"} · {item.timezone}</span>
      <div className="record-actions"><Link className="button primary" href={`/staf/lembaga/${item.organizationId}/antrean`}>Antrean tindakan</Link><Link className="button outline" href={`/staf/lembaga/${item.organizationId}/kasus`}>Kasus usaha</Link><Link className="button outline" href={`/staf/lembaga/${item.organizationId}/kontak`}>Kontak usaha</Link></div>
    </li>)}</ul>
    {staff.memberships.some(item=>item.role==="companion")&&<details className="record-disclosure account-code">
      <summary>Kode akun pendamping</summary><p>{staff.userId}</p>
    </details>}
    <LogoutForm action={logoutAction} />
  </StaffFrame>;
}
