import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppShell } from "@/features/demo/ui";

export const metadata: Metadata = {
  title: "Pelacak Revisi Halal",
  description:
    "Alat tindak lanjut revisi sertifikasi halal untuk Pendamping PPH dan koordinator LP3H.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="id">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
