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

## Hasil uji Android — 22 November 2026

Pengguna melaporkan tujuh pemeriksaan berikut berhasil melalui Chrome Android dengan aplikasi localhost dan fixture cloud development ini. Bukti berasal dari laporan pengguna, bukan pengamatan langsung agent.

| Pemeriksaan | Hasil pengguna |
|---|---|
| Isi draf setelah reload | Tetap |
| Pilihan dua revisi setelah reload | Tetap |
| Salin pesan dan tempel ke Catatan | Berhasil |
| Penerima saat membuka WhatsApp | Benar |
| Isi pesan di kotak pengetikan WhatsApp | Lengkap |
| Draf setelah kembali dari WhatsApp dan reload | Tetap |
| Status kedua revisi | Masih Perlu dikirim |

Skenario dasar HP lulus menurut laporan tersebut. Tidak ada konfirmasi pengiriman pesan; alur uji meminta pengguna tidak menekan Kirim. Nomor pribadi tidak dicatat. Pesan panjang, karakter khusus/emoji, clipboard laptop dan audit visual UI02 belum dibuktikan oleh laporan ini, sehingga cakupan F05V keseluruhan tetap terbuka. Fixture tetap dipertahankan; cleanup belum dijalankan.

## Uji tambahan dan temuan emoji laptop — 22 November 2026

Pengguna melaporkan karakter khusus/emoji sama di Catatan dan WhatsApp HP, draf tetap setelah reload, pesan panjang terisi lengkap saat Buka WhatsApp tanpa pemberitahuan, dan draf panjang bertahan. Pesan tersebut belum memicu batas tautan 8.000 karakter terenkode; fallback pesan terlalu panjang belum dibuktikan pada perangkat.

Pada laptop, emoji di draf dan hasil Salin–Tempel langsung ke WhatsApp benar, tetapi Buka WhatsApp menghasilkan U+FFFD pada halaman perantara, WhatsApp desktop dan Web. Screenshot pengguna membuktikan gejala tersebut; nomor pribadi tidak disalin ke dokumen ini.

Probe HTTP dengan nomor fiktif dan teks Unicode mereproduksi redirect `wa.me` → `api.whatsapp.com` yang sudah mengganti emoji dengan U+FFFD. Permintaan langsung ke endpoint API mempertahankan parameter Unicode pada tautan lanjutan Web. Pembuat tautan bersama kini langsung memakai `https://api.whatsapp.com/send?phone=...&text=...`; fallback chat tanpa teks tetap sama. Tes regresi domain diamati gagal sebelum perubahan lalu lulus; service test tetap memeriksa penerima server dan isi pesan. Uji ulang tombol Buka WhatsApp di laptop dan HP masih diperlukan; hasil HTTP bukan bukti aplikasi WhatsApp desktop sudah lulus.

Validasi perubahan: `npm run check` lulus lint/TypeScript/93 tes setelah satu percobaan tersendat pada worker tes form staf; tes staf sendiri dan pengulangan check penuh lulus. `npm run build` lulus. Probe HTTP terhadap URL dari helper yang diperbaiki memberi API HTTP 200, pesan keluar identik, dan parameter teks pada tautan lanjutan Web identik. Tidak ada pengiriman pesan, cleanup fixture atau uji UI langsung oleh agent.

## Konfirmasi uji ulang setelah perbaikan

Pada 22 November 2026, pengguna menyatakan “sudah berhasil” setelah diminta menguji ulang Buka WhatsApp di laptop. Temuan emoji laptop dinyatakan teratasi menurut konfirmasi pengguna; tidak ada rincian hasil desktop/Web terpisah atau uji ulang Android setelah perubahan. Fallback pesan yang melewati batas tautan 8.000 karakter terenkode dan review visual UI02 tetap terbuka. Fixture tetap dipertahankan.

## Pengujian otomatis fallback pesan panjang — 22 November 2026

Atas permintaan pengguna, dua tes tambahan menjalankan service nyata dengan client Supabase bertransport fixture lokal dan editor DOM/jsdom:

- URL terenkode tepat 8.000 karakter masih memuat teks identik; 8.001 karakter mengembalikan `longUrl: true` dan URL chat tanpa parameter teks.
- Pesan panjang dengan emoji, tanda khusus dan baris baru memicu pemberitahuan terlalu panjang serta form Lanjut ke WhatsApp. Salin pesan menyerahkan teks lengkap identik ke stub clipboard. Setelah editor dilepas/dibuat ulang dengan localStorage yang sama, pesan dan pilihan tetap pulih.
- Tidak ada request tulis melalui client fixture; status revisi tetap needs_sending. Ini bukan pengujian clipboard OS, navigasi WhatsApp nyata, atau halaman browser nyata.

Suite terarah service/editor: 17/17 tes lulus. `npm run check` lulus lint, TypeScript dan 95/95 tes; `npm run build` lulus. Tidak ada perubahan kode aplikasi untuk pengujian ini, tidak ada fixture cloud tambahan, pengiriman pesan atau cleanup. Fallback di perangkat nyata tetap perlu konfirmasi pengguna; hasil otomatis tidak menutup F05V/UI02 seluruhnya.

## Uji Android langsung melalui scrcpy — 22 November 2026

Pengguna menyediakan jendela mirroring interaktif. Agent mengendalikan HP nyata lewat CUA/scrcpy, dengan sesi fixture yang sudah aktif; port USB 3000 dipasang kembali saat belum tersedia. Tidak meminta email login baru.

- Pesan uji panjang berisi 180 paragraf, emoji, tanda khusus, serta penanda AWAL/AKHIR memicu fallback di HP. Penyalinan ke clipboard HP dan Lanjut ke WhatsApp membuka chat tanpa teks otomatis. Tempel langsung dengan Ctrl+V menampilkan penanda awal/akhir dan emoji; tidak memakai `paste(text)` untuk langkah pembuktian clipboard tersebut. Tidak dilakukan perbandingan byte clipboard HP, sehingga klaim kelengkapan visual dibatasi penanda awal/akhir.
- Ditemukan bug nyata: Salin pesan menghapus tombol Lanjut ke WhatsApp. Regresi ditambah, diamati gagal, lalu diperbaiki dengan mempertahankan continuation hanya selama copy valid. Invalid/transport/akses/input berubah tetap membuang link. Uji ulang HP berhasil: lanjut tetap tersedia dan chat terbuka.
- Kembali ke Chrome dan reload memulihkan draf panjang. Pesan kemudian dikembalikan ke paragraf contoh pendek dengan emoji; Buka WhatsApp langsung mengisi pesan pendek dan emoji utuh di HP. Isian uji WhatsApp dikosongkan, tidak menekan Kirim. Riwayat chat lama milik pengguna tidak diperiksa/disalin ke repo.
- Kedua revisi terlihat tetap Perlu dikirim. Form ubah instruksi kosong ditolak server dengan error dan fokus textarea/keyboard; form dibatalkan tanpa menyimpan. Kontak/kasus tidak dimutasi. Fixture tetap aktif.

F05V Android kini memiliki bukti langsung untuk jalur pendek/panjang, keyboard, clipboard, kembali/reload dan status. Check akhir lint/TypeScript/96 tes dan build lulus; regresi continuation RED→GREEN serta validasi invalid/transport dipertahankan. Dukungan lintas OS/perangkat bukan otomatis terverifikasi. UI02 visual menyeluruh tetap terpisah.

## Handoff dan cleanup

Fixture ini sengaja belum dihapus. Jangan menganggap baseline cloud tetap nol seperti akhir F05C, jangan reset database, dan jangan menjalankan ulang smoke test yang mensyaratkan baseline kosong selama fixture manual aktif.

Manifest: `.git/f05-hp-manifest-d979baca-9065-45fd-adb5-c4dbaee82f58.json`; SQL cleanup yang disiapkan sebelum fixture: `.git/f05-hp-cleanup-d979baca-9065-45fd-adb5-c4dbaee82f58.sql`. Keduanya diabaikan Git dan tidak berisi kredensial. Runner: `.git/f05-hp-fixture.mjs` / `.ps1`, dengan key/token hanya di memori.

Setelah pengguna menyatakan uji selesai, bersihkan hanya run ini melalui target administratif terverifikasi, lalu hapus akun Auth dan baca ulang ketidakhadirannya. Query cleanup memeriksa organisasi, metadata/email akun, hubungan owner/assignee dan dua UUID tugas; tugas baru yang tidak dikenal menyebabkan cleanup berhenti untuk peninjauan. Jangan memperluas daftar hapus secara otomatis jika pengguna menambah data.

Sebaiknya pengguna menghapus draf perangkat lewat **Hapus draf** sebelum akun/kasus dibersihkan. Perubahan nomor kontak oleh pengguna tidak dicatat di dokumen atau log. Tidak ada perubahan kode aplikasi, schema/Auth/SMTP, deploy atau push; check/build tidak diulang untuk provisioning ini. F05V/UI02 tetap menunggu hasil perangkat nyata.
