# F03 Contacts and Cases Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Implement authenticated, tenant-scoped contact and case CRUD in the staff area, with correct ownership, retry, conflicts and error retention.

**Architecture:** Extend the existing F02 identity DTO with verified user ID, then use a small `caseload` feature with scoped queries and RPC mutations. Server Components read with the user client; Server Actions validate every submission and return form state or redirect after confirmed success. Demo routes/store are preserved.

**Tech Stack:** Installed Next.js 16.4.6, React 19.3, strict TypeScript, Supabase SSR/Postgres/Auth/RLS, Node/tsx/Testing Library, npm; no new dependency or migration expected.

**Spec:** [Approved F03 design](../specs/2026-11-21-f03-contacts-cases-design.md).

## Global Constraints

- Prefiks `/staf/lembaga/[organizationId]`; no automatic tenant selection, demo data or administrative client in application queries.
- Owner/assignee and role diturunkan dari identitas/membership server.
- `update_case` only changes official reference; transferred contacts are readable but editable/reusable only by their owner.
- Koordinator hanya membaca, pendamping assignee lain ditolak walaupun ia pemilik kontak.
- UUID resource and request identity remain stable on same-payload retry; altered payload is a new intent, not a new resource after uncertain create.
- `PT409`/HTTP 409: preserve input, fetch accessible latest state, explicit review before resubmission; never overwrite automatically.
- Simpan kontak baru sebagai langkah tersendiri sebelum membuat kasus. No extra schema, dependencies, cloud fixtures, emails, deployment, commits or pushes.
- UI: putih, card abu-abu, tindakan hitam/pill, font sistem, gutter HP 20px, input 16px, kontrol 48px.

## Review Focus

- A transferred contact must never reveal sibling cases or become reusable/editable through forged form IDs (Task 3 HTTP tests).
- An ambiguous committed create followed by edited retry must show the existing record instead of creating another one (Task 2/3 service tests).
- A membership revoked after form rendering must reject native POST and receipt retry (Task 4 HTTP tests).
- Contacts beyond the first page must remain selectable without loading every contact or silently truncating the picker (Task 3 HTTP tests).
- Native form error responses must retain values and resource/intent identity even before hydration; service errors must not become empty lists (Tasks 2/4 tests).

## File map

- Modify `src/features/staff/auth.ts`, `tests/staff-auth.test.ts`: verified `userId` on active staff access.
- Create `src/features/caseload/access.ts`: `organizationAccess(client, organizationId)` returning active context or signed_out/restricted/forbidden/unavailable; `isUuid`, `organizationPath`.
- Create `src/features/caseload/queries.ts`: typed contact/case DTOs, 20-row stable pages with lookahead; getContact/getCase scoped by org/ID and user RLS. Contact detail queries sibling cases separately through RLS.
- Create `src/features/caseload/mutations.ts`: `saveContact(client, organizationId, mode, form)` / `saveCase(...)` → `RecordFormState`, validation, derived request key, four RPCs and safe error/conflict/duplicate snapshots.
- Create `src/features/caseload/server.ts`: server-only context/read guards using request client, redirects/not-found/service failure.
- Create `src/features/caseload/actions.ts`: native Server Actions wrapping mutations; redirect only after success.
- Create `src/features/caseload/forms.tsx`, `ui.tsx`: minimal accessible forms, tenant frame/navigation and pagination, no demo imports.
- Create eight contact/case route pages under `src/app/staf/lembaga/[organizationId]`, plus error/loading/not-found boundary if needed; modify `/staf/page.tsx` membership navigation and scoped CSS.
- Create `tests/caseload.test.ts`, `tests/caseload-forms.test.tsx`, `supabase/tests/caseload.test.mjs`; extend local database wrapper/package command and guard tests for `db:caseload:test`.
- Update current status, backlog, architecture, testing, staff-auth/setup/handoff documentation.

## Task 1: Organization context and read boundary

**Interfaces:** `ActiveOrganization = {status:'active'; userId:string; organizationId:string; name:string; role:'companion'|'coordinator'; timezone:string}`. `organizationAccess(client: SupabaseClient<Database>, organizationId: string): Promise<ActiveOrganization | {status:'signed_out'|'restricted'|'forbidden'|'unavailable'}>`. Queries return `{items:T[];page:number;hasNext:boolean}` or accessible record/null; provider failures throw a safe service error.

- [x] Add failing tests: active F02 DTO includes the verified subject; chosen organization is checked against active membership; invalid/wrong org does not return a context; unknown sessions and provider errors remain distinct. Query tests assert scoped accessible results, not mock existence.
- [x] Run `npx tsx --test tests/staff-auth.test.ts tests/caseload.test.ts`; observe RED for missing user ID/context behavior.
- [x] Implement active DTO/context, typed org-filtered queries with stable `created_at,id` pagination; all ownership flags derive from verified context. Add server guard and minimum context UI/routes only after meaningful boundary tests exist.
- [x] Run the targeted tests and `npm test`; require no failures. Record actual result in ledger.

## Task 2: Contact mutation and form flow

**Interfaces:** `RecordFormState = {status:'idle'|'invalid'|'error'|'duplicate'|'conflict'|'forbidden'|'saved'; values: Record<string,string>; resourceId:string; intentSeed:string; errors?:Record<string,string>; message?:string; duplicates?:{id:string;name:string}[]; latest?:{version:number;values:Record<string,string>}; savedId?:string}`. Mutations consume request Supabase client + org ID + create/update mode + untrusted FormData and produce this state. Form controls carry resource/intent UUIDs and expected version; actor/role are never accepted.

- [x] Add failing service tests for name/phone normalization, whitespace/oversized values, invalid UUID/version, owner-only mutation, dupe scope/confirmation, same-payload stable request identity, different payload identity with stable resource ID, RPC/provider error redaction, PT409 latest snapshot, denied snapshot after revocation, and ambiguous create returning an existing different payload.
- [x] Run `npx tsx --test tests/caseload.test.ts`; observe each new behavior fail before implementing it.
- [x] Implement contact RPC save and detail/list/create/edit pages. For request IDs use a deterministic UUID derived from random per-form intent seed + operation + normalized payload/version; this keeps retry stable including native POST and changes key only for changed intent. Keep resource ID stable for the form draft. RPC remains final duplicate/access/receipt boundary.
- [x] Add DOM tests first for input retention/pending/no premature success, linked error summary focus, explicit duplicate confirmation resetting on number edit, preserved intent, and latest-versus-entered conflict display with explicit review submit. Observe RED, then implement `ContactForm`/shared form controls and server action adapter.
- [x] Run `npx tsx --test tests/caseload.test.ts tests/caseload-forms.test.tsx` and `npm test`; require no failures.

## Task 3: Case creation/reuse and read/edit pages

**Interfaces:** case save uses same state/guard conventions; query DTO joins only the contact that RLS allows. `/kasus/baru` without a contact shows a paginated own-contact picker with explicit links; `?kontak=<id>` validates ownership and renders the reference form, avoiding a truncated native select. Contact creation with `?lanjut=kasus` redirects after confirmed contact save into the selected case form.

- [x] Write service/HTTP assertions first: no implicit first-contact selection, own-only picker, tampered foreign contact rejected, optional reference null, stable retry, conflict retained, only reference editable, coordinator cannot mutate. Include selection beyond page 1 and shared-contact transfer restrictions.
- [x] Run targeted tests/HTTP scenario to observe missing case behavior fail before code.
- [x] Implement case mutation, picker/list/detail/edit pages and contact handoff. Detail contains no fake completion, task actions or named staff profiles; ownership labels are “Anda”/“Pendamping lain”. Keep all related-case reads org/RLS-scoped.
- [x] Run targeted tests plus `npm test`; require no failures. Record result.

## Task 4: Local integration, final review and handoff

**Interfaces:** `db:caseload:test` runs only `supabase/tests/caseload.test.mjs`, receiving local URL/keys from the existing guarded wrapper. It spawns its own Next server on port 3150/distDir `.next-auth-test` with local process environment, never `.env.local` or cloud fixture operations.

- [x] Extend command guard tests and implement the local runner option; keep start/reset/test/auth-test/types behavior unchanged. HTTP suite creates local fictional users/orgs and signs in by generated token without external email, holds cookie/token values in memory and emits no private assertion values.
- [x] Execute real native HTTP forms and user sessions: CRUD/reuse; duplicate scope/confirm; expected-version conflicts/two sessions and retry after lost response; stale membership/direct mutation/receipt denial; two tenants; coordinator read-only; transfer one of two shared-contact cases; own-contact picker page 2; invalid paths and safe service failures.
- [x] Run `npm run db:caseload:test`, `npm run db:test`, `npm run db:auth:test`, `npm run check`, `npm run build`. Inspect exit codes and summaries, no empty-list/provider-success substitution. If schema stays unchanged, do not reset/regenerate types solely for ceremony.
- [x] Fresh whole-change review using requesting-code-review, comparing F03 files plus connected access/RPC code. Fix important findings with a failing regression test and one fix pass; ledger any actual scope decisions/limitations.
- [x] Update docs/backlog/status with actual outcomes and limitations, diff/link/credential checks. Preserve current branch without commit/push; no review of already-completed whole F01 unrelated scope.

## Execution ledger

Plan self-review: all spec sections map to Tasks 1–4; no additional business feature or SQL migration is implied. Interfaces use one shared state and verified context. Execution proceeds inline in this session because the user approved staged implementation; one independent final review remains required.

- Ruling: preserve the existing `feat/f01-foundation` checkout as explicitly required by the approved spec; it contains the uncommitted F01/F02 foundation F03 depends on. No new worktree or commit is created. Cost: F03 review needs a file list/diff snapshot instead of a clean commit range.
- Ruling: use inline execution as a routine workflow choice under the user's approval to implement; do not add another approval round for execution method. Cost: per-task correctness relies on TDD and the final independent review rather than separate reviewers for each stage.
- Task 1: complete — active verified userId, explicit membership context, scoped queries and server guards; tests RED→GREEN; initial suite 42/42.
- Task 2: complete — contact CRUD/forms/normalization/duplicates, intent/resource stability, retry/conflicts and native/hydrated failure retention; service/DOM tests RED→GREEN.
- Task 3: complete — explicit own-contact picker/pagination, contact handoff, case create/read/reference edit, read-only coordinator and transfer restrictions; real native HTTP scenario RED 404→GREEN, then stronger readbacks/receipt denial.
- Task 4: complete — check 62/62, F03 HTTP, 109 SQL/concurrency, Auth HTTP regression and production build pass; independent review fixes verified RED→GREEN, docs/diff/links and credential-pattern inspection completed. No schema/dependency/cloud changes or commit/push.

### Final review and rulings

- Independent review found one Important retry issue: reviewed version and duplicate approval disappeared after errors, changing request IDs. Two transport retry regressions and the native effective-version/request-ID regression failed first, then passed after storing effective submitted intent independently of the notice.
- Regraded decision announcement as Important because a user of a screen reader otherwise receives no feedback that saving needs a decision. Async duplicate/conflict live-status regression failed, then passed. No deferred minors.
- Browser hydration/navigation/layout/actual assistive technology remain UI02, not claimed from DOM/HTTP. Cost: actual browser/device issues can remain.
- A real interrupted connection after committed RPC is represented by separate committed-retry/readback HTTP and failed-transport DOM/request-ID evidence. Cost: no physical browser packet-interruption reproduction.
- Cloud business access/hosting/live email and production-scale performance remain outside authorized F03 local scope. Cost: pilot/hosting/load need separate verification.
- Preserved F01/F02 baseline is reviewed only where its access/receipt contracts connect to F03; parent reran SQL/concurrency/Auth regressions. Cost: F03 is not a new audit of all old features.
- Final suites/docs were executed/checked by the parent rather than repeated by the reviewer. Cost: no independent second execution, although actual exit codes and outputs gate completion.
- Work and plan ledger are preserved without commits as required by the approved spec; automatic workspace deletion is skipped because Git history does not yet contain these records. Cost: F03 review uses file/package boundaries on the existing feature branch, not a separate committed range.
