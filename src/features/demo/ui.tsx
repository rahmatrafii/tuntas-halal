"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeft,
  ArrowUpRight,
  Bell,
  BookUser,
  Check,
  CheckCheck,
  ChevronRight,
  CircleAlert,
  Clock3,
  Copy,
  House,
  Layers3,
  ListFilter,
  LoaderCircle,
  MessageCircle,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Users,
  X,
} from "lucide-react";
import {
  type RevisionStatus,
  statusLabels,
  queueGroup,
} from "@/lib/domain/revisions";
import { DEMO_TODAY, staff, type Task } from "./model";
import { useDemo, useDemoReady } from "./store";
import { dateLabel, tasksForCase } from "./logic";

export const Icons = {
  copy: Copy,
  back: ArrowLeft,
  arrow: ArrowUpRight,
  bell: Bell,
  contacts: BookUser,
  check: Check,
  done: CheckCheck,
  chevron: ChevronRight,
  alert: CircleAlert,
  clock: Clock3,
  home: House,
  cases: Layers3,
  filter: ListFilter,
  loading: LoaderCircle,
  message: MessageCircle,
  plus: Plus,
  search: Search,
  shield: ShieldCheck,
  settings: SlidersHorizontal,
  team: Users,
  close: X,
};
export type IconName = keyof typeof Icons;
export function Icon({
  name,
  size = 21,
  className = "",
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  const Glyph = Icons[name];
  return (
    <Glyph
      size={size}
      strokeWidth={1.7}
      aria-hidden="true"
      className={className}
    />
  );
}

export function Avatar({ id, size = "" }: { id: string; size?: string }) {
  const person = staff.find((entry) => entry.id === id);
  return (
    <span
      className={`avatar ${person?.color ?? "blue"} ${size}`}
      aria-hidden="true"
    >
      {person?.initials ?? id.slice(0, 2).toUpperCase()}
    </span>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/staf" || pathname.startsWith("/staf/") || pathname.startsWith("/auth/")) return children;
  return <DemoShell>{children}</DemoShell>;
}

function DemoShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const state = useDemo();
  const ready = useDemoReady();
  const login = pathname === "/login";
  const nav = [
    { href: "/", icon: "home", label: "Beranda" },
    { href: "/kasus", icon: "cases", label: "Kasus" },
    { href: "/kontak", icon: "contacts", label: "Kontak" },
    { href: "/akun", icon: "settings", label: "Akun" },
  ] as const;
  return (
    <div className={`app-shell ${login ? "login-shell" : ""}`}>
      <a href="#konten" className="skip-link">
        Lewati ke konten
      </a>
      <aside className="desktop-sidebar">
        <Link href="/" className="brand">
          <span className="brand-icon">
            <Icon name="shield" size={25} />
          </span>
          <span>
            Revisi Halal<small>Pendampingan lebih terarah</small>
          </span>
        </Link>
        <nav aria-label="Navigasi desktop">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href))
                  ? "active"
                  : ""
              }
            >
              <Icon name={item.icon} />
              {item.label}
            </Link>
          ))}
          <Link href="/tim">
            <Icon name="team" />
            Tim pendamping
          </Link>
        </nav>
        <div className="sidebar-foot">
          <span className="demo-tag">Prototipe interaktif</span>
          <p>
            LP3H Amanah Nusantara
            <br />
            Semua data adalah contoh.
          </p>
        </div>
      </aside>
      <div className="app-content">
        <div className="desktop-topbar">
          <span>LP3H Amanah Nusantara</span>
          <span className="demo-tag">Mode demo</span>
        </div>
        <main id="konten" className="main-content">
          {!ready ? (
            <StateView kind="loading" />
          ) : !login && !state.staffId ? (
            <StateView kind="restricted" />
          ) : (
            <div className="screen-content" key={state.staffId}>
              {children}
            </div>
          )}
          <noscript>
            Aktifkan JavaScript untuk mencoba prototipe interaktif ini.
          </noscript>
        </main>
      </div>
      {!login && (
        <nav className="bottom-nav" aria-label="Navigasi utama">
          {nav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-label={item.label}
                aria-current={active ? "page" : undefined}
                className={active ? "active" : ""}
              >
                <Icon name={item.icon} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}
    </div>
  );
}

export function PageHeader({
  title,
  back = "/",
  action,
  subtitle,
}: {
  title: string;
  back?: string | false;
  action?: ReactNode;
  subtitle?: string;
}) {
  return (
    <header className="page-header">
      {back && (
        <Link href={back} className="icon-button plain" aria-label="Kembali">
          <Icon name="back" />
        </Link>
      )}
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="header-action">
        {action ?? <span className="demo-tag">Demo</span>}
      </div>
    </header>
  );
}

export function StatusBadge({
  status,
  due = false,
}: {
  status: RevisionStatus;
  due?: boolean;
}) {
  return (
    <span className={`status-badge ${due ? "due" : status}`}>
      {due ? (
        <Icon name="clock" size={13} />
      ) : status === "completed" ? (
        <Icon name="check" size={13} />
      ) : null}
      {due ? "Hubungi hari ini" : statusLabels[status]}
    </span>
  );
}

export function Progress({
  complete,
  total,
  compact = false,
}: {
  complete: number;
  total: number;
  compact?: boolean;
}) {
  return (
    <div
      className={`case-progress ${compact ? "compact" : ""}`}
      aria-label={`${complete} dari ${total} revisi selesai`}
    >
      <div className="progress-track">
        <span style={{ width: `${total ? (complete / total) * 100 : 0}%` }} />
      </div>
      <span>
        {complete}/{total} selesai
      </span>
    </div>
  );
}

export function TaskCard({ task }: { task: Task }) {
  const state = useDemo();
  const item = state.cases.find((entry) => entry.id === task.caseId)!;
  const contact = state.contacts.find((entry) => entry.id === item.contactId)!;
  const tasks = tasksForCase(state, item.id);
  const due =
    queueGroup(task.status, task.followUpOn, DEMO_TODAY) === "contact_today";
  const coordinator =
    staff.find((person) => person.id === state.staffId)?.role === "coordinator";
  const action = coordinator
    ? { href: `/kasus/${item.id}`, text: "Lihat kasus", icon: "cases" as const }
    : task.status === "needs_sending" || due
      ? {
          href: `/kasus/${item.id}/pesan?pilih=${task.id}`,
          text: due ? "Siapkan pengingat" : "Siapkan pesan",
          icon: "message" as const,
        }
      : {
          href: `/revisi/${task.id}`,
          text:
            task.status === "needs_review"
              ? "Periksa revisi"
              : task.status === "completed"
                ? "Lihat revisi"
                : "Catat balasan",
          icon:
            task.status === "needs_review"
              ? ("shield" as const)
              : ("check" as const),
        };
  return (
    <article className="task-card">
      <div className="card-top">
        <span className="card-reference">
          {item.reference || "Tanpa nomor pengajuan"}
        </span>
        <StatusBadge status={task.status} due={due} />
      </div>
      <Link className="card-title-link" href={`/kasus/${item.id}`}>
        <h3>{contact.name}</h3>
        <Icon name="chevron" size={17} />
      </Link>
      <p className="task-instruction">{task.instruction}</p>
      <div className="card-meta">
        <span>
          <Icon name="clock" size={14} />
          {task.followUpOn
            ? `Tindak lanjut ${dateLabel(task.followUpOn)}`
            : "Tanpa jadwal tindak lanjut"}
        </span>
        {coordinator && (
          <span>
            {
              staff
                .find((person) => person.id === item.assigneeId)
                ?.name.split(" ")[0]
            }
          </span>
        )}
      </div>
      <Progress
        complete={tasks.filter((entry) => entry.status === "completed").length}
        total={tasks.length}
        compact
      />
      <Link
        className={`button ${due || task.status === "needs_sending" ? "primary" : "white"} full`}
        href={action.href}
      >
        <Icon name={action.icon} size={18} />
        {action.text}
      </Link>
    </article>
  );
}

export function EmptyState({
  title = "Belum ada revisi",
  description = "Mulai dengan mencatat satu permintaan yang perlu ditindaklanjuti.",
  href = "/revisi/baru",
  action = "Tambah revisi",
  icon = "cases",
}: {
  title?: string;
  description?: string;
  href?: string;
  action?: string;
  icon?: IconName;
}) {
  return (
    <div className="empty-state">
      <span className="state-symbol">
        <Icon name={icon} size={30} />
      </span>
      <h2>{title}</h2>
      <p>{description}</p>
      <Link className="button primary" href={href}>
        <Icon name="plus" size={18} />
        {action}
      </Link>
    </div>
  );
}

export function StateView({
  kind,
  onRetry,
}: {
  kind: "empty" | "loading" | "error" | "restricted" | "conflict";
  onRetry?: () => void;
}) {
  if (kind === "loading")
    return (
      <div className="loading-state" aria-busy="true">
        <span className="sr-only" role="status">
          Memuat antrean revisi…
        </span>
        <div className="skeleton skeleton-summary" />
        {[1, 2, 3].map((id) => (
          <div className="skeleton-card" key={id}>
            <div className="skeleton" />
            <div className="skeleton" />
            <div className="skeleton" />
          </div>
        ))}
      </div>
    );
  if (kind === "empty") return <EmptyState />;
  const restricted = kind === "restricted";
  const conflict = kind === "conflict";
  return (
    <div className="empty-state">
      <span className={`state-symbol ${restricted ? "" : "error-symbol"}`}>
        <Icon name={restricted ? "shield" : "alert"} size={30} />
      </span>
      <h2>
        {restricted
          ? "Akses kasus terbatas"
          : conflict
            ? "Status sudah diperbarui"
            : "Revisi belum dapat dimuat"}
      </h2>
      <p>
        {restricted
          ? "Kasus ini ditangani pendamping lain. Hubungi koordinator jika Anda perlu menjadi penanggung jawab."
          : conflict
            ? "Ada perubahan dari sesi lain. Muat status terbaru sebelum melanjutkan agar perubahan tidak tertimpa."
            : "Ada gangguan saat memuat data. Silakan coba lagi."}
      </p>
      {!restricted && onRetry ? (
        <button className="button primary" onClick={onRetry}>
          {conflict ? "Muat status terbaru" : "Coba lagi"}
        </button>
      ) : (
        <Link className="button primary" href={restricted ? "/" : "/"}>
          Kembali ke beranda
        </Link>
      )}
      {restricted && (
        <Link className="text-link" href="/login">
          Pilih akun demo
        </Link>
      )}
    </div>
  );
}

export function Dialog({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const node = ref.current;
    if (open && !node?.open) node?.showModal();
    if (!open && node?.open) node.close();
  }, [open]);
  return (
    <dialog ref={ref} className="sheet" aria-labelledby={id} onClose={onClose}>
      <div className="sheet-handle" />
      <div className="sheet-heading">
        <h2 id={id}>{title}</h2>
        <button
          type="button"
          className="icon-button white"
          aria-label="Tutup"
          onClick={() => ref.current?.close()}
        >
          <Icon name="close" />
        </button>
      </div>
      {children}
    </dialog>
  );
}

export function Notice({
  children,
  error = false,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <div
      className={`notice with-icon ${error ? "error-notice" : ""}`}
      role={error ? "alert" : "status"}
    >
      <Icon name={error ? "alert" : "shield"} size={18} />
      <div>{children}</div>
    </div>
  );
}
export function SectionHeading({
  title,
  count,
  action,
}: {
  title: string;
  count?: number;
  action?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <h2>
        {title}
        {count !== undefined && <span className="count">{count}</span>}
      </h2>
      {action}
    </div>
  );
}
