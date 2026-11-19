# Sistem desain referensi mobile

Sumber visual: `public/image.png`, referensi dua layar aplikasi tracking dari pengguna. Sistem ini menggantikan palet hijau halaman fondasi. PRD tetap menentukan perilaku produk.

## Arah yang dipilih

**Monokrom lembut, card membulat, tindakan hitam.** Adaptasi aplikasi kerja/CRM untuk pendamping: kepadatan sedang, netral, bahasa percakapan yang sopan, gerakan minimal, ornamen hanya struktural, kontras tinggi pada tindakan. Kekhawatiran utama pengguna adalah tugas terlewat. Layout desktop tetap efisien, tanpa memaksakan bingkai telepon pada layar besar.

Referensi dipakai untuk bentuk card, pill, header avatar, pencarian, progress tugas, timeline, dan navigasi mengambang. Tidak menyalin status bar OS palsu, data pengiriman, foto orang, atau watermark ke produk. Font asli tidak disertakan; Arial/system sans dipilih sebagai pendekatan sans yang rapat dan mudah dibaca pada referensi.

## Token utama

| Peran                  | Nilai                 |
| ---------------------- | --------------------- |
| Kanvas aplikasi        | `#ffffff`             |
| Latar desktop          | `#ededed`             |
| Card                   | `#f5f5f5`             |
| Panel lembut           | `#f0f2f8`             |
| Teks/aksi utama        | `#080808` / putih     |
| Teks sekunder          | `#66666d`             |
| Status menunggu        | `#e8f1ff` / `#245c9e` |
| Perlu dicek/selesai    | `#e8f7ee` / `#226644` |
| Perlu dikirim/hari ini | `#fff1df` / `#8b5012` |
| Error                  | `#fff0ef` / `#a9322b` |

Radius: input 16px, tombol utama 18px atau pill, card 26px, panel besar 30px, avatar/pill 999px. Spacing basis 4px; gutter HP 20px, card 20px, jarak bagian 28px. Border digunakan pada input dan pemisah informasi, tidak mengelilingi semua card.

## Pola antarmuka

- HP: satu kolom; header avatar, kartu hitam ringkasan tindakan, pencarian pill, status filter, daftar card, navigasi bawah mengambang.
- Card revisi: usaha dan status, instruksi utuh, tanggal/rujukan, progres kasus, satu aksi utama berdasarkan status.
- Detail: tombol kembali, identitas kasus, progress, aksi WhatsApp hitam, panel informasi berlapis putih dalam tint lembut, tugas dan timeline.
- Form: satu kolom, label eksplisit, kontrol minimal 48px dan font 16px; tindakan simpan jelas. Tidak membuang isian saat gagal.
- Konfirmasi/pengalihan: native dialog sebagai bottom sheet pada HP; Escape dan tombol tutup tersedia.
- Navigasi empat tujuan: Beranda, Kasus, Kontak, Akun (Tim untuk koordinator lewat konteks halaman dan akun).
- Ruang bawah memperhitungkan safe area dan tinggi navigasi; konten tidak tertutup pill.

## Cakupan demo

Data fiktif dengan tanggal acuan 19 November 2026, zona Asia/Jakarta. Login, akses, transfer, status, audit, dan penyimpanan hanya simulasi browser. Demo memisahkan buka chat dari konfirmasi pengiriman dan memperbarui tugas terpilih saja. Persistensi localStorage tidak boleh dianggap backend atau keamanan produksi.

## Pemeriksaan desain

Periksa 375px, 390px, tablet, desktop, 200% zoom, label panjang, keyboard, reduced motion, form error, dan konten kosong. Kesesuaian referensi dinilai dari komposisi dan komponen; tidak mengklaim pixel-identical tanpa font/aset asli dan pengukuran browser.
