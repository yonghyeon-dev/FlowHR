"use client";

import PayrollPayslipDeliveryConsole, {
  type PayrollPayslipDeliveryQueueMode
} from "@/components/payroll-payslip-delivery/PayrollPayslipDeliveryConsole";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";

type AdminPayrollPayslipDeliveryPageClientProps = {
  queueMode: PayrollPayslipDeliveryQueueMode;
};

export default function AdminPayrollPayslipDeliveryPageClient({
  queueMode
}: AdminPayrollPayslipDeliveryPageClientProps) {
  const { loading } = useSupabaseSession();

  if (loading) {
    return null;
  }

  return <PayrollPayslipDeliveryConsole queueMode={queueMode} />;
}
