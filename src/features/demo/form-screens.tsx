"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { normalizeWhatsAppNumber } from "@/lib/domain/whatsapp";
import { staff, type Contact, type DemoState } from "./model";
import { useDemo, updateDemo } from "./store";
import { visibleCases, visibleContacts } from "./logic";
import { Icon, Notice, PageHeader, StateView } from "./ui";

type Errors = Record<string, string>;
export function Field({
  id,
  label,
  value,
  onChange,
  error,
  hint,
  required,
  type = "text",
  multiline = false,
  placeholder,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  hint?: string;
  required?: boolean;
  type?: string;
  multiline?: boolean;
  placeholder?: string;
  autoComplete?: string;
}) {
  const attributes = {
    id,
    name: id,
    value,
    onChange: (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => onChange(event.target.value),
    required,
    placeholder,
    "aria-invalid": error ? (true as const) : undefined,
    "aria-describedby": error ? `${id}-error` : hint ? `${id}-hint` : undefined,
  };
  return (
    <div className="field">
      <label htmlFor={id}>
        {label}
        {!required && <span>Opsional</span>}
      </label>
      {multiline ? (
        <textarea {...attributes} rows={4} maxLength={1000} />
      ) : (
        <input
          {...attributes}
          type={type}
          autoComplete={autoComplete}
          inputMode={
            type === "tel" ? "tel" : type === "email" ? "email" : undefined
          }
          maxLength={type === "date" ? undefined : 160}
        />
      )}
      {hint && !error && (
        <p className="field-hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      {error && (
        <p className="field-error" id={`${id}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

function ErrorSummary({ errors }: { errors: Errors }) {
  const entries = Object.entries(errors).filter(([, message]) =>
    Boolean(message),
  );
  return entries.length ? (
    <div className="form-errors" role="alert" tabIndex={-1} id="form-errors">
      <Icon name="alert" size={18} />
      <div>
        <strong>Periksa isian berikut</strong>
        {entries.map(([key, message]) => (
          <a key={key} href={`#${key}`}>
            {message}
          </a>
        ))}
      </div>
    </div>
  ) : null;
}
function focusError(errors: Errors) {
  requestAnimationFrame(() =>
    document.getElementById(Object.keys(errors)[0])?.focus(),
  );
}
function FormActions({
  label,
  back,
  children,
}: {
  label: string;
  back: string;
  children?: ReactNode;
}) {
  return (
    <div className="form-actions">
      {children}
      <button className="button primary full" type="submit">
        <Icon name="check" size={19} />
        {label}
      </button>
      <Link className="button text full" href={back}>
        Batal
      </Link>
    </div>
  );
}
function addHistory(
  state: DemoState,
  caseId: string,
  title: string,
  detail: string,
): DemoState {
  return {
    ...state,
    history: [
      {
        id: crypto.randomUUID(),
        caseId,
        actorId: state.staffId!,
        title,
        detail,
        at: new Date().toISOString(),
      },
      ...state.history,
    ],
  };
}

export function ContactFormScreen({ contactId }: { contactId?: string }) {
  const state = useDemo();
  const router = useRouter();
  const existing = state.contacts.find((entry) => entry.id === contactId);
  const [name, setName] = useState(existing?.name ?? "");
  const [phone, setPhone] = useState(existing?.phone ?? "");
  const [greeting, setGreeting] = useState(existing?.greeting ?? "");
  const [different, setDifferent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [failure, setFailure] = useState("");
  const intent = useRef<string | null>(null);
  const duplicates = state.contacts.filter(
    (entry) =>
      entry.id !== contactId &&
      entry.ownerId === state.staffId &&
      entry.phone === normalizeWhatsAppNumber(phone),
  );
  const coordinator =
    staff.find((person) => person.id === state.staffId)?.role === "coordinator";
  if (
    coordinator ||
    (contactId &&
      !visibleContacts(state).some((entry) => entry.id === contactId))
  )
    return <StateView kind="restricted" />;
  function submit(event: FormEvent) {
    event.preventDefault();
    const next: Errors = {};
    const normalized = normalizeWhatsAppNumber(phone);
    if (!name.trim()) next.businessName = "Isi nama usaha.";
    if (!normalized)
      next.phone = "Isi nomor WhatsApp dengan format 08 atau +62 yang benar.";
    if (duplicates.length && !different)
      next.confirmDifferent =
        "Konfirmasikan bahwa nomor yang sama mewakili usaha berbeda.";
    setErrors(next);
    if (Object.keys(next).length) {
      focusError(next);
      return;
    }
    const id = contactId ?? (intent.current ??= crypto.randomUUID());
    try {
      updateDemo((current) =>
        contactId
          ? {
              ...current,
              contacts: current.contacts.map((entry) =>
                entry.id === contactId
                  ? {
                      ...entry,
                      name: name.trim(),
                      phone: normalized!,
                      greeting: greeting.trim(),
                    }
                  : entry,
              ),
            }
          : current.contacts.some((entry) => entry.id === id)
            ? current
            : {
                ...current,
                contacts: [
                  ...current.contacts,
                  {
                    id,
                    ownerId: current.staffId!,
                    name: name.trim(),
                    phone: normalized!,
                    greeting: greeting.trim(),
                    category: "Usaha binaan",
                  },
                ],
              },
      );
      router.push("/kontak");
    } catch (error) {
      setFailure((error as Error).message);
    }
  }
  return (
    <>
      <PageHeader
        title={contactId ? "Ubah kontak" : "Tambah kontak"}
        back="/kontak"
      />
      <p className="page-description">
        Simpan kontak pemilik usaha untuk memudahkan tindak lanjut.
      </p>
      <form noValidate onSubmit={submit} className="form-panel">
        <ErrorSummary errors={errors} />
        <Field
          id="businessName"
          label="Nama usaha"
          value={name}
          onChange={(value) => {
            setName(value);
            setErrors({ ...errors, businessName: "" });
          }}
          error={errors.businessName}
          placeholder="Contoh: Keripik Bu Rina"
          required
        />
        <Field
          id="phone"
          label="Nomor WhatsApp"
          value={phone}
          onChange={(value) => {
            setPhone(value);
            setDifferent(false);
            setErrors({ ...errors, phone: "", confirmDifferent: "" });
          }}
          error={errors.phone}
          type="tel"
          autoComplete="tel"
          placeholder="08xx xxxx xxxx"
          hint="Nomor Indonesia otomatis disimpan dengan awalan 62."
          required
        />
        <Field
          id="greeting"
          label="Nama sapaan"
          value={greeting}
          onChange={setGreeting}
          placeholder="Contoh: Bu Rina"
          hint="Digunakan pada sapaan draf WhatsApp."
        />
        {duplicates.length > 0 && (
          <div className="duplicate-panel">
            <h2>Nomor ini sudah tersimpan</h2>
            {duplicates.map((entry) => (
              <p key={entry.id}>{entry.name}</p>
            ))}
            <label className="checkbox-row">
              <input
                id="confirmDifferent"
                type="checkbox"
                checked={different}
                onChange={(event) => setDifferent(event.target.checked)}
                aria-describedby={
                  errors.confirmDifferent ? "duplicate-error" : undefined
                }
              />
              <span>Ini usaha berbeda yang memakai nomor yang sama.</span>
            </label>
            {errors.confirmDifferent && (
              <p id="duplicate-error" className="field-error">
                {errors.confirmDifferent}
              </p>
            )}
          </div>
        )}
        {failure && <Notice error>{failure}</Notice>}
        <FormActions
          label={contactId ? "Simpan perubahan" : "Simpan kontak"}
          back="/kontak"
        />
      </form>
      <p className="end-note">Data disimpan sebagai contoh di browser ini.</p>
    </>
  );
}

export function CaseFormScreen({
  contactId = "",
  caseId,
}: {
  contactId?: string;
  caseId?: string;
}) {
  const state = useDemo();
  const router = useRouter();
  const contacts = visibleContacts(state);
  const editing = state.cases.find((entry) => entry.id === caseId);
  const expectedVersion = useRef(editing?.version);
  const [mode, setMode] = useState<"existing" | "new">(
    contacts.length ? "existing" : "new",
  );
  const [selected, setSelected] = useState(
    editing?.contactId || contactId || contacts[0]?.id || "",
  );
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [greeting, setGreeting] = useState("");
  const [reference, setReference] = useState(editing?.reference ?? "");
  const [different, setDifferent] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [failure, setFailure] = useState("");
  const intent = useRef<{ caseId: string; contactId: string } | null>(null);
  const duplicates = state.contacts.filter(
    (entry) =>
      entry.ownerId === state.staffId &&
      entry.phone === normalizeWhatsAppNumber(phone),
  );
  if (
    staff.find((person) => person.id === state.staffId)?.role ===
      "coordinator" ||
    (caseId && editing?.assigneeId !== state.staffId)
  )
    return <StateView kind="restricted" />;
  function submit(event: FormEvent) {
    event.preventDefault();
    const next: Errors = {};
    if (mode === "existing" && !contacts.some((entry) => entry.id === selected))
      next.contact = "Pilih kontak usaha terlebih dahulu.";
    const normalized = normalizeWhatsAppNumber(phone);
    if (mode === "new") {
      if (!name.trim()) next.businessName = "Isi nama usaha.";
      if (!normalized) next.phone = "Isi nomor WhatsApp yang valid.";
      if (duplicates.length && !different)
        next.confirmDifferent =
          "Konfirmasikan usaha berbeda atau gunakan kontak yang sudah ada.";
    }
    setErrors(next);
    if (Object.keys(next).length) {
      focusError(next);
      return;
    }
    const ids = (intent.current ??= {
      caseId: caseId ?? crypto.randomUUID(),
      contactId: crypto.randomUUID(),
    });
    try {
      updateDemo((current) => {
        if (!caseId && current.cases.some((entry) => entry.id === ids.caseId))
          return current;
        if (caseId) {
          const latest = current.cases.find((entry) => entry.id === caseId);
          if (
            latest?.assigneeId !== current.staffId ||
            latest?.version !== expectedVersion.current
          )
            throw new Error(
              "Informasi kasus sudah berubah. Buka kembali kasus terbaru sebelum menyimpan.",
            );
        }
        const contact: Contact = {
          id: ids.contactId,
          name: name.trim(),
          phone: normalized ?? "",
          greeting: greeting.trim(),
          ownerId: current.staffId!,
          category: "Usaha binaan",
        };
        return addHistory(
          {
            ...current,
            contacts:
              mode === "new"
                ? [...current.contacts, contact]
                : current.contacts,
            cases: caseId
              ? current.cases.map((entry) =>
                  entry.id === caseId
                    ? {
                        ...entry,
                        contactId: mode === "new" ? ids.contactId : selected,
                        reference: reference.trim(),
                        version: entry.version + 1,
                      }
                    : entry,
                )
              : [
                  ...current.cases,
                  {
                    id: ids.caseId,
                    contactId: mode === "new" ? ids.contactId : selected,
                    assigneeId: current.staffId!,
                    reference: reference.trim(),
                    createdAt: "2026-11-19",
                    version: 1,
                  },
                ],
          },
          ids.caseId,
          caseId ? "Informasi kasus diperbarui" : "Kasus dibuat",
          caseId
            ? "Kontak atau rujukan pengajuan diperbarui."
            : "Pengajuan baru ditambahkan ke daftar pendampingan.",
        );
      });
      router.push(`/kasus/${ids.caseId}`);
    } catch (error) {
      setFailure((error as Error).message);
    }
  }
  const existing = contacts.find((entry) => entry.id === selected);
  return (
    <>
      <PageHeader
        title={caseId ? "Ubah kasus" : "Buat kasus"}
        back={caseId ? `/kasus/${caseId}` : "/kasus"}
      />
      <p className="page-description">
        Satu kasus untuk satu pengajuan sertifikasi halal.
      </p>
      <form noValidate onSubmit={submit} className="form-panel">
        <ErrorSummary errors={errors} />
        <fieldset className="segmented-control">
          <legend className="sr-only">Sumber kontak</legend>
          <label className={mode === "existing" ? "selected" : ""}>
            <input
              type="radio"
              name="contactMode"
              checked={mode === "existing"}
              onChange={() => setMode("existing")}
            />
            <span>Kontak tersimpan</span>
          </label>
          <label className={mode === "new" ? "selected" : ""}>
            <input
              type="radio"
              name="contactMode"
              checked={mode === "new"}
              onChange={() => setMode("new")}
            />
            <span>Kontak baru</span>
          </label>
        </fieldset>
        {mode === "existing" ? (
          <>
            <div className="field">
              <label htmlFor="contact">Pilih usaha</label>
              <select
                id="contact"
                name="contact"
                required
                value={selected}
                onChange={(event) => setSelected(event.target.value)}
                aria-invalid={Boolean(errors.contact)}
              >
                <option value="">Pilih kontak usaha</option>
                {contacts.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </select>
              {errors.contact && (
                <p className="field-error">{errors.contact}</p>
              )}
            </div>
            {existing && (
              <div className="selected-contact">
                <span className="business-symbol">
                  <Icon name="contacts" />
                </span>
                <div>
                  <strong>{existing.name}</strong>
                  <p>+{existing.phone}</p>
                </div>
                <Icon name="check" size={18} />
              </div>
            )}
          </>
        ) : (
          <>
            <Field
              id="businessName"
              label="Nama usaha"
              value={name}
              onChange={setName}
              error={errors.businessName}
              required
              placeholder="Nama usaha yang didampingi"
            />
            <Field
              id="phone"
              label="Nomor WhatsApp"
              value={phone}
              onChange={(value) => {
                setPhone(value);
                setDifferent(false);
              }}
              error={errors.phone}
              type="tel"
              required
              placeholder="08xx xxxx xxxx"
            />
            <Field
              id="greeting"
              label="Nama sapaan"
              value={greeting}
              onChange={setGreeting}
              placeholder="Contoh: Bu Sari"
            />
            {duplicates.length > 0 && (
              <div className="duplicate-panel">
                <h2>Nomor sudah digunakan</h2>
                {duplicates.map((entry) => (
                  <button
                    type="button"
                    className="text-link"
                    key={entry.id}
                    onClick={() => {
                      setSelected(entry.id);
                      setMode("existing");
                    }}
                  >
                    Gunakan kontak {entry.name}
                  </button>
                ))}
                <label className="checkbox-row">
                  <input
                    id="confirmDifferent"
                    type="checkbox"
                    checked={different}
                    onChange={(event) => setDifferent(event.target.checked)}
                  />
                  <span>Ini usaha berbeda dengan nomor yang sama.</span>
                </label>
                {errors.confirmDifferent && (
                  <p className="field-error">{errors.confirmDifferent}</p>
                )}
              </div>
            )}
          </>
        )}
        <Field
          id="reference"
          label="Nomor pengajuan resmi"
          value={reference}
          onChange={setReference}
          placeholder="Contoh: SH-2026-08240"
          hint="Bisa ditambahkan ketika nomor sudah tersedia."
        />
        <Notice>
          Penanggung jawab kasus ini adalah Anda. Koordinator dapat
          mengalihkannya nanti.
        </Notice>
        {failure && <Notice error>{failure}</Notice>}
        <FormActions
          label={caseId ? "Simpan perubahan" : "Buat kasus"}
          back={caseId ? `/kasus/${caseId}` : "/kasus"}
        />
      </form>
    </>
  );
}

export function TaskFormScreen({ caseId = "" }: { caseId?: string }) {
  const state = useDemo();
  const router = useRouter();
  const cases = visibleCases(state).filter(
    (entry) => entry.assigneeId === state.staffId,
  );
  const [selected, setSelected] = useState(caseId || cases[0]?.id || "");
  const [instruction, setInstruction] = useState("");
  const [followUp, setFollowUp] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [failure, setFailure] = useState("");
  const intent = useRef<string | null>(null);
  if (
    staff.find((person) => person.id === state.staffId)?.role === "coordinator"
  )
    return <StateView kind="restricted" />;
  function submit(event: FormEvent) {
    event.preventDefault();
    const next: Errors = {};
    if (!cases.some((entry) => entry.id === selected))
      next.caseId = "Pilih kasus yang Anda tangani.";
    if (!instruction.trim())
      next.instruction =
        "Tulis satu arahan yang bisa dikerjakan pemilik usaha.";
    setErrors(next);
    if (Object.keys(next).length) {
      focusError(next);
      return;
    }
    const id = (intent.current ??= crypto.randomUUID());
    try {
      updateDemo((current) => {
        if (current.tasks.some((entry) => entry.id === id)) return current;
        const item = current.cases.find((entry) => entry.id === selected);
        if (item?.assigneeId !== current.staffId)
          throw new Error(
            "Penanggung jawab sudah berubah. Buka kembali kasus terbaru.",
          );
        return addHistory(
          {
            ...current,
            tasks: [
              ...current.tasks,
              {
                id,
                caseId: selected,
                instruction: instruction.trim(),
                status: "needs_sending",
                followUpOn: followUp || null,
                version: 1,
              },
            ],
          },
          selected,
          "Revisi baru dicatat",
          "Satu permintaan ditambahkan dengan status perlu dikirim.",
        );
      });
      router.push(`/kasus/${selected}`);
    } catch (error) {
      setFailure((error as Error).message);
    }
  }
  return (
    <>
      <PageHeader
        title="Tambah revisi"
        back={caseId ? `/kasus/${caseId}` : "/"}
      />
      <p className="page-description">
        Tulis permintaan yang jelas dan bisa langsung dikerjakan.
      </p>
      <form noValidate onSubmit={submit} className="form-panel">
        <ErrorSummary errors={errors} />
        <div className="field">
          <label htmlFor="caseId">Kasus usaha</label>
          <select
            id="caseId"
            name="caseId"
            required
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
            aria-invalid={Boolean(errors.caseId)}
            aria-describedby={errors.caseId ? "caseId-error" : undefined}
          >
            <option value="">Pilih kasus</option>
            {cases.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {
                  state.contacts.find(
                    (contact) => contact.id === entry.contactId,
                  )?.name
                }{" "}
                · {entry.reference || "Pengajuan baru"}
              </option>
            ))}
          </select>
          {errors.caseId && (
            <p id="caseId-error" className="field-error">
              {errors.caseId}
            </p>
          )}
          {!cases.length && (
            <Link className="text-link" href="/kasus/baru">
              Buat kasus terlebih dahulu
            </Link>
          )}
        </div>
        <Field
          id="instruction"
          label="Apa yang perlu diperbaiki?"
          value={instruction}
          onChange={(value) => {
            setInstruction(value);
            if (errors.instruction) setErrors({ ...errors, instruction: "" });
          }}
          error={errors.instruction}
          required
          multiline
          placeholder="Contoh: Kirim ulang foto komposisi bumbu balado dengan tulisan yang terbaca jelas."
          hint="Satu tugas untuk satu permintaan. Pisahkan permintaan berbeda agar balasannya bisa dilacak."
        />
        <Field
          id="followUp"
          label="Tanggal tindak lanjut"
          value={followUp}
          onChange={setFollowUp}
          type="date"
          hint="Masuk Hubungi hari ini setelah permintaan ditandai menunggu dan tanggalnya tiba."
        />
        <div className="status-hint">
          <span className="status-dot" />
          <span>
            Revisi baru akan berstatus <strong>Perlu dikirim</strong>.
          </span>
        </div>
        {failure && <Notice error>{failure}</Notice>}
        <FormActions
          label="Simpan revisi"
          back={caseId ? `/kasus/${caseId}` : "/"}
        />
      </form>
    </>
  );
}
