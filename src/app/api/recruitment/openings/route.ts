import {
  createRecruitmentOpeningSchema,
  listRecruitmentOpeningsQuerySchema
} from "@/features/recruitment/schemas";
import { createRecruitmentOpening, listRecruitmentOpenings } from "@/features/recruitment/store";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

const DEFAULT_ORG_ID = "ORG-DEMO";

function canManageOpenings(role: string | null | undefined) {
  return role === "admin" || role === "manager";
}

function normalizeOrganizationId(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = listRecruitmentOpeningsQuerySchema.safeParse({
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    status: url.searchParams.get("status") ?? undefined
  });

  if (!parsed.success) {
    return fail(400, "invalid query", parsed.error.flatten());
  }

  const actor = await readActor(request);
  const isProduction = process.env.NODE_ENV === "production";
  if (!actor && isProduction) {
    return fail(401, "recruitment.opening.list.unauthorized");
  }
  const actorOrganizationId = normalizeOrganizationId(actor?.organizationId);
  const requestedOrganizationId = normalizeOrganizationId(parsed.data.organizationId);
  if (actorOrganizationId && requestedOrganizationId && requestedOrganizationId !== actorOrganizationId) {
    return fail(403, "recruitment.opening.list.forbidden", {
      reason: "organization_scope_mismatch"
    });
  }
  const organizationId = isProduction
    ? actorOrganizationId
    : actorOrganizationId ?? requestedOrganizationId ?? DEFAULT_ORG_ID;
  if (!organizationId) {
    return fail(401, "recruitment.opening.list.unauthorized");
  }
  const openings = await listRecruitmentOpenings({
    organizationId,
    status: parsed.data.status
  });

  return ok({ openings });
}

export async function POST(request: Request) {
  const actor = await readActor(request);
  if (!canManageOpenings(actor?.role)) {
    return fail(403, "recruitment.opening.create.forbidden", {
      reason: "admin_or_manager_required"
    });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = createRecruitmentOpeningSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }
  const actorOrganizationId = normalizeOrganizationId(actor?.organizationId);
  const requestedOrganizationId = normalizeOrganizationId(parsed.data.organizationId);
  if (actorOrganizationId && requestedOrganizationId && requestedOrganizationId !== actorOrganizationId) {
    return fail(403, "recruitment.opening.create.forbidden", {
      reason: "organization_scope_mismatch"
    });
  }
  const organizationId = actorOrganizationId ?? requestedOrganizationId ?? DEFAULT_ORG_ID;

  const created = await createRecruitmentOpening({
    organizationId,
    title: parsed.data.title,
    department: parsed.data.department,
    employmentType: parsed.data.employmentType,
    status: parsed.data.status
  });

  return ok({ opening: created }, 201);
}
