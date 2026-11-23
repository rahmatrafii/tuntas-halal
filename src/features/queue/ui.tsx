import Link from "next/link";
import {ChevronRight, Plus, Search} from "lucide-react";
import {RecordFrame} from "../caseload/ui";
import {organizationPath,type ActiveOrganization} from "../caseload/access";
import {statusLabels,type QueueGroup} from "../../lib/domain/revisions";
import {queueFilters,type QueuePage,type QueueItem} from "./queries";

const labels={all:"Semua yang aktif",contact_today:"Hubungi hari ini",...statusLabels};
const months = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
function dateLabel(date: string) {
 const [year,month,day] = date.split("-");
 return `${Number(day)} ${months[Number(month)-1]} ${year}`;
}
function href(base:string,result:QueuePage,page=1){
 const query=new URLSearchParams();if(result.input.q)query.set("q",result.input.q);if(result.input.status!=="all")query.set("status",result.input.status);if(page>1)query.set("page",String(page));
 return `${base}/antrean${query.size?`?${query}`:""}`;
}
function action(item:QueueItem,base:string,coordinator:boolean){
 const path=`${base}/kasus/${item.caseId}`;
 if(coordinator||item.status==="completed")return {label:"Lihat kasus",href:path};
 if(item.group==="contact_today"||item.status==="needs_sending")return {label:item.group==="contact_today"?"Siapkan pengingat":"Siapkan pesan",href:`${path}/pesan?pilih=${item.id}`};
 return {label:item.status==="needs_review"?"Periksa revisi":"Catat balasan",href:`${path}/revisi/${item.id}/status`};
}
export function QueueView({context,result}:{context:ActiveOrganization;result:QueuePage}){
 const base=organizationPath(context.organizationId),filtered=Boolean(result.input.q)||result.input.status!=="all";
 return <RecordFrame context={context} title="Antrean tindakan" section="antrean">
  <div className="queue-toolbar">
   <p className="queue-calendar">Hari ini <time dateTime={result.today}>{dateLabel(result.today)}</time></p>
   {context.role==="companion"&&<Link className="button outline" href={`${base}/kasus?pilih=revisi`}><Plus size={18} aria-hidden="true"/>Tambah revisi</Link>}
  </div>
  <search aria-label="Pencarian revisi"><form key={JSON.stringify([result.input.q,result.input.status])} method="get" action={`${base}/antrean`} aria-label="Cari dan filter revisi" className="queue-controls">
   <div className="field">
    <label htmlFor="queue-q">Cari usaha atau nomor pengajuan</label>
    <div className="queue-search-input"><Search size={19} aria-hidden="true"/><input id="queue-q" type="search" name="q" defaultValue={result.input.q} maxLength={160} autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false}/></div>
   </div>
   <div className="queue-filter-row">
    <div className="field"><label htmlFor="queue-status">Tampilkan revisi</label><select id="queue-status" name="status" defaultValue={result.input.status}>{queueFilters.map(s=><option value={s} key={s}>{labels[s]}</option>)}</select></div>
    <button type="submit" className="button outline">Terapkan</button>
   </div>
  </form></search>
  {result.input.notice&&<p className="notice" role="status">{result.input.notice}</p>}
  <div className="queue-result-row">
   <p className="queue-result" role="status">{result.total} {filtered?"hasil":"revisi aktif"}</p>
   {(filtered||result.page>1)&&<Link className="queue-reset" aria-label="Reset pencarian dan filter" href={`${base}/antrean`}>Reset filter</Link>}
  </div>
  {!result.items.length?<section className="queue-empty"><h2>{result.total?"Antrean telah berubah":filtered?"Tidak ada revisi yang cocok":"Belum ada revisi aktif"}</h2><p>{result.total?"Muat ulang halaman untuk melihat antrean terbaru.":filtered?"Coba nama usaha atau nomor pengajuan lain, atau reset filter.":"Revisi selesai tersedia lewat filter Selesai. Pilih kasus untuk melihat atau menambah revisi."}</p>{result.total>0&&<Link className="button outline" href={href(base,result,result.page)}>Muat ulang antrean</Link>}</section>:
   result.groups.map(group=>{
    const items=result.items.filter(t=>t.group===group.id);if(!items.length)return null;
    return <section key={group.id} aria-labelledby={`queue-${group.id}`}><h2 id={`queue-${group.id}`}>{labels[group.id as QueueGroup]} <span className="queue-count">({group.count})</span></h2>
     <ul className="revision-list queue-list">{items.map(item=>{const next=action(item,base,context.role==="coordinator");return <li className="queue-task" key={item.id}>
      <Link className="queue-business" href={`${base}/kasus/${item.caseId}`}>{item.businessName}<ChevronRight size={18} aria-hidden="true"/></Link>
      <span className={`status-badge ${item.status}`}>{statusLabels[item.status]}</span>
      <p className="revision-instruction">{item.instruction}</p>
      {item.followUpOn&&<p className={`queue-date${item.group==="contact_today"?" due":""}`}>Tindak lanjut <time dateTime={item.followUpOn}>{dateLabel(item.followUpOn)}</time></p>}
      {item.reference&&<p className="queue-reference">Pengajuan {item.reference}</p>}
      <Link className="button primary full" href={next.href}>{next.label}</Link>
     </li>;})}</ul>
    </section>;
   })}
  {(result.page>1||result.hasNext)&&<nav className="record-pagination" aria-label="Halaman antrean">{result.page>1&&<Link href={href(base,result,result.page-1)}>Sebelumnya</Link>}<span>Halaman {result.page}</span>{result.hasNext&&<Link href={href(base,result,result.page+1)}>Berikutnya</Link>}</nav>}
 </RecordFrame>;
}
