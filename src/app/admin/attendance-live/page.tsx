"use client";

import { AdminAttendanceLiveDashboard } from "@/components/admin-attendance-live/AdminAttendanceLiveDashboard";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";

export default function AdminAttendanceLivePage() {
  const { loading } = useSupabaseSession();

  if (loading) return null;

  return <AdminAttendanceLiveDashboard />;
}
