function normalizeText(value) {
  return String(value ?? "").trim().toLowerCase();
}

export const APPROVAL_QUEUE_STATUS_OPTIONS = [
  { key: "all", label: "All statuses" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" }
];

export const APPROVAL_QUEUE_PRIORITY_OPTIONS = [
  { key: "all", label: "All priorities" },
  { key: "high", label: "High" },
  { key: "normal", label: "Normal" },
  { key: "low", label: "Low" }
];

export const APPROVAL_QUEUE_SORT_OPTIONS = [
  { key: "stalledHoursDesc", label: "Stalled hours" },
  { key: "newest", label: "Newest first" },
  { key: "priority", label: "Priority first" }
];

export const APPROVAL_QUEUE_SEED_ITEMS = [
  {
    id: "approval-001",
    title: "Leave request approval",
    requesterName: "Mina Park",
    domain: "leave",
    priority: "high",
    status: "pending",
    stalledHours: 28,
    submittedAt: "2026-02-23T00:20:00.000Z",
    decidedAt: null
  },
  {
    id: "approval-002",
    title: "Attendance correction request",
    requesterName: "Jinwoo Kim",
    domain: "attendance",
    priority: "normal",
    status: "pending",
    stalledHours: 10,
    submittedAt: "2026-02-23T04:10:00.000Z",
    decidedAt: null
  },
  {
    id: "approval-003",
    title: "Payroll close confirmation",
    requesterName: "Finance Bot",
    domain: "payroll",
    priority: "high",
    status: "pending",
    stalledHours: 35,
    submittedAt: "2026-02-22T20:40:00.000Z",
    decidedAt: null
  },
  {
    id: "approval-004",
    title: "Schedule swap request",
    requesterName: "Ara Lee",
    domain: "scheduling",
    priority: "low",
    status: "approved",
    stalledHours: 0,
    submittedAt: "2026-02-22T08:30:00.000Z",
    decidedAt: "2026-02-22T09:00:00.000Z"
  }
];

function priorityRank(priority) {
  if (priority === "high") {
    return 0;
  }
  if (priority === "normal") {
    return 1;
  }
  return 2;
}

function matchesQuery(item, query) {
  const keyword = normalizeText(query);
  if (!keyword) {
    return true;
  }
  const haystack = normalizeText(`${item.title} ${item.requesterName} ${item.domain}`);
  return haystack.includes(keyword);
}

function matchesStatus(item, status) {
  if (!status || status === "all") {
    return true;
  }
  return item.status === status;
}

function matchesPriority(item, priority) {
  if (!priority || priority === "all") {
    return true;
  }
  return item.priority === priority;
}

export function filterApprovalQueue(items, options = {}) {
  const { query = "", status = "all", priority = "all" } = options;
  return items.filter(
    (item) => matchesQuery(item, query) && matchesStatus(item, status) && matchesPriority(item, priority)
  );
}

export function sortApprovalQueue(items, sortKey = "stalledHoursDesc") {
  const next = [...items];
  if (sortKey === "newest") {
    return next.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }
  if (sortKey === "priority") {
    return next.sort((a, b) => {
      const rankGap = priorityRank(a.priority) - priorityRank(b.priority);
      if (rankGap !== 0) {
        return rankGap;
      }
      return b.stalledHours - a.stalledHours;
    });
  }
  return next.sort((a, b) => b.stalledHours - a.stalledHours);
}

export function buildApprovalQueueStats(items) {
  let pending = 0;
  let approved = 0;
  let rejected = 0;
  let highPriorityPending = 0;
  let stalledOver24h = 0;
  for (const item of items) {
    if (item.status === "pending") {
      pending += 1;
      if (item.priority === "high") {
        highPriorityPending += 1;
      }
      if (item.stalledHours >= 24) {
        stalledOver24h += 1;
      }
    } else if (item.status === "approved") {
      approved += 1;
    } else if (item.status === "rejected") {
      rejected += 1;
    }
  }
  return {
    total: items.length,
    pending,
    approved,
    rejected,
    highPriorityPending,
    stalledOver24h
  };
}

export function applyApprovalQueueDecision(items, requestId, decision, now = new Date()) {
  const status = decision === "approve" ? "approved" : decision === "reject" ? "rejected" : null;
  if (!status) {
    return items;
  }
  const decidedAt = now.toISOString();
  return items.map((item) => {
    if (item.id !== requestId || item.status !== "pending") {
      return item;
    }
    return {
      ...item,
      status,
      stalledHours: 0,
      decidedAt
    };
  });
}
