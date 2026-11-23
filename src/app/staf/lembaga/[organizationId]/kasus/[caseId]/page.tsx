import Link from "next/link";
import {ArrowRight, MessageCircle, Plus} from "lucide-react";
import {notFound} from "next/navigation";
import {requireOrganization} from "@/features/caseload/server";
import {getCase,serviceFailure} from "@/features/caseload/queries";
import {organizationPath} from "@/features/caseload/access";
import {RecordFrame,Pagination,companionLabel} from "@/features/caseload/ui";
import {listTasks} from "@/features/revisions/queries";
import {statusLabels} from "@/lib/domain/revisions";
import {allTasks,caseProgress,listHistory} from "@/features/status/queries";
import {History} from "@/features/status/history";

export default async function Page({params,searchParams}:{params:Promise<{organizationId:string;caseId:string}>;searchParams:Promise<{page?:string;history?:string;hasil?:string}>}) {
  const {organizationId,caseId}=await params,{client,context}=await requireOrganization(organizationId);
  const item=await getCase(client,context,caseId);if(!item)notFound();
  const {count,error}=await client.from("revision_tasks").select("id",{count:"exact",head:true}).eq("case_id",item.id);
  if(error||count===null)throw serviceFailure();
  const tasks=await listTasks(client,context,item.id,(await searchParams).page);
  const query=await searchParams,progress=caseProgress(await allTasks(client,context,item.id)),history=await listHistory(client,context,item.id,query.history);
  const base=organizationPath(organizationId),own=context.role==="companion"&&item.assignee_id===context.userId;
  const coordinator=context.role==="coordinator";
  return <RecordFrame context={context} title={item.business_contacts.business_name} section="kasus">
    {query.hasil==="dialihkan"&&coordinator&&<p className="notice" role="status">Pengalihan kasus tercatat.</p>}
    {query.hasil==="status"&&<p className="notice" role="status">Status revisi tersimpan.</p>}{query.hasil==="tetap"&&<p className="notice" role="status">Tidak ada perubahan status atau tanggal.</p>}
    <section className="record-progress" aria-label="Progres kasus">
      <p><strong>{progress.completed}/{progress.total}</strong> revisi selesai</p>
      <span className={`status-badge ${progress.complete?"completed":"neutral"}`}>{progress.complete?"Kasus tuntas.":"Kasus belum tuntas."}</span>
      {progress.total>0&&<progress aria-label="Revisi selesai" value={progress.completed} max={progress.total}/>}
    </section>
    {own&&<div className="record-actions">
      {progress.total>progress.completed&&<Link className="button primary" href={`${base}/kasus/${item.id}/pesan`}><MessageCircle size={18} aria-hidden="true"/>Draf WhatsApp</Link>}
      <Link className={`button ${progress.total>progress.completed?"outline":"primary"}`} href={`${base}/kasus/${item.id}/revisi/baru`}><Plus size={18} aria-hidden="true"/>Tambah revisi</Link>
    </div>}
    {coordinator&&<Link className="button primary full" href={`${base}/kasus/${item.id}/alih`}>Alihkan kasus<ArrowRight size={18} aria-hidden="true"/></Link>}
    <details className="record-disclosure">
      <summary>Informasi kasus <span className="summary-meta">{item.official_reference||"Tanpa nomor pengajuan"}</span></summary>
      <dl className="record-details"><div><dt>Penanggung jawab</dt><dd>{coordinator?companionLabel(item.assignee_id):item.assignee_id===context.userId?"Anda":"Pendamping lain"}</dd>{coordinator&&<dd className="field-hint">{item.assignee_id}</dd>}</div><div><dt>Dibuat</dt><dd>{new Intl.DateTimeFormat("id-ID",{dateStyle:"medium",timeZone:context.timezone}).format(new Date(item.created_at))}</dd></div></dl>
      <div className="record-actions"><Link className="button outline" href={`${base}/kontak/${item.contact_id}`}>Lihat kontak</Link>{own&&<Link className="button outline" href={`${base}/kasus/${item.id}/edit`}>Ubah nomor pengajuan</Link>}</div>
      {own&&progress.total===progress.completed&&<Link className="text-link" href={`${base}/kasus/${item.id}/pesan`}>Kelola draf WhatsApp</Link>}
    </details>
    <h2>Revisi kasus</h2>
    {count===0?<p className="notice">Belum ada revisi. Kasus ini belum tuntas.</p>:<>
      {tasks.items.length===0?<p className="notice">Tidak ada revisi di halaman ini.</p>:<ul className="revision-list" aria-label="Daftar revisi">
        {tasks.items.map(task=><li key={task.id}>
          <span className={`status-badge ${task.status}`}>{statusLabels[task.status]}</span>
          <p className="revision-instruction">{task.instruction}</p>
          {task.follow_up_on&&<p>Tindak lanjut: <time dateTime={task.follow_up_on}>{task.follow_up_on}</time></p>}
          {own&&<div className="revision-actions">
            {task.status==="needs_sending"?<Link className="button primary full" href={`${base}/kasus/${item.id}/pesan?pilih=${task.id}`}>Siapkan pesan revisi ini</Link>:<Link className="button primary full" href={`${base}/kasus/${item.id}/revisi/${task.id}/status`}>Perbarui status</Link>}
            <Link className="text-link" href={`${base}/kasus/${item.id}/revisi/${task.id}/edit`}>Ubah instruksi</Link>
            {task.status==="needs_sending"?<Link className="text-link" href={`${base}/kasus/${item.id}/revisi/${task.id}/status`}>Perbarui status</Link>:task.status!=="completed"&&<Link className="text-link" href={`${base}/kasus/${item.id}/pesan?pilih=${task.id}`}>Siapkan pesan revisi ini</Link>}
          </div>}
        </li>)}
      </ul>}
      <Pagination page={tasks} path={`${base}/kasus/${item.id}`}/>
    </>}
    <h2>Riwayat perubahan</h2>{history.items.length?<History items={history.items} userId={context.userId} timezone={context.timezone} showAssignees={coordinator}/>:<p className="notice">Belum ada riwayat perubahan.</p>}
    {(history.page>1||history.hasNext)&&<nav className="record-pagination" aria-label="Halaman riwayat">{history.page>1&&<Link href={`${base}/kasus/${item.id}?page=${tasks.page}&history=${history.page-1}`}>Riwayat sebelumnya</Link>}<span>Halaman {history.page}</span>{history.hasNext&&<Link href={`${base}/kasus/${item.id}?page=${tasks.page}&history=${history.page+1}`}>Riwayat berikutnya</Link>}</nav>}
  </RecordFrame>;
}
