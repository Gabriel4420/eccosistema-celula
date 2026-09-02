import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SessionProvider } from "@/src/providers/session-provider";
import { QueryProvider } from "@/src/providers/query-provider";
import { ToastViewport } from "@/src/shared/components/toast-viewport";
import "./globals.css";

export const metadata: Metadata = {
  description: "Ecossistema de gestão de células e pequenos grupos.",
  icons: {
    icon: "/brand/favicon.png"
  },
  title: {
    default: "Ecossistema de Células",
    template: "%s · Ecossistema de Células"
  }
};

interface RootLayoutProps {
  readonly children: ReactNode;
}

const themeInitializationScript = `
  try {
    const savedTheme = localStorage.getItem("mission-atos-theme");
    const systemTheme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    const theme = savedTheme === "dark" || savedTheme === "light" ? savedTheme : systemTheme;
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch { document.documentElement.dataset.theme = "light"; }
`;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitializationScript }} />
      </head>
      <body>
        <SessionProvider>
          <QueryProvider>{children}</QueryProvider>
        </SessionProvider>
        <ToastViewport />
      </body>
    </html>
  );
}
