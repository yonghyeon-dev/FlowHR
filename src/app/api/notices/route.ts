import { createNoticeSchema, listNoticesQuerySchema } from "@/features/notices/schemas";
import {
  createNotice,
  listNoticeReadReceipts,
  listNotices,
  summarizeNotices
} from "@/features/notices/store";
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

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = listNoticesQuerySchema.safeParse({
    organizationId: url.searchParams.get("organizationId") ?? undefined,
    audience: url.searchParams.get("audience") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    publishedOnly: url.searchParams.get("publishedOnly") ?? undefined
  });

  if (!parsed.success) {
    return fail(400, "invalid query", parsed.error.flatten());
  }

  const actor = await readActor(request);
  if (!actor && IS_PRODUCTION_RUNTIME) {
    return fail(401, "notice.list.unauthorized");
  }

  const { organizationId, mismatch } = resolveOrganizationScope({
    actorOrganizationId: actor?.organizationId,
    requestedOrganizationId: parsed.data.organizationId
  });
  if (mismatch) {
    return fail(403, "notice.list.forbidden", {
      reason: "organization_scope_mismatch"
    });
  }
  if (!organizationId) {
    return fail(400, "notice.list.organization_id_required");
  }

  const isAdminActor = canManageNotices(actor?.role);
  const audience = isAdminActor ? parsed.data.audience : "employees";
  const context = { dataAccess: getRuntimeDataAccess() };
  const notices = await listNotices(context, {
    organizationId,
    audience,
    status: parsed.data.status,
    publishedOnly: parsed.data.publishedOnly ?? !isAdminActor
  });
  const readReceipts = isAdminActor
    ? await listNoticeReadReceipts(context, { organizationId })
    : actor?.id && actor.id.trim().length > 0
      ? await listNoticeReadReceipts(context, { organizationId, actorId: actor.id })
      : [];

  return ok({
    notices,
    summary: summarizeNotices(notices),
    readReceipts,
    readNoticeIds: readReceipts.map((receipt) => receipt.noticeId)
  });
}

export async function POST(request: Request) {
  const actor = await readActor(request);
  if (!canManageNotices(actor?.role)) {
    return fail(403, "notice.create.forbidden", {
      reason: "admin_or_manager_required"
    });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return fail(400, "invalid JSON body");
  }

  const parsed = createNoticeSchema.safeParse(payload);
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const { organizationId, mismatch } = resolveOrganizationScope({
    actorOrganizationId: actor?.organizationId,
    requestedOrganizationId: parsed.data.organizationId
  });
  if (mismatch) {
    return fail(403, "notice.create.forbidden", {
      reason: "organization_scope_mismatch"
    });
  }
  if (!organizationId) {
    return fail(400, "notice.create.organization_id_required");
  }

  const created = await createNotice(
    { dataAccess: getRuntimeDataAccess() },
    {
      organizationId,
      title: parsed.data.title,
      body: parsed.data.body,
      audience: parsed.data.audience,
      publishAt: parsed.data.publishAt,
      createdByActorId: actor?.id ?? "unknown",
      actorRole: actor?.role ?? "admin"
    }
  );

  return ok({ notice: created }, 201);
}
