import Link from "next/link";
import {notFound} from "next/navigation";
import {requireOrganization} from "@/features/caseload/server";
import {getContact,listCases} from "@/features/caseload/queries";
import {organizationPath} from "@/features/caseload/access";
import {RecordFrame,CaseList,Pagination} from "@/features/caseload/ui";

export default async function Page({params,searchParams}:{params:Promise<{organizationId:string;contactId:string}>;searchParams:Promise<{page?:string}>}) {
  const {organizationId,contactId}=await params,{client,context}=await requireOrganization(organizationId);
  const item=await getContact(client,context,contactId);if(!item)notFound();
  const base=organizationPath(organizationId),own=context.role==="companion"&&item.owner_id===context.userId;
  const cases=await listCases(client,context,(await searchParams).page,contactId);
  return <RecordFrame context={context} title={item.business_name} section="kontak">
    <dl className="record-details"><div><dt>Nomor WhatsApp</dt><dd>{item.whatsapp_number}</dd></div><div><dt>Sapaan</dt><dd>{item.greeting_name||"Belum diisi"}</dd></div><div><dt>Pemilik kontak</dt><dd>{item.owner_id===context.userId?"Anda":"Pendamping lain"}</dd></div></dl>
    {own?<div className="record-actions"><Link className="button primary" href={`${base}/kasus/baru?kontak=${item.id}`}>Buat kasus</Link><Link className="button outline" href={`${base}/kontak/${item.id}/edit`}>Ubah kontak</Link></div>:<p className="notice">Kontak ini dapat dibaca melalui kasus yang dapat Anda akses. Perubahan kontak dilakukan oleh pemiliknya.</p>}
    <h2>Kasus terkait yang dapat Anda akses</h2>
    {cases.items.length?<CaseList items={cases.items} basePath={base} userId={context.userId}/>:<p className="notice">Belum ada kasus yang dapat ditampilkan.</p>}
    <Pagination page={cases} path={`${base}/kontak/${contactId}`}/>
  </RecordFrame>;
}
