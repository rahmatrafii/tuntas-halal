# Fixture manual pengujian HP F05

Tanggal: 21 November 2026. Status: **aktif, dipertahankan untuk pengguna**. Pengguna secara eksplisit meminta pembuatan akun dan kasus uji sesudah F05C dibersihkan.

## Identitas fixture

- Target: cloud development `tuntas-halal-dev`, cocok `.env.local` dan API project.
- Run: `d979baca-9065-45fd-adb5-c4dbaee82f58`.
- Email fiktif: `f05-hp-d979baca@example.com`. Login tanpa password memakai tautan yang ditangkap Mailtrap Sandbox.
- LP3H: `F05 HP TEST A d979baca-9065-45fd-adb5-c4dbaee82f58`.
- Peran: companion/pendamping, membership aktif.
- Usaha: **Usaha Uji HP F05**; nomor pengajuan: **UJI-HP-F05**.
- Satu kontak milik pendamping dan satu kasus yang ditugaskan kepadanya. Dua revisi awal berstatus Perlu dikirim.
- Nomor kontak adalah contoh. Pengguna perlu menggantinya langsung di aplikasi dengan nomor pengujian yang dikendalikan sendiri sebelum membuka WhatsApp. Jangan menulis nomor pribadi itu ke repository/log/chat.

Readback menggunakan sesi Auth akun uji dengan client pengguna/RLS membuktikan membership aktif, kepemilikan kontak, penugasan kasus dan dua tugas awal. Token verifikasi internal dibuat tanpa email; tidak dicetak atau disimpan oleh runner. Belum ada permintaan email login, pesan WhatsApp atau uji HP yang dinyatakan selesai.

## Langkah pengguna

1. Pertahankan USB/port forwarding `3000 → localhost:3000` dan server aplikasi.
2. Buka Chrome HP biasa di `http://localhost:3000/staf/login`, isi email fiktif di atas, tekan **Kirim tautan masuk**.
3. Buka Mailtrap → Email Sandbox → My Sandbox di HP, pilih email tujuan tersebut, lalu buka tautan masuk di Chrome HP. Jangan membagikan tautan/token ke chat. Inbox email sebenarnya tidak digunakan.
4. Di `/staf`, pilih **Kasus usaha** pada LP3H uji, lalu **Usaha Uji HP F05 / UJI-HP-F05**.
5. **Lihat kontak → Ubah kontak**, ganti nomor contoh dengan nomor WhatsApp uji milik pengguna sendiri, lalu simpan. Tidak perlu mengubah nama usaha/sapaan.
6. Kembali ke kasus → **Draf WhatsApp**. Uji sunting/pilih/reload, salin-tempel ke Catatan, lalu buka WhatsApp tanpa menekan Kirim. Kembali ke Chrome dan reload; pesan/pilihan harus bertahan, status tetap Perlu dikirim.

## Handoff dan cleanup

Fixture ini sengaja belum dihapus. Jangan menganggap baseline cloud tetap nol seperti akhir F05C, jangan reset database, dan jangan menjalankan ulang smoke test yang mensyaratkan baseline kosong selama fixture manual aktif.

Manifest: `.git/f05-hp-manifest-d979baca-9065-45fd-adb5-c4dbaee82f58.json`; SQL cleanup yang disiapkan sebelum fixture: `.git/f05-hp-cleanup-d979baca-9065-45fd-adb5-c4dbaee82f58.sql`. Keduanya diabaikan Git dan tidak berisi kredensial. Runner: `.git/f05-hp-fixture.mjs` / `.ps1`, dengan key/token hanya di memori.

Setelah pengguna menyatakan uji selesai, bersihkan hanya run ini melalui target administratif terverifikasi, lalu hapus akun Auth dan baca ulang ketidakhadirannya. Query cleanup memeriksa organisasi, metadata/email akun, hubungan owner/assignee dan dua UUID tugas; tugas baru yang tidak dikenal menyebabkan cleanup berhenti untuk peninjauan. Jangan memperluas daftar hapus secara otomatis jika pengguna menambah data.

Sebaiknya pengguna menghapus draf perangkat lewat **Hapus draf** sebelum akun/kasus dibersihkan. Perubahan nomor kontak oleh pengguna tidak dicatat di dokumen atau log. Tidak ada perubahan kode aplikasi, schema/Auth/SMTP, deploy atau push; check/build tidak diulang untuk provisioning ini. F05V/UI02 tetap menunggu hasil perangkat nyata.
