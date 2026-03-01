import type { DataAccess } from "@/features/shared/data-access";
import type { NoticeAudience, NoticeItem, NoticeReadReceipt, NoticeStatus } from "@/features/notices/types";

type NoticeStoreContext = {
  dataAccess: Pick<DataAccess, "audit">;
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
  publishAt?: string | null;
  createdByActorId: string;
  actorRole?: string;
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
};

type NoticeCreatedAuditPayload = {
  version: 1;
  notice: NoticeItem;
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
const NOTICE_PUBLISHED_ACTION = "notice.published";
const NOTICE_READ_ACTION = "notice.read";
const NOTICE_NOTIFICATION_ENQUEUED_ACTION = "notice.notification.enqueued";
const NOTICE_AUDIT_ACTIONS = [NOTICE_CREATED_ACTION, NOTICE_PUBLISHED_ACTION, NOTICE_READ_ACTION] as const;
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

function nextNoticeId() {
  const stamp = Date.now();
  const random = Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, "0");
  return `NOTICE-${stamp}-${random}`;
}

function toNoticeCreatedPayload(payload: unknown): NoticeCreatedAuditPayload | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const candidate = payload as Partial<NoticeCreatedAuditPayload>;
  if (!candidate.notice || typeof candidate.notice !== "object") {
    return null;
  }
  const notice = candidate.notice as NoticeItem;
  if (
    typeof notice.id !== "string" ||
    typeof notice.organizationId !== "string" ||
    typeof notice.title !== "string" ||
    typeof notice.body !== "string" ||
    typeof notice.createdByActorId !== "string" ||
    typeof notice.createdAt !== "string" ||
    typeof notice.updatedAt !== "string"
  ) {
    return null;
  }
  if (notice.audience !== "all" && notice.audience !== "employees" && notice.audience !== "admins") {
    return null;
  }
  if (notice.status !== "DRAFT" && notice.status !== "SCHEDULED" && notice.status !== "PUBLISHED") {
    return null;
  }
  return {
    version: 1,
    notice
  };
}

function toNoticePublishedPayload(payload: unknown): NoticePublishedAuditPayload | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const candidate = payload as Partial<NoticePublishedAuditPayload>;
  if (
    typeof candidate.noticeId !== "string" ||
    typeof candidate.publishedAt !== "string" ||
    typeof candidate.publishAt !== "string"
  ) {
    return null;
  }
  return {
    version: 1,
    noticeId: candidate.noticeId,
    publishedAt: candidate.publishedAt,
    publishAt: candidate.publishAt
  };
}

function toNoticeReadPayload(payload: unknown): NoticeReadAuditPayload | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }
  const candidate = payload as Partial<NoticeReadAuditPayload>;
  if (!candidate.receipt || typeof candidate.receipt !== "object") {
    return null;
  }
  const receipt = candidate.receipt as NoticeReadReceipt;
  if (
    typeof receipt.noticeId !== "string" ||
    typeof receipt.organizationId !== "string" ||
    typeof receipt.actorId !== "string" ||
    typeof receipt.readAt !== "string"
  ) {
    return null;
  }
  return {
    version: 1,
    receipt
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

async function listNoticeAuditEntries(context: NoticeStoreContext, organizationId: string) {
  return context.dataAccess.audit.list({
    actions: [...NOTICE_AUDIT_ACTIONS],
    entityType: NOTICE_ENTITY_TYPE,
    organizationId,
    limit: 5000
  });
}

async function listAllNotices(context: NoticeStoreContext, organizationId: string) {
  const logs = await listNoticeAuditEntries(context, organizationId);
  const noticeById = new Map<string, NoticeItem>();

  for (const log of logs) {
    if (log.action === NOTICE_CREATED_ACTION) {
      const createdPayload = toNoticeCreatedPayload(log.payload);
      if (!createdPayload) {
        continue;
      }
      if (createdPayload.notice.organizationId !== organizationId) {
        continue;
      }
      noticeById.set(createdPayload.notice.id, createdPayload.notice);
      continue;
    }

    if (log.action === NOTICE_PUBLISHED_ACTION) {
      const publishedPayload = toNoticePublishedPayload(log.payload);
      if (!publishedPayload) {
        continue;
      }
      const target = noticeById.get(publishedPayload.noticeId);
      if (!target) {
        continue;
      }
      noticeById.set(publishedPayload.noticeId, {
        ...target,
        status: "PUBLISHED",
        publishAt: publishedPayload.publishAt,
        publishedAt: publishedPayload.publishedAt,
        updatedAt: publishedPayload.publishedAt
      });
    }
  }

  const asOfIso = new Date().toISOString();
  return Array.from(noticeById.values())
    .map((notice) => applyAutoPublishStatus(notice, asOfIso))
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
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
  const now = new Date().toISOString();
  const publishAt = input.publishAt ? toIso(input.publishAt) : null;
  const next: NoticeItem = {
    id: nextNoticeId(),
    organizationId: input.organizationId.trim() || DEFAULT_ORG_ID,
    title: input.title.trim(),
    body: input.body.trim(),
    audience: input.audience,
    status: publishAt ? "SCHEDULED" : "DRAFT",
    publishAt,
    publishedAt: null,
    createdByActorId: input.createdByActorId,
    createdAt: now,
    updatedAt: now
  };

  await context.dataAccess.audit.append({
    action: NOTICE_CREATED_ACTION,
    entityType: NOTICE_ENTITY_TYPE,
    entityId: next.id,
    organizationId: next.organizationId,
    actorRole: input.actorRole ?? "admin",
    actorId: input.createdByActorId,
    payload: {
      version: 1,
      notice: next
    } satisfies NoticeCreatedAuditPayload
  });

  return next;
}

export async function publishNotice(context: NoticeStoreContext, input: PublishNoticeInput) {
  const organizationId = input.organizationId.trim() || DEFAULT_ORG_ID;
  const noticeId = input.noticeId.trim();
  if (!noticeId) {
    return null;
  }

  const notices = await listAllNotices(context, organizationId);
  const target = notices.find((notice) => notice.id === noticeId);
  if (!target) {
    return null;
  }

  const publishedAt = new Date().toISOString();
  const publishAt = target.publishAt ?? publishedAt;
  await context.dataAccess.audit.append({
    action: NOTICE_PUBLISHED_ACTION,
    entityType: NOTICE_ENTITY_TYPE,
    entityId: target.id,
    organizationId,
    actorRole: input.actorRole ?? "admin",
    actorId: input.actorId,
    payload: {
      version: 1,
      noticeId: target.id,
      publishedAt,
      publishAt
    } satisfies NoticePublishedAuditPayload
  });

  await context.dataAccess.audit.append({
    action: NOTICE_NOTIFICATION_ENQUEUED_ACTION,
    entityType: NOTICE_ENTITY_TYPE,
    entityId: target.id,
    organizationId,
    actorRole: input.actorRole ?? "admin",
    actorId: input.actorId,
    payload: {
      version: 1,
      noticeId: target.id,
      organizationId,
      audience: target.audience,
      channel: "in_app",
      enqueuedAt: publishedAt
    } satisfies NoticeNotificationEnqueuedAuditPayload
  });

  return {
    ...target,
    status: "PUBLISHED" as const,
    publishAt,
    publishedAt,
    updatedAt: publishedAt
  };
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
  const logs = await context.dataAccess.audit.list({
    actions: [NOTICE_READ_ACTION],
    entityType: NOTICE_ENTITY_TYPE,
    organizationId,
    limit: 5000
  });

  const receiptByNoticeActor = new Map<string, NoticeReadReceipt>();
  for (const log of logs) {
    const payload = toNoticeReadPayload(log.payload);
    if (!payload) {
      continue;
    }
    if (payload.receipt.organizationId !== organizationId) {
      continue;
    }
    const key = `${payload.receipt.noticeId}::${payload.receipt.actorId}`;
    const existing = receiptByNoticeActor.get(key);
    if (!existing || Date.parse(existing.readAt) <= Date.parse(payload.receipt.readAt)) {
      receiptByNoticeActor.set(key, payload.receipt);
    }
  }

  return Array.from(receiptByNoticeActor.values())
    .filter((receipt) => (actorId ? receipt.actorId === actorId : true))
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

  const receipt: NoticeReadReceipt = {
    organizationId,
    noticeId,
    actorId,
    readAt: new Date().toISOString()
  };
  await context.dataAccess.audit.append({
    action: NOTICE_READ_ACTION,
    entityType: NOTICE_ENTITY_TYPE,
    entityId: noticeId,
    organizationId,
    actorRole: input.actorRole ?? "employee",
    actorId,
    payload: {
      version: 1,
      receipt
    } satisfies NoticeReadAuditPayload
  });

  return receipt;
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

  const receipts = await Promise.all(
    notices.map((notice) =>
      markNoticeRead(context, {
        organizationId,
        noticeId: notice.id,
        actorId,
        actorRole: input.actorRole
      })
    )
  );
  return receipts.filter((receipt): receipt is NoticeReadReceipt => receipt !== null);
}
