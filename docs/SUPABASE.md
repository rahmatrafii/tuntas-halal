# Setup Supabase

## Kondisi awal

F01 tersedia pada Supabase lokal dan cloud development: lima migrasi, enam tabel bisnis public, helper/receipt private, RLS, delapan RPC, dan tipe generated. F02 menyediakan login/sesi staf. F03 menghubungkan kontak/kasus di `/staf/lembaga/[organizationId]` ke client pengguna/RLS dan empat RPC tanpa migrasi baru. Route bisnis lama tetap demo. Pengujian implementasi F03 memakai lokal; pengguna kemudian mengizinkan satu skenario operasional bisnis cloud yang lulus dan fixture-nya sudah dibersihkan. Lihat [STAFF_CASELOAD.md](STAFF_CASELOAD.md) dan [laporan cloud/browser](F03_CLOUD_VERIFICATION.md).

Project cloud development `tuntas-halal-dev` cocok dengan `.env.local` dan diverifikasi melalui CLI administratif setelah pengguna login ulang. Lima migrasi diterapkan tanpa seed/akun uji/reset cloud; riwayat, enam tabel RLS, grants, delapan RPC/search_path, private receipts, dan penolakan anonymous lewat API lulus. Postgres cloud 17.12 sesuai major lokal 17. Plugin tidak dipakai; akses administratif memakai sesi CLI yang sah.

Cloud Auth memakai Site URL localhost port 3000, allowlist callback localhost/127.0.0.1, signup nonaktif dan anonymous nonaktif. Mailtrap Sandbox port 2525/STARTTLS dan template/subjek login/undangan sudah diterapkan serta dibaca ulang. Email login masuk Mailtrap menurut konfirmasi pengguna. F02C selesai untuk development: callback, cookie/identitas, reload/refresh, token satu kali, akses terbatas tanpa membership dan logout lulus melalui HTTP aplikasi localhost + Auth cloud. Uji sesi memakai token Admin API tanpa email tambahan; akun sementara dihapus/readback dan tidak ada data bisnis ditulis. Aplikasi belum dihosting. API mengembalikan hash password: jangan gunakan nilai GET untuk autentikasi SMTP atau menulisnya kembali. Lihat [STAFF_AUTH.md](STAFF_AUTH.md).

URL/publishable key cloud pada `.env.local` dipertahankan; hanya `APP_URL=http://localhost:3000` ditambahkan bila belum ada. Script database lokal tidak memuat file tersebut. Key stack lokal hanya lewat memori proses, tidak ditampilkan atau ditulis sebagai konfigurasi frontend.

## Menghubungkan backend development

1. Buat/pilih project Supabase development dengan akun milik tim.
2. Salin `.env.example` ke `.env.local`. Isi URL project dan **publishable key** dari dashboard. Jangan membagikan isi file environment.
3. Pada Authentication, nonaktifkan pendaftaran publik untuk aplikasi undangan. Atur Site URL development ke `http://localhost:3000`.
4. Route/template F02 tersedia di repository; SMTP sandbox dan template hosted sudah terpasang. Ikuti batas pengujian di `STAFF_AUTH.md` sebelum penggunaan email cloud. Undangan admin harus memakai redirect lengkap ke `/auth/confirm`.
5. Migrasi F01 telah diverifikasi pada target development. Query bisnis tetap menggunakan identitas pengguna dan RLS; schema Auth tidak menggantikan membership/role aplikasi. F04 revisi diuji lokal; migrasi 006 instruction-only sudah diterapkan ke cloud development dan [diverifikasi](F04_CLOUD_VERIFICATION.md) secara struktural/API anonymous. Draf/status/antrean/transfer UI tetap F05–F08.

Publishable key boleh masuk browser karena akses data dijaga RLS. Kunci administratif tidak diperlukan untuk frontend dummy dan tidak disediakan sebagai konfigurasi publik. Tambahkan secret server-only hanya ketika alur undangan administratif benar-benar dibuat.

## Menjalankan dan memeriksa fondasi lokal

Prasyarat: Node 24, dependency npm terpasang, Docker Desktop engine Linux aktif. CLI resmi `supabase@3.2.0` dipin di `package.json` dan lockfile.

```powershell
npm run db:start
npm run db:reset
npm run db:test
npm run db:auth:test
npm run db:types
npm run check
npm run build
```

Stack `sihalal-f01` memakai API `http://127.0.0.1:55321`, Postgres port `55322`, dan Mailpit lokal `55324`. Hanya schema public diekspos; grants otomatis tabel baru, signup publik dan login anonim nonaktif. Studio, storage, realtime, analytics, dan edge runtime tidak dijalankan. Mailpit menangkap email fiktif lokal tanpa pengiriman eksternal.

- `db:start` memulai layanan minimum tanpa mencetak key.
- `db:reset` membangun ulang database lokal dari migrasi dan menghapus data lokal sebelumnya. Seed otomatis dinonaktifkan; fixture dibuat oleh tes.
- `db:test` menjalankan lima file pgTAP (128 assertion setelah F04) lalu satu skenario integrasi Auth/concurrency. Akun fiktif dikonfirmasi secara administratif di Auth lokal tanpa email.
- `db:auth:test` menjalankan Next terisolasi pada port 3150 dan `.next-auth-test`, kemudian menguji form native, Mailpit, undangan/login, cookie/refresh, guard membership dan logout. Port yang terpakai ditolak dan child exit menggagalkan readiness. Raw log server serta secret tidak dicetak.
- `db:types` menghasilkan `src/lib/supabase/database.types.ts` dari public schema aktual. Jangan menyunting file ini secara manual.

Reset/test/types memverifikasi endpoint loopback sebelum berjalan. Jangan menyalin output `supabase status` mentah ke log karena dapat memuat key. Gunakan wrapper npm di atas untuk pekerjaan lokal. Detail skenario ada di [TESTING.md](TESTING.md).

## Migrasi dan target cloud development

Tambahkan file baru di `supabase/migrations`; jangan mengubah migrasi yang sudah diterapkan. Ulangi reset, tes, dan generate tipe setelah perubahan schema. Lima migrasi mencakup schema/akses, RPC, grants validator administratif, lock/whitespace, dan `PT409` untuk konflik versi. Kode `40001` bisnis membuat PostgREST 14 mengulang request sampai timeout; migrasi 005 memakai HTTP 409 yang final.

Untuk perubahan cloud berikutnya, cocokkan lagi target, versi dan riwayat. Tinjau dry run sebelum push, tanpa reset/fixture akun uji, lalu verifikasi RLS/grants target itu. Publishable key bukan kredensial migrasi. Tes multi-user lokal dan verifikasi struktur cloud memiliki batas berbeda; jangan menyalin fixture lokal ke cloud.

## SSR

- `src/lib/supabase/client.ts`: client browser bertipe database generated.
- `src/lib/supabase/server.ts`: client server dengan cookie request dan tipe database generated.
- `src/lib/supabase/proxy.ts`: refresh lewat `getClaims()` dan salin cookie/cache headers.
- `src/proxy.ts`: matcher, melewati refresh ketika environment belum diisi.

Server Action/route tetap harus memverifikasi identitas dan membership sendiri; proxy bukan satu-satunya lapisan pengamanan. Semua query bisnis harus memakai schema dengan RLS.

Referensi: [server-side client](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs), [migrasi](https://supabase.com/docs/guides/deployment/database-migrations), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [CLI](https://supabase.com/docs/reference/cli/introduction).
