import { rejectLeaveRequestSchema } from "@/features/leave/schemas";
import { rejectLeaveRequest } from "@/features/leave/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

type RouteContext = {
  params: Promise<{ requestId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = rejectLeaveRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const { requestId } = await context.params;
  try {
    const leaveRequest = await rejectLeaveRequest(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      requestId,
      parsed.data.reason
    );
    return ok({ request: leaveRequest });
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}
