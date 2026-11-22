import {randomUUID} from "node:crypto";
import {notFound} from "next/navigation";
import {requireOrganization} from "@/features/caseload/server";
import {getCase} from "@/features/caseload/queries";
import {organizationPath,isUuid} from "@/features/caseload/access";
import {RecordFrame} from "@/features/caseload/ui";
import {StatusForm} from "@/features/status/forms";
import {statusAction} from "@/features/status/actions";
import {allTasks} from "@/features/status/queries";
export default async function Page({params,searchParams}:{params:Promise<{organizationId:string;caseId:string}>;searchParams:Promise<{pilih?:string|string[]}>}){
 const {organizationId,caseId}=await params,{client,context}=await requireOrganization(organizationId,true);
 const parent=await getCase(client,context,caseId);if(!parent||parent.assignee_id!==context.userId)notFound();
 const tasks=(await allTasks(client,context,caseId)).filter(t=>t.status==="needs_sending");const query=(await searchParams).pilih;
 const requested=new Set((Array.isArray(query)?query:[query]).filter(isUuid).slice(0,100));const base=`${organizationPath(organizationId)}/kasus/${caseId}`;
 return <RecordFrame context={context} title="Catat pengiriman" section="kasus"><p className="notice">Catat setelah pesan benar-benar dikirim. Membuka WhatsApp tidak mengubah status.</p>
 <StatusForm mode="send" tasks={tasks} businessName={parent.business_contacts.business_name} cancelHref={base} permalink={`${base}/pengiriman`}
 initial={{status:"idle",seed:randomUUID(),selected:tasks.filter(t=>requested.has(t.id)).map(t=>t.id),versions:Object.fromEntries(tasks.map(t=>[t.id,t.version])),values:{status:"awaiting_reply",followUpOn:"",datePolicy:"",sent:"",completion:""}}} action={statusAction.bind(null,organizationId,caseId,"send")}/></RecordFrame>;
}
