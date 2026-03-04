import {
  MINIMUM_WAGE_CURRENCY,
  MINIMUM_WAGE_EFFECTIVE_DATE,
  MINIMUM_WAGE_HOURLY
} from "@/features/payroll/service";
import { ok } from "@/lib/http";

import { requireAdmin } from "../../reports/shared";

export async function GET(request: Request) {
  const auth = await requireAdmin(request, "admin.payroll.minimum-wage");
  if (!auth.ok) {
    return auth.response;
  }

  return ok({
    hourlyRate: MINIMUM_WAGE_HOURLY,
    effectiveDate: MINIMUM_WAGE_EFFECTIVE_DATE,
    currency: MINIMUM_WAGE_CURRENCY
  });
}
