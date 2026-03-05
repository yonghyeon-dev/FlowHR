import { z } from "zod";

import { resolveInsuranceRates } from "@/features/payroll/insurance-rates";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import type { UpdateOrganizationInput } from "@/features/shared/data-access";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

const rateSchema = z.number().finite().min(0).max(1);

const putInsuranceRatesSchema = z
  .object({
    nps: rateSchema.optional(),
    nhi: rateSchema.optional(),
    ei: rateSchema.optional(),
    wci: rateSchema.optional()
  })
  .strict();

async function requireAdmin(request: Request) {
  const actor = await readActor(request);
  if (!actor) {
    return {
      ok: false as const,
      response: fail(401, "admin.insurance.rates.unauthorized")
    };
  }
  if (actor.role !== "admin") {
    return {
      ok: false as const,
      response: fail(403, "admin.insurance.rates.forbidden", { reason: "admin_required" })
    };
  }
  const organizationId = actor.organizationId?.trim() ?? "";
  if (!organizationId) {
    return {
      ok: false as const,
      response: fail(400, "admin.insurance.rates.organization_id_required")
    };
  }
  return {
    ok: true as const,
    organizationId
  };
}

function toUpdateOrganizationInput(payload: z.infer<typeof putInsuranceRatesSchema>): UpdateOrganizationInput {
  return {
    ...(payload.nps !== undefined ? { insuranceRateNps: payload.nps } : {}),
    ...(payload.nhi !== undefined ? { insuranceRateNhi: payload.nhi } : {}),
    ...(payload.ei !== undefined ? { insuranceRateEi: payload.ei } : {}),
    ...(payload.wci !== undefined ? { insuranceRateWci: payload.wci } : {})
  };
}

export async function GET(request: Request) {
  const auth = await requireAdmin(request);
  if (!auth.ok) {
    return auth.response;
  }

  const organization = await getRuntimeDataAccess().organizations.findById(auth.organizationId);
  if (!organization) {
    return fail(404, "admin.insurance.rates.organization_not_found");
  }

  return ok(resolveInsuranceRates(organization));
}

export async function PUT(request: Request) {
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

  const parsed = putInsuranceRatesSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const dataAccess = getRuntimeDataAccess();
  const organization = await dataAccess.organizations.findById(auth.organizationId);
  if (!organization) {
    return fail(404, "admin.insurance.rates.organization_not_found");
  }

  const updated = await dataAccess.organizations.update(
    auth.organizationId,
    toUpdateOrganizationInput(parsed.data)
  );
  return ok(resolveInsuranceRates(updated));
}
