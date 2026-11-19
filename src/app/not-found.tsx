import Link from "next/link";
export default function NotFound() {
  return (
    <div className="empty-state">
      <span className="state-symbol">404</span>
      <h1>Halaman tidak ditemukan</h1>
      <p>
        Tautan ini tidak tersedia. Kembali ke antrean untuk melanjutkan
        pendampingan.
      </p>
      <Link className="button primary" href="/">
        Kembali ke beranda
      </Link>
    </div>
  );
}
