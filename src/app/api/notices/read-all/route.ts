import { readAllNoticesSchema } from "@/features/notices/schemas";
import { markAllNoticesRead } from "@/features/notices/store";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

const DEFAULT_ORG_ID = "ORG-DEMO";
const IS_PRODUCTION_RUNTIME = process.env.NODE_ENV === "production";

function canManageNotices(role: string | null | undefined) {
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

export async function POST(request: Request) {
  const actor = await readActor(request);
  if (!actor?.id) {
    return fail(401, "notice.read_all.unauthorized");
  }

  let payload: { organizationId?: string; noticeIds?: string[] } = {};
  try {
    payload = (await request.json()) as { organizationId?: string; noticeIds?: string[] };
  } catch {
    payload = {};
  }

  const parsed = readAllNoticesSchema.safeParse({
    organizationId: payload.organizationId,
    noticeIds: payload.noticeIds
  });
  if (!parsed.success) {
    return fail(400, "invalid params", parsed.error.flatten());
  }

  const { organizationId, mismatch } = resolveOrganizationScope({
    actorOrganizationId: actor.organizationId,
    requestedOrganizationId: parsed.data.organizationId
  });
  if (mismatch) {
    return fail(403, "notice.read_all.forbidden", {
      reason: "organization_scope_mismatch"
    });
  }
  if (!organizationId) {
    return fail(400, "notice.read_all.organization_id_required");
  }
  const audience = canManageNotices(actor.role) ? "all" : "employees";
  const receipts = await markAllNoticesRead(
    { dataAccess: getRuntimeDataAccess() },
    {
      organizationId,
      actorId: actor.id,
      actorRole: actor.role ?? "employee",
      audience,
      noticeIds: parsed.data.noticeIds
    }
  );

  return ok({
    count: receipts.length,
    readNoticeIds: receipts.map((receipt) => receipt.noticeId),
    receipts
  });
}
