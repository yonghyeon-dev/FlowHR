import { notFound } from "next/navigation";
import type { ReactNode } from "react";

const TRUTHY_FLAGS = new Set(["1", "true", "yes", "on", "enabled"]);

function isDevToolsEnabled() {
  const raw = process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS ?? "";
  return TRUTHY_FLAGS.has(raw.trim().toLowerCase());
}

type OpsLayoutProps = {
  children: ReactNode;
};

export default function OpsLayout({ children }: OpsLayoutProps) {
  if (!isDevToolsEnabled()) {
    notFound();
  }

  return <>{children}</>;
}
