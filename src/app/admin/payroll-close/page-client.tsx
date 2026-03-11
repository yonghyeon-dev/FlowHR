"use client";

import PayrollClosePeriodConsole, {
  type PayrollCloseQueueMode
} from "@/components/payroll-close/PayrollClosePeriodConsole";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";

type AdminPayrollClosePageClientProps = {
  queueMode: PayrollCloseQueueMode;
};

export default function AdminPayrollClosePageClient({
  queueMode
}: AdminPayrollClosePageClientProps) {
  const { loading } = useSupabaseSession();

  if (loading) {
    return null;
  }

  return <PayrollClosePeriodConsole queueMode={queueMode} />;
}
