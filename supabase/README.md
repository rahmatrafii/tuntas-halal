# Backend Supabase

Direktori ini disiapkan untuk migrasi yang akan dibuat pada F01. **Belum ada schema, seed, atau RLS yang diterapkan.** Lihat `docs/DATA_MODEL.md` dan `docs/SUPABASE.md`.

Simpan migrasi pada `supabase/migrations/<timestamp>_<nama>.sql` setelah CLI diinisialisasi. Setiap migrasi bisnis wajib memiliki constraint, RLS, dan tes isolasi akses. Seed hanya data fiktif. Generate tipe dari schema aktual setelah validasi.
