import { CaseFormScreen } from "@/features/demo/form-screens";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ kontak?: string }>;
}) {
  const { kontak } = await searchParams;
  return <CaseFormScreen contactId={kontak} />;
}
