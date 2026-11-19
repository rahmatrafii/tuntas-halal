"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { staff } from "./model";
import { resetDemo, updateDemo, useDemo } from "./store";
import { filterTasks, tasksForCase, visibleCases } from "./logic";
import { Field } from "./form-screens";
import {
  Avatar,
  Dialog,
  Icon,
  Notice,
  PageHeader,
  SectionHeading,
  StateView,
} from "./ui";

export function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sentTo, setSentTo] = useState("");
  const person = staff.find((entry) => `${entry.id}@contoh.test` === sentTo);
  function login(id: string) {
    try {
      updateDemo((state) => ({ ...state, staffId: id }));
      router.push("/");
    } catch (failure) {
      setError((failure as Error).message);
    }
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    if (
      !staff.some(
        (entry) => `${entry.id}@contoh.test` === email.trim().toLowerCase(),
      )
    ) {
      setError(
        "Gunakan email undangan contoh, seperti nadia@contoh.test atau ratna@contoh.test.",
      );
      document.getElementById("email")?.focus();
      return;
    }
    setSentTo(email.trim().toLowerCase());
    setError("");
  }
  return (
    <div className="login-layout">
      <section className="login-intro">
        <Link href="/" className="login-brand">
          <span className="brand-icon">
            <Icon name="shield" size={25} />
          </span>
          <strong>Revisi Halal</strong>
        </Link>
        <div className="login-visual">
          <span className="login-invite-label">
            <Icon name="shield" size={17} />
            Untuk staf undangan
          </span>
          <h1>
            Revisi tertata.
            <br />
            Pendampingan
            <br />
            tetap dekat.
          </h1>
          <p>
            Temukan tindakan berikutnya, lalu lanjutkan percakapan dengan
            pemilik usaha.
          </p>
          <div className="login-sample">
            <span className="sample-check">
              <Icon name="check" size={18} />
            </span>
            <div>
              <strong>Satu langkah lebih dekat</strong>
              <p>Setiap perbaikan tercatat dengan jelas.</p>
            </div>
          </div>
        </div>
      </section>
      <section className="login-form-section">
        {sentTo ? (
          <div className="login-success">
            <span className="state-symbol success-symbol">
              <Icon name="message" size={28} />
            </span>
            <h2>Periksa email undangan</h2>
            <p>
              Tautan masuk untuk <strong>{sentTo}</strong> siap dicoba.
            </p>
            <Notice>
              Di prototipe ini, email tidak dikirim. Gunakan tombol berikut
              untuk menyimulasikan tautan masuk.
            </Notice>
            <button
              className="button primary full"
              onClick={() => login(person!.id)}
            >
              Buka tautan demo
            </button>
            <button className="button text full" onClick={() => setSentTo("")}>
              Gunakan email lain
            </button>
          </div>
        ) : (
          <>
            <span className="demo-tag">Prototipe interaktif</span>
            <h2>Selamat datang kembali</h2>
            <p className="page-description">
              Masuk menggunakan email yang diundang oleh koordinator LP3H.
            </p>
            <form onSubmit={submit} noValidate>
              <Field
                id="email"
                label="Email undangan"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(value) => {
                  setEmail(value);
                  setError("");
                }}
                required
                error={error}
                placeholder="nama@lembaga.id"
              />
              <button className="button primary full" type="submit">
                Kirim tautan masuk
              </button>
            </form>
            <div className="login-divider">
              <span>Atau jelajahi akun contoh</span>
            </div>
            <div className="demo-logins">
              <button onClick={() => login("nadia")}>
                <Avatar id="nadia" />
                <span>
                  <strong>Pendamping</strong>
                  <small>Nadia Putri</small>
                </span>
                <Icon name="chevron" size={18} />
              </button>
              <button onClick={() => login("ratna")}>
                <Avatar id="ratna" />
                <span>
                  <strong>Koordinator</strong>
                  <small>Ratna Sari</small>
                </span>
                <Icon name="chevron" size={18} />
              </button>
            </div>
            <p className="login-help">
              <Icon name="shield" size={15} />
              Belum mendapat undangan? Hubungi koordinator LP3H Anda.
            </p>
          </>
        )}
        {error && sentTo && <Notice error>{error}</Notice>}
        <p className="login-footnote">
          Data contoh tersimpan di browser. Belum terhubung ke autentikasi atau
          layanan email.
        </p>
      </section>
    </div>
  );
}

export function AccountScreen() {
  const state = useDemo();
  const router = useRouter();
  const person = staff.find((entry) => entry.id === state.staffId) ?? staff[0];
  const [resetOpen, setResetOpen] = useState(false);
  const [notice, setNotice] = useState("");
  function switchAccount(id: string) {
    try {
      updateDemo((current) => ({ ...current, staffId: id }));
      setNotice(
        `Sekarang menggunakan akun demo ${staff.find((entry) => entry.id === id)?.name}.`,
      );
    } catch (failure) {
      setNotice((failure as Error).message);
    }
  }
  return (
    <>
      <PageHeader title="Akun & demo" back={false} />
      <section className="account-card">
        <Avatar id={person.id} size="large" />
        <h2>{person.name}</h2>
        <p>
          {person.role === "coordinator"
            ? "Koordinator LP3H"
            : "Pendamping PPH"}
        </p>
        <span className="status-badge completed">
          <Icon name="check" size={13} />
          Staf aktif
        </span>
      </section>
      <section className="info-panel">
        <h2>
          <Icon name="shield" size={20} />
          Lembaga pendamping
        </h2>
        <dl className="info-list">
          <div>
            <dt>LP3H</dt>
            <dd>Amanah Nusantara</dd>
          </div>
          <div>
            <dt>Zona waktu</dt>
            <dd>Asia/Jakarta (WIB)</dd>
          </div>
          <div>
            <dt>Tanggal acuan demo</dt>
            <dd>19 November 2026</dd>
          </div>
        </dl>
      </section>
      {notice && <Notice>{notice}</Notice>}
      <SectionHeading title="Beralih akun contoh" />
      <div className="account-switcher">
        {staff.map((entry) => (
          <button
            key={entry.id}
            onClick={() => switchAccount(entry.id)}
            className={person.id === entry.id ? "selected" : ""}
          >
            <Avatar id={entry.id} />
            <span>
              <strong>{entry.name}</strong>
              <small>
                {entry.role === "coordinator"
                  ? "Koordinator"
                  : "Pendamping PPH"}
              </small>
            </span>
            {person.id === entry.id ? (
              <Icon name="check" />
            ) : (
              <Icon name="chevron" size={17} />
            )}
          </button>
        ))}
      </div>
      <SectionHeading title="Jelajahi prototipe" />
      <div className="settings-links">
        <Link href="/tim">
          <Icon name="team" />
          <span>
            Tim pendamping<small>Ringkasan dan pengalihan kasus</small>
          </span>
          <Icon name="chevron" size={17} />
        </Link>
        <Link href="/kondisi">
          <Icon name="cases" />
          <span>
            Contoh kondisi layar
            <small>Kosong, loading, error, dan akses terbatas</small>
          </span>
          <Icon name="chevron" size={17} />
        </Link>
        <Link href="/login">
          <Icon name="shield" />
          <span>
            Lihat halaman login<small>Alur masuk melalui undangan</small>
          </span>
          <Icon name="chevron" size={17} />
        </Link>
        <button onClick={() => setResetOpen(true)}>
          <Icon name="settings" />
          <span>
            Atur ulang data contoh
            <small>Kembalikan revisi ke kondisi awal</small>
          </span>
          <Icon name="chevron" size={17} />
        </button>
      </div>
      <button
        className="button outline full"
        onClick={() => {
          try {
            updateDemo((current) => ({ ...current, staffId: null }));
            router.push("/login");
          } catch (failure) {
            setNotice((failure as Error).message);
          }
        }}
      >
        Keluar dari akun demo
      </button>
      <p className="end-note">
        Prototipe frontend. Seluruh nama, nomor, dan kasus adalah fiktif.
      </p>
      <Dialog
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Atur ulang data contoh?"
      >
        <p className="dialog-description">
          Perubahan kontak, revisi, draf, dan pengalihan pada demo ini akan
          dikembalikan ke contoh awal.
        </p>
        <button
          className="button white full"
          autoFocus
          onClick={() => setResetOpen(false)}
        >
          Pertahankan perubahan
        </button>
        <button
          className="button primary full"
          onClick={() => {
            try {
              resetDemo();
              setResetOpen(false);
              setNotice("Data contoh telah dikembalikan ke kondisi awal.");
            } catch (failure) {
              setNotice((failure as Error).message);
            }
          }}
        >
          Atur ulang demo
        </button>
      </Dialog>
    </>
  );
}

export function TeamScreen() {
  const state = useDemo();
  const [selected, setSelected] = useState("all");
  if (staff.find((entry) => entry.id === state.staffId)?.role !== "coordinator")
    return (
      <>
        <PageHeader title="Tim pendamping" back="/akun" />
        <StateView kind="restricted" />
      </>
    );
  const cases = visibleCases(state).filter(
    (item) => selected === "all" || item.assigneeId === selected,
  );
  const allTasks = filterTasks(state);
  const due = filterTasks(state, "", "contact_today");
  return (
    <>
      <PageHeader title="Tim pendamping" back="/" />
      <p className="page-description">
        Lihat pekerjaan tim dan jaga setiap kasus tetap tertangani.
      </p>
      <section className="summary-card team-summary">
        <div className="summary-top">
          <span>LP3H Amanah Nusantara</span>
          <Icon name="team" size={23} />
        </div>
        <div className="team-stats">
          <div>
            <strong>3</strong>
            <span>Pendamping aktif</span>
          </div>
          <div>
            <strong>{allTasks.length}</strong>
            <span>Revisi terbuka</span>
          </div>
          <div>
            <strong>{due.length}</strong>
            <span>Hubungi hari ini</span>
          </div>
        </div>
      </section>
      <SectionHeading title="Pendamping aktif" />
      <div className="team-list">
        {staff
          .filter((entry) => entry.role === "companion")
          .map((entry) => {
            const owned = state.cases.filter(
              (item) => item.assigneeId === entry.id,
            );
            const ids = new Set(owned.map((item) => item.id));
            const pending = state.tasks.filter(
              (task) => ids.has(task.caseId) && task.status !== "completed",
            ).length;
            return (
              <button
                key={entry.id}
                className={selected === entry.id ? "selected" : ""}
                onClick={() =>
                  setSelected(selected === entry.id ? "all" : entry.id)
                }
                aria-pressed={selected === entry.id}
              >
                <Avatar id={entry.id} />
                <span>
                  <strong>{entry.name}</strong>
                  <small>
                    {owned.length} kasus · {pending} revisi terbuka
                  </small>
                </span>
                <Icon
                  name={selected === entry.id ? "check" : "chevron"}
                  size={18}
                />
              </button>
            );
          })}
      </div>
      <SectionHeading
        title={
          selected === "all"
            ? "Kasus seluruh tim"
            : `Kasus ${staff.find((entry) => entry.id === selected)?.name.split(" ")[0]}`
        }
        count={cases.length}
        action={
          selected !== "all" && (
            <button className="section-link" onClick={() => setSelected("all")}>
              Semua
            </button>
          )
        }
      />
      <div className="team-case-list">
        {cases.map((item) => (
          <Link key={item.id} href={`/kasus/${item.id}`}>
            <span className="business-symbol">
              <Icon name="cases" />
            </span>
            <span>
              <strong>
                {
                  state.contacts.find((entry) => entry.id === item.contactId)
                    ?.name
                }
              </strong>
              <small>
                {staff.find((entry) => entry.id === item.assigneeId)?.name} ·{" "}
                {tasksForCase(state, item.id).length} revisi
              </small>
            </span>
            <Icon name="chevron" size={18} />
          </Link>
        ))}
      </div>
      <Notice>
        Untuk mengalihkan kasus, buka detail kasus lalu pilih ikon pendamping
        pada bagian penanggung jawab.
      </Notice>
    </>
  );
}

export function ConditionsScreen() {
  const [active, setActive] = useState<
    "empty" | "loading" | "error" | "restricted" | "conflict"
  >("empty");
  const [retrying, setRetrying] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [sample, setSample] = useState(
    "Kirim ulang foto komposisi bumbu balado.",
  );
  function retry() {
    setRetrying(true);
    window.setTimeout(() => {
      setRetrying(false);
      setActive("empty");
    }, 700);
  }
  return (
    <>
      <PageHeader title="Kondisi layar" back="/akun" />
      <p className="page-description">
        Pratinjau keadaan antarmuka saat data belum tersedia atau tindakan
        memerlukan perhatian.
      </p>
      <div className="filter-chips">
        {[
          { id: "empty", label: "Kosong" },
          { id: "loading", label: "Loading" },
          { id: "error", label: "Error" },
          { id: "restricted", label: "Akses terbatas" },
          { id: "conflict", label: "Konflik status" },
        ].map((entry) => (
          <button
            className={`chip ${active === entry.id ? "active" : ""}`}
            key={entry.id}
            aria-pressed={active === entry.id}
            onClick={() => setActive(entry.id as typeof active)}
          >
            {entry.label}
          </button>
        ))}
      </div>
      <div className="state-preview">
        <StateView kind={retrying ? "loading" : active} onRetry={retry} />
      </div>
      <section className="form-panel">
        <h2>Contoh gagal simpan</h2>
        <p className="field-hint">
          Coba simpan untuk melihat isian tetap tersedia.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setSaveError(true);
          }}
        >
          <Field
            id="sampleInstruction"
            label="Arahan revisi"
            value={sample}
            onChange={setSample}
            multiline
            required
          />
          {saveError && (
            <Notice error>
              Perubahan belum tersimpan. Isian tetap tersedia; coba simpan
              kembali.
            </Notice>
          )}
          <button
            className="button primary full"
            type={saveError ? "button" : "submit"}
            onClick={saveError ? () => setSaveError(false) : undefined}
          >
            {saveError ? "Coba simpan lagi" : "Simulasikan gagal simpan"}
          </button>
        </form>
      </section>
    </>
  );
}
