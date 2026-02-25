function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
}

const NOTIFICATION_HISTORY_COPY_BY_LOCALE = {
  ko: {
    categoryOptions: [
      { key: "all", label: "전체 분류" },
      { key: "approvalRequest", label: "승인 요청" },
      { key: "approvalResult", label: "승인 결과" },
      { key: "payslipReady", label: "명세서 발행" }
    ],
    readOptions: [
      { key: "all", label: "전체 읽음 상태" },
      { key: "unread", label: "읽지 않음만" },
      { key: "read", label: "읽음만" }
    ],
    archiveOptions: [
      { key: "all", label: "전체 보관 상태" },
      { key: "active", label: "활성만" },
      { key: "archived", label: "보관만" }
    ],
    archiveStateActive: "활성",
    archiveStateArchivedAt: "보관 시각"
  },
  en: {
    categoryOptions: [
      { key: "all", label: "All categories" },
      { key: "approvalRequest", label: "Approval request" },
      { key: "approvalResult", label: "Approval result" },
      { key: "payslipReady", label: "Payslip ready" }
    ],
    readOptions: [
      { key: "all", label: "All read states" },
      { key: "unread", label: "Unread only" },
      { key: "read", label: "Read only" }
    ],
    archiveOptions: [
      { key: "all", label: "All archive states" },
      { key: "active", label: "Active only" },
      { key: "archived", label: "Archived only" }
    ],
    archiveStateActive: "active",
    archiveStateArchivedAt: "archived at"
  }
};

function resolveHistoryCopy(locale) {
  return locale === "en" ? NOTIFICATION_HISTORY_COPY_BY_LOCALE.en : NOTIFICATION_HISTORY_COPY_BY_LOCALE.ko;
}

export function getNotificationHistoryCategoryOptions(locale = "ko") {
  return resolveHistoryCopy(locale).categoryOptions;
}

export function getNotificationHistoryReadOptions(locale = "ko") {
  return resolveHistoryCopy(locale).readOptions;
}

export function getNotificationHistoryArchiveOptions(locale = "ko") {
  return resolveHistoryCopy(locale).archiveOptions;
}

export const NOTIFICATION_HISTORY_CATEGORY_OPTIONS = getNotificationHistoryCategoryOptions();
export const NOTIFICATION_HISTORY_READ_OPTIONS = getNotificationHistoryReadOptions();
export const NOTIFICATION_HISTORY_ARCHIVE_OPTIONS = getNotificationHistoryArchiveOptions();

function hasArchive(item) {
  return Boolean(item?.archivedAt);
}

function matchesReadState(item, readState) {
  if (readState === "read") {
    return Boolean(item?.read);
  }
  if (readState === "unread") {
    return !item?.read;
  }
  return true;
}

function matchesArchiveState(item, archiveState) {
  if (archiveState === "archived") {
    return hasArchive(item);
  }
  if (archiveState === "active") {
    return !hasArchive(item);
  }
  return true;
}

function matchesCategory(item, category) {
  if (!category || category === "all") {
    return true;
  }
  return item?.category === category;
}

function matchesQuery(item, query) {
  const normalized = normalizeText(query);
  if (!normalized) {
    return true;
  }
  const haystack = normalizeText(`${item?.title ?? ""} ${item?.body ?? ""}`);
  return haystack.includes(normalized);
}

export function filterNotificationHistory(items, options = {}) {
  const { query = "", category = "all", readState = "all", archiveState = "all" } = options;
  return items.filter(
    (item) =>
      matchesCategory(item, category) &&
      matchesReadState(item, readState) &&
      matchesArchiveState(item, archiveState) &&
      matchesQuery(item, query)
  );
}

export function buildNotificationHistoryStats(items) {
  let active = 0;
  let archived = 0;
  let unread = 0;
  for (const item of items) {
    if (hasArchive(item)) {
      archived += 1;
    } else {
      active += 1;
    }
    if (!item.read) {
      unread += 1;
    }
  }
  return {
    total: items.length,
    active,
    archived,
    unread
  };
}

export function formatNotificationArchiveMeta(item, locale = "ko") {
  const copy = resolveHistoryCopy(locale);
  if (!item.archivedAt) {
    return copy.archiveStateActive;
  }
  return `${copy.archiveStateArchivedAt} ${item.archivedAt}`;
}

export function toggleNotificationArchive(items, notificationId, archived, now = new Date()) {
  const stamp = archived ? now.toISOString() : null;
  return items.map((item) => {
    if (item.id !== notificationId) {
      return item;
    }
    return {
      ...item,
      archivedAt: stamp
    };
  });
}

export function applyNotificationBulkAction(items, notificationIds, action, now = new Date()) {
  const ids = new Set(notificationIds);
  const stamp = now.toISOString();
  return items.map((item) => {
    if (!ids.has(item.id)) {
      return item;
    }
    if (action === "markRead") {
      return {
        ...item,
        read: true
      };
    }
    if (action === "archive") {
      return {
        ...item,
        archivedAt: stamp
      };
    }
    if (action === "unarchive") {
      return {
        ...item,
        archivedAt: null
      };
    }
    return item;
  });
}

export function pruneNotificationSelection(selectionMap, items) {
  const known = new Set(items.map((item) => item.id));
  const next = {};
  for (const id of Object.keys(selectionMap)) {
    if (known.has(id) && selectionMap[id]) {
      next[id] = true;
    }
  }
  return next;
}

export function mergeNotificationSelection(selectionMap, ids) {
  const next = { ...selectionMap };
  for (const id of ids) {
    next[id] = true;
  }
  return next;
}
