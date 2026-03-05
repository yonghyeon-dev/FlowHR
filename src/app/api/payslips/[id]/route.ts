import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

import {
  isPayslipActor,
  resolveEmployeeNameMap,
  resolvePayslipScope,
  toPayslipDetail
} from "../shared";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const actor = await readActor(request);
  if (!isPayslipActor(actor)) {
    return fail(403, "payslip.get.forbidden");
  }

  const { id } = await context.params;
  const payslipId = id.trim();
  if (!payslipId) {
    return fail(400, "payslip id is required");
  }

  const scope = resolvePayslipScope(actor);
  if (actor.role === "admin" && !scope.actorOrganizationId) {
    return fail(400, "payslip.get.organization_id_required");
  }

  const dataAccess = getRuntimeDataAccess();
  const run = await dataAccess.payroll.findById(payslipId);
  if (!run || run.state !== "CONFIRMED" || !run.employeeId) {
    return fail(404, "payslip not found");
  }

  const recipientId = run.employeeId.trim();
  if (!recipientId) {
    return fail(404, "payslip not found");
  }

  if (scope.actorOrganizationId && run.organizationId !== scope.actorOrganizationId) {
    return fail(404, "payslip not found");
  }
  if (actor.role === "employee" && recipientId !== actor.id) {
    return fail(403, "employees can only view their own payslip");
  }

  const employeeNameById = await resolveEmployeeNameMap(dataAccess, [recipientId]);
  const employeeName = employeeNameById.get(recipientId) ?? recipientId;
  const payslip = toPayslipDetail(run, employeeName);
  if (!payslip) {
    return fail(404, "payslip not found");
  }

  return ok(payslip);
}
