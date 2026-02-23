import { buildApprovalQueueStats } from "./approvalQueue";
import { buildEmployeeRequestStats } from "./employeeRequest";
import { buildNotificationCategoryStats } from "./notificationFeed";
import { filterNotificationHistory } from "./notificationHistory";

export const MOBILE_ANALYTICS_PERIOD_OPTIONS = [
  { key: "7d", label: "Last 7 days", days: 7 },
  { key: "14d", label: "Last 14 days", days: 14 },
  { key: "30d", label: "Last 30 days", days: 30 }
];

export const MOBILE_ANALYTICS_FOCUS_OPTIONS = [
  { key: "all", label: "All domains" },
  { key: "approval", label: "Approval focus" },
  { key: "request", label: "Request focus" },
  { key: "notification", label: "Notification focus" }
];

export const MOBILE_ANALYTICS_FILTER_PRESET_OPTIONS = [
  {
    key: "allActionRequired",
    label: "All action required",
    note: "Default overview for all domains.",
    filter: { periodKey: "7d", focus: "all" }
  },
  {
    key: "approvalRisk",
    label: "Approval risk watch",
    note: "Focus stalled pending approvals.",
    filter: { periodKey: "7d", focus: "approval" }
  },
  {
    key: "requestFlow",
    label: "Request flow pulse",
    note: "Track request throughput and pending actions.",
    filter: { periodKey: "14d", focus: "request" }
  },
  {
    key: "notificationPulse",
    label: "Notification pulse",
    note: "Watch unread notification backlog.",
    filter: { periodKey: "7d", focus: "notification" }
  }
];

export const MOBILE_ANALYTICS_FILTER_PRESET_RECENT_LIMIT = 4;
export const MOBILE_ANALYTICS_EXPORT_TYPE = "flowhr.mobile.analytics.dashboard.snapshot";
export const MOBILE_ANALYTICS_EXPORT_VERSION = 1;
export const MOBILE_ANALYTICS_FILTER_PRESET_TRANSFER_TYPE = "flowhr.mobile.analytics.filter-preset-state";
export const MOBILE_ANALYTICS_FILTER_PRESET_TRANSFER_VERSION = 1;

const PERIOD_KEY_SET = new Set(MOBILE_ANALYTICS_PERIOD_OPTIONS.map((item) => item.key));
const FOCUS_KEY_SET = new Set(MOBILE_ANALYTICS_FOCUS_OPTIONS.map((item) => item.key));
const FILTER_PRESET_KEY_SET = new Set(MOBILE_ANALYTICS_FILTER_PRESET_OPTIONS.map((item) => item.key));

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

function normalizePeriodKey(periodKey, fallback = "7d") {
  if (PERIOD_KEY_SET.has(periodKey)) {
    return periodKey;
  }
  if (PERIOD_KEY_SET.has(fallback)) {
    return fallback;
  }
  return MOBILE_ANALYTICS_PERIOD_OPTIONS[0].key;
}

function normalizeFocusKey(focus, fallback = "all") {
  if (FOCUS_KEY_SET.has(focus)) {
    return focus;
  }
  if (FOCUS_KEY_SET.has(fallback)) {
    return fallback;
  }
  return "all";
}

export function resolveMobileAnalyticsPeriodDays(periodKey, fallback = 7) {
  const normalizedKey = normalizePeriodKey(periodKey);
  const found = MOBILE_ANALYTICS_PERIOD_OPTIONS.find((item) => item.key === normalizedKey);
  return found?.days ?? fallback;
}

export function resolveMobileAnalyticsFocusLabel(focus) {
  const normalized = normalizeFocusKey(focus);
  return MOBILE_ANALYTICS_FOCUS_OPTIONS.find((item) => item.key === normalized)?.label ?? "All domains";
}

export function formatMobileAnalyticsRate(value) {
  const normalized = Number.isFinite(Number(value)) ? Number(value) : 0;
  return `${normalized.toFixed(1)}%`;
}

export function normalizeMobileAnalyticsFilterState(filterState) {
  const source = filterState && typeof filterState === "object" ? filterState : {};
  return {
    periodKey: normalizePeriodKey(source.periodKey, "7d"),
    focus: normalizeFocusKey(source.focus, "all")
  };
}

export function getMobileAnalyticsFilterPreset(presetKey) {
  return MOBILE_ANALYTICS_FILTER_PRESET_OPTIONS.find((item) => item.key === presetKey) ?? null;
}

export function sanitizeMobileAnalyticsFilterPresetKeys(keys) {
  const source = Array.isArray(keys) ? keys : [];
  const unique = [];
  for (const key of source) {
    if (!FILTER_PRESET_KEY_SET.has(key)) {
      continue;
    }
    if (!unique.includes(key)) {
      unique.push(key);
    }
  }
  return unique;
}

export function toggleMobileAnalyticsFilterPresetPin(pinnedPresetKeys, presetKey) {
  const pinned = sanitizeMobileAnalyticsFilterPresetKeys(pinnedPresetKeys);
  if (!FILTER_PRESET_KEY_SET.has(presetKey)) {
    return pinned;
  }
  if (pinned.includes(presetKey)) {
    return pinned.filter((key) => key !== presetKey);
  }
  return [...pinned, presetKey];
}

export function pushMobileAnalyticsFilterPresetRecent(
  recentPresetKeys,
  presetKey,
  limit = MOBILE_ANALYTICS_FILTER_PRESET_RECENT_LIMIT
) {
  const recent = sanitizeMobileAnalyticsFilterPresetKeys(recentPresetKeys);
  if (!FILTER_PRESET_KEY_SET.has(presetKey)) {
    return recent.slice(0, limit);
  }
  return [presetKey, ...recent.filter((key) => key !== presetKey)].slice(0, limit);
}

export function normalizeMobileAnalyticsFilterPresetState(state) {
  const source = state && typeof state === "object" ? state : {};
  const pinnedPresetKeys = sanitizeMobileAnalyticsFilterPresetKeys(source.pinnedPresetKeys);
  const recentPresetKeys = sanitizeMobileAnalyticsFilterPresetKeys(source.recentPresetKeys)
    .filter((key) => !pinnedPresetKeys.includes(key))
    .slice(0, MOBILE_ANALYTICS_FILTER_PRESET_RECENT_LIMIT);
  return {
    pinnedPresetKeys,
    recentPresetKeys
  };
}

export function resolveMobileAnalyticsFilterFromPreset(presetKey, currentFilterState = {}) {
  const preset = getMobileAnalyticsFilterPreset(presetKey);
  if (!preset) {
    return normalizeMobileAnalyticsFilterState(currentFilterState);
  }
  return normalizeMobileAnalyticsFilterState({
    periodKey: preset.filter?.periodKey ?? currentFilterState.periodKey,
    focus: preset.filter?.focus ?? currentFilterState.focus
  });
}

export function buildMobileAnalyticsSnapshot(
  source = {},
  options = {}
) {
  const approvals = Array.isArray(source.approvals) ? source.approvals : [];
  const requests = Array.isArray(source.requests) ? source.requests : [];
  const notifications = Array.isArray(source.notifications) ? source.notifications : [];
  const now = options.now instanceof Date ? options.now : new Date();
  const filterState = normalizeMobileAnalyticsFilterState(options.filterState);
  const periodDays = Math.max(1, Number(options.periodDays) || resolveMobileAnalyticsPeriodDays(filterState.periodKey, 7));
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

export function resolveMobileAnalyticsFocusCount(snapshot, focus = "all") {
  const target = normalizeFocusKey(focus, "all");
  if (target === "approval") {
    return Number(snapshot?.kpi?.approvalsPending ?? 0);
  }
  if (target === "request") {
    return Number(snapshot?.kpi?.requestsPendingAction ?? 0);
  }
  if (target === "notification") {
    return Number(snapshot?.kpi?.notificationsUnread ?? 0);
  }
  return Number(snapshot?.kpi?.actionRequired ?? 0);
}

export function buildMobileAnalyticsFilterPresetStats(source = {}, options = {}) {
  const now = options.now instanceof Date ? options.now : new Date();
  return MOBILE_ANALYTICS_FILTER_PRESET_OPTIONS.map((preset) => {
    const filterState = normalizeMobileAnalyticsFilterState(preset.filter);
    const snapshot = buildMobileAnalyticsSnapshot(source, { now, filterState });
    const count = resolveMobileAnalyticsFocusCount(snapshot, filterState.focus);
    return {
      ...preset,
      filter: filterState,
      count
    };
  }).sort((a, b) => b.count - a.count);
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

function hasFilterPresetStateShape(value) {
  return Boolean(value && typeof value === "object" && ("pinnedPresetKeys" in value || "recentPresetKeys" in value));
}

function hasFilterStateShape(value) {
  return Boolean(value && typeof value === "object" && ("periodKey" in value || "focus" in value));
}

export function serializeMobileAnalyticsFilterPresetTransfer(state, now = new Date()) {
  const source = state && typeof state === "object" ? state : {};
  const payload = {
    type: MOBILE_ANALYTICS_FILTER_PRESET_TRANSFER_TYPE,
    version: MOBILE_ANALYTICS_FILTER_PRESET_TRANSFER_VERSION,
    exportedAt: now.toISOString(),
    state: {
      presetState: normalizeMobileAnalyticsFilterPresetState(source.presetState),
      filterState: normalizeMobileAnalyticsFilterState(source.filterState)
    }
  };
  return JSON.stringify(payload, null, 2);
}

export function parseMobileAnalyticsFilterPresetTransfer(raw) {
  const text = String(raw ?? "").trim();
  if (!text) {
    return { ok: false, code: "empty_payload" };
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, code: "invalid_json" };
  }

  if (hasFilterPresetStateShape(parsed)) {
    return {
      ok: true,
      state: {
        presetState: normalizeMobileAnalyticsFilterPresetState(parsed),
        filterState: normalizeMobileAnalyticsFilterState({})
      }
    };
  }
  if (!parsed || typeof parsed !== "object") {
    return { ok: false, code: "invalid_payload" };
  }
  if (parsed.type !== MOBILE_ANALYTICS_FILTER_PRESET_TRANSFER_TYPE) {
    return { ok: false, code: "unsupported_type" };
  }
  if (parsed.version !== MOBILE_ANALYTICS_FILTER_PRESET_TRANSFER_VERSION) {
    return { ok: false, code: "unsupported_version" };
  }
  if (!parsed.state || typeof parsed.state !== "object") {
    return { ok: false, code: "invalid_state" };
  }
  const parsedPresetState = hasFilterPresetStateShape(parsed.state.presetState)
    ? parsed.state.presetState
    : parsed.state;
  const parsedFilterState = hasFilterStateShape(parsed.state.filterState) ? parsed.state.filterState : {};
  return {
    ok: true,
    state: {
      presetState: normalizeMobileAnalyticsFilterPresetState(parsedPresetState),
      filterState: normalizeMobileAnalyticsFilterState(parsedFilterState)
    },
    exportedAt: typeof parsed.exportedAt === "string" ? parsed.exportedAt : null
  };
}
