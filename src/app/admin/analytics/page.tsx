"use client";

import { AdminKpiDashboard } from "@/components/admin-kpi/AdminKpiDashboard";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";

export default function AdminAnalyticsPage() {
  const { loading } = useSupabaseSession();

  if (loading) return null;

  return <AdminKpiDashboard analyticsMode />;
}
