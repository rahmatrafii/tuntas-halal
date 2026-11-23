# Verifikasi bisnis F07 di Supabase development

Tanggal: 23 November 2026. Pengguna meminta pengujian bisnis cloud sebelum uji perangkat. **Lulus: HTTP aplikasi localhost dengan sesi Auth dan database cloud development menjalankan antrean F07.**

Target administratif dicocokkan dengan `.env.local`, project `tuntas-halal-dev` (`czxfkwztljspzjjpqmgp`) dan SMTP sandbox yang sudah ada. Run `8ef99762-e9e5-4501-968a-ab6f6c3d87c5` memakai dua LP3H, empat akun sementara, dua kontak, empat kasus dan 28 revisi. Fixture HP lama tidak digunakan untuk mutasi. Tidak ada email/WhatsApp dikirim, perubahan schema/config atau deployment.

## Skenario yang lulus

- Empat callback membentuk sesi aplikasi untuk project cloud yang benar tanpa email; antrean kosong tampil, anonymous dialihkan ke login, sesi tersimpan dipakai ulang pada pembacaan/paginasi.
- Kelompok Hubungi hari ini → Perlu dicek → Perlu dikirim → Menunggu balasan, tanggal lewat/hari ini/mendatang/null, dan urutan tanggal di kelompok due sesuai. Selesai tidak muncul pada default dan tersedia melalui filter eksplisit.
- Pencarian nama usaha tidak peka huruf besar/kecil, pencarian nomor pengajuan tanpa kecocokan nama, tanda `%_*`, kurung, koma, kutip dan backslash sebagai literal, serta teks menyerupai injeksi filter. Filter Menunggu balasan mencakup due/future/null; Perlu dicek dan Perlu dikirim tetap scoped. Parameter duplikat/malformed dinormalisasi; pencarian >160 karakter menampilkan pemberitahuan.
- Halaman global pertama 20 revisi dan kedua 3 revisi pada kasus dengan 23 tugas aktif; tidak ada duplikasi antarhalaman, query dipertahankan oleh link berikutnya, page berlebih diklem ke halaman terakhir. Kasus saudara hanya muncul ketika pencarian cocok.
- Pemilih kasus Tambah revisi menuju form existing. Tugas due mengarah ke draf dengan pilihan revisi, tanpa mengikuti tautan WhatsApp. Keputusan draf tersimpan dan reset kontrol React tetap dibuktikan tes DOM lokal sebelumnya, bukan HTTP cloud ini.
- LP3H sementara memakai Pacific/Kiritimati dan Pacific/Honolulu yang memiliki hari berbeda. Halaman masing-masing memakai hari lembaganya; tanggal yang sudah due di lembaga pertama belum dianggap due di lembaga kedua.
- Payload URL role/assignee/LP3H tidak memperluas akses. Koordinator dapat membaca kasus LP3H yang sama dan hanya memperoleh Lihat kasus, tanpa Tambah revisi atau aksi draf/status. Akun tenant lain ditolak.
- Kasus dengan kontak yang sama tetap diisolasi per assignee, termasuk query pengguna langsung/RLS. Transfer melalui RPC koordinator pada satu kasus sementara menghilangkan akses antrean/direct-read pendamping lama, memberi penerima akses kasus tersebut, dan tidak membuka kasus saudara. Pencabutan membership penerima menolak antrean aplikasi dan pembacaan tugas langsung.
- Fingerprint seluruh baris revisi fixture, jumlah audit dan receipt sama sebelum/sesudah pembacaan antrean. Transfer/revocation dilakukan sebagai skenario akses tersendiri setelah pembuktian read-only; seluruh status/tanggal/instruksi tugas tetap sama sesudahnya.

## Cleanup dan verifikasi terpisah

Manifest UUID dan SQL cleanup disiapkan sebelum provisioning. Cleanup dibatasi dua organisasi bernama/UUID tepat, metadata run pada akun, hubungan owner/assignee dan 28 ID tugas yang sudah dideklarasikan. Data bisnis/audit/receipt run dihapus dalam transaksi administratif; guard audit diaktifkan kembali sebelum transaksi selesai. Keempat akun Auth dihapus dan ketidakhadirannya dibaca ulang. Tidak ada reset cloud.

Runner keluar dengan kode 0: `passed: true`, `cleanupVerified: true`, `remainingFixtureRows: 0`, `emailRequests: 0`, `applicationCodeChanges: 0`. Seluruh jumlah tabel/Auth kembali ke baseline yang sudah berisi fixture HP. Fingerprint id/versi/status/tanggal tugas HP sebelum/sesudah sama, tanpa membaca atau mencatat nomor pribadi.

Query administratif read-only **baru setelah runner selesai** mengonfirmasi:

| Pemeriksaan | Hasil |
|---|---|
| LP3H, membership, kontak, kasus, revisi run | Masing-masing 0 |
| Audit, receipt dan akun Auth run | Masing-masing 0 |
| Fixture HP dipertahankan | 1 LP3H, 1 kasus, 2 revisi |
| Guard audit immutable | `O`, aktif |
| RLS tabel bisnis | 6 aktif |
| Migrasi | Tetap 6 |

Runner, manifest, SQL cleanup, hasil dan readback tanpa kredensial berada di `.git/` dan diabaikan Git. Helper check yang berulang bukan hitungan skenario pengujian independen. Izin fixture sementara ini selesai cakupannya; tidak menjadi izin membuat fixture/undangan cloud baru pada sesi berikutnya.

## Batas bukti

Ini HTTP localhost + Auth/database cloud, bukan aplikasi yang sudah dideploy atau pengujian browser/HP. Hidrasi, reset filter interaktif, keputusan draf tersimpan, clipboard, keyboard, zoom dan rendering visual F07 tidak diuji pada run ini. F07V/UI02 dan gerbang pilot tetap terbuka.

Kode aplikasi, schema, dependency dan konfigurasi tidak berubah. Check/build tidak diulang untuk operasi cloud dan dokumentasi ini; bukti implementasi terakhir tetap 125 tes aplikasi, lint/TypeScript dan build pada sesi F07 lokal.
