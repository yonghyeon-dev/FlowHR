const CATEGORY_SEED = [
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
