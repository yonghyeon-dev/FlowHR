import { z } from "zod";

import { ensureEmployeeOnboardingTasks } from "@/features/onboarding/default-task-templates";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import type { Actor } from "@/lib/actor";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

const createOnboardingTasksSchema = z.object({
  employeeId: z.string().trim().min(1)
});

const listOnboardingTasksQuerySchema = z.object({
  employeeId: z.string().trim().min(1)
});

async function requireAdmin(request: Request) {
  const actor = await readActor(request);
  if (!actor) {
    return { ok: false as const, response: fail(401, "admin.onboarding.tasks.unauthorized") };
  }
  if (actor.role !== "admin") {
    return {
      ok: false as const,
      response: fail(403, "admin.onboarding.tasks.forbidden", { reason: "admin_required" })
    };
  }
  return { ok: true as const };
}

function canReadEmployeeTasks(actor: Actor, employeeId: string) {
  if (actor.role === "admin") {
    return true;
  }
  return actor.role === "employee" && actor.id === employeeId;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = listOnboardingTasksQuerySchema.safeParse({
    employeeId: url.searchParams.get("employeeId") ?? undefined
  });
  if (!parsed.success) {
    return fail(400, "invalid query", parsed.error.flatten());
  }

  const actor = await readActor(request);
  if (!actor) {
    return fail(401, "admin.onboarding.tasks.unauthorized");
  }
  if (!canReadEmployeeTasks(actor, parsed.data.employeeId)) {
    return fail(403, "admin.onboarding.tasks.forbidden", { reason: "admin_or_self_required" });
  }

  const dataAccess = getRuntimeDataAccess();
  const employee = await dataAccess.employees.findById(parsed.data.employeeId);
  if (employee?.organizationId) {
    await ensureEmployeeOnboardingTasks(dataAccess, {
      employeeId: parsed.data.employeeId,
      organizationId: employee.organizationId
    });
  }

  const tasks = await dataAccess.onboardingTasks.listByEmployee(parsed.data.employeeId);
  return ok({ tasks });
}

export async function POST(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = createOnboardingTasksSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const dataAccess = getRuntimeDataAccess();
  const employee = await dataAccess.employees.findById(parsed.data.employeeId);
  if (!employee) {
    return fail(404, "admin.onboarding.tasks.employee_not_found");
  }
  if (!employee.organizationId) {
    return fail(409, "admin.onboarding.tasks.organization_required");
  }

  const tasks = await ensureEmployeeOnboardingTasks(dataAccess, {
    employeeId: employee.id,
    organizationId: employee.organizationId
  });

  return ok({ tasks }, 201);
}
