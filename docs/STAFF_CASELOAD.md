# Kontak dan kasus staf — F03

## Membuka data yang benar

Login melalui `/staf/login`, kemudian pilih **Kontak usaha** atau **Kasus usaha** pada membership LP3H di `/staf`. Pilihan lembaga selalu eksplisit, termasuk bila hanya mempunyai satu membership. Route fitur memakai `/staf/lembaga/[organizationId]/kontak` dan `/kasus`; ID organisasi pada URL tidak memberi izin dengan sendirinya.

Halaman `/kontak`, `/kasus`, `/login`, revisi dan draf lama tetap demo. Data backend tidak dimasukkan ke store demo/localStorage. Akun tanpa membership aktif tetap mendapat akses terbatas; F03 tidak membuat akun atau mengaktifkan membership secara otomatis.

## Kontak usaha

Pendamping dapat menambah kontak dengan nama usaha dan nomor WhatsApp wajib, sapaan opsional. Nomor `08`, `62`, atau `+62` dengan pemisah yang didukung disimpan sebagai digit ternormalisasi. Validasi nomor hanya memeriksa format, bukan keberadaan akun WhatsApp.

Nomor ganda diperiksa hanya dalam kontak milik pendamping pada LP3H yang sama. Pilih kontak yang sudah tersedia, atau centang konfirmasi bahwa nomor dipakai usaha berbeda. Konfirmasi kembali diperlukan ketika nomor diubah. Kontak pendamping lain tidak ditampilkan sebagai hasil pencarian duplikat.

Detail kontak memuat kasus terkait yang memang boleh dibaca. Pemilik pendamping dapat mengubah kontaknya; pembaruan berlaku pada semua kasus yang memakai kontak tersebut. Kontak yang terbaca melalui kasus pindahan tidak dapat diubah atau dipakai untuk kasus baru oleh pendamping penerima.

## Kasus pengajuan

Pilih kontak sendiri secara eksplisit; tidak ada pilihan kontak pertama otomatis. Pemilih kontak dipaginasi 20 baris dan tetap menyediakan kontak setelah halaman pertama. Tautan **Buat kasus** dari detail kontak juga dapat digunakan.

Jika perlu kontak baru, simpan kontak dahulu lalu lengkapi kasus. Kontak yang berhasil disimpan tetap tersedia jika pembuatan kasus berikutnya gagal. Gunakan kontak tersebut lagi; jangan membuat duplikat untuk mencoba ulang kasus.

Nomor pengajuan opsional. Kasus ditugaskan kepada pendamping yang membuatnya. Pendamping yang ditugaskan dapat mengubah nomor pengajuan; mengganti kontak atau penanggung jawab belum menjadi aksi F03. Koordinator hanya membaca kasus dan kontak terkait lembaganya. F04 menambahkan daftar/tambah/ubah instruksi revisi pada kasus, dan F05 menyediakan [draf WhatsApp perangkat](STAFF_DRAFTS.md). Perubahan status dan UI transfer tetap tahap berikutnya.

Kasus tanpa tugas tidak dianggap tuntas. Nama tampilan staf lain belum tersedia pada schema: kepemilikan/penugasan ditampilkan sebagai **Anda** atau **Pendamping lain**, tanpa menebak identitas dari data demo atau metadata browser.

## Saat simpan gagal atau konflik

Isian dipertahankan saat validasi, provider, atau koneksi pemanggilan Server Action gagal. Coba ulang dengan isian yang sama untuk menggunakan intent penyimpanan yang sama. UUID resource tetap stabil selama form; key RPC diturunkan dari seed form acak dan payload ternormalisasi. Tidak menampilkan sukses sebelum RPC mengonfirmasi.

Jika dua sesi mengubah data yang sama, tampilkan snapshot terbaru yang masih boleh dibaca di samping isian pengguna. Tombol penerapan isian ke versi terbaru merupakan tindakan eksplisit, bukan overwrite otomatis. Jika percobaan create sebelumnya ternyata sudah tersimpan dengan nilai berbeda, buka data tersebut untuk meninjau; aplikasi tidak membuat record kedua otomatis.

Pencabutan membership atau transfer berlaku pada request/simpan berikutnya, termasuk pengulangan receipt sukses lama. Error layanan tidak disamarkan sebagai daftar kosong. Tidak ada service-role client di fitur aplikasi; semua pembacaan memakai client pengguna/RLS dan tulisan melalui empat RPC F01.

## Pengujian development

```powershell
npm run db:caseload:test
npm run db:test
npm run db:auth:test
npm run check
npm run build
```

`db:caseload:test` menggunakan stack Supabase lokal yang sudah berjalan, fixture fiktif, token Auth lokal tanpa email, dan child Next miliknya di port 3150 dengan `.next-auth-test`. Runner menolak URL cloud, tidak membaca `.env.local`, dan menahan token/cookie/key di memori. Jangan reset stack jika ingin mempertahankan fixture lokal. Tidak ada migrasi/schema/dependency baru untuk F03.

Skenario HTTP memeriksa native POST tanpa JavaScript, CRUD/reuse, normalisasi/duplikat, retry dan konflik, dua LP3H, koordinator read-only, transfer satu dari dua kasus berbagi kontak, kontak halaman kedua, pencabutan membership dan receipt lama. Tes DOM tambahan memeriksa pending/error, error summary/fokus, konfirmasi duplikat, konflik eksplisit dan transport browser yang gagal.

Bukti implementasi lokal bukan uji layout/browser/perangkat atau kesiapan pilot. Pengguna kemudian secara khusus mengizinkan verifikasi bisnis cloud F03: skenario HTTP aplikasi localhost + Auth/database cloud lulus; dua LP3H/empat akun dan seluruh fixture dibersihkan/readback. Browser tetap terhalang host alat, sehingga UI02 belum lulus. Tidak ada email/config cloud baru, undangan staf nyata, deploy, atau WhatsApp. Lihat [laporan cloud/browser](F03_CLOUD_VERIFICATION.md) dan [status project](PROJECT_STATUS.md).

## Tugas revisi staf — F04 lokal

Buka kasus, lalu **Tambah revisi**. Isi satu instruksi yang dapat dikerjakan pemilik usaha, maksimal 2.000 karakter. Tugas disimpan sebagai **Perlu dikirim**, tanpa tanggal tindak lanjut. Beberapa tugas boleh memiliki instruksi yang sama jika memang dibuat sebagai intent terpisah.

Detail kasus menampilkan instruksi utuh, status teks, tanggal yang sudah tersimpan jika ada, dan pagination 20 tugas per halaman. **Ubah instruksi** hanya tersedia untuk pendamping penanggung jawab. Koordinator dapat membaca; assignee penerima kasus pindahan dapat mengelola revisi meskipun kontak bukan miliknya. Pendamping lama kehilangan akses.

Edit instruksi menjaga status dan tanggal, termasuk pada tugas selesai. F04 tidak menyediakan pengiriman, perubahan status/tanggal, draf WhatsApp, hapus tugas, atau timeline instruksi. Konflik menampilkan data terbaru untuk ditinjau; instruksi pengguna tetap tersedia dan penerapan ke versi terbaru harus eksplisit. Retry setelah gagal koneksi memakai intent yang sama, termasuk setelah peninjauan konflik. Baris baru native CRLF dan hydrated LF dinormalisasi sebelum validasi dan hash intent.

Mutasi create memakai F01 `create_task`; edit memakai RPC baru `update_task_instruction`. Migrasi `20261121000600_task_instruction.sql` diterapkan hanya ke stack lokal tanpa reset dan tipe schema diregenerasi. Pada sesi penerapan berikutnya, migrasi 006 juga diterapkan ke cloud development dan diverifikasi secara struktural/API anonymous; lihat [laporan F04 cloud](F04_CLOUD_VERIFICATION.md). Alur bisnis F04 bersesi cloud belum diuji; jangan menganggap keberhasilan F03C sebagai bukti F04 cloud.

Tes service/DOM ditambahkan di `tests/revisions.test.ts` dan `tests/revision-forms.test.tsx`. Suite HTTP `db:caseload:test` kini mencakup F03/F04, create/update/reload/retry, status/tanggal tetap, konflik, transfer/pencabutan, peran/tenant dan halaman kedua. SQL instruction-only mencakup completed, receipt setelah status berubah, versi/audit dan pembatasan akses. Hasil akhir tersedia pada [status project](PROJECT_STATUS.md).
