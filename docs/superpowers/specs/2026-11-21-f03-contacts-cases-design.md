# F03 — Kontak dan kasus di area staf

Tanggal: 21 November 2026. Status: disetujui pengguna untuk implementasi bertahap pada 21 November 2026; pendekatan area `/staf` dipertahankan.

## Tujuan dan batas

Pendamping yang sudah login dapat menyimpan kontak usaha, memilihnya kembali, dan membuat kasus pengajuan melalui Supabase dengan akses yang benar. Koordinator dapat membaca kasus lembaganya. Ini melanjutkan F01/F02/F02C, bukan mengganti frontend demo sekaligus.

Acuan: [PRD](../../PRD_Pelacak_Revisi_Halal.md), [backlog F03](../../BACKLOG.md), [model data](../../DATA_MODEL.md), [arsitektur](../../ARCHITECTURE.md), [sistem desain](../../DESIGN_SYSTEM.md), dan [F02](2026-11-21-f02-staff-auth-design.md).

Selesai berarti tambah/ubah/baca kontak, pilih kontak milik sendiri untuk kasus, buat/baca/ubah nomor pengajuan kasus, validasi/error/retry/konflik, dan pembatasan baca/tulis terbukti. Kasus baru belum memiliki revisi dan tidak dianggap tuntas.

F04–F08 tetap terpisah: tidak membuat revisi, draf WhatsApp, perubahan status, antrean tindakan, atau UI transfer. Tidak membuat administrasi staf, signup, hapus data, impor/ekspor, tenant otomatis, maupun integrasi SIHALAL. Tidak deploy, mengirim email/WhatsApp, membuat fixture cloud, atau menggunakan data nyata. Pengujian memakai stack/akun fiktif lokal.

## Temuan fondasi

- F01 sudah menyediakan `create_contact`, `update_contact`, `create_case`, dan `update_case`, RLS, expected version, serta receipt retry. Client bisnis menggunakan sesi pengguna; tidak ada service-role runtime.
- `create_case` hanya menerima kontak milik aktor di LP3H tersebut. Kontak yang hanya terbaca melalui kasus pindahan bukan pilihan sah untuk kasus baru.
- `update_contact` hanya untuk pemilik kontak dengan peran pendamping aktif. Pemilik masih boleh mengubah kontak miliknya setelah salah satu kasusnya dipindahkan; perubahan berlaku untuk semua kasus yang merujuk kontak itu.
- `update_case` hanya mengubah nomor pengajuan. Tidak menyediakan penggantian kontak atau assignee. Demo mempunyai kemampuan lebih luas; jangan menambah RPC hanya untuk menyalin semuanya.
- Beberapa membership aktif sudah bisa ditampilkan di `/staf`, tetapi belum ada tenant terpilih. Pilihan organisasi harus eksplisit.
- Form/list bisnis demo memakai `useDemo`, identitas fiktif dan mutasi browser. Gunakan token/pola visualnya, bukan store/logika otorisasinya.

## Pendekatan

1. **Dipilih pengguna: fitur nyata di area `/staf`, demo lama tetap tersedia.** Server Components untuk pembacaan dan Server Actions untuk mutasi; UI kecil mengikuti pola visual yang ada. Konsekuensinya ada route terpisah selama integrasi bertahap, tetapi data dan identitas demo tidak bercampur.
2. **Dipertimbangkan: mengganti route demo `/kontak` dan `/kasus`.** Lebih cepat menyeragamkan URL akhir, tetapi shell, detail/revisi, transfer, dan draf masih bergantung pada store serta ID demo. Perubahan akan meluas ke F04–F08 dan menimbulkan tautan yang salah. Tidak dipilih untuk F03.

Keputusan implementer yang diajukan: gunakan konteks organisasi pada path, dan simpan kontak baru sebagai langkah tersendiri sebelum membuat kasus. Ini memakai RPC yang tersedia tanpa transaksi gabungan baru. Pengguna meninjau keputusan ini bersama rancangan sebelum implementasi.

## Konteks LP3H dan rute

`/staf` tetap halaman akun/membership. Setiap membership mempunyai tautan berlabel ke kontak dan kasus LP3H itu; nama LP3H berasal dari query sah. Tidak memilih membership pertama secara diam-diam, termasuk bila hanya ada satu. Berpindah LP3H melalui halaman ini; tidak menyimpan identitas/tenant di localStorage.

Gunakan prefiks `/staf/lembaga/[organizationId]`:

| Rute setelah prefiks | Isi |
|---|---|
| `/kontak` | Kontak yang boleh dibaca, identitas pemilik bila diperlukan untuk membedakan kontak sendiri/pindahan |
| `/kontak/baru` | Form tambah kontak milik pendamping yang login |
| `/kontak/[contactId]` | Detail kontak dan kasus terkait yang memang boleh dibaca |
| `/kontak/[contactId]/edit` | Form ubah kontak, hanya pemilik pendamping aktif |
| `/kasus` | Daftar kasus yang boleh dibaca, dengan identitas usaha dan nomor pengajuan |
| `/kasus/baru` | Pilih kontak milik sendiri, nomor pengajuan opsional, buat kasus |
| `/kasus/[caseId]` | Identitas kasus/kontak, nomor pengajuan, penanggung jawab minimum, dan penjelasan bila belum ada revisi |
| `/kasus/[caseId]/edit` | Ubah nomor pengajuan, hanya pendamping yang ditugaskan |

Nama route/file internal boleh disederhanakan builder selama konteks LP3H eksplisit dan seluruh alur tetap terhubung. Jangan membuat route kosong atau tombol untuk F04/F08 yang belum berfungsi.

## Tahapan pelaksanaan setelah rancangan disetujui

1. **Konteks dan akses:** helper server terverifikasi, tautan membership, query terbatas organisasi dan keadaan akses/error. Tes batas akses ditulis sebelum implementasi.
2. **Kontak:** daftar/detail, tambah/ubah, normalisasi nomor, konfirmasi duplikat, retry dan konflik. Selesaikan error dan pengujian sebelum menambah alur kasus.
3. **Kasus:** pilih/reuse kontak, buat/detail/ubah nomor pengajuan, pembatasan pendamping/koordinator, serta hubungan kontak setelah transfer yang disiapkan fixture lokal.
4. **Verifikasi dan handoff:** tes integrasi HTTP dengan Auth/database lokal, regresi fondasi/demo/Auth, check/build, review dan pembaruan dokumentasi. F03 baru ditandai selesai setelah seluruh tahap lulus.

Ini satu irisan F03, bukan izin otomatis melanjutkan F04. Kemajuan dilaporkan per tahap; tidak menandai F03 selesai hanya karena helper atau satu form tersedia.

## Membaca dan memeriksa akses

- Setiap halaman, query detail/daftar, dan Server Action memverifikasi identitas lewat SDK serta membership aktif untuk organisasi path. Layout/proxy bukan satu-satunya guard. Gunakan client pengguna/RLS, tanpa cache persisten lintas pengguna.
- `organizationId`, ID kontak/kasus, expected version, dan semua FormData adalah input tak tepercaya. Validasi UUID/versi dan cek hubungan record dengan organisasi. LP3H dari URL hanya memilih konteks; izin ditentukan membership database.
- Owner/assignee dan role diturunkan dari identitas/membership server. Jangan menerima owner, assignee, role atau status baru dari form. RPC tetap menjadi batas final dan memeriksa ulang membership terkini.
- Semua query bisnis diberi filter organisasi terverifikasi, lalu RLS mempersempit hak record. Query detail juga difilter ID; jangan membaca record lembaga lain untuk menentukan keberadaannya.
- Pendamping: membaca kontak sendiri atau yang dirujuk kasus tugasnya; membaca kasus tanggung jawabnya; membuat kontak/kasus untuk dirinya; mengubah kontak milik sendiri dan nomor pengajuan kasus tugasnya.
- Koordinator: membaca kasus satu LP3H dan kontak yang diperlukan oleh kasus tersebut. Tidak melihat kontak kosong milik pendamping yang belum terkait kasus; tidak diberi tombol maupun hak mutasi kontak/kasus. Transfer tetap F08.
- Detail kontak hanya memuat kasus terkait yang lolos RLS, bukan seluruh kasus yang kebetulan memakai kontak itu. Tidak menampilkan hitungan tersembunyi atau ID/metadata record yang tidak boleh dibaca.
- Keputusan implementer: schema belum mempunyai nama tampilan staf. Untuk F03, identitas kepemilikan/penugasan ditampilkan sebagai “Anda” atau “Pendamping lain”, berdasarkan ID yang diverifikasi server; jangan menebak nama dari email, metadata client atau ID demo. Jangan membaca `auth.users` dengan service role untuk memberi nama. Profil/nama staf lintas pengguna harus dirancang terpisah sebelum UI tim/pilot membutuhkannya; F03 tidak mengklaim sudah menampilkan nama pendamping lain.
- Kontak dari kasus pindahan ditandai sebagai dapat dibaca; tombol ubah/buat kasus hanya muncul untuk kontak milik aktor. Kasus pindahan boleh diubah nomor pengajuannya oleh assignee baru, walaupun kontak tetap dimiliki pendamping lama.
- Tidak ada sesi → login; tanpa membership aktif sama sekali → akses terbatas F02; organisasi/record tidak sah atau tidak dapat diakses → pesan generik yang tidak membedakan record hilang dari record tersembunyi. Jangan menyatakan pengguna tidak punya membership apa pun bila ia hanya tidak berhak pada organisasi tertentu.
- Kegagalan provider/query menjadi error layanan dengan retry, bukan daftar kosong atau akses ditolak palsu. Perubahan membership/transfer harus berlaku pada request berikutnya dan pada mutasi langsung, meski form dibuka sebelumnya.

## Alur kontak

Nama usaha dan nomor WhatsApp wajib; sapaan opsional. Gunakan `normalizeWhatsAppNumber` yang sudah ada untuk pratinjau/validasi server, dengan validasi ulang RPC. Nomor `08`, `62`, dan `+62` dengan pemisah yang didukung menjadi digit ternormalisasi; nomor invalid/teks whitespace ditolak. Nama/sapaan dipangkas secara konsisten. Batas panjang form/server yang wajar boleh mengikuti form demo (160 karakter); jangan mengklaim batas tersebut merupakan constraint database yang belum ada.

Pemeriksaan duplikat dibatasi `organization_id + owner_id aktor + nomor ternormalisasi`, kecuali kontak yang sedang diubah. Tidak memeriksa atau menampilkan kontak pendamping lain walaupun nomor sama. RPC memeriksa ulang duplikat saat transaksi agar race tidak melewati konfirmasi.

Jika ditemukan duplikat, tampilkan pilihan menggunakan kontak sendiri yang sudah ada, atau konfirmasi eksplisit “Ini usaha berbeda yang memakai nomor yang sama.” Konfirmasi tidak otomatis aktif dan dibatalkan ketika nomor diubah. Simpan tetap ditolak tanpa konfirmasi bila RPC menemukan duplikat baru setelah halaman dimuat. Checkbox/form client bukan batas keamanan; server memvalidasi nilai dan memanggil RPC dengan flag yang sesuai.

Berhasil menyimpan kontak menuju detail kontak dengan tautan “Buat kasus” bila berhak. Saat menambah kontak dari alur kasus, simpan kontak lebih dahulu lalu buka form kasus dengan kontak terpilih. Jika pembuatan kasus kemudian gagal, kontak tetap merupakan hasil simpan sah; jangan membuat kontak lagi, menghapusnya otomatis, atau mengaku kasus berhasil. Kontak dapat dipakai ulang untuk pengajuan berikutnya.

Form ubah memuat versi kontak. Karena kontak dapat dipakai banyak kasus, tampilkan penjelasan bahwa pembaruan kontak berlaku pada kasus yang memakai kontak tersebut. Tidak ada penghapusan atau perubahan kepemilikan kontak di F03.

## Alur kasus

Form kasus memilih kontak milik pendamping di organisasi tersebut; tidak memilih record pertama otomatis. Tautan “Tambah kontak” mengarah ke alur kontak dan kembali dengan ID terverifikasi. Daftar pemilih tidak memasukkan kontak yang hanya terbaca dari penugasan pindahan. Pilihan dari query string harus diverifikasi lagi di server.

Nomor pengajuan opsional; kosong/whitespace menjadi null. RPC menurunkan assignee dari aktor. Setelah sukses, detail kasus menampilkan usaha, kontak yang diperlukan, nomor pengajuan atau label belum tersedia, dan penanggung jawab minimum yang memang boleh dibaca. Kasus tanpa tugas diberi penjelasan belum ada revisi; tidak diberi badge selesai/progres palsu atau tombol F04 yang belum aktif.

Ubah kasus hanya mengubah nomor pengajuan dengan expected version. Kontak ditampilkan sebagai informasi tetap; tidak membuat UI penggantian kontak yang tidak didukung RPC. Koordinator hanya membaca, pendamping assignee lain ditolak walaupun ia pemilik kontak.

Daftar/detail diambil ulang dari server setelah simpan yang dikonfirmasi RPC. Jangan menyalin record backend ke store demo atau localStorage. Daftar minimum mempunyai pemuatan terbatas/paginasi sederhana dan urutan stabil; pencarian/antrean/filter status F07 tidak ikut ditambahkan. Builder menentukan ukuran halaman dan bentuk kontrol, dengan query tetap dibatasi organisasi dan RLS. Semua kontak sendiri yang sah harus tetap dapat dipilih untuk kasus, termasuk yang berada setelah halaman pertama; pemilih tidak boleh terpotong diam-diam. Tautan dari detail kontak dengan ID terverifikasi dapat dipakai sebagai jalur pemilihan langsung.

## Mutasi, retry dan konflik

- Server Actions menerima data minimum, memverifikasi sesi/membership dan record, memvalidasi input, lalu memanggil empat RPC F01. Tidak menulis tabel langsung dan tidak memakai secret administratif.
- UUID resource untuk create dan request/idempotency key dibuat sekali per intent, bukan setiap retry. Retry payload sama memakai key/ID yang sama. Input baru merupakan intent baru; jangan memakai key sukses lama untuk payload berbeda. Resource ID untuk form create tetap stabil saat hasil sebelumnya belum pasti agar perubahan input tidak membuat duplikat diam-diam.
- Jika respons hilang, pertahankan isian serta intent/ID untuk retry. Jangan menampilkan sukses atau berpindah halaman sebelum hasil terkonfirmasi. Bila ID create sudah tersimpan dengan payload berbeda akibat percobaan sebelumnya, tampilkan hasil tersimpan yang boleh dibaca dan jalur meninjaunya; jangan membuat resource kedua otomatis.
- Double submit UI dicegah dengan pending/readOnly/disabled yang jelas; correctness tetap RPC idempotency, bukan hanya tombol disabled. Form native POST/progressive enhancement harus tetap mengembalikan nilai serta intent yang diperlukan saat validasi/gagal, tanpa mengandalkan efek client untuk otorisasi.
- Update mengirim expected version dari record yang ditinjau. `PT409`/HTTP 409 memuat ulang snapshot yang masih boleh dibaca, menampilkan versi terbaru di samping isian pengguna, dan tidak melakukan overwrite otomatis. Pengguna meninjau/menerapkan ulang secara eksplisit dengan versi/key baru. Bila akses telah dicabut, jangan mengirim snapshot terbaru ke UI.
- Input/duplikat/konflik payload memberi pesan Indonesia yang spesifik dan aman; `42501` memberi akses terbatas, provider/rate-limit/network memberi retry tanpa kehilangan input. Jangan menampilkan raw SQL, payload provider, token, atau ID record tersembunyi. Tidak mencatat nomor/email/data form dalam log.
- RPC sudah menangani receipt/version/audit atomik. Kontak dan kasus adalah dua operasi simpan yang dijelaskan terpisah; F03 tidak membuat transaksi gabungan baru. Tidak diperkirakan perlu migrasi/schema/dependency baru. Jika bukti mengungkap RPC kurang, reproduksi dahulu dan ajukan perubahan cakupan yang diperlukan; jangan menyunting migrasi terpasang.

## UI dan aksesibilitas

Ikuti `public/image.png` serta `DESIGN_SYSTEM.md`: putih, card abu-abu, tindakan hitam/pill, font sistem, gutter HP 20px, input 16px, kontrol 48px, focus terlihat dan ruang safe-area bila memakai navigasi tetap. Tidak mengganti arah desain atau menambah library ikon/animasi. Gunakan komponen presentasi kecil tanpa impor store demo; jangan membangun design system baru.

Tampilkan LP3H dan peran yang sedang dibuka, navigasi kembali ke akun/membership, serta akses kontak/kasus yang sudah berfungsi. Pintu demo tetap berlabel data contoh. Keadaan loading, kosong, layanan gagal, tanpa akses, validasi, pending, sukses terkonfirmasi, dan konflik harus dibedakan.

Form menggunakan label native, autocomplete yang relevan, `type=tel`/inputmode untuk nomor, hint dan inline error yang dihubungkan melalui `aria-describedby`. Validasi tidak menyalahkan input pada pemuatan awal atau setiap ketikan. Setelah submit gagal, tampilkan inline error dan ringkasan bertaut ke field; fokus diarahkan ke ringkasan untuk beberapa error atau field invalid tunggal. Notice retry/konflik dapat diakses pembaca layar. Jangan bergantung pada toast, warna, hover atau ikon saja.

Panduan UI yang sudah ditelusuri: `ui-ux-pro-max` domain UX “error summary validation” dan `modern-web-guidance` untuk `forms`/`validate-input-after-interaction`. Builder membaca panduan lengkap sebelum menulis frontend. Pemeriksaan browser/perangkat tetap UI02 bila alat masih tidak tersedia; jangan mengaku layout/keyboard HP teruji dari jsdom/HTTP.

## Bukti dan definisi selesai

Tes domain/service yang berarti ditulis sebelum implementasi: normalisasi/whitespace, input/versi/UUID invalid, derived identity/role, duplikat hanya kontak sendiri, mapping error aman, key stabil, retry/konflik tanpa kehilangan input. Gunakan toolchain Node/tsx/Testing Library yang terpasang, bukan dependency baru atau tes snapshot kosmetik.

Integrasi HTTP Next + Auth/Postgres lokal harus membuktikan:

1. Pendamping membuat/membaca/mengubah kontak; normalisasi tersimpan, versi maju, duplikat ditolak sampai konfirmasi; kontak yang sama bisa dipakai dua kasus.
2. Membuat kasus dari kontak terpilih, nomor pengajuan opsional, detail/ubah nomor pengajuan, kasus tanpa tugas belum tuntas.
3. Dua LP3H terisolasi; organisasi/ID/role/owner kiriman palsu, anonymous, membership nonaktif dan koordinator yang mencoba menulis ditolak pada server, bukan hanya UI.
4. Hasil simpan hilang/retry/double submit tidak menggandakan record; payload berbeda tidak dianggap retry sukses. Konflik dua sesi menampilkan data terbaru yang sah dan mempertahankan isian tanpa overwrite.
5. Koordinator membaca kasus/kontak terkait lembaganya saja. Fixture lokal mentransfer satu dari dua kasus yang berbagi kontak: assignee lama kehilangan kasus pindahan, assignee baru hanya membaca kasus/kontak yang diperlukan; kontak itu tidak dapat diedit atau dipakai membuat kasus baru olehnya. Kasus saudara tetap tersembunyi.
6. Pencabutan membership/transfer setelah form dimuat menolak submit maupun retry receipt lama. Kegagalan jaringan/provider mempertahankan nilai dan tidak menampilkan sukses palsu.
7. Route demo/draf reload dan F02 tetap lulus. Tidak ada fixture/seed/reset/email pada cloud.

Jalankan suite integrasi yang relevan, `npm run db:test`, `npm run db:auth:test`, `npm run check`, dan `npm run build`. Tambahkan command guard lokal bila memisahkan suite F03, tanpa mengizinkan env cloud pada runner database. Tidak perlu mengulang reset/types bila schema tidak berubah; bila ada migrasi baru, uji reproducible dan regenerasi tipe sesuai aturan project.

Setelah bukti lulus, perbarui status/backlog/arsitektur/handoff dan lakukan review sesuai workflow. Pertahankan perubahan F01/F02 yang belum dikomit pada branch saat ini; tidak membuat commit/push tanpa instruksi pengguna. F03 belum selesai pada tahap persetujuan rancangan ini.

## Keputusan yang boleh dibuat builder

Pembagian file/komponen/helper minimum, ukuran halaman, detail fixture/port Next tes, dan nama state/error internal boleh ditentukan implementer. Tidak boleh memilih tenant otomatis, memperluas peran, mengubah kepemilikan kontak, mengganti kontak kasus, menambahkan F04/F08, mengubah demo atau menggunakan cloud untuk fixture tanpa persetujuan baru.

## Hasil builder check

Reviewer independen menemukan satu pertanyaan penting: sumber nama pemilik/penanggung jawab staf lain belum tersedia pada schema. Diselesaikan sebagai keputusan implementer yang diajukan untuk persetujuan: label “Anda”/“Pendamping lain”, tanpa profil, query admin atau migrasi baru. Keterbatasan disebutkan pada bagian akses dan harus tetap jujur di UI. Tidak ada kode produk atau perubahan schema dibuat pada tahap rancangan.
