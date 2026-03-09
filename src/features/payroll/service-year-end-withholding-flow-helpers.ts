import { createHash } from "node:crypto";

import { resolveActorPermissions } from "@/lib/permissions";
import { Permissions } from "@/lib/rbac";
import {
  asYearEndFinalizationAuditPayload,
  asYearEndWithholdingReceiptSummaryPayload,
  buildYearEndWithholdingReceiptDocumentArtifact,
  buildYearEndWithholdingReceiptGuard,
  buildYearEndWithholdingReceiptSummary,
  resolveYearEndSettlementHashFromFinalizationPayload
} from "@/features/payroll/service-year-end-adapter-helpers";
import {
  getYearPeriodInSeoul,
  isPayrollYearEndEnabled
} from "@/features/payroll/service-runtime-helpers";
import type {
  GetPayrollYearEndFinalizedSettlementInput,
  GetPayrollYearEndWithholdingReceiptDocumentInput,
  IssuePayrollYearEndWithholdingReceiptInput
} from "@/features/payroll/service-input-types";
import {
  aggregatePayrollTotalsKrw
} from "@/features/payroll/service-year-end-run-snapshot-helpers";
import type {
  GetPayrollYearEndFinalizedSettlementResult,
  GetPayrollYearEndWithholdingReceiptDocumentResult,
  IssuePayrollYearEndWithholdingReceiptResult,
  PayrollYearEndWithholdingReceiptSummary,
  YearEndFilingGuardRunStates
} from "@/features/payroll/service-output-types";
import {
  type ServiceContext,
  getEventPublisher
} from "@/features/payroll/service-context-helpers";
import { loadPayrollRuntimeFeatureFlags } from "@/features/payroll/service-feature-flags";
import { requireEmployeeWithinTenant, resolveTenantScope } from "@/features/shared/tenant-scope";
import { ServiceError } from "@/features/shared/service-error";

type YearEndReadPermissionState = {
  actor: NonNullable<ServiceContext["actor"]>;
  canManage: boolean;
  canListAny: boolean;
  canListOwn: boolean;
};

async function resolveYearEndReadPermissionState(
  context: ServiceContext,
  employeeId: string
): Promise<YearEndReadPermissionState> {
  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }

  await requireEmployeeWithinTenant(context.dataAccess, actor, employeeId);
  const permissions = await resolveActorPermissions({ actor, dataAccess: context.dataAccess });
  const canManage = permissions.has(Permissions.payrollRunConfirm);
  const canListAny = permissions.has(Permissions.payrollRunList);
  const canListOwn = permissions.has(Permissions.payrollRunListOwn);

  return { actor, canManage, canListAny, canListOwn };
}

export async function getPayrollYearEndWithholdingReceiptDocumentFromHelper(
  context: ServiceContext,
  input: GetPayrollYearEndWithholdingReceiptDocumentInput
): Promise<GetPayrollYearEndWithholdingReceiptDocumentResult> {
  const featureFlags = await loadPayrollRuntimeFeatureFlags(context);
  if (!isPayrollYearEndEnabled(featureFlags)) {
    throw new ServiceError(409, "payroll_year_end_v1 feature flag is disabled");
  }

  const permissionState = await resolveYearEndReadPermissionState(context, input.employeeId);
  if (!permissionState.canManage && !permissionState.canListAny && !permissionState.canListOwn) {
    throw new ServiceError(403, `payroll list requires ${Permissions.payrollRunList} permission`);
  }
  if (
    !permissionState.canManage &&
    !permissionState.canListAny &&
    permissionState.actor.id !== input.employeeId
  ) {
    throw new ServiceError(403, "employees can only read their own withholding receipt document");
  }

  const entityId = `${input.year}_${input.employeeId}`;
  const issuedLogs = await context.dataAccess.audit.list({
    actions: ["payroll.year_end.withholding_receipt_issued"],
    entityType: "PayrollYearEnd",
    entityId,
    limit: 200
  });
  const latestIssuedLog = issuedLogs[issuedLogs.length - 1] ?? null;
  const receipt = asYearEndWithholdingReceiptSummaryPayload(latestIssuedLog?.payload ?? null);
  if (!receipt || !receipt.issued || !receipt.issuedAt) {
    throw new ServiceError(404, "issued withholding receipt not found");
  }

  const artifact = buildYearEndWithholdingReceiptDocumentArtifact(receipt, input.format);
  const generatedAt = new Date().toISOString();
  const contentSha256 = createHash("sha256").update(artifact.content).digest("hex");

  return {
    document: {
      year: input.year,
      employeeId: input.employeeId,
      receiptNumber: receipt.receiptNumber,
      issuedAt: receipt.issuedAt,
      issuerName: receipt.issuerName,
      format: input.format,
      fileName: artifact.fileName,
      contentType: artifact.contentType,
      contentSha256,
      generatedAt,
      receipt,
      content: artifact.content
    }
  };
}

export async function getPayrollYearEndFinalizedSettlementFromHelper(
  context: ServiceContext,
  input: GetPayrollYearEndFinalizedSettlementInput
): Promise<GetPayrollYearEndFinalizedSettlementResult> {
  const featureFlags = await loadPayrollRuntimeFeatureFlags(context);
  if (!isPayrollYearEndEnabled(featureFlags)) {
    throw new ServiceError(409, "payroll_year_end_v1 feature flag is disabled");
  }

  const permissionState = await resolveYearEndReadPermissionState(context, input.employeeId);
  if (!permissionState.canManage && !permissionState.canListAny && !permissionState.canListOwn) {
    throw new ServiceError(403, `payroll list requires ${Permissions.payrollRunList} permission`);
  }
  if (
    !permissionState.canManage &&
    !permissionState.canListAny &&
    permissionState.actor.id !== input.employeeId
  ) {
    throw new ServiceError(403, "employees can only read their own finalized year-end settlement");
  }

  const entityId = `${input.year}_${input.employeeId}`;
  const finalizationLogs = await context.dataAccess.audit.list({
    actions: ["payroll.year_end.settlement_finalized"],
    entityType: "PayrollYearEnd",
    entityId,
    limit: 200
  });
  const latestFinalizationLog = finalizationLogs[finalizationLogs.length - 1] ?? null;
  const finalizationPayload = asYearEndFinalizationAuditPayload(latestFinalizationLog?.payload ?? null);
  if (
    !finalizationPayload ||
    !finalizationPayload.finalizedAt ||
    !finalizationPayload.finalized
  ) {
    throw new ServiceError(404, "finalized year-end settlement not found");
  }

  const settlementHash = resolveYearEndSettlementHashFromFinalizationPayload(finalizationPayload);

  return {
    settlement: {
      year: finalizationPayload.year,
      employeeId: finalizationPayload.employeeId,
      finalizationId: finalizationPayload.finalizationId,
      finalizedAt: finalizationPayload.finalizedAt,
      settlementHash,
      annualTotalsKrw: finalizationPayload.annualTotalsKrw,
      settlementKrw: finalizationPayload.settlementKrw,
      deductionEligibility: finalizationPayload.deductionEligibility,
      deductionItemsKrw: finalizationPayload.deductionItemsKrw,
      runStates: finalizationPayload.runStates
    }
  };
}

export async function issuePayrollYearEndWithholdingReceiptFromHelper(
  context: ServiceContext,
  input: IssuePayrollYearEndWithholdingReceiptInput
): Promise<IssuePayrollYearEndWithholdingReceiptResult> {
  const featureFlags = await loadPayrollRuntimeFeatureFlags(context);
  if (!isPayrollYearEndEnabled(featureFlags)) {
    throw new ServiceError(409, "payroll_year_end_v1 feature flag is disabled");
  }

  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }

  const employee = await requireEmployeeWithinTenant(context.dataAccess, actor, input.employeeId);
  const permissions = await resolveActorPermissions({ actor, dataAccess: context.dataAccess });
  const canManage = permissions.has(Permissions.payrollRunConfirm);
  const canListAny = permissions.has(Permissions.payrollRunList);
  const canListOwn = permissions.has(Permissions.payrollRunListOwn);

  if (input.issue) {
    if (!canManage) {
      throw new ServiceError(403, `payroll issue requires ${Permissions.payrollRunConfirm} permission`);
    }
  } else {
    if (!canManage && !canListAny && !canListOwn) {
      throw new ServiceError(403, `payroll list requires ${Permissions.payrollRunList} permission`);
    }
    if (!canManage && !canListAny && actor.id !== input.employeeId) {
      throw new ServiceError(403, "employees can only preview their own withholding receipt");
    }
  }

  const { periodStart, periodEnd } = getYearPeriodInSeoul(input.year);
  const tenantScope = resolveTenantScope(actor);
  const runs = await context.dataAccess.payroll.listInPeriod({
    periodStart,
    periodEnd,
    organizationId: tenantScope ?? undefined,
    employeeId: input.employeeId
  });

  const confirmedRuns = runs.filter((run) => run.state === "CONFIRMED");
  const previewedRuns = runs.filter((run) => run.state !== "CONFIRMED");
  const totalsKrw = aggregatePayrollTotalsKrw(confirmedRuns);
  const withholdingReceiptGuard = buildYearEndWithholdingReceiptGuard({
    runs,
    confirmedRuns,
    previewedRuns
  }) as {
    runStates: YearEndFilingGuardRunStates;
    blockingReasons: string[];
    canIssue: boolean;
  };

  if (input.issue && !withholdingReceiptGuard.canIssue) {
    throw new ServiceError(409, "withholding receipt cannot be issued", {
      blockingReasons: withholdingReceiptGuard.blockingReasons,
      runStates: withholdingReceiptGuard.runStates
    });
  }

  const receiptNumber = `WR-${input.year}-${input.employeeId}`;
  const issuerName = input.issuerName?.trim() ? input.issuerName.trim() : actor.role;
  const issuedAt = input.issue ? new Date().toISOString() : null;
  const payload = buildYearEndWithholdingReceiptSummary({
    year: input.year,
    employeeId: input.employeeId,
    periodStart: periodStart.toISOString(),
    periodEnd: periodEnd.toISOString(),
    issue: input.issue,
    receiptNumber,
    issuerName,
    issuedAt,
    runStates: withholdingReceiptGuard.runStates,
    annualTotalsKrw: totalsKrw,
    blockingReasons: withholdingReceiptGuard.blockingReasons
  }) as PayrollYearEndWithholdingReceiptSummary;

  const entityId = `${input.year}_${input.employeeId}`;
  if (input.issue) {
    await context.dataAccess.audit.append({
      action: "payroll.year_end.withholding_receipt_issued",
      entityType: "PayrollYearEnd",
      entityId,
      organizationId: employee.organizationId,
      actorRole: actor.role,
      actorId: actor.id,
      payload
    });
    await getEventPublisher(context).publish({
      name: "payroll.year_end.withholding_receipt.issued.v1",
      occurredAt: new Date().toISOString(),
      entityType: "PayrollYearEnd",
      entityId,
      actorRole: actor.role,
      actorId: actor.id,
      payload
    });
  } else {
    await context.dataAccess.audit.append({
      action: "payroll.year_end.withholding_receipt_previewed",
      entityType: "PayrollYearEnd",
      entityId,
      organizationId: employee.organizationId,
      actorRole: actor.role,
      actorId: actor.id,
      payload
    });
    await getEventPublisher(context).publish({
      name: "payroll.year_end.withholding_receipt.previewed.v1",
      occurredAt: new Date().toISOString(),
      entityType: "PayrollYearEnd",
      entityId,
      actorRole: actor.role,
      actorId: actor.id,
      payload
    });
  }

  return {
    receipt: payload
  };
}
