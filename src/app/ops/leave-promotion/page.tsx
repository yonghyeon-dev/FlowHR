import { notFound } from "next/navigation";

import LeavePromotionConsole from "@/components/leave-promotion/LeavePromotionConsole";

function isDevToolsEnabled() {
  const raw = process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS ?? "";
  const normalized = raw.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

export default function OpsLeavePromotionPage() {
  if (!isDevToolsEnabled()) {
    notFound();
  }
  return <LeavePromotionConsole backHref="/ops/mvp-console" backLabel="ops 콘솔로" />;
}
