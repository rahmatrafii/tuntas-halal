"use client";
import {startTransition,useActionState,useEffect,useRef,useState,useSyncExternalStore,type FormEvent} from "react";
import Link from "next/link";
import {revisionStatuses,statusLabels,type RevisionStatus} from "../../lib/domain/revisions";
import type {RevisionTask} from "../revisions/queries";
import type {StatusMode,StatusState} from "./types";
type Props={mode:StatusMode;initial:StatusState;tasks:RevisionTask[];businessName:string;permalink:string;cancelHref:string;action:(state:StatusState,body:FormData)=>Promise<StatusState>};
const subscribeHydration=()=>()=>{};
export function StatusForm({mode,initial,tasks,businessName,permalink,cancelHref,action}:Props){
 const hydrated=useSyncExternalStore(subscribeHydration,()=>true,()=>false);
 const [native,submit,nativePending]=useActionState(action,initial,permalink),[reply,setReply]=useState<StatusState|null>(null),[clientPending,setPending]=useState(false);
 const state=reply??native,pending=clientPending||nativePending;
 const [edited,setEdited]=useState<{state:StatusState;fields:string[]}>({state,fields:[]});
 const errors=Object.fromEntries(Object.entries(state.errors??{}).filter(([key])=>edited.state!==state||!edited.fields.includes(key)));
 const [values,setValues]=useState(state.values),[selected,setSelected]=useState(state.selected),[versions,setVersions]=useState(state.versions),[page,setPage]=useState(1);
 const summary=useRef<HTMLDivElement>(null),locked=useRef(false);const conflict=state.status==="conflict"&&state.latest;
 useEffect(()=>{if(["invalid","error","conflict","forbidden"].includes(state.status))summary.current?.focus();},[state]);
 function change(key:string,value:string){setValues(old=>({...old,[key]:value,...(key==="status"?{sent:"",completion:""}:{})}));setEdited(old=>({state,fields:[...(old.state===state?old.fields:[]),key]}));}
 function inlineError(key:string){return errors[key]?<p id={`${key}-error`} className="field-error">{errors[key]}</p>:null;}
 function send(event:FormEvent<HTMLFormElement>){
 event.preventDefault();if(locked.current)return;
 const body=new FormData(event.currentTarget,(event.nativeEvent as SubmitEvent).submitter);
 if(body.has("reviewVersions")&&state.latest){const fresh=Object.fromEntries(state.latest.map(t=>[t.id,t.version]));const merged={...versions,...fresh};body.set("versions",JSON.stringify(merged));setVersions(merged);}
 locked.current=true;setPending(true);
 startTransition(async()=>{try{setReply(await action(state,body));}catch{setReply({...state,status:"error",message:"Koneksi terputus. Isian tetap tersedia; coba lagi.",latest:undefined});}finally{locked.current=false;setPending(false);}});
 }
 const visible=hydrated?tasks.slice((page-1)*20,page*20):tasks,single=tasks[0];
 const previous=single?({awaiting_reply:"needs_sending",needs_review:"awaiting_reply",completed:"needs_review"} as Partial<Record<RevisionStatus,RevisionStatus>>)[single.status]:undefined;
 return <form action={submit} onSubmit={send} noValidate aria-label={mode==="single"?"Simpan status revisi":"Catat pengiriman revisi"} aria-busy={pending} className="record-form">
 <p className="selected-contact">Usaha<strong>{businessName}</strong></p>
 <input type="hidden" name="seed" value={state.seed}/><input type="hidden" name="versions" value={JSON.stringify(Object.fromEntries([...new Set([...selected,...visible.map(t=>t.id)])].map(id=>[id,versions[id]])))}/>
 {selected.filter(id=>mode==="single"||!visible.some(t=>t.id===id)).map(id=><input type="hidden" name="taskId" value={id} key={id}/>)}
 <div ref={summary} tabIndex={-1} role={["invalid","error","forbidden"].includes(state.status)?"alert":undefined} className={state.message?"notice":""}>
 {state.message&&<p>{state.message}</p>}{Object.entries(errors).map(([key,text])=><a className="status-error-link" href={`#${key==="form"?"status-submit":key}`} key={key}>{text}</a>)}
 </div>
 {mode==="single"?<><p className="revision-instruction">{single?.instruction}</p><p className="notice">Status saat ini: {single&&statusLabels[single.status]}. Tanggal dapat diubah tanpa mengganti instruksi.</p>
 <div className="field"><label htmlFor="status">Status revisi</label><select id="status" name="status" value={values.status} disabled={pending} aria-invalid={Boolean(errors.status)} aria-describedby={errors.status?"status-error":undefined} onChange={e=>change("status",e.target.value)}>{revisionStatuses.map(s=><option key={s} value={s}>{statusLabels[s]}</option>)}</select>{inlineError("status")}</div>
 {previous&&<button className="button outline" type="button" disabled={pending} onClick={()=>change("status",previous)}>Koreksi ke {statusLabels[previous]}</button>}
 </>:<><input type="hidden" name="status" value="awaiting_reply"/><h2>Revisi yang sudah dikirim</h2><p className="field-hint">Pilih tugas yang benar-benar dikirim. Tugas lain tidak berubah. Maksimal 100 revisi per penyimpanan.</p><p>{selected.length} revisi dipilih</p>
 {visible.map(t=><label className="draft-task-option" key={t.id}><input type="checkbox" name="taskId" value={t.id} disabled={pending} checked={selected.includes(t.id)} onChange={e=>setSelected(old=>e.target.checked?[...old,t.id]:old.filter(id=>id!==t.id))}/><span><span className="revision-instruction">{t.instruction}</span><span className="status-badge needs_sending">Perlu dikirim</span><small className="status-task-date">Tanggal saat ini: {t.follow_up_on??"Tanpa tanggal"}</small></span></label>)}
 {!tasks.length&&<p className="notice">Tidak ada revisi Perlu dikirim untuk dicatat.</p>}
 {hydrated&&tasks.length>20&&<nav className="record-pagination" aria-label="Pilihan revisi"><button className="button outline" type="button" disabled={pending||page===1} onClick={()=>setPage(page-1)}>Sebelumnya</button><span>Halaman {page}</span><button className="button outline" type="button" disabled={pending||page*20>=tasks.length} onClick={()=>setPage(page+1)}>Berikutnya</button></nav>}
 <div className="field"><label htmlFor="datePolicy">Tanggal untuk revisi pilihan</label><select id="datePolicy" name="datePolicy" value={values.datePolicy} disabled={pending} aria-invalid={Boolean(errors.datePolicy)} aria-describedby="date-policy-help datePolicy-error" onChange={e=>change("datePolicy",e.target.value)}><option value="">Pilih aturan tanggal</option><option value="none">Tanpa tanggal tindak lanjut</option><option value="same">Tanggal yang sama</option></select><p id="date-policy-help" className="field-hint">Tanpa tanggal akan menghapus tanggal lama pada semua revisi pilihan. Tanggal berbeda dapat diatur per revisi setelah ini.</p>{inlineError("datePolicy")}</div></>}
 <div className="field"><label htmlFor="followUpOn">Tanggal tindak lanjut{mode==="single"&&<span>Opsional</span>}</label><input id="followUpOn" name="followUpOn" type="date" value={values.followUpOn} readOnly={pending} onChange={e=>change("followUpOn",e.target.value)} aria-invalid={Boolean(errors.followUpOn)} aria-describedby={`date-help${errors.followUpOn?" followUpOn-error":""}`}/><p id="date-help" className="field-hint">{mode==="single"?"Kosong berarti tanpa tanggal. Tanggal tidak otomatis dihapus saat status berubah.":"Wajib diisi jika memilih Tanggal yang sama. Diabaikan jika memilih Tanpa tanggal."}</p>{inlineError("followUpOn")}</div>
 {mode==="single"&&<input type="hidden" name="datePolicy" value="same"/>}
 <label className="checkbox-row"><input id="sent" name="sent" type="checkbox" disabled={pending} checked={values.sent==="on"} aria-invalid={Boolean(errors.sent)} aria-describedby={errors.sent?"sent-error":undefined} onChange={e=>change("sent",e.target.checked?"on":"")}/><span>Permintaan revisi pilihan sudah saya kirim.{mode==="single"&&<small className="status-task-date">Wajib untuk status Menunggu balasan.</small>}</span></label>{inlineError("sent")}
 {mode==="single"&&<><label className="checkbox-row completion-confirm"><input id="completion" name="completion" type="checkbox" disabled={pending} checked={values.completion==="on"} aria-invalid={Boolean(errors.completion)} aria-describedby={errors.completion?"completion-error":undefined} onChange={e=>change("completion",e.target.checked?"on":"")}/><span>Saya sudah memeriksa koreksi dan melakukan pembaruan resmi yang diperlukan.<small className="status-task-date">Wajib saat menandai revisi Selesai.</small></span></label>{inlineError("completion")}</>}
 {conflict&&<section className="notice record-conflict" aria-label="Data terbaru"><h2>Tinjau data terbaru</h2>{state.latest!.map(t=><div key={t.id}><p className="revision-instruction">{t.instruction}</p><p>{statusLabels[t.status]} · {t.follow_up_on??"Tanpa tanggal"}</p></div>)}<p>Periksa perbedaan sebelum menerapkan isian Anda. Pilihan dan tanggal Anda belum ditimpa.</p></section>}
 <div className="form-actions">{state.status!=="forbidden"&&<button id="status-submit" className="button primary full" type="submit" name={conflict?"reviewVersions":undefined} value={conflict?JSON.stringify(Object.fromEntries(state.latest!.map(t=>[t.id,t.version]))):undefined} disabled={pending}>{pending?"Menyimpan…":conflict?"Terapkan isian saya":mode==="single"?"Simpan status":"Catat sudah dikirim"}</button>}<Link className="button text full" href={cancelHref}>Batal</Link></div>
 </form>;
}
