import { notFound } from "next/navigation";

import { isOpsDevToolsEnabled } from "@/app/ops/devtools";

export default async function OpsMvpConsolePage() {
  if (!isOpsDevToolsEnabled()) {
    notFound();
  }

  const { default: MvpConsolePageClient } = await import("./page-client");
  return <MvpConsolePageClient />;
}
