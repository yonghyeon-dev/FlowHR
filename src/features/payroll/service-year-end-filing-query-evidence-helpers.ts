import { Permissions } from "@/lib/rbac";
import { ServiceError } from "@/features/shared/service-error";
import {
  buildPayrollYearEndFilingAckCatalog,
  buildYearEndFilingSubmissionListSummary,
  buildYearEndFilingSubmissionTimeline,
  listYearEndFilingLifecycleLogs,
  listYearEndFilingSubmissionSummaries,
  matchesYearEndFilingSubmissionFilters,
  sortYearEndFilingSubmissions
} from "@/features/payroll/service-year-end-adapter-helpers";
import {
  isPayrollYearEndEnabled,
  isPayrollYearEndFilingSubmissionEnabled
} from "@/features/payroll/service-runtime-helpers";
import type {
  AddPayrollYearEndFilingEvidenceNoteInput,
  ListPayrollYearEndFilingSubmissionTimelineInput,
  ListPayrollYearEndFilingSubmissionsInput
} from "@/features/payroll/service-input-types";
import type {
  AddPayrollYearEndFilingEvidenceNoteResult,
  ListPayrollYearEndFilingAckCatalogResult,
  ListPayrollYearEndFilingSubmissionTimelineResult,
  ListPayrollYearEndFilingSubmissionsResult,
  PayrollYearEndFilingEvidenceNoteSummary
} from "@/features/payroll/service-output-types";
import { loadYearEndRunSnapshot } from "@/features/payroll/service-year-end-run-snapshot-helpers";
import {
  type ServiceContext,
  getEventPublisher,
  requirePayrollPermission
} from "@/features/payroll/service-context-helpers";

export async function listPayrollYearEndFilingSubmissionsFromHelper(
  context: ServiceContext,
  input: ListPayrollYearEndFilingSubmissionsInput
): Promise<ListPayrollYearEndFilingSubmissionsResult> {
  await requirePayrollPermission(context, Permissions.payrollRunList, "list");
  if (!isPayrollYearEndEnabled()) {
    throw new ServiceError(409, "payroll_year_end_v1 feature flag is disabled");
  }
  if (!isPayrollYearEndFilingSubmissionEnabled()) {
    throw new ServiceError(409, "payroll_year_end_filing_submission_v1 feature flag is disabled");
  }

  await loadYearEndRunSnapshot(context, input.year, input.employeeId);
  const allSubmissions = await listYearEndFilingSubmissionSummaries(context, input);
  const filteredSubmissions = allSubmissions.filter((submission) =>
    matchesYearEndFilingSubmissionFilters(submission, input)
  );
  const submissions = sortYearEndFilingSubmissions(filteredSubmissions, {
    sortBy: input.sortBy,
    sortDirection: input.sortDirection
  });
  return {
    summary: buildYearEndFilingSubmissionListSummary({
      allSubmissions,
      filteredSubmissions
    }),
    submissions
  };
}

export async function listPayrollYearEndFilingAckCatalogFromHelper(
  context: ServiceContext
): Promise<ListPayrollYearEndFilingAckCatalogResult> {
  await requirePayrollPermission(context, Permissions.payrollRunList, "list");
  if (!isPayrollYearEndEnabled()) {
    throw new ServiceError(409, "payroll_year_end_v1 feature flag is disabled");
  }
  if (!isPayrollYearEndFilingSubmissionEnabled()) {
    throw new ServiceError(409, "payroll_year_end_filing_submission_v1 feature flag is disabled");
  }

  return buildPayrollYearEndFilingAckCatalog();
}

export async function listPayrollYearEndFilingSubmissionTimelineFromHelper(
  context: ServiceContext,
  input: ListPayrollYearEndFilingSubmissionTimelineInput
): Promise<ListPayrollYearEndFilingSubmissionTimelineResult> {
  await requirePayrollPermission(context, Permissions.payrollRunList, "list");
  if (!isPayrollYearEndEnabled()) {
    throw new ServiceError(409, "payroll_year_end_v1 feature flag is disabled");
  }
  if (!isPayrollYearEndFilingSubmissionEnabled()) {
    throw new ServiceError(409, "payroll_year_end_filing_submission_v1 feature flag is disabled");
  }

  await loadYearEndRunSnapshot(context, input.year, input.employeeId);
  const submissions = await listYearEndFilingSubmissionSummaries(context, {
    year: input.year,
    employeeId: input.employeeId
  });
  const submission = submissions.find((candidate) => candidate.submissionId === input.submissionId);
  if (!submission) {
    throw new ServiceError(404, "filing submission not found");
  }
  const logs = await listYearEndFilingLifecycleLogs(context, {
    year: input.year,
    employeeId: input.employeeId
  });
  const timeline = buildYearEndFilingSubmissionTimeline(logs, input.submissionId);

  return {
    submission,
    timeline
  };
}

export async function addPayrollYearEndFilingEvidenceNoteFromHelper(
  context: ServiceContext,
  input: AddPayrollYearEndFilingEvidenceNoteInput
): Promise<AddPayrollYearEndFilingEvidenceNoteResult> {
  await requirePayrollPermission(context, Permissions.payrollRunConfirm, "confirm");
  if (!isPayrollYearEndEnabled()) {
    throw new ServiceError(409, "payroll_year_end_v1 feature flag is disabled");
  }
  if (!isPayrollYearEndFilingSubmissionEnabled()) {
    throw new ServiceError(409, "payroll_year_end_filing_submission_v1 feature flag is disabled");
  }

  await loadYearEndRunSnapshot(context, input.year, input.employeeId);
  const submissions = await listYearEndFilingSubmissionSummaries(context, {
    year: input.year,
    employeeId: input.employeeId
  });
  if (!submissions.some((submission) => submission.submissionId === input.submissionId)) {
    throw new ServiceError(404, "filing submission not found");
  }

  const note = input.note.trim();
  if (!note) {
    throw new ServiceError(400, "evidence note must not be empty");
  }
  const actorRole = context.actor?.role ?? "system";
  const actorId = context.actor?.id ?? null;
  const notedAt = new Date().toISOString();
  const entityId = `${input.year}_${input.employeeId}`;
  const payload: PayrollYearEndFilingEvidenceNoteSummary = {
    submissionId: input.submissionId,
    year: input.year,
    employeeId: input.employeeId,
    note,
    notedAt,
    notedByRole: actorRole,
    notedById: actorId
  };

  await context.dataAccess.audit.append({
    action: "payroll.year_end.filing_evidence_note_added",
    entityType: "PayrollYearEnd",
    entityId,
    actorRole,
    actorId: actorId ?? undefined,
    payload
  });
  await getEventPublisher(context).publish({
    name: "payroll.year_end.filing_evidence_note.added.v1",
    occurredAt: notedAt,
    entityType: "PayrollYearEnd",
    entityId,
    actorRole,
    actorId: actorId ?? undefined,
    payload: payload as unknown as Record<string, unknown>
  });

  return {
    evidenceNote: payload
  };
}
