import { notFound } from "next/navigation";

import { isOpsDevToolsEnabled } from "@/app/ops/devtools";

export default async function OpsAdminConsolePage() {
  if (!isOpsDevToolsEnabled()) {
    notFound();
  }

  const { default: AdminConsolePageClient } = await import("./page-client");
  return <AdminConsolePageClient />;
}
