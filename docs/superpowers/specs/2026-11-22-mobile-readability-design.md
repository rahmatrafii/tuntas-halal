# Audit keterbacaan mobile

Pengguna menyerahkan audit dan perbaikan teks/info/modal seluruh alur agar tidak perlu memeriksa halaman satu per satu. Perbaikan dilakukan dalam gaya DESIGN_SYSTEM yang sudah dipilih: putih, card abu-abu, tombol hitam, badge pastel; fokus antarmuka kerja pendamping yang tenang dan mudah dipindai.

## Pendekatan

Perbaiki komponen dan CSS bersama terlebih dahulu, lalu teks yang salah atau berulang pada halaman. Ini lebih konsisten daripada menambal tiap route. Redesain visual atau perubahan alur bisnis tidak diperlukan. Keputusan ini diambil agent dalam cakupan perbaikan yang didelegasikan pengguna, bukan persetujuan atas fitur baru.

## Ruang lingkup

- Panel informasi/konflik harus mengalir vertikal; ikon+isi hanya memakai flex pada komponen Notice yang memang memiliki dua kolom.
- Identitas usaha, email, instruksi, referensi dan teks tombol panjang dapat membungkus tanpa disembunyikan. Badge dipisahkan dari instruksi; judul tidak dipotong.
- Modal dibatasi viewport dinamis, kontennya dapat digulir dan tombol tutup tetap terjangkau. Target sentuh minimum 44px, kontrol utama 48px; input 16px.
- Ukuran/jarak teks memakai rem, hierarki ringkas, serta keterangan staf sesuai F04/F05 yang tersedia. Informasi akses, konflik, penyimpanan gagal dan konfirmasi pengiriman tidak dibuang.
- Cakupan audit sumber: semua route demo/staf dan komponen bersama, termasuk form/error/loading/empty/transfer/draf/konflik. Tanpa perubahan Auth/RLS/status/database, fixture aktif atau pesan eksternal.

## Bukti dan batas

Browser automation tetap melaporkan `The browser access host is unavailable`. Audit sumber/CSS dan tes DOM/HTTP tidak membuktikan layout pixel, keyboard HP atau zoom 200%. Catat temuan dan cakupan secara eksplisit; UI02 tetap terbuka untuk verifikasi visual.
