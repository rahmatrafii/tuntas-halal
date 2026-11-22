import assert from "node:assert/strict";
import {test} from "node:test";
import {createServer} from "node:net";
import {once} from "node:events";
import {inspect} from "node:util";
import {assertPrivateDifferent, assertPortAvailable, waitForOwnedServer} from "../supabase/tests/auth-harness.mjs";
import {spawn} from "node:child_process";

test("failed authentication comparisons reveal booleans only, never secrets", () => {
  const secret = "SYNTHETIC_AUTH_SECRET_SENTINEL";
  for (const value of [secret, [["cookie-name", secret]]]) {
    let diagnostic = "";
    try {assertPrivateDifferent(value, value, "private values must differ");} catch (error) {diagnostic = inspect(error);}
    assert(diagnostic.includes("private values must differ"));
    assert(!diagnostic.includes(secret), "failure diagnostics must redact compared credentials");
  }
});

test("an existing listener is rejected before the auth server can start", async () => {
  const listener = createServer();
  listener.listen(0, "127.0.0.1"); await once(listener,"listening");
  const address = listener.address();
  assert(address && typeof address === "object");
  try {await assert.rejects(assertPortAvailable(address.port), /already in use/);} finally {
    await new Promise<void>(resolve => listener.close(() => resolve()));
  }
});

test("readiness fails when the owned child exits before becoming ready", async () => {
  const child = spawn(process.execPath, ["-e", "process.exit(3)"], {stdio: ["ignore", "pipe", "pipe"]});
  await assert.rejects(waitForOwnedServer(child), /failed before readiness/);
});
