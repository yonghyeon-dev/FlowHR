"use client";

import AdminContractsWorkspace from "@/components/contracts/AdminContractsWorkspace";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";

export default function AdminContractsPage() {
  const { loading } = useSupabaseSession();

  if (loading) return null;

  return <AdminContractsWorkspace />;
}
