# PRD Pelacak Revisi Halal

**Versi 1.0 · 19 November 2026 · Bahasa Indonesia**

**Keputusan teknologi** — Next.js dengan TypeScript dan Supabase.  
**Rilis pertama** — Aplikasi web untuk uji coba di satu Lembaga Pendamping Proses Produk Halal (LP3H).  
**Pengguna utama** — Pendamping Proses Produk Halal (Pendamping PPH).

## 1. Ringkasan produk

Pelacak Revisi Halal membantu pendamping menuntaskan revisi pengajuan sertifikasi halal Self Declare. Pendamping mencatat satu tindakan yang perlu dilakukan, membuka WhatsApp dengan pesan yang sudah disiapkan, lalu memperbarui status ketika ada balasan. Saat membuka aplikasi, pendamping langsung melihat revisi yang perlu dikirim, ditindaklanjuti, atau diperiksa.

**Janji produk:** pendamping bisa menemukan tindakan berikutnya tanpa perlu membuka satu per satu percakapan WhatsApp. Pemilik usaha cukup membalas WhatsApp seperti biasa. Pengajuan dan pembaruan resminya dilakukan di SIHALAL atau kanal resmi yang digunakan untuk pengajuan tersebut.

## 2. Masalah dan tujuan

| Situasi                                      | Hambatan                                                                                                        | Tujuan produk                                                                        |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Pengajuan dikembalikan dengan catatan revisi | Pendamping perlu mengubah catatan menjadi instruksi yang bisa dikerjakan pemilik usaha.                         | Simpan satu permintaan yang spesifik dan gunakan isinya langsung sebagai draf pesan. |
| Pendamping menangani beberapa usaha          | Sulit mengingat siapa yang sudah dihubungi, siapa yang perlu diingatkan, dan balasan mana yang perlu diperiksa. | Tampilkan antrean tindakan lintas usaha dalam satu halaman.                          |
| Ada beberapa revisi untuk satu usaha         | Permintaan bisa tersebar di banyak pesan dan mudah terlewat.                                                    | Gabungkan permintaan untuk usaha yang sama dalam satu draf dan lacak satu per satu.  |
| Koordinator ingin mengetahui hambatan tim    | Koordinator harus bertanya satu per satu untuk mengetahui kasus yang perlu perhatian.                           | Berikan tampilan antrean di LP3H yang sama dengan filter per pendamping.             |

BPJPH mencatat 86.526 pengajuan SEHATI 2025 berstatus dikembalikan per 5 Januari 2026. Angka itu merupakan catatan pada satu tanggal dan tidak mengukur frekuensi masalah di setiap LP3H. SIHALAL sudah memiliki pelacakan dan catatan pengembalian. Produk ini menguji manfaat dari **mengoordinasikan tindakan setelah catatan tersebut muncul**. [Surat BPJPH tentang pengajuan yang dikembalikan](https://cmsbl.halal.go.id/uploads/Tindak_Lanjut_Pendaftaran_yang_Dikembalikan_a1ff565f13.pdf) · [Contoh pengembalian dari P3JPH UIN Jakarta](https://www.p3jph.biz.id/informasi/PengembalianKF)

## 3. Pengguna dan hak akses

| Pengguna             | Kebutuhan                                                                                | Hak akses pada versi pertama                                                                                                     |
| -------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| **Pendamping PPH**   | Menangani revisi usahanya dari HP atau laptop.                                           | Membuat, melihat, dan mengubah kasus yang menjadi tanggung jawabnya. Membuat draf WhatsApp dan mengubah status revisi per tugas. |
| **Koordinator LP3H** | Melihat kasus yang perlu perhatian dan menjaga kesinambungan ketika pendamping berganti. | Melihat kasus dan revisi dalam LP3H-nya, memfilter per pendamping, dan mengalihkan penanggung jawab kasus.                       |
| **Pemilik usaha**    | Menerima permintaan yang jelas dan bisa langsung membalas.                               | Menerima dan membalas pesan lewat WhatsApp dengan akun yang biasa dipakai.                                                       |

Untuk uji coba, akun staf disiapkan melalui undangan. Setiap kasus punya satu pendamping penanggung jawab. Setelah pengalihan, pendamping baru memperoleh akses dan pendamping lama kehilangan akses sebagai penanggung jawab. Koordinator tetap dapat melihat kasus di LP3H-nya.

## 4. Alur utama

1. **Buat kasus.** Pilih atau tambahkan kontak usaha. Isi nama usaha dan nomor WhatsApp sekali. Tambahkan nomor pengajuan resmi jika tersedia. Kontak yang sama dapat digunakan lagi untuk pengajuan berikutnya.
2. **Catat revisi.** Tulis permintaan yang dapat dikerjakan pemilik usaha, misalnya “Kirim ulang foto bagian komposisi bumbu balado dengan tulisan terbaca.” Tanggal tindak lanjut bersifat opsional.
3. **Buka WhatsApp.** Tinjau draf, pilih revisi yang ingin disertakan, lalu buka chat dengan draf terisi. Pendamping menekan **Kirim** di WhatsApp.
4. **Catat pengiriman.** Saat kembali, pendamping menandai revisi yang benar-benar dikirim sebagai **Menunggu balasan**. Tanggal tindak lanjut bisa ditambahkan saat itu juga.
5. **Periksa balasan.** Ketika pemilik usaha membalas, tandai hanya tugas yang mendapat jawaban sebagai **Perlu dicek**. Jika bukti masih kurang, perjelas permintaan dan pindahkan tugas ke **Perlu dikirim**.
6. **Tuntaskan revisi.** Setelah koreksi diperiksa dan perubahan yang diperlukan dicatat di kanal resmi, tandai tugas **Selesai**. Kasus tampil sebagai tuntas setelah semua tugasnya selesai.

**Contoh draf pesan**

> Halo Bu Rina, untuk pengajuan Keripik Bu Rina, boleh kirim ulang foto bagian komposisi bumbu balado yang tulisannya terlihat jelas? Terima kasih, Bu.

Jika satu pesan memuat dua permintaan dan pemilik usaha hanya menjawab satu, pendamping hanya memindahkan tugas yang dijawab ke **Perlu dicek**. Tugas lainnya tetap terlihat di daftar menunggu.

## 5. Persyaratan MVP dan kriteria penerimaan

| ID         | Fitur                             | Kriteria penerimaan                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **MVP-01** | **Daftar revisi**                 | Halaman pertama menampilkan tindakan yang perlu dilakukan. Urutan awal ialah **Hubungi hari ini**, **Perlu dicek**, **Perlu dikirim**, lalu **Menunggu balasan**. Revisi selesai tersedia lewat filter. Pencarian menerima nama usaha atau nomor pengajuan. Setiap baris menunjukkan usaha, ringkasan tugas, status, dan tanggal tindak lanjut bila ada.                                                                           |
| **MVP-02** | **Kontak dan kasus**              | Nama usaha dan nomor WhatsApp wajib saat membuat kontak. Nama sapaan dan nomor pengajuan resmi bersifat opsional. Pendamping bisa memakai kembali kontaknya tanpa mengetik ulang nomor. Sistem menampilkan kontak milik pendamping yang sama jika nomor itu sudah tercatat. Satu nomor boleh mewakili lebih dari satu usaha setelah pendamping mengonfirmasi bahwa itu memang usaha yang berbeda.                                  |
| **MVP-03** | **Tambah dan ubah revisi**        | Membuat tugas hanya memerlukan satu kalimat arahan setelah sebuah kasus dipilih. Tugas kosong ditolak dengan pesan di dekat kolom. Tugas baru langsung tampil sebagai **Perlu dikirim**. Satu kasus mendukung banyak tugas dengan status masing-masing.                                                                                                                                                                            |
| **MVP-04** | **Draf WhatsApp**                 | Draf menampilkan penerima dan isi sebelum chat dibuka. Pendamping bisa memilih beberapa tugas dari satu kasus dan meninjau pesan gabungan. Perubahan pada draf hanya berlaku untuk pesan tersebut. Untuk nomor kosong atau format keliru, sistem meminta koreksi dan tetap menawarkan **Salin pesan**. Tautan membuka chat dengan teks terisi. Aplikasi hanya mengubah status setelah pendamping menekan **Tandai sudah dikirim**. |
| **MVP-05** | **Status dan tindak lanjut**      | Pendamping bisa mencatat pengiriman, balasan yang diterima, permintaan perbaikan ulang, dan penyelesaian per tugas. Hari ini dan tanggal lewat masuk **Hubungi hari ini** selama tugas masih **Menunggu balasan**. Tanggal mendatang tetap tampil pada status menunggu. Mengirim pengingat dapat diikuti perubahan tanggal tindak lanjut.                                                                                          |
| **MVP-06** | **Akses staf dan pengalihan**     | Pendamping melihat kasus yang ditugaskan kepadanya. Koordinator dapat melihat kasus satu LP3H dan mengalihkan kasus kepada pendamping aktif di lembaga yang sama. Jika tautan kasus dibuka oleh pengguna tanpa akses, sistem menampilkan pesan akses terbatas.                                                                                                                                                                     |
| **MVP-07** | **Kesalahan dan percobaan ulang** | Jika penyimpanan gagal, perubahan belum dianggap berhasil, isian tetap tersedia, dan pengguna bisa mencoba lagi. Ketukan ganda saat menyimpan satu tugas tidak menghasilkan dua tugas. Jika status berubah di tab atau akun lain, aplikasi menampilkan status terbaru sebelum menerima perubahan berikutnya.                                                                                                                       |

### Aturan status

| Status               | Arti                                                                                  | Tindakan berikutnya                                                                            |
| -------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Perlu dikirim**    | Ada permintaan baru atau koreksi lanjutan yang perlu disampaikan.                     | Buka draf, kirim lewat WhatsApp, lalu tandai tugas yang dikirim.                               |
| **Menunggu balasan** | Pendamping sudah menyampaikan permintaan.                                             | Catat balasan yang masuk, atau buat pengingat dengan tanggal tindak lanjut bila perlu.         |
| **Perlu dicek**      | Pendamping sudah menerima informasi yang bisa diperiksa.                              | Periksa bukti. Jika kurang, kembalikan ke **Perlu dikirim** dengan instruksi yang lebih jelas. |
| **Selesai**          | Pendamping telah memeriksa koreksi dan menyelesaikan pembaruan resmi yang diperlukan. | Lihat kembali lewat riwayat. Jika revisi baru muncul, buat tugas baru di kasus yang sama.      |

Jika balasan diterima saat status masih **Perlu dikirim**, pendamping boleh langsung memilih **Perlu dicek**. Jika suatu status salah ditekan, pengguna dapat mengembalikan status ke tahap sebelumnya. **Hubungi hari ini** adalah tampilan berdasarkan tanggal, sedangkan status tugasnya tetap **Menunggu balasan**.

### Tampilan dan prioritas rilis

- **Halaman utama:** daftar revisi, pencarian, filter, dan tombol **Tambah revisi**. Pada HP, setiap baris menampilkan satu tindakan utama sesuai status.
- **Panel kasus:** kontak usaha, rujukan pengajuan jika ada, daftar tugas, dan draf WhatsApp. Pembuatan kontak baru bisa dilakukan dari panel yang sama.
- **Versi setelah pilot:** penjadwalan kunjungan, pengingat otomatis, lampiran, dan analitik lanjutan dipertimbangkan berdasarkan kebutuhan yang berulang selama uji coba. Otomasi WhatsApp dan sinkronisasi kanal resmi memerlukan penilaian integrasi tersendiri.

## 6. Data dan persyaratan operasional

| Data                    | Isi minimum                                                                                              |
| ----------------------- | -------------------------------------------------------------------------------------------------------- |
| **LP3H dan akses staf** | Lembaga, pengguna, peran, status keanggotaan, dan zona waktu.                                            |
| **Kontak usaha**        | Nama usaha, nomor WhatsApp, sapaan opsional, dan pendamping pemilik data kontak.                         |
| **Kasus**               | Kontak terkait, LP3H, pendamping penanggung jawab, nomor pengajuan opsional, dan waktu dibuat.           |
| **Tugas revisi**        | Kasus, instruksi, status, tanggal tindak lanjut opsional, dan waktu perubahan terakhir.                  |
| **Riwayat perubahan**   | Siapa dan kapan mengubah status atau penanggung jawab. Riwayat tidak membutuhkan salinan pesan WhatsApp. |

- **Minim data.** Simpan kontak dan catatan yang diperlukan untuk tindak lanjut. Foto dan bukti dapat dikirim lewat WhatsApp. Dokumen resmi dan kredensial SIHALAL ditangani di kanal resminya. Gunakan contoh fiktif untuk demo dan data yang disetujui LP3H untuk pilot.
- **Akses sesuai tugas.** Pemeriksaan hak akses berlaku pada pembacaan maupun perubahan data. Pemindahan kasus membawa akses ke informasi kontak yang diperlukan untuk kasus itu tanpa membuka kasus lain dari kontak yang sama. Koordinator menetapkan masa simpan catatan sebelum pilot.
- **WhatsApp.** Gunakan tautan _click to chat_ dengan nomor berformat internasional dan isi pesan yang dikodekan untuk URL. Draf dibuka dari browser pengguna. Pengiriman dan balasan berlangsung di WhatsApp, kemudian pengguna mencatat hasilnya di aplikasi. Uji nomor Indonesia, karakter khusus, dan perpindahan dari aplikasi ke WhatsApp di HP maupun laptop. [Panduan resmi WhatsApp Click to Chat](https://faq.whatsapp.com/5913398998672934)
- **Kenyamanan.** Gunakan bahasa Indonesia, tombol yang nyaman disentuh, status dengan label teks, serta isi draf yang tetap tersedia jika pengguna kembali dari WhatsApp. Zona waktu mengikuti pengaturan LP3H. WIB adalah usulan awal untuk pilot jika sesuai lokasi tim.
- **Keandalan.** Status dan riwayat harus tersimpan dalam satu operasi. Sistem mencatat waktu perubahan secara konsisten dan membaca tanggal tindak lanjut sebagai tanggal kalender lokal.

## 7. Teknologi yang dipilih

| Komponen           | Pilihan dan alasan                                                                                                                                                                                                                             |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Aplikasi web**   | **Next.js App Router + TypeScript.** Satu aplikasi untuk halaman pendamping dan koordinator, pengolahan formulir, dan logika tindakan di server. UI responsif dapat dipakai dari HP dan laptop dengan basis kode yang sama.                    |
| **Database**       | **Supabase Postgres.** Relasi tim, kontak, kasus, dan revisi cocok dengan model relasional. Definisikan tabel dan kebijakan akses lewat migrasi SQL agar perubahan bisa ditinjau dan diterapkan ulang.                                         |
| **Login**          | **Supabase Auth.** Staf masuk dengan email melalui akun undangan. Gunakan sesi server sesuai panduan integrasi Next.js. Pemilik usaha berinteraksi lewat WhatsApp.                                                                             |
| **Hak akses data** | **Row Level Security (RLS)** di Supabase, dengan kebijakan berdasarkan LP3H, peran, dan penugasan kasus. Validasi input juga dilakukan di server. Kunci dengan hak administratif disimpan di lingkungan server bila diperlukan untuk undangan. |
| **Komunikasi**     | **WhatsApp Click to Chat.** Draf siap kirim dengan satu klik cocok untuk pilot dan tidak memerlukan pencatatan status otomatis dari WhatsApp.                                                                                                  |
| **Hosting**        | **Vercel sebagai usulan awal** untuk aplikasi Next.js, dengan proyek Supabase untuk data dan autentikasi. Penyedia hosting dan paket dipilih sebelum memakai data nyata, sesuai biaya dan kebutuhan LP3H.                                      |

**Dokumentasi teknologi** — [Next.js App Router](https://nextjs.org/docs/app) · [Supabase Auth untuk Next.js](https://supabase.com/docs/guides/auth/quickstarts/nextjs) · [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security) · [Next.js di Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs)

## 8. Uji coba dan ukuran keberhasilan

**Peserta yang diusulkan** — Dua pendamping dan satu koordinator di satu LP3H selama dua minggu. Mulai dengan kasus aktif yang memang perlu diperbaiki. Gunakan beberapa kasus sejenis dari alur lama sebagai pembanding. Jika jumlah kasus terlalu sedikit untuk dibandingkan, perpanjang pengamatan sebelum menyimpulkan.

| Ukuran                                 | Cara ukur                                                                                                                                                         | Patokan awal                                                                       |
| -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Waktu kerja per revisi**             | Catat menit aktif untuk mencari catatan, menulis pesan, mengingatkan, mengecek balasan, dan memperbarui pelacak. Bandingkan median per tugas untuk kasus sejenis. | Turun sekitar **30%** dibandingkan alur sebelumnya.                                |
| **Revisi lewat tanggal tindak lanjut** | Hitung tugas yang punya tanggal tindak lanjut dan masih menunggu saat tanggalnya lewat. Catat juga jumlah total tugas bertanggal.                                 | Lebih sedikit tugas terlewat pada kasus sejenis. Gunakan sebagai ukuran pendukung. |
| **Manfaat untuk kedua pengguna**       | Minta pendamping membuka daftar dan menunjukkan tindakan berikutnya tanpa bantuan. Tanyakan ke koordinator cara ia menemukan kasus yang perlu perhatian.          | Keduanya dapat menemukan tugas yang tepat dari halaman utama.                      |
| **Minat membayar**                     | Ajukan penawaran uji coba berbayar kepada pihak LP3H yang bisa memutuskan. Catat jawaban dan alasannya.                                                           | Satu LP3H bersedia melanjutkan dengan uji coba berbayar.                           |

Target 30% dan kesediaan membayar adalah patokan keputusan yang diusulkan, bukan hasil pengukuran. Jika pendamping terbantu tetapi spreadsheet memberikan manfaat yang sama, jalankan alur dengan spreadsheet dan evaluasi lagi kebutuhan aplikasinya.

## 9. Risiko dan keputusan rilis

| Risiko                                                         | Cara menanganinya di MVP                                                                                                                          |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Pekerjaan tercatat dua kali**                                | Simpan instruksi dan status tindak lanjut saja. Gunakan nomor pengajuan untuk merujuk kasus resmi. Ukur waktu pencatatan tambahan dalam uji coba. |
| **Status terlihat sudah dikirim padahal chat baru dibuka**     | Pisahkan aksi membuka draf dari konfirmasi pengiriman. Konfirmasi juga berlaku saat pesan dikirim manual.                                         |
| **Satu balasan disalahartikan sebagai seluruh revisi selesai** | Lacak setiap tugas secara terpisah. Tandai yang benar-benar dijawab, lalu periksa sebelum menyelesaikannya.                                       |
| **Koordinator melihat pekerjaan dari lembaga lain**            | Terapkan batas akses berdasarkan LP3H di database. Verifikasi hak baca dan hak ubah dengan akun uji untuk dua lembaga berbeda.                    |
| **Volume pengajuan pilot terlalu sedikit**                     | Rekrut LP3H dengan beberapa kasus revisi aktif dan sesuaikan durasi pengamatan berdasarkan jumlah kasus yang bisa dibandingkan.                   |

### Tahapan pengerjaan

1. **Simulasi alur.** Gunakan kasus fiktif untuk mencoba cara mencatat instruksi, menggabungkan permintaan, dan menangani balasan sebagian.
2. **Bangun MVP.** Urutkan pekerjaan dari database dan akses staf, penambahan kontak dan tugas, draf WhatsApp, lalu antrean serta filter.
3. **Verifikasi sebelum data nyata.** Uji akses antar-LP3H, percobaan simpan ganda, status saat chat hanya dibuka, satu balasan untuk beberapa tugas, pengembalian tugas yang masih kurang, dan penggunaan dari HP.
4. **Jalankan pilot.** Kumpulkan waktu kerja dan hambatan nyata, lalu putuskan apakah LP3H bersedia memakai versi berbayar.

**Keputusan yang masih terbuka:** LP3H peserta pilot, zona waktu tim, masa simpan catatan, penyedia dan paket hosting, serta harga uji coba. Stack pengembangan sudah dipilih.
