"use client";

import EmployeeRecruitmentWorkspace from "@/components/recruitment/EmployeeRecruitmentWorkspace";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";

export default function EmployeeRecruitmentPage() {
  const { loading } = useSupabaseSession();

  if (loading) return null;

  return <EmployeeRecruitmentWorkspace />;
}
