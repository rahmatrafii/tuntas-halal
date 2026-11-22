# F06 implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans inline; one fresh final review.

**Goal:** Status per revisi, konfirmasi kirim batch, tanggal, progres dan riwayat nyata.
**Architecture:** Fitur status memakai client pengguna/RLS dan set_task_statuses. Query terikat kasus, form native/hydrated, audit tetap dibuat database.
**Tech Stack:** Next16/React19/TS/Supabase/CSS.
**Spec:** docs/superpowers/specs/2026-11-22-f06-status-follow-up-design.md (disetujui).

## Global Constraints

Empat status PRD, satu batch maksimal100, tanggal kalender tanpa UTC, input/retry bertahan, akses per read/action, tanpa schema/dependency baru, demo terpisah, cloud fixture HP dipertahankan. Tidak commit/push/deploy.

## Review Focus

Retry respons hilang sesudah status berubah; no-op tanpa audit; batch stale rollback; konfirmasi tidak berasal dari chat; progress/history semua halaman dan query gagal eksplisit.

### Task 1: Status service dan query

Files: src/features/status/{types,service,queries}.ts, tests/status.test.ts.
Interfaces: saveStatus(client,org,case,mode,form); allTasks/client context; listHistory, caseProgress.
- [x] Tes validasi, scope, konfirmasi/date, batch/noop/retry/conflict RED.
- [x] Implement service RPC dan query, jalankan tes GREEN.

### Task 2: Form dan route

Files: status/{forms.tsx,actions.ts}; routes status/pengiriman; case detail dan draft editor.
Consumes service DTO, produces native/hydrated forms and history/progress.
- [x] Tes pending/error/conflict/review/selection RED.
- [x] Implement form single/batch, route guard, CTA draf, progres/history. GREEN.

### Task 3: Integrasi dan handoff

Files: supabase/tests/caseload.test.mjs; docs/STAFF_STATUS.md, BACKLOG/PROJECT_STATUS.
- [x] Tambah HTTP lokal status/audit/readonly/conflict/progress. Jalankan SQL/concurrency dan HTTP lokal.
- [x] check/build, review independen, perbaiki temuan penting dan dokumentasi.

Ruling: pakai checkout fitur yang ada agar perubahan UI/F05 belum dikomit tetap tersedia; tidak membuat worktree atau commit. Ledger .superpowers/sdd/2026-11-22-f06-status-follow-up/progress.md. Ikuti template dan gaya form yang sudah ada; copy/CSS reversible tidak diberi tes kosmetik.
