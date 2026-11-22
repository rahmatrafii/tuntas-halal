import {notFound} from "next/navigation";
import {requireOrganization} from "@/features/caseload/server";
import {RecordFrame} from "@/features/caseload/ui";
import {loadDraftContext} from "@/features/drafts/service";
import {DraftEditor} from "@/features/drafts/editor";
import {draftAction} from "@/features/drafts/actions";

export default async function Page({params,searchParams}:{params:Promise<{organizationId:string;caseId:string}>;searchParams:Promise<{pilih?:string}>}){
  const {organizationId,caseId}=await params,{client,context}=await requireOrganization(organizationId,true);
  const reply=await loadDraftContext(client,organizationId,caseId);
  if(reply.status==="forbidden")notFound();
  if(!reply.context)throw new Error("Draf belum dapat dimuat. Silakan coba lagi.");
  return <RecordFrame context={context} title="Draf WhatsApp" section="kasus">
    <DraftEditor key={`${context.userId}:${organizationId}:${caseId}`} context={reply.context} selectedId={(await searchParams).pilih}
      permalink={`/staf/lembaga/${organizationId}/kasus/${caseId}/pesan`} action={draftAction.bind(null,organizationId,caseId)}/>
  </RecordFrame>;
}
