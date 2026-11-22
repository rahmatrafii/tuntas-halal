# Login dan sesi staf — F02

## Yang tersedia

`/staf/login` adalah login email undangan nyata; `/staf` menampilkan sesi dan keanggotaan aktif; `/staf/akses-terbatas` menjelaskan akun tanpa membership aktif. `/auth/confirm` menerima token bertipe email/invite. Logout memakai Server Action POST dan mengakhiri sesi perangkat ini.

Route demo `/login`, `/akun`, kontak, kasus, dan revisi tetap memakai data fiktif. Area staf dilepas dari shell/store demo; akun nyata tidak dianggap Nadia atau anggota LP3H contoh. Tidak ada pemilihan LP3H otomatis: membership aktif ditampilkan dengan tautan eksplisit ke kontak/kasus LP3H tersebut. Integrasi F03 dijelaskan di [STAFF_CASELOAD.md](STAFF_CASELOAD.md).

Identitas berasal dari JWT yang diverifikasi `getClaims()`, lalu membership aktif dibaca memakai client pengguna dan RLS pada setiap request. Token/role dari localStorage atau user metadata tidak memberi akses. Proxy memperbarui cookie dan melakukan redirect awal untuk sesi tidak sah; halaman dan operasi data tetap memakai guard server. Respons Auth bersifat private/no-store/no-referrer.

## Konfigurasi aplikasi

`APP_URL` harus origin tepercaya, tanpa path, query, atau kredensial. HTTP hanya boleh untuk loopback development; hosting memakai HTTPS. Contoh development:

```dotenv
APP_URL=http://localhost:3000
```

Pada sesi implementasi, nilai non-secret ini ditambahkan ke `.env.local` bila belum ada. URL/publishable key Supabase yang sudah diisi pengguna tetap dipertahankan. `.env.local` tetap dikecualikan dari Git.

## Status cloud development

Project `tuntas-halal-dev` telah menerima lima migrasi F01. RLS/grants/RPC dan penolakan anonymous diverifikasi secara baca-saja dan lewat API. Site URL `http://localhost:3000`, allowlist callback localhost/127.0.0.1 port 3000, signup nonaktif, dan login anonim nonaktif sudah dikonfigurasi serta dibaca ulang. Pengguna memasang Mailtrap Sandbox dan menyimpan ulang kredensialnya; port terakhir 2525/STARTTLS. Rate limit tidak diubah.

**F02C selesai untuk development: penerimaan Mailtrap dikonfirmasi pengguna dan callback/sesi dengan Auth cloud lulus lewat HTTP.** Setelah pengguna mengaktifkan Mailtrap Sandbox, isi/subjek undangan dan Magic Link berhasil dipasang dan dibaca ulang, cocok dengan repository. Koneksi STARTTLS dengan validasi sertifikat berhasil pada port 2525.

Probe AUTH sebelumnya keliru memakai `smtp_pass` dari GET konfigurasi Supabase. API mengembalikan hash, bukan password asli, sebagaimana dijelaskan [dokumentasi resmi Supabase](https://supabase.com/docs/guides/deployment/terraform/reference). Karena itu hasil `535` probe tersebut bukan bukti kredensial pengguna salah. Jangan mengulangi probe atau menyalin nilai GET kembali ke field password.

Pengguna secara eksplisit mengizinkan satu uji login ke `f02-smoke-20261121@example.com` yang hanya ditangkap Mailtrap, dengan akun sementara tanpa membership dan penghapusan setelah uji. Permintaan `signInWithOtp` melalui Supabase berhasil; pengguna mengonfirmasi email berjudul “Tautan masuk TuntasHalal” masuk ke sandbox. Akun sementara sudah dihapus dan GET admin memastikan akun tidak ditemukan. Penerimaan inbox dibuktikan lewat konfirmasi pengguna; alat browser dihentikan karena tidak dapat memastikan URL Chrome. Jangan klik tautan tes lama: akunnya sudah dihapus.

Pengguna kemudian meminta agent melaksanakan uji callback/sesi. Satu akun sementara tanpa membership dibuat pada target development yang diverifikasi; `admin.generateLink` menghasilkan token Magic Link tanpa mengirim email tambahan. Tautan dirender dari template repository menggunakan redirect yang diterima allowlist cloud, lalu dipanggil melalui HTTP aplikasi yang berjalan di `http://localhost:3000`. Sebanyak 23 pemeriksaan alur lulus: penolakan anonymous, callback 303 dan cookie/privacy headers, identitas yang diverifikasi Auth cloud, akses terbatas tanpa membership, reload dengan cookie yang disalin, penolakan token bekas, refresh provider yang benar-benar merotasi token, native POST logout, penghapusan cookie, dan penolakan akses setelah logout. Refresh dipicu metadata expiry cookie; tidak menunggu expiry JWT asli.

Akun tes sesi sudah dihapus dan GET admin memastikan akun tidak ditemukan. Tidak ada membership/data bisnis atau undangan staf dibuat. Token/cookie hanya berada di memori; helper operasional berada di Git metadata yang tidak dikomit, suite `npm run db:*` tetap khusus lokal. Bukti SMTP dan callback berasal dari dua pengujian terpisah, bukan klik browser pada email yang sama. Ini membuktikan gerbang development F02C, bukan layout/browser nyata, callback di hosting, email live atau akun dengan membership aktif di cloud. Fixture/pengiriman tambahan tetap memerlukan instruksi pengguna.

Template yang dipasang berasal dari [magic-link.html](../supabase/templates/magic-link.html) dan [invite.html](../supabase/templates/invite.html). File `content_path` lokal tidak otomatis memasang isi hosted; pemasangan memakai patch administratif terbatas yang mempertahankan host, username/password, pengirim, origin, akses/signup dan rate limit. Port sempat diubah dari 465 ke 587 oleh agent, kemudian pengguna menyimpan 2525. Jangan push seluruh konfigurasi stack lokal ke cloud.

Pengujian pengiriman nyata hanya dilakukan atas instruksi yang menyebut penerima yang diizinkan. Deliverability, domain pengirim, DNS, dan log provider belum diverifikasi oleh tes lokal.

## Development tanpa domain — usulan SMTP sandbox

Pengguna belum memiliki domain dan telah memasang Mailtrap **Email Sandbox** untuk development. Sandbox menangkap email dan tidak memerlukan verifikasi domain. Kredensial berasal dari akun pengguna dan disimpan langsung di Supabase; nilainya tidak dicatat di repository/log.

1. Buat akun Mailtrap, buka **Email Sandbox / Sandboxes**, lalu pilih sandbox dan tab **Integration → SMTP**. Gunakan konfigurasi manual SMTP; integrasi otomatis Mailtrap–Supabase saat ini ditujukan untuk Live Sending, bukan sandbox.
2. Di Supabase development buka **Authentication → Email → SMTP Settings**, aktifkan Custom SMTP, lalu salin host, port, username dan password dari tab sandbox. Jangan memakai kredensial Live Sending atau mengirim password lewat chat.
3. Nama pengirim dapat berupa `TuntasHalal Dev`; gunakan alamat fiktif khusus tes, misalnya `no-reply@example.test`. Semua email harus masuk inbox sandbox, tidak ke staf nyata.
4. Isi/subjek kedua template Auth sudah dipasang dan dibaca ulang setelah SMTP sandbox aktif. Bila konfigurasi diubah lagi, verifikasi target dan template tanpa membaca/memakai hash password sebagai kredensial.
5. Uji development hanya setelah pengujian cloud dan fixture yang diperlukan secara eksplisit disetujui. Ini tidak membuktikan delivery ke inbox nyata. Untuk produksi/pilot, tetap siapkan domain/provider live yang disetujui.

Mailpit lokal sudah tersedia dan tetap menjadi tempat seluruh tes otomatis. Referensi: [Mailtrap Email Sandbox](https://docs.mailtrap.io/email-sandbox/overview), [SMTP sandbox manual](https://docs.mailtrap.io/email-sandbox/setup/sandbox-smtp-integration).

## Pengiriman nyata kemudian — usulan Resend

Resend merupakan usulan untuk pengiriman nyata ketika domain sudah tersedia, karena menyediakan dokumentasi integrasi Supabase. Provider live belum dipilih atau didaftarkan otomatis.

1. Siapkan akun Resend dan domain yang Anda kuasai. Untuk email Auth dapat memakai subdomain khusus, misalnya `auth.example.com` (contoh, bukan domain project).
2. Tambahkan domain/subdomain di Resend dan ikuti record DNS yang ditampilkan dashboard sampai status verified. Nilai SPF/DKIM berasal dari dashboard, bukan contoh statis dokumen ini.
3. Buat API key untuk pengiriman email. Simpan langsung sebagai password SMTP di dashboard Supabase; tidak perlu menambahkan SDK Resend atau key ke frontend/.env publik.
4. Pada project development Supabase, buka Authentication → Email → SMTP Settings, aktifkan Custom SMTP, lalu isi host `smtp.resend.com`, port `465`, username `resend`, password API key, nama pengirim `TuntasHalal`, dan alamat pengirim dari domain terverifikasi.
5. Sesudah SMTP aktif, pasang dan baca ulang kedua template repository, lalu lakukan uji kirim hanya kepada penerima yang secara eksplisit disetujui. F02C baru selesai setelah email diterima dan callback/session berfungsi pada target cloud.

Referensi resmi: [SMTP Supabase](https://supabase.com/docs/guides/auth/auth-smtp), [Resend + Supabase](https://resend.com/docs/send-with-supabase-smtp), [domain terverifikasi](https://resend.com/docs/dashboard/domains/introduction).

## Provisioning administratif

F02 mendokumentasikan jalur admin, tanpa menambahkan dashboard staf atau hak admin kepada koordinator aplikasi. Operator yang memiliki akses administratif melakukan langkah berikut setelah SMTP/template siap:

1. Verifikasi project development dan LP3H tujuan. Ambil ID organisasi yang benar melalui alat admin; jangan menerima ID/role dari form publik.
2. Undang email yang secara eksplisit disetujui pengguna melalui Admin API dengan `redirectTo` **lengkap ke `/auth/confirm`**, sesuai `APP_URL` dan allowlist. Template menggunakan `.RedirectTo`; jangan membiarkannya jatuh ke halaman root demo.
3. Dari `data.user.id` hasil undangan yang berhasil, buat membership pada organisasi yang benar dengan role `companion` atau `coordinator` dan `is_active=true`. Periksa error setiap tahap.
4. Jika membership gagal dibuat, akun Auth/undangan tidak memberikan akses bisnis. Perbaiki provisioning; pengguna dapat meminta tautan login baru setelah membership siap. Jangan melaporkan provisioning selesai hanya karena email terkirim.
5. Nonaktifkan membership untuk mencabut akses LP3H; guard membaca perubahan pada request berikutnya. Jangan mengandalkan logout atau perubahan metadata untuk mencabut hak database.

Potongan operasi admin berikut hanya referensi untuk proses server/alat admin yang tepercaya, bukan kode browser atau perintah yang dijalankan otomatis:

```typescript
const { data, error } = await admin.auth.admin.inviteUserByEmail(emailYangDisetujui, {
  redirectTo: `${appOrigin}/auth/confirm`,
});
if (error) throw new Error("Undangan belum berhasil dibuat.");
const membership = await admin.from("memberships").insert({
  organization_id: organisasiTerverifikasi,
  user_id: data.user.id,
  role: peranYangDisetujui,
  is_active: true,
});
if (membership.error) throw new Error("Undangan ada, tetapi membership belum siap.");
```

Secret admin hanya di proses admin/server yang sesuai; jangan gunakan `NEXT_PUBLIC_*`, repo, log, atau chat untuk secret. Tidak ada akun staf nyata yang diprovision pada sesi ini.

Konfigurasi Next development mengabaikan log request `/auth/confirm` dan mematikan log argumen Server Functions untuk melindungi token callback/isian. Log reverse proxy, hosting, dan provider email perlu konfigurasi tersendiri sebelum pilot.

## Pengujian lokal

```powershell
npm run db:start
npm run db:reset
npm run db:auth:test
npm run db:test
npm run db:types
npm run check
npm run build
```

Mailpit lokal port 55324 menangkap email fiktif tanpa pengiriman eksternal. Suite Auth menjalankan Next sendiri di `127.0.0.1:3150` dan `.next-auth-test`, memakai env proses lokal. Port yang sudah terpakai ditolak; readiness menunggu child milik tes dan gagal bila child keluar. Output Next dan token dari email ditahan di memori, dan assertion credential hanya mencetak boolean saat gagal.

Satu skenario HTTP membuktikan undangan/Magic Link, token satu kali/kedaluwarsa/invalid, cookie, refresh provider dan kegagalannya, logout, isolasi dua pengguna/LP3H, beberapa membership, serta pencabutan akses antara request. Refresh dipicu dengan metadata expiry cookie yang dibuat usang; provider benar-benar merotasi refresh token. Tes ini tidak mengklaim menunggu kedaluwarsa JWT asli selama satu jam.

Hasil sesi F02: 40 tes aplikasi, 109 assertion SQL, skenario concurrency API, dan skenario HTTP/Auth lulus; build produksi lulus. Tiga tes harness menguji redaksi credential, port terpakai, dan child exit. Dua temuan review direproduksi gagal sebelum perbaikan. Bukti terbaru F03 dan F02C dicatat terpisah di [status project](PROJECT_STATUS.md); UI02 dan integrasi F04–F08 tetap terbuka.

Logout menghapus sesi browser ini. JWT yang telah disalin dapat berlaku sampai expiry; untuk pencabutan akses LP3H, nonaktifkan membership. Kontak/kasus sudah dihubungkan melalui F03; pengelolaan tugas belum tersedia.
