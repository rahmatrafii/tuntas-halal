# Panduan melanjutkan vibe coding

## Konteks singkat

Produk membantu pendamping menuntaskan tindak lanjut revisi, bukan mengirim WhatsApp otomatis. Unit kerja adalah tugas revisi. UI utama adalah antrean tindakan. Stack sudah dipilih; jangan menghabiskan sesi untuk memilih ulang teknologi.

Frontend dummy seluruh alur tetap tersedia. Desain mengikuti `public/image.png` dan `DESIGN_SYSTEM.md`. F01 tersedia di cloud development; F02/F02C menyediakan login/sesi, dan F03 menghubungkan kontak/kasus di area `/staf/lembaga/[organizationId]` dengan LP3H eksplisit. Alur bisnis lain tetap demo. Lihat `STAFF_CASELOAD.md` untuk backend dan `FRONTEND_DEMO.md` untuk data contoh.

Superpowers 7.0.1 sudah terpasang pada komputer dan 15 skill-nya tersedia di `.agents/skills`. Total project kini 29 skill setelah enam skill pilihan pengguna dikeluarkan dan diarsipkan di luar project; daftar pengecualian sync mencegah pemasangan ulang. Pilih skill sesuai task sebagaimana contoh di `SKILLS.md`. UI02 tetap terbuka; F05 lokal selesai, fitur berikutnya F06; F05V/perangkat tetap terbuka. Migrasi F04 cloud sudah diterapkan; uji bisnis F04 bersesi cloud belum dilakukan.

UI03 memperbaiki draf yang tampak hilang setelah reload tautan tugas: `draft-screen.tsx` kini mengutamakan draf kasus tersimpan atas `?pilih=...`. Dua tes regresi ditambahkan; check 26/26 tes dan build lulus. Host browser tidak tersedia, sehingga reload nyata masih perlu diperiksa sesuai `FRONTEND_DEMO.md`. Fase tetap frontend dummy dan UI02 tetap terbuka.

F01 lokal selesai berdasarkan [rancangan yang disetujui](superpowers/specs/2026-11-21-f01-foundation-design.md) dan [ledger implementasi](superpowers/plans/2026-11-21-f01-foundation.md): CLI 3.2.0, lima migrasi (termasuk perbaikan PT409), enam tabel public, helper/receipt private, RLS, delapan RPC, dan tipe generated. Reset lokal, 109 assertion SQL, satu skenario Auth/concurrency, check 28/28 tes, build, dan integritas 29 skill lulus. Review independen menemukan deadlock kontak dan whitespace kosong; kedua regresi diamati gagal lalu lulus setelah migrasi 004. Branch `feat/f01-foundation` dipertahankan tanpa commit/push.

Cloud `tuntas-halal-dev` sudah menerima lima migrasi; struktur RLS/grants/RPC dan penolakan anonymous terverifikasi. F02 disetujui dan diuji dengan Next/Auth/Mailpit lokal: undangan, login, cookie/refresh, guard membership dan logout. Check 40 tes, build, 109 assertion SQL, concurrency dan HTTP/Auth lulus pada sesi implementasi. Origin/redirect, Mailtrap Sandbox port 2525/STARTTLS, dan dua template cloud tersedia. Email login masuk Mailtrap menurut konfirmasi pengguna. Atas permintaan pengguna, 23 pemeriksaan HTTP aplikasi localhost dengan Auth cloud lulus untuk callback/cookie/identitas, reload/refresh, akses terbatas, token bekas, dan logout; token dibuat Admin API tanpa email baru. Seluruh akun sementara dihapus/readback, tidak ada data bisnis ditulis. F02C development selesai; jangan mengulang email/fixture tanpa cakupan izin baru. API mengembalikan hash password SMTP, jadi jangan gunakan nilai GET sebagai password atau menulisnya kembali. `.env.local` hanya ditambah APP_URL non-secret pada sesi implementasi; key/URL pengguna dipertahankan. Lihat `STAFF_AUTH.md`.

## Prompt awal yang siap dipakai

F03 disetujui dan selesai bertahap: konteks LP3H, kontak, kasus, pengujian/review. Check 62 tes, 109 SQL/concurrency, HTTP F03 dan Auth F02, serta build lulus. Review menemukan intent retry versi/duplikat dan announcement; semua diperbaiki dengan regresi RED→GREEN. Tidak ada perubahan schema/dependency atau fixture bisnis cloud. F01–F03 masih belum commit/push di branch yang sama.

Setelah implementasi, pengguna meminta uji browser dan bisnis cloud terlebih dahulu. Cloud F03 lulus lewat aplikasi localhost dengan dua LP3H/empat akun fiktif; seluruh data/audit/receipt dan akun dibersihkan/readback ke baseline nol, guard audit/RLS aktif. Browser belum diuji karena host alat tidak tersedia. Lihat `F03_CLOUD_VERIFICATION.md`; UI02 tetap terbuka dan F04 belum dimulai. Izin fixture cloud tersebut sudah selesai cakupannya, bukan izin untuk fixture/undangan berikutnya.

```text
Baca AGENTS.md, docs/PROJECT_STATUS.md, PRD, ARCHITECTURE.md,
SUPABASE.md, STAFF_AUTH.md, STAFF_CASELOAD.md, DATA_MODEL.md, dan BACKLOG.md.
Periksa git status; F01–F04 belum commit/push, jangan ditimpa.
Gunakan skill relevan secara otomatis. F02C development selesai: Mailtrap
diterima menurut pengguna, callback/sesi HTTP dengan Auth cloud lulus,
akun tes cloud sudah dihapus. F03 kontak/kasus dan F04 revisi staf selesai lokal.
Jangan mengulang fixture/email tes lama. API mengembalikan hash smtp_pass:
jangan pakai nilai GET sebagai password SMTP atau tulis kembali ke konfigurasi.
Cloud F01 sudah dimigrasikan; jangan reset atau menanam fixture tes ke sana.
F04 memakai migrasi 006 instruction-only, sudah lokal dan cloud development.
Baca F04_CLOUD_VERIFICATION.md untuk batas bukti. F05 lokal selesai, baca STAFF_DRAFTS.md. Berikutnya satu irisan F06.
Route bisnis lama tetap demo; fitur staf di /staf/lembaga/[organizationId].
Jalankan tes relevan, npm run check, npm run build, dan perbarui handoff.
```

Untuk pekerjaan UI, tambahkan:

```text
Baca docs/DESIGN.md, docs/DESIGN_SYSTEM.md, public/image.png,
dan skill ui-ux-pro-max. Pertahankan card membulat, palet monokrom,
badge pastel, dan navigasi bawah pada HP.
Jalankan modern-web-guidance sebelum HTML/CSS/client JS.
Gunakan sudut pandang senior UI/UX designer, utamakan tindakan berikutnya,
bahasa Indonesia, keyboard, dan penggunaan HP. Bedakan hasil teruji dari asumsi.
```

## Ritme sesi

1. Pilih satu task dan sebut kriteria penerimaan yang dicakup.
2. Baca implementasi terkait dan caller sebelum mengubah.
3. Bangun slice kecil sampai validasi, akses simulasi, error, dan retry bekerja.
4. Jalankan pemeriksaan sesuai `TESTING.md`; tulis hasil nyata, bukan perkiraan.
5. Perbarui `PROJECT_STATUS.md`, centang backlog hanya jika selesai.
6. Tinjau diff dan pastikan secret/data nyata tidak ikut. Commit hanya jika diminta.

Pada frontend dummy, gunakan simulasi dan tes DOM. F01 membuktikan fondasi database, F02/F02C membuktikan sesi lokal dan Auth cloud development, F03/F04 membuktikan kontak/kasus/revisi dan F05 membuktikan draf melalui server/browser lokal. F05C kemudian lulus HTTP dengan sesi cloud, termasuk F04 create/update instruksi; seluruh fixture sudah dibersihkan/readback. Lihat F05_CLOUD_VERIFICATION.md. Pengguna memilih cloud dahulu; F05V/UI02 menunggu perangkat terpandu. F06–F08 tetap terbuka.

## Format handoff

```text
Task:
Perilaku yang sudah bekerja:
File utama:
Pemeriksaan dan hasil:
Belum diuji / keterbatasan:
Keputusan baru:
Langkah berikutnya:
```

Jangan menyimpan log chat panjang sebagai dokumentasi. Simpan keputusan, kontrak, dan bukti yang diperlukan sesi berikutnya.
