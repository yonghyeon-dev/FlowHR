"use client";

import PayrollInsuranceSettlementConsole from "@/components/payroll-insurance/PayrollInsuranceSettlementConsole";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";

export default function AdminPayrollInsurancePage() {
  const { loading } = useSupabaseSession();

  if (loading) return null;

  return <PayrollInsuranceSettlementConsole />;
}
