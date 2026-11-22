import Link from "next/link";
import {randomUUID} from "node:crypto";
import {notFound} from "next/navigation";
import {requireOrganization} from "@/features/caseload/server";
import {getContact,listContacts} from "@/features/caseload/queries";
import {organizationPath} from "@/features/caseload/access";
import {RecordFrame,Pagination} from "@/features/caseload/ui";
import {RecordForm} from "@/features/caseload/forms";
import {caseAction} from "@/features/caseload/actions";

export default async function Page({params,searchParams}:{params:Promise<{organizationId:string}>;searchParams:Promise<{kontak?:string;page?:string}>}) {
  const {organizationId}=await params,{client,context}=await requireOrganization(organizationId,true),query=await searchParams,base=organizationPath(organizationId);
  if(!query.kontak){
    const contacts=await listContacts(client,context,query.page,true);
    return <RecordFrame context={context} title="Pilih kontak untuk kasus" section="kasus">
      <p className="page-description">Pilih kontak usaha milik Anda atau simpan kontak baru.</p>
      <Link className="button outline" href={`${base}/kontak/baru?lanjut=kasus`}>Tambah kontak baru</Link>
      {contacts.items.length?<ul className="record-list">{contacts.items.map(item=><li key={item.id}><Link href={`${base}/kasus/baru?kontak=${item.id}`}><strong>{item.business_name}</strong><span>{item.whatsapp_number}</span><span>Pilih kontak</span></Link></li>)}</ul>:<p className="notice">Belum ada kontak milik Anda. Tambahkan kontak terlebih dahulu.</p>}
      <Pagination page={contacts} path={`${base}/kasus/baru`}/>
    </RecordFrame>;
  }
  const item=await getContact(client,context,query.kontak);if(!item||item.owner_id!==context.userId)notFound();
  return <RecordFrame context={context} title="Buat kasus" section="kasus">
    <Link className="staff-help" href={`${base}/kasus/baru`}>Pilih kontak lain</Link>
    <RecordForm kind="case" mode="create" initial={{status:"idle",values:{contactId:item.id,reference:""},resourceId:randomUUID(),intentSeed:randomUUID()}}
      action={caseAction.bind(null,organizationId,"create")} contactName={item.business_name} basePath={base} permalink={`${base}/kasus/baru?kontak=${item.id}`} cancelHref={`${base}/kasus`}/>
  </RecordFrame>;
}
