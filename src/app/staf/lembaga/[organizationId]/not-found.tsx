import Link from "next/link";
import {StaffFrame} from "@/features/staff/ui";
export default function NotFound(){return <StaffFrame title="Data tidak tersedia"><p className="page-description">Data tidak ditemukan atau Anda tidak memiliki akses.</p><Link className="button outline" href="/staf">Kembali ke akun staf</Link></StaffFrame>;}
