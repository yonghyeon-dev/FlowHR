"use client";

import EmployeeContractsInbox from "@/components/contracts/EmployeeContractsInbox";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";

export default function EmployeeContractsPage() {
  const { snapshot, loading } = useSupabaseSession();
  const accessToken = snapshot?.accessToken?.trim() ?? "";

  if (loading) return null;

  return <EmployeeContractsInbox accessToken={accessToken} />;
}
