import { approveLeaveRequest } from "@/features/leave/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

type RouteContext = {
  params: Promise<{ requestId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const { requestId } = await context.params;

  try {
    const result = await approveLeaveRequest(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      requestId
    );
    return ok(result);
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}
