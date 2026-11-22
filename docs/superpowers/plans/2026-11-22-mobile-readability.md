# Mobile readability implementation plan

> **For agentic workers:** Use superpowers:executing-plans inline, with a fresh final review.

**Goal:** Perbaiki teks/info/modal mobile lintas alur yang sudah ada.
**Architecture:** CSS/komponen bersama, lalu koreksi copy staf. Tanpa dependency atau alur bisnis baru.
**Tech Stack:** Next.js 16, React 19, CSS, TypeScript.
**Spec:** docs/superpowers/specs/2026-11-22-mobile-readability-design.md

## Global constraints

Pertahankan DESIGN_SYSTEM, data dan akses; tidak menghapus fixture HP aktif. Tidak commit/push/deploy. Kerjakan pada branch fitur saat ini dan pertahankan perubahan sebelumnya. Browser tidak tersedia; jangan mengklaim UI02 lulus.

## Review focus

Panel konflik berisi banyak child; nama/email/referensi tanpa spasi; label panjang dan font diperbesar; modal tinggi; draf/konfirmasi tetap jelas.

### Task 1: Komponen dan CSS bersama

- [x] Verifikasi penyebab panel notice/conflict melalui computed-style terbatas jsdom.
- [x] Ubah notice default menjadi block dan variant ikon menjadi flex. Benahi pembungkusan teks, label/tombol, modal dan tipografi mobile.
- [x] Periksa computed-style sesudahnya serta tes interaksi form/draf/modal yang sudah tersedia.

### Task 2: Copy dan hierarki staf

- [x] Baca seluruh route/demo/staf; ringkas bantuan yang berulang dan koreksi informasi fitur usang, tanpa menghapus peringatan penting.
- [x] Pisahkan instruksi/badge, konteks LP3H/peran dan pesan status agar dapat dipindai.

### Task 3: Validasi dan handoff

- [x] npm run check; npm run build; pemeriksaan HTTP dan diff.
- [x] Review independen diff, tangani temuan penting, dokumentasikan audit dan keterbatasan visual.

Ruling: perubahan CSS/copy tidak mendapat tes kosmetik yang mengunci implementasi. Gunakan diagnostik sebelum/sesudah dan suite interaksi yang sudah ada; perubahan perilaku bila diperlukan harus mendapat regresi RED→GREEN. Baseline mencakup perubahan emoji/fallback sebelumnya yang belum dikomit; jangan membatalkannya atau menganggapnya hasil audit mobile.
