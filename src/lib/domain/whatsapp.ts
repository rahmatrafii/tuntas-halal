export function normalizeWhatsAppNumber(input: string): string | null {
  const value = input.trim();
  if (!/^\+?[\d\s().-]+$/.test(value)) return null;
  let digits = value.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `62${digits.slice(1)}`;
  // Format validation only; this does not prove the number has a WhatsApp account.
  return /^[1-9]\d{7,14}$/.test(digits) ? digits : null;
}

export function whatsappChatUrl(number: string, message: string): string | null {
  const normalized = normalizeWhatsAppNumber(number);
  if (!normalized || !message.trim()) return null;
  // Bypass the wa.me redirect, which can replace Unicode message characters.
  return `https://api.whatsapp.com/send?phone=${normalized}&text=${encodeURIComponent(message)}`;
}

type DraftTask = { id: string; caseId: string; instruction: string };

export function composeWhatsAppDraft(input: {
  businessName: string;
  greetingName?: string;
  tasks: readonly DraftTask[];
}): string {
  const businessName = input.businessName.trim();
  const { tasks } = input;
  if (!businessName || tasks.length === 0) {
    throw new Error("Pilih usaha dan minimal satu revisi.");
  }
  if (new Set(tasks.map((task) => task.caseId)).size !== 1 || !tasks[0].caseId.trim()) {
    throw new Error("Draf hanya boleh memuat revisi dari satu kasus.");
  }
  if (new Set(tasks.map((task) => task.id)).size !== tasks.length) {
    throw new Error("Revisi yang dipilih tidak boleh ganda.");
  }
  if (tasks.some((task) => !task.instruction.trim() || !task.id.trim())) {
    throw new Error("Instruksi revisi tidak boleh kosong.");
  }
  const greeting = input.greetingName?.trim();
  const instructions = tasks
    .map((task, index) => `${index + 1}. ${task.instruction.trim()}`)
    .join("\n");
  return `Halo${greeting ? ` ${greeting}` : ""}, untuk pengajuan ${businessName}, mohon bantu melengkapi revisi berikut:\n\n${instructions}\n\nTerima kasih.`;
}
