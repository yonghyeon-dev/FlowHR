import { notFound, redirect } from "next/navigation";

import { isTruthyFlag } from "@/app/admin/page-helpers";

export default function AdminLeavePromotionPage() {
  if (!isTruthyFlag(process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS)) {
    notFound();
  }

  redirect("/ops/leave-promotion");
}
