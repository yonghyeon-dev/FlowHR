import { buildApprovalQueueStats } from "./approvalQueue";
import { buildEmployeeRequestStats } from "./employeeRequest";
import { buildNotificationCategoryStats } from "./notificationFeed";
import { filterNotificationHistory } from "./notificationHistory";

export const MOBILE_ANALYTICS_PERIOD_OPTIONS = [
  { key: "7d", label: "Last 7 days", days: 7 },
  { key: "14d", label: "Last 14 days", days: 14 },
  { key: "30d", label: "Last 30 days", days: 30 }
];

export const MOBILE_ANALYTICS_EXPORT_TYPE = "flowhr.mobile.analytics.dashboard.snapshot";
export const MOBILE_ANALYTICS_EXPORT_VERSION = 1;

function toMillis(value) {
  const stamp = new Date(value).getTime();
  if (Number.isFinite(stamp)) {
    return stamp;
  }
  return 0;
}

function periodDaysToMillis(days) {
  return Math.max(1, Number(days) || 7) * 24 * 60 * 60 * 1000;
}

function inPeriod(iso, nowMs, periodMs) {
  const stamp = toMillis(iso);
  if (!stamp) {
    return false;
  }
  const gap = nowMs - stamp;
  return gap >= 0 && gap <= periodMs;
}

function ratio(numerator, denominator) {
  if (!denominator) {
    return 0;
  }
  return Math.round((numerator / denominator) * 1000) / 10;
}

function dateKey(iso) {
  return String(iso ?? "").slice(0, 10);
}

function buildSeriesEmptyMap(days, now = new Date()) {
  const map = {};
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    map[d.toISOString().slice(0, 10)] = {
      day: d.toISOString().slice(0, 10),
      approvals: 0,
      requests: 0,
      notifications: 0
    };
  }
  return map;
}

function bumpTrend(seriesMap, key, field) {
  if (!seriesMap[key]) {
    return;
  }
  seriesMap[key][field] += 1;
}

export function resolveMobileAnalyticsPeriodDays(periodKey, fallback = 7) {
  const found = MOBILE_ANALYTICS_PERIOD_OPTIONS.find((item) => item.key === periodKey);
  return found?.days ?? fallback;
}

export function formatMobileAnalyticsRate(value) {
  const normalized = Number.isFinite(Number(value)) ? Number(value) : 0;
  return `${normalized.toFixed(1)}%`;
}

export function buildMobileAnalyticsSnapshot(
  source = {},
  options = {}
) {
  const approvals = Array.isArray(source.approvals) ? source.approvals : [];
  const requests = Array.isArray(source.requests) ? source.requests : [];
  const notifications = Array.isArray(source.notifications) ? source.notifications : [];
  const now = options.now instanceof Date ? options.now : new Date();
  const periodDays = Math.max(1, Number(options.periodDays) || 7);
  const nowMs = now.getTime();
  const periodMs = periodDaysToMillis(periodDays);

  const approvalsInRange = approvals.filter((item) => inPeriod(item.submittedAt, nowMs, periodMs));
  const requestsInRange = requests.filter((item) => inPeriod(item.createdAt, nowMs, periodMs));
  const notificationsInRange = notifications.filter((item) => inPeriod(item.createdAt, nowMs, periodMs));

  const approvalStats = buildApprovalQueueStats(approvalsInRange);
  const requestStats = buildEmployeeRequestStats(requestsInRange);
  const activeNotifications = filterNotificationHistory(notificationsInRange, { archiveState: "active" });
  const notificationStats = buildNotificationCategoryStats(activeNotifications);
  const unreadNotifications = notificationStats.all?.unread ?? 0;
  const actionableRequests = requestStats.submitted + requestStats.inReview;
  const actionableApprovals = approvalStats.pending;
  const actionRequired = actionableApprovals + actionableRequests + unreadNotifications;

  return {
    generatedAt: now.toISOString(),
    window: {
      periodDays,
      from: new Date(nowMs - periodMs).toISOString().slice(0, 10),
      to: now.toISOString().slice(0, 10)
    },
    totals: {
      approvals: approvalsInRange.length,
      requests: requestsInRange.length,
      notifications: activeNotifications.length
    },
    kpi: {
      actionRequired,
      approvalsPending: actionableApprovals,
      requestsPendingAction: actionableRequests,
      notificationsUnread: unreadNotifications,
      approvalsDecisionRate: ratio(approvalStats.approved + approvalStats.rejected, approvalsInRange.length),
      requestsApprovalRate: ratio(requestStats.approved, requestsInRange.length),
      notificationsReadRate: ratio(activeNotifications.length - unreadNotifications, activeNotifications.length)
    },
    domain: {
      approval: approvalStats,
      request: requestStats,
      notification: {
        total: activeNotifications.length,
        unread: unreadNotifications,
        categories: notificationStats
      }
    }
  };
}

export function buildMobileAnalyticsTrendSeries(source = {}, options = {}) {
  const approvals = Array.isArray(source.approvals) ? source.approvals : [];
  const requests = Array.isArray(source.requests) ? source.requests : [];
  const notifications = Array.isArray(source.notifications) ? source.notifications : [];
  const now = options.now instanceof Date ? options.now : new Date();
  const periodDays = Math.max(1, Number(options.periodDays) || 7);
  const nowMs = now.getTime();
  const periodMs = periodDaysToMillis(periodDays);
  const seriesMap = buildSeriesEmptyMap(periodDays, now);

  for (const item of approvals) {
    if (inPeriod(item.submittedAt, nowMs, periodMs)) {
      bumpTrend(seriesMap, dateKey(item.submittedAt), "approvals");
    }
  }
  for (const item of requests) {
    if (inPeriod(item.createdAt, nowMs, periodMs)) {
      bumpTrend(seriesMap, dateKey(item.createdAt), "requests");
    }
  }
  for (const item of notifications) {
    if (inPeriod(item.createdAt, nowMs, periodMs)) {
      bumpTrend(seriesMap, dateKey(item.createdAt), "notifications");
    }
  }

  return Object.values(seriesMap);
}

export function serializeMobileAnalyticsSnapshot(snapshot, now = new Date()) {
  const payload = {
    type: MOBILE_ANALYTICS_EXPORT_TYPE,
    version: MOBILE_ANALYTICS_EXPORT_VERSION,
    exportedAt: now.toISOString(),
    snapshot
  };
  return JSON.stringify(payload, null, 2);
}
