import { execFileSync, spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const root = fileURLToPath(new URL("../", import.meta.url));
const cli = fileURLToPath(new URL("../node_modules/supabase/dist/supabase.js", import.meta.url));
const sqlTests = ["000_schema.test.sql", "001_access.test.sql", "002_mutations.test.sql", "003_validation.test.sql", "004_task_instruction.test.sql"]
  .map((name) => `supabase/tests/${name}`);

export function assertLocalEndpoints(status) {
  for (const [key, protocols] of [["API_URL", ["http:", "https:"]], ["DB_URL", ["postgres:", "postgresql:"]]]) {
    const url = new URL(status[key]);
    if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) || !protocols.includes(url.protocol)) {
      throw new Error("Perintah database ini hanya untuk stack lokal; URL cloud ditolak.");
    }
  }
}

function capture(args) {
  try {
    return execFileSync(process.execPath, [cli, ...args], {cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer: 16 * 1024 * 1024});
  } catch {
    // Never forward CLI status/start output: it can contain local signing and API keys.
    throw new Error(`Supabase ${args[0]} gagal. Periksa Docker dan konfigurasi stack lokal.`);
  }
}

function localStatus() {
  const status = JSON.parse(capture(["status", "--output", "json"]));
  assertLocalEndpoints(status);
  return status;
}

export function runDatabaseCommand(command) {
  if (command === "start") {
    capture(["start", "--exclude", "studio,postgres-meta,realtime,storage-api,imgproxy,edge-runtime,logflare,vector,supavisor", "--output", "json"]);
    localStatus();
    console.log("Stack Supabase lokal aktif; kredensial tidak ditampilkan.");
    return;
  }
  if (!["reset", "test", "auth-test", "caseload-test", "types"].includes(command)) throw new Error("Gunakan start, reset, test, auth-test, caseload-test, atau types.");
  const status = localStatus();
  if (command === "reset") {
    capture(["db", "reset", "--local"]);
    console.log("Database lokal dibangun ulang dari migrasi. Database cloud tidak disentuh.");
  } else if (command === "types") {
    const types = capture(["gen", "types", "typescript", "--local", "--schema", "public"]);
    if (!types.includes("export type Database")) throw new Error("CLI tidak menghasilkan tipe database yang diharapkan.");
    writeFileSync(resolve(root, "src/lib/supabase/database.types.ts"), types.replace(/[ \t]+$/gm, ""));
    console.log("Tipe public schema dihasilkan dari database lokal.");
  } else {
    if (!status.PUBLISHABLE_KEY || !status.SECRET_KEY) throw new Error("Key stack lokal tidak tersedia.");
    if (command === "test") {
      const sql = spawnSync(process.execPath, [cli, "test", "db", ...sqlTests], {cwd: root, stdio: "inherit"});
      if (sql.status !== 0) throw new Error("Tes SQL/RLS gagal.");
    }
    const integration = spawnSync(process.execPath, ["--test", command === "test" ? "supabase/tests/concurrency.test.mjs" : command === "caseload-test" ? "supabase/tests/caseload.test.mjs" : "supabase/tests/auth.test.mjs"], {
      cwd: root, stdio: "inherit", env: {
        ...process.env,
        SUPABASE_TEST_URL: status.API_URL,
        SUPABASE_TEST_PUBLISHABLE_KEY: status.PUBLISHABLE_KEY,
        SUPABASE_TEST_SECRET_KEY: status.SECRET_KEY,
      },
    });
    if (integration.status !== 0) throw new Error("Tes sesi/concurrency database gagal.");
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { runDatabaseCommand(process.argv[2]); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
