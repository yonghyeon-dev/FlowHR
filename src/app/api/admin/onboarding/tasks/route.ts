import { z } from "zod";

import { onboardingDefaultTaskTitleKeys } from "@/features/onboarding/default-task-keys";
import {
  assignOnboardingTasksFromTemplates,
  ensureEmployeeOnboardingTasksForActiveStatus,
  seedMissingDefaultOnboardingTaskTemplates
} from "@/features/onboarding/tasks";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import type { Actor } from "@/lib/actor";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";
import { translate } from "@/lib/i18n/messages";

const createOnboardingTasksSchema = z.object({
  employeeId: z.string().trim().min(1)
});

const listOnboardingTasksQuerySchema = z.object({
  employeeId: z.string().trim().min(1)
});

const defaultTaskTitleKeys = onboardingDefaultTaskTitleKeys;
const defaultTaskTitles = defaultTaskTitleKeys.map((key) => translate(DEFAULT_LOCALE, key));

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
  if (employee) {
    await ensureEmployeeOnboardingTasksForActiveStatus({
      dataAccess,
      employee,
      defaultTitles: defaultTaskTitles
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
    return fail(404, "employee not found");
  }

  const existingTasks = await dataAccess.onboardingTasks.listByEmployee(parsed.data.employeeId);
  if (existingTasks.length > 0) {
    return ok({ tasks: existingTasks });
  }

  if (employee.organizationId) {
    const templates = await seedMissingDefaultOnboardingTaskTemplates({
      dataAccess,
      organizationId: employee.organizationId,
      defaultTitles: defaultTaskTitles
    });

    if (employee.status === "ACTIVE") {
      const tasks = await ensureEmployeeOnboardingTasksForActiveStatus({
        dataAccess,
        employee,
        defaultTitles: defaultTaskTitles
      });
      return ok({ tasks }, 201);
    }

    const tasks = await assignOnboardingTasksFromTemplates({
      dataAccess,
      employeeId: employee.id,
      templates
    });
    return ok({ tasks }, 201);
  }

  const tasks = await Promise.all(
    defaultTaskTitles.map((title) =>
      dataAccess.onboardingTasks.create({
        employeeId: parsed.data.employeeId,
        title,
        status: "PENDING"
      })
    )
  );

  return ok({ tasks }, 201);
}
