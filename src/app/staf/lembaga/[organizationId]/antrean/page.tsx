import {requireOrganization} from "@/features/caseload/server";
import {listQueue} from "@/features/queue/queries";
import {QueueView} from "@/features/queue/ui";

export default async function Page({params,searchParams}:{params:Promise<{organizationId:string}>;searchParams:Promise<Record<string,string|string[]|undefined>>}){
 const {organizationId}=await params,{client,context}=await requireOrganization(organizationId);
 return <QueueView context={context} result={await listQueue(client,context,await searchParams)}/>;
}
