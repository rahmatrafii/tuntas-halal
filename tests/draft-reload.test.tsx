import assert from "node:assert/strict";
import { test } from "node:test";
import "./dom-setup";
import { cleanup, render, screen } from "@testing-library/react";
import { DraftScreen } from "../src/features/demo/draft-screen";
import { initialState } from "../src/features/demo/model";

test("fresh page load restores the stored draft instead of the URL's initial selection", () => {
  const saved = structuredClone(initialState);
  saved.drafts["kasus-rina"] = {
    selected: ["t-rina-2"],
    message: "Draf sebelum halaman dimuat ulang.",
  };
  localStorage.setItem("revisi-halal-demo-v1", JSON.stringify(saved));

  try {
    render(<DraftScreen id="kasus-rina" selectedId="t-rina-1" />);
    assert.equal(
      (screen.getByRole("textbox", {
        name: "Isi draf pesan WhatsApp",
      }) as HTMLTextAreaElement).value,
      "Draf sebelum halaman dimuat ulang.",
    );
    assert.deepEqual(
      (screen.getAllByRole("checkbox") as HTMLInputElement[]).map(
        (checkbox) => checkbox.checked,
      ),
      [false, true],
    );
    assert.deepEqual(
      JSON.parse(localStorage.getItem("revisi-halal-demo-v1")!),
      saved,
    );
  } finally {
    cleanup();
  }
});
