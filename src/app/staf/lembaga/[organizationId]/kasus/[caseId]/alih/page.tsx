import {randomUUID} from "node:crypto";
import {notFound} from "next/navigation";
import {organizationPath} from "@/features/caseload/access";
import {requireOrganization} from "@/features/caseload/server";
import {getCase,listCompanionAccounts} from "@/features/caseload/queries";
import {RecordFrame,companionLabel} from "@/features/caseload/ui";
import {transferAction} from "@/features/caseload/actions";
import {TransferForm} from "@/features/caseload/transfer-form";

export default async function Page({params}: {params:Promise<{organizationId:string;caseId:string}>}) {
  const {organizationId,caseId} = await params;
  const {client,context} = await requireOrganization(organizationId);
  if (context.role !== "coordinator") notFound();
  const item = await getCase(client,context,caseId);
  if (!item) notFound();
  const accounts = await listCompanionAccounts(client,context);
  const casePath = `${organizationPath(organizationId)}/kasus/${caseId}`;

  return <RecordFrame context={context} title="Alihkan kasus" section="kasus">
    <dl className="record-details transfer-context">
      <div><dt>Usaha</dt><dd>{item.business_contacts.business_name}</dd></div>
      <div><dt>Nomor pengajuan</dt><dd>{item.official_reference||"Belum tersedia"}</dd></div>
      <div><dt>Penanggung jawab saat ini</dt><dd>{companionLabel(item.assignee_id)}</dd></div>
    </dl>
    <details className="record-disclosure account-code"><summary>Kode akun saat ini</summary><p>{item.assignee_id}</p></details>
    <TransferForm action={transferAction.bind(null,organizationId,caseId)} path={`${casePath}/alih`} casePath={casePath}
      assignee={item.assignee_id} recipients={accounts.filter(account=>account.is_active).map(account=>account.user_id)}
      initial={{status:"idle",recipient:"",seed:randomUUID(),version:item.version,confirmed:false}}/>
  </RecordFrame>;
}
