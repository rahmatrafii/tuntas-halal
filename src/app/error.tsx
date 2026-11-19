"use client";
import { StateView } from "@/features/demo/ui";
export default function Error({ reset }: { reset: () => void }) {
  return <StateView kind="error" onRetry={reset} />;
}
