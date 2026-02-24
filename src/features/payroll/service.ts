import { resolveActorPermissions } from "@/lib/permissions";
import { Permissions } from "@/lib/rbac";
import { applyApprovalExecutionAction, assertApprovalPolicyGate } from "@/features/approval/service";
import { ensureTenantMatch, requireEmployeeWithinTenant, resolveTenantScope } from "@/features/shared/tenant-scope";
import type {
  DeductionProfileEntity,
  PayrollRunEntity
} from "@/features/shared/data-access";
import { ServiceError } from "@/features/shared/service-error";
import {
  applyYearEndDeductionCaps,
  asYearEndFinalizationAuditPayload,
  buildYearEndFilingSubmissionTimeline,
  buildPayrollYearEndFilingAckCatalog,
  buildYearEndFilingArtifact,
  buildYearEndFilingGuard,
  buildYearEndFilingRecords,
  buildYearEndFilingSubmissionListSummary,
  buildYearEndInputVectorHash,
  buildYearEndSettlementHash,
  calculateYearEndSettlementKrw,
  collectYearEndDeductionEligibilityBlockingReasons,
  ensureNoPendingFilingSubmission,
  listYearEndFilingLifecycleLogs,
  listYearEndFilingSubmissionSummaries,
  matchesYearEndFilingSubmissionFilters,
  normalizeYearEndDeductionEligibility,
  normalizeYearEndDeductionItems,
  normalizeYearEndSettlementHash,
  normalizeYearEndTaxCreditItems,
  resolveYearEndSettlementHashFromFinalizationPayload,
  sortYearEndFilingSubmissions,
  validateYearEndFilingRecords,
  type YearEndFilingGuard,
  type YearEndFinalizationAuditPayload
} from "@/features/payroll/service-year-end-adapter-helpers";
import {
  ensureValidPeriod,
  getYearPeriodInSeoul,
  isPayrollDeductionProfileEnabled,
  isPayrollDeductionsEnabled,
  isPayrollKrBaselineEnabled,
  isPayrollYearEndDeductionInputEnabled,
  isPayrollYearEndEnabled,
  isPayrollYearEndFilingExportEnabled,
  isPayrollYearEndFilingSubmissionEnabled,
  toKrwInteger,
  toRateNumber
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
  PayrollYearEndFilingSubmissionSortBy,
  PayrollYearEndFilingSubmissionSortDirection,
  PayrollYearEndWithholdingReceiptDocumentFormat,
  PreviewPayrollInput,
  PreviewPayrollInsuranceSettlementInput,
  PreviewPayrollWithDeductionsInput,
  PreviewPayrollYearEndSettlementInput,
  RecalculatePayrollYearEndSettlementInput,
  ReopenPayrollYearEndFilingPackageInput,
  ResubmitPayrollYearEndFilingPackageInput,
  SubmitPayrollYearEndFilingPackageInput,
  UpsertDeductionProfileInput,
  YearEndDeductionEligibilityInput,
  YearEndDeductionItemsInput,
  YearEndTaxCreditItemsInput
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
  PayrollTotalsKrw,
  PayrollYearEndFilingEvidenceNoteSummary,
  PreviewPayrollInsuranceSettlementResult,
  PreviewPayrollResult,
  PreviewPayrollWithDeductionsResult,
  PreviewPayrollYearEndSettlementResult,
  RecalculatePayrollYearEndSettlementResult,
  ReopenPayrollYearEndFilingPackageResult,
  ResubmitPayrollYearEndFilingPackageResult,
  SubmitPayrollYearEndFilingPackageResult,
  UpsertDeductionProfileResult,
  YearEndDeductionSummaryKrw,
  YearEndSettlementKrw,
  YearEndSettlementSummary
} from "@/features/payroll/service-output-types";
import {
  loadYearEndRunSnapshot,
  type YearEndRunSnapshot
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
  acknowledgePayrollYearEndFilingPackageFromHelper,
  cancelPayrollYearEndFilingPackageFromHelper,
  reopenPayrollYearEndFilingPackageFromHelper
} from "@/features/payroll/service-year-end-filing-package-mutation-helpers";
import {
  listDeductionProfilesFromHelper,
  readDeductionProfileFromHelper,
  upsertDeductionProfileFromHelper
} from "@/features/payroll/service-deduction-profile-helpers";
import { calculateStatutoryKrBaselineDeductionPreview } from "@/features/payroll/service-deduction-statutory-preview-helpers";
import {
  type ServiceContext,
  getEventPublisher,
  requirePayrollPermission
} from "@/features/payroll/service-context-helpers";
import { calculatePayrollComputation } from "@/features/payroll/service-computation-helpers";
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
  await requirePayrollPermission(context, Permissions.payrollRunPreview, "preview");
  const tenantScope = resolveTenantScope(context.actor);

  const employee = input.employeeId
    ? await requireEmployeeWithinTenant(context.dataAccess, context.actor, input.employeeId)
    : null;

  const computed = await calculatePayrollComputation(context.dataAccess, input, tenantScope);
  const run = await context.dataAccess.payroll.create({
    organizationId: employee?.organizationId ?? tenantScope ?? null,
    employeeId: input.employeeId,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    grossPayKrw: computed.grossPayKrw,
    sourceRecordCount: computed.recordsCount
  });

  await context.dataAccess.audit.append({
    action: "payroll.calculated",
    entityType: "PayrollRun",
    entityId: run.id,
    organizationId: run.organizationId,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload: {
      periodStart: input.periodStart.toISOString(),
      periodEnd: input.periodEnd.toISOString(),
      employeeId: input.employeeId,
      sourceRecordCount: computed.recordsCount,
      totals: computed.totals,
      grossPayKrw: computed.grossPayKrw
    }
  });
  await getEventPublisher(context).publish({
    name: "payroll.calculated.v1",
    occurredAt: new Date().toISOString(),
    entityType: "PayrollRun",
    entityId: run.id,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload: {
      periodStart: input.periodStart.toISOString(),
      periodEnd: input.periodEnd.toISOString(),
      employeeId: input.employeeId ?? null,
      sourceRecordCount: computed.recordsCount,
      totals: computed.totals,
      grossPayKrw: computed.grossPayKrw
    }
  });

  return {
    run,
    summary: {
      sourceRecordCount: computed.recordsCount,
      totals: computed.totals,
      grossPayKrw: computed.grossPayKrw
    }
  };
}

export async function previewPayrollWithDeductions(
  context: ServiceContext,
  input: PreviewPayrollWithDeductionsInput
): Promise<PreviewPayrollWithDeductionsResult> {
  await requirePayrollPermission(context, Permissions.payrollRunPreview, "preview");
  if (!isPayrollDeductionsEnabled()) {
    throw new ServiceError(409, "payroll_deductions_v1 feature flag is disabled");
  }

  const tenantScope = resolveTenantScope(context.actor);
  const employee = input.employeeId
    ? await requireEmployeeWithinTenant(context.dataAccess, context.actor, input.employeeId)
    : null;

  const computed = await calculatePayrollComputation(context.dataAccess, input, tenantScope);
  const deductionMode = input.deductionMode;
  let withholdingTaxKrw = 0;
  let socialInsuranceKrw = 0;
  let otherDeductionsKrw = 0;
  let profileId: string | null = null;
  let profileVersion: number | null = null;
  const additionalBreakdown: Record<string, unknown> = {};

  if (deductionMode === "manual") {
    withholdingTaxKrw = toKrwInteger(input.deductions.withholdingTaxKrw, "withholdingTaxKrw");
    socialInsuranceKrw = toKrwInteger(input.deductions.socialInsuranceKrw, "socialInsuranceKrw");
    otherDeductionsKrw = toKrwInteger(input.deductions.otherDeductionsKrw, "otherDeductionsKrw");

    const manualAdditional: Record<string, number> = {};
    for (const [name, amount] of Object.entries(input.deductions.breakdown ?? {})) {
      manualAdditional[name] = toKrwInteger(amount, `deductions.breakdown.${name}`);
    }
    Object.assign(additionalBreakdown, manualAdditional);
  } else if (deductionMode === "profile") {
    if (!isPayrollDeductionProfileEnabled()) {
      throw new ServiceError(409, "payroll_deduction_profile_v1 feature flag is disabled");
    }

    const profile = await context.dataAccess.deductionProfiles.findById(input.profileId);
    if (!profile) {
      throw new ServiceError(404, "deduction profile not found");
    }
    ensureTenantMatch(tenantScope, profile.organizationId, "deduction profile not found");
    if (!profile.active) {
      throw new ServiceError(409, "deduction profile is inactive");
    }
    if (profile.mode !== "profile") {
      throw new ServiceError(409, "deduction profile mode is not profile");
    }
    if (
      input.expectedProfileVersion !== undefined &&
      input.expectedProfileVersion !== profile.version
    ) {
      throw new ServiceError(409, "deduction profile version mismatch");
    }

    const withholdingRate = toRateNumber(profile.withholdingRate, "withholdingRate") ?? 0;
    const socialInsuranceRate = toRateNumber(profile.socialInsuranceRate, "socialInsuranceRate") ?? 0;
    const fixedOtherDeductionKrw = toKrwInteger(
      profile.fixedOtherDeductionKrw,
      "fixedOtherDeductionKrw"
    );

    withholdingTaxKrw = toKrwInteger(
      Math.round(computed.grossPayKrw * withholdingRate),
      "withholdingTaxKrw"
    );
    socialInsuranceKrw = toKrwInteger(
      Math.round(computed.grossPayKrw * socialInsuranceRate),
      "socialInsuranceKrw"
    );
    otherDeductionsKrw = fixedOtherDeductionKrw;
    profileId = profile.id;
    profileVersion = profile.version;
    Object.assign(additionalBreakdown, {
      withholdingRate,
      socialInsuranceRate,
      fixedOtherDeductionKrw
    });
  } else {
    if (!isPayrollKrBaselineEnabled()) {
      throw new ServiceError(409, "payroll_kr_baseline_v1 feature flag is disabled");
    }
    const statutoryDeductions = calculateStatutoryKrBaselineDeductionPreview(
      input,
      computed.grossPayKrw
    );
    withholdingTaxKrw = statutoryDeductions.withholdingTaxKrw;
    socialInsuranceKrw = statutoryDeductions.socialInsuranceKrw;
    otherDeductionsKrw = statutoryDeductions.otherDeductionsKrw;
    Object.assign(additionalBreakdown, statutoryDeductions.additionalBreakdown);
  }

  const totalDeductionsKrw = withholdingTaxKrw + socialInsuranceKrw + otherDeductionsKrw;
  const netPayKrw = computed.grossPayKrw - totalDeductionsKrw;
  if (netPayKrw < 0) {
    throw new ServiceError(409, "netPayKrw cannot be negative");
  }

  const deductionBreakdown: Record<string, unknown> = {
    mode: deductionMode,
    withholdingTaxKrw,
    socialInsuranceKrw,
    otherDeductionsKrw,
    ...(profileId && profileVersion
      ? {
          profile: {
            id: profileId,
            version: profileVersion
          }
        }
      : {}),
    ...(Object.keys(additionalBreakdown).length > 0 ? { additional: additionalBreakdown } : {})
  };

  const run = await context.dataAccess.payroll.create({
    organizationId: employee?.organizationId ?? tenantScope ?? null,
    employeeId: input.employeeId,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    grossPayKrw: computed.grossPayKrw,
    withholdingTaxKrw,
    socialInsuranceKrw,
    otherDeductionsKrw,
    totalDeductionsKrw,
    netPayKrw,
    deductionBreakdown,
    deductionProfileId: profileId,
    deductionProfileVersion: profileVersion,
    sourceRecordCount: computed.recordsCount
  });

  await context.dataAccess.audit.append({
    action: "payroll.deductions_calculated",
    entityType: "PayrollRun",
    entityId: run.id,
    organizationId: run.organizationId,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload: {
      periodStart: input.periodStart.toISOString(),
      periodEnd: input.periodEnd.toISOString(),
      employeeId: input.employeeId,
      sourceRecordCount: computed.recordsCount,
      totals: computed.totals,
      grossPayKrw: computed.grossPayKrw,
      deductionMode,
      profileId,
      profileVersion,
      withholdingTaxKrw,
      socialInsuranceKrw,
      otherDeductionsKrw,
      totalDeductionsKrw,
      netPayKrw,
      deductionBreakdown
    }
  });

  await getEventPublisher(context).publish({
    name: "payroll.deductions.calculated.v1",
    occurredAt: new Date().toISOString(),
    entityType: "PayrollRun",
    entityId: run.id,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload: {
      periodStart: input.periodStart.toISOString(),
      periodEnd: input.periodEnd.toISOString(),
      employeeId: input.employeeId ?? null,
      sourceRecordCount: computed.recordsCount,
      totals: computed.totals,
      grossPayKrw: computed.grossPayKrw,
      deductionMode,
      profileId,
      profileVersion,
      withholdingTaxKrw,
      socialInsuranceKrw,
      otherDeductionsKrw,
      totalDeductionsKrw,
      netPayKrw,
      deductionBreakdown
    }
  });

  return {
    run,
    summary: {
      deductionMode,
      profileId,
      profileVersion,
      sourceRecordCount: computed.recordsCount,
      totals: computed.totals,
      grossPayKrw: computed.grossPayKrw,
      withholdingTaxKrw,
      socialInsuranceKrw,
      otherDeductionsKrw,
      totalDeductionsKrw,
      netPayKrw,
      deductionBreakdown
    }
  };
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
  await requirePayrollPermission(context, Permissions.payrollRunConfirm, "confirm");
  if (!isPayrollYearEndEnabled()) {
    throw new ServiceError(409, "payroll_year_end_v1 feature flag is disabled");
  }
  if (!isPayrollYearEndFilingExportEnabled()) {
    throw new ServiceError(409, "payroll_year_end_filing_export_v1 feature flag is disabled");
  }

  const snapshot = await loadYearEndRunSnapshot(context, input.year, input.employeeId);
  const filingGuard = buildYearEndFilingGuard(snapshot);
  if (!filingGuard.canFinalize) {
    throw new ServiceError(409, "year-end filing data export is blocked", {
      blockingReasons: filingGuard.blockingReasons,
      runStates: {
        totalRuns: filingGuard.runStates.totalRuns,
        confirmedRuns: filingGuard.runStates.confirmedRuns,
        previewedRuns: filingGuard.runStates.previewedRuns,
        undistributedRuns: filingGuard.runStates.undistributedRuns,
        pendingReceiptRuns: filingGuard.runStates.pendingReceiptRuns
      }
    });
  }

  const entityId = `${input.year}_${input.employeeId}`;
  const finalizationLogs = await context.dataAccess.audit.list({
    actions: ["payroll.year_end.settlement_finalized"],
    entityType: "PayrollYearEnd",
    entityId,
    limit: 500
  });
  const latestFinalizationLog = finalizationLogs[finalizationLogs.length - 1] ?? null;
  const finalizedPayload = asYearEndFinalizationAuditPayload(latestFinalizationLog?.payload ?? null);
  if (!finalizedPayload || !finalizedPayload.finalized || !finalizedPayload.finalizedAt) {
    throw new ServiceError(409, "year-end settlement must be finalized before filing data export");
  }
  const settledSettlementHash = resolveYearEndSettlementHashFromFinalizationPayload(finalizedPayload);
  const expectedSettlementHash = normalizeYearEndSettlementHash(input.expectedSettlementHash);
  if (expectedSettlementHash && expectedSettlementHash !== settledSettlementHash) {
    throw new ServiceError(409, "year-end settlement hash mismatch", {
      expectedSettlementHash,
      computedSettlementHash: settledSettlementHash
    });
  }

  const records = buildYearEndFilingRecords(snapshot.confirmedRuns);
  const validation = validateYearEndFilingRecords(records, finalizedPayload);
  if (input.validationMode === "strict" && validation.status === "fail") {
    throw new ServiceError(409, "year-end filing export validation failed", {
      issues: validation.issues,
      checks: validation.checks
    });
  }

  const artifact = buildYearEndFilingArtifact(input.format, records, finalizedPayload);
  const exportedAt = new Date().toISOString();
  const payload: ExportPayrollYearEndFilingDataResult["filingData"] = {
    year: input.year,
    employeeId: input.employeeId,
    finalizationId: finalizedPayload.finalizationId,
    settlementHash: settledSettlementHash,
    finalizedAt: finalizedPayload.finalizedAt,
    exportedAt,
    format: input.format,
    validationMode: input.validationMode,
    runStates: finalizedPayload.runStates,
    annualTotalsKrw: finalizedPayload.annualTotalsKrw,
    deductionItemsKrw: finalizedPayload.deductionItemsKrw,
    settlementKrw: finalizedPayload.settlementKrw,
    records,
    csv: input.format === "csv" || input.format === "hometax_csv" ? artifact.content : null,
    artifact,
    validation
  };

  await context.dataAccess.audit.append({
    action: "payroll.year_end.filing_data_exported",
    entityType: "PayrollYearEnd",
    entityId,
    organizationId: snapshot.organizationId,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload
  });
  await getEventPublisher(context).publish({
    name: "payroll.year_end.filing_data.exported.v1",
    occurredAt: exportedAt,
    entityType: "PayrollYearEnd",
    entityId,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload
  });

  return {
    filingData: payload
  };
}

export async function submitPayrollYearEndFilingPackage(
  context: ServiceContext,
  input: SubmitPayrollYearEndFilingPackageInput
): Promise<SubmitPayrollYearEndFilingPackageResult> {
  await requirePayrollPermission(context, Permissions.payrollRunConfirm, "confirm");
  if (!isPayrollYearEndEnabled()) {
    throw new ServiceError(409, "payroll_year_end_v1 feature flag is disabled");
  }
  if (!isPayrollYearEndFilingExportEnabled()) {
    throw new ServiceError(409, "payroll_year_end_filing_export_v1 feature flag is disabled");
  }
  if (!isPayrollYearEndFilingSubmissionEnabled()) {
    throw new ServiceError(409, "payroll_year_end_filing_submission_v1 feature flag is disabled");
  }
  await loadYearEndRunSnapshot(context, input.year, input.employeeId);
  const submissions = await listYearEndFilingSubmissionSummaries(context, {
    year: input.year,
    employeeId: input.employeeId
  });
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
  if (!isPayrollYearEndEnabled()) {
    throw new ServiceError(409, "payroll_year_end_v1 feature flag is disabled");
  }
  if (!isPayrollYearEndFilingExportEnabled()) {
    throw new ServiceError(409, "payroll_year_end_filing_export_v1 feature flag is disabled");
  }
  if (!isPayrollYearEndFilingSubmissionEnabled()) {
    throw new ServiceError(409, "payroll_year_end_filing_submission_v1 feature flag is disabled");
  }

  await loadYearEndRunSnapshot(context, input.year, input.employeeId);
  const submissions = await listYearEndFilingSubmissionSummaries(context, {
    year: input.year,
    employeeId: input.employeeId
  });
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

export async function listPayrollYearEndFilingAckCatalog(
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

export async function listPayrollYearEndFilingSubmissionTimeline(
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

export async function addPayrollYearEndFilingEvidenceNote(
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
