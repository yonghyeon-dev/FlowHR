import { getPayrollYearEndFinalizedSettlementQuerySchema } from "@/features/payroll/schemas";
import { getPayrollYearEndFinalizedSettlement } from "@/features/payroll/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

function shouldAuditYearEndFinalizedSettlementFailure(status: number) {
  return status === 403 || status === 404 || status === 409;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = getPayrollYearEndFinalizedSettlementQuerySchema.safeParse({
    year: url.searchParams.get("year"),
    employeeId: url.searchParams.get("employeeId")
  });
  if (!parsed.success) {
    return fail(400, "invalid query", parsed.error.flatten());
  }

  const actor = await readActor(request);
  const dataAccess = getRuntimeDataAccess();
  const entityId = `${parsed.data.year}_${parsed.data.employeeId}`;

  try {
    const result = await getPayrollYearEndFinalizedSettlement(
      {
        actor,
        dataAccess
      },
      parsed.data
    );
    return ok(result);
  } catch (error) {
    if (isServiceError(error)) {
      if (shouldAuditYearEndFinalizedSettlementFailure(error.status)) {
        try {
          await dataAccess.audit.append({
            action: "payroll.year_end.finalized_settlement_read.failed",
            entityType: "PayrollYearEnd",
            entityId,
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
