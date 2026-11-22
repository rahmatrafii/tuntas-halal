import {randomUUID} from "node:crypto";
import {requireOrganization} from "@/features/caseload/server";
import {organizationPath} from "@/features/caseload/access";
import {RecordFrame} from "@/features/caseload/ui";
import {RecordForm} from "@/features/caseload/forms";
import {contactAction} from "@/features/caseload/actions";

export default async function Page({params,searchParams}:{params:Promise<{organizationId:string}>;searchParams:Promise<{lanjut?:string}>}) {
  const {organizationId}=await params,{context}=await requireOrganization(organizationId,true),base=organizationPath(organizationId);
  const continueCase=(await searchParams).lanjut==="kasus",path=`${base}/kontak/baru${continueCase?"?lanjut=kasus":""}`;
  return <RecordFrame context={context} title="Tambah kontak" section="kontak">
    <p className="page-description">Simpan kontak usaha untuk digunakan pada pengajuan berikutnya.</p>
    {continueCase&&<p className="notice">Simpan kontak terlebih dahulu, kemudian lengkapi kasusnya.</p>}
    <RecordForm kind="contact" mode="create" initial={{status:"idle",values:{},resourceId:randomUUID(),intentSeed:randomUUID()}}
      action={contactAction.bind(null,organizationId,"create")} basePath={base} permalink={path} cancelHref={`${base}/kontak`} continueCase={continueCase}/>
  </RecordFrame>;
}
