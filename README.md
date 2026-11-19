# TuntasHalal

Alat tindak lanjut revisi sertifikasi halal Self Declare untuk Pendamping PPH dan koordinator LP3H. Pengiriman dan balasan berlangsung di WhatsApp; pembaruan resmi tetap dilakukan di kanal resmi.

**Status: prototipe frontend lengkap dengan data dummy, belum MVP backend.** Desain mobile mengikuti [referensi pengguna](public/image.png): card abu-abu membulat, aksi hitam, badge pastel, dan navigasi bawah mengambang. Lihat [status terbaru](docs/PROJECT_STATUS.md).

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

## Mulai sesi coding

Baca [AGENTS.md](AGENTS.md), [PRD](docs/PRD_Pelacak_Revisi_Halal.md), [status](docs/PROJECT_STATUS.md), dan [backlog](docs/BACKLOG.md). Ambil satu irisan fitur. [Panduan vibe coding](docs/VIBE_CODING.md) berisi prompt awal dan format handoff.

Dokumentasi lengkap ada di [indeks docs](docs/README.md). Skill lokal tersedia di `.agents/skills`, termasuk UI UX Pro Max, Ponytail, dan skill desain lain; lihat [daftarnya](docs/SKILLS.md).
