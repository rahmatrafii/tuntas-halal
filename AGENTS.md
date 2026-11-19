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
4. Baca skill yang relevan dari `.agents/skills/<nama>/SKILL.md`. Jangan mengaktifkan semua skill sekaligus.
5. Selesaikan satu irisan fitur sampai validasi, penanganan error, dan pemeriksaan aksesnya. Perbarui status dan handoff.

## Tahap saat ini: frontend dengan data dummy

- Instruksi pengguna saat ini adalah frontend dahulu. Jangan menghubungkan UI ke Supabase, membuat akun, atau mengirim email/WhatsApp nyata tanpa instruksi lanjutan.
- Acuan visual wajib `public/image.png` dan `docs/DESIGN_SYSTEM.md`: putih, card abu-abu besar, tombol hitam/pill, badge pastel, navigasi bawah mengambang. Jangan kembali ke palet hijau halaman fondasi.
- Prioritaskan HP: gutter 20px, kontrol minimal 48px, form 16px, safe area, ruang navigasi bawah. Desktop tetap responsif.
- `src/features/demo` berisi data, state browser, logika simulasi, dan layar. `localStorage` bukan otorisasi backend.
- Pertahankan empat status PRD, konfirmasi pengiriman terpisah, pilihan tugas per kasus, dan draft tersimpan. Data dummy memakai tanggal acuan `DEMO_TODAY`, bukan tanggal laptop yang berubah-ubah.
- Jangan centang F01–F09 hanya karena frontend tersedia. Tahap UI terpisah di backlog. Keamanan dan autentikasi produksi tetap belum dikerjakan.

## Preferensi review UI/UX pengguna

Untuk setiap chat tentang desain, portofolio, Figma, atau antarmuka, gunakan sudut pandang senior UI/UX designer. Beri penilaian yang jujur, langsung, dan profesional. Sebutkan yang sudah bekerja, jelaskan masalah yang terlihat serta dampaknya pada pengguna, dan prioritaskan perbaikan yang konkret. Bedakan hasil yang sudah terlihat atau teruji dari perkiraan. Jika diminta menilai saja, berikan review tanpa mengubah desain.

## Sumber keputusan

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

- Coding sederhana: `ponytail`; review/audit atas permintaan: `ponytail-review`, `ponytail-audit`.
- UI baru: `ui-ux-pro-max`, lalu `modern-web-guidance` sebelum HTML/CSS/client JS.
- Pilih seperlunya: `frontend-design`, `anti-slop-design`, `design-taste-frontend`, `ui-styling`, `design-system`, `micro-interactions`.
- Skill tambahan tersedia, bukan mandat untuk mengubah tone, menambah animasi, atau memperluas scope. Aturan pengguna dan PRD didahulukan.
- Lihat `docs/SKILLS.md` dan `.agents/skills-manifest.json` untuk asal salinan. Gunakan path project untuk menjalankan script skill.
