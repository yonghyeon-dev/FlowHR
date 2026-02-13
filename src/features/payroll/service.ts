import type { Actor } from "@/lib/actor";
import { hasAnyRole } from "@/lib/permissions";
import {
  calculateGrossPay,
  derivePayableMinutes,
  type Multipliers,
  type PayableMinutes
} from "@/lib/payroll-rules";
import type { DataAccess, PayrollRunEntity } from "@/features/shared/data-access";
import { ServiceError } from "@/features/shared/service-error";

type PreviewPayrollInput = {
  periodStart: Date;
  periodEnd: Date;
  employeeId?: string;
  hourlyRateKrw: number;
  multipliers: Multipliers;
};

type ServiceContext = {
  actor: Actor | null;
  dataAccess: DataAccess;
};

type PreviewPayrollResult = {
  run: PayrollRunEntity;
  summary: {
    sourceRecordCount: number;
    totals: PayableMinutes;
    grossPayKrw: number;
  };
};

const emptyTotals: PayableMinutes = {
  regular: 0,
  overtime: 0,
  night: 0,
  holiday: 0
};

export async function previewPayroll(
  context: ServiceContext,
  input: PreviewPayrollInput
): Promise<PreviewPayrollResult> {
  if (!context.actor || !hasAnyRole(context.actor, ["admin", "payroll_operator"])) {
    throw new ServiceError(403, "payroll preview requires admin or payroll_operator role");
  }
  if (input.periodEnd <= input.periodStart) {
    throw new ServiceError(400, "periodEnd must be after periodStart");
  }

  const records = await context.dataAccess.attendance.listApprovedInPeriod({
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
  const run = await context.dataAccess.payroll.create({
    employeeId: input.employeeId,
    periodStart: input.periodStart,
    periodEnd: input.periodEnd,
    grossPayKrw,
    sourceRecordCount: records.length
  });

  await context.dataAccess.audit.append({
    action: "payroll.calculated",
    entityType: "PayrollRun",
    entityId: run.id,
    actorRole: context.actor.role,
    actorId: context.actor.id,
    payload: {
      periodStart: input.periodStart.toISOString(),
      periodEnd: input.periodEnd.toISOString(),
      employeeId: input.employeeId,
      sourceRecordCount: records.length,
      totals,
      grossPayKrw
    }
  });

  return {
    run,
    summary: {
      sourceRecordCount: records.length,
      totals,
      grossPayKrw
    }
  };
}

export async function confirmPayrollRun(
  context: ServiceContext,
  runId: string
): Promise<PayrollRunEntity> {
  if (!context.actor || !hasAnyRole(context.actor, ["admin", "payroll_operator"])) {
    throw new ServiceError(403, "payroll confirm requires admin or payroll_operator role");
  }

  const run = await context.dataAccess.payroll.findById(runId);
  if (!run) {
    throw new ServiceError(404, "payroll run not found");
  }

  const confirmed = await context.dataAccess.payroll.update(runId, {
    state: "CONFIRMED",
    confirmedAt: new Date(),
    confirmedBy: context.actor.id
  });

  await context.dataAccess.audit.append({
    action: "payroll.confirmed",
    entityType: "PayrollRun",
    entityId: confirmed.id,
    actorRole: context.actor.role,
    actorId: context.actor.id
  });

  return confirmed;
}
