"use client";
import Link from "next/link";
import {StaffFrame} from "@/features/staff/ui";
export default function ErrorPage({reset}:{reset:()=>void}){return <StaffFrame title="Data belum dapat dimuat"><p className="notice error" role="alert">Layanan belum tersedia. Silakan coba lagi.</p><button className="button primary" onClick={reset}>Coba lagi</button><Link className="staff-help" href="/staf">Kembali ke akun staf</Link></StaffFrame>;}
