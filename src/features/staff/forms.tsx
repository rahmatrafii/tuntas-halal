"use client";

import {useActionState, useEffect, useRef, useState} from "react";
import type {LoginState} from "./auth";

export function LoginForm({action}: {
  action: (state: LoginState, form: FormData) => Promise<LoginState>;
}) {
  const [state, submit, pending] = useActionState(action, {status: "idle"}, "/staf/login");
  const [email, setEmail] = useState(state.email ?? "");
  const [editedState, setEditedState] = useState<LoginState | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const notice = useRef<HTMLParagraphElement>(null);
  useEffect(() => {
    if (state.status === "invalid") input.current?.focus();
    if (state.status === "error") notice.current?.focus();
  }, [state]);
  const showResult = editedState !== state;
  const invalid = showResult && state.status === "invalid";
  return (
    <form action={submit} noValidate aria-label="Masuk staf undangan" aria-busy={pending}>
      <div className="field">
        <label htmlFor="staff-email">Email undangan</label>
        <input ref={input} id="staff-email" name="email" type="email" inputMode="email"
          autoComplete="username" autoCapitalize="none" autoCorrect="off" spellCheck={false}
          enterKeyHint="send" required maxLength={254} readOnly={pending} value={email}
          aria-invalid={invalid} aria-describedby={invalid ? "staff-email-error" : undefined}
          onChange={event => {setEmail(event.target.value); setEditedState(state);}} />
        {invalid && <p id="staff-email-error" className="field-error" role="alert">{state.message}</p>}
      </div>
      {showResult && state.status === "error" && <p className="notice error" role="alert" tabIndex={-1} ref={notice}>{state.message}</p>}
      {showResult && state.status === "sent" && <p className="notice" role="status">{state.message}</p>}
      <button className="button primary full" type="submit" disabled={pending}>
        {pending ? "Meminta tautan…" : "Kirim tautan masuk"}
      </button>
    </form>
  );
}

export function LogoutForm({action}: {
  action: (state: {message?: string}, form: FormData) => Promise<{message?: string}>;
}) {
  const [state, submit, pending] = useActionState(action, {});
  return <form action={submit} aria-label="Keluar dari sesi staf" aria-busy={pending}>
    {state.message && <p className="notice error" role="alert">{state.message}</p>}
    <button className="button outline full" type="submit" disabled={pending}>
      {pending ? "Mengakhiri sesi…" : "Keluar dari sesi ini"}
    </button>
  </form>;
}
