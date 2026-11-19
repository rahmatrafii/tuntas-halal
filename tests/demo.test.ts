import assert from "node:assert/strict";
import { test } from "node:test";
import { initialState } from "../src/features/demo/model";
import {
  canReadCase,
  caseComplete,
  changeTasks,
  filterTasks,
  transferCase,
  visibleCases,
  visibleContacts,
} from "../src/features/demo/logic";

test("queue scopes by assignee, searches business/reference, and excludes completed by default", () => {
  const state = structuredClone(initialState);
  assert.equal(filterTasks(state, "", "contact_today").length, 2);
  assert.equal(filterTasks(state, "SH-2026-08124").length, 2);
  assert.equal(filterTasks(state, "keripik bu rina").length, 2);
  assert.equal(filterTasks(state, "tempe").length, 0);
  assert.equal(filterTasks(state, "", "completed").length, 2);
  assert.equal(
    filterTasks(state).some((task) => task.status === "completed"),
    false,
  );
  assert.equal(filterTasks(state)[0].id, "t-rina-2");
});

test("partial reply updates only the selected task and appends audit atomically", () => {
  const state = structuredClone(initialState);
  const next = changeTasks(
    state,
    ["t-rina-1"],
    "needs_review",
    null,
    { "t-rina-1": 1 },
    "2026-11-19T10:00:00Z",
  );
  assert.equal(
    next.tasks.find((task) => task.id === "t-rina-1")?.status,
    "needs_review",
  );
  assert.equal(
    next.tasks.find((task) => task.id === "t-rina-2")?.status,
    "awaiting_reply",
  );
  assert.equal(next.history.length, state.history.length + 1);
  assert.equal(
    state.tasks.find((task) => task.id === "t-rina-1")?.status,
    "awaiting_reply",
  );
  assert.equal(next.tasks.find((task) => task.id === "t-rina-1")?.version, 2);
});

test("stale status and mixed-case batches are rejected without modifying the original", () => {
  const state = structuredClone(initialState);
  const before = structuredClone(state);
  assert.throws(
    () =>
      changeTasks(
        state,
        ["t-rina-1"],
        "completed",
        null,
        { "t-rina-1": 0 },
        "now",
      ),
    /sudah berubah/,
  );
  assert.throws(
    () =>
      changeTasks(
        state,
        ["t-rina-1", "t-sari-1"],
        "awaiting_reply",
        null,
        { "t-rina-1": 1, "t-sari-1": 1 },
        "now",
      ),
    /satu kasus/,
  );
  assert.deepEqual(state, before);
});

test("transfer changes access to one case without exposing other cases on the same contact", () => {
  const state = { ...structuredClone(initialState), staffId: "ratna" };
  const next = transferCase(
    state,
    "kasus-rina",
    "farhan",
    1,
    "2026-11-19T10:00:00Z",
  );
  const farhan = { ...next, staffId: "farhan" };
  const nadia = { ...next, staffId: "nadia" };
  assert.equal(
    canReadCase(
      farhan,
      next.cases.find((item) => item.id === "kasus-rina")!,
    ),
    true,
  );
  assert.equal(
    canReadCase(
      nadia,
      next.cases.find((item) => item.id === "kasus-rina")!,
    ),
    false,
  );
  assert.equal(
    visibleCases(farhan).some((item) => item.id === "kasus-rina-lama"),
    false,
  );
  assert.equal(
    visibleContacts(farhan).some((contact) => contact.id === "rina"),
    true,
  );
  assert.equal(
    visibleContacts(nadia).some((contact) => contact.id === "rina"),
    true,
  );
  assert.equal(next.history[0].title, "Penanggung jawab dialihkan");
});

test("coordinator can read team data but cannot mutate task status", () => {
  const state = { ...structuredClone(initialState), staffId: "ratna" };
  assert.equal(visibleCases(state).length, initialState.cases.length);
  assert.throws(
    () =>
      changeTasks(
        state,
        ["t-rina-1"],
        "completed",
        null,
        { "t-rina-1": 1 },
        "now",
      ),
    /penanggung jawab/,
  );
  assert.throws(() =>
    transferCase(
      { ...state, staffId: "nadia" },
      "kasus-rina",
      "farhan",
      1,
      "now",
    ),
  );
  assert.throws(() => transferCase(state, "kasus-rina", "ratna", 1, "now"));
});

test("case completion and signed-out visibility follow the PRD", () => {
  assert.equal(caseComplete(initialState, "kasus-rina-lama"), true);
  assert.equal(caseComplete(initialState, "kasus-rina"), false);
  assert.equal(caseComplete(initialState, "missing"), false);
  assert.equal(visibleCases({ ...initialState, staffId: null }).length, 0);
  assert.equal(visibleContacts({ ...initialState, staffId: null }).length, 0);
});
