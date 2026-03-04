import { deleteNoticeSchema, updateNoticeSchema } from "@/features/notices/schemas";
import { deleteNotice, updateNotice } from "@/features/notices/store";
import { getRuntimeDataAccess } from "@/features/shared/runtime-data-access";
import { readActor } from "@/lib/actor";
import { fail, ok } from "@/lib/http";

const DEFAULT_ORG_ID = "ORG-DEMO";
const IS_PRODUCTION_RUNTIME = process.env.NODE_ENV === "production";

function canManageNotices(role: string | null | undefined) {
  return role === "admin" || role === "manager";
}

function resolveActorOrganizationId(organizationId: string | null | undefined) {
  const normalized = organizationId?.trim();
  if (normalized) {
    return normalized;
  }
  return IS_PRODUCTION_RUNTIME ? null : DEFAULT_ORG_ID;
}

type RouteContext = {
  params: Promise<{ noticeId: string }>;
};

type UpdateNoticeRequestBody = {
  title?: string;
  body?: string;
  audience?: "all" | "employees" | "admins";
  targetDepartmentIds?: string[];
  publishAt?: string | null;
};

export async function PATCH(request: Request, context: RouteContext) {
  const actor = await readActor(request);
  if (!canManageNotices(actor?.role)) {
    return fail(403, "notice.update.forbidden", {
      reason: "admin_or_manager_required"
    });
  }

  let payload: UpdateNoticeRequestBody = {};
  try {
    payload = (await request.json()) as UpdateNoticeRequestBody;
  } catch {
    return fail(400, "invalid JSON body");
  }

  const { noticeId } = await context.params;
  const parsed = updateNoticeSchema.safeParse({
    noticeId,
    title: payload.title,
    body: payload.body,
    audience: payload.audience,
    targetDepartmentIds: payload.targetDepartmentIds,
    publishAt: payload.publishAt
  });
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const organizationId = resolveActorOrganizationId(actor?.organizationId);
  if (!organizationId) {
    return fail(400, "notice.update.organization_id_required");
  }

  const result = await updateNotice(
    { dataAccess: getRuntimeDataAccess() },
    {
      organizationId,
      noticeId: parsed.data.noticeId,
      title: parsed.data.title,
      body: parsed.data.body,
      audience: parsed.data.audience,
      targetDepartmentIds: parsed.data.targetDepartmentIds,
      publishAt: parsed.data.publishAt,
      actorId: actor?.id,
      actorRole: actor?.role ?? "admin"
    }
  );

  if (!result.notice) {
    if (result.reason === "published_locked") {
      return fail(409, "notice.update.published_locked");
    }
    return fail(404, "notice.not_found");
  }

  return ok({ notice: result.notice });
}

export async function DELETE(request: Request, context: RouteContext) {
  const actor = await readActor(request);
  if (!canManageNotices(actor?.role)) {
    return fail(403, "notice.delete.forbidden", {
      reason: "admin_or_manager_required"
    });
  }

  const { noticeId } = await context.params;
  const parsed = deleteNoticeSchema.safeParse({ noticeId });
  if (!parsed.success) {
    return fail(400, "invalid payload", parsed.error.flatten());
  }

  const organizationId = resolveActorOrganizationId(actor?.organizationId);
  if (!organizationId) {
    return fail(400, "notice.delete.organization_id_required");
  }

  const result = await deleteNotice(
    { dataAccess: getRuntimeDataAccess() },
    {
      organizationId,
      noticeId: parsed.data.noticeId,
      actorId: actor?.id,
      actorRole: actor?.role ?? "admin"
    }
  );

  if (!result.notice) {
    if (result.reason === "published_locked") {
      return fail(409, "notice.delete.published_locked");
    }
    return fail(404, "notice.not_found");
  }

  return ok({ notice: result.notice });
}
