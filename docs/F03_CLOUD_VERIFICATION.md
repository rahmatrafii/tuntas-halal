# Verifikasi browser dan cloud F03

Tanggal: 21 November 2026.

Pengguna secara eksplisit meminta dua pemeriksaan sebelum melanjutkan fitur lain: browser/perangkat dan data bisnis Supabase development. Izin mencakup akun/data fiktif sementara serta pembersihannya. Ini izin untuk pengujian tersebut, bukan izin fixture/undangan baru tanpa batas.

| Pemeriksaan | Hasil |
|---|---|
| Browser/perangkat nyata | **Terhalang alat.** Inventaris browser mengembalikan `The browser access host is unavailable`; tidak ada browser yang dapat dikontrol melalui host tersebut. UI02 tetap terbuka. |
| Aplikasi localhost + database/Auth cloud | **Lulus.** Satu skenario operasional nyata menggunakan form native HTTP, sesi pengguna dan pembacaan ulang database cloud. |
| Pembersihan fixture | **Lulus.** Seluruh fixture, receipt dan audit uji dibersihkan; jumlah tabel/Auth kembali ke baseline. RLS dan guard audit diverifikasi aktif. |

## 1. Browser/perangkat

Pemeriksaan sarana kontrol dilakukan kembali pada sesi ini, bukan mengandalkan kegagalan sesi sebelumnya. Alat menampilkan jendela Chrome Windows, tetapi inventaris browser terstruktur kosong dengan error host tidak tersedia. Tidak mencoba melewati pembatasan alat menggunakan jalur UI lain.

Tidak ada screenshot F03, viewport 375/390/768/1440, zoom 200%, keyboard/touch HP, scrolling, navigasi setelah hidrasi atau assistive technology aktual yang dinilai. Respons HTML/tes HTTP di bawah bukan pengganti pemeriksaan tersebut. Tidak ada perubahan desain berdasarkan perkiraan. UI02 belum lulus dan membutuhkan sarana browser/perangkat yang berfungsi.

## 2. Target cloud dan fixture

- Target diverifikasi cocok dengan `.env.local` dan sesi administratif CLI: project `tuntas-halal-dev`, Postgres 17.12. Label `production` pada CLI menunjuk branch utama project Supabase itu; project yang diuji tetap project development yang sudah dipilih pengguna.
- Aplikasi tetap berjalan di `http://localhost:3000`, server Next dari workspace ini; aplikasi tidak dideploy. Cookie hasil callback diperiksa agar memakai project cloud yang sama.
- Baseline sebelum mulai: nol organisasi, membership, kontak, kasus, tugas, audit, receipt dan akun Auth.
- Fixture terbatas pada dua LP3H fiktif, empat akun sementara (pendamping, penerima pengalihan, koordinator dan pendamping LP3H lain), empat membership, dua kontak dan dua kasus yang berbagi kontak. Semua diberi identitas run acak untuk pembersihan terbatas.
- Auth dibuat lewat jalur admin yang sah; token Magic Link dibuat/ditukar tanpa mengirim email. Operasi bisnis aplikasi memakai sesi pengguna dan RPC/RLS yang sudah ada, bukan client administratif.
- Token/key/cookie hanya berada di memori. Helper/manifest operasional tanpa kredensial berada di Git metadata yang diabaikan; tidak menambahkan command cloud ke runner `npm run db:*` yang tetap khusus lokal.

## Perilaku yang terbukti

1. Callback Auth cloud membentuk sesi untuk setiap akun sementara; anonymous ditolak pada halaman bisnis.
2. Form native aplikasi menyimpan kontak di cloud dengan nomor ternormalisasi dan owner dari sesi. Data tetap terlihat setelah request ulang/reload HTTP.
3. Retry create/update yang sama tidak membuat kontak kedua atau menambah versi dua kali; readback database mengonfirmasi owner, nomor dan versi.
4. Nomor sama pada kontak sendiri meminta konfirmasi usaha berbeda; konfirmasi menyimpan kontak kedua.
5. Validasi mempertahankan isian; dua form dengan versi berbeda menghasilkan konflik dengan snapshot terbaru dan isian pengguna tetap tersedia.
6. Kontak dipakai untuk dua kasus, nomor pengajuan opsional, lalu nomor pengajuan diperbarui dan dibaca kembali dari cloud. Kasus tanpa tugas tidak dianggap tuntas.
7. Pengguna LP3H lain tidak membaca kontak lembaga A. Form/action yang terikat LP3H lain ditolak saat dipanggil sesi A; readback memastikan tidak ada insert.
8. Koordinator membaca dalam lingkupnya dan tidak diberi form perubahan. Pemanggilan POST perubahan secara langsung ditolak; data kontak tidak berubah.
9. Pengalihan fixture lewat RPC koordinator mencabut akses assignee lama. Penerima membaca kontak dan kasus pindahan tanpa melihat kasus saudara, tidak boleh mengedit/reuse kontak milik pendamping lama, tetapi dapat mengubah nomor pengajuan kasus tugasnya.
10. Form lama dan receipt sukses lama tidak memulihkan akses setelah transfer atau pencabutan membership. POST setelah pencabutan tidak membuat kontak baru, dibuktikan readback.

Ini satu skenario operasional, bukan klaim audit keamanan menyeluruh atau tes skala produksi. Tidak menguji pagination cloud, email live, hosting atau browser/hidrasi; bukti pagination dan DOM tetap berasal dari suite lokal F03.

## Pembersihan dan verifikasi akhir

Pembersihan dirancang sebelum fixture dibuat. Jalur administratif terlebih dahulu diuji dengan rollback. Cleanup memverifikasi UUID/nama organisasi serta metadata run akun, dan menolak hubungan tak terduga sebelum menghapus record.

Audit bersifat append-only bagi aplikasi. Untuk menghapus audit fixture yang secara khusus disetujui pengguna, satu transaksi administratif menonaktifkan hanya trigger `immutable_audit` selama penghapusan baris audit fixture, lalu mengaktifkannya kembali sebelum commit. Lock tabel mencegah writer lain melihat guard yang nonaktif; error transaksi membatalkan DDL/data bersama. Tidak menonaktifkan RLS, tidak mengubah migrasi atau kebijakan secara permanen, dan tidak mematikan pemeriksaan foreign key.

Setelah audit, kasus/kontak, receipt private, membership dan organisasi fixture dibersihkan, empat akun Auth dihapus melalui Admin API. Setiap akun diperiksa ulang dan dinyatakan tidak ditemukan. Query administratif terpisah setelah cleanup memberikan:

| Objek | Sebelum | Sesudah |
|---|---:|---:|
| Organisasi | 0 | 0 |
| Membership | 0 | 0 |
| Kontak | 0 | 0 |
| Kasus | 0 | 0 |
| Tugas | 0 | 0 |
| Audit | 0 | 0 |
| Receipt retry | 0 | 0 |
| Akun Auth | 0 | 0 |

Guard `immutable_audit` kembali `O` (aktif), dan RLS pada seluruh enam tabel bisnis tetap aktif. Tidak ada email/WhatsApp, data nyata, perubahan kode aplikasi, schema/migrasi baru, konfigurasi Auth baru, commit, push atau deploy pada sesi verifikasi ini. Karena tidak ada perubahan aplikasi, `npm run check`/`build` tidak diulang; bukti operasional cloud di atas terpisah dari hasil 62 tes/build F03 sebelumnya.

Rujukan teknis yang digunakan: [Management API SQL](https://supabase.com/docs/reference/api/v1-run-a-query), [CLI database query](https://supabase.com/docs/reference/cli/supabase-config), dan [PostgreSQL 17 client defaults](https://www.postgresql.org/docs/17/runtime-config-client.html). Detail penggunaan fitur: [STAFF_CASELOAD.md](STAFF_CASELOAD.md).
