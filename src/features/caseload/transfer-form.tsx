"use client";

import {startTransition,useActionState,useEffect,useRef,useState,type FormEvent} from "react";
import {unstable_rethrow} from "next/navigation";
import Link from "next/link";
import {companionLabel} from "./ui";
import type {TransferState} from "./transfer";

type Props = {
  initial: TransferState;
  action: (state: TransferState,body: FormData) => Promise<TransferState>;
  path: string;
  casePath: string;
  assignee: string;
  recipients: string[];
};

export function TransferForm({initial,action,path,casePath,assignee,recipients}:Props) {
  const [native,submit,nativePending] = useActionState(action,initial,path);
  const [reply,setReply] = useState<TransferState|null>(null);
  const state = reply ?? native;
  const [recipient,setRecipient] = useState(state.recipient);
  const [confirmed,setConfirmed] = useState(state.confirmed);
  const [pending,setPending] = useState(false);
  const locked = useRef(false);
  const notice = useRef<HTMLParagraphElement>(null);
  const busy = pending || nativePending;
  const current = state.latest?.assignee ?? assignee;
  const options = recipients.filter(id=>id!==current);
  const unavailable = recipient && !options.includes(recipient);
  useEffect(()=>{if(state.message)notice.current?.focus();},[state]);

  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (locked.current) return;
    const body = new FormData(event.currentTarget,(event.nativeEvent as SubmitEvent).submitter);
    locked.current = true;
    setPending(true);
    startTransition(async()=>{
      try {
        setReply(await action(state,body));
      } catch(error) {
        unstable_rethrow(error);
        setReply({...state,status:state.latest?"conflict":"error",message:"Koneksi terputus. Isian tetap tersedia. Coba lagi dengan pilihan yang sama."});
      } finally {
        locked.current = false;
        setPending(false);
      }
    });
  }

  return <form action={submit} onSubmit={send} aria-label="Alihkan penanggung jawab" aria-busy={busy} className="record-form">
    <input type="hidden" name="seed" value={state.seed}/>
    <input type="hidden" name="version" value={state.version}/>
    {state.message&&<p className="notice" role="alert" tabIndex={-1} ref={notice}>{state.message}</p>}
    {state.latest&&<p className="notice">Penanggung jawab terbaru: <strong>{companionLabel(current,recipients)}</strong></p>}
    {!options.length&&<p className="notice">Belum ada pendamping aktif lain di LP3H ini.</p>}
    {state.status!=="forbidden"&&options.length>0&&<>
      <div className="field">
        <label htmlFor="transfer-recipient">Pendamping penerima</label>
        <select id="transfer-recipient" name="recipient" value={recipient} required disabled={busy}
          onChange={event=>{setRecipient(event.target.value);setConfirmed(false);}}>
          <option value="">Pilih pendamping</option>
          {unavailable&&<option value={recipient} disabled>{companionLabel(recipient)} (tidak tersedia)</option>}
          {options.map(id=><option key={id} value={id}>{companionLabel(id,options)}</option>)}
        </select>
        {recipient&&<details className="record-disclosure account-code"><summary>Kode akun penerima</summary><p>{recipient}</p></details>}
      </div>
      <label className="checkbox-row">
        <input type="checkbox" name="confirm" checked={confirmed} required disabled={busy} onChange={event=>setConfirmed(event.target.checked)}/>
        Saya mengonfirmasi pendamping sebelumnya akan kehilangan akses ke kasus ini.
      </label>
      <button type="submit" className="button primary full" disabled={busy||Boolean(unavailable)}
        name={state.latest?"reviewVersion":undefined} value={state.latest?.version}>
        {busy?"Mengalihkan…":state.latest?"Terapkan setelah tinjau":"Konfirmasi pengalihan"}
      </button>
    </>}
    <Link className="text-link" href={casePath}>Kembali ke kasus</Link>
  </form>;
}
