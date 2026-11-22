# F05 — Draf WhatsApp staf

Tanggal: 21 November 2026. Status: disetujui pengguna, implementasi lokal mengikuti rencana F05. Pengguna memilih penyimpanan browser per akun, bukan database lintas perangkat. Bukti perangkat/WhatsApp nyata tetap terpisah.

## Tujuan dan batas

Pendamping penanggung jawab dapat memilih beberapa revisi dari satu kasus, meninjau penerima, menyunting pesan, menyalin dan membuka WhatsApp dengan teks terisi. Draf pulih ketika kembali ke aplikasi atau reload. Membuka chat dan menyalin pesan tidak mengubah instruksi, status, tanggal, versi atau audit bisnis.

Acuan: [PRD MVP-04/MVP-07](../../PRD_Pelacak_Revisi_Halal.md), [backlog](../../BACKLOG.md), [arsitektur](../../ARCHITECTURE.md), [panduan staf](../../STAFF_CASELOAD.md), [sistem desain](../../DESIGN_SYSTEM.md), dan [Click to Chat WhatsApp](https://faq.whatsapp.com/5913398998672934).

F06 tetap terpisah: tidak ada tombol “Tandai sudah dikirim”, perubahan status/tanggal, penyelesaian, atau pencatatan pengiriman palsu. Tidak ada bot, pengiriman otomatis, integrasi SIHALAL, lampiran, sinkronisasi draf lintas perangkat atau riwayat pesan. Tidak mengubah demo lama, schema, migrasi atau konfigurasi cloud. Tidak mengirim pesan/email, membuat fixture cloud, deploy, commit/push atau memakai data nyata dalam pengujian.

## Pendekatan yang dipilih

1. **Dipilih pengguna: browser per akun/LP3H/kasus.** `localStorage` terpisah dari store demo; tidak ada tabel baru. Pulih setelah reload pada browser/origin yang sama, tanpa janji lintas perangkat. Penyimpanan ini bukan otorisasi atau brankas terenkripsi.
2. **Tidak dipilih: database lintas perangkat.** Memerlukan tabel, migrasi/RLS dan konflik sinkronisasi baru. Melampaui kebutuhan draf temporer saat ini.

Keputusan implementer yang diajukan: gunakan route `/staf/lembaga/[organizationId]/kasus/[caseId]/pesan`, pola Server Components/Actions untuk seluruh pembacaan bisnis dan komponen client khusus editor. Gunakan kembali `composeWhatsAppDraft`, normalisasi nomor dan builder URL domain yang ada; tidak memakai identitas/state demo dan tidak menambahkan dependency.

## Alur dan antarmuka

- Detail kasus mendapat **Draf WhatsApp** untuk pendamping yang ditugaskan. Tiap revisi aktif dapat mempunyai tautan dengan `?pilih=<taskId>` sebagai pilihan awal; parameter ini tidak pernah menimpa draf yang sudah tersimpan.
- Halaman menampilkan nama usaha, sapaan jika ada, nomor penerima dari data server terkini, pilihan revisi, textarea pesan dengan label terlihat, **Salin pesan**, dan **Buka WhatsApp**. Teks menjelaskan bahwa pengiriman dilakukan pengguna di WhatsApp dan status belum berubah.
- Revisi yang dapat dipilih adalah tugas kasus tersebut dengan status selain `completed`. Koordinator tidak mendapat editor; hanya penanggung jawab aktif dapat membuka/mengekspor draf. Pilihan awal draf baru adalah semua revisi aktif, atau satu ID URL yang sah jika diberikan. Tidak ada tugas aktif: tampilkan keadaan kosong dan tautan tambah revisi, tanpa tombol kirim palsu.
- Pemilih dipaginasi atau memuat halaman berikutnya dengan kontrol eksplisit; tidak membatasi diam-diam pada 20 tugas F04. Pilihan lintas halaman tetap tersimpan, dan penyusunan pesan memvalidasi seluruh ID terpilih di server. **Pilih semua** harus jelas berarti seluruh revisi aktif kasus, bukan hanya halaman yang sedang terlihat.
- Perubahan checkbox menyusun ulang pesan hanya jika belum ada suntingan manual. Bila pesan sudah disunting, pertahankan isinya dan tampilkan keputusan eksplisit: **Susun ulang pesan** (menggantikan suntingan dengan instruksi terkini) atau **Gunakan pesan suntingan**. Ekspor menunggu keputusan ini agar pilihan baru tidak diam-diam dianggap sudah terwakili.
- Gunakan token dan pola F03/F04: card netral, tindakan hitam, badge status teks, gutter HP 20px, kontrol 48px, textarea 16px, focus terlihat dan ruang safe area. Tidak merombak navigasi/desain. Feedback penyimpanan, penyalinan dan error diumumkan; error terhubung ke kolom yang relevan.

## Draf tersimpan dan pemulihan

- Key memiliki namespace/versi format, user ID terverifikasi, organization ID dan case ID. Payload minimal: ID tugas terpilih, pesan, penanda suntingan, snapshot versi tugas/kontak yang diperlukan untuk mendeteksi perubahan, serta revisi lokal untuk konflik tab. Jangan menyimpan token, email login, role, nomor penerima atau salinan objek kontak/tugas lengkap.
- Baca storage hanya di browser setelah konteks server sah tersedia; jangan menampilkan nilai tersimpan milik akun lain saat SSR/hidrasi. Validasi bentuk, identitas, tipe, ID ganda dan ukuran payload; data rusak tidak menyebabkan crash atau langsung ditimpa. Tampilkan opsi eksplisit memulai draf baru.
- Draf tersimpan mengalahkan seed/parameter URL, termasuk pesan kosong atau pilihan kosong yang sengaja disimpan. Pemuatan tidak boleh menulis draf default sebelum pemulihan selesai. Perubahan persisten ditulis segera; kegagalan quota/storage mempertahankan editor di memori dan menampilkan bahwa pemulihan setelah reload belum terjamin. Jangan menampilkan “tersimpan” sebelum write berhasil.
- Label menyatakan **Draf di perangkat ini**. Sediakan **Hapus draf** dengan konfirmasi; hanya key draf akun/LP3H/kasus itu yang dihapus. Tanpa penghapusan eksplisit, draft tetap di browser sampai storage dibersihkan. Logout tidak mengubah draf menjadi data publik; akun lain tidak dapat memulihkannya melalui UI. Tidak menjanjikan penghapusan jarak jauh atas data yang sudah diunduh atau keamanan terhadap orang yang mengakses profil browser secara langsung.
- Event storage dari tab lain tidak otomatis menimpa isian tab yang sedang diedit. Tampilkan konflik lokal dan tahan write otomatis dari tab usang sampai pengguna memilih muat draf tab lain atau pertahankan isian tab ini. Jangan kehilangan suntingan secara diam-diam. Tidak mengklaim transaksi/CAS lintas tab yang dijamin `localStorage`.
- Perubahan data server tidak otomatis menyusun ulang pesan tersimpan. Tampilkan pemberitahuan bila versi instruksi/kontak atau kelayakan pilihan berubah; pengguna meninjau penerima dan memilih susun ulang atau pertahankan suntingan. ID yang tidak lagi sah tidak boleh lolos ekspor. Kasus/akses hilang: sembunyikan editor dan tolak ekspor; jangan membaca data tambahan lewat storage.

## Server, akses dan ekspor

- Server memverifikasi identity, membership aktif, LP3H dan assignee pada halaman dan setiap Server Action pembacaan/validasi ekspor. Filter task harus terikat case ID yang telah diotorisasi; ID/versi client bukan bukti akses. Koordinator, pendamping lama setelah transfer, anggota nonaktif dan tenant lain ditolak. Tidak ada service-role runtime.
- Pembacaan bertahap/penyusunan ulang menggunakan client pengguna/RLS. Task completed tidak disertakan. Error layanan adalah error yang dapat dicoba ulang, bukan daftar kosong. Read-only Action tidak mengubah tabel bisnis, versi, audit atau receipt mutasi.
- Sebelum **Salin pesan** dan **Buka WhatsApp**, validasi ulang akses, kontak/penerima dan seluruh ID/versi terpilih melalui server. Perubahan berarti editor tetap tersedia untuk ditinjau, tanpa ekspor otomatis. Setelah tinjauan eksplisit, snapshot terbaru dipakai. Mode offline mempertahankan suntingan tetapi tidak mengklaim akses terbaru sudah terverifikasi.
- Revalidasi juga saat kembali/focus atau pemulihan halaman dari browser history; tutup akses ekspor selama pemeriksaan. Jika akses dicabut, jangan menampilkan snapshot baru. Ini tidak dapat menarik kembali teks yang sudah disalin atau data yang sudah diunduh sebelumnya.
- Nomor diambil dari kontak server, bukan payload tujuan client. Nomor kosong/tidak valid memblokir chat, tetap menawarkan salin pesan dan koreksi kontak jika pemilik; penerima kontak pindahan diberi penjelasan bahwa koreksi perlu pemilik/koordinator. Validasi nomor tidak membuktikan nomor mempunyai akun WhatsApp.
- Ekspor memerlukan pesan tidak kosong dan minimal satu revisi aktif yang sah. Pesan kosong tidak dianggap sukses. Isi pesan merupakan suntingan pengguna, tidak dipakai sebagai instruksi resmi atau audit. Batas editor yang diajukan: 64.000 karakter, dengan pesan server/penyimpanan yang jelas saat melebihi; tidak memotong diam-diam. Pesan hasil gabungan yang melebihi batas tetap dapat dikurangi pilihan/isinya sebelum ekspor.
- Penyalinan menggunakan Clipboard API sesudah validasi. Browser dapat menolak clipboard setelah operasi async; tangani dengan fokus/seleksi textarea dan instruksi salin manual, tanpa klaim sukses. Jangan memakai `execCommand` atau menambah dependency clipboard.
- Chat memakai URL `https://wa.me/<digit>?text=<encoded-message>` dari helper domain, tanpa mencatat URL/pesan ke log/analytics. Navigasi di tab yang sama sesudah validasi menghindari popup baru setelah await; jika browser tidak melanjutkan/deep link terhalang, tampilkan tautan eksplisit untuk melanjutkan. Jangan menyatakan chat terbuka atau pesan terkirim hanya karena navigasi diminta.
- Keputusan konservatif aplikasi: tautan berisi teks maksimal 8.000 karakter URL ter-encode. Ini bukan klaim batas universal WhatsApp/browser. Jika lebih panjang, pertahankan pesan lengkap dan tawarkan salin manual plus tautan chat tanpa teks; tidak memotong pesan. Emoji, newline, `&`, `#`, tanda kutip dan input Unicode rusak tidak boleh menghasilkan tautan salah/crash.
- Fitur editor membutuhkan JavaScript untuk storage/clipboard/interaksi. Sebelum hidrasi atau tanpa JavaScript tampilkan keadaan yang jujur dan kontrol ekspor tidak aktif; tidak mengklaim persistensi native POST untuk draf lokal.

## Verifikasi dan definisi selesai

TDD untuk aturan baru, Ponytail untuk reuse terkecil. Sebelum kode UI/client, baca panduan Next terpasang, jalankan modern-web-guidance dan gunakan ui-ux-pro-max sesuai pola referensi.

- Domain/service: satu kasus, filter status/ID ganda, pagination lengkap, scoped read dan penolakan lintas tenant/assignee/role/revoked; susun teks/URL khusus; tujuan server terkini; validasi versi/kontak sebelum ekspor; tidak ada mutasi status/audit.
- Storage/DOM: pemulihan setelah store/komponen baru dan URL pilihan sama, akun/LP3H/kasus terpisah, empty draft, corrupted/quota failure, edited selection tidak ditimpa, konflik tab, perubahan instruksi/kontak, akses hilang, clipboard gagal/manual, URL panjang dan JavaScript/hidrasi.
- HTTP Next/Auth/DB lokal: guard halaman/Actions, baca beberapa halaman revisi, penolakan ID tugas kasus lain, transfer/pencabutan dan readback bahwa compose/validate tidak memutasi instruksi/status/versi/audit. Fixture lokal tanpa pesan/email eksternal; jangan membuka tautan WhatsApp nyata lewat alat.
- Jalankan `npm run check`, suite HTTP terkait dan regresi relevan, serta `npm run build`; perbarui status/handoff dan lakukan review independen.
- Uji HP/laptop, clipboard nyata, aplikasi WhatsApp dan kembali ke browser hanya diklaim bila benar-benar diuji. Jika host browser tetap tidak tersedia, laporkan batas itu dan biarkan bagian perangkat/UI02 terbuka; DOM/HTTP tidak menggantikan bukti tersebut.

## Diserahkan kepada implementer

Penempatan modul sederhana mengikuti F04, detail loading/pagination dan format konflik lokal. Tidak membuat framework store generik atau mengganti alur Auth. Semua keputusan ukuran, penyimpanan, perubahan pilihan dan fallback di atas merupakan usulan implementer yang ditinjau bersama rancangan ini; hanya pilihan browser per akun yang sudah diputuskan pengguna.

## Pemeriksaan rancangan

Builder check independen tidak menemukan pertanyaan penting yang menghalangi perencanaan. Kontrak akses F03/F04 sesuai; rincian rekonsiliasi pilihan tidak sah, tampilan konflik dan pagination dapat diselesaikan implementer. Pengguna kemudian menyetujui dokumen ini. Review implementasi menemukan pending pada fallback lanjutan; perbaikannya dibuktikan regresi RED→GREEN. Fallback memakai POST read-only yang memvalidasi ulang sebelum redirect; selama permintaan ini editor dikunci agar tidak mengekspor teks yang disunting sesudah submit.
