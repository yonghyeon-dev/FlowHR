import type { Actor } from "@/lib/actor";
import { requirePermission, resolveActorPermissions } from "@/lib/permissions";
import { Permissions, type Permission } from "@/lib/rbac";
import { assertApprovalPolicyGate } from "@/features/approval/service";
import { ensureTenantMatch, requireEmployeeWithinTenant, resolveTenantScope } from "@/features/shared/tenant-scope";
import {
  calculateGrossPay,
  derivePayableMinutes,
  type Multipliers,
  type PayableMinutes
} from "@/lib/payroll-rules";
import type { DataAccess, DeductionProfileEntity, PayrollRunEntity } from "@/features/shared/data-access";
import type { DomainEventPublisher } from "@/features/shared/domain-event-publisher";
import { getRuntimeDomainEventPublisher } from "@/features/shared/runtime-domain-event-publisher";
import { ServiceError } from "@/features/shared/service-error";

type PreviewPayrollInput = {
  periodStart: Date;
  periodEnd: Date;
  employeeId?: string;
  hourlyRateKrw: number;
  multipliers: Multipliers;
};

type ManualDeductions = {
  deductionMode: "manual";
  deductions: {
    withholdingTaxKrw: number;
    socialInsuranceKrw: number;
    otherDeductionsKrw: number;
    breakdown?: Record<string, number>;
  };
};

type ProfileDeductions = {
  deductionMode: "profile";
  profileId: string;
  expectedProfileVersion?: number;
};

type StatutoryKrBaselineDeductions = {
  deductionMode: "statutory_kr_baseline";
  statutory?: {
    nonTaxableIncomeKrw: number;
    incomeTaxBrackets?: Array<{
      upToKrw: number | null;
      rate: number;
    }>;
    incomeTaxRate: number;
    localIncomeTaxRate: number;
    nationalPensionRate: number;
    nationalPensionCapKrw?: number;
    healthInsuranceRate: number;
    healthInsuranceCapKrw?: number;
    longTermCareRateOnHealth: number;
    employmentInsuranceRate: number;
    employmentInsuranceCapKrw?: number;
    otherDeductionsKrw: number;
  };
};

type PreviewPayrollWithDeductionsInput = PreviewPayrollInput &
  (ManualDeductions | ProfileDeductions | StatutoryKrBaselineDeductions);

type UpsertDeductionProfileInput = {
  profileId: string;
  name: string;
  mode: "manual" | "profile";
  withholdingRate: number | null;
  socialInsuranceRate: number | null;
  fixedOtherDeductionKrw: number;
  active: boolean;
};

type ServiceContext = {
  actor: Actor | null;
  dataAccess: DataAccess;
  eventPublisher?: DomainEventPublisher;
};

function getEventPublisher(context: ServiceContext): DomainEventPublisher {
  return context.eventPublisher ?? getRuntimeDomainEventPublisher();
}

type PreviewPayrollResult = {
  run: PayrollRunEntity;
  summary: {
    sourceRecordCount: number;
    totals: PayableMinutes;
    grossPayKrw: number;
  };
};

type PreviewPayrollWithDeductionsResult = {
  run: PayrollRunEntity;
  summary: {
    deductionMode: "manual" | "profile" | "statutory_kr_baseline";
    profileId: string | null;
    profileVersion: number | null;
    sourceRecordCount: number;
    totals: PayableMinutes;
    grossPayKrw: number;
    withholdingTaxKrw: number;
    socialInsuranceKrw: number;
    otherDeductionsKrw: number;
    totalDeductionsKrw: number;
    netPayKrw: number;
    deductionBreakdown: Record<string, unknown>;
  };
};

type UpsertDeductionProfileResult = {
  profile: Awaited<ReturnType<DataAccess["deductionProfiles"]["upsert"]>>;
};

type ListDeductionProfilesInput = {
  active?: boolean;
  mode?: "manual" | "profile";
};

type ListPayrollRunsInput = {
  periodStart: Date;
  periodEnd: Date;
  employeeId?: string;
  state?: "PREVIEWED" | "CONFIRMED";
};

type PayrollComputation = {
  recordsCount: number;
  totals: PayableMinutes;
  grossPayKrw: number;
};

type IncomeTaxBracket = {
  upToKrw: number | null;
  rate: number;
};

const emptyTotals: PayableMinutes = {
  regular: 0,
  overtime: 0,
  night: 0,
  holiday: 0
};

async function requirePayrollPermission(
  context: ServiceContext,
  permission: Permission,
  action: "preview" | "confirm" | "list"
) {
  await requirePermission(context, permission, `payroll ${action} requires ${permission}`);
}

async function requireDeductionProfilePermission(
  context: ServiceContext,
  permission: Permission,
  action: "read" | "write"
) {
  await requirePermission(context, permission, `deduction profile ${action} requires ${permission}`);
}

function ensureValidPeriod(periodStart: Date, periodEnd: Date) {
  if (periodEnd <= periodStart) {
    throw new ServiceError(400, "periodEnd must be after periodStart");
  }
}

function toKrwInteger(value: number, fieldName: string) {
  if (!Number.isInteger(value) || value < 0) {
    throw new ServiceError(400, `${fieldName} must be a non-negative integer`);
  }
  return value;
}

function isPayrollDeductionsEnabled() {
  const raw =
    process.env.FLOWHR_PAYROLL_DEDUCTIONS_V1 ?? process.env.PAYROLL_DEDUCTIONS_V1 ?? "";
  const value = raw.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

function isPayrollDeductionProfileEnabled() {
  const raw =
    process.env.FLOWHR_PAYROLL_DEDUCTION_PROFILE_V1 ??
    process.env.PAYROLL_DEDUCTION_PROFILE_V1 ??
    "";
  const value = raw.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

function isPayrollKrBaselineEnabled() {
  const raw =
    process.env.FLOWHR_PAYROLL_KR_BASELINE_V1 ?? process.env.PAYROLL_KR_BASELINE_V1 ?? "";
  const value = raw.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes" || value === "on";
}

function toRateNumber(value: number | null, fieldName: string) {
  if (value === null) {
    return null;
  }
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new ServiceError(400, `${fieldName} must be between 0 and 1`);
  }
  return value;
}

function normalizeIncomeTaxBrackets(brackets?: IncomeTaxBracket[]): IncomeTaxBracket[] | null {
  if (!brackets || brackets.length === 0) {
    return null;
  }

  const normalized: IncomeTaxBracket[] = [];
  let lastFiniteUpper = -1;
  let hasOpenEnded = false;
  for (const [index, bracket] of brackets.entries()) {
    const rate = toRateNumber(bracket.rate, `statutory.incomeTaxBrackets[${index}].rate`) ?? 0;
    if (bracket.upToKrw === null) {
      if (index !== brackets.length - 1) {
        throw new ServiceError(
          400,
          "statutory.incomeTaxBrackets open-ended bracket(upToKrw=null) must be last"
        );
      }
      hasOpenEnded = true;
      normalized.push({ upToKrw: null, rate });
      continue;
    }

    const upToKrw = toKrwInteger(
      bracket.upToKrw,
      `statutory.incomeTaxBrackets[${index}].upToKrw`
    );
    if (upToKrw <= lastFiniteUpper) {
      throw new ServiceError(
        400,
        "statutory.incomeTaxBrackets upToKrw must be strictly increasing"
      );
    }
    lastFiniteUpper = upToKrw;
    normalized.push({ upToKrw, rate });
  }

  if (!hasOpenEnded) {
    throw new ServiceError(
      400,
      "statutory.incomeTaxBrackets must include open-ended bracket(upToKrw=null) as last entry"
    );
  }

  return normalized;
}

function calculateProgressiveIncomeTaxKrw(taxableBaseKrw: number, brackets: IncomeTaxBracket[]) {
  let tax = 0;
  let lowerBound = 0;
  for (const bracket of brackets) {
    if (taxableBaseKrw <= lowerBound) {
      break;
    }
    const upperBound = bracket.upToKrw === null ? Number.POSITIVE_INFINITY : bracket.upToKrw;
    const segment = Math.min(taxableBaseKrw, upperBound) - lowerBound;
    if (segment > 0) {
      tax += segment * bracket.rate;
    }
    lowerBound = upperBound;
  }
  return toKrwInteger(Math.round(tax), "statutory.incomeTaxKrw");
}

function applyContributionCap(baseKrw: number, capKrw: number | undefined, fieldName: string) {
  if (capKrw === undefined) {
    return baseKrw;
  }
  const normalizedCap = toKrwInteger(capKrw, fieldName);
  return Math.min(baseKrw, normalizedCap);
}

async function calculatePayrollComputation(
  dataAccess: DataAccess,
  input: PreviewPayrollInput,
  tenantScope: string | null
): Promise<PayrollComputation> {
  ensureValidPeriod(input.periodStart, input.periodEnd);

  const records = await dataAccess.attendance.listApprovedInPeriod({
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    organizationId: tenantScope ?? undefined,
    employeeId: input.employeeId
  });

  let totals = emptyTotals;
  for (const record of records) {
    if (!record.checkOutAt) {
      continue;
    }
    const split = derivePayableMinutes(
      record.checkInAt,
      record.checkOutAt,
      record.breakMinutes,
      record.isHoliday
    );
    totals = {
      regular: totals.regular + split.regular,
      overtime: totals.overtime + split.overtime,
      night: totals.night + split.night,
      holiday: totals.holiday + split.holiday
    };
  }

  const grossPayKrw = calculateGrossPay(totals, input.hourlyRateKrw, input.multipliers);
  return {
    recordsCount: records.length,
    totals,
    grossPayKrw
  };
}

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

    const nonTaxableIncomeKrw = toKrwInteger(
      input.statutory?.nonTaxableIncomeKrw ?? 0,
      "statutory.nonTaxableIncomeKrw"
    );
    const incomeTaxRate =
      toRateNumber(input.statutory?.incomeTaxRate ?? 0.03, "statutory.incomeTaxRate") ?? 0;
    const incomeTaxBrackets = normalizeIncomeTaxBrackets(input.statutory?.incomeTaxBrackets);
    const localIncomeTaxRate =
      toRateNumber(input.statutory?.localIncomeTaxRate ?? 0.1, "statutory.localIncomeTaxRate") ??
      0;
    const nationalPensionRate =
      toRateNumber(input.statutory?.nationalPensionRate ?? 0.045, "statutory.nationalPensionRate") ??
      0;
    const healthInsuranceRate =
      toRateNumber(input.statutory?.healthInsuranceRate ?? 0.03545, "statutory.healthInsuranceRate") ??
      0;
    const longTermCareRateOnHealth =
      toRateNumber(
        input.statutory?.longTermCareRateOnHealth ?? 0.1295,
        "statutory.longTermCareRateOnHealth"
      ) ?? 0;
    const employmentInsuranceRate =
      toRateNumber(
        input.statutory?.employmentInsuranceRate ?? 0.009,
        "statutory.employmentInsuranceRate"
      ) ?? 0;
    otherDeductionsKrw = toKrwInteger(
      input.statutory?.otherDeductionsKrw ?? 0,
      "statutory.otherDeductionsKrw"
    );

    const taxableBaseKrw = Math.max(computed.grossPayKrw - nonTaxableIncomeKrw, 0);
    const incomeTaxKrw = incomeTaxBrackets
      ? calculateProgressiveIncomeTaxKrw(taxableBaseKrw, incomeTaxBrackets)
      : toKrwInteger(Math.round(taxableBaseKrw * incomeTaxRate), "statutory.incomeTaxKrw");
    const localIncomeTaxKrw = toKrwInteger(
      Math.round(incomeTaxKrw * localIncomeTaxRate),
      "statutory.localIncomeTaxKrw"
    );
    const nationalPensionBaseKrw = applyContributionCap(
      taxableBaseKrw,
      input.statutory?.nationalPensionCapKrw,
      "statutory.nationalPensionCapKrw"
    );
    const healthInsuranceBaseKrw = applyContributionCap(
      taxableBaseKrw,
      input.statutory?.healthInsuranceCapKrw,
      "statutory.healthInsuranceCapKrw"
    );
    const employmentInsuranceBaseKrw = applyContributionCap(
      taxableBaseKrw,
      input.statutory?.employmentInsuranceCapKrw,
      "statutory.employmentInsuranceCapKrw"
    );
    const nationalPensionKrw = toKrwInteger(
      Math.round(nationalPensionBaseKrw * nationalPensionRate),
      "statutory.nationalPensionKrw"
    );
    const healthInsuranceKrw = toKrwInteger(
      Math.round(healthInsuranceBaseKrw * healthInsuranceRate),
      "statutory.healthInsuranceKrw"
    );
    const longTermCareKrw = toKrwInteger(
      Math.round(healthInsuranceKrw * longTermCareRateOnHealth),
      "statutory.longTermCareKrw"
    );
    const employmentInsuranceKrw = toKrwInteger(
      Math.round(employmentInsuranceBaseKrw * employmentInsuranceRate),
      "statutory.employmentInsuranceKrw"
    );

    withholdingTaxKrw = toKrwInteger(
      incomeTaxKrw + localIncomeTaxKrw,
      "withholdingTaxKrw"
    );
    socialInsuranceKrw = toKrwInteger(
      nationalPensionKrw + healthInsuranceKrw + longTermCareKrw + employmentInsuranceKrw,
      "socialInsuranceKrw"
    );

    Object.assign(additionalBreakdown, {
      statutoryModel: "kr_baseline_v1",
      taxMethod: incomeTaxBrackets ? "progressive_brackets" : "flat_rate",
      taxableBaseKrw,
      incomeTaxBrackets: incomeTaxBrackets,
      contributionBasesKrw: {
        nationalPensionBaseKrw,
        healthInsuranceBaseKrw,
        employmentInsuranceBaseKrw
      },
      contributionCapsKrw: {
        nationalPensionCapKrw: input.statutory?.nationalPensionCapKrw ?? null,
        healthInsuranceCapKrw: input.statutory?.healthInsuranceCapKrw ?? null,
        employmentInsuranceCapKrw: input.statutory?.employmentInsuranceCapKrw ?? null
      },
      rates: {
        incomeTaxRate,
        localIncomeTaxRate,
        nationalPensionRate,
        healthInsuranceRate,
        longTermCareRateOnHealth,
        employmentInsuranceRate
      },
      components: {
        incomeTaxKrw,
        localIncomeTaxKrw,
        nationalPensionKrw,
        healthInsuranceKrw,
        longTermCareKrw,
        employmentInsuranceKrw
      }
    });
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
  await assertApprovalPolicyGate(context, {
    domain: "PAYROLL",
    organizationId: run.organizationId
  });

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

export async function readDeductionProfile(
  context: ServiceContext,
  profileId: string
): Promise<DeductionProfileEntity> {
  await requireDeductionProfilePermission(context, Permissions.payrollDeductionProfileRead, "read");
  if (!profileId.trim()) {
    throw new ServiceError(400, "profileId is required");
  }

  const tenantScope = resolveTenantScope(context.actor);
  const profile = await context.dataAccess.deductionProfiles.findById(profileId);
  if (!profile) {
    throw new ServiceError(404, "deduction profile not found");
  }
  ensureTenantMatch(tenantScope, profile.organizationId, "deduction profile not found");

  await context.dataAccess.audit.append({
    action: "payroll.deduction_profile.read",
    entityType: "DeductionProfile",
    entityId: profile.id,
    organizationId: profile.organizationId,
    actorRole: context.actor!.role,
    actorId: context.actor!.id
  });

  return profile;
}

export async function upsertDeductionProfile(
  context: ServiceContext,
  input: UpsertDeductionProfileInput
): Promise<UpsertDeductionProfileResult> {
  await requireDeductionProfilePermission(context, Permissions.payrollDeductionProfileWrite, "write");
  if (!input.profileId.trim()) {
    throw new ServiceError(400, "profileId is required");
  }
  if (!input.name.trim()) {
    throw new ServiceError(400, "name is required");
  }

  const tenantScope = resolveTenantScope(context.actor);
  const withholdingRate = toRateNumber(input.withholdingRate, "withholdingRate");
  const socialInsuranceRate = toRateNumber(input.socialInsuranceRate, "socialInsuranceRate");
  const fixedOtherDeductionKrw = toKrwInteger(
    input.fixedOtherDeductionKrw,
    "fixedOtherDeductionKrw"
  );

  const profile = await context.dataAccess.deductionProfiles.upsert({
    id: input.profileId,
    organizationId: tenantScope ?? null,
    name: input.name,
    mode: input.mode,
    withholdingRate,
    socialInsuranceRate,
    fixedOtherDeductionKrw,
    active: input.active
  });

  await context.dataAccess.audit.append({
    action: "payroll.deduction_profile.updated",
    entityType: "DeductionProfile",
    entityId: profile.id,
    organizationId: profile.organizationId,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload: {
      version: profile.version,
      mode: profile.mode,
      withholdingRate: profile.withholdingRate,
      socialInsuranceRate: profile.socialInsuranceRate,
      fixedOtherDeductionKrw: profile.fixedOtherDeductionKrw,
      active: profile.active
    }
  });

  await getEventPublisher(context).publish({
    name: "payroll.deduction_profile.updated.v1",
    occurredAt: new Date().toISOString(),
    entityType: "DeductionProfile",
    entityId: profile.id,
    actorRole: context.actor!.role,
    actorId: context.actor!.id,
    payload: {
      version: profile.version,
      organizationId: profile.organizationId,
      mode: profile.mode,
      withholdingRate: profile.withholdingRate,
      socialInsuranceRate: profile.socialInsuranceRate,
      fixedOtherDeductionKrw: profile.fixedOtherDeductionKrw,
      active: profile.active
    }
  });

  return { profile };
}

export async function listDeductionProfiles(
  context: ServiceContext,
  input: ListDeductionProfilesInput
): Promise<DeductionProfileEntity[]> {
  await requireDeductionProfilePermission(context, Permissions.payrollDeductionProfileRead, "read");
  const tenantScope = resolveTenantScope(context.actor);
  return await context.dataAccess.deductionProfiles.list({
    organizationId: tenantScope ?? undefined,
    active: input.active,
    mode: input.mode
  });
}
