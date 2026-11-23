import {isUuid, organizationAccess, type UserClient} from "./access";
import {requestId} from "./mutations";
import {getCase} from "./queries";

export type TransferState = {
  status: "idle" | "invalid" | "error" | "forbidden" | "conflict" | "saved";
  recipient: string;
  seed: string;
  version: number;
  confirmed: boolean;
  message?: string;
  latest?: {assignee: string; version: number};
};

const unavailable = "Pengalihan belum dapat dipastikan. Isian tetap tersedia. Coba lagi dengan pilihan yang sama.";

function field(body: FormData, key: string) {
  const values = body.getAll(key);
  return values.length === 1 && typeof values[0] === "string" ? values[0] : "";
}

export async function saveTransfer(
  client: UserClient, organizationId: string, caseId: string, previous: TransferState, body: FormData,
): Promise<TransferState> {
  const recipient = field(body,"recipient");
  const seed = field(body,"seed");
  const confirmed = field(body,"confirm") === "on";
  const reviewing = previous?.status === "conflict";
  const postedVersion = field(body,reviewing ? "reviewVersion" : "version");
  const version = /^[1-9]\d{0,9}$/.test(postedVersion) ? Number(postedVersion) : 0;
  const reviewed = !reviewing || version === previous.latest?.version;
  const state: TransferState = {
    status: "idle", recipient: isUuid(recipient) ? recipient : "",
    seed: isUuid(seed) ? seed : "", version, confirmed,
  };
  try {
    const context = await organizationAccess(client,organizationId);
    if (context.status === "unavailable") return {...state,status:"error",message:unavailable};
    const forbidden: TransferState = {...state,status:"forbidden",message:"Kasus tidak tersedia atau Anda tidak memiliki akses untuk mengalihkan."};
    if (context.status !== "active" || context.role !== "coordinator") return forbidden;
    const item = await getCase(client,context,caseId);
    if (!item || item.id !== caseId || item.organization_id !== organizationId) return forbidden;
    if (!reviewed) return {...state,status:"conflict",latest:previous.latest,version:previous.version,message:"Tinjau penanggung jawab terbaru sebelum mengalihkan."};
    if (!isUuid(seed) || version < 1 || version > 2_147_483_647) {
      return {...state,status:"invalid",message:"Buka kembali formulir untuk memuat versi kasus yang berlaku."};
    }
    if (!isUuid(recipient)) return {...state,status:"invalid",message:"Pilih pendamping penerima."};
    if (!confirmed) return {...state,status:"invalid",message:"Centang konfirmasi sebelum mengalihkan kasus."};
    const payload = {p_id:caseId,p_expected_version:version,p_assignee_id:recipient};
    const {data,error} = await client.rpc("transfer_case",{
      ...payload, p_request_id:requestId(seed,"transfer_case",payload),
    });
    if (error?.code === "PT409") {
      const latest = await getCase(client,context,caseId);
      if (!latest) return forbidden;
      return {...state,status:"conflict",latest:{assignee:latest.assignee_id,version:latest.version},
        message:"Kasus berubah sejak formulir dibuka. Tinjau penanggung jawab terbaru sebelum menerapkan pilihan Anda."};
    }
    if (error?.code === "42501") return forbidden;
    if (error?.code === "22023") return {...state,status:"invalid",message:"Pilih pendamping aktif yang berbeda di LP3H ini. Muat ulang pilihan bila diperlukan."};
    if (error || !data || typeof data !== "object" || Array.isArray(data) || data.id !== caseId) {
      return {...state,status:"error",message:unavailable};
    }
    return {...state,status:"saved"};
  } catch {
    return {...state,status:"error",message:unavailable};
  }
}
