"use client";

import AdminBenefitsWorkspace from "@/components/benefits/AdminBenefitsWorkspace";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";

export default function AdminBenefitsPage() {
  const { loading } = useSupabaseSession();

  if (loading) return null;

  return <AdminBenefitsWorkspace />;
}
