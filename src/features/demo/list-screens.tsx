"use client";

import { useState } from "react";
import Link from "next/link";
import { staff } from "./model";
import { useDemo } from "./store";
import {
  caseComplete,
  dateLabel,
  tasksForCase,
  visibleCases,
  visibleContacts,
} from "./logic";
import {
  Avatar,
  EmptyState,
  Icon,
  PageHeader,
  Progress,
  SectionHeading,
  StatusBadge,
} from "./ui";

export function CasesScreen() {
  const state = useDemo();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("active");
  const coordinator =
    staff.find((entry) => entry.id === state.staffId)?.role === "coordinator";
  const cases = visibleCases(state).filter((item) => {
    const contact = state.contacts.find(
      (entry) => entry.id === item.contactId,
    )!;
    return (
      `${contact.name} ${item.reference}`
        .toLowerCase()
        .includes(query.toLowerCase()) &&
      (filter === "all" ||
        caseComplete(state, item.id) === (filter === "completed"))
    );
  });
  return (
    <>
      <PageHeader
        title="Kasus usaha"
        back={false}
        action={
          !coordinator ? (
            <Link
              className="icon-button primary"
              href="/kasus/baru"
              aria-label="Buat kasus baru"
            >
              <Icon name="plus" />
            </Link>
          ) : (
            <Link
              className="icon-button soft"
              href="/tim"
              aria-label="Lihat tim"
            >
              <Icon name="team" />
            </Link>
          )
        }
      />
      <p className="page-description">
        Satu pengajuan, semua revisinya tercatat.
      </p>
      <search className="search-pill">
        <Icon name="search" />
        <label className="sr-only" htmlFor="case-search">
          Cari usaha atau nomor pengajuan
        </label>
        <input
          id="case-search"
          type="search"
          name="q"
          placeholder="Cari usaha atau no. pengajuan"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </search>
      <div className="filter-chips">
        {[
          { id: "active", label: "Kasus aktif" },
          { id: "completed", label: "Tuntas" },
          { id: "all", label: "Semua" },
        ].map((entry) => (
          <button
            className={`chip ${filter === entry.id ? "active" : ""}`}
            key={entry.id}
            aria-pressed={filter === entry.id}
            onClick={() => setFilter(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </div>
      <SectionHeading title="Daftar kasus" count={cases.length} />
      {cases.length ? (
        <div className="task-grid">
          {cases.map((item) => {
            const contact = state.contacts.find(
              (entry) => entry.id === item.contactId,
            )!;
            const tasks = tasksForCase(state, item.id);
            const completed = tasks.filter(
              (task) => task.status === "completed",
            ).length;
            return (
              <Link
                className="case-card"
                key={item.id}
                href={`/kasus/${item.id}`}
              >
                <div className="card-top">
                  <span className="business-symbol">
                    <Icon name="cases" />
                  </span>
                  {caseComplete(state, item.id) ? (
                    <StatusBadge status="completed" />
                  ) : (
                    <span className="status-badge neutral">Kasus aktif</span>
                  )}
                </div>
                <h2>{contact.name}</h2>
                <p className="card-reference">
                  {item.reference || "Belum ada nomor pengajuan"}
                </p>
                <Progress complete={completed} total={tasks.length} />
                <div className="case-card-footer">
                  <span>
                    <Avatar id={item.assigneeId} size="tiny" />
                    {
                      staff
                        .find((entry) => entry.id === item.assigneeId)
                        ?.name.split(" ")[0]
                    }
                  </span>
                  <span>
                    {dateLabel(item.createdAt)}
                    <Icon name="chevron" size={16} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="Belum ada kasus di sini"
          description="Ubah pencarian atau buat kasus untuk pengajuan yang sedang Anda dampingi."
          href={coordinator ? "/tim" : "/kasus/baru"}
          action={coordinator ? "Lihat tim" : "Buat kasus"}
        />
      )}
    </>
  );
}

export function ContactsScreen() {
  const state = useDemo();
  const [query, setQuery] = useState("");
  const coordinator =
    staff.find((entry) => entry.id === state.staffId)?.role === "coordinator";
  const contacts = visibleContacts(state).filter((entry) =>
    `${entry.name} ${entry.phone}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeader
        title="Kontak usaha"
        back={false}
        action={
          !coordinator ? (
            <Link
              className="icon-button primary"
              href="/kontak/baru"
              aria-label="Tambah kontak"
            >
              <Icon name="plus" />
            </Link>
          ) : undefined
        }
      />
      <p className="page-description">
        Simpan sekali, gunakan untuk pengajuan berikutnya.
      </p>
      <search className="search-pill">
        <Icon name="search" />
        <label htmlFor="contact-search" className="sr-only">
          Cari nama usaha atau nomor WhatsApp
        </label>
        <input
          id="contact-search"
          name="q"
          type="search"
          placeholder="Cari nama usaha atau nomor"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </search>
      <SectionHeading title="Kontak tersimpan" count={contacts.length} />
      <div className="contact-list">
        {contacts.map((contact) => {
          const cases = visibleCases(state).filter(
            (item) => item.contactId === contact.id,
          );
          return (
            <article className="contact-card" key={contact.id}>
              <div className="contact-card-top">
                <span className="business-avatar">
                  {contact.name
                    .split(" ")
                    .slice(0, 2)
                    .map((word) => word[0])
                    .join("")}
                </span>
                <div>
                  <h2>{contact.name}</h2>
                  <p>{contact.category}</p>
                </div>
              </div>
              <dl className="contact-meta">
                <div>
                  <dt>Sapaan</dt>
                  <dd>{contact.greeting || "Belum diisi"}</dd>
                </div>
                <div>
                  <dt>WhatsApp contoh</dt>
                  <dd>+{contact.phone}</dd>
                </div>
              </dl>
              <div className="contact-actions">
                {!coordinator && (
                  <Link className="button white" href={`/kontak/${contact.id}/edit`}>Ubah kontak</Link>
                )}
                {cases.length > 0 && (
                  <Link className="button white" href={`/kasus/${cases[0].id}`}>
                    <Icon name="cases" size={18} />
                    {cases.length} kasus
                  </Link>
                )}
                {!coordinator && (
                  <Link
                    className="button primary"
                    href={`/kasus/baru?kontak=${contact.id}`}
                  >
                    <Icon name="plus" size={18} />
                    Kasus baru
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </div>
      {!contacts.length && (
        <EmptyState
          title="Kontak tidak ditemukan"
          description="Coba nama usaha lain atau simpan kontak baru."
          href={coordinator ? "/kasus" : "/kontak/baru"}
          action={coordinator ? "Lihat kasus" : "Tambah kontak"}
          icon="contacts"
        />
      )}
    </>
  );
}
