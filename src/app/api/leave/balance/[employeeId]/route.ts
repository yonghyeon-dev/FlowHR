import { readLeaveAvailableBalanceQuerySchema } from "@/features/leave/schemas";
import { getAvailableLeaveBalance } from "@/features/leave/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

type RouteContext = {
  params: Promise<{ employeeId: string }>;
};

const SEOUL_OFFSET_MS = 9 * 60 * 60 * 1000;

function resolveCurrentSeoulYear() {
  return new Date(Date.now() + SEOUL_OFFSET_MS).getUTCFullYear();
}

export async function GET(request: Request, context: RouteContext) {
  const { employeeId } = await context.params;
  const url = new URL(request.url);
  const parsed = readLeaveAvailableBalanceQuerySchema.safeParse({
    leaveType: url.searchParams.get("leaveType") ?? undefined,
    year: url.searchParams.get("year") ?? undefined
  });
  if (!parsed.success) {
    return fail(400, "invalid query", parsed.error.flatten());
  }

  const year = parsed.data.year ?? resolveCurrentSeoulYear();

  try {
    const balance = await getAvailableLeaveBalance(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      {
        employeeId,
        leaveType: parsed.data.leaveType,
        year
      }
    );
    return ok({
      employeeId,
      leaveType: parsed.data.leaveType,
      year,
      balance
    });
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}
