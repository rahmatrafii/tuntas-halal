# Backlog implementasi

Gunakan satu task per sesi/PR. `[ ]` belum dikerjakan; `[x]` selesai dan diverifikasi. Tidak ada fitur MVP yang otomatis selesai karena helper atau dokumen sudah ada.

- [x] **F00 — Fondasi project**: Next/TS/Tailwind, konektor Supabase SSR, helper domain, pemeriksaan otomatis, docs, skill lokal. Bukti akhir di `PROJECT_STATUS.md`.
- [x] **UI01 — Frontend dummy mobile**: seluruh delapan kelompok layar; desain `public/image.png`; login undangan simulasi, antrean, pencarian/filter, kontak/kasus/tugas, detail/riwayat, draf, status/tanggal, koordinator/transfer, kondisi layar. Data lokal dan tes DOM; belum autentikasi/keamanan produksi.
- [ ] **UI02 — Review visual/perangkat**: verifikasi screenshot 375px/390px/768px/1440px, zoom 200%, keyboard HP, native dialog, dan kesesuaian referensi. Browser automation terhenti pada sesi UI01; bukan klaim bahwa gerbang ini lulus.
- [ ] **F01 — Schema dan batas akses** (MVP-06): migrasi sesuai `DATA_MODEL.md`, RLS, fixture fiktif dua lembaga, tes akses baca/tulis/transfer. Audit dan mutasi tidak bisa dimanipulasi client. Hasil: migrasi reproducible + tipe database generated + tes isolasi lulus.
- [ ] **F02 — Staf undangan dan sesi** (MVP-06): login tanpa self-sign-up publik, konfirmasi undangan, logout, guard server, membership aktif, pesan akses terbatas. Uji sesi kedaluwarsa dan nonaktif. Provisioning admin terdokumentasi; secret tetap server.
- [ ] **F03 — Kontak dan kasus** (MVP-02): tambah/pilih kontak, normalisasi nomor, deteksi duplikat dalam lingkup pemilik, konfirmasi usaha berbeda, nomor pengajuan opsional. Uji reuse dan akses setelah transfer.
- [ ] **F04 — Revisi pertama** (MVP-03, MVP-07): form satu instruksi, validasi server, create idempoten dengan UUID stabil, status awal perlu dikirim, edit instruksi. Isian bertahan saat gagal; double tap/retry tidak menggandakan tugas.
- [ ] **F05 — Draf WhatsApp** (MVP-04): pilih tugas satu kasus, preview penerima/pesan, sunting draf temporer, salin pesan, tautan chat, kembali ke draf tanpa kehilangan isi. Membuka chat tidak memutasi status. Uji HP/laptop dan karakter khusus.
- [ ] **F06 — Status, audit, tindak lanjut** (MVP-05, MVP-07): konfirmasi pengiriman per tugas, tanggal opsional, balasan sebagian, perlu revisi ulang, selesai, undo tahap sebelumnya. RPC atomik, expected version, retry dan konflik diuji dua sesi.
- [ ] **F07 — Antrean tindakan** (MVP-01, MVP-05): kelompok terurut, pencarian usaha/nomor pengajuan, filter status/selesai, tanggal lokal lembaga, satu tindakan utama di HP, empty/loading/error states.
- [ ] **F08 — Tampilan koordinator dan transfer** (MVP-06): filter pendamping, transfer ke staf aktif satu LP3H, audit, kehilangan akses kasus oleh pendamping lama, tanpa membuka kasus lain lewat kontak.
- [ ] **F09 — Gerbang pilot**: jalankan `TESTING.md`, uji perangkat nyata, tentukan peserta/zona waktu/retensi/hosting, ukur baseline waktu kerja. Baru gunakan data yang disetujui setelah akses terverifikasi.

## Definisi selesai setiap task

Kriteria penerimaan PRD terpenuhi untuk slice tersebut; validasi di server; hak akses baca dan tulis diuji; error tidak menghilangkan input; tes relevan, lint, typecheck, build lulus; dokumentasi/status diperbarui; tidak ada tombol palsu atau klaim fitur selesai tanpa implementasi.

## Di luar rilis pertama

Lampiran, penjadwalan kunjungan, pengingat otomatis, bot/otomasi WhatsApp, sinkronisasi SIHALAL, analitik lanjutan, billing, dan dashboard statistik besar. Jangan memasukkannya tanpa keputusan produk baru.
