"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  composeWhatsAppDraft,
  normalizeWhatsAppNumber,
} from "@/lib/domain/whatsapp";
import { useDemo, updateDemo } from "./store";
import { canReadCase, changeTasks, tasksForCase } from "./logic";
import { Dialog, Icon, Notice, PageHeader, StateView, StatusBadge } from "./ui";
import { Field } from "./form-screens";

export function DraftScreen({
  id,
  selectedId,
}: {
  id: string;
  selectedId?: string;
}) {
  const state = useDemo();
  const item = state.cases.find((entry) => entry.id === id);
  if (!item || !canReadCase(state, item) || item.assigneeId !== state.staffId)
    return (
      <>
        <PageHeader title="Draf WhatsApp" />
        <StateView kind="restricted" />
      </>
    );
  return <DraftEditor key={id} id={id} selectedId={selectedId} />;
}

function DraftEditor({ id, selectedId }: { id: string; selectedId?: string }) {
  const state = useDemo();
  const item = state.cases.find((entry) => entry.id === id)!;
  const contact = state.contacts.find((entry) => entry.id === item.contactId)!;
  const tasks = tasksForCase(state, id).filter(
    (task) => task.status !== "completed",
  );
  const stored = state.drafts[id];
  const initialSelected =
    selectedId && tasks.some((task) => task.id === selectedId)
      ? [selectedId]
      : (stored?.selected.filter((key) =>
          tasks.some((task) => task.id === key),
        ) ?? tasks.map((task) => task.id));
  const compose = (ids: string[]) =>
    ids.length
      ? composeWhatsAppDraft({
          businessName: contact.name,
          greetingName: contact.greeting,
          tasks: tasks.filter((task) => ids.includes(task.id)),
        })
      : "";
  const [selected, setSelected] = useState(initialSelected);
  const [message, setMessage] = useState(
    !selectedId && stored ? stored.message : compose(initialSelected),
  );
  const [followUp, setFollowUp] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatViewed, setChatViewed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [conflict, setConflict] = useState(false);
  const versions = useRef(
    Object.fromEntries(tasks.map((task) => [task.id, task.version])),
  );
  const saving = useRef(false);
  const validNumber = normalizeWhatsAppNumber(contact.phone);
  function persist(ids: string[], text: string) {
    try {
      updateDemo((current) => ({
        ...current,
        drafts: { ...current.drafts, [id]: { selected: ids, message: text } },
      }));
    } catch (failure) {
      setError((failure as Error).message);
    }
  }
  function toggle(taskId: string) {
    const ids = selected.includes(taskId)
      ? selected.filter((key) => key !== taskId)
      : [...selected, taskId];
    const text = compose(ids);
    setSelected(ids);
    setMessage(text);
    setCopied(false);
    setSent(false);
    persist(ids, text);
  }
  async function copy() {
    if (!message.trim()) {
      setError("Pilih revisi dan isi pesan terlebih dahulu.");
      return;
    }
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setError("");
    } catch {
      setError(
        "Salin otomatis tidak tersedia. Pilih teks pada kolom pesan dan salin secara manual.",
      );
      document.getElementById("draftMessage")?.focus();
    }
  }
  function markSent() {
    if (saving.current) return;
    if (!selected.length) {
      setError("Pilih minimal satu revisi yang benar-benar dikirim.");
      return;
    }
    saving.current = true;
    try {
      updateDemo((current) =>
        changeTasks(
          current,
          selected,
          "awaiting_reply",
          followUp || null,
          versions.current,
          new Date().toISOString(),
        ),
      );
      setSent(true);
      setError("");
    } catch (failure) {
      setError((failure as Error).message);
      setConflict((failure as Error).message.includes("sudah berubah"));
      saving.current = false;
    }
  }
  return (
    <>
      <PageHeader title="Draf WhatsApp" back={`/kasus/${id}`} />
      <div className="recipient-card">
        <span className="business-avatar">
          {contact.name
            .split(" ")
            .slice(0, 2)
            .map((word) => word[0])
            .join("")}
        </span>
        <div>
          <span className="muted-label">Penerima pesan</span>
          <h2>{contact.greeting || contact.name}</h2>
          <p>{contact.name}</p>
          <span className="recipient-phone">
            +{contact.phone} · nomor contoh
          </span>
        </div>
        <Icon name="message" size={23} />
      </div>
      {sent ? (
        <div className="send-success">
          <span className="state-symbol success-symbol">
            <Icon name="done" size={32} />
          </span>
          <h2>Pengiriman sudah dicatat</h2>
          <p>
            {selected.length} revisi dipindahkan ke Menunggu balasan pada data
            demo. Revisi lainnya tetap pada statusnya.
          </p>
          <Link className="button primary full" href={`/kasus/${id}`}>
            Kembali ke kasus
          </Link>
        </div>
      ) : (
        <>
          <section className="draft-selection">
            <div className="section-heading">
              <h2>
                Pilih revisi <span className="count">{selected.length}</span>
              </h2>
              <button
                className="section-link"
                type="button"
                onClick={() => {
                  const ids =
                    selected.length === tasks.length
                      ? []
                      : tasks.map((task) => task.id);
                  const text = compose(ids);
                  setSelected(ids);
                  setMessage(text);
                  persist(ids, text);
                }}
              >
                {selected.length === tasks.length && tasks.length
                  ? "Hapus pilihan"
                  : "Pilih semua"}
              </button>
            </div>
            {tasks.map((task) => (
              <label
                className={`draft-task-option ${selected.includes(task.id) ? "selected" : ""}`}
                key={task.id}
              >
                <input
                  type="checkbox"
                  name="selectedTasks"
                  checked={selected.includes(task.id)}
                  onChange={() => toggle(task.id)}
                />
                <span>
                  <span className="draft-option-label">{task.instruction}</span>
                  <StatusBadge status={task.status} />
                </span>
              </label>
            ))}
            {!tasks.length && (
              <div className="inline-empty">
                <p>
                  Semua revisi sudah selesai. Tambahkan tugas baru jika ada
                  permintaan lanjutan.
                </p>
                <Link className="text-link" href={`/revisi/baru?kasus=${id}`}>
                  Tambah revisi
                </Link>
              </div>
            )}
            <p className="field-hint">
              Memilih ulang revisi akan menyusun ulang pesan.
            </p>
          </section>
          <section className="message-panel">
            <div className="message-panel-heading">
              <Icon name="message" size={19} />
              <h2>Pesan untuk pemilik usaha</h2>
            </div>
            <label className="sr-only" htmlFor="draftMessage">
              Isi draf pesan WhatsApp
            </label>
            <textarea
              id="draftMessage"
              name="message"
              rows={9}
              value={message}
              onChange={(event) => {
                setMessage(event.target.value);
                setCopied(false);
                persist(selected, event.target.value);
              }}
              placeholder="Pilih minimal satu revisi untuk menyusun pesan."
            />
            <p>Perubahan pesan tidak mengubah arahan tugas.</p>
          </section>
          {!validNumber && (
            <Notice error>
              Nomor WhatsApp belum valid. Koreksi kontak sebelum membuka chat.
              Anda tetap bisa menyalin pesan.
              <Link className="text-link" href={`/kontak/${contact.id}/edit`}>
                Koreksi nomor kontak
              </Link>
            </Notice>
          )}
          {error && (
            <Notice error>
              {error}
              {conflict && (
                <button
                  type="button"
                  className="text-link"
                  onClick={() => {
                    versions.current = Object.fromEntries(
                      tasks.map((task) => [task.id, task.version]),
                    );
                    setConflict(false);
                    setError(
                      "Versi terbaru dimuat. Tinjau kembali pilihan sebelum mencatat pengiriman.",
                    );
                  }}
                >
                  Muat versi terbaru
                </button>
              )}
            </Notice>
          )}
          <div className="draft-actions">
            <button
              type="button"
              className="button primary full"
              disabled={!validNumber || !message.trim() || !selected.length}
              onClick={() => {
                persist(selected, message);
                setChatOpen(true);
                setChatViewed(true);
              }}
            >
              <Icon name="message" />
              Buka WhatsApp
            </button>
            <button type="button" className="button white full" onClick={copy}>
              <Icon name={copied ? "check" : "copy"} size={18} />
              {copied ? "Pesan tersalin" : "Salin pesan"}
            </button>
          </div>
          <section className="send-confirmation">
            <h2>
              {chatViewed
                ? "Sudah kembali dari WhatsApp?"
                : "Setelah pesan benar-benar dikirim"}
            </h2>
            <p>
              Tandai hanya revisi yang Anda kirim. Membuka chat atau menyalin
              pesan belum mengubah status.
            </p>
            <Field
              id="sendFollowUp"
              label="Tanggal tindak lanjut"
              type="date"
              value={followUp}
              onChange={setFollowUp}
            />
            <button
              type="button"
              className="button primary full"
              onClick={markSent}
            >
              <Icon name="done" />
              Tandai sudah dikirim
            </button>
          </section>
        </>
      )}
      <p className="end-note">
        Mode demo: chat hanya disimulasikan dan tidak mengirim pesan.
      </p>
      <Dialog
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        title="Pratinjau chat"
      >
        <div className="chat-demo">
          <div className="chat-demo-recipient">
            <span className="business-avatar">
              {contact.greeting.slice(0, 1) || "U"}
            </span>
            <div>
              <strong>{contact.greeting || contact.name}</strong>
              <p>Simulasi WhatsApp</p>
            </div>
          </div>
          <div className="chat-bubble">
            {message}
            <span>
              09.41 <Icon name="done" size={14} />
            </span>
          </div>
        </div>
        <Notice>
          Ini hanya pratinjau. Tidak ada pesan yang dikirim dan status revisi
          belum berubah.
        </Notice>
        <button
          className="button primary full"
          type="button"
          onClick={() => setChatOpen(false)}
        >
          Kembali ke draf
        </button>
      </Dialog>
    </>
  );
}
