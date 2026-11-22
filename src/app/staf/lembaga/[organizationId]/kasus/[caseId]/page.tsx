import Link from "next/link";
import {notFound} from "next/navigation";
import {requireOrganization} from "@/features/caseload/server";
import {getCase,serviceFailure} from "@/features/caseload/queries";
import {organizationPath} from "@/features/caseload/access";
import {RecordFrame,Pagination} from "@/features/caseload/ui";
import {listTasks} from "@/features/revisions/queries";
import {statusLabels} from "@/lib/domain/revisions";

export default async function Page({params,searchParams}:{params:Promise<{organizationId:string;caseId:string}>;searchParams:Promise<{page?:string}>}) {
  const {organizationId,caseId}=await params,{client,context}=await requireOrganization(organizationId);
  const item=await getCase(client,context,caseId);if(!item)notFound();
  const {count,error}=await client.from("revision_tasks").select("id",{count:"exact",head:true}).eq("case_id",item.id);
  if(error||count===null)throw serviceFailure();
  const tasks=await listTasks(client,context,item.id,(await searchParams).page);
  const base=organizationPath(organizationId),own=context.role==="companion"&&item.assignee_id===context.userId;
  return <RecordFrame context={context} title={item.business_contacts.business_name} section="kasus">
    <dl className="record-details"><div><dt>Nomor pengajuan</dt><dd>{item.official_reference||"Belum tersedia"}</dd></div><div><dt>Penanggung jawab</dt><dd>{item.assignee_id===context.userId?"Anda":"Pendamping lain"}</dd></div><div><dt>Dibuat</dt><dd>{new Intl.DateTimeFormat("id-ID",{dateStyle:"medium",timeZone:context.timezone}).format(new Date(item.created_at))}</dd></div></dl>
    <div className="record-actions"><Link className="button outline" href={`${base}/kontak/${item.contact_id}`}>Lihat kontak</Link>{own&&<Link className="button primary" href={`${base}/kasus/${item.id}/edit`}>Ubah nomor pengajuan</Link>}</div>
    <h2>Revisi kasus</h2>
    {own&&<div className="record-actions"><Link className="button outline" href={`${base}/kasus/${item.id}/pesan`}>Draf WhatsApp</Link></div>}
    {own&&<Link className="button primary" href={`${base}/kasus/${item.id}/revisi/baru`}>Tambah revisi</Link>}
    {count===0?<p className="notice">Belum ada revisi. Kasus ini belum tuntas.</p>:<>
      <p>{count} revisi tersimpan.</p>
      {tasks.items.length===0?<p className="notice">Tidak ada revisi di halaman ini.</p>:<ul className="revision-list" aria-label="Daftar revisi">
        {tasks.items.map(task=><li key={task.id}>
          <span className={`status-badge ${task.status}`}>{statusLabels[task.status]}</span>
          <p className="revision-instruction">{task.instruction}</p>
          {task.follow_up_on&&<p>Tindak lanjut: <time dateTime={task.follow_up_on}>{task.follow_up_on}</time></p>}
          {own&&<Link className="button outline" href={`${base}/kasus/${item.id}/revisi/${task.id}/edit`}>Ubah instruksi</Link>}
          {own&&task.status!=="completed"&&<Link className="button text" href={`${base}/kasus/${item.id}/pesan?pilih=${task.id}`}>Siapkan pesan revisi ini</Link>}
        </li>)}
      </ul>}
      <Pagination page={tasks} path={`${base}/kasus/${item.id}`}/>
    </>}
  </RecordFrame>;
}
