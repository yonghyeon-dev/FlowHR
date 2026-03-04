import { weeklyAttendanceHoursQuerySchema } from "@/features/attendance/schemas";
import {
  calculateWeeklyHours,
  WEEKLY_HOUR_LIMIT
} from "@/features/attendance/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

import { requireAdmin } from "../../reports/shared";

const KOREA_UTC_OFFSET_MS = 9 * 60 * 60 * 1000;

function parseWeekOfDate(weekOf: string): Date | null {
  const [yearRaw, monthRaw, dayRaw] = weekOf.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day)
  ) {
    return null;
  }

  const value = new Date(
    Date.UTC(year, month - 1, day, 0, 0, 0, 0) - KOREA_UTC_OFFSET_MS
  );
  const shifted = new Date(value.getTime() + KOREA_UTC_OFFSET_MS);
  if (
    shifted.getUTCFullYear() !== year ||
    shifted.getUTCMonth() + 1 !== month ||
    shifted.getUTCDate() !== day
  ) {
    return null;
  }

  return value;
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request, "admin.attendance.weekly-hours");
  if (!auth.ok) {
    return auth.response;
  }

  const url = new URL(request.url);
  const parsed = weeklyAttendanceHoursQuerySchema.safeParse({
    employeeId: url.searchParams.get("employeeId") ?? undefined,
    weekOf: url.searchParams.get("weekOf") ?? undefined
  });
  if (!parsed.success) {
    return fail(400, "invalid query", parsed.error.flatten());
  }

  const weekStartDate = parseWeekOfDate(parsed.data.weekOf);
  if (!weekStartDate) {
    return fail(400, "invalid query", {
      fieldErrors: {
        weekOf: ["weekOf must be a valid YYYY-MM-DD date"]
      }
    });
  }

  const actor = await readActor(request);
  if (!actor) {
    return fail(401, "admin.attendance.weekly-hours.unauthorized");
  }

  try {
    const summary = await calculateWeeklyHours(
      {
        actor,
        dataAccess: getRuntimeDataAccess()
      },
      parsed.data.employeeId,
      weekStartDate
    );
    return ok({
      employeeId: summary.employeeId,
      weekOf: summary.weekOf,
      regularHours: summary.regularHours,
      overtimeHours: summary.overtimeHours,
      totalHours: summary.totalHours,
      limit: WEEKLY_HOUR_LIMIT,
      exceeded: summary.exceeded
    });
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}
