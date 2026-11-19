import {
  isCaseComplete,
  queueGroup,
  queueOrder,
  statusLabels,
  type RevisionStatus,
} from "@/lib/domain/revisions";
import {
  DEMO_TODAY,
  staff,
  type DemoState,
  type Case,
  type Task,
} from "./model";

export function canReadCase(state: DemoState, item: Case): boolean {
  const user = staff.find(
    (person) => person.id === state.staffId && person.active,
  );
  return Boolean(
    user && (user.role === "coordinator" || item.assigneeId === user.id),
  );
}
export function visibleCases(state: DemoState): Case[] {
  return state.cases.filter((item) => canReadCase(state, item));
}
export function visibleContacts(state: DemoState) {
  const ids = new Set(visibleCases(state).map((item) => item.contactId));
  return state.contacts.filter(
    (contact) => contact.ownerId === state.staffId || ids.has(contact.id),
  );
}
export function tasksForCase(state: DemoState, caseId: string) {
  return state.tasks.filter((task) => task.caseId === caseId);
}
export function caseComplete(state: DemoState, caseId: string) {
  return isCaseComplete(tasksForCase(state, caseId).map((task) => task.status));
}
export function filterTasks(
  state: DemoState,
  query = "",
  filter = "all",
  assignee = "all",
): Task[] {
  const cases = visibleCases(state).filter(
    (item) => assignee === "all" || item.assigneeId === assignee,
  );
  const term = query.trim().toLocaleLowerCase("id");
  return state.tasks
    .filter((task) => {
      const item = cases.find((entry) => entry.id === task.caseId);
      if (!item) return false;
      const contact = state.contacts.find(
        (entry) => entry.id === item.contactId,
      )!;
      const matches = `${contact.name} ${item.reference}`
        .toLocaleLowerCase("id")
        .includes(term);
      const group = queueGroup(task.status, task.followUpOn, DEMO_TODAY);
      return (
        matches &&
        (filter === "all"
          ? task.status !== "completed"
          : filter === group || filter === task.status)
      );
    })
    .sort((a, b) => {
      const rank = (task: Task) => {
        const index = queueOrder.indexOf(
          queueGroup(task.status, task.followUpOn, DEMO_TODAY),
        );
        return index < 0 ? 9 : index;
      };
      return (
        rank(a) - rank(b) ||
        (a.followUpOn ?? "9999").localeCompare(b.followUpOn ?? "9999")
      );
    });
}

export function changeTasks(
  state: DemoState,
  ids: string[],
  status: RevisionStatus,
  followUpOn: string | null,
  expectedVersions: Record<string, number>,
  at: string,
): DemoState {
  const selected = state.tasks.filter((task) => ids.includes(task.id));
  if (
    !ids.length ||
    selected.length !== new Set(ids).size ||
    new Set(selected.map((task) => task.caseId)).size !== 1
  )
    throw new Error("Pilih revisi dari satu kasus.");
  const item = state.cases.find((entry) => entry.id === selected[0].caseId)!;
  if (!canReadCase(state, item) || item.assigneeId !== state.staffId)
    throw new Error(
      "Hanya pendamping penanggung jawab yang dapat mengubah revisi.",
    );
  if (selected.some((task) => task.version !== expectedVersions[task.id]))
    throw new Error(
      "Status sudah berubah. Muat data terbaru sebelum mencoba lagi.",
    );
  return {
    ...state,
    tasks: state.tasks.map((task) =>
      ids.includes(task.id)
        ? { ...task, status, followUpOn, version: task.version + 1 }
        : task,
    ),
    history: [
      {
        id: `h-${at}-${ids.join("-")}`,
        caseId: item.id,
        actorId: state.staffId!,
        title: `${selected.length} revisi: ${statusLabels[status].toLowerCase()}`,
        detail: followUpOn
          ? `Tindak lanjut dijadwalkan ${followUpOn}.`
          : "Status diperbarui oleh pendamping.",
        at,
      },
      ...state.history,
    ],
  };
}

export function transferCase(
  state: DemoState,
  caseId: string,
  targetId: string,
  expectedVersion: number,
  at: string,
): DemoState {
  const actor = staff.find((person) => person.id === state.staffId);
  const target = staff.find(
    (person) =>
      person.id === targetId && person.active && person.role === "companion",
  );
  const item = state.cases.find((entry) => entry.id === caseId);
  if (actor?.role !== "coordinator" || !target || !item)
    throw new Error(
      "Pengalihan hanya dapat dilakukan koordinator kepada pendamping aktif.",
    );
  if (item.version !== expectedVersion)
    throw new Error("Penanggung jawab sudah berubah. Muat data terbaru.");
  if (item.assigneeId === target.id)
    throw new Error("Pilih pendamping yang berbeda.");
  return {
    ...state,
    cases: state.cases.map((entry) =>
      entry.id === caseId
        ? { ...entry, assigneeId: target.id, version: entry.version + 1 }
        : entry,
    ),
    history: [
      {
        id: `transfer-${at}`,
        caseId,
        actorId: actor.id,
        title: "Penanggung jawab dialihkan",
        detail: `${staff.find((person) => person.id === item.assigneeId)?.name} ke ${target.name}.`,
        at,
      },
      ...state.history,
    ],
  };
}

export function dateLabel(value: string | null, withYear = false) {
  if (!value) return "Belum dijadwalkan";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: "Asia/Jakarta",
  }).format(new Date(`${value.slice(0, 10)}T12:00:00+07:00`));
}
