# Panduan agent — Pelacak Revisi Halal

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Mulai setiap sesi

1. Baca `docs/PROJECT_STATUS.md`, lalu `docs/PRD_Pelacak_Revisi_Halal.md`.
2. Baca `docs/ARCHITECTURE.md` dan dokumen terkait pekerjaan. Pilih satu task di `docs/BACKLOG.md`.
3. Periksa `git status --short`; jangan menimpa perubahan pengguna.
4. Pilih dan baca skill yang relevan dari `.agents/skills/<nama>/SKILL.md` secara otomatis sebelum tindakan teknis; pengguna tidak perlu menyebut nama skill. Ikuti aturan pemilihan di bawah.
5. Selesaikan satu irisan fitur sampai validasi, penanganan error, dan pemeriksaan aksesnya. Perbarui status dan handoff.

## Tahap saat ini: demo terpisah, fondasi F01–F04 dan F05 lokal

- F01 sudah diterapkan ke cloud development `tuntas-halal-dev`. F02 menyediakan login/sesi staf. F03 disetujui dan diimplementasikan bertahap pada `/staf/lembaga/[organizationId]`: kontak/kasus lewat client pengguna/RLS dan empat RPC F01, dengan LP3H eksplisit. Route bisnis lama tetap demo. Pengujian F03 hanya memakai fixture lokal; jangan mengundang staf atau mengirim email/WhatsApp nyata tanpa instruksi lanjutan.
- F02C development lulus: SMTP Mailtrap/template cloud tersedia, penerimaan email dikonfirmasi pengguna, dan HTTP aplikasi localhost dengan Auth cloud membuktikan callback, sesi/reload/refresh, akses terbatas tanpa membership, token satu kali, dan logout. Uji sesi memakai token Admin API tanpa email tambahan. Akun sementara sudah dihapus/readback; tidak ada membership/data bisnis ditulis. Izin tes terbatas pada uji yang diminta, bukan fixture/undangan tambahan. API mengembalikan hash `smtp_pass`: jangan pakai nilai GET sebagai password atau menulisnya kembali. Lihat `docs/STAFF_AUTH.md`. `APP_URL` development: `http://localhost:3000`.
- Bukti lokal tidak membuktikan target cloud development. Terapkan migrasi cloud hanya dengan koneksi administratif dan target terverifikasi; jangan reset atau menanam fixture akun tes ke cloud. `npm run db:*` khusus stack lokal dan tidak memakai `.env.local`.
- Acuan visual wajib `public/image.png` dan `docs/DESIGN_SYSTEM.md`: putih, card abu-abu besar, tombol hitam/pill, badge pastel, navigasi bawah mengambang. Jangan kembali ke palet hijau halaman fondasi.
- Prioritaskan HP: gutter 20px, kontrol minimal 48px, form 16px, safe area, ruang navigasi bawah. Desktop tetap responsif.
- `src/features/demo` berisi data, state browser, logika simulasi, dan layar. `localStorage` bukan otorisasi backend.
- Pertahankan empat status PRD, konfirmasi pengiriman terpisah, pilihan tugas per kasus, dan draft tersimpan. Data dummy memakai tanggal acuan `DEMO_TODAY`, bukan tanggal laptop yang berubah-ubah.
- F01/F02/F02C, F03 dan implementasi F04 lokal selesai. F04: daftar/tambah/ubah instruksi revisi staf, 74 tes aplikasi, HTTP F03/F04/Auth, 128 SQL/concurrency dan build lulus. Migrasi 006 instruction-only sudah diterapkan lokal dan cloud development, dengan body/grants/RLS/audit dan penolakan anonymous terverifikasi. Uji bisnis F04 bersesi cloud belum dilakukan; lihat `docs/F04_CLOUD_VERIFICATION.md`. F05–F09 dan UI02 tetap terbuka. Kontak pindahan hanya dapat dibaca, bukan diubah/dipakai untuk kasus baru oleh penerima, tetapi assignee dapat mengelola revisi kasus pindahan; koordinator hanya membaca. Profil staf lain belum tersedia, gunakan “Anda”/“Pendamping lain”. Lihat `docs/STAFF_CASELOAD.md`. Bukti HTTP tidak menggantikan uji browser/perangkat.
- Pengguna kemudian mengizinkan uji bisnis cloud F03 dan cleanup fixture. Skenario aplikasi localhost + Auth/database `tuntas-halal-dev` lulus, dan dua LP3H/empat akun beserta kontak/kasus/audit/receipt kembali bersih/readback. Guard audit dan RLS aktif. Tidak ada email atau fixture tersisa; izin tes tersebut tidak berlaku untuk fixture/undangan baru. Browser tetap terhalang `browser access host is unavailable`, sehingga UI02 belum lulus. Lihat `docs/F03_CLOUD_VERIFICATION.md`.
- F05 kemudian disetujui dan diimplementasikan lokal: draf browser per akun/LP3H/kasus, revalidasi sebelum ekspor, tanpa mutasi status/audit. Check 93 tes, HTTP F03–F05/Auth, 128 SQL/concurrency dan build lulus. Review pending fallback diperbaiki RED→GREEN. Tidak ada schema/dependency baru, cloud fixture atau pesan eksternal. Lihat `docs/STAFF_DRAFTS.md`; F05V/UI02 perangkat, F04/F05 bersesi cloud dan F06–F09 tetap terbuka. Status “F05 terbuka” pada catatan F04 di atas merupakan keadaan sesi sebelumnya.
- F05C kemudian lulus: atas permintaan pengguna, HTTP aplikasi localhost + Auth/database cloud membuktikan sesi/reload, F04 create/update instruksi, compose/validasi ekspor, read-only status/audit, konflik, tenant/peran/transfer/revocation. Dua LP3H/empat akun/24 tugas dan fixture terkait sudah dibersihkan; query terpisah nol, guard audit/RLS aktif. Tidak ada email/WhatsApp atau perubahan schema/config. Izin fixture run selesai; jangan mengulang tanpa instruksi baru. Pengguna memilih “Selesaikan cloud dahulu”; F05V/UI02 tetap terbuka karena host browser tidak tersedia dan HP memerlukan uji terpandu. Lihat `docs/F05_CLOUD_VERIFICATION.md`; catatan F05 cloud masih terbuka di paragraf sebelumnya adalah keadaan sebelum F05C.

## Preferensi review UI/UX pengguna

Untuk setiap chat tentang desain, portofolio, Figma, atau antarmuka, gunakan sudut pandang senior UI/UX designer. Beri penilaian yang jujur, langsung, dan profesional. Sebutkan yang sudah bekerja, jelaskan masalah yang terlihat serta dampaknya pada pengguna, dan prioritaskan perbaikan yang konkret. Bedakan hasil yang sudah terlihat atau teruji dari perkiraan. Jika diminta menilai saja, berikan review tanpa mengubah desain.

## Sumber keputusan

- **Fixture HP F05 sedang aktif:** pengguna kemudian meminta akun/kasus manual; `f05-hp-d979baca@example.com`, LP3H uji, kontak/kasus **Usaha Uji HP F05 / UJI-HP-F05**, dua revisi Perlu dikirim. Jangan reset, hapus sebelum pengguna selesai, atau menganggap cloud kosong seperti akhir F05C. Run dan cleanup terikat identitas di `docs/F05_HP_TEST.md`. Nomor kontak masih contoh; pengguna menggantinya langsung di aplikasi. Tidak ada email login baru atau hasil uji HP pada saat provisioning. Tidak boleh mencatat nomor pribadi ke repo/log/chat.

- PRD adalah sumber kebutuhan produk. Keputusan implementasi ada di `docs/DECISIONS.md`; jangan mengganti stack atau memperluas MVP diam-diam.
- Stack: Next.js App Router, TypeScript strict, Tailwind CSS, Supabase Postgres/Auth/RLS. npm dan `package-lock.json` adalah standar project.
- Server Components sebagai default. Tambahkan Client Components hanya untuk interaksi yang perlu browser.
- Gunakan dokumentasi versi dependency yang terpasang. Next.js 16 memakai `proxy.ts`; `cookies()` bersifat async.
- Hindari abstraksi generik dan dependency tambahan jika fungsi sederhana cukup. Terapkan Ponytail untuk pekerjaan coding.

## Aturan produk yang tidak boleh dilanggar

- Status tersimpan hanya `needs_sending`, `awaiting_reply`, `needs_review`, `completed`.
- `Hubungi hari ini` adalah kelompok tampilan: hanya tugas menunggu dengan tanggal tindak lanjut <= hari lokal LP3H.
- Membuka WhatsApp atau menyalin pesan TIDAK mengubah status. Pengiriman dikonfirmasi secara eksplisit untuk tugas yang dipilih.
- Balasan dan penyelesaian dicatat per tugas, bukan otomatis untuk semua tugas dalam kasus.
- `completed` berarti koreksi diperiksa dan pembaruan resmi yang diperlukan telah dilakukan. Tuntasnya kasus dihitung dari semua tugas; kasus tanpa tugas belum tuntas.
- Draf tidak mengubah instruksi asli. Jangan menyimpan isi pesan atau dokumen resmi di riwayat.
- Aplikasi adalah alat tindak lanjut, bukan integrasi resmi SIHALAL dan bukan otomasi WhatsApp.

## Data dan akses

- Gunakan contoh fiktif. Jangan menulis kredensial, nomor pribadi, atau data pilot ke repository/log.
- Setiap pembacaan DAN mutasi harus dibatasi oleh membership aktif, LP3H, peran, dan penugasan; RLS wajib sebelum data nyata.
- Pendamping: kasus yang ditugaskan. Koordinator: baca kasus di LP3H yang sama dan alihkan ke pendamping aktif di LP3H tersebut.
- Transfer kasus membuka hanya kontak yang diperlukan, bukan semua kasus/kontak pendamping lama.
- Validasi input dan identitas di server. Jangan mempercayai role, owner, atau LP3H dari payload client.
- Status dan audit harus atomik. Mutasi memakai expected version; konflik menampilkan data terbaru, bukan menimpa.
- Konflik versi RPC memakai `PT409`/HTTP 409. Jangan memakai `40001`/`40P01` untuk error bisnis karena PostgREST 14 dapat mengulangnya terus-menerus.
- UUID/idempotency key dibuat sekali untuk satu intent simpan dan digunakan ulang saat retry.
- Simpan waktu kejadian sebagai `timestamptz`; tindak lanjut sebagai `date`. Jangan mengubah tanggal kalender menjadi UTC.

## Kualitas dan workflow

- UI berbahasa Indonesia, mobile first, label status berbentuk teks, keyboard/focus terlihat, kontrol sentuh minimal 44px.
- Jangan menambahkan tombol mati, hasil simpan palsu, atau mengklaim demo sebagai fitur siap pakai.
- Jika diminta review saja, jangan mengubah desain.
- Pertahankan input saat simpan gagal. Jangan tampilkan sukses sebelum server mengonfirmasi.
- Jalankan `npm run check` dan `npm run build` untuk perubahan aplikasi. Tambahkan tes untuk aturan domain/akses baru, bukan tes kosmetik.
- Migrasi SQL di `supabase/migrations`; jangan ubah migrasi yang sudah diterapkan. Regenerasi tipe dari schema setelah migrasi.
- Jangan deploy, mengundang staf, atau memakai data nyata tanpa instruksi pengguna untuk tindakan tersebut.

## Peta skill

- **Wajib otomatis untuk setiap pekerjaan coding/development:** periksa deskripsi skill yang tersedia, baca `SKILL.md` yang cocok, lalu jalankan instruksinya. Sekadar menyebut nama skill bukan pemakaian. Nilai ulang pilihan ketika pekerjaan berpindah tahap, misalnya dari investigasi ke implementasi atau verifikasi.
- Awali pemilihan dengan `using-superpowers`. Untuk fitur/perubahan perilaku baru gunakan `brainstorming`; untuk bug/kegagalan tes gunakan `systematic-debugging` sebelum memperbaiki. Pekerjaan bertahap memakai `writing-plans`, lalu pilih satu cara eksekusi yang sesuai; jangan menjalankan dua workflow eksekusi untuk pekerjaan yang sama.
- Implementasi fitur/bugfix mengikuti `test-driven-development` sesuai cakupannya dan `ponytail` untuk perubahan terkecil yang lengkap. Sebelum mengklaim selesai gunakan `verification-before-completion`; pilih skill review/Git ketika tahap pekerjaan memerlukannya.
- Frontend/UI memakai `ui-ux-pro-max`; `modern-web-guidance` dijalankan sebelum HTML/CSS/client JS. Tambahkan skill desain, aksesibilitas, atau motion hanya jika tugas memang membutuhkannya. Backend murni tidak memerlukan workflow desain frontend.
- Sebutkan singkat skill yang dipakai beserta tujuannya pada awal pekerjaan atau saat tahap berubah. Jangan meminta pengguna memilih skill untuk pekerjaan rutin. Jika skill wajib tidak tersedia, jelaskan keterbatasannya; jangan mengaku telah menjalankannya.
- Pilih kumpulan minimum yang mencakup tugas; jangan memuat semua skill sekaligus. `caveman` hanya ketika pengguna meminta gaya tersebut. Ketersediaan skill bukan izin untuk memperluas fitur, menjalankan agent paralel tanpa dasar instruksi, commit/push, deploy, atau mengirim pesan nyata.
- Coding sederhana: `ponytail`; review/audit atas permintaan: `ponytail-review`, `ponytail-audit`.
- Workflow pengembangan: 15 skill Superpowers 7.0.1 tersedia lokal untuk perencanaan, debugging, pengujian, review, dan Git; pilih sesuai task. Contoh pemakaian ada di `docs/SKILLS.md`.
- UI baru: `ui-ux-pro-max`, lalu `modern-web-guidance` sebelum HTML/CSS/client JS.
- Pilih seperlunya: `frontend-design`, `anti-slop-design`, `design-taste-frontend`, `ui-styling`, `design-system`, `micro-interactions`.
- Skill tambahan tersedia, bukan mandat untuk mengubah tone, menambah animasi, atau memperluas scope. Aturan pengguna dan PRD didahulukan.
- Lihat `docs/SKILLS.md` dan `.agents/skills-manifest.json` untuk asal salinan. Gunakan path project untuk menjalankan script skill.
