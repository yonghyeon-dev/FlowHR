import type { AuditLogEntity, DataAccess } from "@/features/shared/data-access";
import { ServiceError } from "@/features/shared/service-error";
import { buildYearEndFilingSubmissionSummaries } from "@/features/payroll/year-end-filing-lifecycle-helpers";

const yearEndFilingLifecycleActions = [
  "payroll.year_end.filing_package_submitted",
  "payroll.year_end.filing_package_resubmitted",
  "payroll.year_end.filing_package_canceled",
  "payroll.year_end.filing_package_reopened",
  "payroll.year_end.filing_package_acknowledged",
  "payroll.year_end.filing_evidence_note_added"
] as const;

export async function listYearEndFilingLifecycleLogs(
  audit: Pick<DataAccess["audit"], "list">,
  input: {
    year: number;
    employeeId: string;
  }
): Promise<AuditLogEntity[]> {
  const entityId = `${input.year}_${input.employeeId}`;
  return audit.list({
    actions: [...yearEndFilingLifecycleActions],
    entityType: "PayrollYearEnd",
    entityId,
    limit: 1000
  });
}

export async function listYearEndFilingSubmissionSummaries<TSubmission>(
  audit: Pick<DataAccess["audit"], "list">,
  input: {
    year: number;
    employeeId: string;
  }
): Promise<TSubmission[]> {
  const logs = await listYearEndFilingLifecycleLogs(audit, input);
  return buildYearEndFilingSubmissionSummaries(logs) as TSubmission[];
}

export function ensureNoPendingFilingSubmission<T extends { status: string }>(submissions: T[]) {
  if (submissions.some((submission) => submission.status === "submitted")) {
    throw new ServiceError(
      409,
      "existing filing submission must be acknowledged before submit/resubmit"
    );
  }
}

export function buildYearEndFilingSubmissionId(input: {
  year: number;
  employeeId: string;
  checksumSha256: string;
  attempt: number;
}) {
  return `YFS-${input.year}-${input.employeeId}-${input.checksumSha256.slice(0, 10)}-A${input.attempt}-${Date.now()}`;
}
