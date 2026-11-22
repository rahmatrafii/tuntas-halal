# Verifikasi bisnis F06 di Supabase development

Tanggal: 22 November 2026. Pengguna meminta tahap cloud dahulu agar F06 bekerja pada database Supabase. Pengujian HP F06 terpisah.

## Hasil

**Lulus: aplikasi localhost dengan sesi Auth dan database Supabase cloud menyimpan perubahan F06 melalui Action aplikasi dan RPC `set_task_statuses`.** Target administratif dan `.env.local` cocok dengan `tuntas-halal-dev`, reference `czxfkwztljspzjjpqmgp`. Enam migrasi tersedia; tidak diperlukan migrasi baru.

Run ID: `740f9aae-9cf2-4e92-9d61-9a557baf96f8`. Runner memakai native HTTP pada `http://localhost:3000`, cookie pengguna cloud dan redirect manual. Ini bukan deployment aplikasi ke hosting atau uji browser/HP. Kredensial, token dan cookie hanya berada di memori. Tidak ada email atau permintaan WhatsApp.

## Skenario yang lulus

- Empat akun Auth sementara pada dua LP3H; callback membentuk cookie proyek cloud yang benar. Kontak, kasus dan instruksi dibuat melalui aplikasi sebagai fondasi skenario, termasuk retry, konflik dan reload.
- Perubahan status/tanggal tersimpan di database; instruksi revisi tidak berubah. Masuk Selesai memerlukan konfirmasi. Progres berubah menjadi tuntas saat semua tugas selesai dan kembali belum tuntas setelah koreksi.
- Retry permintaan berhasil tidak menggandakan perubahan atau audit. Retry perubahan tanggal tugas Selesai tetap mengembalikan receipt setelah tugas dibuka kembali, tanpa menimpa status terkini. No-op tidak menambah audit.
- Konflik versi menampilkan data terbaru; tindakan tinjau eksplisit melalui native form dapat menerapkan isian dengan versi terbaru.
- Konfirmasi pengiriman memakai pilihan revisi dan kebijakan tanggal eksplisit. Pengiriman satu revisi membiarkan revisi lain Perlu dikirim; pencatatan balasan satu revisi membiarkan revisi lain Menunggu balasan.
- Batch dengan satu versi usang tidak mengubah tugas mana pun dan tidak menambah audit. Batch dengan versi terbaru menyimpan tanggal bersama.
- Koordinator, tenant lain dan task pada parent kasus yang salah tidak memperoleh form mutasi. POST koordinator/tenant lain ditolak. Setelah transfer, pendamping lama ditolak dan penerima dapat mengubah status; pencabutan membership penerima menolak POST dan data tetap sama.
- Native form menampilkan seluruh 22 kandidat pengiriman setelah fixture pagination ditambahkan; riwayat memiliki halaman kedua.

## Cleanup dan readback

Fixture HP F05 yang sudah aktif tidak dipakai untuk mutasi. Identitas keberadaannya serta fingerprint ID/versi/status/tanggal tugas dibandingkan sebelum dan sesudah run, tanpa membaca atau mencatat nomor kontak pribadi. Hasilnya sama.

Cleanup disiapkan sebelum fixture dibuat dan hanya mencakup UUID/nama LP3H, metadata akun, hubungan data dan daftar UUID tugas run ini. Audit fixture dibersihkan dalam transaksi administratif dengan kunci tabel; guard immutable diaktifkan kembali sebelum commit. Empat akun Auth sementara dihapus melalui Admin API dan ketidakhadirannya dibaca ulang. Seluruh jumlah tabel/Auth kembali ke baseline yang sudah berisi fixture HP.

Query read-only baru sesudah runner selesai membuktikan:

| Pemeriksaan | Hasil |
|---|---|
| LP3H, membership, kontak, kasus, tugas sementara | Masing-masing 0 |
| Audit, receipt dan akun Auth run ini | Masing-masing 0 |
| Fixture HP yang dipertahankan | 1 LP3H, 1 kasus, 2 revisi |
| Guard audit immutable | `O`, aktif |
| RLS tabel bisnis | 6 tabel aktif |
| Riwayat migrasi | Tetap 6 |

Runner keluar dengan kode 0, `passed: true`, `cleanupVerified: true`, `remainingFixtureRows: 0`, `emailRequests: 0`, `applicationCodeChanges: 0`. Helper, manifest dan hasil tanpa kredensial berada di `.git/` dan diabaikan Git. Checks berulang runner bukan hitungan skenario independen.

## Batas bukti

F06 sudah terverifikasi bekerja pada database development melalui aplikasi localhost. Tata letak, hidrasi, keyboard, modal, jaringan perangkat dan kenyamanan alur F06 di HP belum diuji pada run ini. Data nyata/pilot, deployment, undangan staf dan email/WhatsApp eksternal tidak termasuk.

Kode aplikasi tidak diubah; `npm run check` dan `npm run build` tidak diulang untuk sesi operasional/dokumentasi ini. Validasi implementasi lokal sebelumnya dicatat terpisah pada PROJECT_STATUS.md. Izin fixture sementara run ini sudah selesai dan tidak menjadi izin membuat fixture/undangan tambahan pada pekerjaan lain.
