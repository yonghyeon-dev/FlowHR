import { notFound } from "next/navigation";

import FilingOpsWorkflowStepPage from "@/components/payroll-year-end-filing/FilingOpsWorkflowStepPage";
import { resolveFilingWorkflowStepFromSegment } from "@/components/payroll-year-end-filing/filing-workflow-helpers";

type AdminPayrollYearEndFilingOpsStepPageProps = {
  params: Promise<{
    step: string;
  }>;
};

export default async function AdminPayrollYearEndFilingOpsStepPage({
  params
}: AdminPayrollYearEndFilingOpsStepPageProps) {
  const { step: segment } = await params;
  const step = resolveFilingWorkflowStepFromSegment(segment);
  if (!step) {
    notFound();
  }
  return <FilingOpsWorkflowStepPage step={step} />;
}
