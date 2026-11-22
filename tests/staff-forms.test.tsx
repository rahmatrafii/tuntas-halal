import {dom} from "./dom-setup";
import assert from "node:assert/strict";
import {afterEach, test} from "node:test";
import {createElement} from "react";
import {cleanup, render, screen, waitFor} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {LoginForm, LogoutForm} from "../src/features/staff/forms";
import type {LoginState} from "../src/features/staff/auth";

afterEach(cleanup);
Object.defineProperty(globalThis, "FormData", {configurable: true, value: dom.window.FormData});

test("login preserves email during pending/failure, announces errors and enables retry", async () => {
  let resolve!: (value: LoginState) => void;
  const action = async (_: LoginState, form: FormData): Promise<LoginState> => {
    assert.equal(form.get("email"), "staff@example.test");
    return new Promise(done => {resolve = done;});
  };
  render(createElement(LoginForm, {action}));
  const user = userEvent.setup();
  const input = screen.getByLabelText(/Email undangan/);
  assert.equal(input.getAttribute("autocomplete"), "username");
  await user.type(input, "staff@example.test");
  await user.click(screen.getByRole("button", {name: "Kirim tautan masuk"}));
  await waitFor(() => assert(screen.getByRole("button", {name: "Meminta tautan…"}).hasAttribute("disabled")));
  assert.equal(screen.queryByRole("status"), null);
  resolve({status: "error", message: "Layanan belum tersedia. Coba lagi."});
  await waitFor(() => assert.match(screen.getByRole("alert").textContent!, /Coba lagi/));
  assert.equal((input as HTMLInputElement).value, "staff@example.test");
  assert.equal(screen.getByRole("button", {name: "Kirim tautan masuk"}).hasAttribute("disabled"), false);
});

test("server validation points to email and clears its displayed error when edited", async () => {
  render(createElement(LoginForm, {action: async (): Promise<LoginState> => ({status: "invalid", message: "Isi email yang valid."})}));
  const user = userEvent.setup();
  await user.click(screen.getByRole("button", {name: "Kirim tautan masuk"}));
  const input = screen.getByLabelText(/Email undangan/);
  await waitFor(() => assert.equal(document.activeElement, input));
  assert.equal(input.getAttribute("aria-invalid"), "true");
  await user.type(input, "s");
  assert.equal(input.getAttribute("aria-invalid"), "false");
});

test("logout failure remains visible with an available retry", async () => {
  render(createElement(LogoutForm, {action: async () => ({message: "Belum dapat keluar. Coba lagi."})}));
  await userEvent.setup().click(screen.getByRole("button", {name: "Keluar dari sesi ini"}));
  await waitFor(() => assert.match(screen.getByRole("alert").textContent!, /Belum dapat keluar/));
  assert.equal(screen.getByRole("button", {name: "Keluar dari sesi ini"}).hasAttribute("disabled"), false);
});
