import { prisma } from "@/lib/prisma";
import { updateAttendanceSchema } from "@/features/attendance/schemas";
import { readActor } from "@/lib/actor";
import { canMutateAttendance } from "@/lib/permissions";
import { fail, ok } from "@/lib/http";
import { writeAuditLog } from "@/lib/audit";

type RouteContext = {
  params: Promise<{ recordId: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const actor = await readActor(request);
  if (!actor) {
    return fail(401, "missing or invalid actor context");
  }

  const { recordId } = await context.params;
  const existing = await prisma.attendanceRecord.findUnique({
    where: { id: recordId }
  });
  if (!existing) {
    return fail(404, "attendance record not found");
  }
  if (!canMutateAttendance(actor, existing.employeeId)) {
    return fail(403, "insufficient permissions");
  }
  if (existing.state === "APPROVED") {
    return fail(409, "approved attendance cannot be edited");
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = updateAttendanceSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const record = await prisma.attendanceRecord.update({
    where: { id: recordId },
    data: {
      checkInAt: parsed.data.checkInAt ? new Date(parsed.data.checkInAt) : undefined,
      checkOutAt: parsed.data.checkOutAt ? new Date(parsed.data.checkOutAt) : undefined,
      breakMinutes: parsed.data.breakMinutes,
      isHoliday: parsed.data.isHoliday,
      notes: parsed.data.notes
    }
  });

  await writeAuditLog(prisma, {
    action: "attendance.corrected",
    entityType: "AttendanceRecord",
    entityId: record.id,
    actor,
    payload: parsed.data
  });

  return ok({ record });
}
