import { acknowledgePayrollPayslipReceipt } from "@/features/payroll/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

type RouteContext = {
  params: Promise<{ runId: string }>;
};

function shouldAuditReceiptFailure(status: number) {
  return status === 403 || status === 409;
}

export async function POST(request: Request, context: RouteContext) {
  const { runId } = await context.params;
  const actor = await readActor(request);
  const dataAccess = getRuntimeDataAccess();

  try {
    const result = await acknowledgePayrollPayslipReceipt(
      {
        actor,
        dataAccess
      },
      {
        runId
      }
    );
    return ok(result);
  } catch (error) {
    if (isServiceError(error)) {
      if (shouldAuditReceiptFailure(error.status)) {
        try {
          await dataAccess.audit.append({
            action: "payroll.payslip_receipt_confirm.failed",
            entityType: "PayrollRun",
            entityId: runId,
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
