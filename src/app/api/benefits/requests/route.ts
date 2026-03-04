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
const IS_PRODUCTION_RUNTIME = process.env.NODE_ENV === "production";

function canReviewRequests(role: string | null | undefined) {
  return role === "admin" || role === "manager";
}

function normalizeOrganizationId(value: string | null | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function resolveOrganizationScope(input: {
  actorOrganizationId: string | null | undefined;
  requestedOrganizationId: string | null | undefined;
}) {
  const actorOrganizationId = normalizeOrganizationId(input.actorOrganizationId);
  const requestedOrganizationId = normalizeOrganizationId(input.requestedOrganizationId);

  if (IS_PRODUCTION_RUNTIME) {
    return {
      organizationId: actorOrganizationId,
      mismatch:
        Boolean(actorOrganizationId) &&
        Boolean(requestedOrganizationId) &&
        actorOrganizationId !== requestedOrganizationId
    };
  }

  return {
    organizationId: requestedOrganizationId ?? actorOrganizationId ?? DEFAULT_ORG_ID,
    mismatch: false
  };
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
  if (!actor && IS_PRODUCTION_RUNTIME) {
    return fail(401, "benefits.request.list.unauthorized");
  }
  const { organizationId, mismatch } = resolveOrganizationScope({
    actorOrganizationId: actor?.organizationId,
    requestedOrganizationId: parsed.data.organizationId
  });
  if (mismatch) {
    return fail(403, "benefits.request.list.forbidden", {
      reason: "organization_scope_mismatch"
    });
  }
  if (!organizationId) {
    return fail(400, "benefits.request.list.organization_id_required");
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

  const { organizationId: targetOrganizationId, mismatch } = resolveOrganizationScope({
    actorOrganizationId: actor.organizationId,
    requestedOrganizationId: parsed.data.organizationId
  });
  if (mismatch) {
    return fail(403, "benefits.request.create.forbidden", {
      reason: "organization_scope_mismatch"
    });
  }
  if (!targetOrganizationId) {
    return fail(400, "benefits.request.create.organization_id_required");
  }

  const targetEmployeeId = canReviewRequests(actor.role) ? parsed.data.employeeId : actor.id;
  const benefit = await findBenefitCatalogItem(parsed.data.benefitId);
  if (!benefit) {
    return fail(404, "benefits.catalog.not_found", {
      benefitId: parsed.data.benefitId
    });
  }
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
