import { Permissions } from "@/lib/rbac";
import {
  requireEmployeeWithinTenant,
  resolveTenantScope
} from "@/features/shared/tenant-scope";
import { ServiceError } from "@/features/shared/service-error";
import {
  isPayrollKrInsuranceSettlementEnabled,
  ensureMonthlyBoundaryInSeoul,
  toKrwInteger,
  toRateNumber
} from "@/features/payroll/service-runtime-helpers";
import {
  applyContributionCap,
  normalizeSettlementInsuranceRoundingRules,
  roundKrwByRule
} from "@/features/payroll/service-statutory-adapter-helpers";
import type { PreviewPayrollInsuranceSettlementInput } from "@/features/payroll/service-input-types";
import type { PreviewPayrollInsuranceSettlementResult } from "@/features/payroll/service-output-types";
import {
  type ServiceContext,
  getEventPublisher,
  requirePayrollPermission
} from "@/features/payroll/service-context-helpers";
import { calculatePayrollComputation } from "@/features/payroll/service-computation-helpers";

export async function previewPayrollInsuranceSettlementFromHelper(
  context: ServiceContext,
  input: PreviewPayrollInsuranceSettlementInput
): Promise<PreviewPayrollInsuranceSettlementResult> {
  await requirePayrollPermission(context, Permissions.payrollRunPreview, "preview");
  if (!isPayrollKrInsuranceSettlementEnabled()) {
    throw new ServiceError(409, "payroll_kr_insurance_settlement_v1 feature flag is disabled");
  }

  const employee = await requireEmployeeWithinTenant(context.dataAccess, context.actor, input.employeeId);
  const tenantScope = resolveTenantScope(context.actor);
  const computed = await calculatePayrollComputation(context.dataAccess, input, tenantScope);

  const nonTaxableIncomeKrw = toKrwInteger(
    input.settlement?.nonTaxableIncomeKrw ?? 0,
    "settlement.nonTaxableIncomeKrw"
  );
  const requireMonthlyBoundary = input.settlement?.requireMonthlyBoundary ?? true;
  const insuranceRoundingRules = normalizeSettlementInsuranceRoundingRules(
    input.settlement?.insuranceRounding
  );
  if (requireMonthlyBoundary) {
    ensureMonthlyBoundaryInSeoul(input.periodStart, input.periodEnd);
  }

  const nationalPensionEmployeeRate =
    toRateNumber(
      input.settlement?.nationalPensionEmployeeRate ?? 0.045,
      "settlement.nationalPensionEmployeeRate"
    ) ?? 0;
  const nationalPensionEmployerRate =
    toRateNumber(
      input.settlement?.nationalPensionEmployerRate ?? 0.045,
      "settlement.nationalPensionEmployerRate"
    ) ?? 0;
  const healthInsuranceEmployeeRate =
    toRateNumber(
      input.settlement?.healthInsuranceEmployeeRate ?? 0.03545,
      "settlement.healthInsuranceEmployeeRate"
    ) ?? 0;
  const healthInsuranceEmployerRate =
    toRateNumber(
      input.settlement?.healthInsuranceEmployerRate ?? 0.03545,
      "settlement.healthInsuranceEmployerRate"
    ) ?? 0;
  const longTermCareRateOnHealth =
    toRateNumber(
      input.settlement?.longTermCareRateOnHealth ?? 0.1295,
      "settlement.longTermCareRateOnHealth"
    ) ?? 0;
  const employmentInsuranceEmployeeRate =
    toRateNumber(
      input.settlement?.employmentInsuranceEmployeeRate ?? 0.009,
      "settlement.employmentInsuranceEmployeeRate"
    ) ?? 0;
  const employmentInsuranceEmployerRate =
    toRateNumber(
      input.settlement?.employmentInsuranceEmployerRate ?? 0.0115,
      "settlement.employmentInsuranceEmployerRate"
    ) ?? 0;
  const industrialAccidentEmployerRate =
    toRateNumber(
      input.settlement?.industrialAccidentEmployerRate ?? 0.015,
      "settlement.industrialAccidentEmployerRate"
    ) ?? 0;

  const taxableBaseKrw = Math.max(computed.grossPayKrw - nonTaxableIncomeKrw, 0);
  const nationalPensionBaseKrw = applyContributionCap(
    taxableBaseKrw,
    input.settlement?.nationalPensionCapKrw,
    "settlement.nationalPensionCapKrw"
  );
  const healthInsuranceBaseKrw = applyContributionCap(
    taxableBaseKrw,
    input.settlement?.healthInsuranceCapKrw,
    "settlement.healthInsuranceCapKrw"
  );
  const employmentInsuranceBaseKrw = applyContributionCap(
    taxableBaseKrw,
    input.settlement?.employmentInsuranceCapKrw,
    "settlement.employmentInsuranceCapKrw"
  );
  const industrialAccidentBaseKrw = taxableBaseKrw;

  const nationalPensionEmployeeRawKrw = nationalPensionBaseKrw * nationalPensionEmployeeRate;
  const nationalPensionEmployeeKrw = roundKrwByRule(
    nationalPensionEmployeeRawKrw,
    "settlement.nationalPensionEmployeeKrw",
    insuranceRoundingRules.mode,
    insuranceRoundingRules.nationalPensionUnitKrw
  );
  const nationalPensionEmployerRawKrw = nationalPensionBaseKrw * nationalPensionEmployerRate;
  const nationalPensionEmployerKrw = roundKrwByRule(
    nationalPensionEmployerRawKrw,
    "settlement.nationalPensionEmployerKrw",
    insuranceRoundingRules.mode,
    insuranceRoundingRules.nationalPensionUnitKrw
  );
  const healthInsuranceEmployeeRawKrw = healthInsuranceBaseKrw * healthInsuranceEmployeeRate;
  const healthInsuranceEmployeeKrw = roundKrwByRule(
    healthInsuranceEmployeeRawKrw,
    "settlement.healthInsuranceEmployeeKrw",
    insuranceRoundingRules.mode,
    insuranceRoundingRules.healthInsuranceUnitKrw
  );
  const healthInsuranceEmployerRawKrw = healthInsuranceBaseKrw * healthInsuranceEmployerRate;
  const healthInsuranceEmployerKrw = roundKrwByRule(
    healthInsuranceEmployerRawKrw,
    "settlement.healthInsuranceEmployerKrw",
    insuranceRoundingRules.mode,
    insuranceRoundingRules.healthInsuranceUnitKrw
  );
  const longTermCareEmployeeRawKrw = healthInsuranceEmployeeKrw * longTermCareRateOnHealth;
  const longTermCareEmployeeKrw = roundKrwByRule(
    longTermCareEmployeeRawKrw,
    "settlement.longTermCareEmployeeKrw",
    insuranceRoundingRules.mode,
    insuranceRoundingRules.longTermCareUnitKrw
  );
  const longTermCareEmployerRawKrw = healthInsuranceEmployerKrw * longTermCareRateOnHealth;
  const longTermCareEmployerKrw = roundKrwByRule(
    longTermCareEmployerRawKrw,
    "settlement.longTermCareEmployerKrw",
    insuranceRoundingRules.mode,
    insuranceRoundingRules.longTermCareUnitKrw
  );
  const employmentInsuranceEmployeeRawKrw =
    employmentInsuranceBaseKrw * employmentInsuranceEmployeeRate;
  const employmentInsuranceEmployeeKrw = roundKrwByRule(
    employmentInsuranceEmployeeRawKrw,
    "settlement.employmentInsuranceEmployeeKrw",
    insuranceRoundingRules.mode,
    insuranceRoundingRules.employmentInsuranceUnitKrw
  );
  const employmentInsuranceEmployerRawKrw =
    employmentInsuranceBaseKrw * employmentInsuranceEmployerRate;
  const employmentInsuranceEmployerKrw = roundKrwByRule(
    employmentInsuranceEmployerRawKrw,
    "settlement.employmentInsuranceEmployerKrw",
    insuranceRoundingRules.mode,
    insuranceRoundingRules.employmentInsuranceUnitKrw
  );
  const industrialAccidentEmployerRawKrw = industrialAccidentBaseKrw * industrialAccidentEmployerRate;
  const industrialAccidentEmployerKrw = roundKrwByRule(
    industrialAccidentEmployerRawKrw,
    "settlement.industrialAccidentEmployerKrw",
    insuranceRoundingRules.mode,
    insuranceRoundingRules.industrialAccidentUnitKrw
  );

  const employeeContributionTotalKrw = toKrwInteger(
    nationalPensionEmployeeKrw +
      healthInsuranceEmployeeKrw +
      longTermCareEmployeeKrw +
      employmentInsuranceEmployeeKrw,
    "settlement.employeeContributionTotalKrw"
  );
  const employerContributionTotalKrw = toKrwInteger(
    nationalPensionEmployerKrw +
      healthInsuranceEmployerKrw +
      longTermCareEmployerKrw +
      employmentInsuranceEmployerKrw +
      industrialAccidentEmployerKrw,
    "settlement.employerContributionTotalKrw"
  );

  const priorWithheldKrw = toKrwInteger(
    input.settlement?.priorWithheldKrw ?? 0,
    "settlement.priorWithheldKrw"
  );
  const priorEmployerPaidKrw = toKrwInteger(
    input.settlement?.priorEmployerPaidKrw ?? 0,
    "settlement.priorEmployerPaidKrw"
  );
  const employeeDeltaKrw = employeeContributionTotalKrw - priorWithheldKrw;
  const employerDeltaKrw = employerContributionTotalKrw - priorEmployerPaidKrw;
  const totalDeltaKrw = employeeDeltaKrw + employerDeltaKrw;

  await context.dataAccess.audit.append({
    action: "payroll.insurance_settlement_previewed",
    entityType: "PayrollRun",
    organizationId: employee.organizationId,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload: {
      employeeId: input.employeeId,
      periodStart: input.periodStart.toISOString(),
      periodEnd: input.periodEnd.toISOString(),
      sourceRecordCount: computed.recordsCount,
      grossPayKrw: computed.grossPayKrw,
      taxableBaseKrw,
      requireMonthlyBoundary,
      insuranceRounding: {
        mode: insuranceRoundingRules.mode,
        unitsKrw: {
          nationalPensionUnitKrw: insuranceRoundingRules.nationalPensionUnitKrw,
          healthInsuranceUnitKrw: insuranceRoundingRules.healthInsuranceUnitKrw,
          longTermCareUnitKrw: insuranceRoundingRules.longTermCareUnitKrw,
          employmentInsuranceUnitKrw: insuranceRoundingRules.employmentInsuranceUnitKrw,
          industrialAccidentUnitKrw: insuranceRoundingRules.industrialAccidentUnitKrw
        }
      },
      employeeContributionTotalKrw,
      employerContributionTotalKrw,
      priorWithheldKrw,
      priorEmployerPaidKrw,
      employeeDeltaKrw,
      employerDeltaKrw,
      totalDeltaKrw
    }
  });

  await getEventPublisher(context).publish({
    name: "payroll.insurance_settlement.previewed.v1",
    occurredAt: new Date().toISOString(),
    entityType: "PayrollRun",
    entityId: input.employeeId,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload: {
      employeeId: input.employeeId,
      periodStart: input.periodStart.toISOString(),
      periodEnd: input.periodEnd.toISOString(),
      sourceRecordCount: computed.recordsCount,
      grossPayKrw: computed.grossPayKrw,
      taxableBaseKrw,
      insuranceRoundingMode: insuranceRoundingRules.mode,
      employeeContributionTotalKrw,
      employerContributionTotalKrw,
      totalDeltaKrw
    }
  });

  return {
    summary: {
      sourceRecordCount: computed.recordsCount,
      totals: computed.totals,
      grossPayKrw: computed.grossPayKrw,
      taxableBaseKrw,
      rounding: {
        mode: insuranceRoundingRules.mode,
        unitsKrw: {
          nationalPensionUnitKrw: insuranceRoundingRules.nationalPensionUnitKrw,
          healthInsuranceUnitKrw: insuranceRoundingRules.healthInsuranceUnitKrw,
          longTermCareUnitKrw: insuranceRoundingRules.longTermCareUnitKrw,
          employmentInsuranceUnitKrw: insuranceRoundingRules.employmentInsuranceUnitKrw,
          industrialAccidentUnitKrw: insuranceRoundingRules.industrialAccidentUnitKrw
        }
      },
      rawContributionKrw: {
        employee: {
          nationalPensionKrw: nationalPensionEmployeeRawKrw,
          healthInsuranceKrw: healthInsuranceEmployeeRawKrw,
          longTermCareKrw: longTermCareEmployeeRawKrw,
          employmentInsuranceKrw: employmentInsuranceEmployeeRawKrw
        },
        employer: {
          nationalPensionKrw: nationalPensionEmployerRawKrw,
          healthInsuranceKrw: healthInsuranceEmployerRawKrw,
          longTermCareKrw: longTermCareEmployerRawKrw,
          employmentInsuranceKrw: employmentInsuranceEmployerRawKrw,
          industrialAccidentKrw: industrialAccidentEmployerRawKrw
        }
      },
      employeeContributionKrw: {
        nationalPensionKrw: nationalPensionEmployeeKrw,
        healthInsuranceKrw: healthInsuranceEmployeeKrw,
        longTermCareKrw: longTermCareEmployeeKrw,
        employmentInsuranceKrw: employmentInsuranceEmployeeKrw,
        totalKrw: employeeContributionTotalKrw
      },
      employerContributionKrw: {
        nationalPensionKrw: nationalPensionEmployerKrw,
        healthInsuranceKrw: healthInsuranceEmployerKrw,
        longTermCareKrw: longTermCareEmployerKrw,
        employmentInsuranceKrw: employmentInsuranceEmployerKrw,
        industrialAccidentKrw: industrialAccidentEmployerKrw,
        totalKrw: employerContributionTotalKrw
      },
      contributionBasesKrw: {
        nationalPensionBaseKrw,
        healthInsuranceBaseKrw,
        employmentInsuranceBaseKrw,
        industrialAccidentBaseKrw
      },
      settlementKrw: {
        priorWithheldKrw,
        priorEmployerPaidKrw,
        employeeDeltaKrw,
        employerDeltaKrw,
        totalDeltaKrw
      }
    }
  };
}
