import { Permissions } from "@/lib/rbac";
import { ensureTenantMatch, requireEmployeeWithinTenant, resolveTenantScope } from "@/features/shared/tenant-scope";
import { ServiceError } from "@/features/shared/service-error";
import {
  isPayrollDeductionProfileEnabled,
  isPayrollDeductionsEnabled,
  isPayrollKrBaselineEnabled,
  toKrwInteger,
  toRateNumber
} from "@/features/payroll/service-runtime-helpers";
import type {
  PreviewPayrollInput,
  PreviewPayrollWithDeductionsInput
} from "@/features/payroll/service-input-types";
import type {
  PreviewPayrollResult,
  PreviewPayrollWithDeductionsResult
} from "@/features/payroll/service-output-types";
import { calculateStatutoryKrBaselineDeductionPreview } from "@/features/payroll/service-deduction-statutory-preview-helpers";
import {
  type ServiceContext,
  getEventPublisher,
  requirePayrollPermission
} from "@/features/payroll/service-context-helpers";
import { calculatePayrollComputation } from "@/features/payroll/service-computation-helpers";

export async function previewPayrollFromHelper(
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

export async function previewPayrollWithDeductionsFromHelper(
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
