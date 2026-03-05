"use client";

import AdminSchedulingWorkspace from "@/components/scheduling/AdminSchedulingWorkspace";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";

export default function AdminSchedulingPage() {
  const { loading } = useSupabaseSession();

  if (loading) return null;

  return <AdminSchedulingWorkspace />;
}
