const CATEGORY_SEED_BY_LOCALE = {
  ko: [
    {
      key: "approvalRequest",
      title: "새 승인 요청",
      body: "승인 대기 큐에 새 항목이 등록되었습니다."
    },
    {
      key: "approvalResult",
      title: "승인 결과 업데이트",
      body: "요청 처리 상태가 변경되었습니다."
    },
    {
      key: "payslipReady",
      title: "명세서 발행",
      body: "이번 달 급여 명세서가 발행되었습니다."
    }
  ],
  en: [
    {
      key: "approvalRequest",
      title: "New approval request",
      body: "A new item entered the approval queue."
    },
    {
      key: "approvalResult",
      title: "Approval result updated",
      body: "Your request status has been updated."
    },
    {
      key: "payslipReady",
      title: "Payslip ready",
      body: "This month's payslip has been issued."
    }
  ]
};

const CATEGORY_LABEL_BY_LOCALE = {
  ko: {
    all: "전체",
    approvalRequest: "승인 요청",
    approvalResult: "승인 결과",
    payslipReady: "명세서 발행"
  },
  en: {
    all: "All",
    approvalRequest: "Approval request",
    approvalResult: "Approval result",
    payslipReady: "Payslip ready"
  }
};

function normalizeLocale(locale) {
  return locale === "en" ? "en" : "ko";
}

function resolveCategorySeed(locale) {
  return CATEGORY_SEED_BY_LOCALE[normalizeLocale(locale)];
}

export function resolveNotificationCategoryLabelMap(locale) {
  return CATEGORY_LABEL_BY_LOCALE[normalizeLocale(locale)];
}

export function sortNotificationsNewest(items) {
  return [...items].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function filterNotificationsByCategory(items, category) {
  if (!category || category === "all") {
    return items;
  }
  return items.filter((item) => item.category === category);
}

export function buildNotificationCategoryStats(items) {
  const stats = { all: { total: items.length, unread: 0 } };
  for (const item of items) {
    if (!stats[item.category]) {
      stats[item.category] = { total: 0, unread: 0 };
    }
    stats[item.category].total += 1;
    if (!item.read) {
      stats[item.category].unread += 1;
      stats.all.unread += 1;
    }
  }
  return stats;
}

export function appendLiveMockNotification(items, now = new Date(), locale = "ko") {
  const categorySeed = resolveCategorySeed(locale);
  const slot = categorySeed[items.length % categorySeed.length];
  const next = {
    id: `live-${now.getTime()}`,
    title: slot.title,
    body: slot.body,
    category: slot.key,
    createdAt: now.toISOString(),
    read: false,
    archivedAt: null
  };
  return [next, ...items];
}

export function formatSyncClock(iso) {
  if (!iso) {
    return "-";
  }
  return iso.replace("T", " ").replace(".000Z", "Z");
}
