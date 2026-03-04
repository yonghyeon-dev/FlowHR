import { z } from "zod";

import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

const updateOnboardingTaskSchema = z.object({
  status: z.literal("COMPLETED")
});

type RouteContext = {
  params: Promise<{ taskId: string }>;
};

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

export async function PATCH(request: Request, context: RouteContext) {
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

  const parsed = updateOnboardingTaskSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const { taskId } = await context.params;
  const normalizedTaskId = taskId.trim();
  if (!normalizedTaskId) {
    return fail(400, "invalid taskId");
  }

  const dataAccess = getRuntimeDataAccess();
  const existing = await dataAccess.onboardingTasks.findById(normalizedTaskId);
  if (!existing) {
    return fail(404, "admin.onboarding.tasks.not_found");
  }

  const task = await dataAccess.onboardingTasks.update(normalizedTaskId, {
    status: parsed.data.status
  });

  return ok({ task });
}
