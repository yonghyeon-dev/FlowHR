import { Permissions } from "@/lib/rbac";
import { ServiceError } from "@/features/shared/service-error";
import {
  applyYearEndDeductionCaps,
  asYearEndFinalizationAuditPayload,
  buildYearEndFilingGuard,
  buildYearEndInputVectorHash,
  buildYearEndSettlementHash,
  calculateYearEndSettlementKrw,
  collectYearEndDeductionEligibilityBlockingReasons,
  normalizeYearEndDeductionEligibility,
  normalizeYearEndDeductionItems,
  normalizeYearEndTaxCreditItems,
  resolveYearEndSettlementHashFromFinalizationPayload
} from "@/features/payroll/service-year-end-adapter-helpers";
import {
  isPayrollYearEndDeductionInputEnabled,
  isPayrollYearEndEnabled,
  isPayrollYearEndFilingExportEnabled,
  toRateNumber
} from "@/features/payroll/service-runtime-helpers";
import type {
  FinalizePayrollYearEndSettlementInput,
  PreviewPayrollYearEndSettlementInput,
  RecalculatePayrollYearEndSettlementInput
} from "@/features/payroll/service-input-types";
import type {
  FinalizePayrollYearEndSettlementResult,
  PreviewPayrollYearEndSettlementResult,
  RecalculatePayrollYearEndSettlementResult,
  YearEndDeductionSummaryKrw,
  YearEndSettlementSummary
} from "@/features/payroll/service-output-types";
import {
  loadYearEndRunSnapshot
} from "@/features/payroll/service-year-end-run-snapshot-helpers";
import {
  type ServiceContext,
  getEventPublisher,
  requirePayrollPermission
} from "@/features/payroll/service-context-helpers";
import { loadPayrollRuntimeFeatureFlags } from "@/features/payroll/service-feature-flags";

export async function previewPayrollYearEndSettlementFromHelper(
  context: ServiceContext,
  input: PreviewPayrollYearEndSettlementInput
): Promise<PreviewPayrollYearEndSettlementResult> {
  await requirePayrollPermission(context, Permissions.payrollRunConfirm, "confirm");
  const featureFlags = await loadPayrollRuntimeFeatureFlags(context);
  if (!isPayrollYearEndEnabled(featureFlags)) {
    throw new ServiceError(409, "payroll_year_end_v1 feature flag is disabled");
  }

  const snapshot = await loadYearEndRunSnapshot(context, input.year, input.employeeId);
  const settled = calculateYearEndSettlementKrw(snapshot.totalsKrw, input, 0);
  const normalizedTaxCredits = normalizeYearEndTaxCreditItems(input);
  const inputVectorHash = buildYearEndInputVectorHash({
    year: input.year,
    employeeId: input.employeeId,
    nonTaxableAnnualIncomeKrw: settled.settlementKrw.nonTaxableAnnualIncomeKrw,
    annualIncomeTaxRate: toRateNumber(input.annualIncomeTaxRate, "annualIncomeTaxRate") ?? 0,
    localIncomeTaxRate: toRateNumber(input.localIncomeTaxRate, "localIncomeTaxRate") ?? 0,
    taxCredits: normalizedTaxCredits,
    deductionItems: null,
    deductionEligibility: null
  });

  const payload: YearEndSettlementSummary = {
    year: input.year,
    employeeId: input.employeeId,
    periodStart: snapshot.periodStart.toISOString(),
    periodEnd: snapshot.periodEnd.toISOString(),
    inputVectorHash,
    runStates: {
      totalRuns: snapshot.runs.length,
      confirmedRuns: snapshot.confirmedRuns.length,
      previewedRuns: snapshot.previewedRuns.length,
      previewedRunIds: snapshot.previewedRuns.map((run) => run.id)
    },
    annualTotalsKrw: snapshot.totalsKrw,
    settlementKrw: settled.settlementKrw
  };

  const entityId = `${input.year}_${input.employeeId}`;
  await context.dataAccess.audit.append({
    action: "payroll.year_end.settlement_previewed",
    entityType: "PayrollYearEnd",
    entityId,
    organizationId: snapshot.organizationId,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload
  });
  await getEventPublisher(context).publish({
    name: "payroll.year_end.settlement.previewed.v1",
    occurredAt: new Date().toISOString(),
    entityType: "PayrollYearEnd",
    entityId,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload
  });

  return {
    summary: payload
  };
}

export async function recalculatePayrollYearEndSettlementFromHelper(
  context: ServiceContext,
  input: RecalculatePayrollYearEndSettlementInput
): Promise<RecalculatePayrollYearEndSettlementResult> {
  await requirePayrollPermission(context, Permissions.payrollRunConfirm, "confirm");
  const featureFlags = await loadPayrollRuntimeFeatureFlags(context);
  if (!isPayrollYearEndEnabled(featureFlags)) {
    throw new ServiceError(409, "payroll_year_end_v1 feature flag is disabled");
  }
  if (!isPayrollYearEndDeductionInputEnabled(featureFlags)) {
    throw new ServiceError(409, "payroll_year_end_deduction_input_v1 feature flag is disabled");
  }

  const snapshot = await loadYearEndRunSnapshot(context, input.year, input.employeeId);
  const normalizedDeductionItems = normalizeYearEndDeductionItems(input.deductionItems);
  const normalizedDeductionEligibility = normalizeYearEndDeductionEligibility(input.deductionEligibility);
  const normalizedTaxCredits = normalizeYearEndTaxCreditItems(input);
  const deductionEligibilityBlockingReasons = collectYearEndDeductionEligibilityBlockingReasons(
    normalizedDeductionItems,
    normalizedDeductionEligibility
  );
  if (deductionEligibilityBlockingReasons.length > 0) {
    throw new ServiceError(409, "year-end deduction eligibility validation failed", {
      deductionEligibility: normalizedDeductionEligibility,
      blockingReasons: deductionEligibilityBlockingReasons
    });
  }
  const deductionCapApplied = applyYearEndDeductionCaps(normalizedDeductionItems);
  const baselineSettled = calculateYearEndSettlementKrw(snapshot.totalsKrw, input, 0);
  const recalculatedSettled = calculateYearEndSettlementKrw(
    snapshot.totalsKrw,
    input,
    deductionCapApplied.cappedIncomeDeductionKrw
  );
  const inputVectorHash = buildYearEndInputVectorHash({
    year: input.year,
    employeeId: input.employeeId,
    nonTaxableAnnualIncomeKrw: recalculatedSettled.settlementKrw.nonTaxableAnnualIncomeKrw,
    annualIncomeTaxRate: toRateNumber(input.annualIncomeTaxRate, "annualIncomeTaxRate") ?? 0,
    localIncomeTaxRate: toRateNumber(input.localIncomeTaxRate, "localIncomeTaxRate") ?? 0,
    taxCredits: normalizedTaxCredits,
    deductionItems: normalizedDeductionItems,
    deductionEligibility: normalizedDeductionEligibility
  });

  const payload = {
    year: input.year,
    employeeId: input.employeeId,
    periodStart: snapshot.periodStart.toISOString(),
    periodEnd: snapshot.periodEnd.toISOString(),
    inputVectorHash,
    runStates: {
      totalRuns: snapshot.runs.length,
      confirmedRuns: snapshot.confirmedRuns.length,
      previewedRuns: snapshot.previewedRuns.length,
      previewedRunIds: snapshot.previewedRuns.map((run) => run.id)
    },
    annualTotalsKrw: snapshot.totalsKrw,
    deductionEligibility: normalizedDeductionEligibility,
    deductionEligibilityBlockingReasons,
    deductionItemsKrw: {
      ...normalizedDeductionItems,
      totalIncomeDeductionKrw: deductionCapApplied.totalIncomeDeductionKrw,
      cappedIncomeDeductionKrw: deductionCapApplied.cappedIncomeDeductionKrw,
      appliedIncomeDeductionKrw: recalculatedSettled.appliedIncomeDeductionKrw,
      taxableAnnualIncomeBeforeDeductionKrw: recalculatedSettled.taxableAnnualIncomeBeforeDeductionKrw,
      taxableAnnualIncomeAfterDeductionKrw: recalculatedSettled.settlementKrw.taxableAnnualIncomeKrw,
      capRulesKrw: deductionCapApplied.capRulesKrw,
      capAppliedByItemKrw: deductionCapApplied.capAppliedByItemKrw
    },
    baselineSettlementKrw: baselineSettled.settlementKrw,
    recalculatedSettlementKrw: recalculatedSettled.settlementKrw,
    deltaKrw: {
      annualTaxLiabilityDeltaKrw:
        recalculatedSettled.settlementKrw.annualTaxLiabilityKrw -
        baselineSettled.settlementKrw.annualTaxLiabilityKrw,
      withholdingDeltaChangeKrw:
        recalculatedSettled.settlementKrw.withholdingDeltaKrw -
        baselineSettled.settlementKrw.withholdingDeltaKrw,
      taxableIncomeReductionKrw:
        baselineSettled.settlementKrw.taxableAnnualIncomeKrw -
        recalculatedSettled.settlementKrw.taxableAnnualIncomeKrw
    }
  };

  const entityId = `${input.year}_${input.employeeId}`;
  await context.dataAccess.audit.append({
    action: "payroll.year_end.settlement_recalculated",
    entityType: "PayrollYearEnd",
    entityId,
    organizationId: snapshot.organizationId,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload
  });
  await getEventPublisher(context).publish({
    name: "payroll.year_end.settlement.recalculated.v1",
    occurredAt: new Date().toISOString(),
    entityType: "PayrollYearEnd",
    entityId,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload
  });

  return {
    recalculation: payload
  };
}

export async function finalizePayrollYearEndSettlementFromHelper(
  context: ServiceContext,
  input: FinalizePayrollYearEndSettlementInput
): Promise<FinalizePayrollYearEndSettlementResult> {
  await requirePayrollPermission(context, Permissions.payrollRunConfirm, "confirm");
  const featureFlags = await loadPayrollRuntimeFeatureFlags(context);
  if (!isPayrollYearEndEnabled(featureFlags)) {
    throw new ServiceError(409, "payroll_year_end_v1 feature flag is disabled");
  }
  if (!isPayrollYearEndDeductionInputEnabled(featureFlags)) {
    throw new ServiceError(409, "payroll_year_end_deduction_input_v1 feature flag is disabled");
  }
  if (!isPayrollYearEndFilingExportEnabled(featureFlags)) {
    throw new ServiceError(409, "payroll_year_end_filing_export_v1 feature flag is disabled");
  }

  const snapshot = await loadYearEndRunSnapshot(context, input.year, input.employeeId);
  const filingGuard = buildYearEndFilingGuard(snapshot);
  if (input.apply && !filingGuard.canFinalize) {
    throw new ServiceError(409, "year-end settlement cannot be finalized", {
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

  const normalizedDeductionItems = normalizeYearEndDeductionItems(input.deductionItems);
  const normalizedDeductionEligibility = normalizeYearEndDeductionEligibility(input.deductionEligibility);
  const normalizedTaxCredits = normalizeYearEndTaxCreditItems(input);
  const deductionEligibilityBlockingReasons = collectYearEndDeductionEligibilityBlockingReasons(
    normalizedDeductionItems,
    normalizedDeductionEligibility
  );
  if (deductionEligibilityBlockingReasons.length > 0) {
    throw new ServiceError(409, "year-end deduction eligibility validation failed", {
      deductionEligibility: normalizedDeductionEligibility,
      blockingReasons: deductionEligibilityBlockingReasons
    });
  }
  const deductionCapApplied = applyYearEndDeductionCaps(normalizedDeductionItems);
  const settled = calculateYearEndSettlementKrw(
    snapshot.totalsKrw,
    input,
    deductionCapApplied.cappedIncomeDeductionKrw
  );
  const deductionItemsKrw: YearEndDeductionSummaryKrw = {
    ...normalizedDeductionItems,
    totalIncomeDeductionKrw: deductionCapApplied.totalIncomeDeductionKrw,
    cappedIncomeDeductionKrw: deductionCapApplied.cappedIncomeDeductionKrw,
    appliedIncomeDeductionKrw: settled.appliedIncomeDeductionKrw,
    taxableAnnualIncomeBeforeDeductionKrw: settled.taxableAnnualIncomeBeforeDeductionKrw,
    taxableAnnualIncomeAfterDeductionKrw: settled.settlementKrw.taxableAnnualIncomeKrw,
    capRulesKrw: deductionCapApplied.capRulesKrw,
    capAppliedByItemKrw: deductionCapApplied.capAppliedByItemKrw
  };
  const inputVectorHash = buildYearEndInputVectorHash({
    year: input.year,
    employeeId: input.employeeId,
    nonTaxableAnnualIncomeKrw: settled.settlementKrw.nonTaxableAnnualIncomeKrw,
    annualIncomeTaxRate: toRateNumber(input.annualIncomeTaxRate, "annualIncomeTaxRate") ?? 0,
    localIncomeTaxRate: toRateNumber(input.localIncomeTaxRate, "localIncomeTaxRate") ?? 0,
    taxCredits: normalizedTaxCredits,
    deductionItems: normalizedDeductionItems,
    deductionEligibility: normalizedDeductionEligibility
  });
  const settlementHash = buildYearEndSettlementHash({
    year: input.year,
    employeeId: input.employeeId,
    runStates: filingGuard.runStates,
    annualTotalsKrw: snapshot.totalsKrw,
    deductionEligibility: normalizedDeductionEligibility,
    deductionItemsKrw,
    settlementKrw: settled.settlementKrw
  });
  const expectedSettlementHash = input.expectedSettlementHash?.trim().toLowerCase();
  if (
    input.apply &&
    typeof expectedSettlementHash === "string" &&
    expectedSettlementHash.length > 0 &&
    expectedSettlementHash !== settlementHash
  ) {
    throw new ServiceError(409, "year-end settlement hash mismatch", {
      expectedSettlementHash,
      computedSettlementHash: settlementHash
    });
  }
  const entityId = `${input.year}_${input.employeeId}`;
  if (input.apply) {
    const finalizationLogs = await context.dataAccess.audit.list({
      actions: ["payroll.year_end.settlement_finalized"],
      entityType: "PayrollYearEnd",
      entityId,
      limit: 200
    });
    const latestFinalizationLog = finalizationLogs[finalizationLogs.length - 1] ?? null;
    const latestFinalizationPayload = asYearEndFinalizationAuditPayload(latestFinalizationLog?.payload ?? null);
    if (latestFinalizationPayload?.finalized && latestFinalizationPayload.finalizedAt) {
      const latestSettlementHash = resolveYearEndSettlementHashFromFinalizationPayload(
        latestFinalizationPayload
      );
      if (latestSettlementHash === settlementHash) {
        throw new ServiceError(409, "year-end settlement already finalized for same hash", {
          settlementHash,
          latestFinalizationId: latestFinalizationPayload.finalizationId,
          latestFinalizedAt: latestFinalizationPayload.finalizedAt
        });
      }
    }
  }
  const finalizationId = `YEF-${input.year}-${input.employeeId}`;
  const finalizedAt = input.apply ? new Date().toISOString() : null;
  const finalizedByNote = input.finalizedByNote?.trim() ? input.finalizedByNote.trim() : null;
  const payload: FinalizePayrollYearEndSettlementResult["settlement"] = {
    year: input.year,
    employeeId: input.employeeId,
    periodStart: snapshot.periodStart.toISOString(),
    periodEnd: snapshot.periodEnd.toISOString(),
    apply: input.apply,
    canFinalize: filingGuard.canFinalize,
    finalized: input.apply,
    finalizationId,
    finalizedAt,
    finalizedByNote,
    inputVectorHash,
    runStates: filingGuard.runStates,
    annualTotalsKrw: snapshot.totalsKrw,
    deductionEligibility: normalizedDeductionEligibility,
    deductionEligibilityBlockingReasons,
    deductionItemsKrw,
    settlementKrw: settled.settlementKrw,
    settlementHash,
    blockingReasons: filingGuard.blockingReasons
  };

  if (input.apply) {
    await context.dataAccess.audit.append({
      action: "payroll.year_end.settlement_finalized",
      entityType: "PayrollYearEnd",
      entityId,
      organizationId: snapshot.organizationId,
      actorRole: context.actor!.role,
      actorId: context.actor!.id,
      payload
    });
    await getEventPublisher(context).publish({
      name: "payroll.year_end.settlement.finalized.v1",
      occurredAt: new Date().toISOString(),
      entityType: "PayrollYearEnd",
      entityId,
      actorRole: context.actor!.role,
      actorId: context.actor!.id,
      payload
    });
  } else {
    await context.dataAccess.audit.append({
      action: "payroll.year_end.settlement_finalize_previewed",
      entityType: "PayrollYearEnd",
      entityId,
      organizationId: snapshot.organizationId,
      actorRole: context.actor!.role,
      actorId: context.actor!.id,
      payload
    });
    await getEventPublisher(context).publish({
      name: "payroll.year_end.settlement.finalize_previewed.v1",
      occurredAt: new Date().toISOString(),
      entityType: "PayrollYearEnd",
      entityId,
      actorRole: context.actor!.role,
      actorId: context.actor!.id,
      payload
    });
  }

  return {
    settlement: payload
  };
}
