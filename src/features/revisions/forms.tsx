"use client";

import {startTransition,useActionState,useEffect,useRef,useState,type FormEvent} from "react";
import Link from "next/link";
import {statusLabels,type RevisionStatus} from "../../lib/domain/revisions";
import type {RecordFormState} from "../caseload/mutations";

type Props={mode:"create"|"update";initial:RecordFormState;businessName:string;permalink:string;cancelHref:string;status?:RevisionStatus;
  action:(state:RecordFormState,form:FormData)=>Promise<RecordFormState>};
export function TaskForm({mode,initial,businessName,permalink,cancelHref,status,action}:Props){
  const [nativeState,submit,nativePending]=useActionState(action,initial,permalink);
  const [clientState,setClientState]=useState<RecordFormState|null>(null);
  const [clientPending,setClientPending]=useState(false);
  const state=clientState??nativeState,pending=nativePending||clientPending;
  const [values,setValues]=useState(state.values);
  const [editedState,setEditedState]=useState<RecordFormState|null>(null);
  const field=useRef<HTMLTextAreaElement>(null),summary=useRef<HTMLDivElement>(null),submitting=useRef(false);
  const errors=Object.entries(state.errors??{}).filter(([key])=>key!=="instruction"||editedState!==state);
  const instructionError=errors.find(([key])=>key==="instruction")?.[1];
  useEffect(()=>{
    if(state.status==="invalid"){
      if(Object.keys(state.errors??{}).length===1&&state.errors?.instruction)field.current?.focus();
      else summary.current?.focus();
    }
  },[state]);
  function hydratedSubmit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();if(submitting.current)return;
    const body=new FormData(event.currentTarget,(event.nativeEvent as SubmitEvent).submitter);
    const submitted={...values,instruction:String(body.get("instruction")??""),expectedVersion:String(body.get("reviewVersion")??body.get("expectedVersion")??"")};
    setValues(submitted);submitting.current=true;setClientPending(true);
    startTransition(async()=>{
      try{const result=await action(state,body);if(result)setClientState(result);}
      catch{setClientState({...state,status:"error",errors:undefined,values:submitted,message:"Koneksi terputus. Isian tetap tersedia. Coba lagi dengan isian yang sama."});}
      finally{submitting.current=false;setClientPending(false);}
    });
  }
  const conflict=state.status==="conflict"&&state.latest;
  return <form action={submit} onSubmit={hydratedSubmit} noValidate aria-label="Simpan tugas revisi" aria-busy={pending} className="record-form">
    <p className="selected-contact">Usaha: <strong>{businessName}</strong></p>
    {status&&<p className="notice">Status: {statusLabels[status]}. Mengubah instruksi tidak mengubah status atau tanggal tindak lanjut.</p>}
    <p className="sr-only" role="status" aria-live="polite">{conflict?"Data sudah berubah. Tinjau data terbaru sebelum melanjutkan.":""}</p>
    <input type="hidden" name="resourceId" value={state.resourceId}/>
    <input type="hidden" name="intentSeed" value={state.intentSeed}/>
    <input type="hidden" name="expectedVersion" value={values.expectedVersion??""}/>
    {errors.length>0&&<div className="form-errors" role="alert" tabIndex={-1} ref={summary}><strong>Periksa isian berikut</strong>
      {errors.map(([key,message])=><a key={key} href={key==="instruction"?"#instruction":"#task-submit"}>{message}</a>)}
    </div>}
    <div className="field">
      <label htmlFor="instruction">Instruksi revisi (wajib)</label>
      <p id="instruction-hint" className="field-hint">Tulis satu permintaan yang dapat dikerjakan pemilik usaha. Maksimal 2.000 karakter.</p>
      <textarea ref={field} id="instruction" name="instruction" rows={6} required maxLength={2000} value={values.instruction??""}
        onChange={event=>{setValues({...values,instruction:event.target.value});setEditedState(state);}} readOnly={pending}
        aria-invalid={Boolean(instructionError)} aria-describedby={`instruction-hint${instructionError?" instruction-error":""}`}/>
      {instructionError&&<p id="instruction-error" className="field-error">{instructionError}</p>}
    </div>
    {conflict&&<section className="notice record-conflict" aria-label="Data terbaru">
      <h2>Data terbaru</h2>
      <dl><div><dt>Instruksi</dt><dd className="revision-instruction">{state.latest!.values.instruction}</dd></div>
        <div><dt>Status</dt><dd>{statusLabels[state.latest!.values.status as RevisionStatus]}</dd></div>
        <div><dt>Tindak lanjut</dt><dd>{state.latest!.values.followUpOn||"Belum ditentukan"}</dd></div></dl>
      <p>{state.message}</p>
      {state.savedId&&<Link href={cancelHref}>Buka kasus dan tugas tersimpan</Link>}
    </section>}
    {state.message&&["error","forbidden"].includes(state.status)&&<p className="notice error" role="alert">{state.message}</p>}
    <div className="form-actions">
    {conflict&&!state.savedId?<button id="task-submit" className="button primary full" name="reviewVersion" value={state.latest!.version} type="submit" disabled={pending}>Terapkan isian saya</button>
        :<button id="task-submit" className="button primary full" type="submit" disabled={pending||state.status==="forbidden"||Boolean(state.savedId)}>{pending?"Menyimpan…":mode==="create"?"Simpan revisi":"Simpan perubahan"}</button>}
      <Link className="button text full" href={cancelHref}>Batal</Link>
    </div>
  </form>;
}
