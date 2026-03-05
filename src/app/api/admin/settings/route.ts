import { z } from "zod";

import type { OrganizationEntity, UpdateOrganizationInput } from "@/features/shared/data-access";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { fail, ok } from "@/lib/http";

import { requireAdmin } from "../reports/shared";

const patchAdminSettingsSchema = z
  .object({
    fiscalYearStartMonth: z.number().int().min(1).max(12).optional(),
    standardWorkHoursPerDay: z.number().finite().min(1).max(24).optional(),
    standardWorkDaysPerWeek: z.number().int().min(1).max(7).optional(),
    overtimeThresholdHours: z.number().finite().nonnegative().max(168).optional(),
    payPeriod: z.enum(["MONTHLY", "BIWEEKLY"]).optional(),
    timezone: z.string().trim().min(1).optional(),
    currency: z
      .string()
      .trim()
      .regex(/^[A-Za-z]{3}$/)
      .transform((value) => value.toUpperCase())
      .optional()
  })
  .strict();

function toSettingsResponse(organization: OrganizationEntity) {
  return {
    fiscalYearStartMonth: organization.fiscalYearStartMonth,
    standardWorkHoursPerDay: organization.standardWorkHoursPerDay,
    standardWorkDaysPerWeek: organization.standardWorkDaysPerWeek,
    overtimeThresholdHours: organization.overtimeThresholdHours,
    payPeriod: organization.payPeriod,
    timezone: organization.timezone,
    currency: organization.currency
  };
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request, "admin.settings");
  if (!auth.ok) {
    return auth.response;
  }

  const organization = await getRuntimeDataAccess().organizations.findById(auth.organizationId);
  if (!organization) {
    return fail(404, "admin.settings.organization_not_found");
  }

  return ok(toSettingsResponse(organization));
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin(request, "admin.settings");
  if (!auth.ok) {
    return auth.response;
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = patchAdminSettingsSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const dataAccess = getRuntimeDataAccess();
  const organization = await dataAccess.organizations.findById(auth.organizationId);
  if (!organization) {
    return fail(404, "admin.settings.organization_not_found");
  }

  const updateInput: UpdateOrganizationInput = {
    ...(parsed.data.fiscalYearStartMonth !== undefined
      ? { fiscalYearStartMonth: parsed.data.fiscalYearStartMonth }
      : {}),
    ...(parsed.data.standardWorkHoursPerDay !== undefined
      ? { standardWorkHoursPerDay: parsed.data.standardWorkHoursPerDay }
      : {}),
    ...(parsed.data.standardWorkDaysPerWeek !== undefined
      ? { standardWorkDaysPerWeek: parsed.data.standardWorkDaysPerWeek }
      : {}),
    ...(parsed.data.overtimeThresholdHours !== undefined
      ? { overtimeThresholdHours: parsed.data.overtimeThresholdHours }
      : {}),
    ...(parsed.data.payPeriod !== undefined ? { payPeriod: parsed.data.payPeriod } : {}),
    ...(parsed.data.timezone !== undefined ? { timezone: parsed.data.timezone } : {}),
    ...(parsed.data.currency !== undefined ? { currency: parsed.data.currency } : {})
  };

  const updated = await dataAccess.organizations.update(auth.organizationId, updateInput);
  return ok(toSettingsResponse(updated));
}
