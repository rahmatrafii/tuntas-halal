# F04 — Tambah dan ubah instruksi revisi staf

Tanggal: 21 November 2026. Status: disetujui pengguna; implementasi dan verifikasi lokal dicatat pada rencana F04. Migrasi cloud kemudian diterapkan dan diverifikasi; lihat ../../F04_CLOUD_VERIFICATION.md.

## Tujuan dan batas

Melanjutkan F03: pendamping yang ditugaskan pada kasus dapat membaca, menambah, dan mengubah instruksi tugas revisi melalui database. Satu kasus mendukung banyak tugas, dengan status awal `needs_sending` (Perlu dikirim). Tugas kosong ditolak. Kasus tanpa tugas belum tuntas.

Acuan: [PRD MVP-03/MVP-07](../../PRD_Pelacak_Revisi_Halal.md), [backlog](../../BACKLOG.md), [arsitektur](../../ARCHITECTURE.md), [F03](2026-11-21-f03-contacts-cases-design.md), [sistem desain](../../DESIGN_SYSTEM.md).

F05/F06 tetap terpisah: tidak menyediakan draf WhatsApp, pengiriman, perubahan status/tanggal tindak lanjut, penyelesaian, atau undo. Tidak menambah hapus tugas, lampiran, pencarian lintas kasus, maupun riwayat instruksi. Demo lama tetap tersedia. Tidak deploy, commit/push, membuat fixture cloud, mengundang staf, mengirim email/WhatsApp, atau memakai data nyata. Pengujian memakai fixture lokal.

## Pendekatan

Pilihan implementer yang direkomendasikan: perluas area staf F03, gunakan `create_task` F01, dan tambahkan RPC `update_task_instruction` yang hanya mengubah instruksi. Server Components membaca, Server Actions menyimpan dengan client pengguna. Pertahankan pola form, UUID, retry, konflik, dan batas error F03; tanpa dependency baru. Satu migrasi tambahan dan regenerasi tipe diperlukan; migrasi yang sudah diterapkan tidak diubah.

Mengganti route demo akan menarik state browser dan alur F05–F08 ke pekerjaan ini. Alternatif memakai `update_task` memerlukan snapshot status/tanggal terikat server untuk retry, sebab keduanya ikut dalam hash receipt. Itu menambah mekanisme form dan berisiko menimpa perubahan status bila pengikatan keliru. RPC khusus instruksi memberi kontrak yang lebih kecil dan menjaga kolom lain langsung di database; tidak menambah tabel atau API HTTP. Rincian ini merupakan usulan implementer untuk ditinjau pengguna.

## Alur dan antarmuka

- Detail `/staf/lembaga/[organizationId]/kasus/[caseId]` menampilkan daftar revisi dengan instruksi utuh, status teks dan tanggal tindak lanjut yang sudah tersimpan jika ada. Daftar dipaginasi secara eksplisit, urutan stabil; jangan menyembunyikan hasil setelah halaman pertama.
- Pendamping penanggung jawab melihat **Tambah revisi**; koordinator dapat membaca tetapi tidak mendapat kontrol mutasi.
- Route tambah: `.../kasus/[caseId]/revisi/baru`. Konteks usaha/kasus ditampilkan agar pengguna tidak salah sasaran. Satu textarea **Instruksi revisi** wajib; tidak ada kolom status atau tanggal. Simpan sukses mengarah kembali ke kasus.
- Route ubah: `.../kasus/[caseId]/revisi/[taskId]/edit`. Menampilkan instruksi dan status saat ini; hanya instruksi yang dapat diubah. Simpan sukses kembali ke kasus. Tugas selesai pun boleh diperjelas tanpa membukanya kembali; tidak ada transisi status tersirat.
- Gunakan komponen/token F03 dan acuan visual yang ada: putih, card netral, tindakan hitam, badge pastel, gutter HP 20px, kontrol 48px, teks form 16px dan safe area. Tidak memperkenalkan arah visual baru.
- Error inline terhubung ke textarea dan diumumkan; fokus berpindah ke kolom gagal atau ringkasan error yang dapat difokuskan. Pending mencegah submit berulang secara lokal, tetapi keamanan duplikasi tetap di server/RPC. Tidak menampilkan sukses sebelum konfirmasi server.

## Data, validasi, dan akses

- Setiap read/mutasi memverifikasi identitas dan membership aktif pada LP3H eksplisit, lalu kasus melalui client pengguna/RLS. Task ID harus termasuk kasus pada URL. UUID pada URL/payload tidak memberikan izin.
- Pendamping hanya menulis kasus yang sedang ditugaskan kepadanya. Koordinator hanya membaca di LP3H yang sama. Transfer/pencabutan membership berlaku juga pada retry receipt lama. Kontak pindahan tidak menjadi syarat kepemilikan tugas: assignee kasus yang sah dapat membuat/mengubah revisinya.
- Instruksi di-trim mengikuti whitespace JavaScript/fondasi SQL, wajib tidak kosong. Usulan batas aplikasi: 2.000 karakter; teks berlebih ditolak, tidak dipotong diam-diam. Parser menolak field ganda/tipe selain string serta UUID/versi tidak sah. Isian gagal dipertahankan utuh pada batas payload yang wajar.
- `create_task`: ID tugas dan seed form dibuat sekali di server saat membuka form; `p_follow_up_on = null`, status awal dari database. Identitas actor/LP3H/penugasan tidak diterima dari payload sebagai otorisasi.
- RPC baru `update_task_instruction(p_request_id uuid, p_id uuid, p_expected_version integer, p_instruction text)` mengikuti F01: `private.lock_task` untuk kunci kasus/tugas dan akses terkini; trim/validasi; `private.claim_request` dengan operasi khusus dan payload ID/versi/instruksi; kembalikan receipt jika ada; `private.check_version`; lalu UPDATE hanya `instruction`, dan `private.finish_request` dengan ID/versi. Trigger versi/audit yang ada tetap berlaku. Status, tanggal dan case ID tidak menjadi argumen maupun kolom yang diubah. `SECURITY DEFINER`, search_path kosong, nama schema eksplisit dan grants EXECUTE terbatas mengikuti RPC F01; anon/public ditolak.
- Audit F01 tetap atomik dan tidak menyimpan isi instruksi/pesan. Tidak ada service-role client pada runtime fitur.

## Retry, konflik, dan kegagalan

- Gunakan pola F03: UUID tugas stabil dan request UUID deterministik dari seed acak, operasi dan payload kanonik. Retry intent yang sama memakai request ID yang sama; perubahan instruksi/versi menjadi intent baru.
- Untuk update, payload retry hanya memuat ID, expected version dan instruksi. Status/tanggal tidak dibaca ulang untuk membentuk hash intent, dan field payload client tidak boleh mengubahnya melalui fitur F04. Tidak melakukan preflight penolakan versi yang mendahului receipt RPC.
- Respons hilang setelah commit tidak boleh membuat tugas kedua atau audit/version tambahan. Receipt F01 harus tetap dapat menyelesaikan retry yang sah sebelum pemeriksaan konflik versi memblokirnya; akses terkini tetap diperiksa lebih dahulu.
- Jika ID create sudah tersimpan dengan data berbeda, tampilkan data sah tersebut untuk ditinjau, tanpa membuat ID pengganti otomatis. Instruksi sama bukan deduplikasi global: dua intent tugas baru memang boleh memiliki teks sama.
- Konflik menampilkan instruksi/status/tanggal/versi terbaru yang masih boleh dibaca, sambil mempertahankan instruksi pengguna. **Terapkan isian saya ke versi terbaru** adalah tindakan eksplisit yang memakai versi baru dan mempertahankan status/tanggal terbaru itu. Keputusan peninjauan dan intent efektif tetap bertahan jika retry berikutnya gagal.
- Validasi, provider failure, native POST dan transport hydrated tidak menghilangkan input. Saat akses hilang, jangan membocorkan snapshot baru; tampilkan penolakan. Error layanan tidak ditampilkan sebagai daftar kosong.

## Verifikasi dan definisi selesai

Implementasi bertahap: migrasi RPC/tes SQL/tipe → queries/akses → mutasi dan intent → route/form → pengujian terintegrasi dan dokumentasi. Baca panduan Next versi terpasang dan modern-web-guidance sebelum menulis kode terkait; ikuti TDD untuk perilaku domain/akses. Migrasi diterapkan dan diuji lokal; penerapan migrasi cloud merupakan tahap terpisah setelah hasil lokal siap ditinjau, tanpa fixture cloud baru.

- Unit/service: instruksi kosong/whitespace/panjang, UUID/versi/field ganda; create/update, stable retry, response lost, konflik, preservasi status/tanggal termasuk completed; task milik kasus/LP3H lain, koordinator, transfer dan pencabutan.
- DOM: input/error/fokus/pending, ketukan ganda, transport gagal, konflik eksplisit, intent setelah konflik yang diikuti gagal simpan; gunakan pola pengujian F03.
- HTTP Next/Auth/DB lokal: tambah beberapa tugas, readback/reload, ubah instruksi, default status, retry idempoten/audit, konflik dua sesi, cross-case/cross-tenant, peran, transfer/pencabutan dan pagination. Tidak mengirim email.
- Jalankan `npm run check`, suite HTTP terkait, `npm run db:test`, regresi Auth/caseload yang terdampak, serta `npm run build`. Perbarui status, backlog dan handoff dengan bukti aktual.
- Uji browser/HP hanya diklaim jika alat tersedia dan benar-benar dilakukan. Kendala host browser sebelumnya tidak disamarkan sebagai keberhasilan visual; UI02 tetap gerbang tersendiri.

## Diserahkan kepada implementer

Lokasi modul sederhana yang mengikuti struktur F03; reuse helper/form seperlunya tanpa membuat framework form generik. Detail pagination dan struktur tes mengikuti pola lokal. Tidak memperluas F04 ke fitur status.

## Pemeriksaan rancangan

Builder check independen menyatakan RPC tambahan khusus instruksi merupakan kontrak terkecil yang kuat untuk menjaga akses, receipt retry dan status/tanggal. Alternatif RPC lama membutuhkan pengikatan snapshot tambahan; keputusan menggunakan satu migrasi tambahan dicatat sebelum persetujuan pengguna.
