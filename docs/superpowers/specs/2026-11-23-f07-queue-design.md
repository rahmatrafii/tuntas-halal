# F07 — Antrean tindakan staf

Cakupan bersumber dari PRD MVP-01/MVP-05, BACKLOG F07 dan ringkasan F07 yang disetujui pengguna dengan instruksi implementasi. Pilihan teknis di bawah ditetapkan agent dalam cakupan tersebut.

## Tujuan dan antarmuka

Halaman `/staf/lembaga/[organizationId]/antrean` menjawab “Revisi mana yang perlu saya tangani berikutnya?”. Gunakan RecordFrame dan desain monokrom/mobile yang ada: card abu-abu, baris revisi putih, status pastel berbentuk teks, tombol hitam 48px. Tambahkan Antrean ke navigasi lembaga dan tautan utama membership staf. Pertahankan checkout fitur saat ini dan perubahan F06 yang belum commit; tanpa commit/push/deploy atau worktree tambahan.

Urutan kelompok: Hubungi hari ini, Perlu dicek, Perlu dikirim, Menunggu balasan. Selesai hanya muncul ketika filter Selesai dipilih. Hubungi hari ini tetap status awaiting_reply dengan tanggal <= hari kalender LP3H, bukan status baru. Filter Menunggu balasan mencakup kelompok hari ini. Pencarian substring tidak peka huruf besar/kecil pada nama usaha ATAU nomor pengajuan, diperlakukan literal termasuk tanda khusus. Filter/pencarian GET tersimpan di URL dan bekerja tanpa JavaScript; nilai duplikat/malformed dinormalisasi, pencarian maksimal 160 karakter dengan pemberitahuan bila melebihi batas. Tanggal tidak dikonversi menjadi instant UTC.

Paginasi global 20 revisi, urutan kelompok tetap lalu tanggal tindak lanjut ascending/null terakhir, created_at ascending, id ascending. Count berasal dari query dengan scope dan filter yang sama. Halaman berlebih diklem ke halaman terakhir; kegagalan baca melempar error layanan, bukan hasil kosong. Empty state membedakan tanpa revisi aktif dan tanpa hasil filter; loading/error memakai boundary staf yang sudah ada.

Setiap revisi menampilkan usaha, nomor pengajuan opsional, instruksi, status, tanggal dan satu tindakan utama. Pendamping: Hubungi hari ini → Siapkan pengingat (draf satu revisi); Perlu dikirim → Siapkan pesan; Perlu dicek → Periksa revisi (form status); Menunggu balasan → Catat balasan (form status); Selesai → Lihat kasus. Nama usaha menuju detail kasus sebagai tautan konteks. Koordinator hanya Lihat kasus. Tambah revisi membuka pemilih kasus yang memakai daftar kasus existing, kemudian form revisi existing. Tidak ada mutasi saat membuka antrean atau pesan.

Jika tautan antrean menunjuk revisi yang belum dipilih pada draf tersimpan, pertahankan pesan/pilihan lama dan tampilkan keputusan eksplisit: Sertakan revisi ini atau Gunakan draf tersimpan. Ekspor ditahan sampai keputusan diambil; penyertaan pada pesan yang sudah disunting memakai tinjauan draf F05 existing. Reset pencarian harus menyelaraskan kembali kolom dengan URL baru pada navigasi tanpa remount halaman.

## Pendekatan

Pilih Server Component dan query Supabase pengguna/RLS dengan embedded inner cases/contact. Scope LP3H eksplisit dan assignee untuk pendamping. Pencarian nama menggunakan empty embed contact dan OR dengan nomor pengajuan pada level cases; pola regex literal imatch menghindari wildcard/injeksi filter. Count per kelompok lalu hanya mengambil irisan halaman yang dibutuhkan; tidak memuat seluruh tugas/kasus ke browser atau melakukan query per card. Semuanya read-only, tidak meminta nomor telepon, memakai grants/RLS existing, tanpa schema/dependency baru. Verifikasi PostgREST nyata wajib karena transport fixture saja tidak membuktikan join/OR.

Alternatif RPC SQL memberi satu query, tetapi menambah migrasi/cloud rollout untuk kebutuhan baca yang sudah dapat dilakukan PostgREST. Memuat seluruh revisi untuk disortir di browser lebih singkat tetapi tidak memenuhi batas akses/volume secara efisien. F08 filter pendamping/transfer, F09 pilot, perombakan desain dan integrasi pesan berada di luar cakupan.

## Bukti penerimaan

Tes literal/scope/urutan/tanggal lokal/paginasi/error dan rendering aksi/GET. HTTP aplikasi + Auth/database lokal: nama ATAU referensi, tanda khusus, selesai, pagination, koordinator read-only, antar-LP3H/assignee, transfer dan revocation; tidak ada perubahan status/audit akibat antrean. Uji Android read-only pada fixture lama bila masih terhubung; tanpa akun/fixture cloud baru dan tanpa pesan. Check/build, review independen, status dan handoff diperbarui; bukti lokal tidak dinyatakan sebagai bisnis cloud penuh.
