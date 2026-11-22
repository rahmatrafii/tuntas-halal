# Draf WhatsApp staf — F05

## Membuat dan memulihkan draf

Buka kasus melalui area `/staf`, lalu **Draf WhatsApp**, atau **Siapkan pesan revisi ini** pada tugas aktif. Pilihan dan pesan dari draf tersimpan didahulukan ketika membuka kembali URL yang sama. Draf baru memilih seluruh revisi aktif, atau revisi sah dari tautan. Tugas selesai tidak dapat dipilih.

Editor menampilkan penerima dari kontak server. Daftar pilihan ditampilkan 20 per halaman, tetapi **Pilih semua revisi aktif** mencakup seluruh revisi kasus. Pilihan di halaman lain tetap tersedia. Server membaca tugas bertahap dan memeriksa setiap ID terpilih sebelum ekspor; pagination tidak menyembunyikan tugas setelah 20/100 pertama.

Pesan yang belum disunting akan disusun mengikuti pilihan. Setelah suntingan manual, mengubah pilihan mempertahankan pesan dan meminta keputusan: **Susun ulang pesan** mengganti dengan instruksi terbaru, sedangkan **Gunakan pesan suntingan** mempertahankan pesan sambil menerima pilihan/penerima terbaru. Instruksi tugas di database tetap sama.

## Penyimpanan di perangkat

F06 menambahkan bagian **Catat pengiriman** sesudah aksi ekspor. Ini membuka form status tersendiri dengan pilihan ID sebagai saran; tidak menyimpan pesan ke database atau menganggap klik WhatsApp sebagai bukti terkirim. Konfirmasi dan kebijakan tanggal wajib diperiksa pengguna. Draf perangkat tetap tersedia setelah status dicatat; lihat [STAFF_STATUS.md](STAFF_STATUS.md).

Draf memakai namespace browser terpisah dari demo, terikat akun/LP3H/kasus. Payload menyimpan ID pilihan, isi pesan, versi snapshot dan penanda suntingan, bukan token atau objek kontak/tugas lengkap. Browser/origin lain tidak otomatis menerima draf. Penyimpanan ini bukan otorisasi atau brankas terenkripsi; akses aplikasi tetap diperiksa melalui sesi server/RLS.

Draf kosong yang sengaja disimpan juga dipulihkan. Tidak menulis seed sebelum pemulihan. Ketika storage rusak, aplikasi tidak langsung menimpanya; pilih **Mulai draf baru** secara eksplisit. Ketika storage tidak tersedia/penuh, isian tetap dapat disunting di halaman tetapi pemulihan setelah reload belum terjamin. Jangan menganggap label gagal sebagai simpan berhasil.

Perubahan tab lain memunculkan konflik. Pilih **Muat draf tab lain** atau **Pertahankan draf tab ini**; isian tidak ditimpa otomatis. Pemeriksaan nilai mentah sebelum write menangkap tab usang, tetapi `localStorage` tidak menyediakan transaksi/CAS atomik lintas tab.

**Hapus draf** memerlukan konfirmasi dan hanya menghapus draf kasus itu pada akun ini. Draf tetap di browser sampai dihapus atau storage dibersihkan; logout tidak menjanjikan penghapusan fisik data. Akun lain tidak memulihkannya melalui UI. Teks yang sudah diunduh/disalin tidak dapat ditarik kembali dari jauh.

## Salin dan buka WhatsApp

Kedua tindakan memeriksa lagi sesi, membership, LP3H, penugasan, ID/versi revisi dan kontak di server. Perubahan data memerlukan tinjauan; input tetap tersedia. Kembali/focus/history memicu pemeriksaan ulang. Akun koordinator, tenant lain, pendamping lama atau anggota nonaktif tidak dapat mengekspor. Koneksi server diperlukan untuk memastikan akses terkini; editor lokal bukan bypass.

**Salin pesan** memakai Clipboard API. Jika browser menolak, aplikasi memilih teks dan memberikan petunjuk salin manual, tanpa menampilkan sukses palsu. **Buka WhatsApp** meminta navigasi tab yang sama ke `wa.me`; jika belum terbuka, **Lanjut ke WhatsApp** melakukan POST yang memvalidasi ulang sebelum redirect. Selama POST lanjutan, pesan dan kontrol perubahan dikunci agar teks yang dikirim tidak tertinggal dari suntingan baru. Permintaan navigasi tidak membuktikan WhatsApp terbuka atau pesan terkirim.

Nomor kosong/tidak valid memblokir chat, tetapi salin tetap tersedia. Pemilik kontak mendapat tautan koreksi; assignee kontak pindahan meminta pemilik melalui koordinator. Validasi format bukan bukti adanya akun WhatsApp pada nomor itu.

Pesan maksimal 64.000 karakter. Untuk URL ter-encode melebihi 8.000 karakter, salin pesan lengkap lalu lanjut ke chat tanpa teks; pesan tidak dipotong. Batas URL ini kebijakan konservatif aplikasi, bukan batas universal WhatsApp/browser. Emoji, newline dan tanda khusus di-encode; Unicode rusak ditolak dengan pesan perbaikan.

Tidak ada perubahan status, tanggal, instruksi, versi atau audit bisnis ketika menyusun/menyalin/membuka draf. Tombol konfirmasi pengiriman menunggu F06. F05 tidak mengirim pesan otomatis dan tidak menyimpan isi pesan pada riwayat server.

## Pengujian dan batas

Tes service/storage/DOM memeriksa akses, tujuan server, pemulihan, konflik tab, error storage, suntingan, clipboard gagal, respons terlambat dan pending POST. HTTP lokal memeriksa guard halaman/Action, redirect eksternal tanpa mengikutinya, pagination, transfer/pencabutan serta readback bisnis/audit. Hasil akhir tercatat di [PROJECT_STATUS.md](PROJECT_STATUS.md).

Tidak ada migrasi/dependency baru atau perubahan cloud. Uji browser/perangkat, clipboard nyata, aplikasi WhatsApp dan perjalanan kembali belum dibuktikan oleh DOM/HTTP. UI02 tetap terbuka; jangan menyamakan tes simulasi dengan pengujian HP nyata. Aktifkan JavaScript untuk editor dan penyimpanan browser; sebelum hidrasi/tanpa JavaScript kontrol ekspor tidak aktif dan UI menjelaskan keterbatasannya.

## Verifikasi cloud berikutnya — F05C

Atas permintaan pengguna, aplikasi localhost dengan Auth/database cloud lulus skenario compose lintas halaman, validasi salin/redirect, karakter khusus/pesan panjang, konflik instruksi/kontak, tenant/peran, transfer dan pencabutan akses. Readback membuktikan operasi draf tidak mengubah tugas atau audit. Redirect tidak diikuti: clipboard OS, aplikasi WhatsApp dan pemulihan browser nyata belum diuji. Pengguna memilih menyelesaikan cloud dahulu karena alat browser tidak tersedia.

Dua LP3H/empat akun dan 24 tugas beserta fixture terkait dibersihkan; query terpisah menunjukkan baseline nol, guard audit/RLS aktif. Tidak ada pesan/email baru atau perubahan schema/konfigurasi. Izin fixture uji tersebut sudah selesai, bukan izin membuat data uji tambahan. Lihat [F05_CLOUD_VERIFICATION.md](F05_CLOUD_VERIFICATION.md). F05V/UI02 menunggu pengujian perangkat terpandu.
