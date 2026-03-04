import { autoCloseAttendanceRecords } from "@/features/attendance/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

async function requireAdminActor(request: Request) {
  const actor = await readActor(request);
  if (!actor) {
    return { ok: false as const, response: fail(401, "attendance.auto-close.unauthorized") };
  }
  if (actor.role !== "admin") {
    return {
      ok: false as const,
      response: fail(403, "attendance.auto-close.forbidden", { reason: "admin_required" })
    };
  }
  return { ok: true as const, actor };
}

export async function POST(request: Request) {
  const auth = await requireAdminActor(request);
  if (!auth.ok) {
    return auth.response;
  }

  try {
    const result = await autoCloseAttendanceRecords({
      actor: auth.actor,
      dataAccess: getRuntimeDataAccess()
    });
    return ok(result);
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}
