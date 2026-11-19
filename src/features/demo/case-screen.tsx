"use client";

import { useState } from "react";
import Link from "next/link";
import { staff, type Audit } from "./model";
import { useDemo, updateDemo } from "./store";
import {
  canReadCase,
  caseComplete,
  dateLabel,
  tasksForCase,
  transferCase,
} from "./logic";
import {
  Avatar,
  Dialog,
  Icon,
  Notice,
  PageHeader,
  SectionHeading,
  StateView,
  StatusBadge,
} from "./ui";

export function CaseScreen({ id }: { id: string }) {
  const state = useDemo();
  const item = state.cases.find((entry) => entry.id === id);
  const [transferOpen, setTransferOpen] = useState(false);
  const [target, setTarget] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState(false);
  if (!item || !canReadCase(state, item))
    return (
      <>
        <PageHeader title="Detail kasus" back="/kasus" />
        <StateView kind="restricted" />
      </>
    );
  const contact = state.contacts.find((entry) => entry.id === item.contactId)!;
  const tasks = tasksForCase(state, id);
  const done = tasks.filter((task) => task.status === "completed").length;
  const complete = caseComplete(state, id);
  const coordinator =
    staff.find((person) => person.id === state.staffId)?.role === "coordinator";
  const assignee = staff.find((person) => person.id === item.assigneeId)!;
  const history: Audit[] = state.history.filter((event) => event.caseId === id);
  if (!history.length)
    history.push({
      id: "created",
      caseId: id,
      actorId: assignee.id,
      title: "Kasus dibuat",
      detail: "Pengajuan ditambahkan ke daftar pendampingan.",
      at: `${item.createdAt}T09:00:00+07:00`,
    });
  async function copyReference() {
    try {
      await navigator.clipboard.writeText(item!.reference);
      setCopied(true);
    } catch {
      setError(`Salin nomor pengajuan ini secara manual: ${item!.reference}`);
    }
  }
  function transfer() {
    try {
      updateDemo((current) =>
        transferCase(
          current,
          id,
          target,
          item!.version,
          new Date().toISOString(),
        ),
      );
      setTransferOpen(false);
      setSuccess("Penanggung jawab berhasil dialihkan pada data demo.");
      setError("");
    } catch (failure) {
      setError((failure as Error).message);
    }
  }
  return (
    <>
      <PageHeader
        title="Detail kasus"
        back="/kasus"
        action={
          !coordinator ? (
            <Link
              className="icon-button soft"
              href={`/kasus/${id}/edit`}
              aria-label="Ubah informasi kasus"
            >
              <Icon name="settings" />
            </Link>
          ) : undefined
        }
      />
      <section className="case-identity">
        <div className="case-identity-icon">
          <Icon name="cases" size={25} />
        </div>
        <div>
          <span className="muted-label">Nomor pengajuan</span>
          <div className="reference-copy">
            <strong>{item.reference || "Belum tersedia"}</strong>
            {item.reference && (
              <button
                className="icon-button small"
                aria-label="Salin nomor pengajuan"
                onClick={copyReference}
              >
                <Icon name={copied ? "check" : "copy"} size={16} />
              </button>
            )}
          </div>
        </div>
        {complete ? (
          <StatusBadge status="completed" />
        ) : (
          <span className="status-badge neutral">Kasus aktif</span>
        )}
      </section>
      <h2 className="detail-business-name">{contact.name}</h2>
      <p className="page-description detail-caption">
        {tasks.length} revisi tercatat · {done} sudah selesai
      </p>
      <div
        className="case-stepper"
        aria-label={complete ? "Kasus tuntas" : "Kasus dalam tindak lanjut"}
      >
        {[
          { title: "Dicatat", active: true, sub: dateLabel(item.createdAt) },
          {
            title: "Tindak lanjut",
            active: tasks.length > 0,
            sub: `${done}/${tasks.length} selesai`,
          },
          {
            title: "Tuntas",
            active: complete,
            sub: complete ? "Semua diperiksa" : "Belum tuntas",
          },
        ].map((step, index) => (
          <div
            className={`case-step ${step.active ? "active" : ""}`}
            key={step.title}
          >
            <div className="step-track">
              <span>
                {step.active ? <Icon name="check" size={14} /> : null}
              </span>
              {index < 2 && <i />}
            </div>
            <strong>{step.title}</strong>
            <small>{step.sub}</small>
          </div>
        ))}
      </div>
      {!coordinator && (
        <Link
          className="button primary full detail-main-action"
          href={
            tasks.some((task) => task.status !== "completed")
              ? `/kasus/${id}/pesan`
              : `/revisi/baru?kasus=${id}`
          }
        >
          <Icon
            name={
              tasks.some((task) => task.status !== "completed")
                ? "message"
                : "plus"
            }
          />
          {tasks.some((task) => task.status !== "completed")
            ? "Siapkan pesan WhatsApp"
            : "Tambah revisi"}
        </Link>
      )}
      {success && <Notice>{success}</Notice>}
      {error && !transferOpen && <Notice error>{error}</Notice>}
      <div className="detail-columns">
        <div>
          <section className="info-panel">
            <h2>
              <Icon name="contacts" size={20} />
              Informasi usaha
            </h2>
            <dl className="info-list">
              <div>
                <dt>Pemilik usaha</dt>
                <dd>{contact.greeting || contact.name}</dd>
              </div>
              <div>
                <dt>WhatsApp contoh</dt>
                <dd>+{contact.phone}</dd>
              </div>
              <div>
                <dt>Kategori</dt>
                <dd>{contact.category}</dd>
              </div>
              <div>
                <dt>Dibuat</dt>
                <dd>{dateLabel(item.createdAt, true)}</dd>
              </div>
              <div>
                <dt>Kanal pengajuan</dt>
                <dd>SIHALAL</dd>
              </div>
            </dl>
          </section>
          <section className="assignee-card">
            <Avatar id={assignee.id} />
            <div>
              <h2>{assignee.name}</h2>
              <p>Pendamping penanggung jawab</p>
            </div>
            {coordinator ? (
              <button
                className="icon-button primary"
                aria-label="Alihkan penanggung jawab"
                onClick={() => {
                  setTarget("");
                  setError("");
                  setTransferOpen(true);
                }}
              >
                <Icon name="team" />
              </button>
            ) : (
              <Icon name="shield" size={22} />
            )}
          </section>
          <section className="detail-tasks">
            <SectionHeading
              title="Tugas revisi"
              count={tasks.length}
              action={
                !coordinator && (
                  <Link
                    className="section-link"
                    href={`/revisi/baru?kasus=${id}`}
                  >
                    <Icon name="plus" size={16} />
                    Tambah
                  </Link>
                )
              }
            />
            {tasks.length ? (
              tasks.map((task, index) => (
                <article className="detail-task" key={task.id}>
                  <div className="card-top">
                    <span className="muted-label">Revisi {index + 1}</span>
                    <StatusBadge status={task.status} />
                  </div>
                  <p>{task.instruction}</p>
                  {task.followUpOn && (
                    <span className="task-date">
                      <Icon name="clock" size={14} />
                      Tindak lanjut {dateLabel(task.followUpOn)}
                    </span>
                  )}
                  {!coordinator && (
                    <Link
                      className="button white full"
                      href={`/revisi/${task.id}`}
                    >
                      {task.status === "needs_review"
                        ? "Periksa & perbarui"
                        : task.status === "completed"
                          ? "Lihat revisi selesai"
                          : "Perbarui revisi"}
                      <Icon name="chevron" size={16} />
                    </Link>
                  )}
                </article>
              ))
            ) : (
              <div className="inline-empty">
                <Icon name="cases" size={25} />
                <p>
                  Belum ada tugas revisi. Tambahkan permintaan pertama untuk
                  usaha ini.
                </p>
              </div>
            )}
          </section>
        </div>
        <section className="history-panel">
          <div className="sheet-handle" />
          <SectionHeading title="Riwayat perubahan" />
          <ol className="timeline">
            {history.map((event) => (
              <li key={event.id}>
                <div className="timeline-date">
                  <strong>
                    {new Intl.DateTimeFormat("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                      timeZone: "Asia/Jakarta",
                    }).format(new Date(event.at))}
                  </strong>
                  <span>{dateLabel(event.at, true)}</span>
                </div>
                <span className="timeline-marker">
                  <Icon name="check" size={12} />
                </span>
                <div>
                  <h3>{event.title}</h3>
                  <p>{event.detail}</p>
                  <small>
                    {staff.find((person) => person.id === event.actorId)?.name}
                  </small>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
      <p className="end-note">
        Tuntas setelah semua koreksi diperiksa dan pembaruan resmi yang
        diperlukan dicatat.
      </p>
      <Dialog
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        title="Alihkan pendamping"
      >
        <p className="dialog-description">
          Pilih pendamping aktif untuk <strong>{contact.name}</strong>. Akses
          kasus mengikuti penanggung jawab baru.
        </p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            transfer();
          }}
        >
          <fieldset className="option-group">
            <legend>Pendamping baru</legend>
            {staff
              .filter(
                (person) =>
                  person.role === "companion" &&
                  person.active &&
                  person.id !== item.assigneeId,
              )
              .map((person) => (
                <label className="radio-row staff-option" key={person.id}>
                  <input
                    type="radio"
                    name="assignee"
                    value={person.id}
                    checked={target === person.id}
                    onChange={() => setTarget(person.id)}
                    required
                  />
                  <Avatar id={person.id} />
                  <span>
                    {person.name}
                    <small>Pendamping aktif</small>
                  </span>
                </label>
              ))}
          </fieldset>
          {error && <Notice error>{error}</Notice>}
          <button className="button primary full" type="submit">
            Alihkan penanggung jawab
          </button>
        </form>
      </Dialog>
    </>
  );
}
