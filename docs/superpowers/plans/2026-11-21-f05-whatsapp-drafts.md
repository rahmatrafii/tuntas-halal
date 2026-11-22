# F05 WhatsApp Drafts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Draf WhatsApp staf pulih per akun/LP3H/kasus tanpa perubahan status bisnis.

**Architecture:** Server reads/Actions memakai sesi pengguna dan RLS; editor client menyimpan payload minimal di localStorage. Reuse helper WhatsApp domain, tanpa schema/dependency baru.

**Tech Stack:** Next 16.4.6, React 19.3, TypeScript strict, Supabase, npm.

**Spec:** `docs/superpowers/specs/2026-11-21-f05-whatsapp-drafts-design.md`, disetujui pengguna.

## Global Constraints

Browser per akun/LP3H/kasus. Pesan maksimal 64.000 karakter; URL ter-encode 8.000 karakter sebelum fallback chat tanpa teks. Read-only terhadap bisnis; tanpa F06, fixture cloud, pesan/email eksternal, deploy, commit/push. Checkout feature dipertahankan karena F01–F04 masih uncommitted; eksekusi inline seperti F04.

## Review Focus

- Reload URL pilih harus mempertahankan pesan/pilihan kosong tersimpan (Task 2/3).
- Instruksi/kontak berubah saat ekspor harus memerlukan tinjauan, tanpa overwrite suntingan (Task 1/3).
- Dua tab mengedit draf: event/pre-write check mencegah overwrite diam-diam (Task 2/3).
- Validasi async bisa kehilangan clipboard activation: fallback manual, bukan sukses palsu (Task 3).
- Assignee/akun berubah: respons async lama tidak boleh memulihkan akses/pesan akun lama (Task 1/3/4).

### Task 1: Context and export validation

Files: `src/features/drafts/service.ts`, `types.ts`, `actions.ts`; `tests/drafts.test.ts`.

Interfaces: `loadDraftContext(client,orgId,caseId):Promise<DraftReply>`; `prepareDraft(client,orgId,caseId,request:unknown):Promise<DraftReply>`. `DraftContext` carries verified user/org/case, contact version/owner/name/phone, case version, active tasks `{id,instruction,version,status}`. Reply states idle/ready/changed/invalid/forbidden/error, optional context/message/url/longUrl. Request intent refresh/compose/copy/open, selection, snapshot versions and edited message.

- [x] Write/run failing service tests for authorization, pagination, foreign/completed/duplicate IDs, stale snapshots, safe URL/unicode/size and no RPC/mutation; expected FAIL before modules.
- [x] Implement guarded paginated reads, all selected IDs verified, compose via existing domain helper, export snapshot checks and 8000 URL fallback; run tests PASS.

### Task 2: Persistent browser drafts

Files: `src/features/drafts/storage.ts`; `tests/draft-storage.test.ts`.

Interfaces: scope-bound `draftKey`, `readDraft`, `writeDraft` with expected raw value and explicit conflict/error; `LocalDraft` minimal selection/text/edit/snapshot/version payload. Pure `newDraft(context,selectedId)` and `snapshotDraft` helpers; payload schema version 1, bounded JSON 1 MB, message 64000.

- [x] Write/run failing tests for account isolation, empty recovery, malformed/oversized storage, denied/quota read/write, stale tab expected value and explicit force; expected FAIL.
- [x] Implement without automatic write on mount, errors preserve caller memory, raw revision compare, scope/schema guards; run PASS.

### Task 3: Editor and route

Files: `src/features/drafts/editor.tsx`; nested case `pesan/page.tsx`; case detail links; `src/app/globals.css`; `tests/draft-editor.test.tsx`.

Interfaces: `DraftEditor(context,selectedId,action,permalink)` uses Action form metadata (`draftRequest` JSON and intent submitter); hydrated export validates server first. Reply native render is read-only; client handles clipboard/navigation only after trusted response. Local draft restores before autosave, paginates view 20 and selects across entire context.

- [x] Write/run failing DOM tests reload with saved/empty draft, manual message survives checkbox changes, quota/corrupt/tab conflict, async export error/revocation, clipboard fallback, stale response after edit, deletion confirmation.
- [x] Implement editor with explicit compose/keep decisions, server refresh on focus/pageshow, pending/sequence guards, clipboard manual fallback, same-tab navigation + visible continuation link, invalid-phone correction rights; add protected route and links. Preserve design tokens; no F06.
- [x] Run DOM/service/storage tests and typecheck PASS.

### Task 4: HTTP, review and handoff

Files: extend `supabase/tests/caseload.test.mjs`; update status/backlog/architecture/STAFF_CASELOAD/testing/decisions.

- [x] Before route exists add HTTP expectations for draft route/form, compose/export, cross-case/coordinator/tenant/transfer/revoke, pagination and unchanged business/audit; observe RED missing route.
- [x] Run HTTP F03–F05, `npm run check`, `npm run db:test`, Auth regression and `npm run build`; expected PASS. Run Next harnesses/build sequentially.
- [x] Fresh independent whole-change review. Fix important findings RED→GREEN; run affected checks.
- [x] Update docs with actual local/browser evidence and limits; diff/links check. Keep uncommitted work and plan-scoped ledger.
