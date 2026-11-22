import {randomUUID} from "node:crypto";
import {notFound} from "next/navigation";
import {requireOrganization} from "@/features/caseload/server";
import {getCase} from "@/features/caseload/queries";
import {organizationPath} from "@/features/caseload/access";
import {RecordFrame} from "@/features/caseload/ui";
import {getTask} from "@/features/revisions/queries";
import {StatusForm} from "@/features/status/forms";
import {statusAction} from "@/features/status/actions";
export default async function Page({params}:{params:Promise<{organizationId:string;caseId:string;taskId:string}>}){
 const {organizationId,caseId,taskId}=await params,{client,context}=await requireOrganization(organizationId,true);
 const parent=await getCase(client,context,caseId);if(!parent||parent.assignee_id!==context.userId)notFound();
 const task=await getTask(client,context,caseId,taskId);if(!task)notFound();const base=`${organizationPath(organizationId)}/kasus/${caseId}`;
 return <RecordFrame context={context} title="Perbarui status revisi" section="kasus"><StatusForm mode="single" tasks={[task]} businessName={parent.business_contacts.business_name} cancelHref={base} permalink={`${base}/revisi/${taskId}/status`}
 initial={{status:"idle",seed:randomUUID(),selected:[task.id],versions:{[task.id]:task.version},values:{status:task.status,followUpOn:task.follow_up_on??"",datePolicy:"same",sent:"",completion:""}}} action={statusAction.bind(null,organizationId,caseId,"single")}/></RecordFrame>;
}
