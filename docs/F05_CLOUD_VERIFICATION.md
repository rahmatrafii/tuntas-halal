# Verifikasi F05: sesi cloud dan batas uji perangkat

Tanggal: 21 November 2026. Pengguna meminta uji sesi cloud dan HP/WhatsApp nyata, kemudian memilih **Selesaikan cloud dahulu** ketika akses perangkat tidak tersedia.

## Hasil

**Skenario HTTP aplikasi localhost + Auth/database cloud lulus. Uji browser/HP/WhatsApp nyata belum dilakukan.**

Target `tuntas-halal-dev` cocok dengan `.env.local` dan project API administratif, reference `czxfkwztljspzjjpqmgp`. Riwayat enam migrasi, body RPC 006 yang cocok repository, grants/RLS dan guard audit diperiksa sebelum fixture dibuat. Label `production` CLI merujuk cabang utama project development tersebut.

Run ID: `e9d02a1e-2b0a-4f5a-b685-382dc899eb1a`. Pengujian memakai aplikasi workspace di `http://localhost:3000`, sesi pengguna cloud nyata, request native HTTP dan redirect manual. Runner memakai token/key/cookie di memori dan tidak mencetaknya atau menulisnya ke artefak repository. Ini bukan deployment aplikasi ke hosting.

## Skenario yang lulus

- Empat akun Auth fiktif pada dua LP3H, callback/cookie proyek yang benar, dan reload dengan sesi cloud. Magic Link dibuat melalui Admin API tanpa permintaan email baru.
- Kontak/kasus melalui aplikasi, termasuk normalisasi, reuse, duplikat, retry dan konflik sebagai fondasi skenario.
- Satu revisi dibuat dan instruksinya diperbarui melalui route/Action F04 dengan RPC 006 cloud; fixture tambahan menyediakan 24 tugas total pada dua kasus, termasuk tugas completed dan tugas kasus saudara.
- Compose draf dengan seluruh 22 tugas aktif dalam kasus, mencakup pilihan setelah halaman pertama. Tugas completed dan teks kasus saudara tidak ikut tersusun.
- Penolakan editor/Action koordinator dan tenant lain, pilihan task milik kasus lain, task completed dan ID ganda.
- Pemeriksaan sebelum salin dengan sesi cloud. Ini membuktikan validasi server; tidak membuktikan clipboard OS benar-benar menerima teks.
- POST lanjutan menghasilkan redirect `wa.me` ke nomor kontak server yang tepat. Newline, emoji, `&`, `#`, `+` dan `?` ter-encode dan ter-decode sesuai pesan. Redirect tidak diikuti; tidak ada permintaan WhatsApp/pesan nyata.
- Pesan panjang menghasilkan redirect chat tanpa teks, tanpa memotong pesan. Pesan kosong ditolak.
- Readback seluruh tugas menunjukkan instruksi/status/tanggal/versi tetap sama setelah compose/validasi/redirect. Jumlah audit bisnis juga tidak bertambah akibat operasi draf.
- Perubahan instruksi dan kontak dari sesi/operasi lain menyebabkan validasi ekspor meminta tinjauan; snapshot yang ditinjau eksplisit diterima.
- Transfer mencabut akses draf pendamping lama. Pendamping penerima dapat mempersiapkan draf walaupun bukan pemilik kontak, tanpa memperoleh kasus saudara. Pencabutan membership penerima menolak ekspor berikutnya.

## Cleanup dan pemeriksaan terpisah

Cleanup disiapkan sebelum fixture dibuat dan dibatasi run ini: nama/UUID LP3H, metadata akun, hubungan membership/owner/assignee dan daftar 24 UUID tugas diperiksa. Data tugas yang tidak dikenal menyebabkan cleanup berhenti, bukan dihapus.

Audit bisnis fixture dibersihkan dalam satu transaksi administratif dengan kunci tabel dan guard append-only diaktifkan kembali sebelum commit. Tugas/kasus/kontak, receipt privat, membership dan LP3H fixture dihapus; empat akun Auth dihapus melalui Admin API dan ketidakhadirannya dibaca ulang. Tidak ada reset, perubahan migrasi/Auth/SMTP atau penghapusan data pengguna.

Query administratif baru sesudah proses selesai menunjukkan:

| Objek | Hasil |
|---|---|
| Organisasi, membership, kontak, kasus, tugas | Masing-masing 0, sama dengan baseline |
| Audit bisnis dan receipt privat | Masing-masing 0 |
| Akun Auth | 0 |
| Guard audit immutable | `O`, aktif |
| RLS enam tabel bisnis | Aktif |
| Riwayat migrasi | Tetap 6 |

Hasil runner: `passed: true`, `cleanupVerified: true`, `remainingFixtureRows: 0`, `emailRequests: 0`, `applicationCodeChanges: 0`. Bukti mentah tanpa kredensial disimpan pada helper/manifest/hasil run yang diabaikan Git. Angka checks runner mencakup pemeriksaan berulang, bukan jumlah skenario independen.

## Yang tetap terbuka

Inventaris alat masih melaporkan `The browser access host is unavailable`. Tidak tersedia kontrol HP melalui alat ini. Pengguna memilih menyelesaikan cloud terlebih dahulu, sehingga F05V/UI02 tetap terbuka: layout/hidrasi, localStorage browser nyata, clipboard permission, aplikasi WhatsApp, kembali ke aplikasi dan reload di HP/laptop.

Tidak ada pesan/email eksternal, data pilot, deploy, commit atau push. Kode aplikasi tidak diubah; check/build tidak diulang pada sesi operasional ini. Bukti implementasi sebelumnya tetap 93 tes aplikasi, 128 assertion SQL/concurrency, HTTP lokal dan build lulus. Uji cloud ini tidak menggantikan perangkat nyata, dan izin fixture run ini tidak mencakup undangan/fixture baru di sesi berikutnya.
