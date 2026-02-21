import { issuePayrollYearEndWithholdingReceiptSchema } from "@/features/payroll/schemas";
import { issuePayrollYearEndWithholdingReceipt } from "@/features/payroll/service";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { isServiceError } from "@/features/shared/service-error";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

function shouldAuditYearEndReceiptFailure(status: number) {
  return status === 403 || status === 409;
}

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = issuePayrollYearEndWithholdingReceiptSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const actor = await readActor(request);
  const dataAccess = getRuntimeDataAccess();

  try {
    const result = await issuePayrollYearEndWithholdingReceipt(
      {
        actor,
        dataAccess
      },
      parsed.data
    );
    return ok(result);
  } catch (error) {
    if (isServiceError(error)) {
      if (shouldAuditYearEndReceiptFailure(error.status)) {
        try {
          await dataAccess.audit.append({
            action: "payroll.year_end.withholding_receipt.failed",
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
