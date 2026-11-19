"use client";

import { useState } from "react";
import Link from "next/link";
import {
  queueGroup,
  statusLabels,
  type QueueGroup,
} from "@/lib/domain/revisions";
import { DEMO_TODAY, staff } from "./model";
import { useDemo } from "./store";
import { filterTasks, visibleCases } from "./logic";
import {
  Avatar,
  Dialog,
  EmptyState,
  Icon,
  Notice,
  SectionHeading,
  TaskCard,
} from "./ui";

const filters = [
  { id: "all", label: "Semua" },
  { id: "contact_today", label: "Hari ini" },
  { id: "needs_review", label: "Perlu dicek" },
  { id: "needs_sending", label: "Perlu dikirim" },
  { id: "awaiting_reply", label: "Menunggu" },
  { id: "completed", label: "Selesai" },
];
const groups: QueueGroup[] = [
  "contact_today",
  "needs_review",
  "needs_sending",
  "awaiting_reply",
  "completed",
];

export function QueueScreen() {
  const state = useDemo();
  const person = staff.find((entry) => entry.id === state.staffId) ?? staff[0];
  const coordinator = person.role === "coordinator";
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [assignee, setAssignee] = useState("all");
  const [filterOpen, setFilterOpen] = useState(false);
  const [pendingFilter, setPendingFilter] = useState(filter);
  const [pendingAssignee, setPendingAssignee] = useState(assignee);
  const tasks = filterTasks(state, query, filter, assignee);
  const all = filterTasks(state, "", "all", assignee);
  const due = all.filter(
    (task) =>
      queueGroup(task.status, task.followUpOn, DEMO_TODAY) === "contact_today",
  ).length;
  const review = all.filter((task) => task.status === "needs_review").length;
  return (
    <>
      <header className="home-header">
        <Link href="/akun" className="profile-link">
          <Avatar id={person.id} />
          <span>
            <h1>
              Halo, {person.name.split(" ")[0]}
              <span className="greeting-wave">.</span>
            </h1>
            <span className="profile-subtitle">
              <Icon name="shield" size={13} />
              {coordinator ? "Koordinator LP3H" : "Pendamping PPH"} · Amanah
              Nusantara
            </span>
          </span>
        </Link>
        <button
          className="icon-button soft notification-button"
          aria-label={`Lihat ${due} revisi yang perlu dihubungi hari ini`}
          onClick={() => setFilter("contact_today")}
        >
          <Icon name="bell" />
          {due > 0 && <span className="notification-dot" />}
        </button>
      </header>
      <div className="page-context">
        <span>
          {coordinator ? "Ruang kerja koordinator" : "Ruang kerja Anda"}
        </span>
        <span className="demo-tag">Data contoh</span>
      </div>
      <section
        className="summary-card"
        aria-label="Ringkasan tindakan hari ini"
      >
        <div className="summary-top">
          <span>
            {coordinator
              ? "Tindak lanjut tim hari ini"
              : "Tindak lanjut hari ini"}
          </span>
          <span className="date-pill">19 Nov 2026</span>
        </div>
        <div className="summary-value">
          {due}
          <span>revisi perlu dihubungi</span>
        </div>
        <p>
          {review > 0
            ? `${review} revisi lain sudah siap diperiksa.`
            : "Semua balasan yang masuk sudah diperiksa."}
        </p>
        <div className="summary-actions">
          {coordinator ? (
            <>
              <Link className="button white" href="/tim">
                <Icon name="team" size={19} />
                Lihat tim
              </Link>
              <Link className="button white" href="/kasus">
                <Icon name="cases" size={19} />
                Semua kasus
              </Link>
            </>
          ) : (
            <>
              <Link className="button white" href="/revisi/baru">
                <Icon name="plus" size={19} />
                Tambah revisi
              </Link>
              <Link className="button white" href="/kasus/baru">
                <Icon name="cases" size={19} />
                Kasus baru
              </Link>
            </>
          )}
        </div>
      </section>
      <search className="search-section">
        <label htmlFor="queue-search" className="sr-only">
          Cari nama usaha atau nomor pengajuan
        </label>
        <div className="search-pill">
          <Icon name="search" />
          <input
            id="queue-search"
            name="q"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Cari usaha atau no. pengajuan"
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
          />
          <button
            type="button"
            className="filter-button"
            aria-label="Buka filter revisi"
            onClick={() => {
              setPendingFilter(filter);
              setPendingAssignee(assignee);
              setFilterOpen(true);
            }}
          >
            <Icon name="filter" size={20} />
          </button>
        </div>
      </search>
      <div className="filter-chips" aria-label="Filter status">
        {filters.map((item) => (
          <button
            type="button"
            key={item.id}
            className={`chip ${filter === item.id ? "active" : ""}`}
            aria-pressed={filter === item.id}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
            {item.id === "contact_today" && due > 0 && <span>{due}</span>}
          </button>
        ))}
      </div>
      {coordinator && assignee !== "all" && (
        <div className="active-filter">
          <span>
            <Icon name="team" size={15} />
            {staff.find((entry) => entry.id === assignee)?.name}
          </span>
          <button
            onClick={() => setAssignee("all")}
            aria-label="Hapus filter pendamping"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
      <div className="queue-heading">
        <h2>
          Antrean revisi <span>{tasks.length}</span>
        </h2>
        <span>{visibleCases(state).length} kasus usaha</span>
      </div>
      {!tasks.length ? (
        <div>
          <EmptyState
            title={
              query || filter !== "all"
                ? "Tidak ada revisi yang cocok"
                : "Antrean Anda sudah beres"
            }
            description={
              query || filter !== "all"
                ? "Coba nama usaha lain atau ubah filter untuk melihat revisi lainnya."
                : "Tambahkan revisi baru saat ada permintaan yang perlu ditindaklanjuti."
            }
            action={coordinator ? "Lihat kasus tim" : "Tambah revisi"}
            href={coordinator ? "/kasus" : "/revisi/baru"}
            icon="search"
          />
          {(query || filter !== "all") && (
            <button
              className="button white full"
              onClick={() => {
                setQuery("");
                setFilter("all");
                setAssignee("all");
              }}
            >
              Hapus pencarian dan filter
            </button>
          )}
        </div>
      ) : (
        <div className="queue-groups">
          {groups.map((group) => {
            const grouped = tasks.filter(
              (task) =>
                queueGroup(task.status, task.followUpOn, DEMO_TODAY) === group,
            );
            if (!grouped.length) return null;
            return (
              <section key={group}>
                <SectionHeading
                  title={
                    group === "contact_today"
                      ? "Hubungi hari ini"
                      : statusLabels[group]
                  }
                  count={grouped.length}
                />
                <div className="task-grid">
                  {grouped.map((task) => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
      <p className="end-note">
        <Icon name="shield" size={14} />
        Pengajuan resmi tetap dikelola di SIHALAL.
      </p>
      <Dialog
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filter antrean"
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setFilter(pendingFilter);
            setAssignee(pendingAssignee);
            setFilterOpen(false);
          }}
        >
          <fieldset className="option-group">
            <legend>Status revisi</legend>
            {filters.map((item) => (
              <label className="radio-row" key={item.id}>
                <input
                  type="radio"
                  name="status"
                  checked={pendingFilter === item.id}
                  onChange={() => setPendingFilter(item.id)}
                />
                <span>{item.label}</span>
              </label>
            ))}
          </fieldset>
          {coordinator && (
            <div className="field">
              <label htmlFor="filter-assignee">Pendamping</label>
              <select
                id="filter-assignee"
                value={pendingAssignee}
                onChange={(event) => setPendingAssignee(event.target.value)}
              >
                <option value="all">Semua pendamping</option>
                {staff
                  .filter((entry) => entry.role === "companion")
                  .map((entry) => (
                    <option value={entry.id} key={entry.id}>
                      {entry.name}
                    </option>
                  ))}
              </select>
            </div>
          )}
          <button className="button primary full" type="submit">
            Terapkan filter
          </button>
          <button
            className="button text full"
            type="button"
            onClick={() => {
              setPendingFilter("all");
              setPendingAssignee("all");
            }}
          >
            Atur ulang
          </button>
        </form>
      </Dialog>
      {coordinator && (
        <Notice>
          Anda melihat revisi seluruh tim. Pengubahan status dilakukan oleh
          pendamping penanggung jawab.
        </Notice>
      )}
    </>
  );
}
