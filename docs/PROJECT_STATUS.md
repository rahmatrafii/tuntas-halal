# Status project

**Diperbarui: 21 November 2026 · Frontend dummy UI01, perbaikan draf UI03, dan tooling Superpowers.**

## Sudah tersedia

- Seluruh delapan kelompok tampilan yang diminta, dengan fokus HP dan desain dari `public/image.png`.
- Login undangan dan pemilihan akun contoh, antrean/pencarian/filter, kontak/kasus/tugas, detail/progres/riwayat, draf WhatsApp, status/tanggal, koordinator/transfer, serta kondisi kosong/loading/error/akses terbatas/konflik.
- Form tambah dan ubah kontak, buat dan ubah kasus, tambah dan ubah revisi. Nomor ganda dikonfirmasi sebagai usaha berbeda.
- Store browser dengan localStorage, sinkronisasi tab, penolakan versi tugas usang, ID simpan stabil, draf tersimpan, dan input tetap tersedia saat gagal simpan.
- Pengiriman hanya mengubah tugas yang dipilih setelah konfirmasi. Buka WhatsApp adalah pratinjau internal; email juga tidak dikirim.
- Data fiktif: satu LP3H, tiga pendamping, satu koordinator, enam kontak, tujuh kasus, sebelas tugas awal. Tanggal acuan 19 November 2026 WIB.
- Next.js 16.4.6, React 19, TypeScript strict, Tailwind 4, Lucide, npm lockfile. SDK Supabase fondasi tetap tersedia tetapi UI demo tidak memakai backend.
- Dokumentasi desain, sistem token, panduan demo, arsitektur, backlog, testing, dan handoff diperbarui. 29 skill lokal tersedia setelah enam skill dikeluarkan; seluruh 15 skill Superpowers tetap disertakan.

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

## UI03 — Pemulihan draf setelah reload, 21 November 2026

- Penyebab terverifikasi: URL dari detail tugas membawa `?pilih=...`. Inisialisasi editor mengutamakan parameter tersebut atas draf tersimpan, sehingga pesan disusun ulang walaupun data lama masih ada di localStorage.
- Perbaikan terbatas pada inisialisasi `draft-screen.tsx`: pesan dan pilihan revisi dari draf kasus dipulihkan lebih dahulu. Parameter URL tetap memilih tugas saat belum ada draf. Pemeriksaan akses, instruksi, status tugas, dan backend tidak diubah.
- Dua tes regresi diamati gagal sebelum perubahan dan lulus sesudahnya: sunting/pilih tugas lalu buka ulang tautan yang sama; store baru membaca draf dari localStorage tanpa mengubah data tersimpan.
- `npm run check` lulus: lint, TypeScript, dan 26/26 tes. `npm run build` lulus. Review terpisah tidak menemukan masalah pada perubahan. Peringatan React/jsdom tentang `<search>` tetap muncul pada tes antrean.
- Uji browser langsung tidak tersedia karena host akses browser tidak tersedia. Bukti reload terbatas pada DOM/store; UI02 dan F01–F09 tetap terbuka.

## Tooling Superpowers — 21 November 2026

- Plugin resmi `superpowers@openai-curated-remote` 7.0.1 terpasang untuk pengguna Windows ini; CLI melaporkan `installed: true` dan `enabled: true`.
- 15 skill beserta file pendukung dan metadata marketplace tersedia di `.agents/skills`; lisensi, asal, dan hash dicatat. Lihat `SKILLS.md`.
- `npm run skills:sync` mempertahankan catatan skill dari sumber opsional yang tidak tersedia; `npm run skills:verify` lulus untuk 35 skill.
- Pemeriksaan salinan: 20 skill awal tidak berubah; 15 skill baru identik dengan paket marketplace (99 file). Uji fixture lulus untuk sumber yang tidak tersedia, sync berulang yang idempoten, dan penolakan konflik tanpa menimpa file/manifest.
- `npm run check` lulus: lint, TypeScript, dan 24/24 tes. `npm run build` lulus. Tes DOM memunculkan peringatan React/jsdom tentang elemen `<search>`; tidak ada tes gagal.
- Pemasangan ini hanya menambah tooling. UI02 dan F01–F09 tetap terbuka. Untuk pemakaian berikutnya, mulai chat baru agar daftar skill diperbarui.

## Perapihan skill — 21 November 2026

- Sesuai instruksi pengguna, `banner-design`, `slides`, `brand`, `design`, `ponytail-gain`, dan `ponytail-help` dikeluarkan dari project; tersisa 29 skill.
- Folder dipindahkan ke `~/.codex/skill-archives/sihalal/2026-11-21-excluded-skills`; instalasi personal tetap disimpan. Daftar pengecualian pada script sync mencegah keenamnya ditambahkan kembali.
- Manifest dan panduan skill diperbarui; sync, verifikasi integritas 29 skill, dan lint lulus. Uji fixture membuktikan manifest usang dibersihkan, enam skill tidak disalin kembali, dan sync berulang tetap idempoten. Hash arsip dan instalasi personal cocok dengan salinan semula. Kode aplikasi serta perbaikan draf tetap dipertahankan; build aplikasi tidak diulang untuk perapihan tooling ini.

## Batas tahap ini

Ini prototipe frontend, bukan MVP produksi. Autentikasi nyata, undangan staf, schema/migrasi, RLS lintas LP3H, audit/transaksi database, dan concurrency multi-user belum diimplementasikan. Simulasi role di browser bukan lapisan keamanan. Jangan memasukkan data pribadi atau data pilot.

Tidak ada deployment, akun eksternal, email, atau pesan WhatsApp yang dikirim. Repository GitHub project: `https://github.com/rahmatrafii/tuntas-halal`, branch utama `main`. Commit awal mencakup frontend dummy, dokumentasi, dan skill project; file environment lokal, dependency terpasang, serta hasil build dikecualikan dari Git.

## Melanjutkan pekerjaan

1. Coba alur melalui `FRONTEND_DEMO.md`; mulai dari `/` atau `/login`.
2. Selesaikan UI02 saat akses browser/perangkat sah tersedia: screenshot 375px/390px, tablet/desktop, zoom 200%, keyboard, native modal, dan review kesesuaian referensi.
3. Pertahankan frontend dummy sampai pengguna meminta fase backend. Saat diminta, lanjut F01/F02 sesuai `DATA_MODEL.md` dan `BACKLOG.md` tanpa mengubah kontrak UX.

Keputusan pilot tetap terbuka: LP3H nyata, zona waktu final, retensi, hosting, dan harga. Spesifikasi produk tetap bersumber dari PRD; sistem desain aktif dari `DESIGN_SYSTEM.md`.
