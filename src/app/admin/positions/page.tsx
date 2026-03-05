"use client";

import AdminPositionManagementWorkspace from "@/components/positions/AdminPositionManagementWorkspace";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";

export default function AdminPositionsPage() {
  const { loading } = useSupabaseSession();

  if (loading) return null;

  return <AdminPositionManagementWorkspace />;
}
