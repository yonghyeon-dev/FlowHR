import { z } from "zod";

import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

const updateTemplateSchema = z
  .object({
    title: z.string().trim().min(1).optional(),
    sortOrder: z.coerce.number().int().min(0).optional(),
    active: z.boolean().optional()
  })
  .refine((value) => Object.keys(value).length > 0, "at least one field is required");

type RouteContext = {
  params: Promise<{ templateId: string }>;
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
  return { ok: true as const, actor };
}

function checkTemplateScope(actorOrganizationId: string | null | undefined, templateOrganizationId: string) {
  const actorOrg = (actorOrganizationId ?? "").trim();
  if (!actorOrg) {
    return true;
  }
  return actorOrg === templateOrganizationId;
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

  const parsed = updateTemplateSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const { templateId } = await context.params;
  const normalizedTemplateId = templateId.trim();
  if (!normalizedTemplateId) {
    return fail(400, "invalid templateId");
  }

  const dataAccess = getRuntimeDataAccess();
  const existing = await dataAccess.onboardingTaskTemplates.findById(normalizedTemplateId);
  if (!existing) {
    return fail(404, "admin.onboarding.task_templates.not_found");
  }
  if (!checkTemplateScope(auth.actor.organizationId, existing.organizationId)) {
    return fail(404, "admin.onboarding.task_templates.not_found");
  }

  const template = await dataAccess.onboardingTaskTemplates.update(normalizedTemplateId, {
    title: parsed.data.title,
    sortOrder: parsed.data.sortOrder,
    active: parsed.data.active
  });

  return ok({ template });
}

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  const { templateId } = await context.params;
  const normalizedTemplateId = templateId.trim();
  if (!normalizedTemplateId) {
    return fail(400, "invalid templateId");
  }

  const dataAccess = getRuntimeDataAccess();
  const existing = await dataAccess.onboardingTaskTemplates.findById(normalizedTemplateId);
  if (!existing) {
    return fail(404, "admin.onboarding.task_templates.not_found");
  }
  if (!checkTemplateScope(auth.actor.organizationId, existing.organizationId)) {
    return fail(404, "admin.onboarding.task_templates.not_found");
  }

  const template = await dataAccess.onboardingTaskTemplates.delete(normalizedTemplateId);
  return ok({ template });
}
