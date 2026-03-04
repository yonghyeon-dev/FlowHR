import { readNoticeSchema } from "@/features/notices/schemas";
import { markNoticeRead } from "@/features/notices/store";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

const DEFAULT_ORG_ID = "ORG-DEMO";
const IS_PRODUCTION_RUNTIME = process.env.NODE_ENV === "production";

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

type RouteContext = {
  params: Promise<{ noticeId: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const actor = await readActor(request);
  if (!actor?.id) {
    return fail(401, "notice.read.unauthorized");
  }

  let payload: { organizationId?: string } = {};
  try {
    payload = (await request.json()) as { organizationId?: string };
  } catch {
    payload = {};
  }

  const { noticeId } = await context.params;
  const parsed = readNoticeSchema.safeParse({
    noticeId,
    organizationId: payload.organizationId
  });
  if (!parsed.success) {
    return fail(400, "invalid params", parsed.error.flatten());
  }

  const { organizationId, mismatch } = resolveOrganizationScope({
    actorOrganizationId: actor.organizationId,
    requestedOrganizationId: parsed.data.organizationId
  });
  if (mismatch) {
    return fail(403, "notice.read.forbidden", {
      reason: "organization_scope_mismatch"
    });
  }
  if (!organizationId) {
    return fail(400, "notice.read.organization_id_required");
  }
  const receipt = await markNoticeRead(
    { dataAccess: getRuntimeDataAccess() },
    {
      organizationId,
      noticeId: parsed.data.noticeId,
      actorId: actor.id,
      actorRole: actor.role ?? "employee"
    }
  );
  if (!receipt) {
    return fail(404, "notice.not_found");
  }

  return ok({ receipt });
}
