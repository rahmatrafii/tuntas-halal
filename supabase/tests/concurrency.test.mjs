import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";
import { test } from "node:test";
import { createClient } from "@supabase/supabase-js";
import { assertLocalEndpoints } from "../../scripts/database.mjs";

const url = process.env.SUPABASE_TEST_URL;
assertLocalEndpoints({API_URL: url, DB_URL: "postgresql://127.0.0.1/local-test"});
const options = {auth: {persistSession: false, autoRefreshToken: false, detectSessionInUrl: false}};
const makeClient = (key) => createClient(url, key, options);
function result(response, operation) {
  assert.equal(response.error?.code ?? null, null, `${operation}: ${response.error?.message ?? ""}`);
  return response.data;
}
function denied(response, code = "42501") { assert.equal(response.error?.code, code); }

const sql = (query) => execFileSync("docker", ["exec", "supabase_db_sihalal-f01", "psql", "-XqAt", "-U", "postgres", "-d", "postgres", "-c", query], {encoding: "utf8"}).trim();
async function waitForLock(functionName) {
  const deadline = Date.now() + 10000;
  while (Date.now() < deadline) {
    if (Number(sql(`select count(*) from pg_stat_activity where pid<>pg_backend_pid() and state='active' and wait_event_type='Lock' and query like '%${functionName}%'`)) > 0) return;
    await delay(30);
  }
  throw new Error(`Request ${functionName} did not reach its controlled lock wait.`);
}

test("real Auth sessions prove versions, retry, atomic batches, tenant and transfer isolation", {timeout: 120000}, async () => {
  const admin = makeClient(process.env.SUPABASE_TEST_SECRET_KEY);
  const publicKey = process.env.SUPABASE_TEST_PUBLISHABLE_KEY;
  const anonymous = makeClient(publicKey);
  const tag = randomUUID();
  const orgA = randomUUID(), orgB = randomUUID();
  const users = {};
  for (const label of ["a1", "a2", "ak", "inactive", "b1", "bk"]) {
    const email = `${label}-${tag}@example.test`, password = randomUUID();
    const created = await admin.auth.admin.createUser({email, password, email_confirm: true});
    assert.equal(created.error?.message ?? null, null, "local Auth fixture creation failed");
    const client = makeClient(publicKey);
    const login = await client.auth.signInWithPassword({email, password});
    assert.equal(login.error?.message ?? null, null, "local Auth fixture login failed");
    users[label] = {id: created.data.user.id, client, email, password};
  }
  result(await admin.from("organizations").insert([{id: orgA, name: "LP3H A Fiktif"}, {id: orgB, name: "LP3H B Fiktif"}]), "organization fixtures");
  result(await admin.from("memberships").insert(Object.entries(users).map(([label, user]) => ({
    organization_id: label.startsWith("b") ? orgB : orgA, user_id: user.id,
    role: label.endsWith("k") ? "coordinator" : "companion", is_active: label !== "inactive",
  }))), "membership fixtures");
  const a1 = users.a1.client, a2 = users.a2.client, ak = users.ak.client;
  const secondA1 = makeClient(publicKey);
  const login = await secondA1.auth.signInWithPassword({email: users.a1.email, password: users.a1.password});
  assert.equal(login.error?.message ?? null, null, "second independent session failed");
  const contact = randomUUID(), caseId = randomUUID(), sibling = randomUUID();
  const task = randomUUID(), otherTask = randomUUID(), siblingTask = randomUUID();
  const createCase = (id, request) => ({p_request_id: request, p_id: id, p_organization_id: orgA, p_contact_id: contact, p_official_reference: null});
  const originalContact = {p_request_id: randomUUID(), p_id: contact, p_organization_id: orgA, p_business_name: "Usaha Fiktif", p_whatsapp_number: "081200000101", p_greeting_name: "Ibu", p_confirm_duplicate: false};
  const createdContact = result(await a1.rpc("create_contact", originalContact), "create contact");

  // A third session controls timing only; the two writes still use real user RPC sessions.
  const blocker = spawn("docker", ["exec", "-i", "supabase_db_sihalal-f01", "psql", "-XqAt", "-U", "postgres", "-d", "postgres"]);
  const blockerExit = once(blocker, "exit");
  let released = false;
  try {
    const ready = new Promise((resolve, reject) => {
      let output = "";
      const timeout = setTimeout(() => reject(new Error("Contact lock fixture timed out.")), 10000);
      blocker.on("error", reject);
      blocker.stdout.on("data", chunk => {
        output += chunk.toString();
        if (output.includes("CONTACT_LOCK_HELD")) { clearTimeout(timeout); resolve(); }
      });
    });
    blocker.stdin.write(`begin; select id from public.business_contacts where id='${contact}' for update; select 'CONTACT_LOCK_HELD';\n`);
    await ready;
    const editing = Promise.resolve(a1.rpc("update_contact", {p_request_id: randomUUID(), p_id: contact, p_expected_version: 1, p_business_name: "Usaha Fiktif Diperbarui", p_whatsapp_number: "081200000101", p_greeting_name: "Ibu", p_confirm_duplicate: false}));
    await waitForLock("update_contact");
    const retrying = Promise.resolve(secondA1.rpc("create_contact", originalContact));
    await waitForLock("create_contact");
    blocker.stdin.end("commit;\n"); released = true;
    const [editResponse, retryResponse] = await Promise.all([editing, retrying]);
    assert.equal(result(editResponse, "contact edit avoids deadlock").version, 2);
    assert.deepEqual(result(retryResponse, "contact retry avoids deadlock"), createdContact);
  } finally {
    if (!released) blocker.stdin.end("rollback;\n");
    await blockerExit;
  }
  const originalCaseRequest = randomUUID();
  result(await a1.rpc("create_case", createCase(caseId, originalCaseRequest)), "create case");
  result(await a1.rpc("create_case", createCase(sibling, randomUUID())), "create sibling case");
  for (const [id, ownerCase] of [[task, caseId], [otherTask, caseId], [siblingTask, sibling]]) {
    result(await a1.rpc("create_task", {p_request_id: randomUUID(), p_id: id, p_case_id: ownerCase, p_instruction: "Instruksi fiktif", p_follow_up_on: null}), "create task");
  }
  const auditCount = async () => {
    const response = await admin.from("audit_events").select("id", {count: "exact", head: true}).eq("case_id", caseId);
    result(response, "audit count"); return response.count;
  };
  const taskRow = async () => result(await admin.from("revision_tasks").select("status,version,follow_up_on").eq("id", task).single(), "task snapshot");
  const before = await auditCount();
  const mutation = (request, expected, status = "needs_review") => ({p_request_id: request, p_id: task, p_expected_version: expected, p_instruction: "Instruksi fiktif", p_status: status, p_follow_up_on: null, p_completion_confirmed: false});
  const concurrentArgs = [mutation(randomUUID(), 1, "awaiting_reply"), mutation(randomUUID(), 1)];
  const competing = await Promise.all([a1.rpc("update_task", concurrentArgs[0]).abortSignal(AbortSignal.timeout(5000)), secondA1.rpc("update_task", concurrentArgs[1]).abortSignal(AbortSignal.timeout(5000))]);
  assert.equal(competing.filter(response => !response.error).length, 1, "exactly one concurrent update succeeds");
  assert.equal(competing.filter(response => response.error?.code === "PT409" && response.status === 409).length, 1, "the other update returns an HTTP 409 conflict promptly");
  assert.equal((await taskRow()).version, 2);
  assert.equal(await auditCount(), before + 1);
  const winner = competing.findIndex(response => !response.error);
  assert.deepEqual(result(await a1.rpc("update_task", concurrentArgs[winner]), "lost-response retry"), competing[winner].data);
  assert.equal(await auditCount(), before + 1, "retry creates no extra audit");
  denied(await a1.rpc("update_task", {...concurrentArgs[winner], p_instruction: "Payload berbeda"}), "22023");

  const sameIntent = mutation(randomUUID(), 2);
  const repeated = await Promise.all([a1.rpc("update_task", sameIntent), secondA1.rpc("update_task", sameIntent)]);
  assert.deepEqual(result(repeated[0], "concurrent retry 1"), result(repeated[1], "concurrent retry 2"));
  assert.equal((await taskRow()).version, 3);
  assert.equal(await auditCount(), before + 2, "concurrent duplicate intent mutates only once");
  denied(await a1.rpc("set_task_statuses", {p_request_id: randomUUID(), p_case_id: caseId, p_task_ids: [task, otherTask], p_expected_versions: {[task]: 3, [otherTask]: 999}, p_status: "completed", p_follow_up_on: "2026-11-21", p_completion_confirmed: true}), "PT409");
  assert.deepEqual(await taskRow(), {status: "needs_review", version: 3, follow_up_on: null});
  assert.equal(await auditCount(), before + 2, "failed batch preserves audit");
  const unchanged = result(await admin.from("revision_tasks").select("status,version,follow_up_on").eq("id", otherTask).single(), "other task");
  assert.deepEqual(unchanged, {status: "needs_sending", version: 1, follow_up_on: null});

  denied(await a1.from("revision_tasks").update({status: "completed"}).eq("id", task));
  denied(await users.b1.client.rpc("update_task", mutation(randomUUID(), 3)));
  denied(await ak.rpc("update_task", mutation(randomUUID(), 3)));
  denied(await users.inactive.client.rpc("update_task", mutation(randomUUID(), 3)));
  denied(await anonymous.from("cases").select("id"));
  denied(await users.bk.client.rpc("transfer_case", {p_request_id: randomUUID(), p_id: caseId, p_expected_version: 1, p_assignee_id: users.b1.id}));
  assert.equal((await taskRow()).version, 3, "denied writes preserve target version");

  const transfer = {p_request_id: randomUUID(), p_id: caseId, p_expected_version: 1, p_assignee_id: users.a2.id};
  result(await ak.rpc("transfer_case", transfer), "transfer");
  result(await ak.rpc("transfer_case", transfer), "transfer retry");
  assert.equal(result(await a1.from("cases").select("id").eq("id", caseId).maybeSingle(), "old access"), null);
  assert.equal(result(await a1.from("audit_events").select("id").eq("case_id", caseId), "old history").length, 0);
  assert.equal(result(await a1.from("cases").select("id").eq("id", sibling).single(), "remaining case").id, sibling);
  assert.equal(result(await a2.from("business_contacts").select("id").eq("id", contact).single(), "required contact").id, contact);
  assert.equal(result(await a2.from("cases").select("id").eq("id", sibling).maybeSingle(), "sibling isolation"), null);
  assert.equal(result(await a2.from("revision_tasks").select("id").eq("id", siblingTask).maybeSingle(), "sibling task isolation"), null);
  denied(await a1.rpc("update_task", concurrentArgs[winner]));
  denied(await a1.rpc("create_case", createCase(caseId, originalCaseRequest)));
  denied(await a2.rpc("update_contact", {p_request_id: randomUUID(), p_id: contact, p_expected_version: 1, p_business_name: "Spoof", p_whatsapp_number: "6281200000101", p_greeting_name: "", p_confirm_duplicate: false}));
  result(await a2.rpc("update_task", mutation(randomUUID(), 3)), "new assignee write");

  const race = await Promise.all([
    ak.rpc("transfer_case", {p_request_id: randomUUID(), p_id: caseId, p_expected_version: 2, p_assignee_id: users.a1.id}),
    a2.rpc("update_task", mutation(randomUUID(), 4, "awaiting_reply")),
  ]);
  result(race[0], "concurrent transfer");
  assert(!race[1].error || race[1].error.code === "42501", "task write linearizes before transfer or loses access");
  assert.equal((await taskRow()).version, race[1].error ? 4 : 5);
  assert.equal(result(await a2.from("cases").select("id").eq("id", caseId).maybeSingle(), "revoked after race"), null);
  const history = result(await admin.from("audit_events").select("before,after,actor_id").eq("case_id", caseId), "history");
  assert(history.every(event => event.actor_id !== null), "application audit derives the signed-in actor");
  assert(history.every(event => !Object.hasOwn(event.before ?? {}, "instruction") && !Object.hasOwn(event.after, "instruction")));
});
