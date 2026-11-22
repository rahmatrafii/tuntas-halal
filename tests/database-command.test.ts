import assert from "node:assert/strict";
import { test } from "node:test";
import { assertLocalEndpoints } from "../scripts/database.mjs";
import {spawnSync} from "node:child_process";

test("database tooling rejects a cloud API even with a local database", () => {
  assert.throws(() => assertLocalEndpoints({
    API_URL: "https://example.supabase.co", DB_URL: "postgresql://localhost:55322/postgres",
  }), /hanya untuk stack lokal/);
});
test("caseload integration refuses cloud configuration before creating any fixtures",()=>{
  const env:NodeJS.ProcessEnv={...process.env,SUPABASE_TEST_URL:"https://example.supabase.co",SUPABASE_TEST_SECRET_KEY:"invalid-unused-key"};
  delete env.NODE_TEST_CONTEXT;
  const result=spawnSync(process.execPath,["--test","supabase/tests/caseload.test.mjs"],{
    env,encoding:"utf8",
  });
  assert.notEqual(result.status,0);
  assert((result.stdout+result.stderr).includes("hanya untuk stack lokal"));
});
test("database tooling rejects a remote database even with a local API", () => {
  assert.throws(() => assertLocalEndpoints({
    API_URL: "http://127.0.0.1:55321", DB_URL: "postgresql://database.example.test/postgres",
  }), /hanya untuk stack lokal/);
  assert.doesNotThrow(() => assertLocalEndpoints({
    API_URL: "http://127.0.0.1:55321", DB_URL: "postgresql://127.0.0.1:55322/postgres",
  }));
});
