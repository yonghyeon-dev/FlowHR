import { z } from "zod";

import { ensureOnboardingTaskTemplates } from "@/features/onboarding/default-task-templates";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

const listQuerySchema = z.object({
  organizationId: z.string().trim().min(1).optional()
});

const createTemplateSchema = z.object({
  organizationId: z.string().trim().min(1).optional(),
  title: z.string().trim().min(1),
  sortOrder: z.coerce.number().int().min(0).optional(),
  active: z.boolean().optional()
});

function resolveOrganizationId(actorOrganizationId: string | null | undefined, requested?: string) {
  const requestedOrganizationId = requested?.trim() ?? "";
  const actorOrg = (actorOrganizationId ?? "").trim();
  if (requestedOrganizationId && actorOrg && requestedOrganizationId !== actorOrg) {
    return null;
  }
  if (requestedOrganizationId) {
    return requestedOrganizationId;
  }
  if (actorOrg) {
    return actorOrg;
  }
  return "";
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
  return { ok: true as const, actor };
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  const url = new URL(request.url);
  const parsed = listQuerySchema.safeParse({
    organizationId: url.searchParams.get("organizationId") ?? undefined
  });
  if (!parsed.success) {
    return fail(400, "invalid query", parsed.error.flatten());
  }

  const organizationId = resolveOrganizationId(auth.actor.organizationId, parsed.data.organizationId);
  if (organizationId === null) {
    return fail(403, "admin.onboarding.task_templates.forbidden", { reason: "cross_tenant_scope" });
  }
  if (!organizationId) {
    return fail(400, "organizationId is required");
  }

  const templates = await ensureOnboardingTaskTemplates(getRuntimeDataAccess(), organizationId);
  return ok({ templates });
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

  const parsed = createTemplateSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const organizationId = resolveOrganizationId(auth.actor.organizationId, parsed.data.organizationId);
  if (organizationId === null) {
    return fail(403, "admin.onboarding.task_templates.forbidden", { reason: "cross_tenant_scope" });
  }
  if (!organizationId) {
    return fail(400, "organizationId is required");
  }

  const template = await getRuntimeDataAccess().onboardingTaskTemplates.create({
    organizationId,
    title: parsed.data.title,
    sortOrder: parsed.data.sortOrder,
    active: parsed.data.active
  });

  return ok({ template }, 201);
}
