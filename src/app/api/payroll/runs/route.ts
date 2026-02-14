import { listPayrollRunsQuerySchema } from "@/features/payroll/schemas";
import { listPayrollRuns } from "@/features/payroll/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

export async function GET(request: Request) {
  const url = new URL(request.url);

  const normalizeOffset = (value: string | null) => (value ? value.replace(/ /g, "+") : value);
  const parsed = listPayrollRunsQuerySchema.safeParse({
    from: normalizeOffset(url.searchParams.get("from")),
    to: normalizeOffset(url.searchParams.get("to")),
    employeeId: url.searchParams.get("employeeId") ?? undefined,
    state: url.searchParams.get("state") ?? undefined
  });

  if (!parsed.success) {
    return fail(400, "invalid query", parsed.error.flatten());
  }

  try {
    const runs = await listPayrollRuns(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      {
        periodStart: new Date(parsed.data.from),
        periodEnd: new Date(parsed.data.to),
        employeeId: parsed.data.employeeId,
        state: parsed.data.state
      }
    );
    return ok({ runs });
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}

