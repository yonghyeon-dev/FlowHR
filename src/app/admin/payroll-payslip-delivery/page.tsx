"use client";

import PayrollPayslipDeliveryConsole from "@/components/payroll-payslip-delivery/PayrollPayslipDeliveryConsole";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";

export default function AdminPayrollPayslipDeliveryPage() {
  const { loading } = useSupabaseSession();

  if (loading) return null;

  return <PayrollPayslipDeliveryConsole />;
}
