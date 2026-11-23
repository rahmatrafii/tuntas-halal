import Link from "next/link";
import {BookUser, ChevronRight, ClipboardList, Folders, UserRound} from "lucide-react";
import type {ReactNode} from "react";
import {StaffFrame} from "../staff/ui";
import {organizationPath,type ActiveOrganization} from "./access";
import type {CaseRecord,Page} from "./queries";

export function RecordFrame({context,title,section,children}:{context:ActiveOrganization;title:string;section:"antrean"|"kontak"|"kasus";children:ReactNode}) {
  const base=organizationPath(context.organizationId);
  return <StaffFrame title={title} record>
    <p className="record-context"><strong>{context.name}</strong><span>{context.role==="companion"?"Pendamping PPH":"Koordinator LP3H"}</span></p>
    <nav className="record-nav" aria-label="Navigasi lembaga">
      <Link href={`${base}/antrean`} aria-current={section==="antrean"?"page":undefined}><ClipboardList size={18} aria-hidden="true"/>Antrean</Link>
      <Link href={`${base}/kasus`} aria-current={section==="kasus"?"page":undefined}><Folders size={18} aria-hidden="true"/>Kasus</Link>
      <Link href={`${base}/kontak`} aria-current={section==="kontak"?"page":undefined}><BookUser size={18} aria-hidden="true"/>Kontak</Link>
      <Link href="/staf"><UserRound size={18} aria-hidden="true"/>Akun</Link>
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
const shortAccountCode = (id: string) => `${id.slice(0,4).toUpperCase()}–${id.slice(-8).toUpperCase()}`;
export function companionLabel(id: string, accounts: readonly string[] = []) {
  const code = shortAccountCode(id);
  return `Pendamping ${accounts.some(other => other !== id && shortAccountCode(other) === code) ? id : code}`;
}

export function CaseList({items,basePath,userId,newRevision=false,showAccount=false}:{items:CaseRecord[];basePath:string;userId:string;newRevision?:boolean;showAccount?:boolean}) {
  return <ul className="record-list">{items.map(item=><li key={item.id}><Link href={`${basePath}/kasus/${item.id}${newRevision?"/revisi/baru":""}`}>
    <div><strong>{item.business_contacts.business_name}</strong><span>{item.official_reference||"Belum ada nomor pengajuan"}</span>
    <span title={showAccount?item.assignee_id:undefined}>Penanggung jawab: {showAccount?companionLabel(item.assignee_id):item.assignee_id===userId?"Anda":"Pendamping lain"}</span></div>
    <ChevronRight size={20} aria-hidden="true"/>
  </Link></li>)}</ul>;
}
