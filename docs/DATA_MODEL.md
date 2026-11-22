# Model data dan akses

**F01 tersedia pada Supabase lokal dan cloud development; F04 tersedia lokal.** Lima migrasi F01 membentuk schema, grants, RLS, dan RPC. Migrasi keenam menambah `update_task_instruction` dan sudah diterapkan ke cloud development; [verifikasi](F04_CLOUD_VERIFICATION.md). Bukti pemeriksaan ada di [status project](PROJECT_STATUS.md).

`src/features/demo/model.ts` tetap menyimulasikan subset model ini untuk satu LP3H fiktif. Area staf memakai database untuk kontak/kasus F03 dan revisi F04 lokal; store browser bukan sumber identitas atau otorisasi backend.

## Entitas

| Tabel               | Kolom utama                                                                                          | Constraint penting                                                         |
| ------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `organizations`     | `id`, `name`, `timezone`, `created_at`                                                               | Zona IANA valid, awal `Asia/Jakarta`                                       |
| `memberships`       | `organization_id`, `user_id`, `role`, `is_active`                                                    | PK gabungan; FK ke Auth; role `companion`/`coordinator`                    |
| `business_contacts` | `id`, `organization_id`, `owner_id`, `business_name`, `whatsapp_number`, `greeting_name`, `version`, timestamps | Nama dan nomor wajib; nomor disimpan ternormalisasi; owner pendamping aktif |
| `cases`             | `id`, `organization_id`, `contact_id`, `assignee_id`, `official_reference`, `version`, timestamps    | Kontak dan pendamping aktif dari lembaga yang sama; versi positif          |
| `revision_tasks`    | `id`, `case_id`, `instruction`, `status`, `follow_up_on`, `version`, timestamps                      | Instruksi trim tidak kosong; empat status; `follow_up_on date` nullable    |
| `audit_events`      | `id`, `case_id`, `task_id`, `actor_id`, `event_type`, `before`, `after`, `created_at`                | Append-only; payload terbatas status/penanggung jawab, bukan isi pesan     |

`created_at`/`updated_at` memakai `timestamptz` dari database. Tindak lanjut memakai tanggal kalender `YYYY-MM-DD` tahun 0001–9999, tidak memakai timestamp tengah malam UTC. `owner_id` dan `assignee_id` merujuk membership dengan lembaga yang sama melalui constraint dan trigger validasi. Trim teks mengenali whitespace JavaScript, termasuk tab, newline, dan whitespace Unicode. Instruksi dan nama yang hanya berisi whitespace ditolak.

Satu kontak → banyak kasus → banyak tugas. Kasus tuntas adalah nilai turunan melalui `case_is_complete(uuid)`: minimal satu tugas dan seluruh tugas selesai, dengan akses mengikuti RLS.

Schema `private` tidak diekspos oleh Data API. `private.mutation_requests` memakai PK `(actor_id, request_id)`, nama operasi, hash payload, hasil ID/versi minimum, dan waktu kejadian. Tabel ini menyimpan bukti retry tanpa isi instruksi atau pesan. Client dan `service_role` tidak mendapat grants langsung ke tabel ini.

## Duplikasi kontak

Indeks non-unik `(organization_id, owner_id, whatsapp_number)` mendukung pencarian duplikat. Jangan unique-kan nomor: nomor sama dapat dipakai beberapa usaha setelah konfirmasi pengguna. Konfirmasi dijaga di alur pembuatan server; tidak membocorkan hasil pencarian kontak pendamping lain.

## Matriks akses minimum

Semua aturan mensyaratkan membership aktif. Anonymous tidak dapat membaca atau mengubah data bisnis.

| Objek               | Pendamping                                                            | Koordinator                                     |
| ------------------- | --------------------------------------------------------------------- | ----------------------------------------------- |
| Lembaga/membership  | Lembaga sendiri; informasi staf minimum yang dibutuhkan               | Staf lembaga sendiri                            |
| Kontak              | Kontak miliknya + kontak yang dirujuk kasus yang ditugaskan kepadanya | Kontak yang diperlukan untuk kasus lembaganya   |
| Kasus/tugas         | Baca/buat/ubah kasus tanggung jawabnya                                | Baca semua di lembaga; alihkan penanggung jawab |
| Riwayat             | Kasus yang masih dapat diakses                                        | Kasus di lembaga sendiri                        |
| Undangan/membership | Tidak dapat menaikkan role atau mengaktifkan diri                     | Provisioning lewat server/admin yang terkontrol |

PRD tidak memberi koordinator hak mengedit instruksi/status. Jangan memberikan hak tulis generik kepada koordinator. Multi-role dapat ditambahkan hanya jika diputuskan secara eksplisit.

Transfer tidak memindah kepemilikan semua kontak. Pendamping lama kehilangan akses kasus/tugas/audit yang dialihkan, tetapi boleh tetap melihat kontak miliknya dan kasus lain yang masih ditugaskan. Pendamping baru hanya mendapat akses ke kontak kasus tersebut; akses kontak tidak boleh dijadikan dasar untuk membaca seluruh kasus yang memakai kontak itu.

## Mutasi atomik yang tersedia

- `create_case`/`create_task`: client UUID yang stabil + constraint unik; retry harus memverifikasi payload sama, bukan menganggap setiap duplicate sebagai sukses.
- `update_task`: cocokkan expected version; lock/update bersyarat; validasi perpindahan; tambah versi; tulis audit dalam transaksi yang sama.
- Pengiriman gabungan: hanya ID tugas dari satu kasus; periksa seluruh akses/versi; konfirmasi eksplisit; mutasi/audit batch atomik atau laporkan konflik yang jelas tanpa sukses sebagian tersembunyi.
- `transfer_case`: koordinator aktif dan target pendamping aktif di lembaga sama; cocokkan versi; ubah assignee dan audit atomik.
- Jangan mengandalkan audit insert dari browser setelah status diubah. Jangan mengizinkan client menulis/menghapus audit.
- Jika memakai `SECURITY DEFINER`, tetapkan `search_path` aman, schema-qualify objek, verifikasi `auth.uid()` dan membership di dalam fungsi, batasi EXECUTE; jangan membuka bypass RLS.

Delapan RPC: `create_contact`, `update_contact`, `create_case`, `update_case`, `create_task`, `update_task`, `set_task_statuses`, dan `transfer_case`. Signature lengkap ada di [rencana F01](superpowers/plans/2026-11-21-f01-foundation.md). Semua menerima `p_request_id`; update/transfer menerima expected version. Nilai owner/actor diturunkan dari sesi, dan LP3H dari payload tetap diperiksa terhadap membership.

F04 menambah RPC kesembilan secara lokal: `update_task_instruction(uuid,uuid,integer,text)`, dengan argumen request ID, task ID, expected version dan instruction. Mengunci kasus/tugas dan akses terkini, memeriksa receipt sebelum versi, lalu UPDATE hanya instruction. Status/tanggal/case ID tidak menjadi argumen. Trigger versi/audit tetap berlaku, tanpa isi instruksi dalam audit. Receipt hanya hash payload dan ID/versi. Anonymous/public tidak diberi EXECUTE.

Autorisasi saat ini diperiksa sebelum hasil retry diambil; hasil retry yang cocok diambil sebelum pemeriksaan versi. Karena itu respons hilang dapat diulang tanpa mutasi ganda, tetapi akses yang telah dicabut tidak dipulihkan lewat receipt lama. Payload berbeda dengan request ID sama ditolak. SQLSTATE: `42501` untuk akses, `PT409` (HTTP 409) untuk versi usang, `22023` untuk input atau konflik payload. Migrasi 005 mengganti kode bisnis `40001` karena PostgREST 14 mengulangnya sebagai serialization failure; konflik bisnis tidak boleh memicu retry server terus-menerus.

Mutasi tugas dan transfer mengunci kasus induk lebih dahulu. Create/update kontak memakai urutan advisory lock pemilik/LP3H sebelum row lock agar pemeriksaan nomor ganda dan retry tidak deadlock. Batch memeriksa seluruh tugas/versi sebelum menulis.

Perpindahan manual ke empat status tetap tersedia. Perpindahan baru ke `completed` memerlukan `p_completion_confirmed=true`; koreksi status menghasilkan audit baru. RPC tidak memverifikasi SIHALAL. Audit signed-in memakai `auth.uid()`; operasi provisioning administratif boleh memiliki actor null. Audit hanya menyimpan status, tanggal tindak lanjut, penanggung jawab, dan versi, tanpa salinan instruksi/pesan.

Role `authenticated` hanya mendapat SELECT yang dibatasi RLS dan EXECUTE RPC tertentu; tidak ada grants tulis tabel bisnis. `anon` ditolak. `service_role` adalah jalur provisioning administratif, bukan identitas untuk query bisnis aplikasi; audit tetap tidak dapat ditulis langsung melalui grants API.

## Bukti F01 dan batasnya

Reset lokal dari seluruh migrasi, 109 assertion pgTAP, dan satu skenario integrasi Auth nyata lulus. Fixture mencakup dua LP3H, pendamping/koordinator, anggota nonaktif, dan anonymous. Dua sesi membuktikan konflik versi, retry, rollback batch, transfer, dan regresi deadlock. Tipe TypeScript dihasilkan dari schema aktual. Lihat [pengujian](TESTING.md).

Cloud development menerima lima migrasi dan verifikasi grants/RLS/RPC/anonymous. F02/F02C mempunyai bukti login/sesi lokal serta Mailtrap/callback cloud dengan akun sementara yang sudah dihapus. F03 memakai schema/RPC yang sama untuk [kontak dan kasus staf](STAFF_CASELOAD.md), awalnya dibuktikan melalui fixture lokal. Pengguna kemudian mengizinkan verifikasi bisnis cloud: skenario native HTTP lulus dan seluruh fixture/audit/receipt dihapus/readback; guard audit dan RLS aktif kembali. Tidak ada perubahan schema permanen. Lihat [laporan cloud/browser](F03_CLOUD_VERIFICATION.md). F04–F09 tetap mencakup integrasi revisi dan gerbang pilot.
