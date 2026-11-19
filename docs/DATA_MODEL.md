# Model data dan akses — rancangan untuk implementasi

**Belum berupa schema yang diterapkan.** Tabel dan kebijakan berikut perlu diterjemahkan menjadi migrasi SQL pada task F01, lalu diuji. Tidak ada database bisnis yang dibuat pada tahap setup.

Pada fase frontend, `src/features/demo/model.ts` hanya menyimulasikan subset model ini untuk satu LP3H fiktif. Store browser tidak mewakili tabel, RLS, keanggotaan lintas lembaga, atau audit produksi. Rancangan berikut tetap menjadi target backend.

## Entitas

| Tabel               | Kolom utama                                                                                          | Constraint penting                                                         |
| ------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| `organizations`     | `id`, `name`, `timezone`, `created_at`                                                               | Zona IANA valid, awal `Asia/Jakarta`                                       |
| `memberships`       | `organization_id`, `user_id`, `role`, `is_active`                                                    | PK gabungan; FK ke Auth; role `companion`/`coordinator`                    |
| `business_contacts` | `id`, `organization_id`, `owner_id`, `business_name`, `whatsapp_number`, `greeting_name`, timestamps | Nama dan nomor wajib; nomor disimpan ternormalisasi; owner anggota lembaga |
| `cases`             | `id`, `organization_id`, `contact_id`, `assignee_id`, `official_reference`, `version`, timestamps    | Kontak dan pendamping aktif dari lembaga yang sama; versi positif          |
| `revision_tasks`    | `id`, `case_id`, `instruction`, `status`, `follow_up_on`, `version`, timestamps                      | Instruksi trim tidak kosong; empat status; `follow_up_on date` nullable    |
| `audit_events`      | `id`, `case_id`, `task_id`, `actor_id`, `event_type`, `before`, `after`, `created_at`                | Append-only; payload terbatas status/penanggung jawab, bukan isi pesan     |

`created_at`/`updated_at` memakai `timestamptz` dari database. Tindak lanjut memakai tanggal kalender `YYYY-MM-DD`, tidak memakai timestamp tengah malam UTC. `owner_id` dan `assignee_id` merujuk membership dengan lembaga yang sama melalui constraint atau transaksi tervalidasi.

Satu kontak → banyak kasus → banyak tugas. Kasus tuntas adalah nilai turunan: minimal satu tugas dan seluruh tugas selesai. Jangan simpan boolean tuntas yang dapat berbeda dari tugasnya.

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

## Mutasi atomik

- `create_case`/`create_task`: client UUID yang stabil + constraint unik; retry harus memverifikasi payload sama, bukan menganggap setiap duplicate sebagai sukses.
- `update_task`: cocokkan expected version; lock/update bersyarat; validasi perpindahan; tambah versi; tulis audit dalam transaksi yang sama.
- Pengiriman gabungan: hanya ID tugas dari satu kasus; periksa seluruh akses/versi; konfirmasi eksplisit; mutasi/audit batch atomik atau laporkan konflik yang jelas tanpa sukses sebagian tersembunyi.
- `transfer_case`: koordinator aktif dan target pendamping aktif di lembaga sama; cocokkan versi; ubah assignee dan audit atomik.
- Jangan mengandalkan audit insert dari browser setelah status diubah. Jangan mengizinkan client menulis/menghapus audit.
- Jika memakai `SECURITY DEFINER`, tetapkan `search_path` aman, schema-qualify objek, verifikasi `auth.uid()` dan membership di dalam fungsi, batasi EXECUTE; jangan membuka bypass RLS.

## Gerbang sebelum schema dianggap selesai

Uji dengan dua LP3H, masing-masing pendamping/koordinator, anggota nonaktif, dan anonymous. Uji baca, create, update, RPC, transfer, serta kegagalan lintas lembaga. Dua sesi bersamaan harus membuktikan satu versi usang ditolak. Hak akses bukan sekadar filter UI.
