import { resolveActorPermissions } from "@/lib/permissions";
import { Permissions } from "@/lib/rbac";
import {
  ensureTenantMatch,
  requireEmployeeWithinTenant,
  resolveTenantScope
} from "@/features/shared/tenant-scope";
import { ServiceError } from "@/features/shared/service-error";
import {
  ensureValidPeriod,
  isPayrollClosePeriodEnabled,
  isPayrollPayslipDeliveryEnabled,
  toKrwInteger
} from "@/features/payroll/service-runtime-helpers";
import {
  aggregatePayrollTotalsKrw
} from "@/features/payroll/service-year-end-run-snapshot-helpers";
import type {
  AcknowledgePayrollPayslipReceiptInput,
  ClosePayrollPeriodInput,
  DistributePayrollPayslipsInput
} from "@/features/payroll/service-input-types";
import type {
  AcknowledgePayrollPayslipReceiptResult,
  ClosePayrollPeriodResult,
  DistributePayrollPayslipsResult
} from "@/features/payroll/service-output-types";
import {
  type ServiceContext,
  getEventPublisher,
  requirePayrollPermission
} from "@/features/payroll/service-context-helpers";

export async function closePayrollPeriodFromHelper(
  context: ServiceContext,
  input: ClosePayrollPeriodInput
): Promise<ClosePayrollPeriodResult> {
  await requirePayrollPermission(context, Permissions.payrollRunConfirm, "confirm");
  if (!isPayrollClosePeriodEnabled()) {
    throw new ServiceError(409, "payroll_close_period_v1 feature flag is disabled");
  }

  ensureValidPeriod(input.periodStart, input.periodEnd);
  const tenantScope = resolveTenantScope(context.actor);
  const runs = await context.dataAccess.payroll.listInPeriod({
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    organizationId: tenantScope ?? undefined
  });

  const confirmedRuns = runs.filter((run) => run.state === "CONFIRMED");
  const blockingRuns = runs.filter((run) => run.state !== "CONFIRMED");
  const blockingRunIds = blockingRuns.map((run) => run.id);
  const blockingReasons: string[] = [];
  if (runs.length === 0) {
    blockingReasons.push("no payroll runs found in selected period");
  }
  if (blockingRunIds.length > 0) {
    blockingReasons.push("all payroll runs must be confirmed before period close");
  }
  const canClose = blockingReasons.length === 0;

  const totalsKrw = aggregatePayrollTotalsKrw(confirmedRuns);

  const priorPaidWithholdingTaxKrw = toKrwInteger(
    input.settlement?.priorPaidWithholdingTaxKrw ?? 0,
    "settlement.priorPaidWithholdingTaxKrw"
  );
  const priorPaidSocialInsuranceKrw = toKrwInteger(
    input.settlement?.priorPaidSocialInsuranceKrw ?? 0,
    "settlement.priorPaidSocialInsuranceKrw"
  );
  const priorPaidNetPayKrw = toKrwInteger(
    input.settlement?.priorPaidNetPayKrw ?? 0,
    "settlement.priorPaidNetPayKrw"
  );

  const withholdingTaxDeltaKrw = totalsKrw.withholdingTaxKrw - priorPaidWithholdingTaxKrw;
  const socialInsuranceDeltaKrw = totalsKrw.socialInsuranceKrw - priorPaidSocialInsuranceKrw;
  const netPayDeltaKrw = totalsKrw.netPayKrw - priorPaidNetPayKrw;
  const remittanceDeltaKrw = withholdingTaxDeltaKrw + socialInsuranceDeltaKrw;

  const organizationId = tenantScope ?? confirmedRuns[0]?.organizationId ?? null;
  const entityId = `${input.periodStart.toISOString()}_${input.periodEnd.toISOString()}`;
  const commonPayload = {
    periodStart: input.periodStart.toISOString(),
    periodEnd: input.periodEnd.toISOString(),
    runStates: {
      totalRuns: runs.length,
      confirmedRuns: confirmedRuns.length,
      previewedRuns: blockingRunIds.length,
      blockingRunIds,
      blockingReasons
    },
    totalsKrw,
    settlementKrw: {
      priorPaidWithholdingTaxKrw,
      priorPaidSocialInsuranceKrw,
      priorPaidNetPayKrw,
      withholdingTaxDeltaKrw,
      socialInsuranceDeltaKrw,
      netPayDeltaKrw,
      remittanceDeltaKrw
    }
  };

  if (input.apply && !canClose) {
    throw new ServiceError(409, "payroll period cannot be closed", commonPayload.runStates);
  }

  if (input.apply) {
    await context.dataAccess.audit.append({
      action: "payroll.period_closed",
      entityType: "PayrollPeriod",
      entityId,
      organizationId,
      actorRole: context.actor!.role,
      actorId: context.actor!.id,
      payload: commonPayload
    });
    await getEventPublisher(context).publish({
      name: "payroll.period.closed.v1",
      occurredAt: new Date().toISOString(),
      entityType: "PayrollPeriod",
      entityId,
      actorRole: context.actor!.role,
      actorId: context.actor!.id,
      payload: commonPayload
    });
  } else {
    await context.dataAccess.audit.append({
      action: "payroll.period_close_previewed",
      entityType: "PayrollPeriod",
      entityId,
      organizationId,
      actorRole: context.actor!.role,
      actorId: context.actor!.id,
      payload: commonPayload
    });
    await getEventPublisher(context).publish({
      name: "payroll.period.close_previewed.v1",
      occurredAt: new Date().toISOString(),
      entityType: "PayrollPeriod",
      entityId,
      actorRole: context.actor!.role,
      actorId: context.actor!.id,
      payload: commonPayload
    });
  }

  return {
    summary: {
      periodStart: commonPayload.periodStart,
      periodEnd: commonPayload.periodEnd,
      apply: input.apply,
      canClose,
      runStates: commonPayload.runStates,
      totalsKrw: commonPayload.totalsKrw,
      settlementKrw: commonPayload.settlementKrw
    }
  };
}

export async function distributePayrollPayslipsFromHelper(
  context: ServiceContext,
  input: DistributePayrollPayslipsInput
): Promise<DistributePayrollPayslipsResult> {
  await requirePayrollPermission(context, Permissions.payrollRunConfirm, "confirm");
  if (!isPayrollPayslipDeliveryEnabled()) {
    throw new ServiceError(409, "payroll_payslip_delivery_v1 feature flag is disabled");
  }

  ensureValidPeriod(input.periodStart, input.periodEnd);
  if (input.employeeId) {
    await requireEmployeeWithinTenant(context.dataAccess, context.actor, input.employeeId);
  }

  const tenantScope = resolveTenantScope(context.actor);
  const runs = await context.dataAccess.payroll.listInPeriod({
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    organizationId: tenantScope ?? undefined,
    employeeId: input.employeeId
  });

  const confirmedRuns = runs.filter((run) => run.state === "CONFIRMED");
  const previewedRuns = runs.filter((run) => run.state !== "CONFIRMED");
  const alreadyDistributedRuns = confirmedRuns.filter((run) => run.payslipDistributedAt !== null);
  const newlyDistributableRuns = confirmedRuns.filter((run) => run.payslipDistributedAt === null);

  if (!input.dryRun) {
    const distributedAt = new Date();
    for (const run of newlyDistributableRuns) {
      await context.dataAccess.payroll.update(run.id, {
        payslipDeliveryChannel: input.deliveryChannel,
        payslipDistributedAt: distributedAt,
        payslipDistributedBy: context.actor!.id
      });
    }
  }

  const organizationId = tenantScope ?? confirmedRuns[0]?.organizationId ?? null;
  const commonPayload = {
    periodStart: input.periodStart.toISOString(),
    periodEnd: input.periodEnd.toISOString(),
    employeeId: input.employeeId ?? null,
    dryRun: input.dryRun,
    deliveryChannel: input.deliveryChannel,
    runStates: {
      totalRuns: runs.length,
      confirmedRuns: confirmedRuns.length,
      previewedRuns: previewedRuns.length
    },
    distribution: {
      targetCount: confirmedRuns.length,
      alreadyDistributedCount: alreadyDistributedRuns.length,
      newlyDistributedCount: newlyDistributableRuns.length,
      targetRunIds: confirmedRuns.map((run) => run.id),
      alreadyDistributedRunIds: alreadyDistributedRuns.map((run) => run.id),
      newlyDistributedRunIds: newlyDistributableRuns.map((run) => run.id)
    }
  };

  const entityId = `${commonPayload.periodStart}_${commonPayload.periodEnd}_${input.deliveryChannel}`;
  if (input.dryRun) {
    await context.dataAccess.audit.append({
      action: "payroll.payslip_distribution_previewed",
      entityType: "PayrollPeriod",
      entityId,
      organizationId,
      actorRole: context.actor!.role,
      actorId: context.actor!.id,
      payload: commonPayload
    });
    await getEventPublisher(context).publish({
      name: "payroll.payslip.distribution_previewed.v1",
      occurredAt: new Date().toISOString(),
      entityType: "PayrollPeriod",
      entityId,
      actorRole: context.actor!.role,
      actorId: context.actor!.id,
      payload: commonPayload
    });
  } else {
    await context.dataAccess.audit.append({
      action: "payroll.payslip_distributed",
      entityType: "PayrollPeriod",
      entityId,
      organizationId,
      actorRole: context.actor!.role,
      actorId: context.actor!.id,
      payload: commonPayload
    });
    await getEventPublisher(context).publish({
      name: "payroll.payslip.distributed.v1",
      occurredAt: new Date().toISOString(),
      entityType: "PayrollPeriod",
      entityId,
      actorRole: context.actor!.role,
      actorId: context.actor!.id,
      payload: commonPayload
    });
  }

  return {
    summary: {
      periodStart: commonPayload.periodStart,
      periodEnd: commonPayload.periodEnd,
      dryRun: input.dryRun,
      deliveryChannel: input.deliveryChannel,
      runStates: commonPayload.runStates,
      distribution: commonPayload.distribution
    }
  };
}

export async function acknowledgePayrollPayslipReceiptFromHelper(
  context: ServiceContext,
  input: AcknowledgePayrollPayslipReceiptInput
): Promise<AcknowledgePayrollPayslipReceiptResult> {
  if (!isPayrollPayslipDeliveryEnabled()) {
    throw new ServiceError(409, "payroll_payslip_delivery_v1 feature flag is disabled");
  }

  const actor = context.actor;
  if (!actor) {
    throw new ServiceError(401, "missing or invalid actor context");
  }
  if (!input.runId.trim()) {
    throw new ServiceError(400, "runId is required");
  }

  const permissions = await resolveActorPermissions({ actor, dataAccess: context.dataAccess });
  const canListAny = permissions.has(Permissions.payrollRunList);
  const canListOwn = permissions.has(Permissions.payrollRunListOwn);
  if (!canListAny && !canListOwn) {
    throw new ServiceError(403, `payroll list requires ${Permissions.payrollRunList} permission`);
  }

  const run = await context.dataAccess.payroll.findById(input.runId);
  if (!run) {
    throw new ServiceError(404, "payroll run not found");
  }
  ensureTenantMatch(resolveTenantScope(actor), run.organizationId, "payroll run not found");

  if (run.state !== "CONFIRMED") {
    throw new ServiceError(409, "only confirmed payroll run can accept payslip receipt confirmation");
  }
  if (!run.employeeId) {
    throw new ServiceError(409, "payroll run has no employee owner");
  }
  if (!canListAny && actor.id !== run.employeeId) {
    throw new ServiceError(403, "employees can only confirm receipt for their own payslip");
  }
  if (!run.payslipDistributedAt) {
    throw new ServiceError(409, "payslip must be distributed before receipt confirmation");
  }

  if (run.payslipReceiptConfirmedAt && run.payslipReceiptConfirmedBy) {
    return {
      receipt: {
        runId: run.id,
        employeeId: run.employeeId,
        deliveryChannel: run.payslipDeliveryChannel,
        distributedAt: run.payslipDistributedAt.toISOString(),
        receiptConfirmedAt: run.payslipReceiptConfirmedAt.toISOString(),
        receiptConfirmedBy: run.payslipReceiptConfirmedBy,
        alreadyConfirmed: true
      }
    };
  }

  const receiptConfirmedAt = new Date();
  const updated = await context.dataAccess.payroll.update(run.id, {
    payslipReceiptConfirmedAt: receiptConfirmedAt,
    payslipReceiptConfirmedBy: actor.id
  });

  await context.dataAccess.audit.append({
    action: "payroll.payslip_receipt_confirmed",
    entityType: "PayrollRun",
    entityId: updated.id,
    organizationId: updated.organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      employeeId: updated.employeeId,
      deliveryChannel: updated.payslipDeliveryChannel,
      distributedAt: updated.payslipDistributedAt?.toISOString() ?? null,
      receiptConfirmedAt: updated.payslipReceiptConfirmedAt?.toISOString() ?? null,
      receiptConfirmedBy: updated.payslipReceiptConfirmedBy
    }
  });

  await getEventPublisher(context).publish({
    name: "payroll.payslip.receipt_confirmed.v1",
    occurredAt: new Date().toISOString(),
    entityType: "PayrollRun",
    entityId: updated.id,
    actorRole: actor.role,
    actorId: actor.id,
    payload: {
      employeeId: updated.employeeId,
      deliveryChannel: updated.payslipDeliveryChannel,
      distributedAt: updated.payslipDistributedAt?.toISOString() ?? null,
      receiptConfirmedAt: updated.payslipReceiptConfirmedAt?.toISOString() ?? null
    }
  });

  return {
    receipt: {
      runId: updated.id,
      employeeId: updated.employeeId!,
      deliveryChannel: updated.payslipDeliveryChannel,
      distributedAt: updated.payslipDistributedAt!.toISOString(),
      receiptConfirmedAt: updated.payslipReceiptConfirmedAt!.toISOString(),
      receiptConfirmedBy: updated.payslipReceiptConfirmedBy!,
      alreadyConfirmed: false
    }
  };
}
