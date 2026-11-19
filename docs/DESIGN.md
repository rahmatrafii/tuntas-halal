# Arah UX dan desain

## Prinsip produk

Pekerjaan utama pengguna adalah menemukan siapa yang harus dihubungi dan apa yang harus dilakukan. Halaman utama harus berupa antrean tindakan; statistik tidak mengambil ruang utama. Rekomendasi ini berasal dari PRD dan penilaian desain, **belum hasil uji pengguna**.

## Hierarki antrean

1. **Hubungi hari ini**: menunggu balasan dan tanggal <= hari lokal LP3H.
2. **Perlu dicek**: bukti/jawaban sudah diterima.
3. **Perlu dikirim**: permintaan belum dikonfirmasi terkirim.
4. **Menunggu balasan**: tanggal mendatang atau belum dijadwalkan.

Selesai tersedia lewat filter. Kelompok tidak menduplikasi tugas. Setiap baris menampilkan nama usaha, instruksi, label status, dan tanggal bila tersedia. Pada HP, satu aksi utama sesuai status; aksi tambahan tetap dapat diakses dengan keyboard.

## Alur dan keadaan wajib

- Tambah revisi: pilih kasus → satu kalimat instruksi → simpan; error kosong dekat input.
- Kontak: deteksi nomor sama dalam lingkup pemilik; tampilkan hasil yang boleh dibaca; konfirmasi usaha berbeda sebelum membuat duplikat nomor.
- Draf: penerima jelas, checkbox per tugas dari satu kasus, pesan gabungan bisa disunting tanpa mengubah instruksi. Tetap ada saat kembali dari WhatsApp.
- Nomor invalid: instruksi koreksi + **Salin pesan** tetap tersedia. Jangan membuka tautan invalid.
- Tombol **Buka WhatsApp** dan **Tandai sudah dikirim** adalah dua aksi terpisah. Tidak ada sukses otomatis saat tab dibuka.
- Balasan sebagian: pengguna memilih tugas yang dijawab; tugas lain tetap menunggu.
- Selesai: beri petunjuk bahwa koreksi diperiksa dan pembaruan resmi yang diperlukan telah dilakukan.
- Error simpan: nilai tetap ada, tombol retry, tidak ada toast sukses. Konflik: tampilkan status terbaru dan minta tindakan ulang.
- Bedakan kosong tanpa data, hasil pencarian kosong, akses terbatas, loading, dan gangguan jaringan.

## Fondasi visual

Sumber visual sekarang adalah `public/image.png`, sesuai instruksi pengguna: latar putih, card abu-abu lembut dengan radius besar, panel tint kebiruan, aksi hitam, badge pastel, serta navigasi pill mengambang. Sistem ini menggantikan warna hijau halaman fondasi. Token dan pola komponen dijelaskan di [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md); implementasi ada di `src/app/globals.css`.

Arial/system sans dipilih untuk mendekati sans pada referensi tanpa mengandalkan font jaringan. Font asli tidak tersedia, sehingga kesesuaian tidak diklaim pixel-identical. Avatar menggunakan inisial staf fiktif; status bar OS dan watermark referensi tidak disalin.

Rekomendasi UI UX Pro Max diperiksa lewat dua query lokal. Hasil otomatis menawarkan layout marketing/video dan tipografi teknis yang kurang sesuai untuk antrean pendamping; **tidak diadopsi sebagai spesifikasi produk**. Yang digunakan sebagai arahan umum: hierarki tugas jelas, tampilan datar, kontras, dan navigasi singkat. Keputusan final tetap mengikuti PRD dan pengujian.

## Standar aksesibilitas dan responsif

- Heading semantik, label formulir eksplisit, skip link, focus terlihat, urutan DOM mengikuti urutan visual.
- Kontras teks normal minimal 4,5:1; kontrol sentuh minimal 44×44 CSS px.
- Ukuran teks memakai rem; tidak mengunci tinggi elemen berteks. Periksa zoom 200% dan layar 375px.
- Grid/flex intrinsik, logical properties, `min-inline-size: 0`, dan dynamic viewport untuk menghindari overflow.
- Native dialog untuk modal ketika dibangun; jangan menambah library dialog hanya untuk satu panel.
- Hormati reduced motion. Jangan menambah animasi dekoratif pada alur pilot.

Frontend kini menampilkan antrean dan seluruh alur demo dengan data fiktif. Card tidak memotong instruksi; status kasus aktif dibedakan dari status tugas menunggu. Form dan detail menggunakan satu kolom pada HP, sedangkan desktop dapat memakai dua kolom dan sidebar.

Kontrol browser berhenti karena alat tidak dapat memastikan URL Chrome pada sesi pengerjaan. Interaksi dapat diuji di DOM virtual, tetapi screenshot 375px/390px, perilaku keyboard HP, dan uji pendamping belum terverifikasi. Jangan menyamakan tes DOM dengan pengujian visual/perangkat nyata.
