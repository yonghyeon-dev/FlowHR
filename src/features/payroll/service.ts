import type { Actor } from "@/lib/actor";
import { hasAnyRole } from "@/lib/permissions";
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
};

type PreviewPayrollWithDeductionsInput = PreviewPayrollInput & (ManualDeductions | ProfileDeductions);

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
    deductionMode: "manual" | "profile";
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

type PayrollComputation = {
  recordsCount: number;
  totals: PayableMinutes;
  grossPayKrw: number;
};

const emptyTotals: PayableMinutes = {
  regular: 0,
  overtime: 0,
  night: 0,
  holiday: 0
};

function requirePayrollOperator(actor: Actor | null, action: "preview" | "confirm") {
  if (!actor || !hasAnyRole(actor, ["admin", "payroll_operator"])) {
    throw new ServiceError(403, `payroll ${action} requires admin or payroll_operator role`);
  }
}

function requireDeductionProfileOperator(actor: Actor | null, action: "read" | "write") {
  if (!actor || !hasAnyRole(actor, ["admin", "payroll_operator"])) {
    throw new ServiceError(403, `deduction profile ${action} requires admin or payroll_operator role`);
  }
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

function toRateNumber(value: number | null, fieldName: string) {
  if (value === null) {
    return null;
  }
  if (!Number.isFinite(value) || value < 0 || value > 1) {
    throw new ServiceError(400, `${fieldName} must be between 0 and 1`);
  }
  return value;
}

async function calculatePayrollComputation(
  dataAccess: DataAccess,
  input: PreviewPayrollInput
): Promise<PayrollComputation> {
  ensureValidPeriod(input.periodStart, input.periodEnd);

  const records = await dataAccess.attendance.listApprovedInPeriod({
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
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
  requirePayrollOperator(context.actor, "preview");
  const computed = await calculatePayrollComputation(context.dataAccess, input);
  const run = await context.dataAccess.payroll.create({
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
  requirePayrollOperator(context.actor, "preview");
  if (!isPayrollDeductionsEnabled()) {
    throw new ServiceError(409, "payroll_deductions_v1 feature flag is disabled");
  }

  const computed = await calculatePayrollComputation(context.dataAccess, input);
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
  } else {
    if (!isPayrollDeductionProfileEnabled()) {
      throw new ServiceError(409, "payroll_deduction_profile_v1 feature flag is disabled");
    }

    const profile = await context.dataAccess.deductionProfiles.findById(input.profileId);
    if (!profile) {
      throw new ServiceError(404, "deduction profile not found");
    }
    if (!profile.active) {
      throw new ServiceError(409, "deduction profile is inactive");
    }
    if (profile.mode !== "profile") {
      throw new ServiceError(409, "deduction profile mode is not profile");
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
  requirePayrollOperator(context.actor, "confirm");

  const run = await context.dataAccess.payroll.findById(runId);
  if (!run) {
    throw new ServiceError(404, "payroll run not found");
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

export async function readDeductionProfile(
  context: ServiceContext,
  profileId: string
): Promise<DeductionProfileEntity> {
  requireDeductionProfileOperator(context.actor, "read");
  if (!profileId.trim()) {
    throw new ServiceError(400, "profileId is required");
  }

  const profile = await context.dataAccess.deductionProfiles.findById(profileId);
  if (!profile) {
    throw new ServiceError(404, "deduction profile not found");
  }

  await context.dataAccess.audit.append({
    action: "payroll.deduction_profile.read",
    entityType: "DeductionProfile",
    entityId: profile.id,
    actorRole: context.actor!.role,
    actorId: context.actor!.id
  });

  return profile;
}

export async function upsertDeductionProfile(
  context: ServiceContext,
  input: UpsertDeductionProfileInput
): Promise<UpsertDeductionProfileResult> {
  requireDeductionProfileOperator(context.actor, "write");
  if (!input.profileId.trim()) {
    throw new ServiceError(400, "profileId is required");
  }
  if (!input.name.trim()) {
    throw new ServiceError(400, "name is required");
  }

  const withholdingRate = toRateNumber(input.withholdingRate, "withholdingRate");
  const socialInsuranceRate = toRateNumber(input.socialInsuranceRate, "socialInsuranceRate");
  const fixedOtherDeductionKrw = toKrwInteger(
    input.fixedOtherDeductionKrw,
    "fixedOtherDeductionKrw"
  );

  const profile = await context.dataAccess.deductionProfiles.upsert({
    id: input.profileId,
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
      mode: profile.mode,
      withholdingRate: profile.withholdingRate,
      socialInsuranceRate: profile.socialInsuranceRate,
      fixedOtherDeductionKrw: profile.fixedOtherDeductionKrw,
      active: profile.active
    }
  });

  return { profile };
}
