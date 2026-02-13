import { previewPayrollWithDeductionsSchema } from "@/features/payroll/schemas";
import { previewPayrollWithDeductions } from "@/features/payroll/service";
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

  const parsed = previewPayrollWithDeductionsSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  try {
    const result = await previewPayrollWithDeductions(
      {
        actor: await readActor(request),
        dataAccess: getRuntimeDataAccess()
      },
      {
        periodStart: new Date(parsed.data.periodStart),
        periodEnd: new Date(parsed.data.periodEnd),
        employeeId: parsed.data.employeeId,
        hourlyRateKrw: parsed.data.hourlyRateKrw,
        multipliers: parsed.data.multipliers,
        deductions: {
          withholdingTaxKrw: parsed.data.deductions.withholdingTaxKrw,
          socialInsuranceKrw: parsed.data.deductions.socialInsuranceKrw,
          otherDeductionsKrw: parsed.data.deductions.otherDeductionsKrw,
          breakdown: parsed.data.deductions.breakdown
        }
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
