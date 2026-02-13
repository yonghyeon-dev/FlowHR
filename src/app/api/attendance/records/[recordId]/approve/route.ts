import { prisma } from "@/lib/prisma";
import { readActor } from "@/lib/actor";
import { hasAnyRole } from "@/lib/permissions";
import { fail, ok } from "@/lib/http";
import { writeAuditLog } from "@/lib/audit";

type RouteContext = {
  params: Promise<{ recordId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const actor = await readActor(request);
  if (!actor || !hasAnyRole(actor, ["admin", "manager"])) {
    return fail(403, "approval requires admin or manager role");
  }

  const { recordId } = await context.params;
  const existing = await prisma.attendanceRecord.findUnique({
    where: { id: recordId }
  });
  if (!existing) {
    return fail(404, "attendance record not found");
  }

  const record = await prisma.attendanceRecord.update({
    where: { id: recordId },
    data: {
      state: "APPROVED",
      approvedAt: new Date(),
      approvedBy: actor.id
    }
  });

  await writeAuditLog(prisma, {
    action: "attendance.approved",
    entityType: "AttendanceRecord",
    entityId: record.id,
    actor,
    payload: {
      employeeId: record.employeeId
    }
  });

  return ok({ record });
}
