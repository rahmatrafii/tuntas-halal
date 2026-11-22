# Audit keterbacaan mobile — 22 November 2026

Pengguna meminta agent mengaudit dan memperbaiki teks, informasi, modal dan bagian antarmuka yang kurang nyaman di HP, agar pemeriksaan halaman tidak dibebankan seluruhnya kepada pengguna.

## Cakupan dan metode

Audit sumber komponen bersama/demo/staf, pemetaan 36 file route/layout/boundary TSX, dan pemindaian teks statis pada 50 file TSX. Pemindaian panjang teks hanyalah penyaring; teks singkat pun bisa bermasalah karena layout atau konteks. Referensi visual tetap `public/image.png` dan `DESIGN_SYSTEM.md`.

| Kelompok | Cakupan sumber |
|---|---|
| Shell, navigasi, header | DemoShell, PageHeader, StaffFrame, RecordFrame, pagination |
| Antrean/list | Beranda, daftar kasus/kontak, filter, kartu dan badge |
| Detail | Identitas kasus, kontak, metadata, penanggung jawab, instruksi dan riwayat |
| Form | Kontak/kasus/revisi demo dan staf; validasi, duplikasi, konflik, retry |
| Draf | Pilihan, instruksi/status, editor, penyimpanan, error storage/tab, fallback WhatsApp, hapus draf |
| Modal demo | Filter antrean, transfer pendamping, reset data contoh, pratinjau chat |
| Staf/Auth | Login, akun/LP3H, akses terbatas, logout, boundary loading/error/not-found |
| Akun/demo | Pemilih akun, tim, pengaturan dan contoh kondisi layar |

Browser CUA tidak tersedia: inventory menghasilkan `browsers: []` dan `The browser access host is unavailable`. Tidak ada screenshot mobile baru, pengukuran layout browser, audit keyboard/zoom 200%, atau klaim UI02 lulus. jsdom tidak mempunyai mesin layout.

## Temuan dan perbaikan

| Prioritas | Temuan sumber dan dampak | Perbaikan |
|---|---|---|
| Tinggi | `.notice` yang muncul lebih akhir mengalahkan display block `.record-conflict`; heading, paragraf, data dan tombol menjadi kolom flex berdampingan | Notice default block; flex hanya pada Notice berikon yang punya wrapper isi. Tombol panel menjadi baris penuh |
| Tinggi | Konfirmasi hapus/storage dan fallback memakai notice multi-child yang sama, sehingga aksi panjang juga terjepit | Perbaikan bersama mencakup semua konsumen; CTA dan isi tetap utuh |
| Tinggi | Instruksi draf staf dan badge status sama-sama inline, sehingga status menempel di akhir kalimat | Instruksi block terpisah, gap sebelum badge, kolom teks dapat menyusut dan membungkus |
| Sedang | Email, nama, rujukan, penerima dan isi panel pada flex/grid bisa melebarkan halaman | Min-inline-size 0 pada kolom teks, pembungkusan long token, tanpa overflow-x hidden atau pemotongan judul |
| Sedang | Modal tinggi tidak memiliki overflow eksplisit dan heading/tombol tutup ikut bergulir | Overflow-y auto, batas 90dvh tetap, header sticky, scroll padding; native showModal/close/Escape dan backdrop containment dipertahankan |
| Sedang | Bantuan/riwayat beberapa ukuran 10–12px dan heading staf tetap 28px | Bantuan 14px ekuivalen rem, metadata kecil minimal 12px pada bagian terkait, heading staf 22–28px ekuivalen responsif |
| Sedang | Nama LP3H/peran satu paragraf, tombol panjang, label opsional dan kolom info berdesakan pada viewport sempit | Konteks LP3H/peran terpisah, aksi dapat bertumpuk, label membungkus; info dan aksi ringkasan satu kolom pada <=22rem |
| Sedang | Akun staf menyatakan pengelolaan revisi belum tersedia, padahal F04/F05 sudah ada | Copy disesuaikan kemampuan kini dan tetap dibatasi akses pengguna |
| Sedang | Pesan error umum menjamin catatan tetap tersimpan tanpa bukti; konfirmasi konflik menonjolkan nomor versi implementasi | Jaminan tanpa bukti dihapus; panel tetap memperlihatkan data terbaru dan tindakan penerapan eksplisit, payload versi tidak berubah |
| Rendah | Bantuan draf kurang menjelaskan langkah terakhir fallback, label contoh keadaan berbahasa Inggris | Petunjuk salin → buka chat → tempel; label Memuat/Gagal memuat; jumlah pilihan dan status penyimpanan dipisahkan |

Gaya monokrom, kartu abu-abu dan font sistem dipertahankan sesuai referensi; tidak menambah font, animasi, dependency atau fitur. Informasi akses, konflik, instruksi, batas karakter dan status yang tidak berubah tetap tersedia.

## Validasi

- Sebelum perubahan, diagnostic CSS/jsdom terisolasi mengonfirmasi conflict display flex. Sesudah perubahan, conflict block, Notice ikon flex, tombol panel flex per baris, instruksi block dan dialog overflow-y auto. Ini verifikasi cascade terbatas, bukan pembuktian ukuran visual.
- `npm run check`: lint, TypeScript dan 95/95 tes lulus; termasuk form pending/retry/conflict, draf/reload/clipboard fallback, akses dan demo. Peringatan React/jsdom `<search>` tetap muncul tanpa tes gagal.
- `npm run build`: lulus, termasuk semua route staf/draf. Tidak menambah tes kosmetik yang mengunci CSS/copy.
- Smoke HTTP development: 11 route publik/demo/login HTTP 200; `/staf` dan `/staf/akses-terbatas` tanpa sesi HTTP 307. HTTP demo dapat berisi shell/loading dan tidak membuktikan interaksi setelah hidrasi. Tidak mengklaim audit HTTP ini memverifikasi halaman bisnis bersesi.
- Review independen membaca cascade/konsumen/kontrak retry/modal/copy: tidak menemukan masalah sumber yang penting. Review juga tidak memverifikasi rendering perangkat.
- Diff diperiksa. Tidak ada perubahan Auth/RLS/database/status bisnis, fixture cloud baru/cleanup, email, pesan WhatsApp, deploy, commit atau push. Perubahan emoji dan tes fallback dari sesi sebelumnya dipertahankan.

## Yang masih terbuka

UI02: verifikasi visual 320/375/390/768/1440px, zoom dan text spacing 200%, keyboard HP, header sticky dan scrolling modal, fokus native, serta screenshot kesesuaian referensi. F05V tetap mempunyai batas bukti perangkat yang dicatat di `F05_HP_TEST.md`. Fixture HP masih aktif.

## Keputusan pelaksanaan

### Bukti perangkat langsung berikutnya — 22 November 2026

Setelah laporan sumber awal, pengguna menyediakan scrcpy interaktif dan agent mengendalikan Android nyata lewat CUA. Klaim browser tidak tersedia di atas adalah keadaan sesi awal; mirroring sekarang memberi akses layar HP, bukan DOM/CDP atau pengukuran viewport CSS.

Teramati: akun/LP3H, daftar/detail kasus/kontak, form ubah nomor pengajuan/kontak/instruksi, draf dan keyboard angka/teks, error instruksi kosong dengan fokus otomatis, pembatalan form, navigasi bawah, modal filter yang tertutup lewat Escape. Halaman yang terlihat tidak menunjukkan overflow horizontal pada zoom normal. Tidak menyimpan perubahan kontak/kasus/instruksi; validasi kosong ditolak. Uji WhatsApp panjang/pendek dan temuan continuation ada di F05_HP_TEST.md.

Zoom default Chrome dinaikkan dari 100% menjadi 200% untuk memeriksa antrean demo. Terlihat header/summary berdesakan dan navigasi bawah keluar layar. Perbaikan: wrapping header/context/summary, profil bertumpuk dan navigasi grid 2x2 dalam alur halaman pada <=18rem. Tautan ikon mempunyai aria-label. Uji ulang 200% memperlihatkan header utuh dan semua tujuan navigasi di akhir halaman tanpa menutupi konten. Zoom dipulihkan ke 100% dan halaman awal normal terlihat kembali.

Belum membuktikan seluruh route pada 200%, modal tinggi setelah scrolling, orientasi landscape, ukuran 320/375/390px yang terukur, tablet/desktop, screen reader, atau semua keadaan konflik/error. UI02 tetap terbuka untuk cakupan tersebut; hasil sebagian bukan klaim seluruh aplikasi lulus.

- Delegasi pengguna ditafsirkan sebagai izin memperbaiki pola yang sudah ada dengan gaya saat ini; bukan izin redesain atau fitur baru. Risikonya preferensi detail visual tetap perlu dinilai saat browser tersedia.
- Tetap pada checkout branch fitur yang berjalan karena perubahan sebelumnya dan server development bergantung padanya; tidak memindahkan atau mengomit perubahan. Risiko isolasi dikelola dengan diff dan pemeriksaan berkas, bukan worktree baru.
- CSS/copy tidak diberi tes kosmetik; dipakai diagnostic cascade dan suite interaksi yang ada. Risiko layout aktual belum tertangkap tetap terbuka dalam UI02, bukan dinyatakan selesai.
