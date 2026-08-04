import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SessionProvider } from "@/src/providers/session-provider";
import "./globals.css";

export const metadata: Metadata = {
  description: "Ecossistema de gestão de células e pequenos grupos.",
  title: {
    default: "Ecossistema de Células",
    template: "%s · Ecossistema de Células"
  }
};

interface RootLayoutProps {
  readonly children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
