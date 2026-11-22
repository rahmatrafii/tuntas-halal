# F01 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and prove the approved database foundation locally without changing the demo screens or exposing cloud credentials.

**Architecture:** Six public business tables use explicit grants and RLS for reads. Narrow security-definer RPCs enforce writes, atomic audit, optimistic versions, and actor-scoped idempotency. Private helper functions and request receipts are not exposed through the Data API.

**Tech Stack:** Supabase CLI 3.2.0, Postgres, pgTAP, existing supabase-js SDK, Node 24, TypeScript.

**Spec:** `docs/superpowers/specs/2026-11-21-f01-foundation-design.md` (approved by user on 21 November 2026).

**Follow-up:** the approved F02 work applied F01 to development cloud and added migration 005 for PT409/HTTP 409 version conflicts. This supersedes the original 40001 contract below because cloud PostgREST 14 retries it indefinitely. See the [F02 ledger](2026-11-21-f02-staff-auth.md) for RED→GREEN and cloud proofs; retain this original plan as history.

## Global Constraints

- Preserve four statuses, calendar dates, active membership, assignment, tenant isolation, and coordinator read/transfer-only rights.
- No cloud reset, test users in cloud, real emails, WhatsApp messages, production data, or UI integration.
- `.env.local` remains cloud configuration; local test keys stay in process memory and are never printed or committed.
- Keep the six public business tables; use a private receipt table containing request hashes and minimal results for retry handling.
- Work on `feat/f01-foundation` in the current checkout; preserve existing setup documents and environment. No commit or push without a separate user request.

## Review Focus

1. Retry after access is revoked must not reveal the old response: authorize before receipt lookup.
2. Concurrent transfer and task writes must serialize through the parent-case lock.
3. Two businesses may share a phone only after an explicit same-owner duplicate confirmation; other owners' contacts must not leak.
4. A failed batch must retain every task and audit row; completed requires explicit confirmation.
5. Local test commands must reject cloud URLs and must not consume `.env.local` credentials.

## Task 1: CLI, schema, read access, and local fixtures

Files: `package.json`, `package-lock.json`, CLI-generated `supabase/config.*`, `supabase/migrations/20261121000100_foundation.sql`, `supabase/tests/001_access.test.sql`.

Interfaces: `organizations`, `memberships`, `business_contacts`, `cases`, `revision_tasks`, `audit_events`; private membership/case-access helpers. Contact/case/task versions start at 1. Membership roles and revision statuses use enums. Contacts are owner-editable, transferred contacts are readable only as needed. Raw authenticated business writes and audit writes are denied.

- [x] Run the existing 26 tests as baseline; pin/install CLI and start a uniquely named local stack with credentials captured, not printed.
- [x] Write pgTAP tests first and observe failure against the empty local schema.
- [x] Implement schema, tenant FKs, active-assignee checks, phone/timezone validation, explicit grants, RLS, and append-only audit triggers.
- [x] Apply migrations on the local disposable database and run SQL tests.

## Task 2: Checked writes, retry, versions, and transfer

Files: `supabase/migrations/20261121000200_mutations.sql`, `supabase/tests/002_mutations.test.sql`.

Interfaces (all return JSON containing IDs/versions only; first argument `p_request_id uuid`):

- `create_contact(p_id uuid,p_organization_id uuid,p_business_name text,p_whatsapp_number text,p_greeting_name text,p_confirm_duplicate boolean)`.
- `update_contact(p_id uuid,p_expected_version int,p_business_name text,p_whatsapp_number text,p_greeting_name text,p_confirm_duplicate boolean)`.
- `create_case(p_id uuid,p_organization_id uuid,p_contact_id uuid,p_official_reference text)`; actor becomes assignee and must own the contact.
- `update_case(p_id uuid,p_expected_version int,p_official_reference text)`.
- `create_task(p_id uuid,p_case_id uuid,p_instruction text,p_follow_up_on date)`.
- `update_task(p_id uuid,p_expected_version int,p_instruction text,p_status revision_status,p_follow_up_on date,p_completion_confirmed boolean)`.
- `set_task_statuses(p_case_id uuid,p_task_ids uuid[],p_expected_versions jsonb,p_status revision_status,p_follow_up_on date,p_completion_confirmed boolean)`.
- `transfer_case(p_id uuid,p_expected_version int,p_assignee_id uuid)`.

Receipts keyed by `(actor_id, request_id)` store canonical payload hashes and minimal JSON results. Check current authority before retrieving receipts, retrieve matching receipts before checking expected versions, and serialize writes on parent cases. A reused key with a different payload is an input conflict. Business conflicts use SQLSTATE `40001`; access failures use `42501`; invalid input uses `22023`. Create retry also checks existing resource ID/payload. Audit stores no instruction or message text.

- [x] Write denied-write, valid CRUD, transfer, confirmation, batch rollback, retry, and spoofing pgTAP tests; observe failures before RPC implementation.
- [x] Implement the eight RPCs and private receipt helpers with fixed search paths and explicit EXECUTE grants.
- [x] Run SQL tests; demonstrate positive writes under user roles and denied writes preserve target rows.

## Task 3: Real sessions and concurrent requests

Files: `scripts/database.mjs`, `tests/database-command.test.ts`, `supabase/tests/concurrency.test.mjs`, package scripts.

Interfaces: read local CLI status in memory, reject non-loopback endpoints, invoke SQL tests and then the Node integration test using ephemeral local keys. Use the installed SDK for administrative fixture provisioning and two independent signed-in test clients. Do not add a database driver.

- [x] Observe real-session/concurrency tests fail before the relevant mutations exist or behave correctly.
- [x] Prove one success/one stale-version rejection, same-intent idempotency, changed-payload rejection, cross-tenant denial, transfer isolation, and atomic batch rollback.
- [x] Verify fixtures/users are local-only and errors do not print tokens or keys.

## Task 4: Regeneration, checks, documentation, and review

Files: `src/lib/supabase/database.types.ts`, `docs/DATA_MODEL.md`, `docs/SUPABASE.md`, `docs/TESTING.md`, `docs/PROJECT_STATUS.md`, `docs/VIBE_CODING.md`, `docs/BACKLOG.md`.

- [x] Rebuild the local schema from migrations and rerun all database tests.
- [x] Generate TypeScript from the actual local public schema; wire generated types into existing clients if compatible without changing UI behavior.
- [x] Run `npm run check`, then `npm run build` sequentially; run skills integrity verification.
- [x] Request one independent security/code review and fix important findings with regression tests.
- [x] Record actual local/cloud verification boundaries and leave F02–F09/UI02 open. Cloud application is separate and depends on a confirmed administrative connection.

## Execution ledger

- Ruling: execute in the current configured checkout on a new feature branch, preserving the user's configured environment and approved uncommitted documents. Keep this branch as-is after verification; no additional worktree or integration prompt is needed for the authorized implementation. Cost if wrong: unfinished work remains in this checkout and must be committed before switching tasks.
- Ruling: keep an explicit plan ledger here rather than creating a separate disposable bookkeeping workspace. No automatic commits or cleanup of user files. Cost if wrong: no per-task commit checkpoints; the retained files and ledger must carry the handoff.
- Pre-flight: tasks 2–3 use the exact schema and RPC names above; task 4 generates types only after SQL and real-session tests pass.
- Task 1: complete — baseline 26/26; empty schema assertions failed; schema/access SQL then passed 46 assertions. Corrected pgTAP's ambiguous two-argument overload to explicit three-argument schema assertions.
- Task 2: complete — 47 mutation assertions failed before RPCs existed; all 55 mutation assertions passed inside a rollback-only trial before applying migration 002.
- Task 3: complete — real-session test exposed missing EXECUTE on the pure timezone validator for administrative fixture inserts. New migration 003 fixes this without editing an applied migration; SQL now passes 102 assertions and the real Auth/concurrency scenario passes.
- Ruling: combine local start/reset/test/type generation into `scripts/database.mjs` so endpoint guards and credential suppression share one implementation. Two application tests prove cloud API/database endpoints are rejected. Cost if wrong: CLI output changes require updating this small wrapper before local commands work again.
- Ruling: administrative audit events may have a null actor (system operation); signed-in RPC events must use `auth.uid()` and the real-session test verifies this. No credentials or instruction/message contents are stored in receipts or audit payloads; receipt payloads are hashes only. Cost if wrong: administrative actions cannot be attributed to an individual through this audit row alone; provisioning remains a trusted admin operation.
- Final review: one fresh-context whole-change security/code review found an Important reverse contact lock order and a whitespace-validation issue initially labeled Minor. Re-graded whitespace as Important because blank instructions can be saved, violating existing user behavior. Both entered one fix pass; no minor findings deferred.
- Final: fixed contact create-retry/update deadlock — controlled real-Auth regression failed with SQLSTATE `40P01` before migration 004, then passed after consistent owner/organization advisory lock before row lock. Full database suite 109/109 plus 1/1 real-session scenario green.
- Final: fixed whitespace-only names/instructions — seven pgTAP assertions RED before migration 004, GREEN after shared JavaScript-whitespace trimming in constraints and CRUD RPCs. Full database suite 109/109 plus 1/1 real-session scenario green.
- Final: Ruling: cloud grants/application were outside the review's local proof — keep cloud application and verification separate, as the approved spec permits and no administrative connection is confirmed. Cost if wrong: cloud version/default privileges can differ, so local success must not be treated as permission to use cloud business data.
- Final: Ruling: UI/auth integration was outside the F01 review — preserve demo business screens and leave F02–F09/UI02 open. Cost if wrong: login and end-to-end workflow defects remain undiscovered until those slices receive their own integration tests.
- Task 4: complete — fresh reset applies all four migrations; `db:test` passes 109 pgTAP assertions across four files and the real Auth/concurrency scenario; `db:types` regenerates the actual schema; `check` passes lint, TypeScript and 28/28 tests; `build` succeeds; `skills:verify` passes 29 skills. Documentation/handoff distinguish local and cloud. Safe command output retained only in ignored `.git/f01-final-check.log`; no commit/push performed.
