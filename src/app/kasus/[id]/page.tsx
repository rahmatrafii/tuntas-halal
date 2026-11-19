import { CaseScreen } from "@/features/demo/case-screen";
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <CaseScreen id={id} />;
}
