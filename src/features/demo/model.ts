import type { RevisionStatus } from "@/lib/domain/revisions";

export const DEMO_TODAY = "2026-11-19";
export const DEMO_TIME = "2026-11-19T09:30:00+07:00";
export type Staff = {
  id: string;
  name: string;
  initials: string;
  role: "companion" | "coordinator";
  color: string;
  active: boolean;
};
export type Contact = {
  id: string;
  ownerId: string;
  name: string;
  greeting: string;
  phone: string;
  category: string;
};
export type Case = {
  id: string;
  contactId: string;
  assigneeId: string;
  reference: string;
  createdAt: string;
  version: number;
};
export type Task = {
  id: string;
  caseId: string;
  instruction: string;
  status: RevisionStatus;
  followUpOn: string | null;
  version: number;
};
export type Audit = {
  id: string;
  caseId: string;
  actorId: string;
  title: string;
  detail: string;
  at: string;
};
export type DemoState = {
  schema: 1;
  staffId: string | null;
  contacts: Contact[];
  cases: Case[];
  tasks: Task[];
  history: Audit[];
  drafts: Record<string, { selected: string[]; message: string }>;
};

export const staff: Staff[] = [
  {
    id: "nadia",
    name: "Nadia Putri",
    initials: "NP",
    role: "companion",
    color: "peach",
    active: true,
  },
  {
    id: "farhan",
    name: "Farhan Akbar",
    initials: "FA",
    role: "companion",
    color: "blue",
    active: true,
  },
  {
    id: "ayu",
    name: "Ayu Lestari",
    initials: "AL",
    role: "companion",
    color: "green",
    active: true,
  },
  {
    id: "ratna",
    name: "Ratna Sari",
    initials: "RS",
    role: "coordinator",
    color: "lilac",
    active: true,
  },
];

export const initialState: DemoState = {
  schema: 1,
  staffId: "nadia",
  contacts: [
    {
      id: "rina",
      ownerId: "nadia",
      name: "Keripik Bu Rina",
      greeting: "Bu Rina",
      phone: "6281200000101",
      category: "Makanan ringan",
    },
    {
      id: "sari",
      ownerId: "nadia",
      name: "Dapur Sari Rasa",
      greeting: "Bu Sari",
      phone: "6281200000102",
      category: "Makanan siap saji",
    },
    {
      id: "budi",
      ownerId: "nadia",
      name: "Roti Pak Budi",
      greeting: "Pak Budi",
      phone: "6281200000103",
      category: "Roti & kue",
    },
    {
      id: "madu",
      ownerId: "nadia",
      name: "Madu Alam Lestari",
      greeting: "Pak Arif",
      phone: "6281200000104",
      category: "Minuman & madu",
    },
    {
      id: "tempe",
      ownerId: "farhan",
      name: "Tempe Berkah",
      greeting: "Pak Hasan",
      phone: "6281200000105",
      category: "Olahan kedelai",
    },
    {
      id: "kopi",
      ownerId: "ayu",
      name: "Kopi Pagi",
      greeting: "Mbak Dini",
      phone: "6281200000106",
      category: "Minuman",
    },
  ],
  cases: [
    {
      id: "kasus-rina",
      contactId: "rina",
      assigneeId: "nadia",
      reference: "SH-2026-08124",
      createdAt: "2026-11-12",
      version: 1,
    },
    {
      id: "kasus-sari",
      contactId: "sari",
      assigneeId: "nadia",
      reference: "SH-2026-08156",
      createdAt: "2026-11-13",
      version: 1,
    },
    {
      id: "kasus-budi",
      contactId: "budi",
      assigneeId: "nadia",
      reference: "SH-2026-08203",
      createdAt: "2026-11-14",
      version: 1,
    },
    {
      id: "kasus-madu",
      contactId: "madu",
      assigneeId: "nadia",
      reference: "SH-2026-08091",
      createdAt: "2026-11-10",
      version: 1,
    },
    {
      id: "kasus-tempe",
      contactId: "tempe",
      assigneeId: "farhan",
      reference: "SH-2026-08215",
      createdAt: "2026-11-15",
      version: 1,
    },
    {
      id: "kasus-kopi",
      contactId: "kopi",
      assigneeId: "ayu",
      reference: "SH-2026-08228",
      createdAt: "2026-11-16",
      version: 1,
    },
    {
      id: "kasus-rina-lama",
      contactId: "rina",
      assigneeId: "nadia",
      reference: "SH-2026-07210",
      createdAt: "2026-10-20",
      version: 1,
    },
  ],
  tasks: [
    {
      id: "t-rina-1",
      caseId: "kasus-rina",
      instruction:
        "Kirim ulang foto komposisi bumbu balado dengan tulisan yang terbaca jelas.",
      status: "awaiting_reply",
      followUpOn: "2026-11-19",
      version: 1,
    },
    {
      id: "t-rina-2",
      caseId: "kasus-rina",
      instruction: "Lengkapi nama produsen minyak goreng yang digunakan.",
      status: "awaiting_reply",
      followUpOn: "2026-11-18",
      version: 1,
    },
    {
      id: "t-rina-3",
      caseId: "kasus-rina",
      instruction: "Perbarui daftar bahan pada formulir pengajuan.",
      status: "completed",
      followUpOn: null,
      version: 1,
    },
    {
      id: "t-sari-1",
      caseId: "kasus-sari",
      instruction: "Periksa foto label kecap dan cocokkan dengan daftar bahan.",
      status: "needs_review",
      followUpOn: null,
      version: 1,
    },
    {
      id: "t-sari-2",
      caseId: "kasus-sari",
      instruction: "Kirim foto kemasan kaldu bubuk bagian depan dan komposisi.",
      status: "needs_sending",
      followUpOn: null,
      version: 1,
    },
    {
      id: "t-budi-1",
      caseId: "kasus-budi",
      instruction: "Kirim foto label margarin lengkap dengan nama produsen.",
      status: "needs_sending",
      followUpOn: "2026-11-20",
      version: 1,
    },
    {
      id: "t-budi-2",
      caseId: "kasus-budi",
      instruction: "Lengkapi informasi bahan pengembang roti.",
      status: "awaiting_reply",
      followUpOn: "2026-11-21",
      version: 1,
    },
    {
      id: "t-madu-1",
      caseId: "kasus-madu",
      instruction: "Kirim keterangan proses pengemasan madu.",
      status: "awaiting_reply",
      followUpOn: "2026-11-23",
      version: 1,
    },
    {
      id: "t-tempe-1",
      caseId: "kasus-tempe",
      instruction: "Kirim foto kemasan ragi tempe yang digunakan.",
      status: "awaiting_reply",
      followUpOn: "2026-11-18",
      version: 1,
    },
    {
      id: "t-kopi-1",
      caseId: "kasus-kopi",
      instruction: "Periksa keterangan bahan perisa pada varian kopi susu.",
      status: "needs_review",
      followUpOn: null,
      version: 1,
    },
    {
      id: "t-rina-lama",
      caseId: "kasus-rina-lama",
      instruction:
        "Periksa koreksi daftar bahan dan catat pembaruan di kanal resmi.",
      status: "completed",
      followUpOn: null,
      version: 1,
    },
  ],
  history: [
    {
      id: "h1",
      caseId: "kasus-rina",
      actorId: "nadia",
      title: "Permintaan sudah dikirim",
      detail: "2 revisi ditandai menunggu balasan.",
      at: "2026-11-17T10:30:00+07:00",
    },
    {
      id: "h2",
      caseId: "kasus-rina",
      actorId: "nadia",
      title: "Satu revisi diselesaikan",
      detail: "Koreksi diperiksa dan pembaruan resmi dicatat.",
      at: "2026-11-16T14:15:00+07:00",
    },
    {
      id: "h3",
      caseId: "kasus-rina",
      actorId: "nadia",
      title: "Kasus dibuat",
      detail: "3 tugas revisi dicatat untuk Keripik Bu Rina.",
      at: "2026-11-12T09:00:00+07:00",
    },
  ],
  drafts: {},
};
