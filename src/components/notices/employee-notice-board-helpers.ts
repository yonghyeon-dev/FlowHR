import type { NoticeItem, NoticeReadReceipt } from "@/features/notices/types";

export type EmployeeNoticeReadStatusFilter = "all" | "unread" | "read";

export function parseNotices(payload: unknown) {
  const notices = (payload as { notices?: NoticeItem[] } | null)?.notices;
  return Array.isArray(notices) ? notices : [];
}

export function parseReadNoticeIds(payload: unknown) {
  const ids = (payload as { readNoticeIds?: string[] } | null)?.readNoticeIds;
  return Array.isArray(ids) ? ids.filter((value) => typeof value === "string") : [];
}

export function parseReadReceipts(payload: unknown) {
  const receipts = (payload as { readReceipts?: NoticeReadReceipt[] } | null)?.readReceipts;
  return Array.isArray(receipts) ? receipts : [];
}

export function normalizeEmployeeNoticeReadStatusFilter(value: string): EmployeeNoticeReadStatusFilter {
  if (value === "unread" || value === "read") {
    return value;
  }
  return "all";
}

export function buildNoticeQuery(input: Record<string, string>) {
  const query = new URLSearchParams();
  Object.entries(input).forEach(([key, value]) => {
    if (!value.trim()) {
      return;
    }
    query.set(key, value.trim());
  });
  const text = query.toString();
  return text ? `?${text}` : "";
}

export function buildReadAtByNoticeIdMap(readReceipts: NoticeReadReceipt[]) {
  const map = new Map<string, string>();
  readReceipts.forEach((receipt) => {
    map.set(receipt.noticeId, receipt.readAt);
  });
  return map;
}

type FilterEmployeeNoticesInput = {
  notices: NoticeItem[];
  readNoticeIds: string[];
  searchQuery: string;
  unreadOnly: boolean;
  readStatusFilter: EmployeeNoticeReadStatusFilter;
};

export function filterEmployeeNotices({
  notices,
  readNoticeIds,
  searchQuery,
  unreadOnly,
  readStatusFilter
}: FilterEmployeeNoticesInput) {
  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  return notices.filter((notice) => {
    const isRead = readNoticeIds.includes(notice.id);
    if (unreadOnly && isRead) {
      return false;
    }
    if (readStatusFilter === "read" && !isRead) {
      return false;
    }
    if (readStatusFilter === "unread" && isRead) {
      return false;
    }
    if (!normalizedSearchQuery) {
      return true;
    }
    const title = notice.title.toLowerCase();
    const body = notice.body.toLowerCase();
    return title.includes(normalizedSearchQuery) || body.includes(normalizedSearchQuery);
  });
}
