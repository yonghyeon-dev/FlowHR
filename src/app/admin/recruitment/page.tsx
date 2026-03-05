"use client";

import AdminRecruitmentWorkspace from "@/components/recruitment/AdminRecruitmentWorkspace";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";

export default function AdminRecruitmentPage() {
  const { loading } = useSupabaseSession();

  if (loading) return null;

  return <AdminRecruitmentWorkspace />;
}
