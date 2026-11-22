# F04 Revision Tasks Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Tambah/baca/ubah instruksi revisi staf tanpa kehilangan isian, duplikasi, atau perubahan status tersirat.

**Architecture:** Server Components dan Server Actions mengikuti F03, client pengguna/RLS. Create memakai F01; satu RPC tambahan mengubah instruksi saja, dengan audit, receipt dan versi dalam transaksi.

**Tech Stack:** Next.js 16.4.6, React 19.3, TypeScript strict, Supabase Postgres/Auth/RLS, npm.

**Spec:** `docs/superpowers/specs/2026-11-21-f04-revision-tasks-design.md`, disetujui pengguna 21 November 2026.

## Global Constraints

- Area `/staf/lembaga/[organizationId]/kasus/[caseId]`; demo tetap terpisah.
- Instruksi wajib, maksimal 2.000 karakter; status awal `needs_sending` dan tanggal null.
- Edit hanya instruksi, tanpa perubahan status/tanggal/case ID, termasuk tugas completed.
- User/RLS untuk reads/writes; membership aktif, LP3H dan assignee diperiksa setiap request/retry.
- Tanpa dependency baru; satu migrasi additive, tipe regenerated. Tidak reset database yang sedang berjalan.
- Fixture lokal saja; tidak deploy, cloud migration, email/WhatsApp, commit/push.
- Pengguna sudah meminta implementasi sekarang: eksekusi inline mengikuti pola sesi F03, dengan satu review independen di akhir. Pertahankan checkout feature yang memuat fondasi uncommitted; jangan memindahkan/menimpa pekerjaan tersebut.

## Review Focus

- Respons update hilang lalu status berubah: receipt mengembalikan sukses lama tanpa menimpa status terbaru (Task 1 SQL + Task 4 HTTP).
- Form punya task sah tetapi case ID berbeda: tidak bocor atau memutasi (Task 2 service + Task 4 HTTP).
- Review konflik diikuti koneksi gagal: expected version dan key tetap sama saat retry (Task 3 DOM).
- Teks multiline/Unicode dan teks terlalu panjang: utuh ketika validasi gagal, tidak truncate diam-diam (Task 2 service + Task 3 DOM).
- Daftar melebihi 20 tugas: halaman kedua dapat diakses dan kasus kosong belum tuntas (Task 4 HTTP).

### Task 1: RPC instruction-only dan tipe

**Files:** Create `supabase/tests/004_task_instruction.test.sql`, `supabase/migrations/20261121000600_task_instruction.sql`; modify `scripts/database.mjs`, `src/lib/supabase/database.types.ts`.

**Interfaces:** Consumes `private.lock_task`, `claim_request`, `check_version`, `finish_request`. Produces `public.update_task_instruction(p_request_id uuid,p_id uuid,p_expected_version integer,p_instruction text) returns jsonb`.

- [x] Tulis pgTAP: edit completed mempertahankan status/date; trim; retry tidak menambah versi/audit; receipt tetap sukses setelah perubahan lain; stale version PT409; changed payload 22023; whitespace 22023; coordinator/anon/revoked ditolak; audit tanpa instruction.
- [x] Jalankan file SQL melalui CLI lokal: FAIL fungsi belum tersedia.
- [x] Implementasi RPC dengan lock → validate → receipt → version → update instruction → finish; grants terbatas.
- [x] Terapkan hanya migrasi baru dengan `supabase migration up --local`; jangan reset. Regenerasi `npm run db:types`.
- [x] Jalankan `npm run db:test`: seluruh SQL/concurrency PASS.

### Task 2: Queries dan service mutasi

**Files:** Create `src/features/revisions/queries.ts`, `mutations.ts`, `tests/revisions.test.ts`; modify `src/features/caseload/mutations.ts` hanya untuk export helper request ID yang sama.

**Interfaces:** Produces `RevisionTask`, `listTasks(client,context,caseId,page): Promise<Page<RevisionTask>>`, `getTask(client,context,caseId,id): Promise<RevisionTask|null>` dan `saveTask(client,organizationId,caseId,mode,form): Promise<RecordFormState>`.

- [x] Tulis service tests input invalid/duplikat field/UUID/versi, role/tenant/assignee/case boundary, request IDs retry, conflict snapshot dengan akses terbaru, provider failure/isian, create resource mismatch.
- [x] Jalankan `npx tsx --test tests/revisions.test.ts`: FAIL sebelum modul tersedia.
- [x] Implementasi query terikat authorized parent dan case ID; pagination 20+1; mutation mengabaikan status/date client, create RPC dan update instruction-only RPC. Error aman, input dipertahankan, reviewVersion efektif, receipt tidak diblokir preflight versi.
- [x] Jalankan tes tersebut: PASS.

### Task 3: Route dan form

**Files:** Create `src/features/revisions/forms.tsx`, `actions.ts`, `tests/revision-forms.test.tsx`; create `src/app/staf/lembaga/[organizationId]/kasus/[caseId]/revisi/baru/page.tsx`, `.../revisi/[taskId]/edit/page.tsx`; modify detail kasus.

**Interfaces:** Consumes Task 2 queries/saveTask; `TaskForm` memakai `RecordFormState`, server action terikat org/case/mode, context usaha dan cancel/permalink; action redirect ke detail kasus setelah saved.

- [x] Tulis DOM tests textarea/isian, error inline/fokus, pending/double submit, transport failure, conflict reviewVersion/key bertahan saat error retry.
- [x] Jalankan tes DOM: FAIL form belum tersedia.
- [x] Implementasi form native + hydrated dengan pola F03; textarea required maxLength 2000, ringkasan/live region, pending guard, retained effective version. Gunakan token/CSS F03, tanpa redesign.
- [x] Tambahkan route dengan guard write/assignee/case/task; daftar detail dengan status teks dan pagination, kosong belum tuntas, coordinator read-only.
- [x] Jalankan DOM/service tests dan typecheck: PASS.

### Task 4: HTTP, review dan handoff

**Files:** Extend `supabase/tests/caseload.test.mjs`; update spec/plan, `AGENTS.md`, `docs/PROJECT_STATUS.md`, `BACKLOG.md`, `STAFF_CASELOAD.md`, `DATA_MODEL.md`, `ARCHITECTURE.md`, `TESTING.md`.

**Interfaces:** Consumes native forms Task 3 dan local harness F03; tidak membuat runner/port/fixture cloud baru.

- [x] Sebelum route Task 3 tersedia, tambahkan HTTP assertions create/read/update/retry/defaults/multi-task, conflict/status preservation, case/tenant/role/transfer/revoke, pagination. Jalankan dan amati FAIL route/form belum tersedia.
- [x] Setelah implementasi, jalankan `npm run db:caseload:test`: PASS native POST/reload/readback/access.
- [x] Jalankan `npm run check`, `npm run db:test`, `npm run db:auth:test`, `npm run build`: PASS; jangan jalankan dua Next build/test harness bersamaan.
- [x] Reviewer independen memeriksa file F04, kontrak F01/F03 terkait, hasil dan Review Focus. Perbaiki temuan penting dengan regresi RED→GREEN, lalu ulangi pemeriksaan terdampak.
- [x] Perbarui docs/status sesuai bukti lokal dan batas browser/cloud, periksa diff/tautan. Tidak commit/push tanpa permintaan.
