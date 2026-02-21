import { distributePayrollPayslipsSchema } from "@/features/payroll/schemas";
import { distributePayrollPayslips } from "@/features/payroll/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

function shouldAuditDistributionFailure(status: number) {
  return status === 403 || status === 409;
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = distributePayrollPayslipsSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const actor = await readActor(request);
  const dataAccess = getRuntimeDataAccess();

  try {
    const result = await distributePayrollPayslips(
      {
        actor,
        dataAccess
      },
      {
        periodStart: new Date(parsed.data.periodStart),
        periodEnd: new Date(parsed.data.periodEnd),
        employeeId: parsed.data.employeeId,
        deliveryChannel: parsed.data.deliveryChannel,
        dryRun: parsed.data.dryRun
      }
    );
    return ok(result);
  } catch (error) {
    if (isServiceError(error)) {
      if (shouldAuditDistributionFailure(error.status)) {
        try {
          await dataAccess.audit.append({
            action: "payroll.payslip_distribution.failed",
            entityType: "PayrollPeriod",
            actorRole: actor?.role ?? "system",
            actorId: actor?.id ?? undefined,
            payload: {
              status: error.status,
              message: error.message
            }
          });
        } catch {
          // Do not block response path by telemetry write failure.
        }
      }
      return fail(error.status, error.message, error.details);
    }
    throw error;
  }
}
