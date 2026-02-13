import { previewPayrollSchema } from "@/features/payroll/schemas";
import { previewPayroll } from "@/features/payroll/service";
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

  const parsed = previewPayrollSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  try {
    const result = await previewPayroll(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      {
        periodStart: new Date(parsed.data.periodStart),
        periodEnd: new Date(parsed.data.periodEnd),
        employeeId: parsed.data.employeeId,
        hourlyRateKrw: parsed.data.hourlyRateKrw,
        multipliers: parsed.data.multipliers
      }
    );
    return ok(result);
  } catch (error) {
    if (isServiceError(error)) {
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}
