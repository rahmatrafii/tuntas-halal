# Arsitektur

## Batas sistem

**Route demo tetap terpisah; area staf menyediakan F02 dan kontak/kasus F03.** Store demo menyimpan contoh di browser, tanpa query bisnis backend atau WhatsApp nyata. Area staf memakai sesi/membership nyata; `/staf/lembaga/[organizationId]` menentukan konteks LP3H yang diverifikasi pada setiap read/action. F03 memakai client pengguna/RLS dan empat RPC F01, diuji lewat Next/Auth/database lokal. Atas izin khusus berikutnya, HTTP aplikasi localhost + Auth/database cloud juga lulus dengan fixture sementara yang sudah dibersihkan. Belum ada uji browser/perangkat, data pilot atau hosting. Lihat [STAFF_AUTH.md](STAFF_AUTH.md), [STAFF_CASELOAD.md](STAFF_CASELOAD.md), dan [laporan cloud/browser](F03_CLOUD_VERIFICATION.md).

Browser pendamping/koordinator → Next.js → Supabase Auth + Postgres dengan RLS. Browser membuka `wa.me` dengan draf; aplikasi tidak mengetahui apakah pesan benar-benar terkirim atau sudah dibalas. SIHALAL berada di luar sistem.

## Struktur awal

```text
src/
  app/                 route App Router, layout, loading/error, stylesheet referensi
  features/demo/       model/seed, logika murni, store browser, komponen dan layar demo
  features/staff/      aturan Auth, guard server, Actions, form dan shell staf
  features/caseload/   konteks LP3H, query scoped, mutasi RPC, form dan UI kontak/kasus nyata
  features/drafts/     baca/validasi ekspor server dan draf browser per akun/LP3H/kasus
  lib/
    env.ts             konfigurasi publik Supabase dan validasi saat digunakan
    domain/            status, tanggal lokal LP3H, validasi nomor dan draf WhatsApp
    supabase/          client SSR/browser bertipe generated + pembaruan cookie sesi
  proxy.ts             refresh sesi ketika Supabase dikonfigurasi
tests/                 unit domain/logika demo, guard tooling, interaksi DOM jsdom
scripts/database.mjs   start/reset/test/types lokal dengan guard endpoint
supabase/              konfigurasi CLI, migrasi SQL, pgTAP, integrasi Auth/concurrency
docs/                  spesifikasi, keputusan, backlog, handoff
.agents/skills/        salinan portable skill lokal
```

`model.ts` berisi tipe dan seed fiktif, `logic.ts` berisi filter/akses/transfer/status murni, `store.ts` menghubungkan React melalui `useSyncExternalStore`. Semua editor dimuat setelah hidrasi browser sehingga nilai tersimpan tidak terinisialisasi ulang dari seed SSR. Data lintas tab disinkronkan melalui storage event. Kegagalan localStorage tidak memajukan state seolah-olah berhasil.

Untuk fase produksi, tempatkan fitur nyata di `src/features/<fitur>` dan pindahkan query/mutasi ke server. Domain murni tidak mengimpor React, Next.js, atau SDK Supabase. Jangan menggunakan role/demo store sebagai sumber identitas produksi.

## Aliran yang dituju

1. Proxy memperbarui cookie sesi; pengamanan data tetap dilakukan di server dan RLS.
2. Server memverifikasi identitas, membaca membership aktif, dan memuat kasus/tugas yang berhak dibaca.
3. Server Action memvalidasi input dan memanggil transaksi/RPC untuk mutasi. Parameter versi mencegah lost update.
4. Database memeriksa penugasan/peran dan menulis perubahan beserta audit dalam transaksi yang sama.
5. UI menampilkan hasil resmi. Error mempertahankan input; konflik menampilkan versi terbaru sebelum perubahan selanjutnya.

Proxy refresh sesi dan mengarahkan sesi tidak sah dari `/staf` sebelum loading boundary melakukan streaming. Guard server membaca membership aktif pada setiap halaman staf; respons private/no-store dan cookie/cache headers dipertahankan pada redirect. Login/logout memakai Server Actions POST, callback memakai token email/invite dan origin tepercaya `APP_URL`. Demo `/login` tetap simulasi dan memiliki tautan berlabel menuju login staf nyata.

F01 membatasi SELECT melalui RLS dan tulisan melalui delapan RPC yang memeriksa membership, peran, LP3H, dan penugasan. Status/transfer dan audit satu transaksi; receipt retry berada di schema private dan hanya memuat hash serta hasil minimum. Lihat [model data](DATA_MODEL.md) dan [setup lokal](SUPABASE.md).

## Rute frontend

| Rute                                           | Tujuan                                                          | Status  |
| ---------------------------------------------- | --------------------------------------------------------------- | ------- |
| `/`                                            | Antrean, pencarian, filter status/pendamping                    | Demo    |
| `/login`                                       | Masuk staf undangan dan tautan email simulasi                   | Demo    |
| `/auth/confirm`                                | Verifikasi token email/invite, cookie sesi, redirect origin tepercaya | F02 lokal; callback email dengan Auth cloud lulus HTTP |
| `/staf/login`, `/staf`, `/staf/akses-terbatas` | Login nyata, identitas/membership aktif dan logout | F02 lokal dan F02C development; aplikasi localhost + Auth cloud |
| `/staf/lembaga/[organizationId]/kontak` dan turunannya | Kontak list/detail/tambah/ubah; hanya pemilik yang dapat menulis | F03, bukti HTTP database lokal |
| `/staf/lembaga/[organizationId]/kasus` dan turunannya | Pilih kontak sendiri, buat/detail/ubah nomor pengajuan; koordinator read-only | F03, bukti HTTP database lokal |
| `/staf/lembaga/[organizationId]/kasus/[caseId]/revisi/baru`, `/revisi/[taskId]/edit` | Tambah revisi dan ubah instruksi; daftar di detail kasus | F04 lokal; migrasi 006 tersedia di cloud development |
| `/staf/lembaga/[organizationId]/kasus/[caseId]/pesan` | Editor draf perangkat, revalidasi salin/buka chat; tanpa perubahan status | F05 lokal; perangkat F05V/UI02 terbuka |
| `/kasus`, `/kasus/baru`, `/kasus/[id]`, `/kasus/[id]/edit`         | Daftar, form, detail, tugas, riwayat, transfer                  | Demo    |
| `/kontak`, `/kontak/baru`, `/kontak/[id]/edit` | Kontak, duplikasi nomor, koreksi                                | Demo    |
| `/revisi/baru`, `/revisi/[id]`                 | Form revisi, status, tanggal, konfirmasi selesai                | Demo    |
| `/kasus/[id]/pesan`                            | Pilihan tugas, draf, clipboard, chat simulasi, konfirmasi kirim | Demo    |
| `/tim`, `/akun`, `/kondisi`                    | Koordinator, akun contoh/reset, pratinjau keadaan layar         | Demo    |

Perubahan URL dari client tidak boleh melewati pemeriksaan akses. Alur panel desktop dan halaman mobile harus mengarah ke data kasus yang sama.

## Keputusan teknis

- App Router dan TypeScript strict; jangan membangun API HTTP tambahan jika Server Action cukup.
- Supabase `@supabase/ssr` untuk cookie; `getClaims()` memverifikasi identitas. Jangan pakai `getSession()` sebagai bukti otorisasi.
- Jangan cache data staf lintas pengguna. Next Cache Components belum diaktifkan pada fondasi.
- F03 memisahkan simpan kontak dan kasus. Setiap form memiliki UUID resource dan seed acak; key request diturunkan dari payload ternormalisasi agar retry native/hydrated tetap sama. Konflik memakai snapshot sah dan penerapan isian eksplisit. Detail/pemilih dipaginasi, tidak menggunakan store demo atau client administratif.
- F04 memakai `create_task` dan RPC additive `update_task_instruction`; edit tidak menerima status/tanggal sehingga retry tidak menimpa keduanya. Teks textarea dinormalisasi ke LF sebelum validasi/hash, namun input gagal tetap tersedia. Parent kasus, LP3H dan tugas diperiksa melalui client pengguna/RLS. Migrasi 006 hanya diterapkan lokal pada sesi implementasi.
- F05 memakai Server Actions baca-saja untuk validasi seluruh pilihan, versi, penerima dan akses sebelum ekspor. Editor menyimpan payload minimal localStorage terpisah per akun/LP3H/kasus, memulihkan sebelum write dan menahan konflik tab. Async export diabaikan jika input berubah; fallback POST lanjutan mengunci editor sampai respons. Tidak ada schema/dependency baru atau isi pesan dalam audit; lihat [panduan draf](STAFF_DRAFTS.md).
- `src/lib/supabase/database.types.ts` dihasilkan dari schema lokal lewat `npm run db:types`; client browser/server/proxy menggunakan tipe ini.
- Hari lokal dihitung menggunakan `Intl.DateTimeFormat` dengan zona LP3H. Default rancangan pilot: `Asia/Jakarta`.

Referensi: [Next.js App Router](https://nextjs.org/docs/app), [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
