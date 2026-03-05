"use client";

import { AdminOnboardingDashboard } from "@/components/admin-onboarding/AdminOnboardingDashboard";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";

export default function AdminOnboardingPage() {
  const { loading } = useSupabaseSession();

  if (loading) return null;

  return <AdminOnboardingDashboard />;
}
