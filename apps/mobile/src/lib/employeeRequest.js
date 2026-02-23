function normalizeText(value) {
  return String(value ?? "").trim();
}

export const EMPLOYEE_REQUEST_TYPE_OPTIONS = [
  { key: "attendanceCorrection", label: "Attendance correction" },
  { key: "leaveRequest", label: "Leave request" }
];

export const EMPLOYEE_LEAVE_UNIT_OPTIONS = [
  { key: "fullDay", label: "Full day" },
  { key: "halfDay", label: "Half day" },
  { key: "hourly", label: "Hourly" }
];

export const EMPLOYEE_REQUEST_STATUS_OPTIONS = [
  { key: "all", label: "All statuses" },
  { key: "submitted", label: "Submitted" },
  { key: "inReview", label: "In review" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "canceled", label: "Canceled" }
];

export const EMPLOYEE_REQUEST_SORT_OPTIONS = [
  { key: "newest", label: "Newest first" },
  { key: "oldest", label: "Oldest first" },
  { key: "status", label: "Status order" }
];

export const EMPLOYEE_REQUEST_FOLLOW_UP_SEVERITY_OPTIONS = [
  { key: "all", label: "All severities" },
  { key: "critical", label: "Critical" },
  { key: "watch", label: "Watch" },
  { key: "info", label: "Info" }
];

export const EMPLOYEE_REQUEST_FOLLOW_UP_SORT_OPTIONS = [
  { key: "priority", label: "Priority first" },
  { key: "newest", label: "Newest update first" },
  { key: "oldest", label: "Oldest update first" }
];

export const EMPLOYEE_REQUEST_FOLLOW_UP_TEMPLATE_OPTIONS = [
  {
    key: "triage",
    label: "Submit triage",
    note: "Move submitted requests to in-review queue quickly.",
    primaryAction: "moveToReview",
    secondaryAction: "openHistory"
  },
  {
    key: "decision",
    label: "Decision execution",
    note: "Run review checklist and finalize approval/rejection.",
    primaryAction: "approve",
    secondaryAction: "reject"
  },
  {
    key: "recovery",
    label: "Recovery flow",
    note: "Reopen review or revise request with a new submission.",
    primaryAction: "reopenReview",
    secondaryAction: "openSubmit"
  },
  {
    key: "closure",
    label: "Closure check",
    note: "No urgent action is required for approved requests.",
    primaryAction: "openHistory",
    secondaryAction: null
  }
];

export const EMPLOYEE_REQUEST_FOLLOW_UP_BUNDLE_PRESET_OPTIONS = [
  {
    key: "allActionRequired",
    label: "All action required",
    note: "Show every follow-up alert that still needs action.",
    filter: { severity: "all", status: "all", sortKey: "priority", query: "" },
    quickAction: null
  },
  {
    key: "triageQueue",
    label: "Triage queue",
    note: "Focus submitted requests and move them to review quickly.",
    filter: { severity: "watch", status: "submitted", sortKey: "priority", query: "" },
    quickAction: "moveToReview"
  },
  {
    key: "decisionQueue",
    label: "Decision queue",
    note: "Handle in-review requests and finalize decision.",
    filter: { severity: "watch", status: "inReview", sortKey: "priority", query: "" },
    quickAction: "approve"
  },
  {
    key: "recoveryQueue",
    label: "Recovery queue",
    note: "Recover rejected requests via reopen flow.",
    filter: { severity: "critical", status: "rejected", sortKey: "priority", query: "" },
    quickAction: "reopenReview"
  }
];

export const EMPLOYEE_REQUEST_FOLLOW_UP_PRESET_RECENT_LIMIT = 4;

const REQUEST_TYPE_SET = new Set(EMPLOYEE_REQUEST_TYPE_OPTIONS.map((option) => option.key));
const LEAVE_UNIT_SET = new Set(EMPLOYEE_LEAVE_UNIT_OPTIONS.map((option) => option.key));
const REQUEST_STATUS_SET = new Set(EMPLOYEE_REQUEST_STATUS_OPTIONS.map((option) => option.key).filter((key) => key !== "all"));

const STATUS_ORDER = {
  submitted: 0,
  inReview: 1,
  approved: 2,
  rejected: 3,
  canceled: 4
};

const FOLLOW_UP_SEVERITY_ORDER = {
  critical: 0,
  watch: 1,
  info: 2
};

const FOLLOW_UP_SEVERITY_SET = new Set(
  EMPLOYEE_REQUEST_FOLLOW_UP_SEVERITY_OPTIONS.map((option) => option.key).filter((key) => key !== "all")
);
const FOLLOW_UP_SORT_KEY_SET = new Set(EMPLOYEE_REQUEST_FOLLOW_UP_SORT_OPTIONS.map((option) => option.key));
const FOLLOW_UP_BUNDLE_PRESET_KEY_SET = new Set(EMPLOYEE_REQUEST_FOLLOW_UP_BUNDLE_PRESET_OPTIONS.map((option) => option.key));

const FOLLOW_UP_TEMPLATE_BY_STATUS = {
  submitted: "triage",
  inReview: "decision",
  rejected: "recovery",
  canceled: "recovery",
  approved: "closure"
};

function asIsoDate(value) {
  const normalized = normalizeText(value);
  if (!normalized) {
    return "";
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return "";
  }
  return normalized;
}

function asPositiveNumber(value) {
  if (value === "" || value == null) {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
}

function normalizeStatus(value) {
  if (REQUEST_STATUS_SET.has(value)) {
    return value;
  }
  return "submitted";
}

function normalizeTimeline(items, fallbackStatus, fallbackAt) {
  const source = Array.isArray(items) ? items : [];
  const normalized = source
    .map((item) => ({
      status: normalizeStatus(item?.status),
      at: normalizeText(item?.at) || fallbackAt
    }))
    .filter((item) => item.at);
  if (normalized.length > 0) {
    return normalized;
  }
  return [{ status: normalizeStatus(fallbackStatus), at: fallbackAt }];
}

function statusLabel(status) {
  return EMPLOYEE_REQUEST_STATUS_OPTIONS.find((option) => option.key === status)?.label ?? status;
}

function severityLabel(severity) {
  return EMPLOYEE_REQUEST_FOLLOW_UP_SEVERITY_OPTIONS.find((option) => option.key === severity)?.label ?? severity;
}

function normalizeSeverity(value) {
  if (FOLLOW_UP_SEVERITY_SET.has(value)) {
    return value;
  }
  return "info";
}

function normalizeFollowUpFilterSeverity(value) {
  if (value === "all") {
    return "all";
  }
  return normalizeSeverity(value);
}

function normalizeFollowUpSortKey(value) {
  if (FOLLOW_UP_SORT_KEY_SET.has(value)) {
    return value;
  }
  return "priority";
}

function normalizeFollowUpFilterStatus(value) {
  if (value === "all") {
    return "all";
  }
  return normalizeStatus(value);
}

function toMillis(value) {
  const stamp = new Date(value).getTime();
  if (Number.isFinite(stamp)) {
    return stamp;
  }
  return 0;
}

function lastTimelineAt(item) {
  const timeline = Array.isArray(item?.statusTimeline) ? item.statusTimeline : [];
  const last = timeline[timeline.length - 1];
  return normalizeText(last?.at) || normalizeText(item?.createdAt);
}

function followUpMeta(status) {
  if (status === "submitted") {
    return {
      severity: "watch",
      title: "Waiting for review",
      message: "Move this request into in-review queue.",
      actions: ["moveToReview", "openHistory"]
    };
  }
  if (status === "inReview") {
    return {
      severity: "watch",
      title: "Decision needed",
      message: "Approve or reject after checking details.",
      actions: ["approve", "reject", "openHistory"]
    };
  }
  if (status === "rejected") {
    return {
      severity: "critical",
      title: "Request rejected",
      message: "Reopen review or submit a revised request.",
      actions: ["reopenReview", "openSubmit", "openHistory"]
    };
  }
  if (status === "canceled") {
    return {
      severity: "info",
      title: "Request canceled",
      message: "Reopen review if this cancellation was accidental.",
      actions: ["reopenReview", "openHistory"]
    };
  }
  return {
    severity: "info",
    title: "Request approved",
    message: "No follow-up is required.",
    actions: ["openHistory"]
  };
}

function matchesQuery(item, query) {
  const keyword = normalizeText(query).toLowerCase();
  if (!keyword) {
    return true;
  }
  const haystack = `${item.requestType} ${item.reason} ${item.note ?? ""}`.toLowerCase();
  return haystack.includes(keyword);
}

export function normalizeEmployeeRequestDraft(draft = {}) {
  const requestType = REQUEST_TYPE_SET.has(draft.requestType) ? draft.requestType : "attendanceCorrection";
  const leaveUnit = LEAVE_UNIT_SET.has(draft.leaveUnit) ? draft.leaveUnit : "fullDay";
  return {
    requestType,
    requestDate: asIsoDate(draft.requestDate),
    leaveEndDate: asIsoDate(draft.leaveEndDate),
    leaveUnit,
    leaveHours: leaveUnit === "hourly" ? asPositiveNumber(draft.leaveHours) : null,
    reason: normalizeText(draft.reason),
    note: normalizeText(draft.note)
  };
}

export function validateEmployeeRequestDraft(draft) {
  const normalized = normalizeEmployeeRequestDraft(draft);
  const errors = [];

  if (!normalized.requestDate) {
    errors.push("Request date is required (YYYY-MM-DD).");
  }
  if (!normalized.reason || normalized.reason.length < 4) {
    errors.push("Reason must be at least 4 characters.");
  }

  if (normalized.requestType === "leaveRequest") {
    if (!normalized.leaveEndDate) {
      errors.push("Leave end date is required.");
    } else if (normalized.requestDate && normalized.leaveEndDate < normalized.requestDate) {
      errors.push("Leave end date must be on/after request date.");
    }
    if (normalized.leaveUnit === "hourly" && normalized.leaveHours == null) {
      errors.push("Hourly leave requires valid leave hours.");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    normalized
  };
}

export function createEmployeeRequestRecord(draft, actorId, now = new Date()) {
  const { normalized } = validateEmployeeRequestDraft(draft);
  const createdAt = now.toISOString();
  return {
    id: `req-${now.getTime()}`,
    actorId: String(actorId ?? ""),
    requestType: normalized.requestType,
    requestDate: normalized.requestDate,
    leaveEndDate: normalized.requestType === "leaveRequest" ? normalized.leaveEndDate : null,
    leaveUnit: normalized.requestType === "leaveRequest" ? normalized.leaveUnit : null,
    leaveHours: normalized.requestType === "leaveRequest" ? normalized.leaveHours : null,
    reason: normalized.reason,
    note: normalized.note,
    status: "submitted",
    createdAt,
    statusTimeline: [{ status: "submitted", at: createdAt }]
  };
}

export function buildEmployeeRequestStats(items) {
  let total = 0;
  let submitted = 0;
  let inReview = 0;
  let approved = 0;
  let rejected = 0;
  let canceled = 0;
  let attendanceCorrection = 0;
  let leaveRequest = 0;
  for (const item of items) {
    total += 1;
    if (item.status === "submitted") {
      submitted += 1;
    } else if (item.status === "inReview") {
      inReview += 1;
    } else if (item.status === "approved") {
      approved += 1;
    } else if (item.status === "rejected") {
      rejected += 1;
    } else if (item.status === "canceled") {
      canceled += 1;
    }
    if (item.requestType === "attendanceCorrection") {
      attendanceCorrection += 1;
    }
    if (item.requestType === "leaveRequest") {
      leaveRequest += 1;
    }
  }
  return {
    total,
    submitted,
    inReview,
    approved,
    rejected,
    canceled,
    attendanceCorrection,
    leaveRequest
  };
}

export function filterEmployeeRequests(items, options = {}) {
  const { requestType = "all", status = "all", query = "" } = options;
  return items.filter((item) => {
    if (requestType !== "all" && item.requestType !== requestType) {
      return false;
    }
    if (status !== "all" && item.status !== status) {
      return false;
    }
    return matchesQuery(item, query);
  });
}

export function sortEmployeeRequests(items, sortKey = "newest") {
  const next = [...items];
  if (sortKey === "oldest") {
    return next.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
  if (sortKey === "status") {
    return next.sort((a, b) => {
      const aRank = STATUS_ORDER[normalizeStatus(a.status)] ?? 999;
      const bRank = STATUS_ORDER[normalizeStatus(b.status)] ?? 999;
      if (aRank !== bRank) {
        return aRank - bRank;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }
  return next.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function applyEmployeeRequestStatus(items, requestId, nextStatus, now = new Date()) {
  const status = normalizeStatus(nextStatus);
  const at = now.toISOString();
  return items.map((item) => {
    if (item.id !== requestId) {
      return item;
    }
    if (item.status === status) {
      return item;
    }
    const statusTimeline = normalizeTimeline(item.statusTimeline, item.status, item.createdAt);
    return {
      ...item,
      status,
      statusTimeline: [...statusTimeline, { status, at }]
    };
  });
}

export function normalizeEmployeeRequestRecord(item, index = 0) {
  const draft = normalizeEmployeeRequestDraft(item);
  const createdAt = normalizeText(item?.createdAt) || new Date().toISOString();
  const status = normalizeStatus(item?.status);
  return {
    id: String(item?.id ?? `req-${index + 1}`),
    actorId: String(item?.actorId ?? ""),
    requestType: draft.requestType,
    requestDate: draft.requestDate,
    leaveEndDate: draft.requestType === "leaveRequest" ? draft.leaveEndDate : null,
    leaveUnit: draft.requestType === "leaveRequest" ? draft.leaveUnit : null,
    leaveHours: draft.requestType === "leaveRequest" ? draft.leaveHours : null,
    reason: draft.reason,
    note: draft.note,
    status,
    createdAt,
    statusTimeline: normalizeTimeline(item?.statusTimeline, status, createdAt)
  };
}

export function formatEmployeeRequestStatus(status) {
  return statusLabel(normalizeStatus(status));
}

export function buildEmployeeRequestFollowUps(items, options = {}) {
  const { includeResolved = false } = options;
  return items
    .map((item) => {
      const status = normalizeStatus(item?.status);
      const meta = followUpMeta(status);
      const updatedAt = lastTimelineAt(item);
      return {
        id: `follow-up-${item.id}-${status}`,
        requestId: String(item?.id ?? ""),
        requestType: item?.requestType,
        status,
        severity: normalizeSeverity(meta.severity),
        title: meta.title,
        message: meta.message,
        reason: normalizeText(item?.reason),
        createdAt: normalizeText(item?.createdAt),
        updatedAt,
        actions: meta.actions,
        actionRequired: status !== "approved"
      };
    })
    .filter((item) => (includeResolved ? true : item.actionRequired))
    .sort((a, b) => toMillis(b.updatedAt) - toMillis(a.updatedAt));
}

export function buildEmployeeRequestFollowUpStats(items) {
  let total = 0;
  let critical = 0;
  let watch = 0;
  let info = 0;
  let actionRequired = 0;
  for (const item of items) {
    total += 1;
    if (item.severity === "critical") {
      critical += 1;
    } else if (item.severity === "watch") {
      watch += 1;
    } else {
      info += 1;
    }
    if (item.actionRequired) {
      actionRequired += 1;
    }
  }
  return { total, critical, watch, info, actionRequired };
}

export function filterEmployeeRequestFollowUps(items, options = {}) {
  const { severity = "all", status = "all", query = "" } = options;
  const keyword = normalizeText(query).toLowerCase();
  return items.filter((item) => {
    if (severity !== "all" && item.severity !== severity) {
      return false;
    }
    if (status !== "all" && item.status !== status) {
      return false;
    }
    if (!keyword) {
      return true;
    }
    const haystack = `${item.title} ${item.message} ${item.reason} ${item.status} ${item.requestType}`.toLowerCase();
    return haystack.includes(keyword);
  });
}

export function sortEmployeeRequestFollowUps(items, sortKey = "priority") {
  const next = [...items];
  if (sortKey === "oldest") {
    return next.sort((a, b) => toMillis(a.updatedAt) - toMillis(b.updatedAt));
  }
  if (sortKey === "newest") {
    return next.sort((a, b) => toMillis(b.updatedAt) - toMillis(a.updatedAt));
  }
  return next.sort((a, b) => {
    const aRank = FOLLOW_UP_SEVERITY_ORDER[normalizeSeverity(a.severity)] ?? 999;
    const bRank = FOLLOW_UP_SEVERITY_ORDER[normalizeSeverity(b.severity)] ?? 999;
    if (aRank !== bRank) {
      return aRank - bRank;
    }
    return toMillis(b.updatedAt) - toMillis(a.updatedAt);
  });
}

export function formatEmployeeRequestFollowUpSeverity(severity) {
  return severityLabel(normalizeSeverity(severity));
}

export function getEmployeeRequestFollowUpBundlePreset(presetKey) {
  return EMPLOYEE_REQUEST_FOLLOW_UP_BUNDLE_PRESET_OPTIONS.find((item) => item.key === presetKey) ?? null;
}

export function sanitizeEmployeeRequestFollowUpPresetKeys(keys) {
  const source = Array.isArray(keys) ? keys : [];
  const unique = [];
  for (const key of source) {
    if (!FOLLOW_UP_BUNDLE_PRESET_KEY_SET.has(key)) {
      continue;
    }
    if (!unique.includes(key)) {
      unique.push(key);
    }
  }
  return unique;
}

export function toggleEmployeeRequestFollowUpPresetPin(pinnedPresetKeys, presetKey) {
  const pinned = sanitizeEmployeeRequestFollowUpPresetKeys(pinnedPresetKeys);
  if (!FOLLOW_UP_BUNDLE_PRESET_KEY_SET.has(presetKey)) {
    return pinned;
  }
  if (pinned.includes(presetKey)) {
    return pinned.filter((key) => key !== presetKey);
  }
  return [...pinned, presetKey];
}

export function pushEmployeeRequestFollowUpPresetRecent(
  recentPresetKeys,
  presetKey,
  limit = EMPLOYEE_REQUEST_FOLLOW_UP_PRESET_RECENT_LIMIT
) {
  const recent = sanitizeEmployeeRequestFollowUpPresetKeys(recentPresetKeys);
  if (!FOLLOW_UP_BUNDLE_PRESET_KEY_SET.has(presetKey)) {
    return recent.slice(0, limit);
  }
  return [presetKey, ...recent.filter((key) => key !== presetKey)].slice(0, limit);
}

export function normalizeEmployeeRequestFollowUpPresetState(state) {
  const source = state && typeof state === "object" ? state : {};
  const pinnedPresetKeys = sanitizeEmployeeRequestFollowUpPresetKeys(source.pinnedPresetKeys);
  const recentPresetKeys = sanitizeEmployeeRequestFollowUpPresetKeys(source.recentPresetKeys)
    .filter((key) => !pinnedPresetKeys.includes(key))
    .slice(0, EMPLOYEE_REQUEST_FOLLOW_UP_PRESET_RECENT_LIMIT);
  return {
    pinnedPresetKeys,
    recentPresetKeys
  };
}

export function resolveEmployeeRequestFollowUpFilterFromPreset(presetKey, currentFilter = {}) {
  const preset = getEmployeeRequestFollowUpBundlePreset(presetKey);
  if (!preset) {
    return {
      severity: normalizeFollowUpFilterSeverity(currentFilter.severity ?? "all"),
      status: normalizeFollowUpFilterStatus(currentFilter.status ?? "all"),
      sortKey: normalizeFollowUpSortKey(currentFilter.sortKey ?? "priority"),
      query: normalizeText(currentFilter.query ?? "")
    };
  }
  return {
    severity: normalizeFollowUpFilterSeverity(preset.filter?.severity ?? "all"),
    status: normalizeFollowUpFilterStatus(preset.filter?.status ?? "all"),
    sortKey: normalizeFollowUpSortKey(preset.filter?.sortKey ?? "priority"),
    query: normalizeText(preset.filter?.query ?? "")
  };
}

export function recommendEmployeeRequestFollowUpTemplate(followUp) {
  const status = normalizeStatus(followUp?.status);
  const key = FOLLOW_UP_TEMPLATE_BY_STATUS[status] ?? "closure";
  return (
    EMPLOYEE_REQUEST_FOLLOW_UP_TEMPLATE_OPTIONS.find((item) => item.key === key) ??
    EMPLOYEE_REQUEST_FOLLOW_UP_TEMPLATE_OPTIONS[EMPLOYEE_REQUEST_FOLLOW_UP_TEMPLATE_OPTIONS.length - 1]
  );
}

export function buildEmployeeRequestFollowUpTemplateStats(items) {
  const counts = {};
  for (const item of items) {
    const template = recommendEmployeeRequestFollowUpTemplate(item);
    counts[template.key] = (counts[template.key] ?? 0) + 1;
  }
  return EMPLOYEE_REQUEST_FOLLOW_UP_TEMPLATE_OPTIONS.map((template) => ({
    ...template,
    count: counts[template.key] ?? 0
  })).sort((a, b) => b.count - a.count);
}

export function buildEmployeeRequestFollowUpBundleStats(items) {
  return EMPLOYEE_REQUEST_FOLLOW_UP_BUNDLE_PRESET_OPTIONS.map((preset) => ({
    ...preset,
    count: filterEmployeeRequestFollowUps(items, {
      severity: preset.filter?.severity ?? "all",
      status: preset.filter?.status ?? "all",
      query: preset.filter?.query ?? ""
    }).length
  })).sort((a, b) => b.count - a.count);
}
