import { readLeaveBalance } from "@/features/leave/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

type RouteContext = {
  params: Promise<{ employeeId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { employeeId } = await context.params;
  try {
    const balance = await readLeaveBalance(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      employeeId
    );
    return ok({ balance });
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}
