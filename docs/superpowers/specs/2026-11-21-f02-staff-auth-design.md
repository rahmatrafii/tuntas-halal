# F02 — Login undangan dan sesi staf

**Status: disetujui pengguna dan diimplementasikan secara lokal pada 21 November 2026.** Reviewer builder menyatakan tidak ada pertanyaan penting tersisa. Pengguna menyetujui area `/staf` dan pengujian email lokal. F01 cloud selesai; SMTP/template hosted menjadi gerbang F02C yang belum selesai.

Pengguna meminta dimulai penerapan F01 ke Supabase cloud development dan F02. Dokumen ini menjelaskan rancangan F02; rancangan/migrasi F01 sudah disetujui sebelumnya. Penerapan F01 dapat dilanjutkan setelah akses administratif dan target terverifikasi, tanpa menunggu keputusan desain F02.

## Kebutuhan dan kondisi yang ditemukan

Staf undangan perlu masuk melalui email, mendapatkan sesi server yang terverifikasi, melihat keanggotaan aktif, dan keluar. Staf nonaktif atau tanpa membership tidak dapat membuka area staf. Sumber kebutuhan: [PRD](../../PRD_Pelacak_Revisi_Halal.md), [backlog](../../BACKLOG.md), [arsitektur](../../ARCHITECTURE.md), dan [model data](../../DATA_MODEL.md).

- Next.js 16.4.6, React 19.3, `@supabase/ssr` 0.12.7, dan supabase-js 2.119.1 sudah terpasang. Tidak menambah library autentikasi atau membuat sistem JWT sendiri.
- F01 menyediakan membership/RLS/tipe generated. Satu pengguna dapat memiliki lebih dari satu membership; tidak ada constraint satu pengguna/satu LP3H.
- `/login`, `/akun`, dan seluruh layar bisnis masih demo. Identitas demo berasal dari localStorage; default Nadia dan LP3H fiktif tidak boleh ditampilkan sebagai identitas staf nyata.
- `AppShell` global memakai store demo untuk seluruh anak. Area Auth nyata perlu dilepas dari shell tersebut agar dapat dirender tanpa hidrasi, identitas, atau pembatasan demo.
- Client SSR/proxy memakai cookie; proxy memperbarui `getClaims()` dan meneruskan cookie/cache headers. Guard membership belum tersedia.
- Pemeriksaan administratif pada awal pekerjaan: CLI dapat membaca daftar project, tetapi tidak menemukan target dari `.env.local`; project belum di-link. Plugin Supabase belum terhubung. Pengguna memilih login ulang lewat CLI; hasil login baru belum dikonfirmasi.

## Pendekatan yang dipertimbangkan

1. **Direkomendasikan: area Auth nyata di `/staf`, demo tetap tersedia.** `/staf/login` menjadi login nyata dan `/staf` menjadi halaman sesi/keanggotaan terlindungi. `/login` dan route bisnis lama tetap jelas sebagai demo. Ini membuktikan F02 tanpa mencampur identitas nyata dengan kasus fiktif atau mengerjakan F03–F08 sekaligus. Konsekuensi: ada dua pintu masuk yang diberi label jelas sampai integrasi bisnis selesai.
2. **Ganti login dan lindungi seluruh aplikasi sekarang.** URL akhir lebih cepat terbentuk, tetapi shell, akun, identitas pendamping, store, dan seluruh pembatasan demo harus dipetakan ulang. Risikonya pengguna nyata melihat data fiktif sebagai data lembaganya, dan cakupan meluas ke integrasi bisnis yang belum dirancang.

Pendekatan pertama disetujui pengguna. Halaman staf menampilkan penjelasan bahwa fitur kontak/kasus belum terhubung. Jangan menambahkan tombol menuju fitur backend yang belum berfungsi. Navigasi eksplorasi demo, bila disediakan, diberi label data contoh dan tidak menyiratkan akses ke kasus nyata.

## Cakupan dan rute

| Rute/operasi | Perilaku |
|---|---|
| `/staf/login` | Form email undangan, validasi server, pending/error dan respons generik |
| `/auth/confirm` | Route Handler menukar token email/invite sah menjadi cookie sesi, lalu menuju `/staf` |
| `/staf` | Server Component; identitas Auth dan daftar membership aktif milik pengguna dari database |
| `/staf/akses-terbatas` | Pesan untuk pengguna terautentikasi tanpa membership aktif; dapat keluar |
| Logout | Server Action POST; keluar dari sesi ini dan kembali ke login nyata |
| Demo yang ada | Tetap memakai data dummy, tanggal acuan, dan kontrak UI sebelumnya |

Tidak membuat signup publik, password login/reset password, OAuth, UI administrasi staf, atau integrasi kasus/kontak. Tidak deploy aplikasi, mengundang staf nyata, mengirim email/WhatsApp nyata selama pekerjaan, atau memasukkan data pilot. Tidak memasang secret administratif sebagai konfigurasi publik.

## Login dan konfirmasi

- Alur email mengikuti demo/PRD: `signInWithOtp` dengan `shouldCreateUser: false`. Pendaftaran publik dan login anonim tetap nonaktif pada Auth.
- Email divalidasi di server; jangan menerima owner, role, membership, atau LP3H dari form. Gunakan validasi sederhana sesuai kebutuhan email, tanpa regex kompleks atau dependency baru.
- Pengiriman sukses merespons secara generik: jika email terdaftar, tautan dapat digunakan. Jangan memastikan sebuah alamat ada di lembaga. Kegagalan transport/rate limit memberi pesan retry yang sesuai dan mempertahankan email.
- Tombol kirim dinonaktifkan selama request; jangan menampilkan sukses sebelum provider memberi hasil. Rate limit server Auth tetap berlaku; UI pending bukan kontrol keamanan. Jangan membuat endpoint admin pencarian email untuk alur publik.
- URL aplikasi tepercaya berasal dari konfigurasi server yang tervalidasi, misalnya `APP_URL`. Izinkan HTTP hanya pada loopback development; URL cloud/deployment harus HTTPS. Jangan membentuk redirect dari Host header atau URL bebas kiriman pengguna.
- Template Magic Link menggunakan token hash `type=email`; template undangan memakai `type=invite`, menuju `/auth/confirm` pada origin yang disetujui. Route hanya menerima kedua tipe itu, token yang tidak kosong/berukuran wajar, dan target akhir tetap `/staf`; tidak menerima redirect eksternal.
- Konfirmasi menggunakan `verifyOtp`, menulis cookie melalui client SSR request tersebut, lalu redirect tanpa menyertakan token. Tautan invalid, kedaluwarsa, sudah dipakai, atau tipe lain menuju login dengan kode pesan aman, tanpa payload error provider atau token.
- Jangan mencatat token/hash/JWT, callback URL lengkap, key, cookie, atau email pengguna dalam log. Terapkan `Referrer-Policy: no-referrer` dan `Cache-Control: private, no-store` pada respons Auth. Output pengujian tidak mencetak URL bertoken. Pengelolaan log infrastruktur/email sebelum produksi tetap bagian gerbang pilot.

F02 menyediakan implementasi pengiriman untuk tindakan manusia melalui form. Selama implementasi, pengujian hanya memakai layanan email lokal yang ditangkap di Mailpit; tidak menekan/memanggil kirim email pada cloud. Penyedia SMTP cloud dan deliverability belum dianggap teruji tanpa pengujian yang secara eksplisit diizinkan.

## Verifikasi sesi dan membership

- Tambahkan helper server-only yang memverifikasi sesi lewat `getClaims()` dari SDK, kemudian query membership dengan `user_id` dari subject terverifikasi dan `is_active=true`, menggunakan client pengguna/RLS. Jangan mempercayai cookie/`getSession()` atau user metadata untuk otorisasi.
- Bedakan sesi tidak sah, tidak ada membership, dan kegagalan layanan. Sesi tidak sah menuju login; pengguna sah tanpa membership menuju akses terbatas; kegagalan query memberi error/retry, bukan dianggap akun nonaktif atau sukses.
- Setiap halaman/data request terlindungi, Server Action bisnis, dan Route Handler kelak harus memanggil helper yang sesuai. Layout atau proxy saja tidak cukup. Halaman akses terbatas hanya memerlukan identitas terverifikasi agar tidak membuat redirect loop.
- Data yang dikirim ke UI hanya email dari Auth terverifikasi dan membership minimum: nama LP3H, role, serta zona waktu. Jangan mengirim JWT/refresh token, raw cookies, daftar staf lain, atau key ke komponen.
- Bila terdapat beberapa membership aktif, tampilkan daftar seluruh membership milik pengguna. F02 tidak otomatis memilih LP3H, menyimpan pilihan tenant, atau menambahkan pemilih. Query bisnis berikutnya harus menentukan organisasi dan memeriksa keanggotaannya sendiri.
- Membership dibaca pada setiap request yang membutuhkan otorisasi; tidak disimpan di localStorage atau cache lintas request/pengguna. React request-scoped memoization boleh dipakai bila diperlukan, tanpa cache persisten.
- Proxy tetap menangani refresh cookie dan mempertahankan cache headers, termasuk pada respons redirect bila proxy mengembalikan redirect. Proxy tidak menjalankan lookup seluruh data bisnis.
- Tidak ada perpindahan role demo untuk pengguna nyata. Pendamping dan koordinator memiliki halaman sesi yang sama dengan label peran dari database; kewenangan tetap dibatasi RLS/RPC F01.
- Logout POST menggunakan SDK dan scope sesi ini, mempertahankan error saat provider gagal. Cookie sesi dibersihkan setelah konfirmasi yang sesuai; akses halaman terlindungi berikutnya harus kembali ke login. JWT yang telah disalin memiliki batas revokasi hingga kedaluwarsa; jangan mengklaim logout mematikan semua token di semua perangkat secara seketika.

## UI dan penanganan kegagalan

Gunakan sistem desain [DESIGN_SYSTEM.md](../../DESIGN_SYSTEM.md): putih, card abu-abu, aksi hitam, bahasa Indonesia, gutter HP 20px, input 16px dan kontrol 48px. Pertahankan desain login yang tersedia sebagai acuan, tanpa menyalin tombol akun contoh ke login nyata. Tidak mengubah desain route demo.

Error dekat input untuk email invalid, notice untuk kegagalan layanan, label pending yang dapat dibaca pembaca layar, dan fokus yang terlihat. Sesi tidak sah/tautan kedaluwarsa menawarkan kirim ulang melalui form login. Akses terbatas menjelaskan perlu membership aktif dan menyediakan logout. Identitas LP3H berasal dari query sah, bukan label fiktif hardcoded. Jangan menampilkan pesan “berhasil masuk” sebelum sesi terverifikasi.

## Provisioning dan konfigurasi

- Dokumentasikan provisioning admin: verifikasi LP3H, identitas target Auth, buat undangan melalui jalur admin terpercaya, dan tambahkan membership dengan role/is_active yang benar. Jangan menganggap user metadata sebagai membership. Undangan nyata dijalankan hanya atas instruksi pengguna yang menyebut penerimanya.
- F02 tidak memerlukan secret admin di runtime publik atau dashboard administrasi baru. Pengujian memakai admin lokal untuk fixture; operasional admin dilakukan di dashboard/alat admin yang sah.
- Sediakan template email undangan/Magic Link sebagai file yang dapat ditinjau, konfigurasi Site URL dan allowlist redirect. Konfigurasi lokal boleh diubah untuk Mailpit; jangan push seluruh konfigurasi lokal ke cloud.
- `.env.example` menjelaskan konfigurasi origin aplikasi; `.env.local` pengguna tetap dipertahankan. Pengujian menjalankan server Next terpisah dengan env lokal di proses, port berbeda dari dev server pengguna, dan tidak mengubah env cloud.

## Pengujian dan definisi selesai F02

Tulis tes aturan akses/session dahulu dan amati gagal sebelum implementasi. Gunakan Node runner/Testing Library yang sudah tersedia. Tambahkan integrasi HTTP nyata ke Next dan Auth lokal bila diperlukan untuk membuktikan cookie/guard; tidak menambah suite browser kosong atau memalsukan JWT untuk klaim end-to-end.

1. Email invalid tidak memanggil Auth; pengiriman memakai `shouldCreateUser:false` dan origin tepercaya. Unknown email tidak membuat akun. Pending/error mempertahankan input dan tidak mengaku sukses.
2. Mailpit menangkap email lokal fiktif, lalu callback nyata menulis cookie dan redirect ke `/staf`. Uji undangan dan login berikutnya, token terpakai/kedaluwarsa/invalid/tipe lain, dan redirect injeksi. Token diambil hanya dalam memori tes.
3. Tanpa cookie dan cookie palsu/expired tidak memberi data staf. Sesi dengan refresh sah diperbarui; refresh invalid menuju login. Cookie/cache headers dipertahankan pada jalur refresh dan redirect.
4. Fixture dua LP3H: staf aktif A hanya melihat membership/identitas miliknya; staf B terisolasi; tanpa membership/nonaktif mendapat akses terbatas. Nonaktifkan membership di antara dua request dan buktikan akses berikutnya ditolak meskipun JWT belum expired.
5. Logout hanya POST, cookie/session browser hilang, halaman terlindungi berikutnya ditolak. Jangan menerapkan guard aktif-membership pada logout sehingga akun nonaktif tetap bisa keluar.
6. Dua client pengguna tidak saling menerima cookie/identitas. Satu pengguna dengan beberapa membership aktif mendapatkan daftar miliknya tanpa pemilihan tenant diam-diam.
7. Seluruh 109 assertion SQL F01 dan skenario concurrency tetap lulus; regresi draf/demo tetap lulus. Jalankan `npm run check`, `npm run build`, serta pemeriksaan skill yang relevan. Bukti visual/perangkat hanya dilaporkan bila benar-benar diuji; UI02 tetap terbuka.

F02 selesai hanya ketika bukti sesi/login/akses lokal lengkap, error handling teruji, provisioning/template terdokumentasi, dan check/build lulus. Cloud Auth/configuration/email dilaporkan terpisah sesuai tindakan yang benar-benar dilakukan. Keberadaan rute staf tidak menyelesaikan integrasi F03–F08.

## Penerapan F01 ke cloud yang sudah diizinkan

1. Setelah login ulang, cocokkan project ref dari `.env.local` dengan project yang dapat diakses CLI. Jangan memilih project lain berdasarkan kemiripan nama. Konfirmasikan metadata target development dan versi Postgres.
2. Gunakan operasi baca-saja untuk memeriksa schema public/private, grants, dan riwayat migrasi. Jika terdapat schema/riwayat yang bentrok atau data/objek tak terduga, investigasi sebelum perubahan; jangan reset, drop, repair history, atau mengadopsi schema diam-diam.
3. Link target yang cocok dan lakukan dry run CLI 3.2.0. Daftar pending harus sesuai empat migrasi F01. Jangan memasukkan seed, fixture Auth, role global, atau vault/config changes yang tidak diperlukan.
4. Terapkan migrasi yang sudah diuji secara lokal, kemudian periksa kembali riwayat, enam tabel/RLS/grants, RPC/search_path, schema private, dan penolakan anonymous lewat API. Jangan membuat akun uji di cloud untuk menggantikan bukti lokal.
5. Regenerasi/komparasi tipe jika target schema aktual berbeda; bedakan bukti struktural cloud dari tes multi-user lokal. Catat target yang cocok tanpa kredensial dan hasil aktual pada status/handoff. Tanpa akses administratif yang cocok, penerapan tetap pending dan tidak diklaim selesai.

## Keputusan implementer yang boleh ditentukan

Nama file internal, helper kecil, susunan komponen tanpa perubahan visual arah desain, port server tes yang bebas, dan detail fixture boleh ditentukan implementer. Jangan mengganti metode login, memilih tenant otomatis, memperluas role, atau menghubungkan layar bisnis tanpa keputusan baru. Gunakan branch saat ini dengan perubahan F01 tetap dipertahankan; commit/push hanya atas instruksi pengguna.

## Referensi yang sudah diperiksa

- Dokumentasi Next terpasang: `node_modules/next/dist/docs/01-app/02-guides/authentication.md` (guard dekat sumber data, batas layout/proxy, verifikasi setiap Server Action) dan `03-api-reference/04-functions/cookies.md` (API async dan batas penulisan cookie).
- [Passwordless email dan `shouldCreateUser`](https://supabase.com/docs/guides/auth/auth-email-passwordless).
- [Supabase SSR, verifikasi JWT, dan cache headers](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs&router=app).
- CLI terpasang: `link --help`, `db push --help`, dan `db query --help`; `db query --read-only` untuk pemeriksaan hosted, `db push --remote --dry-run` sebelum perubahan.

## Bukti dan penyesuaian implementasi

Hasil akhir dan batas verifikasi ada di [STAFF_AUTH.md](../../STAFF_AUTH.md) dan [PROJECT_STATUS.md](../../PROJECT_STATUS.md). Tidak ada perubahan schema untuk fitur Auth; satu migrasi lanjutan F01 (005) mengganti kode konflik menjadi PT409/HTTP 409 setelah PostgREST 14 mengulang SQLSTATE 40001 sampai timeout. Aturan akses/versi/audit tetap sama.

Cloud menerima lima migrasi dan verifikasi struktur/anonymous; origin/redirect/signup Auth dibaca ulang. API menolak template email khusus pada free/default provider, sehingga SMTP khusus diperlukan sebelum email cloud menggunakan callback ini. Tidak ada undangan, akun atau email nyata dibuat. APP_URL non-secret ditambahkan jika belum ada, tanpa mengganti key/URL pengguna.
