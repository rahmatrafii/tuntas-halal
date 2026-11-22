import assert from "node:assert/strict";
import {isDeepStrictEqual} from "node:util";
import {createServer} from "node:net";

export function assertPrivateDifferent(actual, expected, message) {
  assert(!isDeepStrictEqual(actual, expected), message);
}

export async function assertPortAvailable(port) {
  const probe = createServer();
  await new Promise((resolve, reject) => {
    probe.once("error", () => reject(new Error("Auth test port is already in use; no requests were sent.")));
    probe.listen(port, "127.0.0.1", () => probe.close(resolve));
  });
}

export function waitForOwnedServer(child) {
  return new Promise((resolve,reject) => {
    const timer = setTimeout(() => reject(new Error("Auth test server startup timed out.")),30000);
    const fail = () => {clearTimeout(timer); reject(new Error("Owned auth test server failed before readiness."));};
    child.once("error",fail); child.once("exit",fail);
    let output="";
    child.stdout.on("data",chunk => {
      output=(output+chunk.toString()).slice(-2000);
      if (output.includes("Ready in")) {clearTimeout(timer); resolve();}
    });
  });
}
