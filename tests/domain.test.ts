import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isCalendarDate,
  isCaseComplete,
  localCalendarDate,
  queueGroup,
  queueOrder,
} from "../src/lib/domain/revisions";
import {
  composeWhatsAppDraft,
  normalizeWhatsAppNumber,
  whatsappChatUrl,
} from "../src/lib/domain/whatsapp";

test("due grouping applies only to waiting tasks and includes today", () => {
  assert.equal(
    queueGroup("awaiting_reply", "2026-11-18", "2026-11-19"),
    "contact_today",
  );
  assert.equal(
    queueGroup("awaiting_reply", "2026-11-19", "2026-11-19"),
    "contact_today",
  );
  assert.equal(
    queueGroup("awaiting_reply", "2026-11-20", "2026-11-19"),
    "awaiting_reply",
  );
  assert.equal(
    queueGroup("awaiting_reply", null, "2026-11-19"),
    "awaiting_reply",
  );
  for (const status of [
    "needs_sending",
    "needs_review",
    "completed",
  ] as const) {
    assert.equal(queueGroup(status, "2026-11-18", "2026-11-19"), status);
  }
  assert.deepEqual(queueOrder, [
    "contact_today",
    "needs_review",
    "needs_sending",
    "awaiting_reply",
  ]);
});

test("organization calendar date is independent of browser and UTC day", () => {
  const instant = new Date("2026-11-18T17:05:00Z");
  assert.equal(localCalendarDate(instant, "Asia/Jakarta"), "2026-11-19");
  assert.equal(localCalendarDate(instant, "America/New_York"), "2026-11-18");
  assert.throws(() => localCalendarDate(instant, "invalid-zone"));
});

test("calendar date validation rejects impossible dates instead of rolling over", () => {
  assert.equal(isCalendarDate("2028-02-29"), true);
  for (const date of ["2026-02-29", "2026-13-01", "19/11/2026", ""]) {
    assert.equal(isCalendarDate(date), false);
  }
  assert.throws(() => queueGroup("awaiting_reply", "2026-02-30", "2026-11-19"));
});

test("a case needs at least one task and all tasks completed", () => {
  assert.equal(isCaseComplete([]), false);
  assert.equal(isCaseComplete(["completed", "needs_review"]), false);
  assert.equal(isCaseComplete(["completed", "completed"]), true);
});

test("Indonesian and international numbers normalize without accepting text or extensions", () => {
  for (const number of [
    "0812-0000-0000",
    "+62 812 0000 0000",
    "6281200000000",
  ]) {
    assert.equal(normalizeWhatsAppNumber(number), "6281200000000");
  }
  assert.equal(normalizeWhatsAppNumber("+44 7700 900123"), "447700900123");
  for (const number of [
    "",
    "abc081200000000",
    "123",
    "++6281200000000",
    "6281200000000 ext 2",
    "1".repeat(16),
  ]) {
    assert.equal(normalizeWhatsAppNumber(number), null);
  }
});

test("chat links encode special characters and reject invalid input", () => {
  const message = "Foto A & B + komposisi?\nTerima kasih.";
  const url = new URL(whatsappChatUrl("081200000000", message)!);
  assert.equal(url.origin, "https://wa.me");
  assert.equal(url.searchParams.get("text"), message);
  assert.equal(whatsappChatUrl("invalid", message), null);
  assert.equal(whatsappChatUrl("081200000000", " "), null);
});

test("combined draft uses selected tasks from exactly one case and leaves instructions intact", () => {
  const tasks = [
    { id: "t1", caseId: "c1", instruction: "Kirim foto komposisi." },
    { id: "t2", caseId: "c1", instruction: "Perjelas nama bahan." },
  ];
  const original = structuredClone(tasks);
  const draft = composeWhatsAppDraft({
    businessName: "Usaha Contoh",
    greetingName: "Bu Rina",
    tasks,
  });
  assert.match(draft, /Halo Bu Rina/);
  assert.match(draft, /1\. Kirim foto komposisi\.\n2\. Perjelas nama bahan\./);
  assert.deepEqual(tasks, original);
  assert.throws(() =>
    composeWhatsAppDraft({
      businessName: "Contoh",
      tasks: [tasks[0], { ...tasks[1], caseId: "c2" }],
    }),
  );
  assert.throws(() =>
    composeWhatsAppDraft({
      businessName: "Contoh",
      tasks: [tasks[0], tasks[0]],
    }),
  );
  assert.throws(() =>
    composeWhatsAppDraft({ businessName: "Contoh", tasks: [] }),
  );
  assert.throws(() =>
    composeWhatsAppDraft({
      businessName: "Contoh",
      tasks: [{ ...tasks[0], instruction: " " }],
    }),
  );
});
