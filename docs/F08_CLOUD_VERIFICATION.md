# Verifikasi bisnis F08 di cloud development

**Lulus.** Pada 23 November 2026, aplikasi localhost memakai sesi Auth dan database `tuntas-halal-dev` untuk menguji filter kasus dan pengalihan penanggung jawab. Target dicocokkan dengan konfigurasi aplikasi dan project administratif.

Run `5c8ae2d9-42da-4426-a9c9-e5dcaf9f2f93` memakai dua LP3H, lima akun sementara, satu kontak, tiga kasus, dan tiga revisi fiktif. Empat akun menjalankan alur HTTP aplikasi. Akun pendamping dari LP3H lain dipakai untuk memeriksa validasi penerima. Token login dibuat melalui Admin API tanpa pengiriman email.

- Daftar dan filter koordinator hanya menampilkan kasus LP3H yang berhak dibaca. Pendamping dan koordinator LP3H lain tidak dapat menjalankan pengalihan melalui formulir yang sama.
- Formulir menawarkan pendamping aktif lain di lembaga yang sama. Server menolak pengiriman tanpa konfirmasi, penerima lintas LP3H, koordinator, penanggung jawab saat ini, dan penerima yang dinonaktifkan setelah formulir dibuka. Saat kandidat aktif habis, halaman menjelaskan keadaan itu.
- Versi kasus lama mengembalikan data terbaru dan menjaga pilihan penerima. Peninjauan eksplisit memungkinkan simpan. Pengulangan POST mengembalikan hasil pengalihan yang sama. Database mencatat satu audit dengan aktor, pendamping lama, pendamping baru, dan versi baru.
- Pendamping lama kehilangan kasus yang dialihkan dan tetap melihat kasus saudaranya. Penerima memperoleh kasus, revisi, dan akses baca kontak terkait. Kasus saudara tetap tersembunyi lewat daftar maupun detail kontak. Instruksi, status, tanggal, dan versi revisi identik sebelum dan sesudah.
- Ketika membership koordinator dicabut, pengulangan POST menuju halaman akses terbatas dan jumlah audit pengalihan tetap satu.

Percobaan pertama `a949fcc6-5c84-47d2-b54e-fe2c50341364` berhenti karena runner mengharapkan respons tanpa pengalihan setelah pencabutan akses. Kriteria diperbaiki untuk memeriksa tujuan akses terbatas secara eksplisit. Kedua run memiliki verifikasi cleanup administratif terpisah dengan hasil nol organisasi, membership, kontak, kasus, revisi, audit, receipt, dan akun Auth sementara. Fixture HP dipertahankan dengan fingerprint revisi yang sama. Enam tabel bisnis tetap dilindungi RLS, guard audit aktif, dan jumlah migrasi tetap enam.

Uji ini mencakup HTTP native dengan aplikasi localhost dan cloud development. Uji HP dan visual perangkat ditunda atas arahan pengguna. Fixture cloud dibuat untuk kedua percobaan ini dan seluruhnya dibersihkan.
