# Strategi pengujian

## Pemeriksaan yang tersedia

```powershell
npm run lint
npm run typecheck
npm test
npm run check
npm run build
```

Unit test memakai Node test runner melalui `tsx`, tanpa service eksternal. Fokus: pengelompokan tanggal/status, zona waktu, status tuntas, normalisasi nomor, encoding pesan, dan batas kasus dalam draf. Tes helper bukan bukti bahwa UI, RLS, atau workflow bisnis sudah berjalan.

## Tes frontend dummy

`tests/demo.test.ts` menguji pencarian/antrean, balasan sebagian, versi usang, pengalihan kasus tanpa membuka kasus kontak lain, batas koordinator, dan sesi kosong. `tests/frontend.test.tsx` memakai Testing Library + jsdom untuk pencarian/filter, validasi/duplikasi kontak, double save revisi, draf/pengiriman terpisah, persistensi pesan, nomor invalid, gagal simpan/retry, serta login undangan simulasi.

Regresi reload draf diuji melalui pembukaan ulang tautan tugas di `tests/frontend.test.tsx` dan modul store baru di `tests/draft-reload.test.tsx`. Tes kedua menyiapkan draf hanya di localStorage sebelum layar pertama dirender, lalu memeriksa pesan, pilihan revisi, dan tidak adanya mutasi data. Keduanya gagal sebelum perbaikan prioritas draf tersimpan atas parameter `?pilih=...`; ini bukti DOM/store, bukan reload pada browser nyata.

`tests/dom-setup.ts` menyediakan DOM virtual. Native dialog dimock untuk menguji alur komponen; fokus modal, scrolling, safe area, tata letak, dan screenshot bukan bukti dari tes ini. jsdom belum mengenali elemen semantik `<search>` dan dapat menampilkan peringatan React khusus environment tes.

Kontrak frontend yang diimplementasikan: localStorage disimpan sebelum state dipublikasikan, state versi usang ditolak, pengiriman hanya mengubah tugas terpilih, draft tidak mengubah instruksi. Semua ini tetap simulasi browser, belum transaksi/audit/RLS database.

## Acceptance matrix sebelum pilot

| PRD    | Skenario yang harus diverifikasi                                                                                                                                                                               |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MVP-01 | Urutan empat kelompok; tugas due tidak muncul dua kali; completed hanya saat difilter; pencarian nama dan nomor; empty/no-results; layar HP                                                                    |
| MVP-02 | Nama/nomor wajib; normalisasi 08/+62/62; reuse kontak; nomor sama beda usaha dengan konfirmasi; tidak membocorkan kontak staf lain                                                                             |
| MVP-03 | Whitespace ditolak dekat field; instruksi sah tersimpan; status awal perlu dikirim; beberapa tugas dalam kasus                                                                                                 |
| MVP-04 | Preview penerima; pilih beberapa tugas satu kasus; edit draf tidak ubah instruksi; chat terbuka tidak ubah status; nomor invalid tetap bisa salin; draf tersedia saat kembali                                  |
| MVP-05 | Due hari ini/lewat hanya status menunggu; tanggal mendatang; balasan sebagian; kurang → kirim ulang; koreksi status salah; selesai setelah pembaruan resmi                                                     |
| MVP-06 | Anonymous ditolak; staf nonaktif ditolak; dua LP3H terisolasi; pendamping hanya assignee; koordinator lihat satu lembaga; transfer lintas LP3H ditolak; akses lama hilang dan kasus kontak lain tetap tertutup |
| MVP-07 | Jaringan putus mempertahankan input; double tap satu tugas; retry setelah response hilang; versi usang ditolak; audit dan status rollback bersama jika salah satu gagal                                        |

## Database lokal F01

Docker Desktop dengan engine Linux diperlukan. CLI Supabase 3.2.0 dipin di dependency project. Jalankan berurutan:

```powershell
npm run db:start
npm run db:reset
npm run db:test
npm run db:auth:test
npm run db:caseload:test
npm run db:types
npm run check
npm run build
```

`db:reset` menghapus data stack lokal disposable dan membangun ulang seluruh migrasi. Jangan menjalankannya untuk mempertahankan fixture sesi sebelumnya. Script tidak membaca `.env.local`, mengambil key lokal hanya di memori, dan menolak endpoint non-loopback. Tes guard di `tests/database-command.test.ts` membuktikan URL cloud ditolak. Output start/status yang mengandung key tidak diteruskan.

Empat file pgTAP di `supabase/tests` memuat 109 assertion: schema/enums/RLS; grants/akses/constraint; CRUD/RPC/transfer/versi/retry/batch; dan validasi whitespace. Masing-masing memakai transaksi yang di-rollback. Assertion akses memakai role pengguna, bukan koneksi admin.

`concurrency.test.mjs` menjalankan satu skenario integrasi dengan enam akun Auth fiktif lokal dan dua sesi independen pengguna yang sama. Admin hanya menyiapkan fixture serta memeriksa snapshot/audit; operasi bisnis memakai JWT pengguna nyata. Skenario membuktikan satu sukses/satu konflik versi, retry serentak dan respons hilang, payload berbeda ditolak, batch rollback, penolakan lintas LP3H/peran, pencabutan akses setelah transfer termasuk retry lama, dan serialisasi transfer dengan perubahan tugas.

Regresi deadlock kontak memakai koneksi ketiga untuk mengatur waktu row lock; kedua request tetap RPC pengguna. Sebelum migrasi 004, create retry bersamaan update menghasilkan `40P01`; sesudah urutan lock diperbaiki, edit dan retry lulus tanpa mutasi ganda. Tujuh assertion whitespace juga diamati gagal sebelum migrasi 004 dan lulus sesudahnya. Migrasi 003 memperbaiki EXECUTE validator zona waktu untuk provisioning admin, dengan tes regresi tersendiri.

Fixture integrasi bertahan hanya di stack lokal sampai reset berikutnya; UUID baru memungkinkan tes diulang tanpa bentrok. Tes tidak mengirim email dan tidak menyentuh project cloud. Ini belum bukti login UI, konfigurasi cloud, atau perangkat nyata.

Pernyataan tanpa email di atas berlaku untuk suite concurrency F01. Suite F02 `db:auth:test` mengirim hanya ke Mailpit lokal, tidak ke penerima eksternal. Lihat [STAFF_AUTH.md](STAFF_AUTH.md) untuk skenario HTTP lengkap, child Next port 3150, pengamanan port/credential, dan provisioning.

Migrasi 005 mengganti konflik bisnis `40001` menjadi `PT409`/HTTP 409 setelah suite API gagal dua kali pada PostgREST 14 dengan retry sampai timeout. Dua assertion SQL PT409 diamati RED sebelum migrasi dan GREEN sesudahnya; tes dua update bersamaan kini dibatasi timeout lima detik dan memeriksa satu sukses/satu HTTP 409. Jangan memperbaiki kegagalan itu dengan retry tak terbatas atau mengganti versi API agar tes tampak hijau.

Hasil sesi implementasi F02: 40 tes aplikasi/harness, 109 assertion SQL, satu skenario concurrency F01, satu skenario HTTP Next/Auth/Mailpit, dan build produksi lulus. Hasil tersebut terpisah dari uji operasional cloud berikut; perangkat visual belum dibuktikan.

## Uji operasional development F02C

Template/subjek hosted, SMTP Mailtrap Sandbox, origin/allowlist dan akses/signup dibaca ulang pada target development terverifikasi. Satu permintaan email login yang secara khusus diizinkan berhasil dan pengguna mengonfirmasi penerimaannya di Mailtrap. Akun sementara tanpa membership dihapus/readback.

Atas permintaan pengguna berikutnya, token Magic Link dibuat Admin API tanpa mengirim email tambahan, lalu dirender menggunakan template repository. HTTP aplikasi workspace di localhost:3000 dengan Auth cloud melewati 23 pemeriksaan: callback/cookie/privacy headers, identitas provider, penolakan anonymous, pembatasan tanpa membership, reload, token satu kali, refresh provider dengan rotasi token, native POST logout dan penolakan setelah logout. Refresh dipicu metadata expiry cookie, bukan menunggu expiry JWT asli. Akun sementara dihapus dan GET admin memastikan akun tidak ditemukan; tidak ada membership/data bisnis ditulis.

Kedua bukti tersebut memenuhi gerbang development F02C, bukan satu alur klik browser dari email yang sama. Suite `npm run db:*` tetap lokal dan tidak diubah untuk menerima cloud. Uji operasional tidak dijalankan otomatis; fixture/email baru memerlukan instruksi pengguna. Browser/perangkat nyata, hosting, email live dan akun dengan membership aktif di cloud belum tercakup. Lihat [STAFF_AUTH.md](STAFF_AUTH.md).

## Kontak/kasus staf F03

`npm run db:caseload:test` memakai wrapper/guard lokal yang sama dan child Next port 3150, secara bergantian dengan suite Auth. Tidak membaca `.env.local` atau memakai cloud. Tes negatif menjalankan artefak suite dengan URL cloud dan memastikan ditolak sebelum fixture dibuat; environment `NODE_TEST_CONTEXT` parent dibersihkan agar child benar-benar berjalan mandiri.

`tests/caseload.test.ts` menggunakan SDK Supabase nyata dengan transport terkontrol untuk memeriksa validasi/payload, scope query, penolakan peran, normalisasi, error aman, intent stabil dan konflik. `tests/caseload-forms.test.tsx` memeriksa input/pending/error, ringkasan fokus, konfirmasi duplikat, peninjauan konflik, dan transport Server Action yang gagal. Suite HTTP nyata menjadi bukti akhir untuk RLS/otorisasi, bukan transport mock.

Skenario HTTP lokal mencakup CRUD kontak/kasus, reuse, nomor pengajuan opsional, native POST tanpa hidrasi, duplikat, retry sukses tanpa versi tambahan, konflik dua form, koordinator read-only, dua LP3H, receipt lama setelah pencabutan akses, transfer satu dari dua kasus berbagi kontak, dan pemilih kontak halaman kedua. Tidak ada tugas/transfer UI ditambahkan hanya demi tes. Lihat [STAFF_CASELOAD.md](STAFF_CASELOAD.md).

Hasil sesi implementasi F03: `npm run check` lulus 62 tes, `db:caseload:test` lulus satu skenario HTTP menyeluruh, `db:test` lulus 109 assertion SQL + concurrency, `db:auth:test` lulus regresi sesi/undangan lokal, dan build produksi lulus. Review retry-intent dan announcement direproduksi RED→GREEN sebelum pemeriksaan ulang penuh.

Pada sesi verifikasi berikutnya, pengguna secara eksplisit mengizinkan akun/data bisnis cloud sementara dan cleanup. Satu skenario HTTP aplikasi localhost + Auth/database cloud lulus untuk CRUD/retry/konflik/peran/tenant/transfer/pencabutan akses; seluruh fixture kembali nol/readback dan guard audit/RLS aktif. Ini dijalankan lewat helper administratif sekali pakai dengan target terverifikasi, bukan dengan mengubah guard `npm run db:*`. Tidak ada perubahan aplikasi pada sesi operasional itu; check/build tidak diulang. Uji browser masih terhalang host, sehingga UI02 tetap terbuka. Lihat [laporan verifikasi](F03_CLOUD_VERIFICATION.md).

## Revisi staf F04 lokal

`npm run check` mencakup 74 tes setelah F04. Tes service memeriksa input/UUID/versi/field ganda, role/tenant/assignee/parent, payload tanpa status/date client, request ID stabil, input utuh, konflik dan akses yang dicabut. Regresi CRLF versus LF diamati gagal sebelum normalisasi dan lulus sesudahnya; panjang textarea dihitung setelah normalisasi newline agar native dan hydrated sepadan. DOM memeriksa textarea multiline, pending/double submit, inline error/fokus dan review konflik diikuti transport failure/retry.

`db:test` kini menjalankan lima file dengan 128 assertion SQL dan concurrency. File `004_task_instruction.test.sql` membuktikan RPC additive hanya mengubah instruksi, termasuk completed, receipt sebelum versi, retry setelah status berubah tanpa overwrite/versi tambahan, audit tanpa isi, PT409/22023 dan penolakan coordinator/anon/revoked.

`db:caseload:test` memperluas HTTP F03 dengan tambah/baca/reload/ubah revisi, input berlebih tetap utuh, default status/tanggal, retry create/update, konflik eksplisit, preservasi status/tanggal setelah retry lama, tugas lintas parent/tenant, koordinator, transfer/pencabutan/receipt dan halaman kedua. Tes HTTP awal gagal karena form F04 belum ada, kemudian menemukan perbedaan newline multipart yang diperbaiki RED→GREEN. Regresi Auth dan build juga lulus. Reviewer memeriksa kode, bukan menjalankan suite secara independen.

Migrasi 006 diterapkan hanya lokal tanpa reset. Tidak ada uji F04 cloud atau browser/perangkat pada sesi ini. Kendala alat browser sebelumnya tetap membatasi bukti visual/hidrasi; simulasi DOM transport bukan pemutusan jaringan browser nyata. Tidak ada data nyata, email/WhatsApp atau fixture cloud baru.

## Draf staf F05 lokal

`npm run check` mencakup 93 tes setelah F05: service memeriksa konteks/akses, seluruh halaman database, pilihan sah, versi/kontak, penerima server dan URL; storage memeriksa scope akun/LP3H/kasus, draf kosong/rusak, quota/denied dan tab usang; DOM memeriksa reload mengalahkan URL, suntingan/pilihan, konflik tab, penghapusan eksplisit, clipboard manual dan respons terlambat.

Review menemukan native continuation tidak memblokir suntingan saat pending. Tes respons tertunda diamati gagal karena textarea masih editable; perbaikan mengunci pesan/pilihan/hapus selama POST, lalu regresi lulus. Tes async menyelesaikan deferred response dalam `act`; tidak menyamakan mock clipboard dengan bukti clipboard OS. Dua effect sinkronisasi editor menangani storage browser/native Action eksternal setelah hidrasi dengan pengecualian lint yang sempit, agar tidak memulihkan/menulis seed saat render.

HTTP `db:caseload:test` mencakup F03–F05: halaman/Action draf, compose, native continuation ke URL `wa.me` dengan redirect manual (tidak diikuti), ID asing, tenant/koordinator/transfer, lebih dari 20 tugas, dan readback bahwa tugas/audit tidak berubah. Regresi database tetap 128 assertion/concurrency, Auth tetap lokal/Mailpit. Tidak ada schema baru, fixture cloud atau pesan eksternal.

Uji perangkat F05V/UI02 tetap terbuka: layout/hidrasi aktual, clipboard permission, pembukaan WhatsApp, pesan panjang dan kembali/reload di HP/laptop. Semua itu belum terbukti oleh jsdom atau native HTTP. Lihat [panduan draf](STAFF_DRAFTS.md).

## Sesi cloud F05C

Pengguna meminta uji cloud dan perangkat, kemudian memilih cloud dahulu saat host browser masih tidak tersedia. Skenario aplikasi localhost + Auth/database `tuntas-halal-dev` lulus, termasuk callback/sesi/reload, F04 create/update instruksi, compose 22 tugas aktif melewati halaman pertama, completed/kasus saudara, validasi salin/redirect tanpa follow, URL karakter khusus/pesan panjang, read-only tugas/audit, konflik dan peninjauan, tenant/peran/transfer/revocation.

Fixture dua LP3H/empat akun, dua kontak/dua kasus dan 24 tugas dibersihkan dalam run yang sama; query administratif terpisah membuktikan delapan hitungan kembali nol dan guard audit/RLS aktif. Tidak ada email baru, WhatsApp, perubahan aplikasi/schema atau deployment. Check/build tidak diulang pada sesi operasional. Bukti cloud HTTP tidak membuktikan localStorage/hidrasi/clipboard/WhatsApp pada browser atau HP nyata. Lihat [laporan F05C](F05_CLOUD_VERIFICATION.md).

## Fixture akses F01

Lembaga A: pendamping A1/A2, koordinator AK, satu anggota nonaktif; lembaga B: pendamping B1 dan koordinator BK. Satu kontak A1 dipakai dua kasus, hanya satu dialihkan ke A2. A2 harus bisa melihat kontak kasus pindahan tanpa membaca kasus lain. Gunakan data fiktif dan environment pengujian.

## Pemeriksaan manual UI

- Chrome/Edge desktop dan Chrome Android/Safari iOS yang dipakai peserta; WhatsApp Web dan aplikasi HP.
- 375px, tablet, desktop, zoom 200%, navigasi keyboard, focus, teks panjang, reduced motion.
- Tanggal pergantian hari di zona LP3H; browser dengan zona berbeda tidak boleh mengubah kelompok antrean.
- Salin teks berisi `&`, `+`, `?`, newline, dan aksara Indonesia; nomor invalid tidak membuka chat.
- Kembali dari WhatsApp; status belum dikonfirmasi tidak berubah, input/draf tidak hilang.

Tambahkan pengujian browser saat integrasi fitur membutuhkan bukti end-to-end. Suite database tersedia terpisah dari `npm run check`; keduanya perlu dijalankan untuk perubahan schema/RPC. Jangan menambah suite kosong yang hanya memeriksa markup halaman setup.

Kontrol browser pada sesi frontend dihentikan karena alat tidak dapat memastikan URL Chrome. Review visual 375px/390px/768px/1440px, zoom 200%, keyboard HP, native modal, dan perangkat nyata tetap belum diuji. Jangan mencoba melewati pembatasan kontrol browser; lanjutkan UI02 saat sarana yang sah tersedia.

## Latihan pilot F09

Pada 23 November 2026, `npm run check` (130 tes), build, `db:test` (128 assertion SQL dan concurrency), `db:auth:test` dan `db:caseload:test` lulus. Stack lokal dipertahankan tanpa reset. Latihan cloud terpisah membuktikan alur HTTP terpadu dari login, pembuatan kontak/kasus/revisi, ekspor draf tanpa mengikuti redirect, konfirmasi kirim, balasan sebagian, filter antrean, transfer, penyelesaian sampai logout dan pencabutan akses. Cleanup dua run terverifikasi nol. [Bukti cloud F09](F09_CLOUD_VERIFICATION.md)

Gunakan checklist dan lembar pencatatan menit aktif untuk pilot. Pengukuran peserta dan verifikasi origin hosting, email live serta perangkat menunggu tahap pembukaan pilot. [Panduan pilot](PILOT_READINESS.md)
