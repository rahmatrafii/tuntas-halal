import { CaseFormScreen } from "@/features/demo/form-screens";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CaseFormScreen caseId={id} />;
}
