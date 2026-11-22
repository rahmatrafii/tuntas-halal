# F01 — Fondasi database dan batas akses

**Status: disetujui pengguna dan diimplementasikan secara lokal pada 21 November 2026. Penerapan cloud terpisah dan belum dilakukan.**

## Tujuan dan sumber kebutuhan

Menyiapkan database bisnis Pelacak Revisi Halal agar akses benar-benar dibatasi oleh identitas, keanggotaan aktif, LP3H, peran, dan penugasan. F01 menyediakan migrasi, kebijakan database, operasi tulis minimum untuk menguji batas akses, fixture fiktif, tes database, dan tipe TypeScript dari schema aktual.

Kebutuhan mengikuti [PRD](../../PRD_Pelacak_Revisi_Halal.md), [model data](../../DATA_MODEL.md), [arsitektur](../../ARCHITECTURE.md), dan F01 pada [backlog](../../BACKLOG.md). Stack tetap Next.js, TypeScript, dan Supabase Postgres/Auth/RLS.

## Kondisi sebelum implementasi

- Project Supabase development dibuat oleh pengguna; `.env.local` berisi URL HTTPS dan publishable key dengan format yang sesuai.
- Endpoint Auth menerima konfigurasi tersebut. Pendaftaran publik nonaktif, login anonim nonaktif, dan provider email aktif. Pemeriksaan ini belum membuktikan schema bisnis atau RLS benar.
- Repository belum mempunyai migrasi bisnis, konfigurasi CLI, seed, atau tipe database generated.
- Docker CLI terpasang; kesiapan engine harus diperiksa sebelum tes lokal dijalankan.
- Supabase CLI belum menjadi dependency project. Versi stabil yang ditemukan saat persiapan adalah `3.2.0`; versi yang dipasang harus dipin dan masuk lockfile.
- Plugin Supabase tersedia, tetapi belum ada koneksi akun yang terkonfirmasi. Publishable key tidak memberikan akses administratif untuk menerapkan migrasi.

Tidak ada URL project, key, password, token, atau data pribadi yang disimpan dalam dokumen ini.

## Pendekatan

Rekomendasi: gunakan Supabase lokal melalui Docker untuk mengembangkan migrasi dan menjalankan tes yang dapat diulang. Setelah seluruh pemeriksaan lulus, migrasi yang sama dapat diterapkan ke project cloud development milik pengguna. Konfigurasi cloud pada `.env.local` tetap dipisahkan dari kredensial lokal untuk tes.

Alternatif menjalankan seluruh tes pada database cloud tidak dipilih sebagai default karena reset, fixture Auth, dan tes concurrency akan bergantung pada database jarak jauh. Cloud tetap menjadi target development yang telah dibuat pengguna.

Reset dan seed hanya dijalankan pada lingkungan lokal disposable. Penerapan cloud harus memakai target yang cocok dengan project dalam konfigurasi pengguna, melalui koneksi administratif yang sah, dan tanpa reset atau seed akun uji ke cloud.

## Cakupan implementasi

### Schema dan constraint

Enam tabel mengikuti `DATA_MODEL.md`: `organizations`, `memberships`, `business_contacts`, `cases`, `revision_tasks`, dan `audit_events`. Tidak ada tabel pesan, dokumen resmi, atau draf WhatsApp baru.

- Membership terikat ke Supabase Auth dan lembaga; role hanya `companion` dan `coordinator`. Aplikasi tidak menyediakan eskalasi role atau pengaktifan membership mandiri.
- Hubungan kontak, kasus, dan penanggung jawab harus satu LP3H. Penanggung jawab baru harus pendamping aktif pada LP3H tersebut.
- Instruksi tugas tidak boleh kosong setelah trim. Status hanya empat nilai PRD. Versi harus positif dan meningkat pada mutasi yang relevan.
- Follow-up menggunakan `date`; waktu kejadian menggunakan `timestamptz` dari database. Zona waktu lembaga divalidasi sebagai zona IANA.
- Nomor kontak dinormalisasi dan diindeks, tetapi tidak dibuat unik karena satu nomor boleh mewakili beberapa usaha.
- Ketuntasan kasus dihitung dari tugas: minimal satu tugas dan semuanya selesai. Tidak menambahkan boolean tersimpan yang dapat tidak sinkron.

### Grants, RLS, dan operasi tulis

Pengaturan yang direkomendasikan saat membuat project adalah menonaktifkan izin API otomatis kepada tabel baru; kondisi grants cloud belum diperiksa melalui akses administratif. Migrasi harus menegakkan grants yang diperlukan secara eksplisit dan mengaktifkan RLS secara eksplisit, tanpa bergantung pada preset dashboard atau stack lokal.

- `anon` tidak memperoleh akses ke data bisnis.
- Pengguna terautentikasi dapat membaca data sesuai matriks pada `DATA_MODEL.md`; membership aktif diperiksa pada setiap akses.
- Pendamping membaca kasus yang ditugaskan kepadanya. Akses kontak milik sendiri atau kontak kasus pindahan tidak membuka kasus lain yang memakai kontak tersebut.
- Koordinator membaca data lembaganya dan dapat mentransfer kasus. Peran ini tidak memperoleh hak mengedit instruksi atau status tugas.
- Writes bisnis dilakukan melalui RPC terbatas yang memeriksa identitas, membership, tenant, peran, dan penugasan di database. Hindari grants tulis umum yang memungkinkan client melewati aturan tersebut.
- Schema helper tidak diekspos melalui Data API. Bila memakai `SECURITY DEFINER`, fungsi memverifikasi `auth.uid()`, menetapkan `search_path` aman, menggunakan nama objek lengkap, dan membatasi EXECUTE. Helper tidak boleh menyebabkan rekursi kebijakan RLS.
- Membership dan lembaga diprovision melalui jalur administratif. F01 memakai fixture lokal; antarmuka administrasi atau undangan staf berada di F02.

RPC minimum mencakup pembuatan/ubah kontak milik pendamping, pembuatan/ubah metadata kasus yang ditugaskan, pembuatan/ubah tugas, perubahan status/tanggal tugas yang dipilih, dan transfer kasus. Implementer menentukan signature terkecil yang memenuhi kontrak `DATA_MODEL.md`; tidak membangun API HTTP tambahan atau abstraksi CRUD generik.

RPC ini diperlukan agar F01 dapat membuktikan akses baca **dan** tulis. F03–F08 tetap mencakup validasi/alur server dan integrasi frontend masing-masing; keberadaan RPC tidak menyelesaikan task tersebut.

### Perpindahan status dan konfirmasi

Rancangan mempertahankan perilaku koreksi manual dari `TaskEditor` dan `changeTasks` pada demo: pendamping yang berhak dapat memilih salah satu dari empat status, termasuk mengoreksi status ke tahap lain. Tidak menambahkan urutan perpindahan baru yang membatasi kontrak UI tanpa keputusan produk.

Setiap perpindahan dari status belum selesai menjadi `completed` memerlukan konfirmasi eksplisit bahwa koreksi telah diperiksa dan pembaruan resmi yang diperlukan telah dilakukan. RPC menerima dan memvalidasi konfirmasi tersebut, termasuk untuk penyelesaian langsung dari `needs_sending` atau `awaiting_reply`. Keberadaan konfirmasi adalah pernyataan pengguna; aplikasi tidak memverifikasi SIHALAL secara otomatis. Mempertahankan tugas yang sudah `completed` tidak meminta konfirmasi penyelesaian ulang.

Koreksi/undo menetapkan status tujuan yang dipilih pengguna dan menghasilkan peristiwa baru; tidak menghapus audit atau menebak status sebelumnya dari riwayat. Pengiriman dicatat untuk tugas yang dipilih melalui aksi konfirmasi/simpan; membuka draf, chat, atau menyalin pesan tidak memanggil mutasi status. Pembatasan alur tambahan, bila diperlukan kemudian, harus diputuskan eksplisit dan tidak disisipkan saat F01.

### Audit, retry, dan konflik

Status/transfer dan audit disimpan dalam transaksi yang sama. Audit bersifat append-only melalui jalur terpercaya; client tidak dapat membuat, mengubah, atau menghapus riwayat secara langsung. Payload riwayat dibatasi pada metadata peristiwa, status, tanggal tindak lanjut, dan penanggung jawab; tidak menyimpan pesan atau salinan instruksi/dokumen.

Create memakai UUID intent yang stabil. Retry dengan ID sama harus memeriksa kesamaan payload dan hak akses; ID yang sama dengan payload berbeda adalah konflik. Mutasi yang mengubah versi memeriksa expected version dan menolak versi usang. UUID/idempotency key untuk suatu intent harus dapat dipakai ulang saat retry, tanpa menghasilkan mutasi/audit ganda; implementer memilih penyimpanan metadata minimum yang diperlukan dan mendokumentasikannya.

Batch status hanya menerima tugas dari satu kasus. Semua pemeriksaan akses dan versi harus lulus sebelum ada perubahan; kegagalan satu tugas membatalkan seluruh batch. Nilai actor, owner, role, dan tenant dari client tidak dipercaya tanpa verifikasi database.

## Bukti pengujian

Fixture lokal menyediakan dua LP3H, pendamping dan koordinator pada masing-masing lembaga, satu anggota nonaktif, dan akses anonymous. Auth fixture bersifat lokal/fiktif dan tidak mengirim email. Satu kontak dipakai dua kasus; hanya satu kasus yang dipindahkan.

Tes harus membuktikan:

1. Anonymous, membership nonaktif, dan pengguna lintas LP3H tidak dapat membaca atau mengubah data.
2. Pendamping yang berhak dapat membuat dan mengubah datanya; mengganti ID actor/LP3H/owner/assignee tidak menembus akses.
3. Koordinator dapat membaca lembaganya dan melakukan transfer sah, tetapi ditolak ketika mengubah status/instruksi atau mentransfer lintas lembaga/ke staf nonaktif.
4. Setelah transfer, pendamping lama kehilangan akses kasus/tugas/audit pindahan. Pendamping baru memperoleh kontak yang diperlukan tanpa memperoleh kasus lain dari kontak tersebut.
5. Client tidak dapat menulis audit atau menaikkan role sendiri. Kegagalan mutasi mempertahankan data dan audit sebelumnya.
6. Retry intent tidak menggandakan hasil; payload berbeda ditolak. Dua sesi nyata dengan expected version sama menghasilkan satu sukses dan satu konflik.
7. Batch dengan tugas lintas kasus atau satu versi usang gagal seluruhnya. Audit konsisten dengan perubahan yang berhasil.
8. Empat status, tanggal kalender, normalisasi nomor, instruksi kosong, hubungan antar-lembaga, dan ketuntasan kasus mengikuti constraint/aturan PRD. Penyelesaian baru tanpa konfirmasi ditolak; penyelesaian terkonfirmasi dan koreksi manual mengikuti aturan status di atas.

Gunakan pgTAP untuk tes SQL/RLS. Uji concurrency/idempotency melalui dua koneksi atau dua client lokal nyata; manfaatkan SDK yang sudah terpasang bila cukup. Bootstrap/fixture administratif tidak menjadi identitas penguji akses: assertion harus berjalan sebagai role/session pengguna yang sedang diuji.

Reset lokal harus dapat membangun ulang schema dari migrasi. Generate `src/lib/supabase/database.types.ts` dari schema setelah tes lulus, lalu jalankan pemeriksaan aplikasi. Tidak menulis tipe yang berpura-pura generated.

## Hasil dan batas selesai

Hasil berupa dependency CLI yang dipin, konfigurasi lokal hasil CLI, migrasi SQL baru, fixture/tes database, perintah pengujian yang terdokumentasi, serta tipe generated. Nama dan susunan file SQL disesuaikan dengan hasil CLI dan kebutuhan urutan dependensi.

F01 baru ditandai selesai setelah tes SQL/RLS, concurrency/retry, reset lokal, generate tipe, `npm run check`, dan `npm run build` lulus. Penerapan cloud dilaporkan terpisah dari verifikasi lokal; keterbatasan akses atau engine tidak boleh diubah menjadi klaim selesai.

Frontend demo tetap dapat digunakan selama F01. Login nyata, undangan/email, integrasi layar, WhatsApp nyata, data pilot, deployment, serta perubahan desain berada di luar pekerjaan ini. UI02 dan F02–F09 tetap terbuka.

## Bukti implementasi lokal

Empat migrasi telah diterapkan dan dibangun ulang melalui `npm run db:reset`. Pemeriksaan akhir: 109 assertion SQL/RLS, satu skenario integrasi Auth nyata dengan dua sesi/concurrency, generate tipe public schema, `npm run check` (28 tes), `npm run build`, dan integritas 29 skill lulus. Review independen ditangani dengan regresi RED→GREEN untuk deadlock kontak dan whitespace kosong. Detail keputusan dan bukti ada di [ledger](../plans/2026-11-21-f01-foundation.md) dan [status project](../../PROJECT_STATUS.md).
