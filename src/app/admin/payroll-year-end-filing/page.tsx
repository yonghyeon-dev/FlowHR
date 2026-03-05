"use client";

import PayrollYearEndFilingConsole from "@/components/payroll-year-end-filing/PayrollYearEndFilingConsole";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";

export default function AdminPayrollYearEndFilingPage() {
  const { loading } = useSupabaseSession();

  if (loading) return null;

  return <PayrollYearEndFilingConsole />;
}
