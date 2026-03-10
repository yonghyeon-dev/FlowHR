import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { isOpsDevToolsEnabled } from "@/app/ops/devtools";

type OpsLayoutProps = {
  children: ReactNode;
};

export default function OpsLayout({ children }: OpsLayoutProps) {
  if (!isOpsDevToolsEnabled()) {
    notFound();
  }

  return <>{children}</>;
}
