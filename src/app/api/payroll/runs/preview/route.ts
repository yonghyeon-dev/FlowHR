import { prisma } from "@/lib/prisma";
import { previewPayrollSchema } from "@/features/payroll/schemas";
import { readActor } from "@/lib/actor";
import { hasAnyRole } from "@/lib/permissions";
import { fail, ok } from "@/lib/http";
import { calculateGrossPay, derivePayableMinutes } from "@/lib/payroll-rules";
import { writeAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  const actor = await readActor(request);
  if (!actor || !hasAnyRole(actor, ["admin", "payroll_operator"])) {
    return fail(403, "payroll preview requires admin or payroll_operator role");
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = previewPayrollSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const periodStart = new Date(parsed.data.periodStart);
  const periodEnd = new Date(parsed.data.periodEnd);
  if (periodEnd <= periodStart) {
    return fail(400, "periodEnd must be after periodStart");
  }

  const records = await prisma.attendanceRecord.findMany({
    where: {
      state: "APPROVED",
      checkInAt: {
        gte: periodStart,
        lte: periodEnd
      },
      ...(parsed.data.employeeId ? { employeeId: parsed.data.employeeId } : {})
    },
    orderBy: { checkInAt: "asc" }
  });

  let totals = { regular: 0, overtime: 0, night: 0, holiday: 0 };
  for (const record of records) {
    if (!record.checkOutAt) {
      continue;
    }
    const splitted = derivePayableMinutes(
      record.checkInAt,
      record.checkOutAt,
      record.breakMinutes,
      record.isHoliday
    );
    totals = {
      regular: totals.regular + splitted.regular,
      overtime: totals.overtime + splitted.overtime,
      night: totals.night + splitted.night,
      holiday: totals.holiday + splitted.holiday
    };
  }

  const grossPayKrw = calculateGrossPay(
    totals,
    parsed.data.hourlyRateKrw,
    parsed.data.multipliers
  );

  const run = await prisma.payrollRun.create({
    data: {
      employeeId: parsed.data.employeeId,
      periodStart,
      periodEnd,
      grossPayKrw,
      sourceRecordCount: records.length
    }
  });

  await writeAuditLog(prisma, {
    action: "payroll.calculated",
    entityType: "PayrollRun",
    entityId: run.id,
    actor,
    payload: {
      periodStart: parsed.data.periodStart,
      periodEnd: parsed.data.periodEnd,
      employeeId: parsed.data.employeeId,
      sourceRecordCount: records.length,
      totals,
      grossPayKrw
    }
  });

  return ok({
    run,
    summary: {
      sourceRecordCount: records.length,
      totals,
      grossPayKrw
    }
  });
}
