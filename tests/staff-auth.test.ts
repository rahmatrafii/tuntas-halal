import assert from "node:assert/strict";
import { test } from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../src/lib/supabase/database.types";
import { applicationOrigin, confirmationInput, sendLoginLink, staffAccess } from "../src/features/staff/auth";

type Client = SupabaseClient<Database>;

test("application origin permits HTTPS or loopback HTTP and rejects redirect credentials/paths", () => {
  assert.equal(applicationOrigin("https://app.example.test/"), "https://app.example.test");
  assert.equal(applicationOrigin("http://127.0.0.1:3150"), "http://127.0.0.1:3150");
  for (const value of [undefined, "http://app.example.test", "https://user:pass@app.example.test", "https://app.example.test/path", "https://app.example.test?next=x", "javascript:alert(1)"]) {
    assert.throws(() => applicationOrigin(value));
  }
});

test("callback accepts email/invite once and rejects duplicate or invalid credentials", () => {
  const token = "a".repeat(64);
  for (const type of ["email", "invite"]) assert.deepEqual(confirmationInput(new URLSearchParams({type, token_hash: token})), {type, token_hash: token});
  for (const query of [`type=recovery&token_hash=${token}`, "type=email", `type=email&type=invite&token_hash=${token}`, "type=email&token_hash=bad%20token", `type=email&token_hash=${token}&token_hash=${token}`]) {
    assert.equal(confirmationInput(new URLSearchParams(query)), null);
  }
});

test("login validates server input before calling Auth and forbids signup", async () => {
  let calls = 0;
  const client = {auth: {signInWithOtp: async (args: unknown) => {
    calls++;
    assert.deepEqual(args, {email: "staff@example.test", options: {shouldCreateUser: false, emailRedirectTo: "https://app.example.test/auth/confirm"}});
    return {error: null};
  }}} as unknown as Client;
  assert.equal((await sendLoginLink(client, " ", "https://app.example.test")).status, "invalid");
  assert.equal((await sendLoginLink(client, "staff@", "https://app.example.test")).status, "invalid");
  assert.equal(calls, 0);
  assert.equal((await sendLoginLink(client, " Staff@Example.Test ", "https://app.example.test")).status, "sent");
  assert.equal(calls, 1);
});

test("unknown email receives the same conditional response while service failure is retryable", async () => {
  const client = (error: unknown) => ({auth: {signInWithOtp: async () => ({error})}} as unknown as Client);
  const success = await sendLoginLink(client(null), "staff@example.test", "https://app.example.test");
  assert.deepEqual(await sendLoginLink(client({code: "otp_disabled", status: 422}), "unknown@example.test", "https://app.example.test"), success);
  assert.equal((await sendLoginLink(client({code: "unexpected_failure", status: 503}), "staff@example.test", "https://app.example.test")).status, "error");
  assert.equal((await sendLoginLink(client({status: 429}), "staff@example.test", "https://app.example.test")).status, "error");
});

function accessClient({claims = {sub: "verified-user", email: "staff@example.test"} as Record<string, unknown> | null, authError = null as unknown, queryError = null as unknown, rows = [] as unknown[]} = {}) {
  const filters: unknown[] = [];
  const query = {select: () => query, eq: (field: string, value: unknown) => {filters.push([field, value]); return query;}, order: async () => ({data: rows, error: queryError})};
  return {filters, client: {auth: {getClaims: async () => ({data: claims ? {claims} : null, error: authError})}, from: (table: string) => {assert.equal(table, "memberships"); return query;}} as unknown as Client};
}

test("verified subject and active membership constrain staff DTOs without selecting a tenant", async () => {
  const fixture = accessClient({rows: [
    {organization_id: "org-a", role: "companion", organizations: {name: "LP3H A Fiktif", timezone: "Asia/Jakarta"}},
    {organization_id: "org-b", role: "coordinator", organizations: {name: "LP3H B Fiktif", timezone: "Asia/Makassar"}},
  ]});
  const result = await staffAccess(fixture.client);
  assert.deepEqual(fixture.filters, [["user_id", "verified-user"], ["is_active", true]]);
  assert.deepEqual(result, {status: "active", userId: "verified-user", email: "staff@example.test", memberships: [
    {organizationId: "org-a", role: "companion", name: "LP3H A Fiktif", timezone: "Asia/Jakarta"},
    {organizationId: "org-b", role: "coordinator", name: "LP3H B Fiktif", timezone: "Asia/Makassar"},
  ]});
});

test("missing or invalid sessions are signed out while service failures remain errors", async () => {
  assert.equal((await staffAccess(accessClient({claims: null}).client)).status, "signed_out");
  assert.equal((await staffAccess(accessClient({authError: {status: 401}}).client)).status, "signed_out");
  assert.equal((await staffAccess(accessClient({authError: {status: 503}}).client)).status, "unavailable");
  assert.equal((await staffAccess(accessClient({queryError: {code: "08006"}}).client)).status, "unavailable");
  assert.equal((await staffAccess(accessClient().client)).status, "restricted");
});
