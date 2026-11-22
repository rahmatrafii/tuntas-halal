# Verifikasi penerapan F04 ke cloud development

Tanggal: 21 November 2026. Pengguna mengizinkan penerapan F04 setelah implementasi dan pengujian lokal selesai.

## Target dan perubahan

- Project `tuntas-halal-dev`, reference `czxfkwztljspzjjpqmgp`, status `ACTIVE_HEALTHY`, region Singapore (`ap-southeast-1`), cocok dengan URL `.env.local` dan akun CLI administratif.
- Label `production` pada CLI mengacu cabang utama Supabase di project tersebut, bukan perubahan target aplikasi menjadi lingkungan produksi.
- Preflight menunjukkan migrasi 001–005, RPC instruction-only belum ada, RLS aktif dan enam tabel bisnis kosong.
- Dry run hanya memilih `20261121000600_task_instruction.sql`; seed dan role kosong. Push memakai target eksplisit serta `--skip-vault`, tanpa reset, seed, role atau perubahan Auth.
- Migrasi menambah `update_task_instruction(uuid,uuid,integer,text)`. Status/tanggal tidak menjadi argumen dan tidak ditulis oleh fungsi. Fondasi lock/receipt/version/audit F01 tetap digunakan.

## Bukti sesudah penerapan

| Pemeriksaan cloud | Hasil |
|---|---|
| Riwayat migrasi | 001–006 tercatat |
| Fungsi tersedia | Ya |
| Body fungsi | Hash body `pg_proc.prosrc` cocok persis dengan migrasi repository |
| SECURITY DEFINER | Aktif |
| search_path | Kosong, sesuai migrasi |
| EXECUTE authenticated | Diizinkan |
| EXECUTE anon/PUBLIC | Ditolak |
| INSERT/UPDATE/DELETE tabel tugas oleh authenticated | Tidak diizinkan |
| RLS enam tabel bisnis | Tetap aktif |
| Guard audit immutable | `O`, tetap aktif |
| Helper konflik versi | Tetap `PT409` |
| REST RPC anonymous | HTTP 401, kode `42501` |
| Dry run terakhir | Up to date; tidak ada migrasi, seed atau role tertunda |
| Organisasi/membership/kontak/kasus/tugas/audit | Tetap nol seperti baseline |

Verifikasi menggunakan katalog SQL baca-saja dan satu permintaan RPC anonymous yang ditolak. Tidak ada akun Auth, membership, fixture bisnis, email, WhatsApp, deployment aplikasi, commit atau push. Kredensial tidak dicatat; `.env.local` dipertahankan.

## Batas bukti dan tindak lanjut

Penerapan dan pembatasan struktural/API anonymous sudah terbukti pada cloud. Alur bisnis F04 dengan sesi staf cloud belum diuji pada sesi ini karena tidak membuat fixture baru; bukti create/update/retry/konflik/multi-user tetap berasal dari suite lokal pada [status project](PROJECT_STATUS.md). Jangan menyamakan penerapan migrasi dengan uji browser atau kesiapan pilot.

Kode aplikasi dan migrasi repository tidak diubah pada sesi operasional ini; `npm run check` dan `npm run build` tidak diulang. Hasil 74 tes aplikasi, 128 SQL/concurrency, HTTP F03/F04/Auth dan build berasal dari sesi implementasi F04 sebelumnya. Uji browser/HP UI02 tetap terbuka. Fitur berikutnya F05 memerlukan rancangan tersendiri; tidak dimulai pada sesi penerapan ini.
