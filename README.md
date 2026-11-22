# TuntasHalal

Alat tindak lanjut revisi sertifikasi halal Self Declare untuk Pendamping PPH dan koordinator LP3H. Pengiriman dan balasan berlangsung di WhatsApp; pembaruan resmi tetap dilakukan di kanal resmi.

**Status: demo terpisah, fondasi staf F01–F04 dan F05; belum MVP produksi.** `/staf/login` dan `/staf` menyediakan Auth/sesi nyata. Area `/staf/lembaga/[organizationId]` menyediakan kontak/kasus/revisi dengan akses per LP3H dan RPC/RLS. Migrasi 006 sudah diterapkan lokal dan cloud development. F05 menyediakan draf browser per akun dan validasi server sebelum salin/buka WhatsApp, tanpa perubahan status. Konfirmasi/status tetap F06. Sesi cloud F05 lulus HTTP; bukti browser/HP dan WhatsApp nyata belum tersedia. Lihat [panduan staf](docs/STAFF_CASELOAD.md), [panduan draf](docs/STAFF_DRAFTS.md), [laporan cloud](docs/F05_CLOUD_VERIFICATION.md), dan [status terbaru](docs/PROJECT_STATUS.md).

## Menjalankan lokal

Prasyarat: Node.js 24 LTS dan npm. Gunakan versi dalam `.node-version`.

```powershell
npm ci
if (-not (Test-Path .env.local)) { Copy-Item .env.example .env.local }
npm run dev
```

Buka http://localhost:3000. Demo langsung memakai akun Nadia (pendamping). Lewat **Akun**, Anda dapat beralih ke Ratna (koordinator), Farhan, atau Ayu. Halaman `/login` memperlihatkan alur masuk staf undangan. Seluruh demo berjalan tanpa kredensial Supabase.

## Tampilan dan interaksi

- `/`: antrean revisi, pencarian, filter status dan pendamping.
- `/login`: simulasi email undangan dan akun contoh; tidak mengirim email.
- `/kasus`, `/kasus/baru`, `/kasus/[id]`, `/kasus/[id]/edit`: daftar, pembuatan, detail, progres tugas, riwayat, pengalihan pendamping.
- `/kontak`, `/kontak/baru`, `/kontak/[id]/edit`: kontak tersimpan, tambah, koreksi nomor, deteksi nomor ganda.
- `/revisi/baru`, `/revisi/[id]`: tambah/ubah tugas, status per revisi, tanggal tindak lanjut.
- `/kasus/[id]/pesan`: pilih tugas, sunting/salin draf, pratinjau chat, konfirmasi pengiriman terpisah.
- `/tim`, `/akun`, `/kondisi`: koordinator, pergantian akun/reset demo, keadaan kosong/loading/error/akses terbatas/konflik.

Perubahan disimpan di localStorage browser. Tanggal acuan demo adalah **19 November 2026, WIB**, agar contoh antrean tetap konsisten. **Buka WhatsApp** membuka pratinjau internal: tidak menghubungi nomor contoh atau mengirim pesan. Gunakan menu Atur ulang data contoh untuk kembali ke awal.

```powershell
npm run check
npm run build
npm start
```

`check` menjalankan lint, typecheck, serta tes domain dan interaksi DOM. `build` memeriksa build produksi. `.env.local` tidak masuk Git. Jangan gunakan service-role key pada variabel `NEXT_PUBLIC_*`. Simulasi role/akses di browser bukan pengamanan data; backend/RLS wajib sebelum data nyata.

Catatan tooling: ESLint 9 masih dipakai untuk kompatibilitas plugin bawaan Next.js; npm menampilkan peringatan deprecation. Alasannya dicatat di [keputusan teknis](docs/DECISIONS.md).

## Database lokal F01

Dengan Docker Desktop engine Linux aktif:

```powershell
npm run db:start
npm run db:reset
npm run db:test
npm run db:auth:test
npm run db:types
```

CLI Supabase 3.2.0 dipin. Reset menghapus data stack lokal disposable. `db:test` memakai fixture Auth tanpa email; `db:auth:test` menangkap email fiktif di Mailpit. `npm run db:caseload:test` menguji form native kontak/kasus dengan Auth/database lokal. Kedua suite HTTP memakai child Next port 3150 secara bergantian. Wrapper menolak endpoint cloud, tidak memuat `.env.local`, dan tidak mencetak key. Jalankan suite relevan, `check`, dan build untuk perubahan backend. Lihat [setup Supabase](docs/SUPABASE.md), [Auth/provisioning](docs/STAFF_AUTH.md), dan [pengujian](docs/TESTING.md).

## Mulai sesi coding

Baca [AGENTS.md](AGENTS.md), [PRD](docs/PRD_Pelacak_Revisi_Halal.md), [status](docs/PROJECT_STATUS.md), dan [backlog](docs/BACKLOG.md). Ambil satu irisan fitur. [Panduan vibe coding](docs/VIBE_CODING.md) berisi prompt awal dan format handoff.

Dokumentasi lengkap ada di [indeks docs](docs/README.md). Skill lokal tersedia di `.agents/skills`, termasuk UI UX Pro Max, Ponytail, dan skill desain lain; lihat [daftarnya](docs/SKILLS.md).
