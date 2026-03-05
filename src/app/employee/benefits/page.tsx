"use client";

import EmployeeBenefitsWorkspace from "@/components/benefits/EmployeeBenefitsWorkspace";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";

export default function EmployeeBenefitsPage() {
  const { loading } = useSupabaseSession();

  if (loading) return null;

  return <EmployeeBenefitsWorkspace />;
}
