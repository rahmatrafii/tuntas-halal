import { DraftScreen } from "@/features/demo/draft-screen";
export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ pilih?: string }>;
}) {
  const { id } = await params;
  const { pilih } = await searchParams;
  return <DraftScreen id={id} selectedId={pilih} />;
}
