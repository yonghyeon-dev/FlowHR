"use client";

import AdminNoticeWorkspace from "@/components/notices/AdminNoticeWorkspace";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";

export default function AdminNoticesPage() {
  const { loading } = useSupabaseSession();

  if (loading) return null;

  return <AdminNoticeWorkspace />;
}
