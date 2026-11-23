import {statusLabels,type RevisionStatus} from "../../lib/domain/revisions";
import type {AuditEvent} from "./queries";
import {companionLabel} from "../caseload/ui";
function snapshot(value:AuditEvent["after"]|null){return value&&typeof value==="object"&&!Array.isArray(value)?value:{};}
function label(value:unknown){return typeof value==="string"&&value in statusLabels?statusLabels[value as RevisionStatus]:"Status tidak tersedia";}
export function History({items,userId,timezone,showAssignees=false}:{items:AuditEvent[];userId:string;timezone:string;showAssignees?:boolean}){
 return <ol className="status-history">{items.map(event=>{const before=snapshot(event.before),after=snapshot(event.after);
 const title=({case_created:"Kasus dibuat",case_updated:"Kasus diperbarui",case_transferred:"Pendamping dialihkan",task_created:"Revisi dibuat",task_updated:"Revisi diperbarui",status_changed:"Status revisi diubah"} as Record<string,string>)[event.event_type]??"Perubahan dicatat";
 return <li key={event.id}><strong>{title}</strong>{event.event_type==="status_changed"&&<p>{label(before.status)} → {label(after.status)}</p>}
 {showAssignees&&event.event_type==="case_transferred"&&typeof before.assignee_id==="string"&&typeof after.assignee_id==="string"&&<><p>Dari {companionLabel(before.assignee_id)}</p><p>Ke {companionLabel(after.assignee_id)}</p></>}
 {(before.follow_up_on!==after.follow_up_on)&&("follow_up_on" in after)&&<p>Tindak lanjut: {typeof after.follow_up_on==="string"?after.follow_up_on:"Tanpa tanggal"}</p>}
 <p className="field-hint"><time dateTime={event.created_at}>{new Intl.DateTimeFormat("id-ID",{dateStyle:"medium",timeStyle:"short",timeZone:timezone}).format(new Date(event.created_at))}</time> · {event.actor_id===null?"Sistem":event.actor_id===userId?"Anda":event.event_type==="case_transferred"?"Koordinator LP3H":"Pendamping lain"}</p></li>;})}</ol>;
}
