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

## D007 — Fondasi database lokal dan mutasi terbatas · 21 November 2026

Pengguna menyetujui rancangan F01. Supabase CLI 3.2.0 dipin; pengembangan dan fixture Auth memakai Docker lokal, terpisah dari `.env.local` cloud. Wrapper `npm run db:*` memverifikasi endpoint loopback dan menahan output key. Penerapan cloud dilaporkan sebagai langkah terpisah; F01 selesai berdasarkan reset, tes SQL/sesi nyata, tipe generated, check, dan build lokal.

Enam tabel bisnis public mempertahankan model PRD. SELECT melalui RLS; delapan RPC terbatas menangani tulisan, tanpa grants tulis tabel untuk authenticated. Membership/organisasi diprovision admin. Schema private menyimpan helper dan receipt `(actor_id, request_id)` berupa hash payload serta ID/versi hasil minimum, tanpa instruksi atau pesan. Hak akses saat ini diperiksa sebelum receipt, sehingga retry lama tidak memulihkan akses setelah transfer.

Kontak/kasus/tugas memiliki versi. Mutasi tugas dan transfer mengunci kasus induk; operasi kontak mengunci pemilik/LP3H sebelum baris agar pemeriksaan duplikat dan retry tidak deadlock. Status/audit dan batch bersifat atomik. SQLSTATE `40001` menyatakan versi usang, `42501` akses, dan `22023` input/konflik payload. Pemanggil aplikasi kelak menampilkan data terbaru dan mempertahankan input saat gagal.

Koreksi manual tetap menerima keempat status. Perpindahan baru ke completed membutuhkan konfirmasi pemeriksaan/pembaruan resmi; aplikasi tidak memverifikasi SIHALAL. Audit hanya metadata dan versi; actor signed-in dari `auth.uid()`, actor null diperbolehkan untuk operasi administratif. Trim database mengikuti whitespace JavaScript agar instruksi tab/newline/Unicode kosong ditolak seperti frontend.

RPC di F01 membuktikan batas tulis, bukan menyelesaikan alur F03–F08. Login/sesi aplikasi tetap F02, UI bisnis tetap demo, dan kebijakan retensi/operasional harus ditetapkan sebelum pilot.

## D008 — Area staf terpisah, cloud development dan konflik HTTP · 21 November 2026

Pengguna menyetujui F02 di area `/staf`, sementara route bisnis dan `/login` tetap demo. Identitas nyata tidak dipetakan ke staf fiktif. JWT diverifikasi oleh SDK, membership aktif dibaca dari database setiap request; beberapa membership ditampilkan tanpa memilih tenant. Halaman/operasi melakukan guard sendiri, proxy refresh/redirect mempertahankan cookie/cache headers. APP_URL hanya origin tepercaya; callback tidak menerima redirect eksternal.

Lima migrasi diterapkan pada target cloud yang cocok persis dengan `.env.local`, `tuntas-halal-dev`, setelah preflight dan dry run. RLS/grants/RPC/private receipts dan penolakan anonymous diverifikasi; semua fixture multi-user/email tetap lokal. SMTP cloud tidak diubah. API menolak perubahan template pada free/default email provider, sehingga F02C memerlukan konfigurasi SMTP khusus dan uji penerima yang diizinkan. Tidak membeli paket atau mengundang staf nyata pada sesi ini.

Menggantikan bagian kode konflik D007: konflik versi memakai `PT409` yang dipetakan ke HTTP 409. PostgREST 14 mengulang SQLSTATE `40001` sebagai serialization failure sampai timeout; ini terbukti pada suite concurrency setelah stack mengikuti versi cloud. Migrasi 005 hanya mengganti helper bersama, tanpa menyunting migrasi terpasang atau mengubah aturan versi/audit/idempotency. Sumber: [Supabase troubleshooting](https://supabase.com/kb/troubleshooting/high-cpu-and-infinite-transaction-retries-when-using-custom-error-codes-in-rpc-functions-77326b).

Email fiktif F02 ditangkap Mailpit; Next test memiliki build directory sendiri. Harness memeriksa port dan readiness child miliknya, serta hanya mengeluarkan boolean saat membandingkan credential. Secret runtime tetap di memori; APP_URL non-secret ditambahkan ke env lokal tanpa mengganti key/URL pengguna.

## D009 — Kontak dan kasus staf bertahap · 21 November 2026

Pengguna menyetujui F03 di `/staf/lembaga/[organizationId]`, mempertahankan route demo lama. Pilihan LP3H eksplisit dari membership aktif, tanpa tenant otomatis atau pemetaan identitas demo. Query memakai client pengguna/RLS dan filter organisasi; empat RPC F01 menangani mutasi. Koordinator read-only, kontak pindahan tidak menjadi milik assignee baru, dan update kasus hanya nomor pengajuan. Tidak perlu migrasi atau dependency tambahan.

Kontak baru disimpan terpisah sebelum kasus, sehingga kegagalan kasus tidak menghapus kontak atau memerlukan transaksi gabungan baru. Pemilih kontak dipaginasi dan semua kontak sendiri tetap bisa dipilih. Profil staf lain belum tersedia: label “Anda”/“Pendamping lain” dipakai secara jujur, tanpa akses administratif `auth.users`.

Form memiliki UUID resource/seed acak stabil; request UUID diturunkan dari operation/payload/version ternormalisasi. Versi yang ditinjau dan konfirmasi duplikat adalah bagian intent, bukan sekadar notice UI: keduanya dipertahankan melewati error native/transport. Request pada resource yang sudah ada mencapai RPC receipt sebelum preflight duplikat. Konflik perlu peninjauan eksplisit. Error transport ditangkap setelah hidrasi sambil mempertahankan metadata native Server Action untuk progressive enhancement.

Implementasi langsung di sesi ini dengan TDD dan review independen akhir; branch/check-out yang berisi F01/F02 dipertahankan tanpa commit/push sesuai rancangan yang disetujui. Dampaknya review memakai file terkait, bukan commit range F03 yang bersih. Catatan kerja tidak dihapus sebelum tersedia Git history. Review bukan audit ulang seluruh F01/F02; regresi SQL/Auth tetap dijalankan. Pemeriksaan final dijalankan parent, tidak diulang reviewer. Tidak ada minor ditunda setelah temuan announcement dinaikkan menjadi penting karena memengaruhi pemahaman hasil simpan.

Bukti dibatasi HTTP/database lokal dan DOM. Browser/hidrasi/perangkat/assistive technology aktual, pemutusan koneksi sesudah commit pada jaringan browser nyata, penggunaan bisnis cloud, hosting/email live, serta beban produksi besar belum dibuktikan. Untuk lost response, bukti berupa retry committed/readback HTTP serta simulasi transport/identitas request DOM/service. Batas tersebut tetap gerbang tersendiri, tanpa menambah fixture cloud atau mengklaim siap pilot.

## D010 — Revisi staf instruction-only · 21 November 2026

Pengguna menyetujui rancangan F04: daftar/tambah/ubah instruksi di kasus staf, maksimal 2.000 karakter, tanpa memperluas F05/F06. `create_task` dipakai kembali. Satu RPC additive `update_task_instruction` menghindari payload status/tanggal pada edit; alternatif memakai `update_task` membutuhkan snapshot server tambahan agar retry aman. RPC baru mengunci akses sebelum receipt dan versi, lalu hanya mengubah instruksi. Audit/versi tetap memakai trigger F01. Migrasi 006 diterapkan lokal tanpa reset, tipe diregenerasi; penerapan cloud terpisah.

Form mengikuti F03 dengan UUID resource/seed stabil, key request dari payload kanonik dan peninjauan konflik eksplisit. HTTP mengungkap perbedaan baris baru CRLF native versus LF hydrated; normalisasi ke LF dilakukan sebelum validasi panjang dan hash, dengan input gagal tetap tersedia. Regresi diamati RED→GREEN. Koordinator hanya membaca; assignee kasus pindahan boleh mengelola revisi tanpa menjadi pemilik kontak.

Check 74 tes, 128 SQL/concurrency, HTTP F03/F04/Auth dan build lulus. Review independen tidak menemukan masalah pada cakupan kode yang dibaca. Tidak ada migrasi/fixture cloud baru, email eksternal/WhatsApp, deploy, commit/push, maupun bukti browser/perangkat tambahan.

## D011 — Draf staf di browser dan ekspor read-only · 21 November 2026

Pengguna memilih draf per akun/LP3H/kasus di browser dan menyetujui rancangan F05. Database lintas perangkat tidak ditambahkan. Namespace storage terpisah dari demo; hanya payload pesan/pilihan/snapshot minimal disimpan, bukan token atau objek bisnis lengkap. Pesan tersimpan, termasuk kosong, mengalahkan seed URL; perubahan pilihan/data tidak menimpa suntingan tanpa keputusan. Konflik tab ditahan dengan pengecekan nilai mentah dan event storage, tanpa klaim CAS atomik.

Setiap compose/ekspor memverifikasi sesi/RLS, assignee, seluruh tugas dan kontak terkini. Tidak menulis tabel, versi atau audit. Clipboard gagal memakai fallback manual; pesan 64.000 karakter dan ambang URL ter-encode 8.000 adalah kebijakan aplikasi. Pesan panjang disalin lengkap dan chat dibuka tanpa teks. Native POST fallback memvalidasi ulang sebelum redirect, dengan editor terkunci saat pending; review menemukan race ini dan regresi membuktikan perbaikan RED→GREEN. F06 konfirmasi/status tetap terpisah.

Tidak mengubah demo, schema/dependency/Auth atau cloud. Implementasi memakai bukti lokal service/storage/DOM/HTTP; perangkat/clipboard/WhatsApp dan F05 cloud belum dibuktikan. Panduan operasional ada di [STAFF_DRAFTS.md](STAFF_DRAFTS.md).

## Keputusan terbuka sebelum pilot

| Keputusan                               | Penanggung jawab yang perlu memutuskan | Dampak                               |
| --------------------------------------- | -------------------------------------- | ------------------------------------ |
| LP3H peserta dan staf pilot             | Pemilik produk/LP3H                    | Akun, data yang boleh digunakan      |
| Zona waktu LP3H                         | Koordinator                            | Pengelompokan hari ini               |
| Masa simpan/penghapusan catatan         | Koordinator                            | Kebijakan retensi sebelum data nyata |
| Hosting/paket dan wilayah data          | Pemilik produk/tim                     | Biaya, operasional, deployment       |
| Harga uji coba dan baseline waktu kerja | Pemilik produk                         | Evaluasi manfaat/pembayaran          |

Jika ada keputusan baru, tambahkan entri berisi konteks, pilihan, alasan, dan konsekuensi; jangan membiarkan keputusan hanya berada di chat.
