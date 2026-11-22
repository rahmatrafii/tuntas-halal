import {randomUUID} from "node:crypto";
import {notFound} from "next/navigation";
import {requireOrganization} from "@/features/caseload/server";
import {getContact} from "@/features/caseload/queries";
import {organizationPath} from "@/features/caseload/access";
import {RecordFrame} from "@/features/caseload/ui";
import {RecordForm} from "@/features/caseload/forms";
import {contactAction} from "@/features/caseload/actions";

export default async function Page({params}:{params:Promise<{organizationId:string;contactId:string}>}) {
  const {organizationId,contactId}=await params,{client,context}=await requireOrganization(organizationId,true);
  const item=await getContact(client,context,contactId);if(!item||item.owner_id!==context.userId)notFound();
  const base=organizationPath(organizationId);
  return <RecordFrame context={context} title="Ubah kontak" section="kontak">
    <p className="notice">Perubahan kontak berlaku pada semua kasus yang memakai kontak ini.</p>
    <RecordForm kind="contact" mode="update" initial={{status:"idle",resourceId:item.id,intentSeed:randomUUID(),values:{businessName:item.business_name,phone:item.whatsapp_number,greeting:item.greeting_name,expectedVersion:String(item.version)}}}
      action={contactAction.bind(null,organizationId,"update")} basePath={base} permalink={`${base}/kontak/${contactId}/edit`} cancelHref={`${base}/kontak/${contactId}`}/>
  </RecordFrame>;
}
