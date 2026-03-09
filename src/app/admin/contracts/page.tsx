"use client";

import AdminContractsWorkspace from "@/components/contracts/AdminContractsWorkspace";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";

export default function AdminContractsPage() {
  const { snapshot, loading } = useSupabaseSession();
  const accessToken = snapshot?.accessToken?.trim() ?? "";

  if (loading) return null;

  return <AdminContractsWorkspace accessToken={accessToken} />;
}
