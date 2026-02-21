import { acknowledgePayrollYearEndFilingPackageSchema } from "@/features/payroll/schemas";
import { acknowledgePayrollYearEndFilingPackage } from "@/features/payroll/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

type RouteContext = {
  params: Promise<{ submissionId: string }>;
};

function shouldAuditFilingAckFailure(status: number) {
  return status === 403 || status === 404 || status === 409;
}

export async function POST(request: Request, context: RouteContext) {
  const { submissionId } = await context.params;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = acknowledgePayrollYearEndFilingPackageSchema.safeParse({
    ...(typeof payload === "object" && payload !== null ? payload : {}),
    submissionId
  });
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const actor = await readActor(request);
  const dataAccess = getRuntimeDataAccess();
  const entityId = `${parsed.data.year}_${parsed.data.employeeId}`;

  try {
    const result = await acknowledgePayrollYearEndFilingPackage(
      {
        actor,
        dataAccess
      },
      parsed.data
    );
    return ok(result);
  } catch (error) {
    if (isServiceError(error)) {
      if (shouldAuditFilingAckFailure(error.status)) {
        try {
          await dataAccess.audit.append({
            action: "payroll.year_end.filing_ack.failed",
            entityType: "PayrollYearEnd",
            entityId,
            actorRole: actor?.role ?? "system",
            actorId: actor?.id ?? undefined,
            payload: {
              status: error.status,
              message: error.message,
              submissionId
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
