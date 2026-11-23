# Panduan pilot Pelacak Revisi Halal

Pilot mengikuti rancangan PRD: satu LP3H, dua pendamping, satu koordinator, dan dua minggu pengamatan. Pendamping menangani revisi yang mereka terima dalam pekerjaan sehari-hari. Koordinator mengamati antrean dan menangani serah terima bila diperlukan. Tambah masa pengamatan jika jumlah revisi yang sebanding terlalu sedikit untuk menilai hasil.

## Keputusan sebelum mulai

| Keputusan | Penanggung jawab | Bukti untuk menyatakan siap |
| --- | --- | --- |
| LP3H, peserta dan periode | Pemilik produk dan koordinator | Satu LP3H menyetujui periode, dua akun pendamping dan satu akun koordinator. Nama peserta dan data kontak dicatat di tempat terbatas yang disepakati LP3H. |
| Zona waktu | Koordinator | Zona IANA sesuai jadwal operasional LP3H. `Asia/Jakarta` adalah nilai usulan bila tim bekerja di WIB. Verifikasi tugas hari ini dan lewat tanggal pada zona yang disetujui. |
| Retensi dan akhir pilot | Koordinator dan pemilik data | Sepakati masa simpan data aktif, riwayat, unduhan dan cadangan, penanggung jawab, serta proses menutup akses. Audit bersifat append-only, sehingga kebutuhan penghapusan/arsip harus punya prosedur yang disetujui dan diuji sebelum dipakai untuk data nyata. Draf lokal perlu dikelola pada perangkat peserta. |
| Hosting, Auth dan pemulihan | Pemilik produk dan pengelola teknis | Pilih paket/wilayah sesuai kebutuhan LP3H. Konfirmasi origin HTTPS, callback, sesi/logout, pengirim email, akses log, cadangan dan pemulihan di environment yang disetujui. Uji dari alamat aplikasi yang akan dipakai peserta sebelum mengimpor data. |
| Baseline dan evaluasi | Koordinator dan dua pendamping | Kumpulkan waktu aktif alur lama untuk kasus sejenis. Gunakan lembar di bawah selama pilot. Harga dan minat membayar dicatat pada evaluasi dengan pengambil keputusan LP3H. |

## Pemeriksaan go/no-go

- [x] Jalankan lint, TypeScript, 130 tes aplikasi, build, 128 assertion SQL, concurrency, serta HTTP Auth/Mailpit dan alur bisnis lokal. [Strategi pengujian](TESTING.md)
- [x] Tuntaskan pemeriksaan bisnis cloud development untuk alur dari sesi staf sampai kasus selesai. [Bukti latihan cloud](F09_CLOUD_VERIFICATION.md)
- [ ] Tutup F07V, F08V dan UI02 untuk perangkat yang akan dipakai peserta. Tinjau target sentuh, filter/reset, draf yang dipulihkan, konfirmasi, fokus keyboard dan tampilan sempit. Uji perangkat ditunda atas arahan pengguna.
- [ ] Ulangi autentikasi, pembatasan akses dua LP3H, transfer, pencabutan dan logout pada target hosting pilot dengan data fiktif. Pastikan operator dapat mencabut akses peserta saat berhenti atau berganti peran.
- [ ] Catat persetujuan LP3H serta keputusan peserta, zona waktu, retensi dan hosting pada tabel di atas. Siapkan baseline dari alur lama sebelum memulai pengukuran pilot.
- [ ] Jika ada kebocoran akses, audit ganda, status tanpa konfirmasi, atau gangguan simpan yang membuat pekerjaan tidak bisa dilanjutkan, hentikan pemasukan kasus baru dan tinjau dengan koordinator. Catat waktu, tahap dan kode kasus internal tanpa menyalin nomor atau pesan. Tentukan syarat melanjutkan berdasarkan hasil perbaikan dan uji ulang.

Data pilot masuk setelah akses pada target hosting terverifikasi dan LP3H menyetujui cakupan data. Isi hanya nama/kontak usaha, rujukan kasus, instruksi singkat yang diperlukan, status, dan tanggal tindak lanjut. Simpan berkas bukti, isi chat serta kredensial SIHALAL di kanal yang memang dipakai untuk itu.

## Skenario untuk peserta

1. Pendamping A menemukan kasus yang perlu ditangani, menyiapkan draf dua revisi, lalu mengonfirmasi tugas yang sudah dikirim. Catat apakah pencarian dan pengelompokan antrean membantu.
2. Saat satu balasan tiba, tandai hanya tugas itu sebagai Perlu dicek. Jika kurang, kembalikan ke Perlu dikirim dan catat tambahan waktu kerja.
3. Koordinator menemukan kasus melalui filter pendamping dan, bila skenario memerlukan serah terima, mengalihkan kasus ke pendamping B. Periksa akses pada kedua akun dan riwayat sebelum melanjutkan.
4. Pendamping menyelesaikan revisi setelah koreksi diperiksa dan pembaruan resmi dilakukan. Koordinator memeriksa tugas yang masih lewat tanggal tindak lanjut.
5. Pada evaluasi, minta setiap peran menunjukkan tindakan berikutnya dari antrean tanpa petunjuk. Catat bantuan yang diperlukan, kesalahan yang berulang dan keputusan apakah pilot perlu diperpanjang.

## Lembar waktu dan hasil

Salin tabel ini ke catatan evaluasi yang disetujui LP3H. Gunakan satu baris per tugas per cara kerja. Pakai kode peserta dan kode tugas lokal yang bisa dibandingkan tanpa memasukkan nama, nomor kontak atau isi pesan.

| Tahap | Kode peserta | Kode tugas | Jenis revisi | Cari catatan (menit) | Siapkan permintaan (menit) | Tindak lanjut (menit) | Periksa balasan (menit) | Perbarui catatan (menit) | Total aktif (menit) | Hasil dan hambatan |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Alur lama | | | | | | | | | | |
| Pilot | | | | | | | | | | |

- Catat menit aktif dari pencarian sampai pembaruan catatan, termasuk ketikan ulang. Jeda menunggu respons usaha dicatat terpisah. Jika satu aksi melayani beberapa tugas, bagi waktu aksi itu ke tugas yang dilayani agar total tidak dihitung dua kali.
- Bandingkan tugas sejenis dengan aturan pengukuran yang sama. Laporkan jumlah tugas dan median menit aktif per kelompok. Hitung perubahan sebagai `(median lama − median pilot) / median lama × 100%` jika median lama tersedia dan lebih besar dari nol. Sekitar 30% adalah patokan PRD untuk evaluasi.
- Pada jam pencatatan tetap sesuai zona LP3H, catat jumlah tugas Menunggu balasan bertanggal yang sudah lewat dan jumlah seluruh tugas Menunggu balasan bertanggal. Simpan kedua hitungan agar perbandingan bisa dibaca saat volume berubah.
- Tanyakan pada kedua peran apakah tindakan berikutnya ditemukan tanpa bantuan. Rekam jawaban pengambil keputusan LP3H tentang kesediaan melanjutkan dan alasannya, setelah paket/harga disepakati untuk evaluasi.

Baseline manusia menunggu peserta dan kasus pembanding. Durasi latihan HTTP sintetis hanya dipakai sebagai catatan teknis.

Untuk keputusan akhir, koordinator dan pemilik produk mencatat tanggal mulai atau alasan penundaan di catatan evaluasi LP3H, bersama tautan bukti uji akses dan perangkat. Ringkasan hasil pilot menyertakan jumlah tugas pembanding, median waktu, jumlah tugas lewat tanggal, hasil tugas tanpa bantuan, dan keputusan LP3H.
