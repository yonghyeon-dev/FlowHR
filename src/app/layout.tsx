import "./globals.css";
import type { Metadata } from "next";
import { ReactNode } from "react";

import { I18nProvider } from "@/lib/i18n/provider";
import { getRequestLocale } from "@/lib/i18n/server";

export const metadata: Metadata = {
  title: "FlowHR",
  description: "Contract-first HRM SaaS foundation"
};

type RootLayoutProps = {
  children: ReactNode;
};

export default async function RootLayout({ children }: RootLayoutProps) {
  const locale = await getRequestLocale();

  return (
    <html lang={locale}>
      <body>
        <I18nProvider initialLocale={locale}>{children}</I18nProvider>
      </body>
    </html>
  );
}
