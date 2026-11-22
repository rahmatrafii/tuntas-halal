import Link from "next/link";
import {requireOrganization} from "@/features/caseload/server";
import {listContacts} from "@/features/caseload/queries";
import {organizationPath} from "@/features/caseload/access";
import {RecordFrame,Pagination} from "@/features/caseload/ui";

export default async function Page({params,searchParams}:{params:Promise<{organizationId:string}>;searchParams:Promise<{page?:string}>}) {
  const {organizationId}=await params,{client,context}=await requireOrganization(organizationId);
  const contacts=await listContacts(client,context,(await searchParams).page),base=organizationPath(organizationId);
  return <RecordFrame context={context} title="Kontak usaha" section="kontak">
    {context.role==="companion"&&<Link className="button primary" href={`${base}/kontak/baru`}>Tambah kontak</Link>}
    {contacts.items.length?<ul className="record-list">{contacts.items.map(item=><li key={item.id}><Link href={`${base}/kontak/${item.id}`}>
      <strong>{item.business_name}</strong><span>{item.whatsapp_number}</span><span>Pemilik kontak: {item.owner_id===context.userId?"Anda":"Pendamping lain"}</span>
    </Link></li>)}</ul>:<p className="notice">Belum ada kontak yang dapat ditampilkan.</p>}
    <Pagination page={contacts} path={`${base}/kontak`}/>
  </RecordFrame>;
}
