# Arsitektur

## Batas sistem

**Implementasi saat ini adalah demo frontend.** `src/features/demo/store.ts` menyimpan state contoh di browser; route tidak memanggil database bisnis, mengirim email, atau membuka WhatsApp nyata. Arsitektur server di bawah adalah target fase berikutnya.

Browser pendamping/koordinator → Next.js → Supabase Auth + Postgres dengan RLS. Browser membuka `wa.me` dengan draf; aplikasi tidak mengetahui apakah pesan benar-benar terkirim atau sudah dibalas. SIHALAL berada di luar sistem.

## Struktur awal

```text
src/
  app/                 route App Router, layout, loading/error, stylesheet referensi
  features/demo/       model/seed, logika murni, store browser, komponen dan layar demo
  lib/
    env.ts             konfigurasi publik Supabase dan validasi saat digunakan
    domain/            status, tanggal lokal LP3H, validasi nomor dan draf WhatsApp
    supabase/          client browser, server, serta pembaruan cookie sesi
  proxy.ts             refresh sesi ketika Supabase dikonfigurasi
tests/                 unit domain/logika demo + interaksi DOM melalui jsdom
supabase/              panduan migrasi dan backend (belum ada schema bisnis)
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

Proxy fondasi hanya refresh sesi; **belum ada autentikasi atau halaman terlindungi di server**. Halaman login dan pesan akses terbatas sekarang tersedia sebagai simulasi browser. Jangan menganggapnya implementasi otorisasi.

## Rute frontend

| Rute                                           | Tujuan                                                          | Status  |
| ---------------------------------------------- | --------------------------------------------------------------- | ------- |
| `/`                                            | Antrean, pencarian, filter status/pendamping                    | Demo    |
| `/login`                                       | Masuk staf undangan dan tautan email simulasi                   | Demo    |
| `/auth/confirm`                                | Verifikasi token undangan/login sesuai template Auth            | Backlog |
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
- Tipe database harus dihasilkan dari schema aktual; belum ada tipe database buatan yang berpura-pura generated.
- Hari lokal dihitung menggunakan `Intl.DateTimeFormat` dengan zona LP3H. Default rancangan pilot: `Asia/Jakarta`.

Referensi: [Next.js App Router](https://nextjs.org/docs/app), [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client?queryGroups=framework&framework=nextjs), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
