import { getPayrollYearEndInsuranceReconciliationReportQuerySchema } from "@/features/payroll/schemas";
import { getPayrollYearEndInsuranceReconciliationReport } from "@/features/payroll/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

function shouldAuditInsuranceReconciliationFailure(status: number) {
  return status === 403 || status === 409;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = getPayrollYearEndInsuranceReconciliationReportQuerySchema.safeParse({
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
    const result = await getPayrollYearEndInsuranceReconciliationReport(
      {
        actor,
        dataAccess
      },
      parsed.data
    );
    return ok(result);
  } catch (error) {
    if (isServiceError(error)) {
      if (shouldAuditInsuranceReconciliationFailure(error.status)) {
        try {
          await dataAccess.audit.append({
            action: "payroll.year_end.insurance_reconciliation_report.failed",
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
