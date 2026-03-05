import { z } from "zod";

import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
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

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  const url = new URL(request.url);
  const parsed = listOnboardingTasksQuerySchema.safeParse({
    employeeId: url.searchParams.get("employeeId") ?? undefined
  });
  if (!parsed.success) {
    return fail(400, "invalid query", parsed.error.flatten());
  }

  const tasks = await getRuntimeDataAccess().onboardingTasks.listByEmployee(parsed.data.employeeId);
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
