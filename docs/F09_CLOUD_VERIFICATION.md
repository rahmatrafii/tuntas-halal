# Latihan alur pilot di cloud development

**Lulus pada 23 November 2026.** Run `ca94b085-92cc-4d48-b5e7-d006047ed364` menjalankan aplikasi workspace di localhost dengan Supabase Auth/database `tuntas-halal-dev`. Target administratif dicocokkan dengan konfigurasi aplikasi dan project development. Dua LP3H dan lima akun fiktif digunakan untuk membuktikan batas akses. Terdapat satu kontak, tiga kasus, dan tiga revisi. Satu kasus tambahan disiapkan untuk memeriksa filter pendamping penerima.

| Tahap | Bukti HTTP aplikasi dan database |
| --- | --- |
| Masuk dan memuat antrean | Empat sesi memakai callback Auth cloud. Akses anonim ditolak. Filter pencarian nomor menemukan dua revisi baru pada kasus utama. |
| Kontak, kasus dan revisi | Nomor invalid mempertahankan isian. Nomor sah dinormalisasi. Kontak dipakai ulang pada dua kasus. Instruksi kosong ditolak. Replay pembuatan kontak dan revisi kembali ke data yang sama. |
| Draf dan pengiriman | Compose merangkai dua instruksi terpilih. URL WhatsApp membawa penerima dan teks Unicode yang tepat. Runner membaca tujuan redirect tanpa mengikutinya. Tugas dan audit tetap sama sampai konfirmasi pengiriman. |
| Tindak lanjut | Konfirmasi dua revisi mencatat tepat dua audit. Replay memakai receipt yang sama. Kedua tugas masuk Hubungi hari ini. Setelah satu balasan dicatat, satu tugas Perlu dicek dan satu tetap perlu dihubungi. |
| Serah terima | Filter koordinator bekerja. Pengalihan tanpa konfirmasi dan penerima di luar syarat ditolak. Konflik versi menampilkan penanggung jawab terbaru, dan pengalihan sesudah tinjau tercatat satu kali meski dikirim ulang. Pendamping lama kehilangan akses ke kasus itu. Penerima mendapat kasus dan kontak yang diperlukan tanpa memperoleh kasus saudara. |
| Penyelesaian dan sesi | Penerima menyelesaikan tugas yang sudah dikonfirmasi. Detail menampilkan 1/2 dan belum tuntas, lalu 2/2 dan tuntas setelah tugas kedua selesai. Reload dan filter Selesai menampilkan hasil yang sama. Logout menghentikan akses antrean. Setelah membership koordinator dicabut, replay transfer diarahkan ke akses terbatas. |

Latihan otomatis mencapai hasil selesai dalam sekitar **43 detik** sebelum cleanup. Durasi ini mencakup penyiapan sesi, permintaan HTTP dan pemeriksaan data. Baseline menit aktif pendamping diukur terpisah setelah peserta disepakati. [Lembar pengukuran](PILOT_READINESS.md)

Percobaan pertama `c4e23fdf-9662-4d89-987b-8370a4a505c5` berhenti pada pemeriksaan progres 1/2. Tes ulangan dengan renderer React memperlihatkan bahwa pemisah HTML memecah deret teks, sementara teks DOM utuh. Runner diperbaiki untuk memeriksa DOM dan status database. Kode aplikasi tidak berubah pada sesi F09.

Kedua run dibersihkan. Query administratif read-only terpisah mengonfirmasi nol sisa organisasi, membership, kontak, kasus, revisi, audit, receipt dan akun Auth untuk masing-masing run. Enam migrasi dan enam tabel dengan RLS tetap tersedia, guard audit aktif, dan fingerprint dua revisi fixture HP lama sama sebelum/sesudah. Token dan cookie hanya dipakai di memori. Pengiriman email dan WhatsApp tidak dilakukan.

Validasi lokal pada sesi yang sama lulus untuk lint, TypeScript, 130 tes aplikasi, build produksi, 128 assertion SQL, satu skenario concurrency, HTTP Auth/Mailpit, dan integrasi HTTP alur bisnis. Stack lokal yang sudah ada dipakai untuk suite database.

Uji bisnis ini memakai aplikasi localhost dan backend cloud development. Pengujian origin HTTPS pilot, email live, visual dan perangkat masih berada di checklist pilot. [Panduan pilot](PILOT_READINESS.md)
