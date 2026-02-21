import { listPayrollYearEndFilingAckCatalog } from "@/features/payroll/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

function shouldAuditFilingAckCatalogFailure(status: number) {
  return status === 403 || status === 409;
}

export async function GET(request: Request) {
  const actor = await readActor(request);
  const dataAccess = getRuntimeDataAccess();

  try {
    const result = await listPayrollYearEndFilingAckCatalog({
      actor,
      dataAccess
    });
    return ok(result);
  } catch (error) {
    if (isServiceError(error)) {
      if (shouldAuditFilingAckCatalogFailure(error.status)) {
        try {
          await dataAccess.audit.append({
            action: "payroll.year_end.filing_ack_catalog.failed",
            entityType: "PayrollYearEnd",
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
