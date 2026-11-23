# Pengujian F06 di Android melalui scrcpy

Tanggal: 23 November 2026. Menggunakan Chrome Android, aplikasi localhost dan sesi fixture HP F05 yang sudah aktif. Pengguna meminta melanjutkan pengujian sebelumnya, tanpa mengulang semua langkah.

## Titik lanjut

Catatan yang diberikan pengguna menyatakan pengiriman sebagian, penolakan tanpa konfirmasi, koreksi A ke Perlu dikirim, dan pengiriman dua revisi dengan tanggal bersama telah diuji sebelumnya. Pada sesi lanjutan, layar dan riwayat mengonfirmasi kedua revisi Menunggu balasan dengan tanggal 2026-11-30. Langkah sebelumnya tidak diulang; bukti catatan pengguna dibedakan dari observasi langsung di bawah.

## Hasil observasi langsung

- A (foto label) diubah ke Perlu dicek; B (komposisi) tetap Menunggu balasan. Tanggal keduanya tetap 2026-11-30.
- Memilih Selesai tanpa checkbox pemeriksaan ditolak dengan ringkasan dan error dekat konfirmasi. Pilihan Selesai dan tanggal tetap tersedia.
- Setelah konfirmasi, A tersimpan Selesai; progres 1/2 dan kasus belum tuntas, B tetap menunggu.
- B diselesaikan dengan konfirmasi; progres menjadi 2/2 dan kasus tuntas.
- Tombol Koreksi ke Perlu dicek pada A mengisi pilihan tahap sebelumnya. Setelah disimpan, progres kembali 1/2 dan kasus belum tuntas.
- Reload melalui menu Chrome mempertahankan A Perlu dicek, B Selesai, tanggal 2026-11-30 pada keduanya, dan progres 1/2.
- Riwayat menampilkan perubahan Menunggu balasan → Perlu dicek, Perlu dicek → Selesai, Menunggu balasan → Selesai, serta Selesai → Perlu dicek, dengan pelaku Anda dan waktu lokal.

## Temuan awal — diperbaiki

Pada penyimpanan Selesai untuk A dan B, form sempat menampilkan **Koneksi terputus. Isian tetap tersedia; coba lagi.**, kemudian otomatis berpindah ke detail dengan Status revisi tersimpan. Tidak dilakukan retry pada kedua kejadian itu. Hasil tersimpan terbukti pada detail, progres, riwayat dan reload. Penyebab belum dipastikan; jangan menganggap pesan tersebut sebagai bukti gangguan jaringan nyata. Periksa alur catch Server Action/redirect pada `src/features/status/forms.tsx` dan `actions.ts` dengan reproduksi sebelum memperbaiki.

Paragraf di atas mencatat diagnosis awal. Penyebab kemudian dibuktikan: catch form menangkap sinyal redirect Next.js setelah penyimpanan berhasil dan mengubahnya menjadi pesan koneksi. `unstable_rethrow(error)` dari API Next.js terpasang kini meneruskan sinyal framework sebelum penanganan kegagalan aplikasi. Cleanup pending tetap di finally; kegagalan transport asli tetap menampilkan error dan mempertahankan input/intent retry.

## Uji ulang dan penutupan F06V — 23 November 2026

- Dua tes regresi, untuk form tunggal dan pengiriman batch, memakai redirect Next.js nyata: keduanya gagal dengan pesan koneksi sebelum perbaikan dan lulus sesudahnya. Tes transport TypeError membuktikan status/tanggal dan seluruh FormData retry tetap sama. Suite form 7/7 lulus; `npm run check` lulus lint/TypeScript/112 tes dan `npm run build` lulus seluruh route. Peringatan React/jsdom tentang elemen search lama tetap ada tanpa tes gagal. Review independen tidak menemukan masalah.
- Uji ulang Android/scrcpy pada sesi fixture aktif: A Perlu dicek → Selesai menghasilkan 2/2 dan kasus tuntas; A kemudian dikoreksi ke Perlu dicek menghasilkan 1/2 dan kasus belum tuntas. Kedua penyimpanan berpindah ke detail sukses tanpa pesan koneksi palsu pada pengamatan selama transisi. B tetap Selesai dan tanggal keduanya tetap 2026-11-30.
- Reload menu Chrome mempertahankan progres, status dan tanggal. Riwayat menampilkan dua perubahan baru dengan pelaku Anda dan waktu lokal 02.09/02.10. Tidak dilakukan retry manual pada simpan sukses.
- **F06V ditutup untuk skenario yang diuji pada Android ini.** Gangguan jaringan sungguhan, konflik dua tab, pengosongan tanggal di perangkat, perangkat lain, dan audit visual UI02 menyeluruh tidak diuji ulang; bukti otomatis/HTTP/SQL sebelumnya tetap terpisah. Penutupan ini tidak menutup UI02 atau gerbang pilot.

## Keadaan akhir dan batas tindakan

Fixture dipertahankan: A Perlu dicek, B Selesai, keduanya bertanggal 2026-11-30; kasus 1/2 selesai dan belum tuntas. Riwayat pengujian tetap ada. Jangan menganggap dua revisi masih Perlu dikirim seperti provisioning awal. Cleanup tetap mengikuti identitas dan pemeriksaan pada F05_HP_TEST.md; versi/status tugas sudah berubah melalui uji yang diminta.

Tidak mengirim pesan WhatsApp/email, membuat akun/fixture tambahan, mengubah kontak/instruksi/schema/config, melakukan cleanup, commit/push atau deploy. Sesi awal hanya menguji perangkat dan dokumentasi; sesi perbaikan berikutnya mengubah penanganan error form beserta tes regresi. Server dev serta reverse USB port 3000 dibiarkan tersedia.
