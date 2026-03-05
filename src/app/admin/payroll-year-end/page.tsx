"use client";

import PayrollYearEndConsole from "@/components/payroll-year-end/PayrollYearEndConsole";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";

export default function AdminPayrollYearEndPage() {
  const { loading } = useSupabaseSession();

  if (loading) return null;

  return <PayrollYearEndConsole />;
}
