import { resolveActorPermissions } from "@/lib/permissions";
import { Permissions } from "@/lib/rbac";
import { applyApprovalExecutionAction, assertApprovalPolicyGate } from "@/features/approval/service";
import { ensureTenantMatch, resolveTenantScope } from "@/features/shared/tenant-scope";
import type {
  DeductionProfileEntity,
  PayrollRunEntity
} from "@/features/shared/data-access";
import { ServiceError } from "@/features/shared/service-error";
import {
  ensureNoPendingFilingSubmission,
  listYearEndFilingSubmissionSummaries,
} from "@/features/payroll/service-year-end-adapter-helpers";
import {
  ensureValidPeriod,
  isPayrollYearEndEnabled,
  isPayrollYearEndFilingExportEnabled,
  isPayrollYearEndFilingSubmissionEnabled,
} from "@/features/payroll/service-runtime-helpers";
import type {
  AcknowledgePayrollPayslipReceiptInput,
  AcknowledgePayrollYearEndFilingPackageInput,
  AddPayrollYearEndFilingEvidenceNoteInput,
  CancelPayrollYearEndFilingPackageInput,
  ClosePayrollPeriodInput,
  DistributePayrollPayslipsInput,
  ExportPayrollYearEndFilingDataInput,
  FinalizePayrollYearEndSettlementInput,
  GetPayrollYearEndFinalizedSettlementInput,
  GetPayrollYearEndInsuranceReconciliationReportInput,
  GetPayrollYearEndPreflightChecklistInput,
  GetPayrollYearEndWithholdingReceiptDocumentInput,
  IssuePayrollYearEndWithholdingReceiptInput,
  ListPayrollYearEndFilingSubmissionTimelineInput,
  ListPayrollYearEndFilingSubmissionsInput,
  PreviewPayrollInput,
  PreviewPayrollInsuranceSettlementInput,
  PreviewPayrollWithDeductionsInput,
  PreviewPayrollYearEndSettlementInput,
  RecalculatePayrollYearEndSettlementInput,
  ReopenPayrollYearEndFilingPackageInput,
  ResubmitPayrollYearEndFilingPackageInput,
  SubmitPayrollYearEndFilingPackageInput,
  UpsertDeductionProfileInput,
} from "@/features/payroll/service-input-types";
import type {
  AcknowledgePayrollPayslipReceiptResult,
  AcknowledgePayrollYearEndFilingPackageResult,
  AddPayrollYearEndFilingEvidenceNoteResult,
  CancelPayrollYearEndFilingPackageResult,
  ClosePayrollPeriodResult,
  DistributePayrollPayslipsResult,
  ExportPayrollYearEndFilingDataResult,
  FinalizePayrollYearEndSettlementResult,
  GetPayrollYearEndFinalizedSettlementResult,
  GetPayrollYearEndInsuranceReconciliationReportResult,
  GetPayrollYearEndPreflightChecklistResult,
  GetPayrollYearEndWithholdingReceiptDocumentResult,
  IssuePayrollYearEndWithholdingReceiptResult,
  ListDeductionProfilesInput,
  ListPayrollRunsInput,
  ListPayrollYearEndFilingAckCatalogResult,
  ListPayrollYearEndFilingSubmissionTimelineResult,
  ListPayrollYearEndFilingSubmissionsResult,
  PreviewPayrollInsuranceSettlementResult,
  PreviewPayrollResult,
  PreviewPayrollWithDeductionsResult,
  PreviewPayrollYearEndSettlementResult,
  RecalculatePayrollYearEndSettlementResult,
  ReopenPayrollYearEndFilingPackageResult,
  ResubmitPayrollYearEndFilingPackageResult,
  SubmitPayrollYearEndFilingPackageResult,
  UpsertDeductionProfileResult,
} from "@/features/payroll/service-output-types";
import {
  loadYearEndRunSnapshot,
} from "@/features/payroll/service-year-end-run-snapshot-helpers";
import {
  getPayrollYearEndFinalizedSettlementFromHelper,
  getPayrollYearEndWithholdingReceiptDocumentFromHelper,
  issuePayrollYearEndWithholdingReceiptFromHelper
} from "@/features/payroll/service-year-end-withholding-flow-helpers";
import {
  getPayrollYearEndInsuranceReconciliationReportFromHelper,
  getPayrollYearEndPreflightChecklistFromHelper
} from "@/features/payroll/service-year-end-reporting-helpers";
import {
  createYearEndFilingSubmissionFromHelper
} from "@/features/payroll/service-year-end-filing-submission-helpers";
import {
  addPayrollYearEndFilingEvidenceNoteFromHelper,
  listPayrollYearEndFilingAckCatalogFromHelper,
  listPayrollYearEndFilingSubmissionTimelineFromHelper,
  listPayrollYearEndFilingSubmissionsFromHelper
} from "@/features/payroll/service-year-end-filing-query-evidence-helpers";
import {
  exportPayrollYearEndFilingDataFromHelper
} from "@/features/payroll/service-year-end-filing-export-helpers";
import {
  acknowledgePayrollYearEndFilingPackageFromHelper,
  cancelPayrollYearEndFilingPackageFromHelper,
  reopenPayrollYearEndFilingPackageFromHelper
} from "@/features/payroll/service-year-end-filing-package-mutation-helpers";
import {
  listDeductionProfilesFromHelper,
  readDeductionProfileFromHelper,
  upsertDeductionProfileFromHelper
} from "@/features/payroll/service-deduction-profile-helpers";
import {
  previewPayrollFromHelper,
  previewPayrollWithDeductionsFromHelper
} from "@/features/payroll/service-preview-helpers";
import {
  type ServiceContext,
  getEventPublisher,
  requirePayrollPermission
} from "@/features/payroll/service-context-helpers";
import { previewPayrollInsuranceSettlementFromHelper } from "@/features/payroll/service-insurance-settlement-preview-helpers";
import {
  acknowledgePayrollPayslipReceiptFromHelper,
  closePayrollPeriodFromHelper,
  distributePayrollPayslipsFromHelper
} from "@/features/payroll/service-payslip-period-helpers";
import {
  finalizePayrollYearEndSettlementFromHelper,
  previewPayrollYearEndSettlementFromHelper,
  recalculatePayrollYearEndSettlementFromHelper
} from "@/features/payroll/service-year-end-settlement-flow-helpers";

export async function previewPayroll(
  context: ServiceContext,
  input: PreviewPayrollInput
): Promise<PreviewPayrollResult> {
  return previewPayrollFromHelper(context, input);
}

export async function previewPayrollWithDeductions(
  context: ServiceContext,
  input: PreviewPayrollWithDeductionsInput
): Promise<PreviewPayrollWithDeductionsResult> {
  return previewPayrollWithDeductionsFromHelper(context, input);
}

export async function previewPayrollInsuranceSettlement(
  context: ServiceContext,
  input: PreviewPayrollInsuranceSettlementInput
): Promise<PreviewPayrollInsuranceSettlementResult> {
  return previewPayrollInsuranceSettlementFromHelper(context, input);
}

export async function confirmPayrollRun(
  context: ServiceContext,
  runId: string
): Promise<PayrollRunEntity> {
  await requirePayrollPermission(context, Permissions.payrollRunConfirm, "confirm");
  const tenantScope = resolveTenantScope(context.actor);

  const run = await context.dataAccess.payroll.findById(runId);
  if (!run) {
    throw new ServiceError(404, "payroll run not found");
  }
  ensureTenantMatch(tenantScope, run.organizationId, "payroll run not found");
  if (run.state !== "PREVIEWED") {
    throw new ServiceError(409, "only previewed payroll run can be confirmed");
  }
  if (run.organizationId) {
    const execution = await applyApprovalExecutionAction(context, {
      domain: "PAYROLL",
      organizationId: run.organizationId,
      targetEntityType: "PayrollRun",
      targetEntityId: run.id,
      action: "APPROVE",
      payrollGrossPayKrw: run.grossPayKrw
    });
    if (!execution.finalized) {
      return run;
    }
  } else {
    await assertApprovalPolicyGate(context, {
      domain: "PAYROLL",
      organizationId: run.organizationId,
      payrollGrossPayKrw: run.grossPayKrw,
      targetEntityType: "PayrollRun",
      targetEntityId: run.id
    });
  }

  const confirmed = await context.dataAccess.payroll.update(runId, {
    state: "CONFIRMED",
    confirmedAt: new Date(),
    confirmedBy: context.actor!.id
  });

  await context.dataAccess.audit.append({
    action: "payroll.confirmed",
    entityType: "PayrollRun",
    entityId: confirmed.id,
    organizationId: confirmed.organizationId,
    actorRole: context.actor!.role,
    actorId: context.actor!.id
  });
  await getEventPublisher(context).publish({
    name: "payroll.confirmed.v1",
    occurredAt: new Date().toISOString(),
    entityType: "PayrollRun",
    entityId: confirmed.id,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload: {
      confirmedAt: confirmed.confirmedAt?.toISOString() ?? null
    }
  });

  return confirmed;
}

export async function listPayrollRuns(
  context: ServiceContext,
  input: ListPayrollRunsInput
): Promise<PayrollRunEntity[]> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }

  const permissions = await resolveActorPermissions({ actor, dataAccess: context.dataAccess });
  const canListAny = permissions.has(Permissions.payrollRunList);
  const canListOwn = permissions.has(Permissions.payrollRunListOwn);

  if (!canListAny && !canListOwn) {
    throw new ServiceError(403, `payroll list requires ${Permissions.payrollRunList} permission`);
  }

  if (!canListAny) {
    const targetEmployeeId = input.employeeId?.trim() ?? "";
    if (!targetEmployeeId || targetEmployeeId !== actor.id) {
      throw new ServiceError(403, "employees can only list their own confirmed payroll runs");
    }
    if (input.state && input.state !== "CONFIRMED") {
      throw new ServiceError(403, "employees can only access confirmed payroll runs");
    }
    // Enforce confirmed-only view for employee self-service payslips.
    input = { ...input, employeeId: targetEmployeeId, state: "CONFIRMED" };
  }

  ensureValidPeriod(input.periodStart, input.periodEnd);
  const tenantScope = resolveTenantScope(context.actor);

  return await context.dataAccess.payroll.listInPeriod({
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    organizationId: tenantScope ?? undefined,
    employeeId: input.employeeId,
    state: input.state
  });
}

export async function closePayrollPeriod(
  context: ServiceContext,
  input: ClosePayrollPeriodInput
): Promise<ClosePayrollPeriodResult> {
  return closePayrollPeriodFromHelper(context, input);
}
export async function distributePayrollPayslips(
  context: ServiceContext,
  input: DistributePayrollPayslipsInput
): Promise<DistributePayrollPayslipsResult> {
  return distributePayrollPayslipsFromHelper(context, input);
}
export async function acknowledgePayrollPayslipReceipt(
  context: ServiceContext,
  input: AcknowledgePayrollPayslipReceiptInput
): Promise<AcknowledgePayrollPayslipReceiptResult> {
  return acknowledgePayrollPayslipReceiptFromHelper(context, input);
}
export async function previewPayrollYearEndSettlement(
  context: ServiceContext,
  input: PreviewPayrollYearEndSettlementInput
): Promise<PreviewPayrollYearEndSettlementResult> {
  return previewPayrollYearEndSettlementFromHelper(context, input);
}
export async function recalculatePayrollYearEndSettlement(
  context: ServiceContext,
  input: RecalculatePayrollYearEndSettlementInput
): Promise<RecalculatePayrollYearEndSettlementResult> {
  return recalculatePayrollYearEndSettlementFromHelper(context, input);
}
export async function finalizePayrollYearEndSettlement(
  context: ServiceContext,
  input: FinalizePayrollYearEndSettlementInput
): Promise<FinalizePayrollYearEndSettlementResult> {
  return finalizePayrollYearEndSettlementFromHelper(context, input);
}
export async function exportPayrollYearEndFilingData(
  context: ServiceContext,
  input: ExportPayrollYearEndFilingDataInput
): Promise<ExportPayrollYearEndFilingDataResult> {
  return exportPayrollYearEndFilingDataFromHelper(context, input);
}

async function loadFilingSubmissionContext(
  context: ServiceContext,
  year: number,
  employeeId: string
) {
  if (!isPayrollYearEndEnabled()) {
    throw new ServiceError(409, "payroll_year_end_v1 feature flag is disabled");
  }
  if (!isPayrollYearEndFilingExportEnabled()) {
    throw new ServiceError(409, "payroll_year_end_filing_export_v1 feature flag is disabled");
  }
  if (!isPayrollYearEndFilingSubmissionEnabled()) {
    throw new ServiceError(409, "payroll_year_end_filing_submission_v1 feature flag is disabled");
  }
  await loadYearEndRunSnapshot(context, year, employeeId);
  return await listYearEndFilingSubmissionSummaries(context, { year, employeeId });
}

export async function submitPayrollYearEndFilingPackage(
  context: ServiceContext,
  input: SubmitPayrollYearEndFilingPackageInput
): Promise<SubmitPayrollYearEndFilingPackageResult> {
  await requirePayrollPermission(context, Permissions.payrollRunConfirm, "confirm");
  const submissions = await loadFilingSubmissionContext(context, input.year, input.employeeId);
  ensureNoPendingFilingSubmission(submissions);
  if (submissions.length > 0) {
    throw new ServiceError(
      409,
      "existing filing submission history found; use resubmit endpoint for rejected submissions"
    );
  }

  const submission = await createYearEndFilingSubmissionFromHelper(
    context,
    {
      year: input.year,
      employeeId: input.employeeId,
      format: input.format,
      validationMode: input.validationMode,
      expectedSettlementHash: input.expectedSettlementHash,
      transport: input.transport,
      submissionNote: input.submissionNote,
      attempt: 1,
      resubmissionOfSubmissionId: null,
      resubmissionReason: null,
      auditAction: "payroll.year_end.filing_package_submitted",
      eventName: "payroll.year_end.filing_package.submitted.v1"
    },
    exportPayrollYearEndFilingData
  );

  return { submission };
}

export async function resubmitPayrollYearEndFilingPackage(
  context: ServiceContext,
  input: ResubmitPayrollYearEndFilingPackageInput
): Promise<ResubmitPayrollYearEndFilingPackageResult> {
  await requirePayrollPermission(context, Permissions.payrollRunConfirm, "confirm");
  const submissions = await loadFilingSubmissionContext(context, input.year, input.employeeId);
  const target = submissions.find((submission) => submission.submissionId === input.submissionId);
  if (!target) {
    throw new ServiceError(404, "filing submission not found for resubmission");
  }
  if (target.status !== "acknowledged" || target.ack?.ackStatus !== "rejected") {
    throw new ServiceError(409, "only rejected acknowledged submissions can be resubmitted");
  }
  if (
    submissions.some(
      (submission) => submission.resubmissionOfSubmissionId === target.submissionId
    )
  ) {
    throw new ServiceError(409, "selected submission has already been resubmitted");
  }
  ensureNoPendingFilingSubmission(submissions);

  const submission = await createYearEndFilingSubmissionFromHelper(
    context,
    {
      year: input.year,
      employeeId: input.employeeId,
      format: input.format,
      validationMode: input.validationMode,
      expectedSettlementHash: input.expectedSettlementHash,
      transport: input.transport,
      submissionNote: input.submissionNote,
      attempt: target.attempt + 1,
      resubmissionOfSubmissionId: target.submissionId,
      resubmissionReason: input.resubmissionReason?.trim() ? input.resubmissionReason.trim() : null,
      auditAction: "payroll.year_end.filing_package_resubmitted",
      eventName: "payroll.year_end.filing_package.resubmitted.v1"
    },
    exportPayrollYearEndFilingData
  );

  return { submission };
}
export async function acknowledgePayrollYearEndFilingPackage(
  context: ServiceContext,
  input: AcknowledgePayrollYearEndFilingPackageInput
): Promise<AcknowledgePayrollYearEndFilingPackageResult> {
  return acknowledgePayrollYearEndFilingPackageFromHelper(context, input);
}
export async function cancelPayrollYearEndFilingPackage(
  context: ServiceContext,
  input: CancelPayrollYearEndFilingPackageInput
): Promise<CancelPayrollYearEndFilingPackageResult> {
  return cancelPayrollYearEndFilingPackageFromHelper(context, input);
}
export async function reopenPayrollYearEndFilingPackage(
  context: ServiceContext,
  input: ReopenPayrollYearEndFilingPackageInput
): Promise<ReopenPayrollYearEndFilingPackageResult> {
  return reopenPayrollYearEndFilingPackageFromHelper(context, input);
}
export async function listPayrollYearEndFilingSubmissions(
  context: ServiceContext,
  input: ListPayrollYearEndFilingSubmissionsInput
): Promise<ListPayrollYearEndFilingSubmissionsResult> {
  return listPayrollYearEndFilingSubmissionsFromHelper(context, input);
}
export async function listPayrollYearEndFilingAckCatalog(
  context: ServiceContext
): Promise<ListPayrollYearEndFilingAckCatalogResult> {
  return listPayrollYearEndFilingAckCatalogFromHelper(context);
}
export async function listPayrollYearEndFilingSubmissionTimeline(
  context: ServiceContext,
  input: ListPayrollYearEndFilingSubmissionTimelineInput
): Promise<ListPayrollYearEndFilingSubmissionTimelineResult> {
  return listPayrollYearEndFilingSubmissionTimelineFromHelper(context, input);
}
export async function addPayrollYearEndFilingEvidenceNote(
  context: ServiceContext,
  input: AddPayrollYearEndFilingEvidenceNoteInput
): Promise<AddPayrollYearEndFilingEvidenceNoteResult> {
  return addPayrollYearEndFilingEvidenceNoteFromHelper(context, input);
}
export async function getPayrollYearEndInsuranceReconciliationReport(
  context: ServiceContext,
  input: GetPayrollYearEndInsuranceReconciliationReportInput
): Promise<GetPayrollYearEndInsuranceReconciliationReportResult> {
  return await getPayrollYearEndInsuranceReconciliationReportFromHelper(context, input);
}
export async function getPayrollYearEndPreflightChecklist(
  context: ServiceContext,
  input: GetPayrollYearEndPreflightChecklistInput
): Promise<GetPayrollYearEndPreflightChecklistResult> {
  return await getPayrollYearEndPreflightChecklistFromHelper(context, input);
}
export async function getPayrollYearEndWithholdingReceiptDocument(
  context: ServiceContext,
  input: GetPayrollYearEndWithholdingReceiptDocumentInput
): Promise<GetPayrollYearEndWithholdingReceiptDocumentResult> {
  return await getPayrollYearEndWithholdingReceiptDocumentFromHelper(context, input);
}
export async function getPayrollYearEndFinalizedSettlement(
  context: ServiceContext,
  input: GetPayrollYearEndFinalizedSettlementInput
): Promise<GetPayrollYearEndFinalizedSettlementResult> {
  return await getPayrollYearEndFinalizedSettlementFromHelper(context, input);
}
export async function issuePayrollYearEndWithholdingReceipt(
  context: ServiceContext,
  input: IssuePayrollYearEndWithholdingReceiptInput
): Promise<IssuePayrollYearEndWithholdingReceiptResult> {
  return await issuePayrollYearEndWithholdingReceiptFromHelper(context, input);
}
export async function readDeductionProfile(
  context: ServiceContext,
  profileId: string
): Promise<DeductionProfileEntity> {
  return await readDeductionProfileFromHelper(context, profileId);
}
export async function upsertDeductionProfile(
  context: ServiceContext,
  input: UpsertDeductionProfileInput
): Promise<UpsertDeductionProfileResult> {
  return await upsertDeductionProfileFromHelper(context, input);
}
export async function listDeductionProfiles(
  context: ServiceContext,
  input: ListDeductionProfilesInput
): Promise<DeductionProfileEntity[]> {
  return await listDeductionProfilesFromHelper(context, input);
}
