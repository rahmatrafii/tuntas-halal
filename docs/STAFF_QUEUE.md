# Antrean tindakan staf — F07

Sesudah masuk, pilih **Antrean tindakan** pada LP3H yang sesuai. Halaman `/staf/lembaga/[organizationId]/antrean` memakai sesi staf dan database; halaman demo `/` tetap terpisah.

## Urutan dan filter

Urutan awal: Hubungi hari ini → Perlu dicek → Perlu dikirim → Menunggu balasan. Selesai tersedia melalui filter, tidak masuk daftar awal. Hubungi hari ini hanya kelompok untuk status Menunggu balasan dengan tanggal tindak lanjut sampai hari kalender LP3H; tanggal null atau mendatang berada pada kelompok menunggu biasa. Filter Menunggu balasan menampilkan kedua kelompok tersebut.

Pencarian mencocokkan bagian nama usaha **atau** nomor pengajuan tanpa membedakan huruf besar/kecil, termasuk tanda khusus secara literal. Tekan **Terapkan pencarian dan filter**. Form GET, parameter URL dan link halaman bekerja tanpa JavaScript. Filter dan kata pencarian dipertahankan saat membuka halaman berikutnya; Reset mengembalikan kolom serta hasil ke URL tanpa filter. Batas pencarian 160 karakter; URL yang melewati batas menampilkan pemberitahuan pemotongan. Input duplikat/malformed dinormalisasi dan tidak dapat menentukan role, LP3H atau assignee.

Daftar dibagi 20 revisi secara global, dengan urutan kelompok yang sama antarhalaman. Di dalam kelompok: tanggal tindak lanjut terdahulu, tanpa tanggal terakhir, lalu waktu dibuat dan ID. Halaman terlalu besar diarahkan ke irisan terakhir yang tersedia. Count memakai filter yang sama; perubahan data selama membaca count/halaman dapat membuat irisan halaman lebih pendek sampai dimuat ulang. Kegagalan layanan ditampilkan sebagai error dengan Coba lagi, bukan daftar kosong.

## Tindakan revisi

- Hubungi hari ini: Siapkan pengingat, membuka draf kasus untuk revisi tersebut.
- Perlu dikirim: Siapkan pesan, membuka draf kasus.
- Perlu dicek: Periksa revisi, membuka form status.
- Menunggu balasan: Catat balasan, membuka form status.
- Selesai: Lihat kasus. Nama usaha juga menjadi tautan konteks ke kasus.

Apabila draf tersimpan belum menyertakan revisi yang dibuka, pesan/pilihan lama dipertahankan. Pengguna memilih **Sertakan revisi ini** atau **Gunakan draf tersimpan** sebelum ekspor. Menambahkan pilihan pada pesan yang sudah disunting memakai tinjauan F05: susun ulang atau pertahankan suntingan secara eksplisit. Tidak ada isi pesan/instruksi yang diam-diam ditimpa.

**Tambah revisi** membuka pemilih kasus milik pendamping, kemudian form revisi existing. Koordinator membaca antrean LP3H dan memperoleh Lihat kasus, tanpa aksi draf/status/tambah. Filter pendamping dan transfer UI merupakan F08.

## Akses dan query

Guard server memverifikasi identity, membership aktif dan konteks LP3H. Seluruh query memakai client pengguna/RLS, inner embed kasus/kontak, batas LP3H eksplisit dan assignee untuk pendamping. Kontak yang sama tidak membuka kasus pendamping lain. Pembacaan tidak meminta nomor WhatsApp, tidak memanggil RPC tulis dan tidak mengubah status/tanggal/audit.

Count per kelompok dibaca paralel, lalu hanya irisan maksimal 20 tugas yang dibutuhkan. Tidak memuat semua tugas ke browser atau melakukan query per card. Pencarian literal memakai imatch dan empty embed contact dengan OR nomor pengajuan, sesuai [operator PostgREST 14](https://docs.postgrest.org/en/v14/references/api/tables_views.html) dan [filter embedded resource](https://docs.postgrest.org/en/v14/references/api/resource_embedding.html). Tidak ada schema/dependency baru. Pencarian substring/count tetap dapat memerlukan scan pada volume besar; evaluasi indeks/RPC dengan pengukuran bila volume pilot meningkat, bukan klaim performa produksi.

## Verifikasi dan batas

Laporan akhir terdapat di PROJECT_STATUS.md dan ledger rencana F07. HTTP Next + Auth/database lokal membuktikan empty state, pencarian nama/ref/tanda khusus, kelompok/paginasi, selesai, tenant/peran, transfer/revocation, pemilih kasus, serta read-only tugas/audit. Tes DOM mencakup reset URL dan keputusan eksplisit saat draf tersimpan berbeda. Bukti HTTP/DOM tidak menggantikan rendering perangkat, keyboard/zoom, bisnis cloud penuh atau gerbang pilot. Fixture HP cloud F05/F06 tetap dipertahankan; F07 tidak membuat fixture cloud atau mengirim email/WhatsApp.

Hasil akhir: check lint/TypeScript/125 tes, build dan HTTP lokal F03–F07 lulus. Review menemukan dua masalah penting yang diperbaiki RED→GREEN. F07V/UI02 belum lulus visual: HP hitam, browser host tidak tersedia, akses Chrome native ditolak pemeriksaan izin otomatis. Tidak mengklaim screenshot/perangkat sudah diuji.

Pada 23 November 2026, **F07C bisnis cloud development juga lulus** melalui HTTP aplikasi localhost + sesi Auth/database cloud. Pencarian/filter/paginasi, kalender LP3H, read-only status/audit/receipt, akses tenant/peran/assignee, transfer dan revocation terbukti. Fixture sementara dibersihkan dengan readback terpisah nol; fixture HP dipertahankan. [Laporan F07C](F07_CLOUD_VERIFICATION.md). Hidrasi dan visual/HP F07 tetap terpisah.
