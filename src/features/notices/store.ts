import type { NoticeAudience, NoticeItem, NoticeReadReceipt, NoticeStatus } from "@/features/notices/types";

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
};

type ListNoticeReadReceiptsInput = {
  organizationId?: string;
  actorId?: string;
};

type MarkNoticeReadInput = {
  organizationId: string;
  noticeId: string;
  actorId: string;
};

type MarkAllNoticesReadInput = {
  organizationId: string;
  actorId: string;
  audience?: NoticeAudience | "all";
};

const DEFAULT_ORG_ID = "ORG-DEMO";
const INITIAL_NOTICE_STORE: NoticeItem[] = [
  {
    id: "NOTICE-1001",
    organizationId: DEFAULT_ORG_ID,
    title: "2월 급여 명세서 확인 안내",
    body: "2월 급여 명세서가 발행되었습니다. 직원 포털에서 수신 확인을 완료해 주세요.",
    audience: "employees",
    status: "PUBLISHED",
    publishAt: "2026-02-20T00:00:00.000Z",
    publishedAt: "2026-02-20T00:00:00.000Z",
    createdByActorId: "ADM-1001",
    createdAt: "2026-02-19T04:30:00.000Z",
    updatedAt: "2026-02-20T00:00:00.000Z"
  },
  {
    id: "NOTICE-1002",
    organizationId: DEFAULT_ORG_ID,
    title: "근태 정정 요청 제출 가이드",
    body: "출퇴근 정정 요청은 제출 전 근무일/시각을 다시 확인해 주세요.",
    audience: "all",
    status: "PUBLISHED",
    publishAt: "2026-02-18T00:00:00.000Z",
    publishedAt: "2026-02-18T00:00:00.000Z",
    createdByActorId: "ADM-1001",
    createdAt: "2026-02-17T04:30:00.000Z",
    updatedAt: "2026-02-18T00:00:00.000Z"
  },
  {
    id: "NOTICE-1003",
    organizationId: DEFAULT_ORG_ID,
    title: "복리후생 신청 오픈 예정",
    body: "복리후생 신청이 다음 주 월요일 오전 9시에 오픈됩니다.",
    audience: "employees",
    status: "SCHEDULED",
    publishAt: "2026-03-02T00:00:00.000Z",
    publishedAt: null,
    createdByActorId: "ADM-1001",
    createdAt: "2026-02-21T01:20:00.000Z",
    updatedAt: "2026-02-21T01:20:00.000Z"
  }
];

const noticeStore: NoticeItem[] = [...INITIAL_NOTICE_STORE];
const noticeReadStore: NoticeReadReceipt[] = [];

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

export function listNotices(input: ListNoticesInput = {}) {
  const audience = normalizeAudience(input.audience);
  const status = normalizeStatus(input.status);
  const organizationId = input.organizationId?.trim() || DEFAULT_ORG_ID;

  return noticeStore
    .filter((notice) => notice.organizationId === organizationId)
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
    })
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export function createNotice(input: CreateNoticeInput) {
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

  noticeStore.unshift(next);
  return next;
}

export function publishNotice(noticeId: string) {
  const target = noticeStore.find((notice) => notice.id === noticeId);
  if (!target) {
    return null;
  }
  const now = new Date().toISOString();
  target.status = "PUBLISHED";
  target.publishAt = target.publishAt ?? now;
  target.publishedAt = now;
  target.updatedAt = now;
  return target;
}

export function summarizeNotices(items: NoticeItem[]) {
  const total = items.length;
  const draft = items.filter((item) => item.status === "DRAFT").length;
  const scheduled = items.filter((item) => item.status === "SCHEDULED").length;
  const published = items.filter((item) => item.status === "PUBLISHED").length;
  return { total, draft, scheduled, published };
}

export function listNoticeReadReceipts(input: ListNoticeReadReceiptsInput = {}) {
  const organizationId = input.organizationId?.trim() || DEFAULT_ORG_ID;
  const actorId = input.actorId?.trim();

  return noticeReadStore
    .filter((receipt) => receipt.organizationId === organizationId)
    .filter((receipt) => (actorId ? receipt.actorId === actorId : true))
    .sort((a, b) => Date.parse(b.readAt) - Date.parse(a.readAt));
}

export function markNoticeRead(input: MarkNoticeReadInput) {
  const organizationId = input.organizationId.trim() || DEFAULT_ORG_ID;
  const actorId = input.actorId.trim();
  const noticeId = input.noticeId.trim();
  if (!actorId || !noticeId) {
    return null;
  }

  const target = noticeStore.find((notice) => notice.id === noticeId && notice.organizationId === organizationId);
  if (!target) {
    return null;
  }

  const now = new Date().toISOString();
  const existing = noticeReadStore.find(
    (receipt) =>
      receipt.organizationId === organizationId &&
      receipt.noticeId === noticeId &&
      receipt.actorId === actorId
  );
  if (existing) {
    existing.readAt = now;
    return existing;
  }

  const next: NoticeReadReceipt = {
    organizationId,
    noticeId,
    actorId,
    readAt: now
  };
  noticeReadStore.unshift(next);
  return next;
}

export function markAllNoticesRead(input: MarkAllNoticesReadInput) {
  const organizationId = input.organizationId.trim() || DEFAULT_ORG_ID;
  const actorId = input.actorId.trim();
  if (!actorId) {
    return [];
  }

  const notices = listNotices({
    organizationId,
    audience: input.audience ?? "all",
    publishedOnly: true
  });

  return notices
    .map((notice) =>
      markNoticeRead({
        organizationId,
        noticeId: notice.id,
        actorId
      })
    )
    .filter((receipt): receipt is NoticeReadReceipt => receipt !== null);
}

