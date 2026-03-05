"use client";

import EmployeeContractsInbox from "@/components/contracts/EmployeeContractsInbox";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";

export default function EmployeeContractsPage() {
  const { loading } = useSupabaseSession();

  if (loading) return null;

  return <EmployeeContractsInbox />;
}
