export const revisionStatuses = [
  "needs_sending",
  "awaiting_reply",
  "needs_review",
  "completed",
] as const;

export type RevisionStatus = (typeof revisionStatuses)[number];
export type QueueGroup = "contact_today" | RevisionStatus;

export const statusLabels: Record<RevisionStatus, string> = {
  needs_sending: "Perlu dikirim",
  awaiting_reply: "Menunggu balasan",
  needs_review: "Perlu dicek",
  completed: "Selesai",
};

export const queueOrder: readonly QueueGroup[] = [
  "contact_today",
  "needs_review",
  "needs_sending",
  "awaiting_reply",
];

export function localCalendarDate(now: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)!.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function queueGroup(
  status: RevisionStatus,
  followUpOn: string | null,
  today: string,
): QueueGroup {
  if (!isCalendarDate(today) || (followUpOn !== null && !isCalendarDate(followUpOn))) {
    throw new Error("Tanggal kalender tidak valid.");
  }
  return status === "awaiting_reply" && followUpOn !== null && followUpOn <= today
    ? "contact_today"
    : status;
}

export function isCaseComplete(statuses: readonly RevisionStatus[]): boolean {
  return statuses.length > 0 && statuses.every((status) => status === "completed");
}
