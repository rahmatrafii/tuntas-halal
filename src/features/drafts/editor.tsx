"use client";

import Link from "next/link";
import {useActionState,useEffect,useRef,useState,type FormEvent} from "react";
import {composeWhatsAppDraft,normalizeWhatsAppNumber} from "../../lib/domain/whatsapp";
import {statusLabels} from "../../lib/domain/revisions";
import {draftKey,newDraft,readDraft,snapshotDraft,writeDraft,type LocalDraft,type DraftRead} from "./storage";
import type {DraftContext,DraftReply,DraftRequest} from "./types";

type Props={context:DraftContext;selectedId?:string;permalink:string;action:(previous:DraftReply,form:FormData)=>Promise<DraftReply>};
const changed=(d:LocalDraft,c:DraftContext)=>d.caseVersion!==c.caseVersion||d.contactVersion!==c.contactVersion||d.selected.some(id=>c.tasks.find(t=>t.id===id)?.version!==d.versions[id]);
export function DraftEditor({context:initial,selectedId,permalink,action}:Props){
  const [nativeReply,submit,nativePending]=useActionState(action,{status:"idle"} as DraftReply,permalink);
  const [context,setContext]=useState(initial),[draft,setDraft]=useState<LocalDraft|null>(null);
  const [block,setBlock]=useState<"tab"|"corrupt"|null>(null),[requestBusy,setBusy]=useState(false),[continuing,setContinuing]=useState(false),[denied,setDenied]=useState(false);
  const busy=requestBusy||nativePending||continuing;
  const [error,setError]=useState(""),[notice,setNotice]=useState(""),[saved,setSaved]=useState("Draf di perangkat ini");
  const [page,setPage]=useState(1),[deleting,setDeleting]=useState(false),[link,setLink]=useState<{url:string;long:boolean}|null>(null);
  const current=useRef<LocalDraft|null>(null),currentContext=useRef(initial),raw=useRef<string|null>(null),blocked=useRef<"tab"|"corrupt"|null>(null);
  const mounted=useRef(false),working=useRef(false),generation=useRef(0),textarea=useRef<HTMLTextAreaElement>(null);
  const key=draftKey(initial),base=`/staf/lembaga/${initial.organizationId}/kasus/${initial.caseId}`;
  function stop(kind:"tab"|"corrupt"|null){blocked.current=kind;setBlock(kind);}
  function announce(text:string){setNotice(old=>old===text?text+"\u00a0":text);}
  function remember(next:LocalDraft,persist=true){
    generation.current++;current.current=next;setDraft(next);setLink(null);
    if(!persist||blocked.current)return;
    let result:ReturnType<typeof writeDraft>;
    try{result=writeDraft(localStorage,key,next,raw.current);}catch{result={status:"error"};}
    if(result.status==="saved"){raw.current=result.raw!;current.current=result.draft!;setDraft(result.draft!);setSaved("Draf tersimpan di perangkat ini");}
    else if(result.status==="conflict")stop("tab");
    else{setSaved("Draf belum tersimpan");setError("Penyimpanan browser gagal. Isian masih tersedia di halaman ini, tetapi pemulihan setelah reload belum terjamin.");}
  }
  function adopt(){
    let stored:DraftRead;
    try{stored=readDraft(localStorage,key,initial);}catch{stored={status:"error",raw:null};}
    raw.current=stored.raw;
    if(stored.status==="corrupt"){stop("corrupt");return;}
    stop(null);const next=stored.draft??newDraft(currentContext.current,selectedId);
    remember({...next,needsReview:next.needsReview||changed(next,currentContext.current)},false);
    if(stored.status==="error")setError("Draf tersimpan belum dapat dibaca. Perubahan sementara hanya tersedia di halaman ini.");
  }
  /* eslint-disable react-hooks/set-state-in-effect -- Reconcile external browser storage and native Action responses after hydration, never write defaults during render. */
  useEffect(()=>{
    mounted.current=true;adopt();
    const invalidate=()=>{generation.current++;};
    const storage=(event:StorageEvent)=>{if(event.key===key||event.key===null){stop("tab");setLink(null);generation.current++;}};
    const focus=()=>{void run("refresh");};
    window.addEventListener("storage",storage);window.addEventListener("focus",focus);window.addEventListener("pageshow",focus);
    return ()=>{mounted.current=false;invalidate();window.removeEventListener("storage",storage);window.removeEventListener("focus",focus);window.removeEventListener("pageshow",focus);};
    // The route keys this editor by the verified account/LP3H/case. Responses use refs below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[key]);
  useEffect(()=>{
    if(nativeReply.status==="idle")return;
    working.current=false;setContinuing(false);
    if(nativeReply.status==="forbidden"||(nativeReply.context&&nativeReply.context.userId!==initial.userId)){setDenied(true);setLink(null);setError("Akses draf tidak lagi tersedia.");return;}
    if(nativeReply.status==="changed"&&nativeReply.context){currentContext.current=nativeReply.context;setContext(nativeReply.context);if(current.current)remember({...current.current,needsReview:true});}
    else if(nativeReply.status==="invalid"||nativeReply.status==="error")setError(nativeReply.notice??"Draf belum dapat diperiksa.");
    // Only replies from the native continuation form enter this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[nativeReply]);
  /* eslint-enable react-hooks/set-state-in-effect */
  async function run(intent:DraftRequest["intent"]){
    const value=current.current;if(working.current||nativePending||denied||(!value&&intent!=="refresh"))return;
    if(intent!=="refresh"&&blocked.current)return;
    working.current=true;setBusy(true);setError("");if(intent!=="copy")setLink(null);
    const revision=generation.current,body=new FormData();
    body.set("draftRequest",JSON.stringify({...value,intent,userId:initial.userId}));
    try{
      const reply=await action({status:"idle"},body);
      if(!mounted.current)return;
      if(reply.status==="forbidden"||(reply.context&&reply.context.userId!==initial.userId)){
        setDenied(true);setLink(null);setError("Akses draf tidak lagi tersedia. Masuk kembali atau buka kasus yang ditugaskan kepada Anda.");return;
      }
      if(revision!==generation.current){setLink(null);setError("Draf berubah selama pemeriksaan. Tinjau isian dan coba lagi.");return;}
      if(!reply.context||!["ready","changed"].includes(reply.status)){setLink(null);setError(reply.notice??"Draf belum dapat diperiksa. Coba lagi.");return;}
      const latest=reply.context;currentContext.current=latest;setContext(latest);
      if(!value)return;
      if(reply.status==="changed"||(intent==="refresh"&&changed(value,latest))){
        remember({...value,needsReview:true});announce("Data berubah. Tinjau instruksi, pilihan dan penerima terbaru.");return;
      }
      if(intent==="refresh")return;
      if(intent==="compose"){
        remember({...snapshotDraft(value,latest),message:reply.message??"",edited:false,needsReview:false});announce("Pesan disusun ulang dari instruksi terbaru.");return;
      }
      if(intent==="copy"){
        try{await navigator.clipboard.writeText(value.message);if(mounted.current&&revision===generation.current)announce("Pesan tersalin. Status revisi tidak berubah.");}
        catch{if(mounted.current){setError("Salin otomatis tidak tersedia. Pilih teks pesan dan salin secara manual.");textarea.current?.focus();textarea.current?.select();}}
      }else if(reply.url){
        setLink({url:reply.url,long:Boolean(reply.longUrl)});
        if(reply.longUrl)announce("Pesan terlalu panjang untuk tautan. Salin pesan lengkap lalu lanjut ke chat tanpa teks.");
        else window.location.assign(reply.url);
      }
    }catch{if(mounted.current){setLink(null);setError("Koneksi pemeriksaan gagal. Isian tetap tersedia; coba lagi.");}}
    finally{working.current=false;if(mounted.current)setBusy(false);}
  }
  function toggle(ids:string[]){
    const value=current.current!;
    const tasks=context.tasks.filter(t=>ids.includes(t.id));
    remember({...value,selected:ids,needsReview:value.needsReview||value.edited,message:value.edited?value.message:tasks.length?composeWhatsAppDraft({businessName:context.businessName,greetingName:context.greetingName,tasks:tasks.map(t=>({...t,caseId:context.caseId}))}):""});
  }
  function keep(){
    const value=current.current!;
    remember({...snapshotDraft(value,context),selected:value.selected.filter(id=>context.tasks.some(t=>t.id===id)),needsReview:false});announce("Pilihan dan penerima terbaru sudah ditinjau. Pesan suntingan dipertahankan.");
  }
  function restart(keepMine=false){
    try{raw.current=localStorage.getItem(key);stop(null);remember(keepMine?current.current!:newDraft(context,selectedId));setError("");}catch{setError("Penyimpanan belum dapat diakses. Isian tetap tersedia.");}
  }
  function remove(){
    try{
      if(localStorage.getItem(key)!==raw.current){stop("tab");setDeleting(false);return;}
      localStorage.removeItem(key);raw.current=null;stop(null);remember({...newDraft(context),selected:[],message:""},false);setDeleting(false);setSaved("Draf dihapus dari perangkat ini");announce("Draf dihapus.");
    }catch{setError("Draf belum dapat dihapus. Isian tetap tersedia.");}
  }
  function refresh(event:FormEvent){event.preventDefault();void run("refresh");}
  function continueChat(event:FormEvent){
    if(working.current||blocked.current||current.current?.needsReview){event.preventDefault();return;}
    working.current=true;setContinuing(true);
  }
  const selected=draft?.selected??[],canExport=Boolean(draft&&selected.length&&draft.message.trim()&&!draft.needsReview&&!block&&!busy);
  return <>
    <p className="draft-feedback" role="status" aria-live="polite">{notice||nativeReply.notice||""}</p>
    {error&&<p className="notice error" role="alert">{error}</p>}
    {denied?<Link className="button outline" href="/staf">Kembali ke akun staf</Link>:<>
      <div className="record-details"><p><strong>{context.businessName}</strong>{context.greetingName&&` · ${context.greetingName}`}</p><p>Penerima WhatsApp: {context.phone?`+${context.phone}`:"Nomor belum tersedia"}</p></div>
      <form action={submit} onSubmit={refresh} aria-label="Periksa draf WhatsApp">
        <input type="hidden" name="draftRequest" value={JSON.stringify({intent:"refresh",userId:initial.userId})}/>
        <button className="button outline" type="submit" disabled={!draft||busy}>Muat data terbaru</button>
      </form>
      <noscript>Aktifkan JavaScript untuk menyunting, menyimpan draf di perangkat, menyalin atau membuka WhatsApp.</noscript>
      {!draft&&<p className="notice">Memulihkan draf di perangkat…</p>}
      {block==="corrupt"&&<div className="notice error" role="alert"><p>Draf tersimpan tidak dapat dibaca. Data lama belum ditimpa.</p><button type="button" className="button outline" onClick={()=>restart()}>Mulai draf baru</button></div>}
      {block==="tab"&&<section className="notice record-conflict" aria-label="Konflik draf tab"><p>Draf di tab lain berubah. Isian halaman ini belum ditimpa.</p>
        <button type="button" className="button outline" onClick={adopt}>Muat draf tab lain</button>{draft&&<button type="button" className="button outline" onClick={()=>restart(true)}>Pertahankan draf tab ini</button>}
      </section>}
      {draft&&<>
        <section className="draft-selection"><h2>Pilih revisi</h2><p className="field-hint">{selected.length} revisi dipilih</p>
          {!context.tasks.length?<p className="notice">Tidak ada revisi aktif. <Link href={`${base}/revisi/baru`}>Tambah revisi</Link></p>:<>
            <button type="button" className="button text" disabled={busy} onClick={()=>toggle(selected.length===context.tasks.length?[]:context.tasks.map(t=>t.id))}>{selected.length===context.tasks.length?"Hapus semua pilihan":"Pilih semua revisi aktif"}</button>
            {context.tasks.slice((page-1)*20,page*20).map(task=><label className="draft-task-option" key={task.id}>
              <input type="checkbox" checked={selected.includes(task.id)} disabled={busy} onChange={()=>toggle(selected.includes(task.id)?selected.filter(id=>id!==task.id):[...selected,task.id])}/>
              <span><span className="revision-instruction">{task.instruction}</span><span className={`status-badge ${task.status}`}>{statusLabels[task.status]}</span></span>
            </label>)}
            {context.tasks.length>20&&<nav className="record-pagination" aria-label="Halaman pilihan revisi"><button type="button" className="button outline" disabled={page===1} onClick={()=>setPage(page-1)}>Sebelumnya</button><span>Halaman {page}</span><button type="button" className="button outline" disabled={page*20>=context.tasks.length} onClick={()=>setPage(page+1)}>Berikutnya</button></nav>}
          </>}
        </section>
        {draft.needsReview&&<section className="notice record-conflict" aria-label="Tinjau draf"><h2>Tinjau draf</h2><p>Pilihan atau data berubah. Pesan Anda tetap tersedia. Periksa revisi dan penerima sebelum melanjutkan.</p>
          <button type="button" className="button outline" disabled={busy||!selected.length||Boolean(block)} onClick={()=>void run("compose")}>Susun ulang pesan</button>
          <button type="button" className="button outline" disabled={busy||Boolean(block)} onClick={keep}>Gunakan pesan suntingan</button>
        </section>}
        <div className="field"><label htmlFor="draft-message">Isi draf pesan WhatsApp</label><textarea ref={textarea} id="draft-message" rows={10} maxLength={64000} readOnly={continuing||nativePending} value={draft.message} aria-describedby="draft-help" onChange={event=>{setError("");remember({...current.current!,message:event.target.value,edited:true});}}/>
          <p className="field-hint" id="draft-help">Suntingan hanya berlaku pada pesan ini. Instruksi revisi tetap sama. Maksimal 64.000 karakter.</p><p className="draft-save-status">{saved}</p>
        </div>
        {!normalizeWhatsAppNumber(context.phone)&&<p className="notice error">Nomor WhatsApp belum valid. Salin pesan tetap tersedia. {context.contactOwnerId===context.userId?<Link href={`/staf/lembaga/${context.organizationId}/kontak/${context.contactId}/edit`}>Koreksi kontak</Link>:"Minta pemilik kontak memperbaiki nomor melalui koordinator."}</p>}
        <div className="form-actions">
          <button type="button" className="button primary full" disabled={!canExport||!normalizeWhatsAppNumber(context.phone)} onClick={()=>void run("open")}>Buka WhatsApp</button>
          <button type="button" className="button outline full" disabled={!canExport} onClick={()=>void run("copy")}>Salin pesan</button>
          {!draft.needsReview&&<button type="button" className="button text full" disabled={busy||!selected.length||Boolean(block)} onClick={()=>void run("compose")}>Susun ulang pesan</button>}
        </div>
        {link&&<form action={submit} onSubmit={continueChat} aria-busy={continuing||nativePending} className="notice record-conflict" aria-label="Lanjut ke WhatsApp">
          <p>{link.long?"Salin pesan lengkap, buka chat, lalu tempel pesan di WhatsApp.":"WhatsApp belum terbuka? Tekan tombol berikut."}</p>
          <input type="hidden" name="draftRequest" value={JSON.stringify({...draft,intent:"open",userId:initial.userId})}/>
          <input type="hidden" name="continueChat" value="1"/>
          <button type="submit" className="button outline" disabled={busy}>Lanjut ke WhatsApp</button>
        </form>}
        <p className="notice">Periksa penerima dan pesan sebelum mengirim di WhatsApp. Membuka chat atau menyalin pesan tidak mengubah status revisi.</p>
        <section className="send-confirmation"><h2>Catat pengiriman</h2><p>Sudah mengirim pesan? Pilih revisi yang benar-benar dikirim untuk dicatat sebagai Menunggu balasan.</p><Link className="button outline full" href={`${base}/pengiriman?${new URLSearchParams(selected.slice(0,100).map(id=>["pilih",id])).toString()}`}>Catat revisi yang dikirim</Link></section>
        <button type="button" className="button text" disabled={busy||Boolean(block)} onClick={()=>setDeleting(true)}>Hapus draf</button>
        {deleting&&<section className="notice" aria-label="Konfirmasi hapus draf"><p>Hapus draf kasus ini dari perangkat?</p><button type="button" className="button outline" onClick={remove}>Ya, hapus draf</button><button type="button" className="button text" onClick={()=>setDeleting(false)}>Batal hapus</button></section>}
      </>}
      <Link className="button text full" href={base}>Kembali ke kasus</Link>
    </>}
  </>;
}
