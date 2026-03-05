import { z } from "zod";

import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

import {
  isPayslipActor,
  parsePayslipPeriod,
  resolveEmployeeNameMap,
  resolvePayslipScope,
  toPayslipSummary
} from "./shared";

const listPayslipsQuerySchema = z.object({
  period: z.string().trim().optional(),
  employeeId: z.string().trim().min(1).optional()
});

export async function GET(request: Request) {
  const actor = await readActor(request);
  if (!isPayslipActor(actor)) {
    return fail(403, "payslip.list.forbidden");
  }

  const url = new URL(request.url);
  const parsedQuery = listPayslipsQuerySchema.safeParse({
    period: url.searchParams.get("period") ?? undefined,
    employeeId: url.searchParams.get("employeeId") ?? undefined
  });
  if (!parsedQuery.success) {
    return fail(400, "invalid query", parsedQuery.error.flatten());
  }

  const parsedPeriod = parsePayslipPeriod(parsedQuery.data.period ?? null);
  if (!parsedPeriod) {
    return fail(400, "invalid query", {
      fieldErrors: {
        period: ["period must be YYYY-MM"]
      }
    });
  }

  const scope = resolvePayslipScope(actor);
  if (actor.role === "admin" && !scope.actorOrganizationId) {
    return fail(400, "payslip.list.organization_id_required");
  }

  const queryEmployeeId = parsedQuery.data.employeeId?.trim() ?? "";
  if (actor.role === "employee" && queryEmployeeId.length > 0 && queryEmployeeId !== actor.id) {
    return fail(403, "employees can only view their own payslips");
  }

  const targetEmployeeId = actor.role === "employee" ? actor.id : queryEmployeeId || undefined;
  const dataAccess = getRuntimeDataAccess();
  const runs = await dataAccess.payroll.listInPeriod({
    periodStart: parsedPeriod.periodStart,
    periodEnd: parsedPeriod.periodEnd,
    organizationId: scope.actorOrganizationId ?? undefined,
    employeeId: targetEmployeeId,
    state: "CONFIRMED"
  });

  const employeeNameById = await resolveEmployeeNameMap(
    dataAccess,
    runs.map((run) => run.employeeId ?? "")
  );

  const payslips = runs
    .map((run) => toPayslipSummary(run, employeeNameById))
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  return ok(payslips);
}
