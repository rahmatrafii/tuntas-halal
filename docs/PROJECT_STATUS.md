# Status project

**Diperbarui: 19 November 2026 · UI01, prototipe frontend dengan data dummy.**

## Sudah tersedia

- Seluruh delapan kelompok tampilan yang diminta, dengan fokus HP dan desain dari `public/image.png`.
- Login undangan dan pemilihan akun contoh, antrean/pencarian/filter, kontak/kasus/tugas, detail/progres/riwayat, draf WhatsApp, status/tanggal, koordinator/transfer, serta kondisi kosong/loading/error/akses terbatas/konflik.
- Form tambah dan ubah kontak, buat dan ubah kasus, tambah dan ubah revisi. Nomor ganda dikonfirmasi sebagai usaha berbeda.
- Store browser dengan localStorage, sinkronisasi tab, penolakan versi tugas usang, ID simpan stabil, draf tersimpan, dan input tetap tersedia saat gagal simpan.
- Pengiriman hanya mengubah tugas yang dipilih setelah konfirmasi. Buka WhatsApp adalah pratinjau internal; email juga tidak dikirim.
- Data fiktif: satu LP3H, tiga pendamping, satu koordinator, enam kontak, tujuh kasus, sebelas tugas awal. Tanggal acuan 19 November 2026 WIB.
- Next.js 16.4.6, React 19, TypeScript strict, Tailwind 4, Lucide, npm lockfile. SDK Supabase fondasi tetap tersedia tetapi UI demo tidak memakai backend.
- Dokumentasi desain, sistem token, panduan demo, arsitektur, backlog, testing, dan handoff diperbarui. 20 skill lokal tetap tersedia.

## Verifikasi sesi frontend

| Pemeriksaan | Hasil |
|---|---|
| `npm run check` | Lulus: lint, TypeScript, 24/24 tes (13 domain/logika dan 11 interaksi DOM) |
| `npm run build` | Lulus: build produksi seluruh route |
| Smoke HTTP produksi | Lulus: 15 route HTTP 200, shell Indonesia, CSS terkompilasi, gambar referensi tersedia |
| `npm run skills:verify` | Lulus: integritas 20 skill |
| Tautan Markdown lokal | Lulus |
| Kontras token utama | Lulus: teks sekunder/status pada latar masing-masing ≥ 4,5:1; bukan audit semua pixel |
| Dev HTTP | Server pengguna di `http://localhost:3000` tersedia; tidak dihentikan |
| Browser/screenshot/mobile nyata | Belum diuji. Kontrol browser dihentikan karena URL Chrome tidak dapat dipastikan oleh alat |
| Supabase/Auth/RLS | Belum dibuat atau diuji untuk data bisnis |

Tes interaksi memakai jsdom dengan modal native yang dimock. Hasil ini tidak membuktikan layout 375px, safe area, keyboard HP, atau fokus native dialog. UI02 tetap terbuka.

## Batas tahap ini

Ini prototipe frontend, bukan MVP produksi. Autentikasi nyata, undangan staf, schema/migrasi, RLS lintas LP3H, audit/transaksi database, dan concurrency multi-user belum diimplementasikan. Simulasi role di browser bukan lapisan keamanan. Jangan memasukkan data pribadi atau data pilot.

Tidak ada deployment, akun eksternal, email, atau pesan WhatsApp yang dikirim. Repository GitHub project: `https://github.com/rahmatrafii/tuntas-halal`, branch utama `main`. Commit awal mencakup frontend dummy, dokumentasi, dan skill project; file environment lokal, dependency terpasang, serta hasil build dikecualikan dari Git.

## Melanjutkan pekerjaan

1. Coba alur melalui `FRONTEND_DEMO.md`; mulai dari `/` atau `/login`.
2. Selesaikan UI02 saat akses browser/perangkat sah tersedia: screenshot 375px/390px, tablet/desktop, zoom 200%, keyboard, native modal, dan review kesesuaian referensi.
3. Pertahankan frontend dummy sampai pengguna meminta fase backend. Saat diminta, lanjut F01/F02 sesuai `DATA_MODEL.md` dan `BACKLOG.md` tanpa mengubah kontrak UX.

Keputusan pilot tetap terbuka: LP3H nyata, zona waktu final, retensi, hosting, dan harga. Spesifikasi produk tetap bersumber dari PRD; sistem desain aktif dari `DESIGN_SYSTEM.md`.
