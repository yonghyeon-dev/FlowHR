import { notFound } from "next/navigation";

import { isOpsDevToolsEnabled } from "@/app/ops/devtools";

export default async function OpsSchedulingCockpitPage() {
  if (!isOpsDevToolsEnabled()) {
    notFound();
  }

  const { default: SchedulingCockpitOpsPageClient } = await import("./page-client");
  return <SchedulingCockpitOpsPageClient />;
}
