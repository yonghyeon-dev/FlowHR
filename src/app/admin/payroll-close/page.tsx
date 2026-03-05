"use client";

import PayrollClosePeriodConsole from "@/components/payroll-close/PayrollClosePeriodConsole";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";

export default function AdminPayrollClosePage() {
  const { loading } = useSupabaseSession();

  if (loading) return null;

  return <PayrollClosePeriodConsole />;
}
