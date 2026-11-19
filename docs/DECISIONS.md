# Catatan keputusan

## D001 — Stack mengikuti PRD · 19 November 2026

Next.js App Router, TypeScript, Supabase Postgres/Auth/RLS. npm dipakai karena tersedia di laptop dan cukup untuk satu aplikasi. Lockfile dikomit untuk instalasi konsisten. Versi aktual ada di `package.json`/`package-lock.json`; jangan memakai nomor versi dari percakapan lama.

## D002 — Setup terpisah dari implementasi MVP

Tahap ini menyiapkan project runnable, konektor SSR, domain helpers, quality checks, docs, dan skill. Tidak membuat akun/backend eksternal atau mengklaim fitur PRD selesai. Schema dan keamanan adalah F01, autentikasi F02.

## D003 — Status dan tanggal

Empat status tetap; hubungi hari ini adalah hasil pengelompokan. Follow-up berupa tanggal lokal lembaga. Helper menerima waktu acuan agar tes pergantian hari deterministik. Default rancangan zona: Asia/Jakarta, masih perlu konfirmasi tim pilot.

Tooling lint mengikuti ESLint 9 yang kompatibel dengan peer dependency plugin React, import, dan aksesibilitas dari `eslint-config-next` saat setup. ESLint 10 belum dipakai karena plugin tersebut belum menyatakan dukungannya; tinjau kembali saat memperbarui dependency.

## D004 — UI sederhana dan skill sebagai bantuan

UI awal berupa halaman fondasi dengan status yang jujur. Tema terang, system sans, token CSS, tanpa dependency komponen/animasi. Output pencarian skill bukan keputusan produk otomatis. UI MVP akan dibangun mengikuti antrean tindakan PRD.

## D005 — Skill disalin ke repository

Salinan lengkap di `.agents/skills`, tanpa symlink ke path laptop. Sumber lokal dan hash SKILL dicatat di manifest. Ponytail memakai versi plugin 5.3.2 ketika ada duplikat OpenCode. `.agents/skills` menjadi sumber project; `AGENTS.md` memberi rujukan lintas tool tanpa menggandakan seluruh direktori ke `.claude`/`.opencode`.

## D006 — Frontend dahulu sesuai referensi pengguna · 19 November 2026

Pengguna meminta seluruh tampilan dibuat dahulu dengan data dummy dan fokus HP. `public/image.png` menjadi acuan komponen, warna, radius, card, dan navigasi. Palet hijau fondasi diganti monokrom lembut. Spesifikasi aktif ada di `DESIGN_SYSTEM.md`; D004 menjelaskan tahap awal saja.

State demo memakai `useSyncExternalStore` dan localStorage, tanpa dependency state-management. Editor dirender setelah hidrasi store agar draf/versi tersimpan tidak tertimpa data awal SSR. Role, mutasi status, audit, dan transfer adalah simulasi satu LP3H; tidak membuktikan keamanan produksi. Tanggal acuan tetap 19 November 2026 agar contoh tidak menjadi kedaluwarsa saat dibuka nanti.

WhatsApp dan email hanya pratinjau internal. Nomor fiktif tidak dibuka di layanan eksternal. Clipboard tetap memakai browser dengan fallback instruksi salin manual. Lucide digunakan sebagai satu keluarga ikon garis; tidak menambah library animasi atau komponen.

Tes interaksi menggunakan Testing Library + jsdom untuk validasi, pilihan tugas, persistensi draf, pengiriman terpisah, retry, dan login simulasi. Perilaku native dialog/focus dan tata letak tidak dinilai melalui jsdom; pemeriksaan browser tetap task UI02.

## Keputusan terbuka sebelum pilot

| Keputusan                               | Penanggung jawab yang perlu memutuskan | Dampak                               |
| --------------------------------------- | -------------------------------------- | ------------------------------------ |
| LP3H peserta dan staf pilot             | Pemilik produk/LP3H                    | Akun, data yang boleh digunakan      |
| Zona waktu LP3H                         | Koordinator                            | Pengelompokan hari ini               |
| Masa simpan/penghapusan catatan         | Koordinator                            | Kebijakan retensi sebelum data nyata |
| Hosting/paket dan wilayah data          | Pemilik produk/tim                     | Biaya, operasional, deployment       |
| Harga uji coba dan baseline waktu kerja | Pemilik produk                         | Evaluasi manfaat/pembayaran          |

Jika ada keputusan baru, tambahkan entri berisi konteks, pilihan, alasan, dan konsekuensi; jangan membiarkan keputusan hanya berada di chat.
