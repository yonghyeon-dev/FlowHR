import { listEmployeeHistoryQuerySchema } from "@/features/people/schemas";
import { listEmployeeProfileHistory } from "@/features/people/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

type RouteContext = {
  params: Promise<{ employeeId: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const url = new URL(request.url);
  const parsed = listEmployeeHistoryQuerySchema.safeParse({
    limit: url.searchParams.get("limit") ?? undefined
  });

  if (!parsed.success) {
    return fail(400, "invalid query", parsed.error.flatten());
  }

  const { employeeId } = await context.params;
  try {
    const history = await listEmployeeProfileHistory(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      {
        employeeId,
        limit: parsed.data.limit
      }
    );
    return ok({ history });
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}

