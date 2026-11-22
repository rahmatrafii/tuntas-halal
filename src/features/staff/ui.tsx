import Link from "next/link";
import type {ReactNode} from "react";

export function StaffFrame({title, children}: {title: string; children: ReactNode}) {
  return <main className="staff-area" id="konten">
    <Link href="/staf" className="staff-brand">TuntasHalal <span>Area staf</span></Link>
    <section className="staff-card">
      <h1>{title}</h1>
      {children}
    </section>
    <Link href="/" className="staff-demo-link">Jelajahi demo dengan data contoh</Link>
  </main>;
}
