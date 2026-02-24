import { buildYearEndFilingSubmissionId } from "@/features/payroll/service-year-end-adapter-helpers";
import type {
  PayrollYearEndFilingExportFormat,
  PayrollYearEndFilingTransport,
  PayrollYearEndFilingValidationMode
} from "@/features/payroll/service-input-types";
import type {
  ExportPayrollYearEndFilingDataResult,
  PayrollYearEndFilingSubmissionSummary
} from "@/features/payroll/service-output-types";
import {
  type ServiceContext,
  getEventPublisher
} from "@/features/payroll/service-context-helpers";

type CreateYearEndFilingSubmissionInput = {
  year: number;
  employeeId: string;
  format: PayrollYearEndFilingExportFormat;
  validationMode: PayrollYearEndFilingValidationMode;
  expectedSettlementHash?: string;
  transport: PayrollYearEndFilingTransport;
  submissionNote?: string;
  attempt: number;
  resubmissionOfSubmissionId: string | null;
  resubmissionReason: string | null;
  auditAction: "payroll.year_end.filing_package_submitted" | "payroll.year_end.filing_package_resubmitted";
  eventName:
    | "payroll.year_end.filing_package.submitted.v1"
    | "payroll.year_end.filing_package.resubmitted.v1";
};

type ExportYearEndFilingData = (
  context: ServiceContext,
  input: {
    year: number;
    employeeId: string;
    format: PayrollYearEndFilingExportFormat;
    validationMode: PayrollYearEndFilingValidationMode;
    expectedSettlementHash?: string;
  }
) => Promise<ExportPayrollYearEndFilingDataResult>;

export async function createYearEndFilingSubmissionFromHelper(
  context: ServiceContext,
  input: CreateYearEndFilingSubmissionInput,
  exportYearEndFilingData: ExportYearEndFilingData
): Promise<PayrollYearEndFilingSubmissionSummary> {
  const exportResult = await exportYearEndFilingData(context, {
    year: input.year,
    employeeId: input.employeeId,
    format: input.format,
    validationMode: input.validationMode,
    expectedSettlementHash: input.expectedSettlementHash
  });

  const actorRole = context.actor?.role ?? "system";
  const actorId = context.actor?.id ?? null;
  const entityId = `${input.year}_${input.employeeId}`;
  const submittedAt = new Date().toISOString();
  const submissionId = buildYearEndFilingSubmissionId({
    year: input.year,
    employeeId: input.employeeId,
    checksumSha256: exportResult.filingData.artifact.checksumSha256,
    attempt: input.attempt
  });
  const submissionNote = input.submissionNote?.trim() ? input.submissionNote.trim() : null;

  const submission: PayrollYearEndFilingSubmissionSummary = {
    submissionId,
    year: input.year,
    employeeId: input.employeeId,
    attempt: input.attempt,
    resubmissionOfSubmissionId: input.resubmissionOfSubmissionId,
    resubmissionReason: input.resubmissionReason,
    finalizationId: exportResult.filingData.finalizationId,
    settlementHash: exportResult.filingData.settlementHash,
    format: input.format,
    validationMode: input.validationMode,
    transport: input.transport,
    artifact: {
      fileName: exportResult.filingData.artifact.fileName,
      contentType: exportResult.filingData.artifact.contentType,
      checksumSha256: exportResult.filingData.artifact.checksumSha256,
      byteLength: exportResult.filingData.artifact.byteLength
    },
    validationStatus: exportResult.filingData.validation.status,
    submittedAt,
    submittedByRole: actorRole,
    submittedById: actorId,
    status: "submitted",
    ack: null,
    submissionNote
  };

  await context.dataAccess.audit.append({
    action: input.auditAction,
    entityType: "PayrollYearEnd",
    entityId,
    actorRole,
    actorId: actorId ?? undefined,
    payload: submission
  });
  await getEventPublisher(context).publish({
    name: input.eventName,
    occurredAt: submittedAt,
    entityType: "PayrollYearEnd",
    entityId,
    actorRole,
    actorId: actorId ?? undefined,
    payload: submission as unknown as Record<string, unknown>
  });

  return submission;
}
