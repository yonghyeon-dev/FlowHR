import { headers } from "next/headers";

import { resolveLocaleFromAcceptLanguage } from "@/lib/i18n/locales";

export async function getRequestLocale() {
  const headerStore = await headers();
  return resolveLocaleFromAcceptLanguage(headerStore.get("accept-language"));
}
