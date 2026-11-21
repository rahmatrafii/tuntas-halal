# Panduan melanjutkan vibe coding

## Konteks singkat

Produk membantu pendamping menuntaskan tindak lanjut revisi, bukan mengirim WhatsApp otomatis. Unit kerja adalah tugas revisi. UI utama adalah antrean tindakan. Stack sudah dipilih; jangan menghabiskan sesi untuk memilih ulang teknologi.

Frontend dummy seluruh alur sudah tersedia. Desain mengikuti `public/image.png` dan `DESIGN_SYSTEM.md`. Selama instruksi pengguna masih frontend dahulu, pertahankan simulasi lokal dan jangan menggantinya dengan koneksi backend otomatis. Gunakan `FRONTEND_DEMO.md` untuk mencoba alur.

Superpowers 7.0.1 sudah terpasang pada komputer dan 15 skill-nya tersedia di `.agents/skills`. Total project kini 29 skill setelah enam skill pilihan pengguna dikeluarkan dan diarsipkan di luar project; daftar pengecualian sync mencegah pemasangan ulang. Mulai chat baru untuk memperbarui daftar skill; pilih sesuai task sebagaimana contoh di `SKILLS.md`. UI02 tetap menjadi pekerjaan produk berikutnya.

UI03 memperbaiki draf yang tampak hilang setelah reload tautan tugas: `draft-screen.tsx` kini mengutamakan draf kasus tersimpan atas `?pilih=...`. Dua tes regresi ditambahkan; check 26/26 tes dan build lulus. Host browser tidak tersedia, sehingga reload nyata masih perlu diperiksa sesuai `FRONTEND_DEMO.md`. Fase tetap frontend dummy dan UI02 tetap terbuka.

## Prompt awal yang siap dipakai

```text
Baca AGENTS.md, docs/PROJECT_STATUS.md, PRD, DESIGN_SYSTEM.md,
FRONTEND_DEMO.md, dan BACKLOG.md. Periksa git status.
Gunakan skill Ponytail dari .agents/skills/ponytail/SKILL.md.
Lanjutkan UI02: review frontend mobile terhadap public/image.png.
Jika kontrol browser tersedia secara sah, periksa 375px/390px,
tablet/desktop, zoom, focus, safe area, serta native dialog.
Jangan melewati pembatasan alat dan jangan mengklaim visual teruji
jika tidak bisa diperiksa. Pertahankan data dummy; jangan deploy
atau menghubungkan backend tanpa instruksi lanjutan.
Perbarui status, backlog, serta perintah dan hasil verifikasi.
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

Pada fase frontend, gunakan validasi/interaksi dummy dan tes DOM; jangan mengklaim validasi server atau RLS selesai. Setelah pengguna meminta backend, mulai F01: migrasi, constraint, dan RLS dua LP3H, lalu F02 autentikasi. Pertahankan sistem desain referensi dan kontrak UX saat sumber data diganti.

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
