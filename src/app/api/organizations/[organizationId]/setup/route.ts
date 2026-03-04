import { z } from "zod";

import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

const hhmmRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

const organizationSetupSchema = z.object({
  name: z.string().trim().min(1).optional(),
  businessRegistrationNumber: z.string().trim().min(1),
  industry: z.string().trim().min(1),
  representativeName: z.string().trim().min(1),
  workStartTime: z.string().trim().regex(hhmmRegex, "workStartTime must be HH:MM"),
  workEndTime: z.string().trim().regex(hhmmRegex, "workEndTime must be HH:MM"),
  workDays: z
    .array(z.number().int().min(1).max(7))
    .min(1)
    .max(7),
  timezone: z.string().trim().min(1)
});

type RouteContext = {
  params: Promise<{ organizationId: string }>;
};

async function requireAdmin(request: Request) {
  const actor = await readActor(request);
  if (!actor) {
    return {
      ok: false as const,
      response: fail(401, "organizations.setup.unauthorized")
    };
  }
  if (actor.role !== "admin") {
    return {
      ok: false as const,
      response: fail(403, "organizations.setup.forbidden", { reason: "admin_required" })
    };
  }
  const organizationId = actor.organizationId?.trim() ?? "";
  if (!organizationId) {
    return {
      ok: false as const,
      response: fail(400, "organizations.setup.organization_id_required")
    };
  }
  return {
    ok: true as const,
    actor,
    organizationId
  };
}

export async function POST(request: Request, context: RouteContext) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  const { organizationId } = await context.params;
  if (auth.organizationId !== organizationId) {
    return fail(403, "organizations.setup.forbidden", { reason: "organization_mismatch" });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = organizationSetupSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const dataAccess = getRuntimeDataAccess();
  const existingOrganization = await dataAccess.organizations.findById(organizationId);
  if (!existingOrganization) {
    return fail(404, "organizations.setup.organization_not_found");
  }

  const organization = await dataAccess.organizations.update(organizationId, {
    ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
    businessRegistrationNumber: parsed.data.businessRegistrationNumber,
    industry: parsed.data.industry,
    representativeName: parsed.data.representativeName,
    workStartTime: parsed.data.workStartTime,
    workEndTime: parsed.data.workEndTime,
    workDays: parsed.data.workDays,
    timezone: parsed.data.timezone,
    isOnboardingComplete: true
  });

  await dataAccess.audit.append({
    action: "organization.onboarding.completed",
    entityType: "Organization",
    entityId: organization.id,
    organizationId: organization.id,
    actorRole: auth.actor.role,
    actorId: auth.actor.id,
    payload: {
      businessRegistrationNumber: organization.businessRegistrationNumber,
      industry: organization.industry,
      representativeName: organization.representativeName,
      workStartTime: organization.workStartTime,
      workEndTime: organization.workEndTime,
      workDays: organization.workDays,
      timezone: organization.timezone
    }
  });

  return ok({ organization });
}
