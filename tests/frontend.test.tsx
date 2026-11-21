import assert from "node:assert/strict";
import { afterEach, beforeEach, test } from "node:test";
import { dom } from "./dom-setup";
import type { ReactNode } from "react";
import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

import { render, screen, cleanup, waitFor, act, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { QueueScreen } from "../src/features/demo/queue-screen";
import {
  CaseFormScreen,
  ContactFormScreen,
  TaskFormScreen,
} from "../src/features/demo/form-screens";
import { DraftScreen } from "../src/features/demo/draft-screen";
import { LoginScreen } from "../src/features/demo/account-screens";
import { TaskScreen } from "../src/features/demo/task-screen";
import { CaseScreen } from "../src/features/demo/case-screen";
import { resetDemo, updateDemo } from "../src/features/demo/store";
const navigation: string[] = [];
const router: AppRouterInstance = {
  bfcacheId: "test-route",
  back() {},
  forward() {},
  refresh() {},
  push(href) {
    navigation.push(href);
  },
  replace(href) {
    navigation.push(href);
  },
  prefetch: async () => {},
};
function mount(children: ReactNode) {
  return render(
    <AppRouterContext.Provider value={router}>
      {children}
    </AppRouterContext.Provider>,
  );
}
function snapshot() {
  return JSON.parse(localStorage.getItem("revisi-halal-demo-v1")!);
}
beforeEach(() => {
  resetDemo();
  navigation.length = 0;
});
afterEach(() => cleanup());

test("queue search and completed filter change the visible task list", async () => {
  const user = userEvent.setup();
  mount(<QueueScreen />);
  const input = screen.getByRole("searchbox", {
    name: "Cari nama usaha atau nomor pengajuan",
  });
  await user.type(input, "SH-2026-08156");
  assert.equal(
    screen.queryByRole("heading", { name: "Keripik Bu Rina" }),
    null,
  );
  assert.equal(
    screen.getAllByRole("heading", { name: "Dapur Sari Rasa" }).length,
    2,
  );
  await user.clear(input);
  await user.click(screen.getByRole("button", { name: /^Selesai$/ }));
  assert.equal(
    screen.queryByText(
      "Kirim foto label margarin lengkap dengan nama produsen.",
    ),
    null,
  );
  assert.ok(screen.getByText("Perbarui daftar bahan pada formulir pengajuan."));
});

test("contact form validates empty input, detects duplicate phone, and requires confirmation", async () => {
  const user = userEvent.setup();
  mount(<ContactFormScreen />);
  await user.click(screen.getByRole("button", { name: "Simpan kontak" }));
  assert.ok(screen.getByRole("alert"));
  assert.equal(snapshot().contacts.length, 6);
  await user.type(screen.getByLabelText("Nama usaha"), "Usaha Kedua Rina");
  await user.type(screen.getByLabelText("Nomor WhatsApp"), "081200000101");
  assert.ok(screen.getByText("Nomor ini sudah tersimpan"));
  await user.click(screen.getByRole("button", { name: "Simpan kontak" }));
  assert.equal(snapshot().contacts.length, 6);
  await user.click(screen.getByRole("checkbox"));
  await user.click(screen.getByRole("button", { name: "Simpan kontak" }));
  assert.equal(snapshot().contacts.length, 7);
  assert.equal(navigation.at(-1), "/kontak");
});

test("new revision rejects whitespace and repeated save does not duplicate the task", async () => {
  const user = userEvent.setup();
  mount(<TaskFormScreen caseId="kasus-rina" />);
  await user.type(screen.getByLabelText("Apa yang perlu diperbaiki?"), "   ");
  await user.click(screen.getByRole("button", { name: "Simpan revisi" }));
  assert.equal(snapshot().tasks.length, 11);
  await user.type(
    screen.getByLabelText("Apa yang perlu diperbaiki?"),
    "Kirim foto label bahan baru.",
  );
  await user.dblClick(screen.getByRole("button", { name: "Simpan revisi" }));
  assert.equal(snapshot().tasks.length, 12);
  assert.equal(snapshot().tasks.at(-1).status, "needs_sending");
});

test("case form edits the official reference without creating another contact or case", async () => {
  const user = userEvent.setup();
  mount(<CaseFormScreen caseId="kasus-rina" />);
  const reference = screen.getByLabelText(/Nomor pengajuan resmi/);
  await user.clear(reference);
  await user.type(reference, "SH-2026-09999");
  await user.click(screen.getByRole("button", { name: "Simpan perubahan" }));
  assert.equal(snapshot().cases.length, 7);
  assert.equal(snapshot().contacts.length, 6);
  assert.equal(
    snapshot().cases.find((item: { id: string }) => item.id === "kasus-rina")
      .reference,
    "SH-2026-09999",
  );
});

test("draft preview does not change status; confirmation updates selected task only", async () => {
  const user = userEvent.setup();
  mount(<DraftScreen id="kasus-rina" selectedId="t-rina-1" />);
  await user.click(screen.getByRole("button", { name: /^Buka WhatsApp$/ }));
  assert.ok(screen.getByRole("dialog", { name: "Pratinjau chat" }));
  assert.equal(
    snapshot().tasks.find((task: { id: string }) => task.id === "t-rina-1")
      .version,
    1,
  );
  await user.click(screen.getByRole("button", { name: "Kembali ke draf" }));
  await user.click(
    screen.getByRole("button", { name: "Tandai sudah dikirim" }),
  );
  assert.equal(
    snapshot().tasks.find((task: { id: string }) => task.id === "t-rina-1")
      .version,
    2,
  );
  assert.equal(
    snapshot().tasks.find((task: { id: string }) => task.id === "t-rina-2")
      .version,
    1,
  );
  assert.ok(screen.getByText("Pengiriman sudah dicatat"));
});

test("edited draft persists between screens without changing the instruction", async () => {
  const user = userEvent.setup();
  const view = mount(<DraftScreen id="kasus-rina" />);
  const textarea = screen.getByRole("textbox", {
    name: "Isi draf pesan WhatsApp",
  });
  await user.clear(textarea);
  await user.type(textarea, "Pesan khusus untuk Bu Rina.");
  const instruction = snapshot().tasks[0].instruction;
  view.unmount();
  mount(<DraftScreen id="kasus-rina" />);
  assert.equal(
    (
      screen.getByRole("textbox", {
        name: "Isi draf pesan WhatsApp",
      }) as HTMLTextAreaElement
    ).value,
    "Pesan khusus untuk Bu Rina.",
  );
  assert.equal(snapshot().tasks[0].instruction, instruction);
});

test("saved draft and task choices survive reopening a task-specific link", async () => {
  const user = userEvent.setup();
  const view = mount(
    <DraftScreen id="kasus-rina" selectedId="t-rina-1" />,
  );
  const checkboxes = screen.getAllByRole("checkbox") as HTMLInputElement[];
  assert.deepEqual(checkboxes.map((checkbox) => checkbox.checked), [true, false]);
  await user.click(checkboxes[1]);
  const message = screen.getByRole("textbox", {
    name: "Isi draf pesan WhatsApp",
  });
  await user.clear(message);
  await user.type(message, "Pesan tersimpan setelah reload.");
  assert.equal(
    snapshot().drafts["kasus-rina"].message,
    "Pesan tersimpan setelah reload.",
  );

  view.unmount();
  mount(<DraftScreen id="kasus-rina" selectedId="t-rina-1" />);

  assert.equal(
    (screen.getByRole("textbox", {
      name: "Isi draf pesan WhatsApp",
    }) as HTMLTextAreaElement).value,
    "Pesan tersimpan setelah reload.",
  );
  assert.deepEqual(
    (screen.getAllByRole("checkbox") as HTMLInputElement[]).map(
      (checkbox) => checkbox.checked,
    ),
    [true, true],
  );
});

test("invalid phone blocks chat preview while keeping copy and correction actions available", async () => {
  act(() =>
    updateDemo((state) => ({
      ...state,
      contacts: state.contacts.map((contact) =>
        contact.id === "rina" ? { ...contact, phone: "invalid" } : contact,
      ),
    })),
  );
  mount(<DraftScreen id="kasus-rina" />);
  assert.equal(
    (screen.getByRole("button", { name: "Buka WhatsApp" }) as HTMLButtonElement)
      .disabled,
    true,
  );
  assert.equal(
    (screen.getByRole("button", { name: "Salin pesan" }) as HTMLButtonElement)
      .disabled,
    false,
  );
  assert.ok(screen.getByRole("link", { name: "Koreksi nomor kontak" }));
});

test("failed browser save retains entered form data and supports retry", async () => {
  const user = userEvent.setup();
  mount(<ContactFormScreen />);
  await user.type(screen.getByLabelText("Nama usaha"), "Usaha Percobaan");
  await user.type(screen.getByLabelText("Nomor WhatsApp"), "081200000999");
  const original = dom.window.Storage.prototype.setItem;
  dom.window.Storage.prototype.setItem = () => {
    throw new Error("storage unavailable");
  };
  try {
    await user.click(screen.getByRole("button", { name: "Simpan kontak" }));
  } finally {
    dom.window.Storage.prototype.setItem = original;
  }
  assert.equal(
    (screen.getByLabelText("Nama usaha") as HTMLInputElement).value,
    "Usaha Percobaan",
  );
  assert.match(
    screen.getByRole("alert").textContent!,
    /Penyimpanan browser tidak tersedia/,
  );
  await user.click(screen.getByRole("button", { name: "Simpan kontak" }));
  assert.equal(
    snapshot().contacts.filter(
      (contact: { name: string }) => contact.name === "Usaha Percobaan",
    ).length,
    1,
  );
});

test("staff invitation is simulated and coordinator demo login updates the session", async () => {
  const user = userEvent.setup();
  mount(<LoginScreen />);
  await user.type(screen.getByLabelText("Email undangan"), "ratna@contoh.test");
  await user.click(screen.getByRole("button", { name: "Kirim tautan masuk" }));
  assert.ok(screen.getByText("Periksa email undangan"));
  await user.click(screen.getByRole("button", { name: "Buka tautan demo" }));
  await waitFor(() => assert.equal(snapshot().staffId, "ratna"));
  assert.equal(navigation.at(-1), "/");
});

test("completion requires explicit confirmation of review and official update", async () => {
  const user = userEvent.setup(); mount(<TaskScreen id="t-sari-1" />);
  await user.click(screen.getByRole("radio", { name: /^Selesai/ }));
  await user.click(screen.getByRole("button", { name: "Simpan perubahan" }));
  assert.equal(snapshot().tasks.find((task: { id: string }) => task.id === "t-sari-1").status, "needs_review");
  await user.click(screen.getByRole("checkbox"));
  await user.click(screen.getByRole("button", { name: "Simpan perubahan" }));
  assert.equal(snapshot().tasks.find((task: { id: string }) => task.id === "t-sari-1").status, "completed");
});

test("coordinator can transfer through the dialog and the former assignee loses case visibility", async () => {
  act(() => updateDemo((state) => ({ ...state, staffId: "ratna" })));
  const user = userEvent.setup(); mount(<CaseScreen id="kasus-rina" />);
  await user.click(screen.getByRole("button", { name: "Alihkan penanggung jawab" }));
  const dialog = screen.getByRole("dialog", { name: "Alihkan pendamping" });
  await user.click(within(dialog).getByRole("radio", { name: /Farhan Akbar/ }));
  await user.click(within(dialog).getByRole("button", { name: "Alihkan penanggung jawab" }));
  assert.equal(snapshot().cases.find((item: { id: string }) => item.id === "kasus-rina").assigneeId, "farhan");
  act(() => updateDemo((state) => ({ ...state, staffId: "nadia" })));
  assert.ok(screen.getByRole("heading", { name: "Akses kasus terbatas" }));
});
