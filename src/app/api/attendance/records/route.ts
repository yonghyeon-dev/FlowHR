import { prisma } from "@/lib/prisma";
import { createAttendanceSchema } from "@/features/attendance/schemas";
import { readActor } from "@/lib/actor";
import { canMutateAttendance } from "@/lib/permissions";
import { fail, ok } from "@/lib/http";
import { writeAuditLog } from "@/lib/audit";

export async function POST(request: Request) {
  const actor = await readActor(request);
  if (!actor) {
    return fail(401, "missing or invalid actor context");
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = createAttendanceSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  if (!canMutateAttendance(actor, parsed.data.employeeId)) {
    return fail(403, "insufficient permissions");
  }

  const record = await prisma.attendanceRecord.create({
    data: {
      employeeId: parsed.data.employeeId,
      checkInAt: new Date(parsed.data.checkInAt),
      checkOutAt: parsed.data.checkOutAt ? new Date(parsed.data.checkOutAt) : null,
      breakMinutes: parsed.data.breakMinutes,
      isHoliday: parsed.data.isHoliday,
      notes: parsed.data.notes
    }
  });

  await writeAuditLog(prisma, {
    action: "attendance.recorded",
    entityType: "AttendanceRecord",
    entityId: record.id,
    actor,
    payload: {
      employeeId: record.employeeId
    }
  });

  return ok({ record }, 201);
}
