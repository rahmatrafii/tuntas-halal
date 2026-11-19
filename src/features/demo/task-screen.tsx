"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  revisionStatuses,
  statusLabels,
  type RevisionStatus,
} from "@/lib/domain/revisions";
import { useDemo, updateDemo } from "./store";
import { canReadCase, changeTasks } from "./logic";
import { Field } from "./form-screens";
import { Icon, Notice, PageHeader, StateView, StatusBadge } from "./ui";

export function TaskScreen({ id }: { id: string }) {
  const state = useDemo();
  const router = useRouter();
  const task = state.tasks.find((entry) => entry.id === id);
  const item = state.cases.find((entry) => entry.id === task?.caseId);
  if (
    !task ||
    !item ||
    !canReadCase(state, item) ||
    item.assigneeId !== state.staffId
  )
    return (
      <>
        <PageHeader title="Detail revisi" />
        <StateView kind="restricted" />
      </>
    );
  return (
    <TaskEditor
      key={id}
      id={id}
      initialInstruction={task.instruction}
      initialStatus={task.status}
      initialDate={task.followUpOn || ""}
      initialVersion={task.version}
      caseId={item.id}
      businessName={
        state.contacts.find((entry) => entry.id === item.contactId)!.name
      }
      onSaved={() => router.push(`/kasus/${item.id}`)}
    />
  );
}

function TaskEditor({
  id,
  initialInstruction,
  initialStatus,
  initialDate,
  initialVersion,
  caseId,
  businessName,
  onSaved,
}: {
  id: string;
  initialInstruction: string;
  initialStatus: RevisionStatus;
  initialDate: string;
  initialVersion: number;
  caseId: string;
  businessName: string;
  onSaved: () => void;
}) {
  const [instruction, setInstruction] = useState(initialInstruction);
  const [status, setStatus] = useState(initialStatus);
  const [followUp, setFollowUp] = useState(initialDate);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [instructionError, setInstructionError] = useState("");
  const [version, setVersion] = useState(initialVersion);
  const [conflict, setConflict] = useState(false);
  const saving = useRef(false);
  const details: Record<RevisionStatus, string> = {
    needs_sending: "Permintaan baru atau koreksi perlu disampaikan.",
    awaiting_reply: "Permintaan sudah benar-benar dikirim lewat WhatsApp.",
    needs_review: "Balasan sudah diterima dan siap diperiksa.",
    completed: "Koreksi telah diperiksa dan pembaruan resmi sudah dilakukan.",
  };
  function submit(event: FormEvent) {
    event.preventDefault();
    if (saving.current) return;
    if (!instruction.trim()) {
      setInstructionError("Tulis arahan revisi terlebih dahulu.");
      document.getElementById("editInstruction")?.focus();
      return;
    }
    if (status === "completed" && !confirmed && initialStatus !== "completed") {
      setError(
        "Konfirmasikan pemeriksaan koreksi dan pembaruan resmi sebelum menyelesaikan revisi.",
      );
      document.getElementById("complete-confirm")?.focus();
      return;
    }
    saving.current = true;
    try {
      updateDemo((current) => {
        const next = changeTasks(
          current,
          [id],
          status,
          followUp || null,
          { [id]: version },
          new Date().toISOString(),
        );
        return {
          ...next,
          tasks: next.tasks.map((task) =>
            task.id === id
              ? { ...task, instruction: instruction.trim() }
              : task,
          ),
        };
      });
      onSaved();
    } catch (failure) {
      const message = (failure as Error).message;
      setError(message);
      setConflict(message.includes("sudah berubah"));
      saving.current = false;
    }
  }
  function reload() {
    updateDemo((current) => {
      const latest = current.tasks.find((task) => task.id === id)!;
      setStatus(latest.status);
      setVersion(latest.version);
      setFollowUp(latest.followUpOn || "");
      return current;
    });
    setConflict(false);
    setError(
      "Status terbaru dimuat. Arahan yang Anda tulis tetap tersedia; periksa lalu simpan kembali.",
    );
  }
  return (
    <>
      <PageHeader title="Perbarui revisi" back={`/kasus/${caseId}`} />
      <div className="task-editor-context">
        <span className="business-symbol">
          <Icon name="cases" />
        </span>
        <div>
          <strong>{businessName}</strong>
          <StatusBadge status={initialStatus} />
        </div>
      </div>
      <form noValidate onSubmit={submit} className="form-panel">
        <Field
          id="editInstruction"
          label="Arahan revisi"
          value={instruction}
          onChange={(value) => {
            setInstruction(value);
            setInstructionError("");
          }}
          multiline
          required
          error={instructionError}
        />
        <fieldset className="option-group status-options">
          <legend>Status revisi</legend>
          {revisionStatuses.map((entry) => (
            <label
              className={`radio-row ${status === entry ? "is-selected" : ""}`}
              key={entry}
            >
              <input
                type="radio"
                name="revisionStatus"
                value={entry}
                checked={status === entry}
                onChange={() => {
                  setStatus(entry);
                  setError("");
                }}
              />
              <span>
                <strong>{statusLabels[entry]}</strong>
                <small>{details[entry]}</small>
              </span>
            </label>
          ))}
        </fieldset>
        <Field
          id="followUpOn"
          label="Tanggal tindak lanjut"
          value={followUp}
          onChange={setFollowUp}
          type="date"
          hint="Tanggal hari ini atau yang lewat masuk antrean Hubungi hari ini selama menunggu balasan."
        />
        {status === "completed" && initialStatus !== "completed" && (
          <label className="checkbox-row completion-confirm">
            <input
              id="complete-confirm"
              type="checkbox"
              checked={confirmed}
              onChange={(event) => setConfirmed(event.target.checked)}
            />
            <span>
              Saya sudah memeriksa koreksi dan mencatat pembaruan resmi yang
              diperlukan.
            </span>
          </label>
        )}
        {status === "needs_sending" && initialStatus === "needs_review" && (
          <Notice>
            Perjelas arahan di atas agar pemilik usaha tahu bagian yang masih
            kurang.
          </Notice>
        )}
        {error && (
          <Notice error={!error.startsWith("Status terbaru")}>
            {error}
            {conflict && (
              <button className="text-link" type="button" onClick={reload}>
                Muat status terbaru
              </button>
            )}
          </Notice>
        )}
        <div className="form-actions">
          <button className="button primary full" type="submit">
            <Icon name="check" />
            Simpan perubahan
          </button>
          {status !== "completed" && (
            <Link
              className="button white full"
              href={`/kasus/${caseId}/pesan?pilih=${id}`}
            >
              <Icon name="message" />
              Siapkan pesan
            </Link>
          )}
        </div>
      </form>
      <p className="end-note">Perubahan hanya berlaku untuk revisi ini.</p>
    </>
  );
}
