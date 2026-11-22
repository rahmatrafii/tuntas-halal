import {randomUUID} from "node:crypto";
import {notFound} from "next/navigation";
import {requireOrganization} from "@/features/caseload/server";
import {getCase} from "@/features/caseload/queries";
import {organizationPath} from "@/features/caseload/access";
import {RecordFrame} from "@/features/caseload/ui";
import {getTask} from "@/features/revisions/queries";
import {TaskForm} from "@/features/revisions/forms";
import {taskAction} from "@/features/revisions/actions";

export default async function Page({params}:{params:Promise<{organizationId:string;caseId:string;taskId:string}>}){
  const {organizationId,caseId,taskId}=await params,{client,context}=await requireOrganization(organizationId,true);
  const parent=await getCase(client,context,caseId);if(!parent||parent.assignee_id!==context.userId)notFound();
  const task=await getTask(client,context,caseId,taskId);if(!task)notFound();
  const path=`${organizationPath(organizationId)}/kasus/${caseId}`;
  return <RecordFrame context={context} title="Ubah instruksi revisi" section="kasus">
    <TaskForm mode="update" initial={{status:"idle",resourceId:task.id,intentSeed:randomUUID(),values:{instruction:task.instruction,expectedVersion:String(task.version)}}}
      status={task.status} action={taskAction.bind(null,organizationId,caseId,"update")} businessName={parent.business_contacts.business_name}
      permalink={`${path}/revisi/${taskId}/edit`} cancelHref={path}/>
  </RecordFrame>;
}
