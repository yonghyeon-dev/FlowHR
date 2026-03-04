import { z } from "zod";

import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import type { OrganizationEntity, UpdateOrganizationInput } from "@/features/shared/data-access";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

const fiscalYearStartRegex = /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

const patchOrganizationSettingsSchema = z
  .object({
    name: z.string().trim().min(1).optional(),
    businessNumber: z.string().trim().min(1).optional(),
    fiscalYearStart: z.string().trim().regex(fiscalYearStartRegex).optional(),
    workHoursPerDay: z.number().finite().positive().max(24).optional(),
    overtimeThreshold: z.number().finite().nonnegative().max(24).optional(),
    timezone: z.string().trim().min(1).optional()
  })
  .strict();

function toSettingsResponse(organization: OrganizationEntity) {
  return {
    name: organization.name,
    businessNumber: organization.businessRegistrationNumber,
    fiscalYearStart: organization.fiscalYearStart,
    workHoursPerDay: organization.workHoursPerDay,
    overtimeThreshold: organization.overtimeThreshold,
    timezone: organization.timezone
  };
}

async function requireAdmin(request: Request) {
  const actor = await readActor(request);
  if (!actor) {
    return {
      ok: false as const,
      response: fail(401, "admin.organization.settings.unauthorized")
    };
  }

  if (actor.role !== "admin") {
    return {
      ok: false as const,
      response: fail(403, "admin.organization.settings.forbidden", { reason: "admin_required" })
    };
  }

  const organizationId = actor.organizationId?.trim() ?? "";
  if (!organizationId) {
    return {
      ok: false as const,
      response: fail(400, "admin.organization.settings.organization_id_required")
    };
  }

  return {
    ok: true as const,
    organizationId
  };
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  const organization = await getRuntimeDataAccess().organizations.findById(auth.organizationId);
  if (!organization) {
    return fail(404, "admin.organization.settings.organization_not_found");
  }

  return ok({ settings: toSettingsResponse(organization) });
}

export async function PATCH(request: Request) {
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

  const parsed = patchOrganizationSettingsSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const dataAccess = getRuntimeDataAccess();
  const existing = await dataAccess.organizations.findById(auth.organizationId);
  if (!existing) {
    return fail(404, "admin.organization.settings.organization_not_found");
  }

  const updateInput: UpdateOrganizationInput = {
    ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
    ...(parsed.data.businessNumber !== undefined
      ? { businessRegistrationNumber: parsed.data.businessNumber }
      : {}),
    ...(parsed.data.fiscalYearStart !== undefined
      ? { fiscalYearStart: parsed.data.fiscalYearStart }
      : {}),
    ...(parsed.data.workHoursPerDay !== undefined
      ? { workHoursPerDay: parsed.data.workHoursPerDay }
      : {}),
    ...(parsed.data.overtimeThreshold !== undefined
      ? { overtimeThreshold: parsed.data.overtimeThreshold }
      : {}),
    ...(parsed.data.timezone !== undefined ? { timezone: parsed.data.timezone } : {})
  };

  const updated = await dataAccess.organizations.update(auth.organizationId, updateInput);
  return ok({ settings: toSettingsResponse(updated) });
}
