import { createLeaveRequestSchema } from "@/features/leave/schemas";
import { createLeaveRequest } from "@/features/leave/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = createLeaveRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  try {
    const leaveRequest = await createLeaveRequest(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      {
        employeeId: parsed.data.employeeId,
        leaveType: parsed.data.leaveType,
        startDate: new Date(parsed.data.startDate),
        endDate: new Date(parsed.data.endDate),
        reason: parsed.data.reason
      }
    );
    return ok({ request: leaveRequest }, 201);
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}
