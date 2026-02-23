const CATEGORY_SEED = [
  {
    key: "approvalRequest",
    title: "승인 요청 도착",
    body: "새 승인 요청이 접수되었습니다."
  },
  {
    key: "approvalResult",
    title: "요청 처리 결과",
    body: "요청 상태가 업데이트되었습니다."
  },
  {
    key: "payslipReady",
    title: "명세서 발행 안내",
    body: "이번 달 명세서가 발행되었습니다."
  }
];

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

export function appendLiveMockNotification(items, now = new Date()) {
  const slot = CATEGORY_SEED[items.length % CATEGORY_SEED.length];
  const next = {
    id: `live-${now.getTime()}`,
    title: slot.title,
    body: slot.body,
    category: slot.key,
    createdAt: now.toISOString(),
    read: false
  };
  return [next, ...items];
}

export function formatSyncClock(iso) {
  if (!iso) {
    return "-";
  }
  return iso.replace("T", " ").replace(".000Z", "Z");
}
