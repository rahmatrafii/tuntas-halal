import Link from "next/link";
import type {ReactNode} from "react";
import {StaffFrame} from "../staff/ui";
import {organizationPath,type ActiveOrganization} from "./access";
import type {CaseRecord,Page} from "./queries";

export function RecordFrame({context,title,section,children}:{context:ActiveOrganization;title:string;section:"kontak"|"kasus";children:ReactNode}) {
  const base=organizationPath(context.organizationId);
  return <StaffFrame title={title}>
    <p className="record-context"><strong>{context.name}</strong><span>{context.role==="companion"?"Pendamping PPH":"Koordinator LP3H"}</span></p>
    <nav className="record-nav" aria-label="Navigasi lembaga">
      <Link href={`${base}/kontak`} aria-current={section==="kontak"?"page":undefined}>Kontak</Link>
      <Link href={`${base}/kasus`} aria-current={section==="kasus"?"page":undefined}>Kasus</Link>
      <Link href="/staf">Akun dan LP3H</Link>
    </nav>{children}
  </StaffFrame>;
}
export function Pagination({page,path}:{page:Pick<Page<unknown>,"page"|"hasNext">;path:string}) {
  if(page.page===1&&!page.hasNext)return null;
  return <nav className="record-pagination" aria-label="Halaman daftar">
    {page.page>1&&<Link href={`${path}${path.includes("?")?"&":"?"}page=${page.page-1}`}>Sebelumnya</Link>}
    <span>Halaman {page.page}</span>
    {page.hasNext&&<Link href={`${path}${path.includes("?")?"&":"?"}page=${page.page+1}`}>Berikutnya</Link>}
  </nav>;
}
export function CaseList({items,basePath,userId}:{items:CaseRecord[];basePath:string;userId:string}) {
  return <ul className="record-list">{items.map(item=><li key={item.id}><Link href={`${basePath}/kasus/${item.id}`}>
    <strong>{item.business_contacts.business_name}</strong><span>{item.official_reference||"Belum ada nomor pengajuan"}</span>
    <span>Penanggung jawab: {item.assignee_id===userId?"Anda":"Pendamping lain"}</span>
  </Link></li>)}</ul>;
}
