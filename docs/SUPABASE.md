# Setup Supabase

## Kondisi awal

SDK browser/server dan proxy refresh sesi tersedia. Belum ada project Supabase yang dihubungkan, schema bisnis, RLS, atau alur undangan. Seluruh frontend dummy tetap berjalan tanpa environment; login dan WhatsApp masih simulasi.

## Menghubungkan backend development

1. Buat/pilih project Supabase development dengan akun milik tim.
2. Salin `.env.example` ke `.env.local`. Isi URL project dan **publishable key** dari dashboard. Jangan membagikan isi file environment.
3. Pada Authentication, nonaktifkan pendaftaran publik untuk aplikasi undangan. Atur Site URL development ke `http://localhost:3000`.
4. Implementasikan route konfirmasi/login dan template undangan pada F02 sebelum mengirim undangan. Tambahkan redirect URL yang tepat setelah route tersedia.
5. Implementasikan dan uji migrasi F01 sebelum menghubungkan fitur ke data nyata. Schema Auth tidak menggantikan membership/role aplikasi.

Publishable key boleh masuk browser karena akses data dijaga RLS. Kunci administratif tidak diperlukan untuk frontend dummy dan tidak disediakan sebagai konfigurasi publik. Tambahkan secret server-only hanya ketika alur undangan administratif benar-benar dibuat.

## Workflow migrasi yang dituju

CLI Supabase belum dipasang sebagai dependency project. Bila dibutuhkan, gunakan CLI resmi melalui `npx supabase` dan catat versi yang dipakai. Lokal penuh memerlukan Docker; alternatif development adalah project Supabase terpisah.

```powershell
npx supabase init
npx supabase start
npx supabase migration new initial_schema
```

Setelah schema tersedia, uji reset pada environment lokal disposable dan generate tipe:

```powershell
npx supabase gen types typescript --local | Out-File -Encoding utf8 src/lib/supabase/database.types.ts
```

Jangan menjalankan reset pada database berisi data pengguna. Untuk remote, link project development yang benar dan tinjau migrasi sebelum `db push`. Jangan menggunakan credential admin sebagai jalan pintas melewati RLS.

## SSR

- `src/lib/supabase/client.ts`: client browser.
- `src/lib/supabase/server.ts`: client server dengan cookie request.
- `src/lib/supabase/proxy.ts`: refresh lewat `getClaims()` dan salin cookie/cache headers.
- `src/proxy.ts`: matcher, melewati refresh ketika environment belum diisi.

Server Action/route tetap harus memverifikasi identitas dan membership sendiri; proxy bukan satu-satunya lapisan pengamanan. Semua query bisnis harus memakai schema dengan RLS.

Referensi: [server-side client](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs), [migrasi](https://supabase.com/docs/guides/deployment/database-migrations), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [CLI](https://supabase.com/docs/reference/cli/introduction).
