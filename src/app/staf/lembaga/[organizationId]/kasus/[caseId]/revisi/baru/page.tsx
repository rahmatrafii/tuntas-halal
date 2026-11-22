import {randomUUID} from "node:crypto";
import {notFound} from "next/navigation";
import {requireOrganization} from "@/features/caseload/server";
import {getCase} from "@/features/caseload/queries";
import {organizationPath} from "@/features/caseload/access";
import {RecordFrame} from "@/features/caseload/ui";
import {TaskForm} from "@/features/revisions/forms";
import {taskAction} from "@/features/revisions/actions";

export default async function Page({params}:{params:Promise<{organizationId:string;caseId:string}>}){
  const {organizationId,caseId}=await params,{client,context}=await requireOrganization(organizationId,true);
  const item=await getCase(client,context,caseId);if(!item||item.assignee_id!==context.userId)notFound();
  const path=`${organizationPath(organizationId)}/kasus/${caseId}`;
  return <RecordFrame context={context} title="Tambah revisi" section="kasus">
    <TaskForm mode="create" initial={{status:"idle",resourceId:randomUUID(),intentSeed:randomUUID(),values:{instruction:""}}}
      action={taskAction.bind(null,organizationId,caseId,"create")} businessName={item.business_contacts.business_name}
      permalink={`${path}/revisi/baru`} cancelHref={path}/>
  </RecordFrame>;
}
