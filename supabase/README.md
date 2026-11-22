# Backend Supabase

F01 diterapkan pada stack lokal `sihalal-f01` dan cloud development `tuntas-halal-dev`. Lima migrasi membentuk enam tabel bisnis public, schema private untuk helper/receipt, RLS, grants eksplisit, audit, delapan RPC, dan konflik versi HTTP 409. Cloud diverifikasi tanpa akun uji/data pilot; UI bisnis tetap dummy. F02 menyediakan area staf terpisah dengan pengujian Auth/email lokal; template hosted menunggu SMTP khusus.

Dengan Docker aktif, jalankan `npm run db:start`, `npm run db:reset`, `npm run db:test`, dan `npm run db:types` secara berurutan. Reset menghapus data lokal disposable; script menolak endpoint cloud dan tidak memuat `.env.local`. Tes SQL memakai rollback, sedangkan akun/fixture integrasi Auth lokal bertahan sampai reset.

Untuk F02 jalankan `npm run db:auth:test`: Mailpit port 55324, Next test port 3150 dan `.next-auth-test`. Semua email ditangkap lokal; port yang sudah terpakai ditolak. Lihat [panduan staf](../docs/STAFF_AUTH.md) untuk provisioning dan batas cloud.

Simpan perubahan schema sebagai migrasi baru; jangan menyunting migrasi yang sudah diterapkan. Setiap perubahan bisnis wajib memiliki constraint, batas akses, dan tes yang relevan. Tipe dihasilkan dari schema aktual setelah validasi.

Lihat [setup Supabase](../docs/SUPABASE.md), [model data](../docs/DATA_MODEL.md), dan [pengujian](../docs/TESTING.md).
