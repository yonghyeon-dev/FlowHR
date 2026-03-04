import {
  createBenefitRequestSchema,
  listBenefitRequestsQuerySchema
} from "@/features/benefits/schemas";
import {
  createBenefitRequest,
  findBenefitCatalogItem,
  listBenefitRequests,
  summarizeBenefitRequests
} from "@/features/benefits/store";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

const DEFAULT_ORG_ID = "ORG-DEMO";

function canReviewRequests(role: string | null | undefined) {
  return role === "admin" || role === "manager";
}

function normalizeOrganizationId(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = listBenefitRequestsQuerySchema.safeParse({
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    employeeId: url.searchParams.get("employeeId") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    sort: url.searchParams.get("sort") ?? undefined
  });

  if (!parsed.success) {
    return fail(400, "invalid query", parsed.error.flatten());
  }

  const actor = await readActor(request);
  const isProduction = process.env.NODE_ENV === "production";
  if (!actor && isProduction) {
    return fail(401, "benefits.request.list.unauthorized");
  }
  const actorOrganizationId = normalizeOrganizationId(actor?.organizationId);
  const requestedOrganizationId = normalizeOrganizationId(parsed.data.organizationId);
  if (isProduction && actorOrganizationId && requestedOrganizationId && requestedOrganizationId !== actorOrganizationId) {
    return fail(403, "benefits.request.list.forbidden", {
      reason: "organization_scope_mismatch"
    });
  }
  const organizationId = isProduction
    ? actorOrganizationId
    : requestedOrganizationId ?? actorOrganizationId ?? DEFAULT_ORG_ID;
  if (!organizationId) {
    return fail(401, "benefits.request.list.unauthorized");
  }
  const isReviewer = canReviewRequests(actor?.role);
  const employeeId = isReviewer ? parsed.data.employeeId : (parsed.data.employeeId ?? actor?.id ?? undefined);
  const requests = await listBenefitRequests({
    organizationId,
    employeeId,
    status: parsed.data.status,
    sort: parsed.data.sort
  });

  return ok({ requests, summary: summarizeBenefitRequests(requests) });
}

export async function POST(request: Request) {
  const actor = await readActor(request);
  if (!actor) {
    return fail(401, "benefits.request.create.unauthorized");
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = createBenefitRequestSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const targetEmployeeId = canReviewRequests(actor.role) ? parsed.data.employeeId : actor.id;
  const benefit = await findBenefitCatalogItem(parsed.data.benefitId);
  if (!benefit) {
    return fail(404, "benefits.catalog.not_found", {
      benefitId: parsed.data.benefitId
    });
  }
  const targetOrganizationId = parsed.data.organizationId ?? actor.organizationId ?? DEFAULT_ORG_ID;
  if (benefit.organizationId !== targetOrganizationId) {
    return fail(409, "benefits.catalog.organization_mismatch", {
      benefitOrganizationId: benefit.organizationId,
      targetOrganizationId
    });
  }
  if (benefit.status !== "ACTIVE") {
    return fail(409, "benefits.catalog.inactive", {
      benefitId: benefit.id,
      currentStatus: benefit.status
    });
  }

  const created = await createBenefitRequest({
    organizationId: targetOrganizationId,
    benefitId: parsed.data.benefitId,
    employeeId: targetEmployeeId,
    amountKrw: parsed.data.amountKrw,
    reason: parsed.data.reason
  });

  return ok({ request: created }, 201);
}
