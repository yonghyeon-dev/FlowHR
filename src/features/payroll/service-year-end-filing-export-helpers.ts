import { Permissions } from "@/lib/rbac";
import { ServiceError } from "@/features/shared/service-error";
import {
  asYearEndFinalizationAuditPayload,
  buildYearEndFilingArtifact,
  buildYearEndFilingGuard,
  buildYearEndFilingRecords,
  normalizeYearEndSettlementHash,
  resolveYearEndSettlementHashFromFinalizationPayload,
  validateYearEndFilingRecords
} from "@/features/payroll/service-year-end-adapter-helpers";
import {
  isPayrollYearEndEnabled,
  isPayrollYearEndFilingExportEnabled
} from "@/features/payroll/service-runtime-helpers";
import type { ExportPayrollYearEndFilingDataInput } from "@/features/payroll/service-input-types";
import type { ExportPayrollYearEndFilingDataResult } from "@/features/payroll/service-output-types";
import { loadYearEndRunSnapshot } from "@/features/payroll/service-year-end-run-snapshot-helpers";
import {
  type ServiceContext,
  getEventPublisher,
  requirePayrollPermission
} from "@/features/payroll/service-context-helpers";
import { loadPayrollRuntimeFeatureFlags } from "@/features/payroll/service-feature-flags";

export async function exportPayrollYearEndFilingDataFromHelper(
  context: ServiceContext,
  input: ExportPayrollYearEndFilingDataInput
): Promise<ExportPayrollYearEndFilingDataResult> {
  await requirePayrollPermission(context, Permissions.payrollRunConfirm, "confirm");
  const featureFlags = await loadPayrollRuntimeFeatureFlags(context);
  if (!isPayrollYearEndEnabled(featureFlags)) {
    throw new ServiceError(409, "payroll_year_end_v1 feature flag is disabled");
  }
  if (!isPayrollYearEndFilingExportEnabled(featureFlags)) {
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
