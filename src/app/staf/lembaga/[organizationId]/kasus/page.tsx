import Link from "next/link";
import {requireOrganization} from "@/features/caseload/server";
import {listCases,listCompanionAccounts} from "@/features/caseload/queries";
import {organizationPath} from "@/features/caseload/access";
import {RecordFrame,CaseList,Pagination,companionLabel} from "@/features/caseload/ui";

export default async function Page({params,searchParams}:{params:Promise<{organizationId:string}>;searchParams:Promise<{page?:string;pilih?:string;pendamping?:string}>}) {
  const {organizationId}=await params,{client,context}=await requireOrganization(organizationId);
  const query=await searchParams,newRevision=context.role==="companion"&&query.pilih==="revisi";
  const coordinator=context.role==="coordinator";
  const accounts=await listCompanionAccounts(client,context);
  const accountIds=accounts.map(account=>account.user_id);
  const assignee=accounts.find(account=>account.user_id===query.pendamping)?.user_id;
  const cases=await listCases(client,context,query.page,undefined,assignee),base=organizationPath(organizationId);
  return <RecordFrame context={context} title={newRevision?"Pilih kasus untuk revisi":"Kasus usaha"} section="kasus">
    {newRevision&&<p className="notice">Pilih kasus usaha untuk menambahkan instruksi revisi.</p>}
    {context.role==="companion"&&<Link className={`button ${newRevision&&cases.items.length?"outline":"primary"}`} href={`${base}/kasus/baru`}>Buat kasus</Link>}
    {coordinator&&<form key={assignee??"all"} method="get" action={`${base}/kasus`} aria-label="Filter kasus koordinator" className="record-form">
      <div className="field">
        <label htmlFor="case-assignee">Penanggung jawab</label>
        <select id="case-assignee" name="pendamping" defaultValue={assignee??""}>
          <option value="">Semua pendamping</option>
          {accounts.map(account=><option key={account.user_id} value={account.user_id}>{companionLabel(account.user_id,accountIds)}{!account.is_active&&" (nonaktif)"}</option>)}
        </select>
        {assignee&&<details className="record-disclosure account-code"><summary>Kode akun lengkap</summary><p>{assignee}</p></details>}
      </div>
      <button className="button outline" type="submit">Terapkan filter</button>
      {assignee&&<Link className="button text" href={`${base}/kasus`}>Reset filter</Link>}
    </form>}
    {cases.items.length?<CaseList items={cases.items} basePath={base} userId={context.userId} newRevision={newRevision} showAccount={coordinator}/>:<p className="notice">{assignee?"Belum ada kasus untuk pendamping ini.":"Belum ada kasus yang dapat ditampilkan."}</p>}
    <Pagination page={cases} path={`${base}/kasus${newRevision?"?pilih=revisi":assignee?`?pendamping=${assignee}`:""}`}/>
  </RecordFrame>;
}
