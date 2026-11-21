# Strategi pengujian

## Pemeriksaan yang tersedia

```powershell
npm run lint
npm run typecheck
npm test
npm run check
npm run build
```

Unit test memakai Node test runner melalui `tsx`, tanpa service eksternal. Fokus: pengelompokan tanggal/status, zona waktu, status tuntas, normalisasi nomor, encoding pesan, dan batas kasus dalam draf. Tes helper bukan bukti bahwa UI, RLS, atau workflow bisnis sudah berjalan.

## Tes frontend dummy

`tests/demo.test.ts` menguji pencarian/antrean, balasan sebagian, versi usang, pengalihan kasus tanpa membuka kasus kontak lain, batas koordinator, dan sesi kosong. `tests/frontend.test.tsx` memakai Testing Library + jsdom untuk pencarian/filter, validasi/duplikasi kontak, double save revisi, draf/pengiriman terpisah, persistensi pesan, nomor invalid, gagal simpan/retry, serta login undangan simulasi.

Regresi reload draf diuji melalui pembukaan ulang tautan tugas di `tests/frontend.test.tsx` dan modul store baru di `tests/draft-reload.test.tsx`. Tes kedua menyiapkan draf hanya di localStorage sebelum layar pertama dirender, lalu memeriksa pesan, pilihan revisi, dan tidak adanya mutasi data. Keduanya gagal sebelum perbaikan prioritas draf tersimpan atas parameter `?pilih=...`; ini bukti DOM/store, bukan reload pada browser nyata.

`tests/dom-setup.ts` menyediakan DOM virtual. Native dialog dimock untuk menguji alur komponen; fokus modal, scrolling, safe area, tata letak, dan screenshot bukan bukti dari tes ini. jsdom belum mengenali elemen semantik `<search>` dan dapat menampilkan peringatan React khusus environment tes.

Kontrak frontend yang diimplementasikan: localStorage disimpan sebelum state dipublikasikan, state versi usang ditolak, pengiriman hanya mengubah tugas terpilih, draft tidak mengubah instruksi. Semua ini tetap simulasi browser, belum transaksi/audit/RLS database.

## Acceptance matrix sebelum pilot

| PRD    | Skenario yang harus diverifikasi                                                                                                                                                                               |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MVP-01 | Urutan empat kelompok; tugas due tidak muncul dua kali; completed hanya saat difilter; pencarian nama dan nomor; empty/no-results; layar HP                                                                    |
| MVP-02 | Nama/nomor wajib; normalisasi 08/+62/62; reuse kontak; nomor sama beda usaha dengan konfirmasi; tidak membocorkan kontak staf lain                                                                             |
| MVP-03 | Whitespace ditolak dekat field; instruksi sah tersimpan; status awal perlu dikirim; beberapa tugas dalam kasus                                                                                                 |
| MVP-04 | Preview penerima; pilih beberapa tugas satu kasus; edit draf tidak ubah instruksi; chat terbuka tidak ubah status; nomor invalid tetap bisa salin; draf tersedia saat kembali                                  |
| MVP-05 | Due hari ini/lewat hanya status menunggu; tanggal mendatang; balasan sebagian; kurang → kirim ulang; koreksi status salah; selesai setelah pembaruan resmi                                                     |
| MVP-06 | Anonymous ditolak; staf nonaktif ditolak; dua LP3H terisolasi; pendamping hanya assignee; koordinator lihat satu lembaga; transfer lintas LP3H ditolak; akses lama hilang dan kasus kontak lain tetap tertutup |
| MVP-07 | Jaringan putus mempertahankan input; double tap satu tugas; retry setelah response hilang; versi usang ditolak; audit dan status rollback bersama jika salah satu gagal                                        |

## Fixture akses yang perlu dibuat di F01

Lembaga A: pendamping A1/A2, koordinator AK, satu anggota nonaktif; lembaga B: pendamping B1 dan koordinator BK. Satu kontak A1 dipakai dua kasus, hanya satu dialihkan ke A2. A2 harus bisa melihat kontak kasus pindahan tanpa membaca kasus lain. Gunakan data fiktif dan environment pengujian.

## Pemeriksaan manual UI

- Chrome/Edge desktop dan Chrome Android/Safari iOS yang dipakai peserta; WhatsApp Web dan aplikasi HP.
- 375px, tablet, desktop, zoom 200%, navigasi keyboard, focus, teks panjang, reduced motion.
- Tanggal pergantian hari di zona LP3H; browser dengan zona berbeda tidak boleh mengubah kelompok antrean.
- Salin teks berisi `&`, `+`, `?`, newline, dan aksara Indonesia; nomor invalid tidak membuka chat.
- Kembali dari WhatsApp; status belum dikonfirmasi tidak berubah, input/draf tidak hilang.

Tambahkan Playwright/tes integrasi database saat fitur pertama membutuhkan bukti end-to-end. Jangan menambah suite kosong yang hanya memeriksa markup halaman setup.

Kontrol browser pada sesi frontend dihentikan karena alat tidak dapat memastikan URL Chrome. Review visual 375px/390px/768px/1440px, zoom 200%, keyboard HP, native modal, dan perangkat nyata tetap belum diuji. Jangan mencoba melewati pembatasan kontrol browser; lanjutkan UI02 saat sarana yang sah tersedia.
