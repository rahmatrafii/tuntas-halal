# F06 — Status revisi, tindak lanjut, dan riwayat

## Tujuan dan pilihan

Pengguna memilih perubahan status per revisi dari detail kasus serta konfirmasi beberapa revisi sekaligus setelah pengiriman melalui halaman draf. Alternatif hanya per revisi ditinggalkan karena pencatatan pesan gabungan terlalu banyak langkah. Fondasi tetap Next.js/Supabase, client pengguna/RLS dan RPC F01 `set_task_statuses`; tidak memakai `update_task` yang membawa salinan instruksi.

Fitur berada di `/staf/lembaga/[organizationId]`. Demo tetap terpisah. Tidak mencakup antrean F07, transfer UI F08, undangan, email/pesan otomatis atau deployment. Fixture HP aktif tidak diubah oleh runner; pengujian mutasi memakai stack lokal.

## Alur per revisi

- Detail kasus menampilkan aksi **Perbarui status** bagi pendamping penanggung jawab, menuju `/kasus/[caseId]/revisi/[taskId]/status` di bawah LP3H staf.
- Form menunjukkan usaha, instruksi baca-saja, status saat ini, pilihan empat status dan tanggal tindak lanjut opsional yang diawali tanggal tugas saat ini. UI memilih status saat ini pada awal; tidak menulis sampai pengguna menyimpan.
- `needs_sending` = Perlu dikirim; `awaiting_reply` = Menunggu balasan; `needs_review` = Perlu dicek; `completed` = Selesai. Boleh mencatat balasan langsung dari Perlu dikirim ke Perlu dicek. Tidak membatasi transisi manual lebih ketat daripada PRD/F01.
- Status Menunggu balasan meminta konfirmasi **Permintaan revisi ini sudah saya kirim**. Status Selesai yang baru dimasuki meminta konfirmasi bahwa koreksi diperiksa dan pembaruan resmi yang diperlukan dilakukan. Membuka chat atau Salin tidak mengisi konfirmasi ini.
- Mengosongkan tanggal berarti menghapus tanggal tugas; tanggal valid disimpan sebagai YYYY-MM-DD tanpa konversi UTC. Tanggal boleh lalu/hari ini/mendatang dan tidak otomatis dihapus saat status berubah. Kelompok Hubungi hari ini tetap hanya untuk Menunggu balasan; implementasi antrean nyata milik F07.
- **Koreksi ke tahap sebelumnya** adalah pilihan eksplisit pada form: Menunggu→Perlu dikirim, Perlu dicek→Menunggu, Selesai→Perlu dicek. Bukan penghapusan audit, bukan membalik semua tindakan, bukan mengembalikan tanggal lama. Saat menuju Menunggu tetap butuh konfirmasi pengiriman. Perlu dikirim tidak menawarkan tahap sebelumnya.
- Permintaan koreksi lanjutan menggunakan Perlu dikirim; tautan **Ubah instruksi** yang sudah ada tetap terpisah agar perubahan status tidak menimpa instruksi. Tidak memaksa instruksi baru untuk koreksi salah tekan.
- Simpan tanpa perubahan menampilkan hasil tidak ada perubahan tanpa memanggil RPC/menambah audit; UI tidak menampilkan sukses mutasi palsu.

## Konfirmasi pengiriman dari draf

- Bagian **Catat pengiriman** terpisah dari aksi ekspor. Tersedia setelah editor termuat; juga dapat dipakai untuk pesan yang dikirim manual. Tidak bergantung pada membuka WhatsApp atau berhasil menyalin.
- Pengguna membuka form konfirmasi `/kasus/[caseId]/pengiriman` dengan ID yang dipilih di draf sebagai saran pilihan, bukan otorisasi atau bukti pengiriman. Link/form hanya membawa ID, bukan pesan/penerima/token.
- Server memuat semua tugas kasus secara bertahap; form berpaginasi 20 item, pilihan lintas halaman. Kandidat hanya Perlu dikirim, awalnya hanya ID sah yang diminta. Tanpa pilihan sah, pengguna memilih sendiri. Menunggu/Perlu dicek/Selesai tidak diturunkan diam-diam dan tidak ikut kirim ulang batch ini.
- Setiap tugas menunjukkan instruksi, status dan tanggal saat ini. Pengguna menandai tugas yang benar-benar dikirim dan mencentang pernyataan pengiriman. UI menjelaskan tugas lain tidak berubah.
- Form memberi kebijakan tanggal bersama yang wajib dipilih: **Tanpa tanggal tindak lanjut** (menghapus tanggal lama pada tugas pilihan) atau **Tanggal yang sama** (tanggal wajib valid). Tidak ada default tersembunyi yang menghapus tanggal; tampilkan dampak pilihan sebelum simpan. Perbedaan tanggal tiap tugas dapat diatur sesudahnya melalui form per revisi. Ini batas UI yang sengaja memakai satu operasi batch RPC F01.
- Submit mengubah hanya pilihan ke Menunggu balasan dalam satu transaksi dengan audit per tugas. Payload sama memakai request ID yang sama saat retry. Batch yang salah satu versinya berubah ditolak seluruhnya, tidak sebagian.
- Setelah sukses kembali ke detail kasus dengan pemberitahuan singkat. Draf browser tidak dihapus atau disusun ulang otomatis; revalidasi F05 akan meminta tinjauan bila snapshot berubah.

## Status kasus dan riwayat

- Detail kasus menampilkan jumlah selesai/total dari seluruh tugas (bukan halaman aktif). Kasus tanpa tugas belum tuntas. Seluruh tugas Selesai berarti kasus tuntas; koreksi status membuka kembali hasil hitungan.
- Riwayat perubahan kasus dipaginasi 20 item dengan urutan created_at lalu id deterministik, query user client terikat case_id dan LP3H/akses kasus terverifikasi. Audit tidak boleh disembunyikan sebagai kosong ketika query gagal.
- Tampilkan kejadian create/edit/status/transfer dengan waktu zona LP3H, perubahan status/tanggal yang diketahui dan pelaku **Anda**, **Pendamping lain**, atau **Sistem** (actor null). Tidak mengambil profil staf tambahan atau menampilkan UUID pelaku.
- Audit task_updated yang status/tanggal tidak berubah diberi label **Revisi diperbarui**, bukan mengklaim isi instruksi diketahui. Riwayat tidak menyalin pesan atau instruksi; task_id boleh dipakai untuk label **Revisi** tanpa mengungkap ID teknis. Tidak menyajikan audit batch sebagai bukti WhatsApp terkirim dari API.

## Akses, retry dan konflik

- Semua read/action memverifikasi sesi, membership aktif, LP3H dan kasus; koordinator hanya membaca. Pendamping hanya mutasi kasus penugasan. Jangan percaya role/owner/LP3H/userId payload.
- Validasi duplikasi field, UUID unik, status, batas jumlah/payload, tanggal kalender, checkbox konfirmasi dan expected version integer. Batasi satu batch 100 tugas untuk transaksi/input yang terukur, dengan pemberitahuan dan pembagian batch manual bila lebih; baca kandidat tetap semua halaman.
- RPC mengambil lock induk, memeriksa akses sebelum receipt, receipt sebelum expected version dan update+audit atomik. Service tidak menolak retry hanya karena tugas sudah Menunggu setelah respons sukses hilang: baca akses/relasi lalu teruskan payload snapshot asli ke receipt; pengecekan eligibility tugas yang berubah diproses sebagai konflik sesuai versi, bukan menghalangi receipt.
- Identity intent disiapkan sekali dari seed dan payload canonical yang terurut, memakai helper requestId yang sudah ada. Simpan retry dengan payload/versi/konfirmasi sama; suntingan atau keputusan konflik menghasilkan intent baru. Tidak mempercayai receipt dari client.
- PT409 menampilkan data terbaru untuk seluruh pilihan yang masih berhak diakses. Isian/status/tanggal/checkbox tetap tersedia; pengguna harus meninjau sebelum menerapkan atau mengubah pilihan. Versi terbaru tidak dipasang diam-diam untuk auto-retry. Tugas hilang/berpindah akses tidak dibocorkan.
- Form pending mencegah double-submit dan mengunci snapshot. Error transport menyimpan isian dan intent. Jangan sukses sebelum respons RPC terverifikasi. Native POST dan hydrated action mempunyai kontrak sama.

## UI dan validasi

Bahasa Indonesia, mobile first, komponen/copy ringkas sesuai DESIGN_SYSTEM; status teks, label jelas, error terhubung field, fokus terlihat, kontrol utama 48px, input16px, panel vertikal. Baca docs Next versi terpasang dan skill frontend sebelum implementasi.

Tes domain/service/DOM: seluruh status, konfirmasi kirim/selesai, tanggal kosong/valid/invalid, balasan sebagian, batch pagination/limit/unik, no-op, retry respons hilang, konflik dua sesi, tenant/peran/transfer/revocation, input bertahan. HTTP lokal bersesi: status/audit/tanggal, readonly koordinator, batch rollback, hitungan tuntas, history pagination; SQL/concurrency suite lokal yang relevan. `npm run check` dan `npm run build` wajib. Tidak reset cloud, seed cloud, atau migrasi cloud tanpa target administratif dan kebutuhan terverifikasi. Tidak ada schema baru yang direncanakan; bila ternyata dibutuhkan, jelaskan perubahan rancangan dahulu.

## Persetujuan

Keputusan implementasi setelah review: pagination 20 item dipakai setelah hydration. Fallback native menampilkan seluruh kandidat/instruksi dalam satu form agar kandidat setelah halaman pertama dapat dilihat dan dipilih tanpa tombol mati. Batas transaksi tetap 100; payload versi dibatasi 900.000 karakter sebelum parse, field lain 20.000. Ini tidak mengubah otorisasi, aturan tanggal, atau jumlah transaksi.

Pilihan pendekatan dan rancangan disetujui pengguna 22 November 2026. Detail yang tidak mengubah kontrak/lingkup di atas diserahkan kepada implementer.
