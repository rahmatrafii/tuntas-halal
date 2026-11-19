# Panduan demo frontend

Jalankan `npm run dev`, lalu buka `http://localhost:3000`. Backend tidak diperlukan. Jika dev server project sudah berjalan, gunakan server tersebut.

## Delapan kelompok tampilan

| Tampilan                 | Cara mencoba                                                                                                                                              |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Login undangan           | `/login`; masukkan `nadia@contoh.test` atau `ratna@contoh.test`, lalu buka tautan demo. Dua tombol akun contoh juga tersedia. Email tidak dikirim.        |
| Antrean                  | `/`; cari `Keripik` atau `SH-2026-08124`, pilih status, buka filter. Due hari ini mencakup tanggal 19 Nov dan sebelumnya saat masih menunggu.             |
| Kontak/kasus/tugas       | Menu Kontak → tambah; buat kasus dari kontak yang sama atau kontak baru; tambah revisi satu kalimat. Nomor yang sama memerlukan konfirmasi usaha berbeda. |
| Detail dan riwayat       | `/kasus/kasus-rina`; lihat panel informasi, progres, tugas, pendamping, dan timeline.                                                                     |
| Draf WhatsApp            | Buka kasus → Siapkan pesan; pilih beberapa tugas, sunting pesan, salin, buka pratinjau chat. Kembali ke draf tidak memindahkan status.                    |
| Status dan tindak lanjut | Buka salah satu tugas → pilih status, tanggal, dan simpan. Selesai memerlukan konfirmasi pemeriksaan/pembaruan resmi.                                     |
| Koordinator/transfer     | Menu Akun → Ratna Sari → Tim pendamping. Filter staf, buka kasus → ikon pada penanggung jawab → pilih staf aktif.                                         |
| Kondisi UI               | `/kondisi`; pratinjau kosong, skeleton, error + retry, akses terbatas, konflik versi, dan gagal simpan dengan isian tetap tersedia.                       |

## Skenario penting

1. **Balasan sebagian:** pada Keripik Bu Rina, ubah satu tugas menunggu menjadi Perlu dicek. Tugas kedua tetap menunggu.
2. **Kirim gabungan:** pilih dua tugas dari satu kasus, buka/tutup pratinjau; status tetap. Pilih tugas yang benar-benar dikirim, lalu Tandai sudah dikirim.
3. **Draf bertahan:** sunting pesan, pindah halaman, buka kembali draf dari detail kasus. Isi disimpan di browser.
4. **Pengalihan terbatas:** sebagai Ratna, alihkan kasus Rina ke Farhan. Beralih ke Nadia: kasus tersebut tidak terlihat; kasus Rina yang lama tetap ada. Sebagai Farhan, kontak Rina dapat dibaca tanpa membuka kasus lamanya.
5. **Koreksi nomor:** Kontak → Ubah kontak. Form menolak nomor invalid; draf memiliki fallback Salin pesan bila data kontak invalid.
6. **Reset:** Akun → Atur ulang data contoh. Tidak memengaruhi file project atau backend.

## Data dan batas simulasi

Satu LP3H fiktif, tiga pendamping, satu koordinator, enam kontak, tujuh kasus, sebelas tugas awal. Hari acuan 19 November 2026, zona Asia/Jakarta. State memakai key `revisi-halal-demo-v1`. Jangan masukkan data pribadi asli.

Penyimpanan dilakukan lebih dahulu; bila localStorage gagal, state tidak dianggap tersimpan dan formulir tetap berisi. Tab lain menerima pembaruan melalui storage event. Mutasi tugas memakai versi untuk menolak perubahan usang; frontend ini tetap bukan sistem multi-user atau kontrol akses produksi.

Browser dapat menghapus penyimpanan lokal. Untuk tahap backend, pindahkan kontrak ini ke server + transaksi + RLS sesuai `DATA_MODEL.md`, bukan menggunakan localStorage untuk data pilot.

## Verifikasi

Jalankan `npm run check` dan `npm run build`. Tes DOM memeriksa perilaku komponen tanpa browser nyata. Kontrol browser pada sesi implementasi dihentikan karena URL Chrome tidak dapat diverifikasi; review visual mobile, zoom, dan perangkat nyata masih perlu dilakukan. Tidak ada screenshot atau klaim pixel-identical yang dibuat.
