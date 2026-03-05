"use client";

import { AdminKpiDashboard } from "@/components/admin-kpi/AdminKpiDashboard";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";

export default function AdminKpiPage() {
  const { loading } = useSupabaseSession();

  if (loading) return null;

  return <AdminKpiDashboard />;
}
