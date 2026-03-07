import type {
  DataAccess,
  NoticeEntity,
  NoticeReadReceiptEntity
} from "@/features/shared/data-access";
import type { NoticeAudience, NoticeItem, NoticeReadReceipt, NoticeStatus } from "@/features/notices/types";

type NoticeStoreContext = {
  dataAccess: Pick<DataAccess, "notices" | "noticeReadReceipts" | "noticeNotifications" | "audit">;
};

type ListNoticesInput = {
  organizationId?: string;
  audience?: NoticeAudience | "all";
  status?: NoticeStatus | "all";
  publishedOnly?: boolean;
};

type CreateNoticeInput = {
  organizationId: string;
  title: string;
  body: string;
  audience: NoticeAudience;
  targetDepartmentIds?: string[];
  publishAt?: string | null;
  createdByActorId: string;
  actorRole?: string;
};

type UpdateNoticeInput = {
  organizationId: string;
  noticeId: string;
  title?: string;
  body?: string;
  audience?: NoticeAudience;
  targetDepartmentIds?: string[];
  publishAt?: string | null;
  actorId?: string;
  actorRole?: string;
};

type UpdateNoticeResult = {
  notice: NoticeItem | null;
  reason?: "not_found" | "published_locked";
};

type DeleteNoticeInput = {
  organizationId: string;
  noticeId: string;
  actorId?: string;
  actorRole?: string;
};

type DeleteNoticeResult = {
  notice: NoticeItem | null;
  reason?: "not_found" | "published_locked";
};

type PublishNoticeInput = {
  organizationId: string;
  noticeId: string;
  actorId?: string;
  actorRole?: string;
};

type ListNoticeReadReceiptsInput = {
  organizationId?: string;
  actorId?: string;
};

type MarkNoticeReadInput = {
  organizationId: string;
  noticeId: string;
  actorId: string;
  actorRole?: string;
};

type MarkAllNoticesReadInput = {
  organizationId: string;
  actorId: string;
  actorRole?: string;
  audience?: NoticeAudience | "all";
  noticeIds?: string[];
};

type NoticeCreatedAuditPayload = {
  version: 1;
  notice: NoticeItem;
};

type NoticeUpdatedAuditPayload = {
  version: 1;
  notice: NoticeItem;
  previousStatus: NoticeStatus;
  nextStatus: NoticeStatus;
};

type NoticeDeletedAuditPayload = {
  version: 1;
  notice: NoticeItem;
  previousStatus: NoticeStatus;
};

type NoticePublishedAuditPayload = {
  version: 1;
  noticeId: string;
  publishedAt: string;
  publishAt: string;
};

type NoticeReadAuditPayload = {
  version: 1;
  receipt: NoticeReadReceipt;
};

type NoticeNotificationEnqueuedAuditPayload = {
  version: 1;
  noticeId: string;
  organizationId: string;
  audience: NoticeAudience;
  channel: "in_app";
  enqueuedAt: string;
};

const NOTICE_ENTITY_TYPE = "Notice";
const NOTICE_CREATED_ACTION = "notice.created";
const NOTICE_UPDATED_ACTION = "notice.updated";
const NOTICE_DELETED_ACTION = "notice.deleted";
const NOTICE_PUBLISHED_ACTION = "notice.published";
const NOTICE_READ_ACTION = "notice.read";
const NOTICE_NOTIFICATION_ENQUEUED_ACTION = "notice.notification.enqueued";
const DEFAULT_ORG_ID = "ORG-DEMO";

function normalizeAudience(audience: NoticeAudience | "all" | undefined) {
  return audience === "all" || !audience ? null : audience;
}

function normalizeStatus(status: NoticeStatus | "all" | undefined) {
  return status === "all" || !status ? null : status;
}

function toIso(value: string | Date) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

function normalizeTargetDepartmentIds(targetDepartmentIds?: string[]) {
  if (!targetDepartmentIds || targetDepartmentIds.length === 0) {
    return [];
  }
  const normalized = targetDepartmentIds
    .map((departmentId) => departmentId.trim())
    .filter((departmentId) => departmentId.length > 0);
  return Array.from(new Set(normalized));
}

function toNoticeItem(entity: NoticeEntity): NoticeItem {
  return {
    id: entity.id,
    organizationId: entity.organizationId,
    title: entity.title,
    body: entity.body,
    audience: entity.audience,
    targetDepartmentIds: Array.isArray(entity.targetDepartmentIds) ? [...entity.targetDepartmentIds] : [],
    status: entity.status,
    publishAt: entity.publishAt ? entity.publishAt.toISOString() : null,
    publishedAt: entity.publishedAt ? entity.publishedAt.toISOString() : null,
    createdByActorId: entity.createdByActorId,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString()
  };
}

function toNoticeReadReceipt(entity: NoticeReadReceiptEntity): NoticeReadReceipt {
  return {
    organizationId: entity.organizationId,
    noticeId: entity.noticeId,
    actorId: entity.actorId,
    readAt: entity.readAt.toISOString()
  };
}

function applyAutoPublishStatus(notice: NoticeItem, asOfIso: string): NoticeItem {
  if (notice.status !== "SCHEDULED" || !notice.publishAt) {
    return notice;
  }
  const publishAtMillis = Date.parse(notice.publishAt);
  if (!Number.isFinite(publishAtMillis)) {
    return notice;
  }
  const asOfMillis = Date.parse(asOfIso);
  if (!Number.isFinite(asOfMillis) || publishAtMillis > asOfMillis) {
    return notice;
  }
  return {
    ...notice,
    status: "PUBLISHED",
    publishedAt: notice.publishedAt ?? notice.publishAt,
    updatedAt: notice.updatedAt
  };
}

async function listAllNotices(context: NoticeStoreContext, organizationId: string) {
  const rows = await context.dataAccess.notices.list({
    organizationId,
    limit: 5000
  });
  const asOfIso = new Date().toISOString();
  return rows
    .map((row) => applyAutoPublishStatus(toNoticeItem(row), asOfIso))
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

async function upsertReadReceiptWithAudit(
  context: NoticeStoreContext,
  input: {
    organizationId: string;
    noticeId: string;
    actorId: string;
    actorRole: string;
  }
): Promise<NoticeReadReceipt> {
  const receipt = toNoticeReadReceipt(
    await context.dataAccess.noticeReadReceipts.upsert({
      organizationId: input.organizationId,
      noticeId: input.noticeId,
      actorId: input.actorId,
      readAt: new Date()
    })
  );

  await context.dataAccess.audit.append({
    action: NOTICE_READ_ACTION,
    entityType: NOTICE_ENTITY_TYPE,
    entityId: input.noticeId,
    organizationId: input.organizationId,
    actorRole: input.actorRole,
    actorId: input.actorId,
    payload: {
      version: 1,
      receipt
    } satisfies NoticeReadAuditPayload
  });

  return receipt;
}

export async function listNotices(context: NoticeStoreContext, input: ListNoticesInput = {}) {
  const audience = normalizeAudience(input.audience);
  const status = normalizeStatus(input.status);
  const organizationId = input.organizationId?.trim() || DEFAULT_ORG_ID;

  const notices = await listAllNotices(context, organizationId);
  return notices
    .filter((notice) => {
      if (!audience) {
        return true;
      }
      if (notice.audience === "all") {
        return true;
      }
      return notice.audience === audience;
    })
    .filter((notice) => {
      if (!status) {
        return true;
      }
      return notice.status === status;
    })
    .filter((notice) => {
      if (!input.publishedOnly) {
        return true;
      }
      return notice.status === "PUBLISHED";
    });
}

export async function createNotice(context: NoticeStoreContext, input: CreateNoticeInput) {
  const now = new Date();
  const publishAtIso = input.publishAt ? toIso(input.publishAt) : null;
  const targetDepartmentIds = normalizeTargetDepartmentIds(input.targetDepartmentIds);
  const created = await context.dataAccess.notices.create({
    organizationId: input.organizationId.trim() || DEFAULT_ORG_ID,
    title: input.title.trim(),
    body: input.body.trim(),
    audience: input.audience,
    targetDepartmentIds,
    status: publishAtIso ? "SCHEDULED" : "DRAFT",
    publishAt: publishAtIso ? new Date(publishAtIso) : null,
    publishedAt: null,
    createdByActorId: input.createdByActorId,
    createdAt: now,
    updatedAt: now
  });

  const notice = toNoticeItem(created);
  await context.dataAccess.audit.append({
    action: NOTICE_CREATED_ACTION,
    entityType: NOTICE_ENTITY_TYPE,
    entityId: notice.id,
    organizationId: notice.organizationId,
    actorRole: input.actorRole ?? "admin",
    actorId: input.createdByActorId,
    payload: {
      version: 1,
      notice
    } satisfies NoticeCreatedAuditPayload
  });

  return notice;
}

export async function updateNotice(
  context: NoticeStoreContext,
  input: UpdateNoticeInput
): Promise<UpdateNoticeResult> {
  const organizationId = input.organizationId.trim() || DEFAULT_ORG_ID;
  const noticeId = input.noticeId.trim();
  if (!noticeId) {
    return { notice: null, reason: "not_found" };
  }

  const existing = await context.dataAccess.notices.findById(noticeId);
  if (!existing || existing.organizationId !== organizationId) {
    return { notice: null, reason: "not_found" };
  }
  if (existing.status === "PUBLISHED") {
    return { notice: null, reason: "published_locked" };
  }

  const nextPublishAt =
    input.publishAt !== undefined
      ? input.publishAt
        ? new Date(toIso(input.publishAt))
        : null
      : existing.publishAt;
  const nextStatus: NoticeStatus = nextPublishAt ? "SCHEDULED" : "DRAFT";
  const updated = await context.dataAccess.notices.update(existing.id, {
    title: input.title !== undefined ? input.title.trim() : existing.title,
    body: input.body !== undefined ? input.body.trim() : existing.body,
    audience: input.audience,
    targetDepartmentIds:
      input.targetDepartmentIds !== undefined
        ? normalizeTargetDepartmentIds(input.targetDepartmentIds)
        : existing.targetDepartmentIds,
    status: nextStatus,
    publishAt: nextPublishAt,
    publishedAt: null,
    updatedAt: new Date()
  });

  const notice = toNoticeItem(updated);
  await context.dataAccess.audit.append({
    action: NOTICE_UPDATED_ACTION,
    entityType: NOTICE_ENTITY_TYPE,
    entityId: notice.id,
    organizationId: notice.organizationId,
    actorRole: input.actorRole ?? "admin",
    actorId: input.actorId ?? "unknown",
    payload: {
      version: 1,
      notice,
      previousStatus: existing.status,
      nextStatus: notice.status
    } satisfies NoticeUpdatedAuditPayload
  });

  return { notice };
}

export async function deleteNotice(
  context: NoticeStoreContext,
  input: DeleteNoticeInput
): Promise<DeleteNoticeResult> {
  const organizationId = input.organizationId.trim() || DEFAULT_ORG_ID;
  const noticeId = input.noticeId.trim();
  if (!noticeId) {
    return { notice: null, reason: "not_found" };
  }

  const existing = await context.dataAccess.notices.findById(noticeId);
  if (!existing || existing.organizationId !== organizationId) {
    return { notice: null, reason: "not_found" };
  }
  if (existing.status === "PUBLISHED") {
    return { notice: null, reason: "published_locked" };
  }

  const deleted = await context.dataAccess.notices.delete(existing.id);
  const notice = toNoticeItem(deleted);
  await context.dataAccess.audit.append({
    action: NOTICE_DELETED_ACTION,
    entityType: NOTICE_ENTITY_TYPE,
    entityId: notice.id,
    organizationId: notice.organizationId,
    actorRole: input.actorRole ?? "admin",
    actorId: input.actorId ?? "unknown",
    payload: {
      version: 1,
      notice,
      previousStatus: existing.status
    } satisfies NoticeDeletedAuditPayload
  });

  return { notice };
}

export async function publishNotice(context: NoticeStoreContext, input: PublishNoticeInput) {
  const organizationId = input.organizationId.trim() || DEFAULT_ORG_ID;
  const noticeId = input.noticeId.trim();
  if (!noticeId) {
    return null;
  }

  const existing = await context.dataAccess.notices.findById(noticeId);
  if (!existing || existing.organizationId !== organizationId) {
    return null;
  }

  const publishedAt = new Date().toISOString();
  const publishAt = existing.publishAt ? existing.publishAt.toISOString() : publishedAt;
  const updated = await context.dataAccess.notices.update(existing.id, {
    status: "PUBLISHED",
    publishAt: new Date(publishAt),
    publishedAt: new Date(publishedAt),
    updatedAt: new Date(publishedAt)
  });

  await context.dataAccess.audit.append({
    action: NOTICE_PUBLISHED_ACTION,
    entityType: NOTICE_ENTITY_TYPE,
    entityId: existing.id,
    organizationId,
    actorRole: input.actorRole ?? "admin",
    actorId: input.actorId,
    payload: {
      version: 1,
      noticeId: existing.id,
      publishedAt,
      publishAt
    } satisfies NoticePublishedAuditPayload
  });

  await context.dataAccess.noticeNotifications.create({
    organizationId,
    noticeId: existing.id,
    audience: existing.audience,
    channel: "in_app",
    state: "QUEUED",
    enqueuedAt: new Date(publishedAt)
  });

  await context.dataAccess.audit.append({
    action: NOTICE_NOTIFICATION_ENQUEUED_ACTION,
    entityType: NOTICE_ENTITY_TYPE,
    entityId: existing.id,
    organizationId,
    actorRole: input.actorRole ?? "admin",
    actorId: input.actorId,
    payload: {
      version: 1,
      noticeId: existing.id,
      organizationId,
      audience: existing.audience,
      channel: "in_app",
      enqueuedAt: publishedAt
    } satisfies NoticeNotificationEnqueuedAuditPayload
  });

  return toNoticeItem(updated);
}

export function summarizeNotices(items: NoticeItem[]) {
  const total = items.length;
  const draft = items.filter((item) => item.status === "DRAFT").length;
  const scheduled = items.filter((item) => item.status === "SCHEDULED").length;
  const published = items.filter((item) => item.status === "PUBLISHED").length;
  return { total, draft, scheduled, published };
}

export async function listNoticeReadReceipts(
  context: NoticeStoreContext,
  input: ListNoticeReadReceiptsInput = {}
) {
  const organizationId = input.organizationId?.trim() || DEFAULT_ORG_ID;
  const actorId = input.actorId?.trim();
  const rows = await context.dataAccess.noticeReadReceipts.list({
    organizationId,
    actorId,
    limit: 5000
  });

  return rows
    .map(toNoticeReadReceipt)
    .sort((a, b) => Date.parse(b.readAt) - Date.parse(a.readAt));
}

export async function markNoticeRead(context: NoticeStoreContext, input: MarkNoticeReadInput) {
  const organizationId = input.organizationId.trim() || DEFAULT_ORG_ID;
  const actorId = input.actorId.trim();
  const noticeId = input.noticeId.trim();
  if (!actorId || !noticeId) {
    return null;
  }

  const notices = await listNotices(context, {
    organizationId,
    publishedOnly: true
  });
  const target = notices.find((notice) => notice.id === noticeId);
  if (!target) {
    return null;
  }

  return upsertReadReceiptWithAudit(context, {
    organizationId,
    noticeId,
    actorId,
    actorRole: input.actorRole ?? "employee"
  });
}

export async function markAllNoticesRead(context: NoticeStoreContext, input: MarkAllNoticesReadInput) {
  const organizationId = input.organizationId.trim() || DEFAULT_ORG_ID;
  const actorId = input.actorId.trim();
  if (!actorId) {
    return [];
  }

  const notices = await listNotices(context, {
    organizationId,
    audience: input.audience ?? "all",
    publishedOnly: true
  });
  const targetNoticeIdSet = input.noticeIds
    ? new Set(input.noticeIds.map((noticeId) => noticeId.trim()).filter((noticeId) => noticeId.length > 0))
    : null;
  const targetNotices =
    targetNoticeIdSet && targetNoticeIdSet.size > 0
      ? notices.filter((notice) => targetNoticeIdSet.has(notice.id))
      : notices;

  const receipts = await Promise.all(
    targetNotices.map((notice) =>
      upsertReadReceiptWithAudit(context, {
        organizationId,
        noticeId: notice.id,
        actorId,
        actorRole: input.actorRole ?? "employee"
      })
    )
  );

  return receipts;
}
