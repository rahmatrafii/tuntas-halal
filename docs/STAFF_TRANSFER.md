# Kasus koordinator dan pengalihan pendamping

Buka **Akun staf → Kasus usaha** pada LP3H yang dikelola. Koordinator melihat kasus lembaganya dan dapat memfilter berdasarkan penanggung jawab. Filter tetap tersedia untuk pendamping nonaktif agar kasus yang masih ditugaskan kepadanya dapat ditemukan. Halaman berikutnya mempertahankan filter.

Daftar, detail, riwayat, dan pilihan penerima memakai kode akun ringkas. Buka **Kode akun penerima** setelah memilih pendamping untuk mencocokkan kode lengkap sebelum mengalihkan kasus. Pendamping dapat melihat kode lengkapnya melalui **Kode akun pendamping** pada halaman akun staf.

1. Buka detail kasus dan pilih **Alihkan kasus**.
2. Pilih pendamping aktif lain pada LP3H yang sama.
3. Centang konfirmasi dan pilih **Konfirmasi pengalihan**. Setelah server mengonfirmasi, detail kasus menampilkan penanggung jawab dan riwayat pengalihan.

Saat versi kasus berubah, formulir menunjukkan penanggung jawab terbaru. Periksa kembali penerima sebelum memilih **Terapkan setelah tinjau**. Jika koneksi terputus, coba kembali dengan isian yang sama. Permintaan yang sudah tercatat memakai hasil sebelumnya sehingga percobaan ulang tidak membuat audit ganda.

Setelah pengalihan, pendamping lama kehilangan akses ke kasus yang dipindahkan. Penerima dapat mengakses revisi dan membaca kontak yang diperlukan untuk kasus tersebut. Kepemilikan kontak serta akses ke kasus lain mengikuti aturan RLS yang berlaku. Koordinator dapat membaca kasus dan mengalihkan penanggung jawab. Pengubahan kontak, instruksi dan status revisi tetap mengikuti hak pendamping.

Server memeriksa sesi, membership aktif, peran koordinator dan LP3H kasus. RPC `transfer_case` yang sudah tersedia memeriksa kandidat, mengunci versi, dan menulis pengalihan beserta audit dalam satu transaksi. Form konfirmasi mendukung POST native dan interaksi setelah hidrasi.

Tes aplikasi dan integrasi HTTP lokal lulus. Uji bisnis cloud membuktikan konfirmasi, konflik, retry, audit dan pembatasan akses setelah pengalihan. Uji HP ditunda. [Laporan verifikasi cloud](F08_CLOUD_VERIFICATION.md)
