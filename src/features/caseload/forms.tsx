"use client";

import {startTransition,useActionState,useEffect,useRef,useState,type FormEvent} from "react";
import Link from "next/link";
import {normalizeWhatsAppNumber} from "../../lib/domain/whatsapp";
import type {RecordFormState} from "./mutations";

type Props={kind:"contact"|"case";mode:"create"|"update";initial:RecordFormState;
  action:(state:RecordFormState,form:FormData)=>Promise<RecordFormState>;
  basePath:string;permalink:string;cancelHref:string;contactName?:string;continueCase?:boolean};
const labels:Record<string,string>={businessName:"Nama usaha",phone:"Nomor WhatsApp",greeting:"Nama sapaan",reference:"Nomor pengajuan"};

export function RecordForm({kind,mode,initial,action,basePath,permalink,cancelHref,contactName,continueCase}:Props) {
  const [nativeState,submit,nativePending]=useActionState(action,initial,permalink);
  const [clientState,setClientState]=useState<RecordFormState|null>(null);
  const [clientPending,setClientPending]=useState(false);
  const state=clientState??nativeState,pending=nativePending||clientPending;
  const [values,setValues]=useState(state.values);
  const [confirmed,setConfirmed]=useState(state.values.confirmDuplicate==="on");
  const [edited,setEdited]=useState<{state:RecordFormState;fields:string[]}>({state,fields:[]});
  const summary=useRef<HTMLDivElement>(null);
  const form=useRef<HTMLFormElement>(null);
  const submitting=useRef(false);
  const errors=Object.entries(state.errors??{}).filter(([key])=>edited.state!==state||!edited.fields.includes(key));
  useEffect(()=>{
    if(state.status==="invalid"){
      const keys=Object.keys(state.errors??{});
      if(keys.length===1&&keys[0]!=="form")form.current?.querySelector<HTMLElement>(`[name="${keys[0]}"]`)?.focus();
      else summary.current?.focus();
    }
  },[state]);
  function change(key:string,value:string){
    setValues({...values,[key]:value});
    setEdited({state,fields:[...(edited.state===state?edited.fields:[]),key]});
    if(key==="phone")setConfirmed(false);
  }
  function hydratedSubmit(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(submitting.current)return;
    const body=new FormData(event.currentTarget,(event.nativeEvent as SubmitEvent).submitter);
    const submitted={...values};
    for(const key of ["businessName","phone","greeting","reference","contactId","expectedVersion","confirmedPhone","confirmDuplicate"]){
      const value=body.get(key);submitted[key]=typeof value==="string"?value:"";
    }
    const reviewed=body.get("reviewVersion");
    if(typeof reviewed==="string")submitted.expectedVersion=reviewed;
    setValues(submitted);
    submitting.current=true;setClientPending(true);
    startTransition(async()=>{
      try{const result=await action(state,body);if(result)setClientState(result);}
      catch{setClientState({...state,status:"error",errors:undefined,values:submitted,message:"Koneksi terputus. Isian tetap tersedia. Coba lagi dengan isian yang sama."});}
      finally{submitting.current=false;setClientPending(false);}
    });
  }
  function field(key:string,required=false){
    const error=errors.find(([name])=>name===key)?.[1];
    return <div className="field" key={key}>
      <label htmlFor={key}>{labels[key]}{!required&&<span>Opsional</span>}</label>
      {key==="phone"&&<p className="field-hint" id="phone-hint">Nomor Indonesia disimpan dengan awalan 62.</p>}
      <input id={key} name={key} type={key==="phone"?"tel":"text"} inputMode={key==="phone"?"tel":undefined}
        autoComplete={key==="phone"?"tel":key==="businessName"?"organization":key==="greeting"?"nickname":"off"}
        value={values[key]??""} onChange={event=>change(key,event.target.value)} required={required} maxLength={160}
        readOnly={pending} aria-invalid={Boolean(error)} aria-describedby={error?`${key}-error`:key==="phone"?"phone-hint":undefined}/>
      {error&&<p className="field-error" id={`${key}-error`}>{error}</p>}
    </div>;
  }
  const duplicate=Boolean(state.values.confirmedPhone)&&normalizeWhatsAppNumber(values.phone??"")===state.values.confirmedPhone;
  const conflict=state.status==="conflict"&&state.latest;
  const label=mode==="update"?"Simpan perubahan":kind==="contact"?"Simpan kontak":"Buat kasus";
  return <form ref={form} action={submit} onSubmit={hydratedSubmit} noValidate aria-label={kind==="contact"?"Simpan kontak usaha":"Simpan kasus usaha"} aria-busy={pending} className="record-form">
    <p className="sr-only" role="status" aria-live="polite">{state.status==="duplicate"?"Nomor sudah tersimpan. Gunakan kontak tersedia atau konfirmasikan usaha berbeda.":state.status==="conflict"?"Data sudah berubah. Tinjau data terbaru sebelum melanjutkan.":""}</p>
    <input type="hidden" name="resourceId" value={state.resourceId}/>
    <input type="hidden" name="intentSeed" value={state.intentSeed}/>
    <input type="hidden" name="expectedVersion" value={values.expectedVersion??""}/>
    <input type="hidden" name="contactId" value={values.contactId??""}/>
    <input type="hidden" name="continueCase" value={continueCase?"1":""}/>
    {errors.length>0&&<div className="form-errors" role="alert" tabIndex={-1} ref={summary}>
      <div><strong>Periksa isian berikut</strong>{errors.map(([key,message])=><a key={key} href={key==="form"?"#record-submit":`#${key}`}>{message}</a>)}</div>
    </div>}
    {kind==="contact"?<>{field("businessName",true)}{field("phone",true)}{field("greeting")}</>:<>
      <p className="selected-contact">Kontak usaha: <strong>{contactName}</strong></p>
      {field("reference")}
    </>}
    {duplicate&&<section className="duplicate-panel" aria-label="Nomor sudah tersimpan">
      <h2>Nomor ini sudah tersimpan</h2>
      <p>Gunakan kontak yang tersedia atau konfirmasikan usaha berbeda.</p>
      {state.duplicates?.map(item=><p key={item.id}><Link href={`${basePath}/kontak/${item.id}`}>{item.name}</Link></p>)}
      <input type="hidden" name="confirmedPhone" value={state.values.confirmedPhone}/>
      <label className="checkbox-row"><input type="checkbox" name="confirmDuplicate" checked={confirmed} onChange={event=>setConfirmed(event.target.checked)} disabled={pending}/><span>Ini usaha berbeda yang memakai nomor yang sama.</span></label>
    </section>}
    {conflict&&<section className="notice record-conflict" aria-label="Data terbaru">
      <h2>Data terbaru</h2>
      <dl>{Object.entries(state.latest!.values).filter(([key])=>key!=="contactId").map(([key,value])=><div key={key}><dt>{labels[key]??key}</dt><dd>{value||"Belum diisi"}</dd></div>)}</dl>
      <p>{state.message}</p>
      {state.savedId&&<Link href={`${basePath}/${kind==="contact"?"kontak":"kasus"}/${state.savedId}`}>Buka data yang sudah tersimpan</Link>}
    </section>}
    {state.message&&["error","forbidden"].includes(state.status)&&<p className="notice error" role="alert">{state.message}</p>}
    <div className="form-actions">
      {conflict?mode==="update"&&<button id="record-submit" className="button primary full" name="reviewVersion" value={state.latest!.version} type="submit" disabled={pending}>Terapkan isian saya</button>
        :<button id="record-submit" className="button primary full" type="submit" disabled={pending||state.status==="forbidden"}>{pending?"Menyimpan…":label}</button>}
      <Link className="button text full" href={cancelHref}>Batal</Link>
    </div>
  </form>;
}
