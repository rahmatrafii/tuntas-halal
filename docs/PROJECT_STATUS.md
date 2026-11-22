# Status project

**Diperbarui: 21 November 2026 · F01–F04 tersedia dan draf staf F05 diimplementasikan lokal; route demo tetap terpisah.**

## Sudah tersedia

- Seluruh delapan kelompok tampilan yang diminta, dengan fokus HP dan desain dari `public/image.png`.
- Login undangan dan pemilihan akun contoh, antrean/pencarian/filter, kontak/kasus/tugas, detail/progres/riwayat, draf WhatsApp, status/tanggal, koordinator/transfer, serta kondisi kosong/loading/error/akses terbatas/konflik.
- Form tambah dan ubah kontak, buat dan ubah kasus, tambah dan ubah revisi. Nomor ganda dikonfirmasi sebagai usaha berbeda.
- Store browser dengan localStorage, sinkronisasi tab, penolakan versi tugas usang, ID simpan stabil, draf tersimpan, dan input tetap tersedia saat gagal simpan.
- Pengiriman hanya mengubah tugas yang dipilih setelah konfirmasi. Buka WhatsApp adalah pratinjau internal; email juga tidak dikirim.
- Data fiktif: satu LP3H, tiga pendamping, satu koordinator, enam kontak, tujuh kasus, sebelas tugas awal. Tanggal acuan 19 November 2026 WIB.
- Next.js 16.4.6, React 19, TypeScript strict, Tailwind 4, Lucide, npm lockfile. SDK Supabase fondasi tetap tersedia tetapi UI demo tidak memakai backend.
- Fondasi backend lokal: enam tabel bisnis public, helper/receipt private, RLS dan grants eksplisit, delapan RPC, audit atomik, expected version, idempotency, dan tipe generated. Supabase CLI 3.2.0 dipin; pengujian memakai Docker lokal.
- Dokumentasi desain, sistem token, panduan demo, arsitektur, backlog, testing, dan handoff diperbarui. 29 skill lokal tersedia setelah enam skill dikeluarkan; seluruh 15 skill Superpowers tetap disertakan.

## Verifikasi sesi frontend

| Pemeriksaan | Hasil |
|---|---|
| `npm run check` | Lulus: lint, TypeScript, 24/24 tes (13 domain/logika dan 11 interaksi DOM) |
| `npm run build` | Lulus: build produksi seluruh route |
| Smoke HTTP produksi | Lulus: 15 route HTTP 200, shell Indonesia, CSS terkompilasi, gambar referensi tersedia |
| `npm run skills:verify` | Lulus: integritas 20 skill |
| Tautan Markdown lokal | Lulus |
| Kontras token utama | Lulus: teks sekunder/status pada latar masing-masing ≥ 4,5:1; bukan audit semua pixel |
| Dev HTTP | Server pengguna di `http://localhost:3000` tersedia; tidak dihentikan |
| Browser/screenshot/mobile nyata | Belum diuji. Kontrol browser dihentikan karena URL Chrome tidak dapat dipastikan oleh alat |
| Supabase/Auth/RLS pada sesi frontend | Saat sesi itu belum dibuat; bukti F01 lokal terbaru ada di bawah |

Tes interaksi memakai jsdom dengan modal native yang dimock. Hasil ini tidak membuktikan layout 375px, safe area, keyboard HP, atau fokus native dialog. UI02 tetap terbuka.

## UI03 — Pemulihan draf setelah reload, 21 November 2026

- Penyebab terverifikasi: URL dari detail tugas membawa `?pilih=...`. Inisialisasi editor mengutamakan parameter tersebut atas draf tersimpan, sehingga pesan disusun ulang walaupun data lama masih ada di localStorage.
- Perbaikan terbatas pada inisialisasi `draft-screen.tsx`: pesan dan pilihan revisi dari draf kasus dipulihkan lebih dahulu. Parameter URL tetap memilih tugas saat belum ada draf. Pemeriksaan akses, instruksi, status tugas, dan backend tidak diubah.
- Dua tes regresi diamati gagal sebelum perubahan dan lulus sesudahnya: sunting/pilih tugas lalu buka ulang tautan yang sama; store baru membaca draf dari localStorage tanpa mengubah data tersimpan.
- `npm run check` lulus: lint, TypeScript, dan 26/26 tes. `npm run build` lulus. Review terpisah tidak menemukan masalah pada perubahan. Peringatan React/jsdom tentang `<search>` tetap muncul pada tes antrean.
- Uji browser langsung tidak tersedia karena host akses browser tidak tersedia. Bukti reload terbatas pada DOM/store; pada sesi UI03 tersebut UI02 dan F01–F09 masih terbuka.

## Tooling Superpowers — 21 November 2026

- Plugin resmi `superpowers@openai-curated-remote` 7.0.1 terpasang untuk pengguna Windows ini; CLI melaporkan `installed: true` dan `enabled: true`.
- 15 skill beserta file pendukung dan metadata marketplace tersedia di `.agents/skills`; lisensi, asal, dan hash dicatat. Lihat `SKILLS.md`.
- `npm run skills:sync` mempertahankan catatan skill dari sumber opsional yang tidak tersedia; `npm run skills:verify` lulus untuk 35 skill.
- Pemeriksaan salinan: 20 skill awal tidak berubah; 15 skill baru identik dengan paket marketplace (99 file). Uji fixture lulus untuk sumber yang tidak tersedia, sync berulang yang idempoten, dan penolakan konflik tanpa menimpa file/manifest.
- `npm run check` lulus: lint, TypeScript, dan 24/24 tes. `npm run build` lulus. Tes DOM memunculkan peringatan React/jsdom tentang elemen `<search>`; tidak ada tes gagal.
- Pemasangan ini hanya menambah tooling; pada sesi pemasangan tersebut UI02 dan F01–F09 masih terbuka. Untuk pemakaian berikutnya, mulai chat baru agar daftar skill diperbarui.

## Perapihan skill — 21 November 2026

- Sesuai instruksi pengguna, `banner-design`, `slides`, `brand`, `design`, `ponytail-gain`, dan `ponytail-help` dikeluarkan dari project; tersisa 29 skill.
- Folder dipindahkan ke `~/.codex/skill-archives/sihalal/2026-11-21-excluded-skills`; instalasi personal tetap disimpan. Daftar pengecualian pada script sync mencegah keenamnya ditambahkan kembali.
- Manifest dan panduan skill diperbarui; sync, verifikasi integritas 29 skill, dan lint lulus. Uji fixture membuktikan manifest usang dibersihkan, enam skill tidak disalin kembali, dan sync berulang tetap idempoten. Hash arsip dan instalasi personal cocok dengan salinan semula. Kode aplikasi serta perbaikan draf tetap dipertahankan; build aplikasi tidak diulang untuk perapihan tooling ini.

## F01 — Fondasi database lokal, 21 November 2026

- Pengguna membuat project Supabase development dan mengisi `.env.local`. Pemeriksaan baca-saja lulus: URL/publishable key valid, endpoint Auth terjangkau, pendaftaran publik/login anonim nonaktif, provider email aktif. Nilai kredensial tidak dicatat di repository atau log.
- Pengguna menyetujui [rancangan F01](superpowers/specs/2026-11-21-f01-foundation-design.md). Implementasi dan ledger tersedia di [rencana F01](superpowers/plans/2026-11-21-f01-foundation.md), branch `feat/f01-foundation`; belum commit/push pada tahap ini.
- Docker engine Linux aktif; CLI `supabase@3.2.0` dipin. Stack lokal `sihalal-f01` memakai API port 55321 dan Postgres 55322. Wrapper `npm run db:*` tidak memuat `.env.local`, menolak endpoint non-loopback, dan tidak mencetak key stack.
- Empat migrasi menyediakan enam tabel public, schema private untuk helper/receipt, enum empat status, constraint tenant/anggota aktif, RLS SELECT, dan grants eksplisit. Authenticated tidak dapat menulis tabel bisnis atau audit langsung; tulisan melalui delapan RPC terbatas. Koordinator hanya membaca dan mentransfer.
- RPC memeriksa akses terkini sebelum receipt retry, expected version sebelum mutasi, konfirmasi selesai, normalisasi/duplikasi nomor, dan batch satu kasus yang atomik. Audit tidak menyimpan isi instruksi/pesan. Operasi signed-in memakai actor dari `auth.uid()`; provisioning administratif boleh actor null.
- Review independen menemukan deadlock create-retry/update kontak dan trim yang menerima teks tab/newline kosong. Keduanya direproduksi gagal terlebih dahulu, lalu diperbaiki dalam migrasi 004. Tidak ada temuan minor yang ditunda. Migrasi 003 sebelumnya memperbaiki grant validator zona waktu yang terungkap melalui fixture Auth nyata.
- Pada akhir sesi awal F01 lokal, migrasi belum diterapkan ke cloud. Penerapan dan pemeriksaan cloud terbaru dicatat pada bagian F01 cloud/F02 di bawah; tidak ada akun uji atau fixture yang dibuat di cloud.

| Pemeriksaan akhir F01 | Hasil |
|---|---|
| `npm run db:reset` | Lulus: seluruh migrasi membangun ulang database lokal |
| `npm run db:test` | Lulus: 109/109 assertion pgTAP pada 4 file; 1 skenario Auth nyata/concurrency lulus |
| Sesi dan isolasi | Dua LP3H, enam akun fiktif lokal, dua sesi independen; konflik, retry, transfer, rollback batch, dan regresi deadlock lulus |
| `npm run db:types` | Lulus: tipe public schema aktual; dipakai client browser/server/proxy |
| `npm run check` | Lulus: lint, TypeScript, 28/28 tes aplikasi termasuk 2 guard endpoint cloud |
| `npm run build` | Lulus: build produksi seluruh route |
| `npm run skills:verify` | Lulus: integritas 29 skill |

Peringatan React/jsdom tentang `<search>` masih muncul tanpa tes gagal. Pada akhir sesi awal F01 lokal, F02–F09 dan UI02 masih terbuka; bukti terbaru F02 ada di bagian berikutnya. Bukti ini tidak menambahkan pengujian visual/perangkat.

## F01 cloud dan F02 lokal — 21 November 2026

- Pengguna mengizinkan penerapan F01 ke cloud development dan menyetujui [rancangan F02](superpowers/specs/2026-11-21-f02-staff-auth-design.md) untuk area `/staf`. Builder check tidak menyisakan pertanyaan penting; [rencana/ledger](superpowers/plans/2026-11-21-f02-staff-auth.md) mencatat implementasi inline pada branch `feat/f01-foundation`, tanpa commit/push.
- Sesudah pengguna login ulang CLI, target persis dari `.env.local` terverifikasi: `tuntas-halal-dev`, sehat, region Singapore, Postgres 17.12. Preflight menemukan belum ada tabel bisnis/enum/riwayat; fungsi dashboard `rls_auto_enable` sudah ada. Dry run cocok lalu empat migrasi awal diterapkan tanpa seed, role, vault, atau reset cloud.
- Saat stack lokal mengikuti versi API cloud (PostgREST 14), regresi konflik versi berulang sampai timeout. Penyebab terverifikasi melalui dua kegagalan API dan dokumentasi Supabase: SQLSTATE bisnis `40001` diperlakukan sebagai serialization failure yang terus diulang. Dua assertion SQL diganti ke kontrak PT409 dan diamati gagal sebelum migrasi 005. Migrasi baru `20261121000500_version_conflict_http.sql` memperbaiki helper bersama; SQL dan API kembali lulus dalam hitungan detik, dengan satu sukses/satu HTTP 409. Migrasi 005 juga diterapkan ke cloud dan dibaca ulang. Migrasi lama tidak disunting.
- Cloud memiliki lima migrasi; enam tabel RLS, SELECT pengguna sesuai kebijakan, tanpa grants insert/update/delete langsung, delapan RPC authenticated-only dengan search_path tetap, dan receipt private tanpa grants client/service. Baca anonymous pada enam tabel serta RPC ditolak melalui API. Ini bukti struktur/API anonymous cloud; tes multi-user menggunakan fixture lokal.
- F02 menyediakan `/staf/login`, `/auth/confirm`, `/staf`, `/staf/akses-terbatas`, login tanpa signup, guard server dengan membership aktif, dan logout POST. Area ini dilepas dari store/shell demo. UI bisnis dan `/login` tetap contoh; login demo memiliki tautan berlabel menuju area staf nyata.
- `APP_URL=http://localhost:3000` ditambahkan ke `.env.local` bila belum ada; URL/publishable key pengguna tidak diubah. Origin, allowlist callback, signup nonaktif dan anonymous nonaktif pada cloud dikonfigurasi/baca ulang melalui akses admin yang sah. SMTP/rate limit tetap dipertahankan; tidak ada account/email/undangan nyata dibuat.
- Pada awal implementasi, API menolak perubahan template dengan default email provider. Pengguna kemudian memasang Mailtrap Sandbox dan kedua template berhasil diterapkan; status lanjut F02C dicatat di bawah. Lihat [panduan staf/provisioning](STAFF_AUTH.md).
- Pengguna belum memiliki domain; Mailtrap Email Sandbox dipilih untuk development. Resend/domain live menjadi opsi kemudian. Seluruh tes otomatis tetap memakai Mailpit lokal; tidak ada pembelian atau pengiriman nyata.
- Review keamanan independen menemukan dua risiko test harness: assertion yang bisa mencetak cookie/refresh token saat gagal, dan readiness yang dapat menerima server lain pada port 3150. Keduanya direproduksi RED tanpa secret nyata lalu diperbaiki: perbandingan hanya boolean, preflight port, readiness child milik tes, dan gagal saat child exit. Tidak ada minor yang ditunda.

| Pemeriksaan akhir | Hasil |
|---|---|
| Cloud F01 | Lima migrasi, grants/RLS/RPC/private receipt dan penolakan anonymous terverifikasi |
| Cloud Auth | Origin/redirect/signup/anonymous/template terverifikasi; Mailtrap diterima menurut pengguna; 23 pemeriksaan HTTP callback/sesi cloud lulus, akun sementara dihapus/readback |
| `npm run db:reset` + `db:types` | Lulus: lima migrasi reproducible dan tipe actual public schema lokal |
| `npm run db:test` | Lulus: 109 assertion SQL dan satu skenario concurrency/retry/transfer dengan konflik HTTP 409 |
| `npm run db:auth:test` | Lulus: satu skenario Next/Auth/Mailpit nyata, undangan/login, token expired/reused, cookie/refresh/error, dua pengguna/LP3H, multi-membership, pencabutan akses dan logout |
| `npm run check` | Lulus: lint, TypeScript, 40/40 tes aplikasi/harness |
| `npm run build` | Lulus: seluruh route produksi termasuk area staf |
| `npm run skills:verify` | Lulus: integritas 29 skill |

Refresh HTTP dipicu dengan metadata expiry cookie yang dibuat usang; tes benar-benar menghubungi Auth dan merotasi refresh token, tanpa menunggu expiry JWT satu jam. Token expired email diuji melalui expiry fixture Auth lokal. UI02/perangkat/visual, log infrastruktur, SMTP cloud dan data pilot belum diverifikasi.

## F02C — SMTP sandbox dan template, 21 November 2026

- Pengguna mengonfirmasi sudah menyimpan Mailtrap Sandbox pada Supabase development. Pemeriksaan administratif baca-saja membuktikan target tetap `tuntas-halal-dev` dan host `sandbox.smtp.mailtrap.io`.
- Isi dan subjek dua template repository berhasil dipasang melalui patch terbatas, lalu dibaca ulang dan cocok persis. Konfigurasi SMTP, pengirim, akses/signup, origin/redirect dan rate limit dipertahankan pada pemasangan template.
- Port awal 465 merespons banner SMTP plaintext; percobaan implicit TLS menghasilkan WRONG_VERSION_NUMBER. Agent mengubah port menjadi 587. Pengguna kemudian menyimpan ulang kredensial dan memilih port 2525; STARTTLS dengan validasi sertifikat berhasil pada port tersebut.
- Koreksi diagnosis: probe AUTH langsung memakai nilai `smtp_pass` dari GET konfigurasi, padahal API mengembalikan hash, bukan password asli ([rujukan resmi](https://supabase.com/docs/guides/deployment/terraform/reference)). Hasil 535 probe tersebut tidak membuktikan kredensial pengguna salah. Jangan ulangi probe atau menyalin hash menjadi password.
- Pengguna kemudian secara khusus mengizinkan satu email login untuk `f02-smoke-20261121@example.com`, akun sementara tanpa membership, dan penghapusannya. API Supabase menerima permintaan email; pengguna mengonfirmasi email masuk Mailtrap. Akun telah dihapus dan ketidakhadirannya diverifikasi. Tidak ada membership/data bisnis/undangan staf dibuat. Akses browser diblokir alat karena URL Chrome tidak dapat dipastikan; konfirmasi inbox berasal dari pengguna.
- Pada akhir uji SMTP, callback/sesi cloud belum diuji. Pengguna kemudian meminta agent melaksanakan uji tersebut; hasil lanjut dicatat di bawah. Izin tes terbatas pada pengujian yang diminta.

## F02C — Callback dan sesi Auth cloud melalui HTTP, 21 November 2026

- Server `localhost:3000` diverifikasi sebagai server Next di workspace ini; target Supabase development, host Mailtrap, origin/access settings dan dua template dibaca ulang. Tidak mengubah environment atau konfigurasi cloud pada uji sesi.
- Satu akun Auth sementara pada alamat fiktif yang sama dibuat tanpa membership. Admin API menghasilkan Magic Link tanpa mengirim email. Tautan dirender dari template repository dengan redirect `/auth/confirm` yang diterima allowlist cloud; token/cookie hanya di memori dan tidak dicetak.
- Sebanyak 23 pemeriksaan alur lulus: penolakan anonymous; callback/cookie/privacy headers; identitas terverifikasi provider cloud; akses terbatas tanpa membership/identitas demo; reload dengan cookie tersimpan; token bekas ditolak; refresh provider dan rotasi refresh token; logout melalui form POST; cookie dihapus; akses setelah logout ditolak. Metadata expiry cookie memicu refresh, bukan menunggu expiry JWT satu jam.
- Akun sementara sudah dihapus dan GET admin membuktikan akun tidak ditemukan. Tidak ada email tambahan, membership, data bisnis atau undangan staf ditulis. Bukti penerimaan SMTP sebelumnya berasal dari pengguna; callback/sesi diuji terpisah lewat HTTP, bukan browser pada email yang sama.
- F02C selesai dalam lingkup development (aplikasi localhost + Auth cloud). Hosting, email live, membership aktif cloud, UI02/perangkat, dan F03–F09 tetap di luar bukti ini. Tidak ada kode aplikasi berubah; check/build tidak diulang. Diff dan tautan dokumentasi diperiksa.

## F03 — Kontak dan kasus staf, 21 November 2026

- Pengguna meminta F03 dikerjakan bertahap dan memilih fitur nyata di area `/staf`, sementara route demo lama tetap tersedia.
- [Rancangan F03](superpowers/specs/2026-11-21-f03-contacts-cases-design.md) disusun berdasarkan RPC/akses aktual: konteks LP3H eksplisit, kontak milik sendiri untuk kasus baru, hak baca kontak pindahan, dan kasus edit nomor pengajuan saja. Tahap pelaksanaan: konteks/akses → kontak → kasus → pengujian/review.
- Builder check independen menemukan schema belum menyediakan nama staf lain; rancangan memakai label “Anda”/“Pendamping lain” tanpa query admin, profil atau migrasi tambahan. Kontak baru disimpan lebih dahulu sebelum membuat kasus; kegagalan kasus tidak membuat simpan kontak palsu atau duplikat.
- Pengguna menyetujui rancangan dan meminta implementasi bertahap. [Plan/ledger](superpowers/plans/2026-11-21-f03-contacts-cases.md) memuat konteks/akses → kontak → kasus → pengujian/review; seluruh tahap implementasi selesai.
- Area `/staf/lembaga/[organizationId]` menyediakan daftar/detail/tambah/ubah kontak dan daftar/pilih kontak/buat/detail/ubah nomor pengajuan kasus. Semua read/action memverifikasi identity/membership aktif dan LP3H, lalu memakai client pengguna/RLS serta empat RPC F01. Koordinator read-only; kontak pindahan tidak bisa diedit/dipakai membuat kasus baru oleh penerima. Tidak ada schema/migrasi/dependency baru.
- Form mempertahankan isian, resource ID dan seed intent. Request UUID deterministik per payload/versi membuat retry native/hydrated tetap sama. Konflik menampilkan snapshot sah dan perlu penerapan eksplisit; create yang ternyata sudah tersimpan tidak otomatis membuat duplikat. Kontak baru disimpan sebelum kasus; kasus tanpa revisi tidak ditandai tuntas. Pemilih kontak dipaginasi tanpa truncation tersembunyi.
- Tes HTTP awal gagal 404 sebelum route tersedia. Unit/service/DOM gagal sebelum implementasi, lalu lulus. Pemeriksaan tambahan menemukan preflight duplikat dapat menghalangi receipt create yang sebenarnya sudah sukses; regresi RED→GREEN membuktikan RPC receipt kembali didahulukan untuk resource yang sudah ada. Kegagalan transport Server Action direproduksi menghilangkan form sebelum penanganan client ditambahkan, sementara native POST tetap berfungsi.
- Review independen menemukan hilangnya versi yang sudah ditinjau/konfirmasi duplikat saat retry gagal, serta tidak adanya pengumuman keputusan untuk pembaca layar. Empat tes regresi penting diamati RED→GREEN: dua transport retry, versi/key native, dan pengumuman duplicate/conflict. Versi efektif dan approval disimpan terpisah dari notice; live region memberi pesan ringkas. Tidak ada minor yang ditunda. Tidak dilakukan re-review; hasil perbaikan dibuktikan tes penuh dan build.
- Tidak ada fixture/email/config cloud, data bisnis nyata, WhatsApp, deploy, commit atau push. `.env.local` dan seluruh perubahan F01/F02 dipertahankan. Branch tetap `feat/f01-foundation`. Lihat [panduan kontak/kasus](STAFF_CASELOAD.md).

| Pemeriksaan akhir F03 | Hasil |
|---|---|
| `npm run check` | Lulus: lint, typecheck, 62/62 tes aplikasi/harness |
| `npm run db:caseload:test` | Lulus: native HTTP Next/Auth/Postgres lokal, CRUD/reuse, duplikat, retry/konflik, tenant/peran, transfer dan pencabutan/receipt, pagination |
| `npm run db:test` | Lulus: 109 assertion SQL dan skenario concurrency F01 |
| `npm run db:auth:test` | Lulus: regresi sesi/refresh/undangan/Mailpit lokal F02 |
| `npm run build` | Lulus: seluruh route produksi termasuk delapan route F03 |
| Review/diff/tautan/credential-pattern | Review independen + regresi perbaikan; diff bersih dan 44 file terkait tanpa whitespace/link/literal credential bermasalah |

Browser/perangkat nyata, assistive technology aktual, hosting dan bisnis cloud belum diuji. Bukti lost-response berasal dari kombinasi retry committed/readback HTTP dan simulasi transport DOM/request-ID, bukan pemutusan paket jaringan browser nyata. Beban produksi besar belum diukur. Review membaca kontrak F01/F02 yang terkait, bukan audit ulang seluruh fondasi. Perubahan tetap uncommitted: review memakai file terkait, dan ledger kerja dipertahankan agar tidak kehilangan catatan sebelum ada Git history. Semua pilihan/batas implementasi dicatat pada plan; F04 tetap task berikutnya, bukan otomatis dimulai.

## F03C dan percobaan UI02 — 21 November 2026

- Pengguna secara eksplisit meminta uji browser/perangkat dan data bisnis cloud, termasuk fixture fiktif serta pembersihannya. [Laporan verifikasi](F03_CLOUD_VERIFICATION.md) membedakan kedua hasil.
- Browser belum dapat diuji: inventaris alat mengembalikan browser kosong dan `The browser access host is unavailable`. Tidak ada screenshot/viewport/keyboard HP atau hidrasi browser yang diklaim lulus; UI02 tetap terbuka.
- Satu skenario operasional aplikasi localhost dengan Auth/Postgres cloud `tuntas-halal-dev` lulus: callback/sesi, kontak/kasus create/read/update/reuse, normalisasi/duplikat, validasi/isian, retry/idempotency, konflik, LP3H/peran, transfer/kasus saudara, dan pencabutan membership/receipt. Operasi bisnis memakai sesi pengguna; admin hanya fixture, readback dan cleanup.
- Dua LP3H fiktif dan empat akun sementara dibuat tanpa email, dengan dua kontak dan dua kasus. Cleanup dibatasi identitas run dalam satu transaksi administratif, termasuk audit/receipt; guard append-only diaktifkan kembali sebelum commit. Empat akun Auth dihapus dan GET menyatakan tidak ditemukan.
- Query terpisah membuktikan organisasi, membership, kontak, kasus, tugas, audit, receipt dan akun Auth kembali nol seperti baseline; guard audit `O` dan RLS enam tabel tetap aktif. Tidak ada data nyata, fixture tersisa, email/WhatsApp, perubahan app/schema/konfigurasi Auth, commit/push atau deploy. Check/build tidak diulang untuk sesi operasional tanpa perubahan aplikasi.

## F04 — Revisi staf lokal, 21 November 2026

- Pengguna menyetujui [rancangan F04](superpowers/specs/2026-11-21-f04-revision-tasks-design.md) dan meminta implementasi. Eksekusi inline mengikuti [rencana](superpowers/plans/2026-11-21-f04-revision-tasks.md), mempertahankan seluruh fondasi uncommitted pada branch `feat/f01-foundation`.
- Detail kasus staf menampilkan daftar revisi terpaginasikan 20 baris, instruksi utuh, status teks dan tanggal tersimpan. Pendamping penanggung jawab dapat menambah dan mengubah instruksi; koordinator hanya membaca. Kontak pindahan tidak menghalangi assignee yang sah mengelola revisi. Task harus termasuk kasus pada URL.
- Instruksi wajib maksimal 2.000 karakter. Create memakai `create_task`, default `needs_sending`, tanggal null. Migrasi additive 006 menyediakan `update_task_instruction`: lock akses terkini → receipt → expected version → ubah hanya instruksi. Status/tanggal, termasuk completed, tetap terjaga. Audit atomik tidak memuat instruksi. Migrasi diterapkan hanya lokal tanpa reset; tipe schema diregenerasi.
- SQL, service, DOM dan HTTP diamati gagal sebelum implementasi lalu lulus. HTTP mengungkap CRLF pada multipart native versus LF setelah hidrasi; regresi service direproduksi RED→GREEN, lalu baris baru dinormalisasi sebelum validasi/hash intent. Input gagal tetap tersedia; konflik perlu peninjauan eksplisit, dengan versi efektif dan intent tetap saat retry error.
- Review independen tidak menemukan masalah pada file F04 dan kontrak F01/F03 terkait; reviewer tidak menjalankan tes sendiri atau melakukan audit browser. Tidak ada dependency baru, perubahan demo, email eksternal/WhatsApp, data nyata, fixture/migrasi cloud, deploy, commit atau push. Regresi Auth memakai email fiktif yang ditangkap Mailpit lokal.

| Pemeriksaan F04 | Hasil |
|---|---|
| `npm run check` | Lulus: lint, typecheck, 74/74 tes aplikasi/harness |
| `npm run db:test` | Lulus: 128 assertion pgTAP pada lima file dan skenario concurrency F01 |
| `npm run db:caseload:test` | Lulus: native HTTP F03/F04, create/read/update/reload, idempotency/konflik, preservasi status/tanggal, akses/transfer/pencabutan dan pagination |
| `npm run db:auth:test` | Lulus: regresi sesi/Auth lokal |
| `npm run build` | Lulus: build produksi termasuk dua route revisi staf baru |

Cloud development tetap pada migrasi 001–005; perlu penerapan terpisah migrasi 006 sebelum edit F04 dapat dipakai dengan database cloud. Bukti HTTP F04 lokal tidak membuktikan cloud, layout/keyboard HP, browser terhidrasi atau kesiapan pilot. UI02 dan F05–F09 tetap terbuka. Peringatan React/jsdom `<search>` pada suite demo masih muncul tanpa tes gagal.

## F04C — Migrasi cloud development, 21 November 2026

- Atas permintaan pengguna, project `tuntas-halal-dev` diverifikasi cocok `.env.local`/akun CLI, sehat di Singapore. Preflight memastikan lima migrasi F01 dan belum ada RPC instruction-only. Dry run memilih hanya migrasi 006; penerapan memakai target eksplisit dan `--skip-vault`, tanpa reset/seed/role/perubahan Auth.
- Migrasi 006 berhasil tercatat. Hash body fungsi cocok repository, SECURITY DEFINER/search_path kosong benar, authenticated mendapat EXECUTE, anon/PUBLIC tidak; authenticated tetap tidak dapat menulis tabel tugas langsung. RLS enam tabel, guard audit `O` dan helper PT409 tetap aktif. REST anonymous ditolak HTTP 401/42501. Dry run terakhir menunjukkan up to date.
- Enam tabel bisnis tetap nol seperti baseline, tanpa akun/fixture/email/WhatsApp baru. Tidak ada perubahan kode aplikasi/migrasi repository, deploy, commit/push. Check/build tidak diulang untuk sesi operasional ini. Alur bisnis F04 bersesi cloud dan browser/HP belum diuji; bukti fungsional F04 tetap dari suite lokal. Lihat [laporan](F04_CLOUD_VERIFICATION.md).

## F05 — Draf WhatsApp staf lokal, 21 November 2026

- Pengguna memilih browser per akun/LP3H/kasus dan menyetujui [rancangan](superpowers/specs/2026-11-21-f05-whatsapp-drafts-design.md). [Rencana inline](superpowers/plans/2026-11-21-f05-whatsapp-drafts.md) mempertahankan checkout F01–F04 uncommitted. Tidak menambah dependency, schema/migrasi atau konfigurasi cloud.
- Route kasus `/pesan` menyediakan penerima server, pilihan revisi aktif lintas halaman, pesan suntingan dan ekspor. Pemulihan localStorage didahulukan atas parameter URL/seed, termasuk pesan/pilihan kosong. Pesan suntingan tidak ditimpa otomatis oleh pilihan/data baru. Error storage mempertahankan editor; konflik tab membutuhkan keputusan eksplisit. Lihat [panduan draf](STAFF_DRAFTS.md).
- Server membaca dengan sesi pengguna/RLS dan memverifikasi LP3H, assignee, semua ID/versi terpilih serta kontak sebelum salin/buka. Tugas completed, tenant lain, koordinator dan assignee lama ditolak. Validasi draf adalah read-only: HTTP readback tugas/audit tetap sama. Tidak ada konfirmasi pengiriman atau perubahan status F06.
- Clipboard gagal memberi seleksi/manual fallback, URL panjang memberi chat tanpa teks, Unicode rusak ditolak. POST lanjutan memeriksa ulang sebelum redirect eksternal; tes tidak mengikuti redirect atau membuka WhatsApp nyata. Pesan/URL tidak dicatat sebagai riwayat bisnis.
- Tes service/storage/DOM dan route HTTP diamati RED sebelum implementasi. Akses getter localStorage yang ditolak direproduksi RED→GREEN; editor tetap di memori. Review independen menemukan POST lanjutan belum mengunci suntingan sehingga respons lambat dapat mengekspor teks lama. Regresi tertunda diamati RED→GREEN, lalu pending native mengunci pesan/pilihan/perubahan hingga respons selesai. Respons hydrated lama setelah edit diabaikan. Tidak ada temuan review lain yang belum ditangani; reviewer tidak memverifikasi perangkat/cloud.
- `npm run check` lulus lint/typecheck dan 93/93 tes; `db:caseload:test` lulus alur HTTP F03–F05, termasuk redirect tanpa follow, penolakan peran/tenant/ID/transfer serta pagination. `db:test` lulus 128 assertion SQL dan concurrency; `db:auth:test` lulus regresi sesi/Auth lokal. `npm run build` lulus, termasuk route draf staf baru.
- Tidak ada data nyata, email eksternal/WhatsApp, cloud fixture/migrasi, deploy, commit atau push. Regresi Auth memakai Mailpit lokal. Peringatan React/jsdom `<search>` pada demo tetap ada tanpa tes gagal. Pemulihan/clipboard/WhatsApp nyata di HP/laptop belum diuji; F05V/UI02 tetap terbuka. F05 cloud tidak diuji; kompatibilitas schema tidak sama dengan bukti sesi bisnis cloud.

## F05C — Sesi cloud development, 21 November 2026

- Pengguna meminta uji cloud dan HP/WhatsApp, lalu memilih menyelesaikan cloud dahulu karena alat masih melaporkan `The browser access host is unavailable` dan tidak menyediakan kontrol HP. Tidak ada browser/HP nyata yang dinyatakan lulus.
- Skenario HTTP aplikasi localhost + Auth/database `tuntas-halal-dev` lulus: callback/sesi/reload, F04 create/update instruksi dengan RPC 006, draf 22 revisi aktif lintas halaman, filter completed/kasus saudara, penolakan tenant/peran/pilihan tidak sah, validasi salin/redirect, karakter khusus/emoji, pesan panjang/kosong, konflik instruksi/kontak dan tinjauan eksplisit, transfer serta pencabutan membership. Compose/ekspor tidak memutasi status/instruksi/tanggal/versi atau audit. Redirect tidak diikuti dan clipboard OS tidak digunakan.
- Dua LP3H/empat akun sementara, dua kontak/dua kasus dan 24 tugas dibuat tanpa email. Cleanup terikat run membersihkan tugas/kasus/kontak/audit bisnis/receipt/membership/LP3H dan menghapus akun Auth/readback. Query terpisah mengonfirmasi delapan hitungan kembali nol, guard audit `O`, RLS enam tabel aktif dan migrasi tetap enam.
- Tidak ada perubahan aplikasi/schema/Auth/SMTP, pesan WhatsApp/email eksternal, deploy, commit atau push. Check/build tidak diulang untuk sesi operasional; bukti implementasi tetap sebagaimana F05 lokal. [Laporan lengkap](F05_CLOUD_VERIFICATION.md). Izin fixture run ini sudah selesai cakupannya. F05V/UI02 dan perjalanan WhatsApp nyata tetap terbuka.

## Fixture HP F05 — aktif, 21 November 2026

Pengguna meminta akun dan kasus uji untuk HP. Satu akun pendamping `f05-hp-d979baca@example.com`, satu LP3H, satu kontak/kasus **Usaha Uji HP F05 / UJI-HP-F05** dan dua revisi Perlu dikirim dibuat di cloud development serta diverifikasi dengan sesi pengguna/RLS. Data sengaja dipertahankan, belum ada email login/pesan dikirim atau uji HP yang dinyatakan lulus. Nomor contoh harus diganti pengguna langsung di aplikasi sebelum membuka WhatsApp.

**Baseline cloud kini tidak nol. Jangan reset atau menjalankan smoke test yang mengasumsikan kosong.** Identitas run, langkah login Mailtrap dan rencana cleanup terbatas ada di [F05_HP_TEST.md](F05_HP_TEST.md). Izin pembuatan ini khusus fixture manual yang diminta; tidak mencakup undangan nyata/fixture lain. Kode aplikasi dan konfigurasi tidak berubah.

## Verifikasi sebelum push GitHub — 22 November 2026

- Pengguna meminta seluruh perubahan saat ini dipush ke GitHub. Target adalah branch aktif `feat/f01-foundation` pada `rahmatrafii/tuntas-halal`.
- `npm run check` lulus: lint, TypeScript dan 93/93 tes. Percobaan sandbox terhenti pada `uv_os_get_passwd` sebelum suite berjalan; menjalankan ulang check di luar sandbox lulus tanpa perubahan kode. Peringatan React/jsdom `<search>` tetap muncul tanpa tes gagal.
- `npm run build` dan `npm run skills:verify` lulus; 29 skill terverifikasi. Pemeriksaan diff, pola kredensial dan kecocokan nilai key/token environment lokal tidak menemukan masalah. `.env.local`, metadata Supabase lokal dan runner di `.git` tidak disertakan.
- Tidak mengulang suite database/HTTP integrasi, uji cloud atau perangkat pada sesi push ini. Fixture HP F05 tetap dipertahankan; F05V/UI02 dan F06–F09 tetap terbuka.

## Uji dasar HP F05 — 22 November 2026

Pengguna mengonfirmasi tujuh pemeriksaan Chrome Android berhasil: isi draf dan pilihan dua revisi bertahan setelah reload, salin-tempel ke Catatan berhasil, penerima WhatsApp benar, teks WhatsApp lengkap, draf bertahan setelah kembali/reload, dan kedua status tetap Perlu dikirim. Ini bukti laporan pengguna untuk skenario dasar, bukan observasi langsung agent. Lihat [F05_HP_TEST.md](F05_HP_TEST.md). Fixture tetap aktif; tidak ada cleanup atau perubahan kode. Pesan panjang/karakter khusus, clipboard laptop dan review visual UI02 masih perlu diuji; F05V belum ditutup seluruhnya.

## Koreksi tautan emoji WhatsApp laptop — 22 November 2026

- Laporan pengguna membuktikan emoji pada draf dan Salin–Tempel laptop benar, tetapi Buka WhatsApp merusaknya di halaman perantara serta aplikasi desktop/Web. Uji tambahan Android untuk karakter khusus/emoji, pesan panjang terisi dan reload dilaporkan berhasil; fallback batas tautan belum terpicu.
- Probe HTTP memakai nomor fiktif mereproduksi wa.me 302 yang mengganti emoji menjadi U+FFFD. Helper bersama kini menuju endpoint API langsung; probe tautan baru mengonfirmasi parameter pesan dan tautan lanjutan Web mempertahankan emoji. Tidak ada perubahan akses/status/draf tersimpan atau dependency.
- Tes regresi domain RED→GREEN, `npm run check` lulus lint/TypeScript/93 tes dan `npm run build` lulus. Percobaan check pertama dihentikan pada worker tes form staf yang tersendat; suite tersebut lulus sendiri dan pengulangan check penuh lulus tanpa perubahan kode tes staf. Peringatan React/jsdom `<search>` tetap muncul. Diff diperiksa; tidak menjalankan ulang integrasi database/cloud atau mengirim pesan. Fixture HP tetap aktif.
- Pengguna kemudian mengonfirmasi uji ulang Buka WhatsApp laptop berhasil; temuan emoji teratasi menurut laporan pengguna, tanpa rincian desktop/Web terpisah atau uji ulang Android sesudah perubahan. Fallback pesan melampaui batas tautan dan UI02 tetap terbuka; lihat [hasil perangkat](F05_HP_TEST.md).

## F05 — Verifikasi otomatis fallback panjang, 22 November 2026

Atas permintaan pengguna, dua tes tambahan membuktikan batas URL terenkode 8.000/8.001 karakter serta alur editor dengan service nyata/transport fixture: pemberitahuan fallback, pesan Unicode disalin utuh ke stub clipboard, draf/pilihan pulih saat editor dimuat ulang, tanpa request tulis bisnis atau perubahan status. Suite terarah 17 tes lulus; `npm run check` lulus lint/TypeScript/95 tes dan `npm run build` lulus. Kode aplikasi tidak berubah pada sesi pengujian ini. Tidak ada fixture cloud tambahan, pesan dikirim atau cleanup. Clipboard OS dan navigasi WhatsApp/HP nyata tidak dibuktikan oleh jsdom; F05V/UI02 tetap terbuka. Lihat [laporan perangkat](F05_HP_TEST.md).

## UI02A — Audit sumber keterbacaan mobile, 22 November 2026

Pengguna mendelegasikan audit/perbaikan teks/info/modal lintas halaman. Audit komponen bersama dan sumber demo/staf menemukan notice flex yang mengalahkan panel konflik block, instruksi/badge menempel, risiko long text, modal tinggi, metadata kecil dan copy staf usang. Perbaikan mempertahankan desain monokrom referensi, data, akses dan perilaku bisnis. Diagnostic cascade sebelum/sesudah, check lint/TypeScript/95 tes, build dan review sumber independen lulus. Smoke HTTP publik 11 route 200 dan dua route staf tanpa sesi 307; bukan bukti halaman bisnis bersesi atau rendering mobile.

Browser inventory tetap kosong dengan `The browser access host is unavailable`. UI02 belum lulus visual/perangkat/zoom/keyboard. Fixture HP tetap aktif; tidak ada operasi cloud, email/WhatsApp, commit/push atau deploy. [Laporan dan cakupan lengkap](MOBILE_READABILITY_AUDIT.md); rancangan/rencana di `docs/superpowers`. Perubahan emoji/fallback dari sesi sebelumnya dipertahankan.

## UI02B/F05V — Pengujian Android langsung, 22 November 2026

Pengguna menyediakan jendela scrcpy interaktif; agent menguji HP melalui CUA dengan sesi fixture aktif. Form kontak/kasus/revisi, keyboard angka/teks, validasi instruksi kosong/fokus/batal, daftar/detail, draf/reload, modal filter/Escape, navigasi dan antrean diperiksa pada perangkat. Tidak mengubah data bisnis; instruksi kosong ditolak, form dibatalkan, dua revisi tetap Perlu dikirim.

Fallback pesan panjang nyata dan ekspor pendek beremoji bekerja setelah perbaikan bug continuation: tombol Lanjut ke WhatsApp semula hilang saat Salin, regresi diamati RED→GREEN. Salin clipboard HP → chat tanpa teks → tempel memperlihatkan penanda awal/akhir/emoji; tidak menekan Kirim. Isian WhatsApp uji dikosongkan dan draf aplikasi dikembalikan ke paragraf contoh pendek. Fixture tetap aktif. Zoom Chrome 200% menemukan header/nav overflow, diperbaiki dengan wrapping dan navigasi grid dalam alur pada layar sangat sempit; hasil HP diperiksa lalu zoom dikembalikan 100%. Review sumber independen tidak menemukan masalah penting.

Validasi akhir: `npm run check` lulus lint/TypeScript/96 tes dan `npm run build` lulus. Satu check tersendat pada worker form login; tes tersebut lulus sendiri lalu pengulangan check penuh lulus. Review tambahan tidak menemukan masalah penting. Belum seluruh route/keadaan diuji di semua ukuran/orientasi/perangkat; UI02 tetap terbuka. Bukti dan batas ada di [audit mobile](MOBILE_READABILITY_AUDIT.md) dan [uji HP](F05_HP_TEST.md). Tidak ada fixture cloud tambahan, pesan/email dikirim, schema/config Auth berubah, commit/push/deploy.

## F06 — Status, tindak lanjut dan riwayat lokal, 22 November 2026

- Pengguna menyetujui [rancangan](superpowers/specs/2026-11-22-f06-status-follow-up-design.md) dan implementasi status per revisi + konfirmasi beberapa revisi sesudah pengiriman. [Rencana](superpowers/plans/2026-11-22-f06-status-follow-up.md) dijalankan inline pada checkout fitur yang sama; perubahan F05/UI sebelumnya dipertahankan.
- Area staf menambah form status/tanggal, checkbox kirim/selesai, koreksi tahap sebelumnya, form Catat pengiriman terpisah dari draf (maks100, kebijakan tanggal bersama eksplisit), progres seluruh tugas dan riwayat20/halaman. Native menampilkan seluruh kandidat, hydrated20/halaman dengan pilihan lintas halaman. Tidak menulis instruksi melalui status RPC atau menyalin isi pesan ke audit.
- Mutasi memakai `set_task_statuses` F01 dan client pengguna/RLS: membership/LP3H/peran/assignee, input server, requestId deterministic, expected version dan receipt. Tanpa schema/dependency baru. No-op tidak memanggil RPC. Pending mengunci snapshot; gagal simpan mempertahankan isian. Konflik butuh penerapan eksplisit dan tidak membocorkan data di luar akses.
- TDD service/form/native dimulai RED lalu GREEN. Review independen menemukan native reviewed versions yang belum diproses server, submit manual disabled, kandidat setelah20 tersembunyi tanpa JS, serta completion guard yang menghalangi receipt setelah reopen. Keempatnya diperbaiki dengan regresi RED→GREEN; tidak ada minor terpisah yang ditunda. Keputusan native-all dicatat dalam spec/ledger. Inline error/focus juga diregresikan RED→GREEN.
- `npm run check` lulus lint, TypeScript dan **109/109 tes**. Satu percobaan suite paralel worker staff-forms gagal/terhenti saat mesin memuat Docker; pengulangan penuh terakhir lulus tanpa perubahan form Auth. Peringatan React/jsdom `<search>` lama tetap muncul. `npm run build` lulus, termasuk route status dan pengiriman.
- `npm run db:test` lulus **128 assertion SQL** dan skenario concurrency/receipt/batch/tenant/transfer. HTTP `npm run db:caseload:test` lokal lulus setelah penambahan F06: status/tanggal/konfirmasi, no-op tanpa audit, retry respons hilang, completion date-only receipt setelah reopen, konflik dua sesi sampai native apply, partial send/reply, stale batch rollback, koordinator/parent isolation, progress tuntas/buka kembali dan pagination riwayat. Fixture lokal fiktif; wrapper menolak endpoint cloud. Docker Desktop yang sudah terpasang dijalankan untuk stack lokal; tidak mereset cloud.
- Tidak ada migrasi/config cloud, fixture/undangan/email baru, pesan WhatsApp, cleanup fixture HP, commit/push/deploy. Bukti lokal tidak menggantikan uji bisnis F06 cloud atau perangkat. F07/F08 dan sisa UI02 tetap terpisah. [Panduan staf](STAFF_STATUS.md).

## F06C — Verifikasi bisnis cloud, 22 November 2026

- Atas permintaan pengguna, native HTTP aplikasi localhost dengan sesi Auth/database `tuntas-halal-dev` lulus uji F06: status/tanggal/konfirmasi, koreksi/progres, partial send/reply, retry/receipt tanpa audit ganda, no-op, konflik/tinjauan eksplisit, batch rollback, tenant/peran/parent, transfer/revocation dan pagination. Tidak memerlukan migrasi baru; enam migrasi cloud tetap tersedia.
- Run `740f9aae-9cf2-4e92-9d61-9a557baf96f8` memakai dua LP3H/empat akun sementara. Cleanup/readback terpisah menunjukkan nol LP3H/membership/kontak/kasus/tugas/audit/receipt/Auth run ini. Guard audit aktif dan RLS enam tabel tetap aktif. Fixture HP lama dipertahankan; fingerprint tugas sebelum/sesudah sama, keberadaan 1 LP3H/1 kasus/2 revisi terverifikasi. Nomor pribadi tidak dibaca/dicatat.
- Tanpa email/WhatsApp, perubahan kode aplikasi/schema/config, deploy atau commit/push. Check/build tidak diulang pada sesi operasional ini. F06 perangkat/HP dan sisa UI02 tetap terbuka. [Laporan](F06_CLOUD_VERIFICATION.md). Izin fixture sementara run ini selesai.

## Batas tahap ini

Pemilihan skill otomatis kini diwajibkan di `AGENTS.md`: agent membaca dan mengikuti skill yang relevan sebelum coding/development, menilai ulang saat tahap berubah, dan menyebutkan tujuannya tanpa menunggu pengguna menamai skill. Panduan lintas sesi ada di `SKILLS.md`; berlaku pada repository ini, tanpa perubahan konfigurasi global. Perubahan ini hanya dokumentasi/instruksi; path skill dan diff diperiksa, check/build aplikasi tidak diulang.

Route demo bisnis tetap data contoh; area staf mempunyai sesi/membership, kontak/kasus F03, revisi F04 dan draf F05 yang diuji lokal serta skenario cloud F03C/F05C. Migrasi F04 sudah diterapkan ke cloud. F06 sudah diimplementasikan lokal dan diverifikasi melalui sesi/database cloud; uji HP F06, antrean F07, transfer UI F08, sisa UI02 dan gerbang pilot F09 belum selesai. Simulasi role browser tidak mengotorisasi data nyata. Jangan memasukkan data pribadi/pilot sebelum gerbang akses dan operasional sesuai.

Project Supabase development dibuat oleh pengguna. Satu email login fiktif dikirim ke Mailtrap atas izin khusus; akun sementara sudah dihapus. Belum ada deployment aplikasi, undangan staf nyata, email ke inbox nyata, atau pesan WhatsApp. Repository GitHub project: `https://github.com/rahmatrafii/tuntas-halal`, branch utama `main`. Commit awal mencakup frontend dummy, dokumentasi, dan skill project; file environment lokal, dependency terpasang, serta hasil build dikecualikan dari Git.

## Melanjutkan pekerjaan

1. Coba alur melalui `FRONTEND_DEMO.md`; mulai dari `/` atau `/login`.
2. Selesaikan UI02 saat akses browser/perangkat sah tersedia: screenshot 375px/390px, tablet/desktop, zoom 200%, keyboard, native modal, dan review kesesuaian referensi.
3. F05 lokal dan sesi cloud F05C selesai; lihat STAFF_DRAFTS.md/F05_CLOUD_VERIFICATION.md. F06 lokal dan cloud telah diverifikasi; lanjutkan uji HP F06 atau task F07 tersendiri sesuai instruksi pengguna. Sisa UI02 tetap memerlukan akses browser/perangkat. Fixture/undangan cloud tambahan tetap memerlukan instruksi pengguna; suite `db:*` tetap lokal.

Keputusan pilot tetap terbuka: LP3H nyata, zona waktu final, retensi, hosting, dan harga. Spesifikasi produk tetap bersumber dari PRD; sistem desain aktif dari `DESIGN_SYSTEM.md`.
