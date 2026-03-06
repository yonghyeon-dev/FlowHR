import { z } from "zod";

import type { DataAccess } from "@/features/shared/data-access";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import type { Actor } from "@/lib/actor";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";
import { DEFAULT_LOCALE } from "@/lib/i18n/locales";
import { translate, type MessageKey } from "@/lib/i18n/messages";

const createOnboardingTasksSchema = z.object({
  employeeId: z.string().trim().min(1)
});

const listOnboardingTasksQuerySchema = z.object({
  employeeId: z.string().trim().min(1)
});

const defaultTaskTitleKeys = [
  "admin.onboarding.defaultTask.signContract",
  "admin.onboarding.defaultTask.registerPayrollAccount",
  "admin.onboarding.defaultTask.confirmInsuranceEnrollment",
  "admin.onboarding.defaultTask.issueInternalAccount",
  "admin.onboarding.defaultTask.attendDepartmentOt"
] as const satisfies readonly MessageKey[];
const defaultTaskTitles = defaultTaskTitleKeys.map((key) => translate(DEFAULT_LOCALE, key));

async function syncEmployeeTasksFromTemplates(
  dataAccess: DataAccess,
  employeeId: string,
  options?: { assignWhenActiveOnly?: boolean }
) {
  const templates = await dataAccess.onboardingTaskTemplates.ensureDefaults(defaultTaskTitles);
  const existingTasks = await dataAccess.onboardingTasks.listByEmployee(employeeId);
  if (templates.length === 0) {
    return existingTasks;
  }

  if (options?.assignWhenActiveOnly) {
    const employee = await dataAccess.employees.findById(employeeId);
    if (!employee || employee.status !== "ACTIVE") {
      return existingTasks;
    }
  }

  const existingTitleSet = new Set(existingTasks.map((task) => task.title));
  let createdCount = 0;
  for (const template of templates) {
    if (existingTitleSet.has(template.title)) {
      continue;
    }
    await dataAccess.onboardingTasks.create({
      employeeId,
      title: template.title,
      status: "PENDING"
    });
    existingTitleSet.add(template.title);
    createdCount += 1;
  }

  if (createdCount === 0) {
    return existingTasks;
  }
  return dataAccess.onboardingTasks.listByEmployee(employeeId);
}

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
  const actor = await readActor(request);
  if (!actor) {
    return fail(401, "admin.onboarding.tasks.unauthorized");
  }

  const url = new URL(request.url);
  const parsed = listOnboardingTasksQuerySchema.safeParse({
    employeeId: url.searchParams.get("employeeId") ?? undefined
  });
  if (!parsed.success) {
    return fail(400, "invalid query", parsed.error.flatten());
  }
  if (!canReadEmployeeTasks(actor, parsed.data.employeeId)) {
    return fail(403, "admin.onboarding.tasks.forbidden", { reason: "admin_or_self_required" });
  }

  const tasks = await syncEmployeeTasksFromTemplates(getRuntimeDataAccess(), parsed.data.employeeId, {
    assignWhenActiveOnly: true
  });
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
  const tasks = await syncEmployeeTasksFromTemplates(dataAccess, parsed.data.employeeId);

  return ok({ tasks }, 201);
}
