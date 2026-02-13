import { rejectAttendanceSchema } from "@/features/attendance/schemas";
import { rejectAttendanceRecord } from "@/features/attendance/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

type RouteContext = {
  params: Promise<{ recordId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { recordId } = await context.params;
  let reason: string | undefined;

  try {
    const rawBody = await request.text();
    if (rawBody.trim().length > 0) {
      const payload = JSON.parse(rawBody) as unknown;
      const parsed = rejectAttendanceSchema.safeParse(payload);
      if (!parsed.success) {
        return fail(400, "invalid payload", parsed.error.flatten());
      }
      reason = parsed.data.reason;
    }
  } catch {
    return fail(400, "invalid JSON body");
  }

  try {
    const record = await rejectAttendanceRecord(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      recordId,
      reason
    );
    return ok({ record });
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}
