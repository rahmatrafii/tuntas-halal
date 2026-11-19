import { TaskFormScreen } from "@/features/demo/form-screens";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ kasus?: string }>;
}) {
  const { kasus } = await searchParams;
  return <TaskFormScreen caseId={kasus} />;
}
