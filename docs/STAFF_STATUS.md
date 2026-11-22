# Status, tindak lanjut, dan riwayat staf — F06

## Per revisi

Buka detail kasus → **Perbarui status** pada revisi yang ditangani. Pilih Perlu dikirim, Menunggu balasan, Perlu dicek atau Selesai. Menunggu balasan memerlukan konfirmasi bahwa permintaan sudah dikirim; masuk Selesai memerlukan konfirmasi pemeriksaan koreksi dan pembaruan resmi. Form tidak membaca status pengiriman dari WhatsApp.

Tanggal tindak lanjut boleh kosong, lalu, hari ini atau mendatang. Kosong menghapus tanggal; perubahan status tidak otomatis menghapusnya. Tanggal disimpan sebagai kalender YYYY-MM-DD. Tanggal saat ini diisi pada awal form. Koreksi ke tahap sebelumnya membuat catatan baru, bukan menghapus riwayat atau mengembalikan tanggal lama. Instruksi tetap diubah lewat form Ubah instruksi tersendiri.

## Konfirmasi beberapa revisi

Di draf, bagian **Catat pengiriman** membuka form terpisah. Pilihan draf hanya saran awal, bukan bukti terkirim. Pilih revisi Perlu dikirim yang benar-benar disampaikan; tugas lain tidak berubah. Pilih kebijakan tanggal secara eksplisit: tanpa tanggal menghapus tanggal lama seluruh pilihan, sedangkan tanggal yang sama wajib diisi. Tanggal berbeda dapat disesuaikan per revisi setelahnya. Maksimal 100 pilihan satu transaksi.

Dengan JavaScript, daftar pilihan berpaginasi 20 item dan pilihan bertahan lintas halaman. Tanpa JavaScript, seluruh kandidat/instruksi ditampilkan dalam satu form agar pilihan tidak tersembunyi; server tetap membatasi batch 100. Status dan tanggal dikirim lewat native POST maupun Action hydrated. Draf perangkat tidak dihapus setelah pencatatan; snapshot yang berubah memerlukan tinjauan saat kembali ke draf.

## Akses, error dan konflik

Pendamping hanya mengubah kasus penugasan dengan membership aktif pada LP3H yang dipilih. Koordinator membaca progres dan riwayat tanpa form mutasi. Form menjaga isian dan intent retry ketika koneksi gagal; jangan mengganti isian jika ingin mengulang permintaan yang sama. Saat konflik, tinjau data terbaru lalu pilih **Terapkan isian saya** atau batalkan. Versi terbaru hanya dikirim lewat tindakan peninjauan eksplisit, termasuk tanpa JavaScript.

RPC `set_task_statuses` memeriksa akses, receipt, versi, konfirmasi selesai, dan memperbarui status/tanggal/audit atomik. Receipt diambil sebelum pemeriksaan versi; retry yang sudah berhasil tidak mengubah lagi data walau status terkini kemudian berubah. Batch stale tidak memperbarui sebagian pilihan. No-op tanpa perubahan status/tanggal/versi tidak memanggil RPC dan tidak menambah audit. Tidak memakai update_task yang membawa instruksi.

## Progres dan riwayat

Progres memakai seluruh tugas kasus, bukan halaman aktif. Kasus tanpa tugas belum tuntas. Kasus tuntas hanya bila semua tugas Selesai dan kembali belum tuntas jika status dikoreksi. Riwayat dipaginasi 20, waktu mengikuti zona LP3H. Pelaku ditampilkan Anda/Pendamping lain/Sistem; tidak mengambil profil staf tambahan. Audit tidak menyimpan salinan instruksi/pesan. Task_updated dengan tanggal/status tetap diberi label Revisi diperbarui, bukan menebak isi perubahan.

## Cakupan

Tidak menambah schema/dependency, mengganti status PRD, mengirim email/WhatsApp atau mengubah halaman demo. Antrean nyata F07 dan transfer UI F08 terpisah. Fixture cloud HP tetap aktif dan tidak dipakai runner mutasi lokal. Bukti check/build/integrasi akhir dicatat di PROJECT_STATUS.md; tersedianya kode bukan bukti uji perangkat atau bisnis cloud F06.


## Verifikasi cloud development

Pada 22 November 2026, F06 lulus uji bisnis melalui aplikasi localhost dengan sesi Auth dan database cloud development: status/tanggal/audit, pengiriman sebagian, retry, konflik atomik dan batas akses. Seluruh fixture sementara run telah dibersihkan; fixture HP sebelumnya dipertahankan. Lihat [laporan F06C](F06_CLOUD_VERIFICATION.md). Uji HP F06 masih terpisah.
