import Link from "next/link";
import {requireOrganization} from "@/features/caseload/server";
import {listCases} from "@/features/caseload/queries";
import {organizationPath} from "@/features/caseload/access";
import {RecordFrame,CaseList,Pagination} from "@/features/caseload/ui";

export default async function Page({params,searchParams}:{params:Promise<{organizationId:string}>;searchParams:Promise<{page?:string}>}) {
  const {organizationId}=await params,{client,context}=await requireOrganization(organizationId);
  const cases=await listCases(client,context,(await searchParams).page),base=organizationPath(organizationId);
  return <RecordFrame context={context} title="Kasus usaha" section="kasus">
    {context.role==="companion"&&<Link className="button primary" href={`${base}/kasus/baru`}>Buat kasus</Link>}
    {cases.items.length?<CaseList items={cases.items} basePath={base} userId={context.userId}/>:<p className="notice">Belum ada kasus yang dapat ditampilkan.</p>}
    <Pagination page={cases} path={`${base}/kasus`}/>
  </RecordFrame>;
}
