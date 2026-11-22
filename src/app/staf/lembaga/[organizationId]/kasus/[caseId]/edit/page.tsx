import {randomUUID} from "node:crypto";
import {notFound} from "next/navigation";
import {requireOrganization} from "@/features/caseload/server";
import {getCase} from "@/features/caseload/queries";
import {organizationPath} from "@/features/caseload/access";
import {RecordFrame} from "@/features/caseload/ui";
import {RecordForm} from "@/features/caseload/forms";
import {caseAction} from "@/features/caseload/actions";

export default async function Page({params}:{params:Promise<{organizationId:string;caseId:string}>}) {
  const {organizationId,caseId}=await params,{client,context}=await requireOrganization(organizationId,true);
  const item=await getCase(client,context,caseId);if(!item||item.assignee_id!==context.userId)notFound();
  const base=organizationPath(organizationId);
  return <RecordFrame context={context} title="Ubah nomor pengajuan" section="kasus">
    <RecordForm kind="case" mode="update" initial={{status:"idle",resourceId:item.id,intentSeed:randomUUID(),values:{reference:item.official_reference??"",contactId:item.contact_id,expectedVersion:String(item.version)}}}
      action={caseAction.bind(null,organizationId,"update")} contactName={item.business_contacts.business_name} basePath={base} permalink={`${base}/kasus/${caseId}/edit`} cancelHref={`${base}/kasus/${caseId}`}/>
  </RecordFrame>;
}
