import { notFound } from "next/navigation";

import { isOpsDevToolsEnabled } from "@/app/ops/devtools";
import LeavePromotionConsole from "@/components/leave-promotion/LeavePromotionConsole";

export default function OpsLeavePromotionPage() {
  if (!isOpsDevToolsEnabled()) {
    notFound();
  }
  return <LeavePromotionConsole backHref="/ops/mvp-console" backLabel="ops 콘솔로" />;
}
