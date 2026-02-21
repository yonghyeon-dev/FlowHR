"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";

type ApiLog = {
  id: number;
  label: string;
  status: number;
  ok: boolean;
  durationMs: number;
  at: string;
  body: unknown;
};

type ApprovalActivity = {
  id: number;
  queue: "attendance" | "leave" | "payroll";
  actionKind: "approve" | "reject" | "confirm" | "other";
  action: string;
  itemId: string;
  ok: boolean;
  status: number;
  createdAtMs: number;
  at: string;
};

type EmployeeSummary = {
  id: string;
  organizationId: string | null;
  name: string | null;
  email: string | null;
  active: boolean;
};

type OrganizationSummary = {
  id: string;
  name: string;
};

type AttendanceRecordDto = {
  id: string;
  employeeId: string;
  checkInAt: string;
  checkOutAt: string | null;
  breakMinutes: number;
  isHoliday: boolean;
  notes: string | null;
  state: "PENDING" | "APPROVED" | "REJECTED";
};

type WorkScheduleDto = {
  id: string;
  employeeId: string;
  startAt: string;
  endAt: string;
  breakMinutes: number;
  isHoliday: boolean;
  notes: string | null;
};

type InviteRole = "admin" | "manager" | "employee" | "payroll_operator";
type InviteDeliveryMode = "link" | "email";

type InviteResultDto = {
  userId: string;
  email: string;
  role: InviteRole;
  organizationId: string;
  actorId: string | null;
  redirectTo: string;
  deliveryMode: InviteDeliveryMode;
  actionLink: string | null;
};

type LeaveRequestDto = {
  id: string;
  employeeId: string;
  leaveType: "ANNUAL" | "SICK" | "UNPAID";
  startDate: string;
  endDate: string;
  unit: "FULL_DAY" | "HALF_DAY" | "HOUR";
  hours: number | null;
  days: number;
  reason: string | null;
  decisionReason: string | null;
  state: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";
};

type PayrollRunDto = {
  id: string;
  organizationId: string | null;
  employeeId: string | null;
  periodStart: string;
  periodEnd: string;
  state: "PREVIEWED" | "CONFIRMED";
  grossPayKrw: number;
  totalDeductionsKrw: number | null;
  netPayKrw: number | null;
  sourceRecordCount: number;
  confirmedAt: string | null;
  confirmedBy: string | null;
};

type AttendanceAggregateDto = {
  employeeId: string;
  periodStart: string;
  periodEnd: string;
  counts: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    payable: number;
  };
  totals: {
    regular: number;
    overtime: number;
    night: number;
    holiday: number;
  };
};

type LeaveBalanceDto = {
  employeeId: string;
  grantedDays: number;
  usedDays: number;
  remainingDays: number;
  carryOverDays: number;
  lastAccrualYear: number | null;
  updatedAt: string;
};

type QueueFocus = "all" | "attendance" | "leave" | "payroll";
type QueueSearchScope = "all" | "employee" | "request_id" | "content";
type QueueAlertLevel = "normal" | "watch" | "critical";
type AttendanceQueueSort = "checkin_desc" | "checkin_asc" | "stale_desc" | "employee_asc";
type LeaveQueueSort = "start_desc" | "start_asc" | "stale_desc" | "employee_asc";
type PayrollQueueSort = "period_desc" | "stale_desc" | "gross_desc" | "employee_asc";
type QueueBadgeSummary = {
  focus: QueueFocus;
  label: string;
  pending: number;
  visible: number;
  selected: number;
  watch: number;
  critical: number;
  oldestHours: number;
  alertLevel: QueueAlertLevel;
};

type QueueItemHistorySummary = {
  key: string;
  queue: "attendance" | "leave" | "payroll";
  itemId: string;
  total: number;
  success: number;
  fail: number;
  approved: number;
  rejected: number;
  confirmed: number;
  lastAction: string;
  lastStatus: number;
  lastAt: string;
  lastCreatedAtMs: number;
};

type QueuePreActionCheck = {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
};

type QueueMobileApprovalFeedback = {
  queue: "attendance" | "leave" | "payroll" | "mixed";
  action: string;
  okCount: number;
  failCount: number;
  total: number;
  at: string;
};

type QueueEvidencePreviewCard = {
  key: string;
  queue: "attendance" | "leave" | "payroll";
  itemId: string;
  employeeId: string;
  primary: string;
  secondary: string;
  waitedHours: number;
  alertLevel: QueueAlertLevel;
  historySummary: string;
  selected: boolean;
};

type QueueSlaTimelinePoint = {
  key: QueueFocus;
  label: string;
  total: number;
  belowWatch: number;
  betweenWatchAndCritical: number;
  overCritical: number;
  oldestHours: number;
};

type QueueMobileReviewStep = {
  id: "attendance" | "leave" | "payroll";
  label: string;
  targetCount: number;
  approveReady: boolean;
  rejectReady: boolean;
  detail: string;
};

type QueueEvidenceComparisonCard = {
  key: string;
  queue: "attendance" | "leave" | "payroll";
  baselineItemId: string;
  compareItemId: string;
  baselineWaitHours: number;
  compareWaitHours: number;
  waitGapHours: number;
  baselineFailCount: number;
  compareFailCount: number;
  failGapCount: number;
  severity: QueueAlertLevel;
  recommendation: string;
};

type QueueSlaRuleAlert = {
  key: string;
  label: string;
  severity: QueueAlertLevel;
  count: number;
  detail: string;
  targetSectionId: string;
};

type QueueMobileApprovalChecklistItem = {
  id: string;
  label: string;
  pass: boolean;
  detail: string;
  targetSectionId: string;
};

type QueueSearchSortScope = "all" | "queue" | "employee" | "request_id" | "detail";
type QueueSearchSortOption =
  | "priority_desc"
  | "wait_desc"
  | "recent_desc"
  | "employee_asc"
  | "queue_asc";

type QueueSearchSortRow = {
  key: string;
  queue: "attendance" | "leave" | "payroll";
  queueLabel: string;
  itemId: string;
  employeeId: string;
  waitHours: number;
  waitedAtMs: number;
  severity: QueueAlertLevel;
  selected: boolean;
  detail: string;
};

type QueueProcessingPredictionCard = {
  key: string;
  queue: QueueFocus;
  label: string;
  pendingCount: number;
  severity: QueueAlertLevel;
  predictedClearHours: number;
  predictedEta: string;
  recentSuccessRate: number;
  detail: string;
  targetSectionId: string;
};

type QueueMobileFollowUpGuideCard = {
  key: string;
  label: string;
  severity: QueueAlertLevel;
  detail: string;
  actionLabel: string;
  targetSectionId: string;
};

type QueueHistorySortAccuracyCard = {
  key: string;
  label: string;
  severity: QueueAlertLevel;
  accuracyScore: number;
  matchedCount: number;
  totalCompared: number;
  detail: string;
  targetSectionId: string;
};

type QueueDelayRiskPredictionCard = {
  key: string;
  queue: QueueFocus;
  label: string;
  severity: QueueAlertLevel;
  pendingCount: number;
  watchCount: number;
  criticalCount: number;
  averageWaitHours: number;
  maxWaitHours: number;
  riskScore: number;
  etaLabel: string;
  detail: string;
  targetSectionId: string;
};

type QueueMobileFollowUpRecommendationCard = {
  key: string;
  label: string;
  severity: QueueAlertLevel;
  detail: string;
  actionLabel: string;
  targetSectionId: string;
};

type QueueHistorySortHardeningCard = {
  key: string;
  label: string;
  severity: QueueAlertLevel;
  accuracyScore: number;
  confidenceGap: number;
  totalCompared: number;
  responseLabel: string;
  detail: string;
  searchScope: QueueSearchSortScope;
  searchQuery: string;
  recommendedSortOption: QueueSearchSortOption;
  targetSectionId: string;
};

type QueueDelayRiskResponseCard = {
  key: string;
  queue: QueueFocus;
  label: string;
  severity: QueueAlertLevel;
  pendingCount: number;
  watchCount: number;
  criticalCount: number;
  riskScore: number;
  responseWindow: string;
  responseLabel: string;
  detail: string;
  searchScope: QueueSearchSortScope;
  searchQuery: string;
  recommendedSortOption: QueueSearchSortOption;
  targetSectionId: string;
};

type QueueMobileFollowUpRecommendationUpgradeCard = {
  key: string;
  label: string;
  severity: QueueAlertLevel;
  priorityScore: number;
  detail: string;
  actionLabel: string;
  targetSectionId: string;
};

type QueueHistorySortHardeningPlusCard = {
  key: string;
  label: string;
  severity: QueueAlertLevel;
  confidenceGap: number;
  stabilizationScore: number;
  responseLabel: string;
  executionLabel: string;
  detail: string;
  searchScope: QueueSearchSortScope;
  searchQuery: string;
  recommendedSortOption: QueueSearchSortOption;
  targetSectionId: string;
};

type QueueDelayRiskResponseExecutionGuideCard = {
  key: string;
  queue: QueueFocus;
  label: string;
  severity: QueueAlertLevel;
  pendingCount: number;
  riskScore: number;
  responseWindow: string;
  executionLabel: string;
  executionChecklist: string;
  detail: string;
  searchScope: QueueSearchSortScope;
  searchQuery: string;
  recommendedSortOption: QueueSearchSortOption;
  targetSectionId: string;
};

type QueueMobileFollowUpRecommendationUpgrade2Card = {
  key: string;
  label: string;
  severity: QueueAlertLevel;
  priorityScore: number;
  detail: string;
  actionLabel: string;
  targetSectionId: string;
};

type QueueHistorySortHardeningPlusExecutionCard = {
  key: string;
  label: string;
  severity: QueueAlertLevel;
  stabilizationScore: number;
  readinessScore: number;
  executionLabel: string;
  executionChecklist: string;
  detail: string;
  searchScope: QueueSearchSortScope;
  searchQuery: string;
  recommendedSortOption: QueueSearchSortOption;
  targetSectionId: string;
};

type QueueDelayRiskResponseExecutionTrackerCard = {
  key: string;
  queue: QueueFocus;
  label: string;
  severity: QueueAlertLevel;
  pendingCount: number;
  riskScore: number;
  responseWindow: string;
  trackerScore: number;
  trackerLabel: string;
  executionChecklist: string;
  detail: string;
  searchScope: QueueSearchSortScope;
  searchQuery: string;
  recommendedSortOption: QueueSearchSortOption;
  targetSectionId: string;
};

type QueueMobileFollowUpRecommendationUpgrade3Card = {
  key: string;
  label: string;
  severity: QueueAlertLevel;
  priorityScore: number;
  detail: string;
  actionLabel: string;
  targetSectionId: string;
};

type QueueHistorySortExecutionTrackerCard = {
  key: string;
  sourceKey: string;
  label: string;
  severity: QueueAlertLevel;
  trackerScore: number;
  detail: string;
  executionChecklist: string;
  executionLabel: string;
  targetSectionId: string;
};

type QueueDelayRiskExecutionBacklogCard = {
  key: string;
  sourceKey: string;
  label: string;
  severity: QueueAlertLevel;
  backlogScore: number;
  detail: string;
  responseWindow: string;
  executionChecklist: string;
  targetSectionId: string;
};

type QueueMobileFollowUpRecommendationUpgrade4Card = {
  key: string;
  label: string;
  severity: QueueAlertLevel;
  priorityScore: number;
  detail: string;
  actionLabel: string;
  targetSectionId: string;
};

type QueueHistoryExecutionSummaryCard = {
  key: string;
  sourceKey: string;
  label: string;
  severity: QueueAlertLevel;
  summaryScore: number;
  detail: string;
  executionChecklist: string;
  executionLabel: string;
  targetSectionId: string;
};

type QueueDelayExecutionBacklogDigestCard = {
  key: string;
  sourceKey: string;
  label: string;
  severity: QueueAlertLevel;
  digestScore: number;
  detail: string;
  responseWindow: string;
  executionChecklist: string;
  targetSectionId: string;
};

type QueueMobileFollowUpRecommendationUpgrade5Card = {
  key: string;
  label: string;
  severity: QueueAlertLevel;
  priorityScore: number;
  detail: string;
  actionLabel: string;
  targetSectionId: string;
};

function isTruthyFlag(value: string | undefined) {
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function toLocalInputValue(value: Date) {
  const adjusted = new Date(value.getTime() - value.getTimezoneOffset() * 60_000);
  return adjusted.toISOString().slice(0, 16);
}

function firstDayOfMonthLocal() {
  const now = new Date();
  return toLocalInputValue(new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0));
}

function lastDayOfMonthLocal() {
  const now = new Date();
  return toLocalInputValue(new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 0));
}

function toIso(value: string) {
  return new Date(value).toISOString();
}

function formatDateTime(value: string | null) {
  if (!value) {
    return "-";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString("ko-KR");
}

function formatKrw(value: number | null) {
  if (value === null) {
    return "-";
  }
  return `${value.toLocaleString("ko-KR")}원`;
}

function formatDays(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

function buildQuery(params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value.trim() === "") {
      continue;
    }
    search.set(key, value);
  }
  const query = search.toString();
  return query.length > 0 ? `?${query}` : "";
}

function minutesToHours(minutes: number) {
  const hours = minutes / 60;
  return `${hours.toFixed(1)}h`;
}

function toTimestamp(value: string | null) {
  if (!value) {
    return 0;
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 0;
  }
  return parsed.getTime();
}

function toWaitHours(value: string | null, referenceMs: number) {
  const timestamp = toTimestamp(value);
  if (timestamp <= 0) {
    return 0;
  }
  return Math.max(0, (referenceMs - timestamp) / 3_600_000);
}

function toQueueAlertLevelByRule(
  waitHours: number,
  watchThresholdHours: number,
  criticalThresholdHours: number
): QueueAlertLevel {
  if (waitHours >= criticalThresholdHours) {
    return "critical";
  }
  if (waitHours >= watchThresholdHours) {
    return "watch";
  }
  return "normal";
}

function queueAlertLevelRank(level: QueueAlertLevel) {
  if (level === "critical") {
    return 2;
  }
  if (level === "watch") {
    return 1;
  }
  return 0;
}

function matchesQueueSearchSort(
  scope: QueueSearchSortScope,
  normalizedQuery: string,
  row: QueueSearchSortRow
) {
  if (!normalizedQuery) {
    return true;
  }
  const queue = row.queueLabel.toLowerCase();
  const employee = row.employeeId.toLowerCase();
  const requestId = row.itemId.toLowerCase();
  const detail = row.detail.toLowerCase();

  if (scope === "queue") {
    return queue.includes(normalizedQuery);
  }
  if (scope === "employee") {
    return employee.includes(normalizedQuery);
  }
  if (scope === "request_id") {
    return requestId.includes(normalizedQuery);
  }
  if (scope === "detail") {
    return detail.includes(normalizedQuery);
  }
  return `${queue} ${employee} ${requestId} ${detail}`.includes(normalizedQuery);
}

function sortQueueSearchSortRows(rows: QueueSearchSortRow[], option: QueueSearchSortOption) {
  return [...rows].sort((left, right) => {
    if (option === "queue_asc") {
      const queueDiff = left.queueLabel.localeCompare(right.queueLabel, "ko");
      if (queueDiff !== 0) {
        return queueDiff;
      }
      return right.waitHours - left.waitHours;
    }
    if (option === "employee_asc") {
      const employeeDiff = left.employeeId.localeCompare(right.employeeId, "ko");
      if (employeeDiff !== 0) {
        return employeeDiff;
      }
      return right.waitHours - left.waitHours;
    }
    if (option === "recent_desc") {
      return right.waitedAtMs - left.waitedAtMs;
    }
    if (option === "wait_desc") {
      return right.waitHours - left.waitHours;
    }
    const severityDiff = queueAlertLevelRank(right.severity) - queueAlertLevelRank(left.severity);
    if (severityDiff !== 0) {
      return severityDiff;
    }
    const waitDiff = right.waitHours - left.waitHours;
    if (waitDiff !== 0) {
      return waitDiff;
    }
    return Number(right.selected) - Number(left.selected);
  });
}

function queueSearchSortOptionLabel(option: QueueSearchSortOption) {
  if (option === "priority_desc") {
    return "priority-desc";
  }
  if (option === "wait_desc") {
    return "wait-desc";
  }
  if (option === "recent_desc") {
    return "recent-desc";
  }
  if (option === "employee_asc") {
    return "employee-asc";
  }
  return "queue-asc";
}

function summarizeQueueAlertByRule(
  waitHoursValues: number[],
  watchThresholdHours: number,
  criticalThresholdHours: number
) {
  const oldestHours = waitHoursValues.length > 0 ? Math.max(...waitHoursValues) : 0;
  const critical = waitHoursValues.filter(
    (value) => toQueueAlertLevelByRule(value, watchThresholdHours, criticalThresholdHours) === "critical"
  ).length;
  const watch = waitHoursValues.filter(
    (value) => toQueueAlertLevelByRule(value, watchThresholdHours, criticalThresholdHours) === "watch"
  ).length;
  const alertLevel: QueueAlertLevel = critical > 0 ? "critical" : watch > 0 ? "watch" : "normal";
  return { oldestHours, critical, watch, alertLevel };
}

function summarizeSlaTimelineByRule(
  waitHoursValues: number[],
  watchThresholdHours: number,
  criticalThresholdHours: number
) {
  const total = waitHoursValues.length;
  let belowWatch = 0;
  let betweenWatchAndCritical = 0;
  let overCritical = 0;

  for (const waitHours of waitHoursValues) {
    if (waitHours >= criticalThresholdHours) {
      overCritical += 1;
    } else if (waitHours >= watchThresholdHours) {
      betweenWatchAndCritical += 1;
    } else {
      belowWatch += 1;
    }
  }

  const oldestHours = total > 0 ? Math.max(...waitHoursValues) : 0;
  return { total, belowWatch, betweenWatchAndCritical, overCritical, oldestHours };
}

function matchesQueueSearch(
  scope: QueueSearchScope,
  normalizedQuery: string,
  fields: { employee: string; requestId: string; content: string }
) {
  if (!normalizedQuery) {
    return true;
  }
  const employee = fields.employee.toLowerCase();
  const requestId = fields.requestId.toLowerCase();
  const content = fields.content.toLowerCase();

  if (scope === "employee") {
    return employee.includes(normalizedQuery);
  }
  if (scope === "request_id") {
    return requestId.includes(normalizedQuery);
  }
  if (scope === "content") {
    return content.includes(normalizedQuery);
  }
  return `${employee} ${requestId} ${content}`.includes(normalizedQuery);
}

function toQueueItemHistoryKey(queue: "attendance" | "leave" | "payroll", itemId: string) {
  return `${queue}:${itemId}`;
}

export default function AdminDashboardPage() {
  const showDevTools = isTruthyFlag(process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS);

  const [accessToken, setAccessToken] = useState("");
  const [organizationId, setOrganizationId] = useStickyStringState("flowhr:ctx:organizationId", "");
  const [adminActorId, setAdminActorId] = useStickyStringState("flowhr:ctx:adminId", "ADM-1001");
  const [organizationName, setOrganizationName] = useState("FlowHR Demo Org");
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([]);

  const [periodStart, setPeriodStart] = useState(firstDayOfMonthLocal());
  const [periodEnd, setPeriodEnd] = useState(lastDayOfMonthLocal());

  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [employeeId, setEmployeeId] = useState("EMP-1001");
  const [employeeName, setEmployeeName] = useState("");
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [employeeActive, setEmployeeActive] = useState(true);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<InviteRole>("employee");
  const [inviteDeliveryMode, setInviteDeliveryMode] = useState<InviteDeliveryMode>("link");
  const [inviteActorId, setInviteActorId] = useState("EMP-1001");
  const [inviteResult, setInviteResult] = useState<InviteResultDto | null>(null);

  const [scheduleEmployeeId, setScheduleEmployeeId] = useState("EMP-1001");
  const [scheduleIsHoliday, setScheduleIsHoliday] = useState(false);
  const [scheduleStartAt, setScheduleStartAt] = useState(() => {
    const now = new Date();
    return toLocalInputValue(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0));
  });
  const [scheduleEndAt, setScheduleEndAt] = useState(() => {
    const now = new Date();
    return toLocalInputValue(new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0));
  });
  const [scheduleBreakMinutes, setScheduleBreakMinutes] = useState("60");
  const [scheduleNotes, setScheduleNotes] = useState("");
  const [schedules, setSchedules] = useState<WorkScheduleDto[]>([]);

  const [attendanceRejectReason, setAttendanceRejectReason] = useState("");
  const [leaveRejectReason, setLeaveRejectReason] = useState("");
  const [pendingAttendance, setPendingAttendance] = useState<AttendanceRecordDto[]>([]);
  const [pendingLeave, setPendingLeave] = useState<LeaveRequestDto[]>([]);
  const [previewedPayroll, setPreviewedPayroll] = useState<PayrollRunDto[]>([]);
  const [selectedAttendanceIds, setSelectedAttendanceIds] = useState<string[]>([]);
  const [selectedLeaveIds, setSelectedLeaveIds] = useState<string[]>([]);
  const [approvalQueueFocus, setApprovalQueueFocus] = useState<QueueFocus>("all");
  const [approvalQueueSearch, setApprovalQueueSearch] = useState("");
  const [approvalQueueSearchScope, setApprovalQueueSearchScope] = useState<QueueSearchScope>("all");
  const [approvalQueueOnlyUrgent, setApprovalQueueOnlyUrgent] = useState(false);
  const [approvalQueueSelectedOnly, setApprovalQueueSelectedOnly] = useState(false);
  const [attendanceQueueSort, setAttendanceQueueSort] = useState<AttendanceQueueSort>("checkin_desc");
  const [leaveQueueSort, setLeaveQueueSort] = useState<LeaveQueueSort>("start_desc");
  const [payrollQueueSort, setPayrollQueueSort] = useState<PayrollQueueSort>("period_desc");
  const [queueSearchSortScope, setQueueSearchSortScope] = useState<QueueSearchSortScope>("all");
  const [queueSearchSortQuery, setQueueSearchSortQuery] = useState("");
  const [queueSearchSortOption, setQueueSearchSortOption] = useState<QueueSearchSortOption>("priority_desc");
  const [queueSlaWatchHoursInput, setQueueSlaWatchHoursInput] = useState("24");
  const [queueSlaCriticalHoursInput, setQueueSlaCriticalHoursInput] = useState("48");

  const [aggregateEmployeeId, setAggregateEmployeeId] = useState("");
  const [aggregates, setAggregates] = useState<AttendanceAggregateDto[]>([]);

  const [accrualEmployeeId, setAccrualEmployeeId] = useState("EMP-1001");
  const [accrualYear, setAccrualYear] = useState(String(new Date().getFullYear()));
  const [accrualGrantDays, setAccrualGrantDays] = useState("15");
  const [accrualCarryCapDays, setAccrualCarryCapDays] = useState("5");
  const [leaveAllowHalfDay, setLeaveAllowHalfDay] = useState(true);
  const [leaveAllowHourly, setLeaveAllowHourly] = useState(true);
  const [leaveHourlyIncrementMinutes, setLeaveHourlyIncrementMinutes] = useState("30");
  const [leaveMaxHoursPerRequest, setLeaveMaxHoursPerRequest] = useState("8");
  const [leaveMinNoticeDays, setLeaveMinNoticeDays] = useState("0");
  const [leaveMaxConsecutiveDays, setLeaveMaxConsecutiveDays] = useState("");
  const [accrualResult, setAccrualResult] = useState<LeaveBalanceDto | null>(null);

  const [payrollHourlyRateKrw, setPayrollHourlyRateKrw] = useState("12000");
  const [payrollPreviewMode, setPayrollPreviewMode] = useState<"gross" | "statutory_kr_baseline">(
    "gross"
  );
  const [payrollNonTaxableIncomeKrw, setPayrollNonTaxableIncomeKrw] = useState("0");
  const [payrollOtherDeductionsKrw, setPayrollOtherDeductionsKrw] = useState("0");
  const [payrollAdditionalTaxCreditKrw, setPayrollAdditionalTaxCreditKrw] = useState("0");
  const [payrollDependentCount, setPayrollDependentCount] = useState("0");
  const [payrollDependentTaxCreditPerPersonKrw, setPayrollDependentTaxCreditPerPersonKrw] =
    useState("0");
  const [payrollRequireMonthlyBoundary, setPayrollRequireMonthlyBoundary] = useState(false);
  const [payrollNationalPensionCapKrw, setPayrollNationalPensionCapKrw] = useState("");
  const [payrollHealthInsuranceCapKrw, setPayrollHealthInsuranceCapKrw] = useState("");
  const [payrollEmploymentInsuranceCapKrw, setPayrollEmploymentInsuranceCapKrw] = useState("");
  const [lastPayrollRunId, setLastPayrollRunId] = useState("");

  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [approvalActivities, setApprovalActivities] = useState<ApprovalActivity[]>([]);
  const [mobileApprovalFeedback, setMobileApprovalFeedback] =
    useState<QueueMobileApprovalFeedback | null>(null);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);

  const isProductionRuntime = process.env.NODE_ENV === "production";
  const { snapshot: supabaseSession, error: supabaseSessionError } = useSupabaseSession();

  const bearerToken =
    accessToken.trim().length > 0
      ? accessToken.trim()
      : isProductionRuntime
        ? (supabaseSession?.accessToken ?? "")
        : "";

  const usesBearerToken = bearerToken.trim().length > 0;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "not configured";

  useEffect(() => {
    if (!isProductionRuntime) {
      return;
    }
    if (organizationId.trim()) {
      return;
    }
    const orgId = supabaseSession?.organizationId ?? "";
    if (orgId.trim().length > 0) {
      setOrganizationId(orgId.trim());
    }
  }, [isProductionRuntime, organizationId, setOrganizationId, supabaseSession?.organizationId]);

  const stats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter((log) => log.ok).length;
    const fail = total - success;
    return { total, success, fail };
  }, [logs]);

  const selectedAttendanceCount = selectedAttendanceIds.length;
  const selectedLeaveCount = selectedLeaveIds.length;
  const selectedQueueTotalCount = selectedAttendanceCount + selectedLeaveCount;
  const normalizedQueueSearch = approvalQueueSearch.trim().toLowerCase();
  const queueNowMs = Date.now();

  const attendanceWaitHoursById = useMemo(
    () =>
      new Map(
        pendingAttendance.map((record) => [record.id, toWaitHours(record.checkInAt, queueNowMs)] as const)
      ),
    [pendingAttendance, queueNowMs]
  );
  const leaveWaitHoursById = useMemo(
    () =>
      new Map(
        pendingLeave.map((request) => [request.id, toWaitHours(request.startDate, queueNowMs)] as const)
      ),
    [pendingLeave, queueNowMs]
  );
  const payrollWaitHoursById = useMemo(
    () =>
      new Map(
        previewedPayroll.map((run) => [run.id, toWaitHours(run.periodStart, queueNowMs)] as const)
      ),
    [previewedPayroll, queueNowMs]
  );
  const attendanceWaitHoursValues = useMemo(
    () => [...attendanceWaitHoursById.values()],
    [attendanceWaitHoursById]
  );
  const leaveWaitHoursValues = useMemo(() => [...leaveWaitHoursById.values()], [leaveWaitHoursById]);
  const payrollWaitHoursValues = useMemo(
    () => [...payrollWaitHoursById.values()],
    [payrollWaitHoursById]
  );
  const queueSlaWatchHours = useMemo(() => {
    const parsed = Math.floor(Number(queueSlaWatchHoursInput));
    if (!Number.isFinite(parsed)) {
      return 24;
    }
    return Math.max(1, parsed);
  }, [queueSlaWatchHoursInput]);
  const queueSlaCriticalHours = useMemo(() => {
    const parsed = Math.floor(Number(queueSlaCriticalHoursInput));
    const fallback = Math.max(queueSlaWatchHours + 1, 48);
    if (!Number.isFinite(parsed)) {
      return fallback;
    }
    return Math.max(queueSlaWatchHours + 1, parsed);
  }, [queueSlaCriticalHoursInput, queueSlaWatchHours]);
  const resolveQueueAlertLevel = useMemo(
    () =>
      (waitHours: number) =>
        toQueueAlertLevelByRule(waitHours, queueSlaWatchHours, queueSlaCriticalHours),
    [queueSlaCriticalHours, queueSlaWatchHours]
  );

  const filteredPendingAttendance = useMemo(() => {
    const filtered = pendingAttendance.filter((record) => {
      const waitHours = attendanceWaitHoursById.get(record.id) ?? 0;
      const alertLevel = resolveQueueAlertLevel(waitHours);
      if (approvalQueueOnlyUrgent && alertLevel === "normal") {
        return false;
      }
      if (approvalQueueSelectedOnly && !selectedAttendanceIds.includes(record.id)) {
        return false;
      }

      return matchesQueueSearch(approvalQueueSearchScope, normalizedQueueSearch, {
        employee: record.employeeId,
        requestId: record.id,
        content: `${record.state} ${record.notes ?? ""} ${record.checkInAt} ${record.checkOutAt ?? ""}`
      });
    });

    return [...filtered].sort((left, right) => {
      if (attendanceQueueSort === "employee_asc") {
        return left.employeeId.localeCompare(right.employeeId, "ko");
      }
      if (attendanceQueueSort === "stale_desc") {
        const leftWait = attendanceWaitHoursById.get(left.id) ?? 0;
        const rightWait = attendanceWaitHoursById.get(right.id) ?? 0;
        return rightWait - leftWait;
      }
      const leftTime = toTimestamp(left.checkInAt);
      const rightTime = toTimestamp(right.checkInAt);
      if (attendanceQueueSort === "checkin_asc") {
        return leftTime - rightTime;
      }
      return rightTime - leftTime;
    });
  }, [
    approvalQueueOnlyUrgent,
    approvalQueueSearchScope,
    approvalQueueSelectedOnly,
    attendanceQueueSort,
    attendanceWaitHoursById,
    normalizedQueueSearch,
    pendingAttendance,
    resolveQueueAlertLevel,
    selectedAttendanceIds
  ]);

  const filteredPendingLeave = useMemo(() => {
    const filtered = pendingLeave.filter((request) => {
      const waitHours = leaveWaitHoursById.get(request.id) ?? 0;
      const alertLevel = resolveQueueAlertLevel(waitHours);
      if (approvalQueueOnlyUrgent && alertLevel === "normal") {
        return false;
      }
      if (approvalQueueSelectedOnly && !selectedLeaveIds.includes(request.id)) {
        return false;
      }

      return matchesQueueSearch(approvalQueueSearchScope, normalizedQueueSearch, {
        employee: request.employeeId,
        requestId: request.id,
        content: `${request.leaveType} ${request.state} ${request.startDate} ${request.endDate} ${request.reason ?? ""}`
      });
    });

    return [...filtered].sort((left, right) => {
      if (leaveQueueSort === "employee_asc") {
        return left.employeeId.localeCompare(right.employeeId, "ko");
      }
      if (leaveQueueSort === "stale_desc") {
        const leftWait = leaveWaitHoursById.get(left.id) ?? 0;
        const rightWait = leaveWaitHoursById.get(right.id) ?? 0;
        return rightWait - leftWait;
      }
      const leftTime = toTimestamp(left.startDate);
      const rightTime = toTimestamp(right.startDate);
      if (leaveQueueSort === "start_asc") {
        return leftTime - rightTime;
      }
      return rightTime - leftTime;
    });
  }, [
    approvalQueueOnlyUrgent,
    approvalQueueSearchScope,
    approvalQueueSelectedOnly,
    leaveQueueSort,
    leaveWaitHoursById,
    normalizedQueueSearch,
    pendingLeave,
    resolveQueueAlertLevel,
    selectedLeaveIds
  ]);

  const filteredPreviewedPayroll = useMemo(() => {
    const filtered = previewedPayroll.filter((run) => {
      if (approvalQueueOnlyUrgent && resolveQueueAlertLevel(payrollWaitHoursById.get(run.id) ?? 0) === "normal") {
        return false;
      }
      if (approvalQueueSelectedOnly) {
        return false;
      }

      return matchesQueueSearch(approvalQueueSearchScope, normalizedQueueSearch, {
        employee: run.employeeId ?? "",
        requestId: run.id,
        content: `${run.state} ${run.periodStart} ${run.periodEnd} ${run.grossPayKrw}`
      });
    });

    return [...filtered].sort((left, right) => {
      if (payrollQueueSort === "employee_asc") {
        return (left.employeeId ?? "").localeCompare(right.employeeId ?? "", "ko");
      }
      if (payrollQueueSort === "stale_desc") {
        const leftWait = payrollWaitHoursById.get(left.id) ?? 0;
        const rightWait = payrollWaitHoursById.get(right.id) ?? 0;
        return rightWait - leftWait;
      }
      if (payrollQueueSort === "gross_desc") {
        return right.grossPayKrw - left.grossPayKrw;
      }
      const leftPeriod = toTimestamp(left.periodStart);
      const rightPeriod = toTimestamp(right.periodStart);
      return rightPeriod - leftPeriod;
    });
  }, [
    approvalQueueOnlyUrgent,
    approvalQueueSearchScope,
    approvalQueueSelectedOnly,
    normalizedQueueSearch,
    payrollQueueSort,
    payrollWaitHoursById,
    previewedPayroll,
    resolveQueueAlertLevel
  ]);

  const showAttendanceQueue = approvalQueueFocus === "all" || approvalQueueFocus === "attendance";
  const showLeaveQueue = approvalQueueFocus === "all" || approvalQueueFocus === "leave";
  const showPayrollQueue = approvalQueueFocus === "all" || approvalQueueFocus === "payroll";

  const selectedVisibleAttendanceCount = filteredPendingAttendance.filter((record) =>
    selectedAttendanceIds.includes(record.id)
  ).length;
  const selectedVisibleLeaveCount = filteredPendingLeave.filter((request) =>
    selectedLeaveIds.includes(request.id)
  ).length;

  const hasAttendanceSelection = selectedAttendanceCount > 0;
  const hasLeaveSelection = selectedLeaveCount > 0;
  const hasOnlyVisibleAttendanceSelected = selectedAttendanceCount === selectedVisibleAttendanceCount;
  const hasOnlyVisibleLeaveSelected = selectedLeaveCount === selectedVisibleLeaveCount;
  const hasLeaveRejectReason = leaveRejectReason.trim().length > 0;
  const hasAttendanceRejectReason = attendanceRejectReason.trim().length > 0;

  const canApproveSelectedAttendance = hasAttendanceSelection && hasOnlyVisibleAttendanceSelected;
  const canRejectSelectedAttendance = hasAttendanceSelection && hasOnlyVisibleAttendanceSelected;
  const canApproveSelectedLeave = hasLeaveSelection && hasOnlyVisibleLeaveSelected;
  const canRejectSelectedLeave = hasLeaveSelection && hasOnlyVisibleLeaveSelected && hasLeaveRejectReason;

  const attendanceBulkValidationChecks = useMemo<QueuePreActionCheck[]>(
    () => [
      {
        id: "attendance-selected",
        label: "attendance selection",
        ok: hasAttendanceSelection,
        detail: hasAttendanceSelection ? `${selectedAttendanceCount} selected` : "no selected item"
      },
      {
        id: "attendance-visible-only",
        label: "selection synced with current filter",
        ok: hasOnlyVisibleAttendanceSelected,
        detail: hasOnlyVisibleAttendanceSelected
          ? "all selected items are visible"
          : `${selectedAttendanceCount - selectedVisibleAttendanceCount} hidden selected`
      },
      {
        id: "attendance-reject-reason",
        label: "reject reason (recommended)",
        ok: hasAttendanceRejectReason,
        detail: hasAttendanceRejectReason ? "reason provided" : "reason is optional but recommended"
      }
    ],
    [
      hasAttendanceRejectReason,
      hasAttendanceSelection,
      hasOnlyVisibleAttendanceSelected,
      selectedAttendanceCount,
      selectedVisibleAttendanceCount
    ]
  );

  const leaveBulkValidationChecks = useMemo<QueuePreActionCheck[]>(
    () => [
      {
        id: "leave-selected",
        label: "leave selection",
        ok: hasLeaveSelection,
        detail: hasLeaveSelection ? `${selectedLeaveCount} selected` : "no selected item"
      },
      {
        id: "leave-visible-only",
        label: "selection synced with current filter",
        ok: hasOnlyVisibleLeaveSelected,
        detail: hasOnlyVisibleLeaveSelected
          ? "all selected items are visible"
          : `${selectedLeaveCount - selectedVisibleLeaveCount} hidden selected`
      },
      {
        id: "leave-reject-reason",
        label: "reject reason (required for bulk reject)",
        ok: hasLeaveRejectReason,
        detail: hasLeaveRejectReason ? "reason ready" : "bulk reject is disabled until reason is filled"
      }
    ],
    [
      hasLeaveRejectReason,
      hasLeaveSelection,
      hasOnlyVisibleLeaveSelected,
      selectedLeaveCount,
      selectedVisibleLeaveCount
    ]
  );

  const approvalItemHistorySummaryMap = useMemo(() => {
    const map = new Map<string, QueueItemHistorySummary>();
    for (const activity of approvalActivities) {
      const key = toQueueItemHistoryKey(activity.queue, activity.itemId);
      const existing = map.get(key);
      if (!existing) {
        map.set(key, {
          key,
          queue: activity.queue,
          itemId: activity.itemId,
          total: 1,
          success: activity.ok ? 1 : 0,
          fail: activity.ok ? 0 : 1,
          approved: activity.actionKind === "approve" ? 1 : 0,
          rejected: activity.actionKind === "reject" ? 1 : 0,
          confirmed: activity.actionKind === "confirm" ? 1 : 0,
          lastAction: activity.action,
          lastStatus: activity.status,
          lastAt: activity.at,
          lastCreatedAtMs: activity.createdAtMs
        });
        continue;
      }

      existing.total += 1;
      if (activity.ok) {
        existing.success += 1;
      } else {
        existing.fail += 1;
      }
      if (activity.actionKind === "approve") {
        existing.approved += 1;
      } else if (activity.actionKind === "reject") {
        existing.rejected += 1;
      } else if (activity.actionKind === "confirm") {
        existing.confirmed += 1;
      }
      if (activity.createdAtMs >= existing.lastCreatedAtMs) {
        existing.lastAction = activity.action;
        existing.lastStatus = activity.status;
        existing.lastAt = activity.at;
        existing.lastCreatedAtMs = activity.createdAtMs;
      }
    }
    return map;
  }, [approvalActivities]);

  const approvalItemHistoryRows = useMemo(
    () =>
      [...approvalItemHistorySummaryMap.values()]
        .sort((left, right) => right.lastCreatedAtMs - left.lastCreatedAtMs)
        .slice(0, 12),
    [approvalItemHistorySummaryMap]
  );

  const queueFeedbackByQueue = useMemo(() => {
    const map = new Map<
      "attendance" | "leave" | "payroll",
      { queue: "attendance" | "leave" | "payroll"; ok: number; fail: number }
    >();
    for (const activity of approvalActivities.slice(0, 12)) {
      const existing = map.get(activity.queue) ?? { queue: activity.queue, ok: 0, fail: 0 };
      if (activity.ok) {
        existing.ok += 1;
      } else {
        existing.fail += 1;
      }
      map.set(activity.queue, existing);
    }
    return [...map.values()];
  }, [approvalActivities]);

  function formatQueueItemHistoryInline(queue: "attendance" | "leave" | "payroll", itemId: string) {
    const summary = approvalItemHistorySummaryMap.get(toQueueItemHistoryKey(queue, itemId));
    if (!summary) {
      return "history 0";
    }
    return `history ${summary.total} / ok ${summary.success} / fail ${summary.fail}`;
  }

  const queueBadgeSummaries = useMemo<QueueBadgeSummary[]>(
    () => [
      {
        focus: "all",
        label: "전체",
        pending: pendingAttendance.length + pendingLeave.length + previewedPayroll.length,
        visible:
          filteredPendingAttendance.length +
          filteredPendingLeave.length +
          filteredPreviewedPayroll.length,
        selected: selectedVisibleAttendanceCount + selectedVisibleLeaveCount,
        ...summarizeQueueAlertByRule(
          [
          ...attendanceWaitHoursValues,
          ...leaveWaitHoursValues,
          ...payrollWaitHoursValues
          ],
          queueSlaWatchHours,
          queueSlaCriticalHours
        )
      },
      {
        focus: "attendance",
        label: "출퇴근",
        pending: pendingAttendance.length,
        visible: filteredPendingAttendance.length,
        selected: selectedVisibleAttendanceCount,
        ...summarizeQueueAlertByRule(
          attendanceWaitHoursValues,
          queueSlaWatchHours,
          queueSlaCriticalHours
        )
      },
      {
        focus: "leave",
        label: "휴가",
        pending: pendingLeave.length,
        visible: filteredPendingLeave.length,
        selected: selectedVisibleLeaveCount,
        ...summarizeQueueAlertByRule(leaveWaitHoursValues, queueSlaWatchHours, queueSlaCriticalHours)
      },
      {
        focus: "payroll",
        label: "급여",
        pending: previewedPayroll.length,
        visible: filteredPreviewedPayroll.length,
        selected: 0,
        ...summarizeQueueAlertByRule(
          payrollWaitHoursValues,
          queueSlaWatchHours,
          queueSlaCriticalHours
        )
      }
    ],
    [
      attendanceWaitHoursValues,
      filteredPendingAttendance.length,
      filteredPendingLeave.length,
      filteredPreviewedPayroll.length,
      leaveWaitHoursValues,
      pendingAttendance.length,
      pendingLeave.length,
      payrollWaitHoursValues,
      previewedPayroll.length,
      queueSlaCriticalHours,
      queueSlaWatchHours,
      selectedVisibleAttendanceCount,
      selectedVisibleLeaveCount
    ]
  );

  const activeQueueBadgeSummary =
    queueBadgeSummaries.find((badge) => badge.focus === approvalQueueFocus) ?? queueBadgeSummaries[0];

  const queueAlertOverview = useMemo(() => {
    const queueBadges = queueBadgeSummaries.filter((badge) => badge.focus !== "all");
    const totalCritical = queueBadges.reduce((sum, badge) => sum + badge.critical, 0);
    const totalWatch = queueBadges.reduce((sum, badge) => sum + badge.watch, 0);
    const hottestQueue =
      queueBadges.length === 0
        ? null
        : [...queueBadges].sort((left, right) => {
            const levelDiff = queueAlertLevelRank(right.alertLevel) - queueAlertLevelRank(left.alertLevel);
            if (levelDiff !== 0) {
              return levelDiff;
            }
            return right.oldestHours - left.oldestHours;
          })[0];
    return { totalCritical, totalWatch, hottestQueue };
  }, [queueBadgeSummaries]);

  const queueSearchSortRows = useMemo<QueueSearchSortRow[]>(() => {
    const attendanceRows = filteredPendingAttendance.map((record) => ({
      key: `attendance:${record.id}`,
      queue: "attendance" as const,
      queueLabel: "attendance",
      itemId: record.id,
      employeeId: record.employeeId,
      waitHours: attendanceWaitHoursById.get(record.id) ?? 0,
      waitedAtMs: toTimestamp(record.checkInAt),
      severity: resolveQueueAlertLevel(attendanceWaitHoursById.get(record.id) ?? 0),
      selected: selectedAttendanceIds.includes(record.id),
      detail: `${record.state} ${record.notes ?? ""} ${record.checkInAt} ${record.checkOutAt ?? ""}`
    }));
    const leaveRows = filteredPendingLeave.map((request) => ({
      key: `leave:${request.id}`,
      queue: "leave" as const,
      queueLabel: "leave",
      itemId: request.id,
      employeeId: request.employeeId,
      waitHours: leaveWaitHoursById.get(request.id) ?? 0,
      waitedAtMs: toTimestamp(request.startDate),
      severity: resolveQueueAlertLevel(leaveWaitHoursById.get(request.id) ?? 0),
      selected: selectedLeaveIds.includes(request.id),
      detail: `${request.leaveType} ${request.state} ${request.startDate} ${request.endDate} ${request.reason ?? ""}`
    }));
    const payrollRows = filteredPreviewedPayroll.map((run) => ({
      key: `payroll:${run.id}`,
      queue: "payroll" as const,
      queueLabel: "payroll",
      itemId: run.id,
      employeeId: run.employeeId ?? "-",
      waitHours: payrollWaitHoursById.get(run.id) ?? 0,
      waitedAtMs: toTimestamp(run.periodStart),
      severity: resolveQueueAlertLevel(payrollWaitHoursById.get(run.id) ?? 0),
      selected: false,
      detail: `${run.state} ${run.periodStart} ${run.periodEnd} ${run.grossPayKrw}`
    }));
    return [...attendanceRows, ...leaveRows, ...payrollRows];
  }, [
    attendanceWaitHoursById,
    filteredPendingAttendance,
    filteredPendingLeave,
    filteredPreviewedPayroll,
    leaveWaitHoursById,
    payrollWaitHoursById,
    resolveQueueAlertLevel,
    selectedAttendanceIds,
    selectedLeaveIds
  ]);

  const filteredQueueSearchSortRows = useMemo(() => {
    const normalizedQuery = queueSearchSortQuery.trim().toLowerCase();
    const filteredRows = queueSearchSortRows.filter((row) =>
      matchesQueueSearchSort(queueSearchSortScope, normalizedQuery, row)
    );

    return sortQueueSearchSortRows(filteredRows, queueSearchSortOption).slice(0, 18);
  }, [queueSearchSortOption, queueSearchSortQuery, queueSearchSortRows, queueSearchSortScope]);

  const queueHistorySortAccuracyCards = useMemo<QueueHistorySortAccuracyCard[]>(() => {
    const normalizedQuery = queueSearchSortQuery.trim().toLowerCase();
    const scopedRows = queueSearchSortRows.filter((row) =>
      matchesQueueSearchSort(queueSearchSortScope, normalizedQuery, row)
    );
    const currentTopRows = sortQueueSearchSortRows(scopedRows, queueSearchSortOption);
    const totalCompared = Math.min(10, currentTopRows.length);
    const currentTopKeys = new Set(currentTopRows.slice(0, totalCompared).map((row) => row.key));

    const toAccuracyCard = (
      key: string,
      label: string,
      baselineOption: QueueSearchSortOption,
      targetSectionId: string
    ): QueueHistorySortAccuracyCard => {
      if (totalCompared === 0) {
        return {
          key,
          label,
          severity: "normal",
          accuracyScore: 100,
          matchedCount: 0,
          totalCompared: 0,
          detail: "No rows available for current search/sort scope.",
          targetSectionId
        };
      }

      const baselineTopRows = sortQueueSearchSortRows(scopedRows, baselineOption).slice(0, totalCompared);
      const matchedCount = baselineTopRows.filter((row) => currentTopKeys.has(row.key)).length;
      const accuracyScore = Math.round((matchedCount / totalCompared) * 100);
      const severity: QueueAlertLevel = accuracyScore < 50 ? "critical" : accuracyScore < 75 ? "watch" : "normal";

      return {
        key,
        label,
        severity,
        accuracyScore,
        matchedCount,
        totalCompared,
        detail: `Top ${matchedCount}/${totalCompared} rows match ${label.toLowerCase()}.`,
        targetSectionId
      };
    };

    return [
      toAccuracyCard("priority", "priority-first baseline", "priority_desc", "approval-search-sort"),
      toAccuracyCard("wait", "wait-time baseline", "wait_desc", "approval-search-sort"),
      toAccuracyCard("recent", "recent-first baseline", "recent_desc", "approval-search-sort")
    ].sort((left, right) => {
      const severityDiff = queueAlertLevelRank(right.severity) - queueAlertLevelRank(left.severity);
      if (severityDiff !== 0) {
        return severityDiff;
      }
      return left.accuracyScore - right.accuracyScore;
    });
  }, [queueSearchSortOption, queueSearchSortQuery, queueSearchSortRows, queueSearchSortScope]);

  const queueHistorySortHardeningCards = useMemo<QueueHistorySortHardeningCard[]>(() => {
    const cards = queueHistorySortAccuracyCards.map((card) => {
      let searchScope: QueueSearchSortScope = "all";
      let searchQuery = "";
      let recommendedSortOption: QueueSearchSortOption = "priority_desc";
      if (card.key === "priority") {
        searchScope = "detail";
        searchQuery = "pending";
        recommendedSortOption = "priority_desc";
      } else if (card.key === "wait") {
        recommendedSortOption = "wait_desc";
      } else if (card.key === "recent") {
        recommendedSortOption = "recent_desc";
      }

      const confidenceGap = Math.max(0, 100 - card.accuracyScore);
      const alreadyAligned = queueSearchSortOption === recommendedSortOption;
      const responseLabel =
        card.totalCompared === 0
          ? "No rows in current search scope."
          : card.severity === "critical"
            ? `Apply ${queueSearchSortOptionLabel(recommendedSortOption)} and re-triage top rows now.`
            : card.severity === "watch"
              ? `Apply ${queueSearchSortOptionLabel(recommendedSortOption)} and verify queue ordering.`
              : alreadyAligned
                ? "Current sort option is already aligned."
                : `Switch to ${queueSearchSortOptionLabel(recommendedSortOption)} for higher ordering confidence.`;

      return {
        key: card.key,
        label: card.label,
        severity: card.severity,
        accuracyScore: card.accuracyScore,
        confidenceGap,
        totalCompared: card.totalCompared,
        responseLabel,
        detail:
          card.totalCompared === 0
            ? "No queue rows available for hardening."
            : `Accuracy ${card.accuracyScore} with confidence gap ${confidenceGap}.`,
        searchScope,
        searchQuery,
        recommendedSortOption,
        targetSectionId: "approval-search-sort"
      };
    });

    return cards.sort((left, right) => {
      const severityDiff = queueAlertLevelRank(right.severity) - queueAlertLevelRank(left.severity);
      if (severityDiff !== 0) {
        return severityDiff;
      }
      return right.confidenceGap - left.confidenceGap;
    });
  }, [queueHistorySortAccuracyCards, queueSearchSortOption]);

  const queueHistorySortHardeningPlusCards = useMemo<QueueHistorySortHardeningPlusCard[]>(() => {
    const cards = queueHistorySortHardeningCards.map((card) => {
      let searchScope = card.searchScope;
      let searchQuery = card.searchQuery;
      let recommendedSortOption = card.recommendedSortOption;
      if (card.key === "recent") {
        searchScope = "detail";
        searchQuery = "pending";
        recommendedSortOption = "recent_desc";
      }

      const alignmentBonus = queueSearchSortOption === recommendedSortOption ? 12 : 0;
      const stabilizationScore =
        card.totalCompared === 0 ? 0 : Math.min(100, Math.max(0, 100 - card.confidenceGap + alignmentBonus));
      const executionLabel =
        card.totalCompared === 0
          ? "No rows to execute."
          : card.severity === "critical"
            ? "Immediate hardening run required."
            : card.severity === "watch"
              ? "Run hardening in this cycle."
              : "Monitor current alignment.";

      return {
        key: card.key,
        label: card.label,
        severity: card.severity,
        confidenceGap: card.confidenceGap,
        stabilizationScore,
        responseLabel:
          card.totalCompared === 0
            ? "No queue rows in scope."
            : `Apply ${queueSearchSortOptionLabel(recommendedSortOption)} and confirm top-row stability.`,
        executionLabel,
        detail:
          card.totalCompared === 0
            ? "Hardening+ skipped because there are no queue rows."
            : `gap ${card.confidenceGap} / stabilization score ${stabilizationScore}.`,
        searchScope,
        searchQuery,
        recommendedSortOption,
        targetSectionId: "approval-search-sort"
      };
    });

    return cards.sort((left, right) => {
      const severityDiff = queueAlertLevelRank(right.severity) - queueAlertLevelRank(left.severity);
      if (severityDiff !== 0) {
        return severityDiff;
      }
      return right.stabilizationScore - left.stabilizationScore;
    });
  }, [queueHistorySortHardeningCards, queueSearchSortOption]);

  const queueHistorySortHardeningPlusExecutionCards = useMemo<QueueHistorySortHardeningPlusExecutionCard[]>(() => {
    const cards = queueHistorySortHardeningPlusCards.map((card) => {
      const aligned = queueSearchSortOption === card.recommendedSortOption;
      const severityPenalty = card.severity === "critical" ? 26 : card.severity === "watch" ? 12 : 0;
      const readinessScore = Math.max(0, Math.min(100, card.stabilizationScore - severityPenalty + (aligned ? 8 : 0)));
      const executionLabel =
        card.stabilizationScore === 0
          ? "prepare scope"
          : card.severity === "critical"
            ? "execute now"
            : card.severity === "watch"
              ? "execute this cycle"
              : "monitor";
      const executionChecklist =
        card.stabilizationScore === 0
          ? "No queue rows in scope. Reset search options and refresh queue rows first."
          : card.key === "priority"
            ? "Apply priority-first sort and verify high-severity pending items are on top."
            : card.key === "wait"
              ? "Apply wait-desc sort and confirm oldest backlog is processed first."
              : "Apply recent-first sort and validate recency-driven handoff order.";

      return {
        key: card.key,
        label: card.label,
        severity: card.severity,
        stabilizationScore: card.stabilizationScore,
        readinessScore,
        executionLabel,
        executionChecklist,
        detail:
          card.stabilizationScore === 0
            ? "Execution card is idle because queue rows are empty."
            : `stability ${card.stabilizationScore} / readiness ${readinessScore}.`,
        searchScope: card.searchScope,
        searchQuery: card.searchQuery,
        recommendedSortOption: card.recommendedSortOption,
        targetSectionId: card.targetSectionId
      };
    });

    return cards.sort((left, right) => {
      const severityDiff = queueAlertLevelRank(right.severity) - queueAlertLevelRank(left.severity);
      if (severityDiff !== 0) {
        return severityDiff;
      }
      return right.readinessScore - left.readinessScore;
    });
  }, [queueHistorySortHardeningPlusCards, queueSearchSortOption]);

  const queueEvidencePreviewCards = useMemo<QueueEvidencePreviewCard[]>(() => {
    const attendanceCards: QueueEvidencePreviewCard[] = filteredPendingAttendance.map((record) => {
      const waitedHours = attendanceWaitHoursById.get(record.id) ?? 0;
      const historySummary = approvalItemHistorySummaryMap.get(
        toQueueItemHistoryKey("attendance", record.id)
      );

      return {
        key: `attendance:${record.id}`,
        queue: "attendance",
        itemId: record.id,
        employeeId: record.employeeId,
        primary: `${formatDateTime(record.checkInAt)} ~ ${formatDateTime(record.checkOutAt)} / 휴게 ${record.breakMinutes}분`,
        secondary: record.notes?.trim() ? `메모: ${record.notes.trim()}` : "메모 없음",
        waitedHours,
        alertLevel: resolveQueueAlertLevel(waitedHours),
        historySummary: historySummary
          ? `history ${historySummary.total} / ok ${historySummary.success} / fail ${historySummary.fail}`
          : "history 0",
        selected: selectedAttendanceIds.includes(record.id)
      };
    });

    const leaveCards: QueueEvidencePreviewCard[] = filteredPendingLeave.map((request) => {
      const waitedHours = leaveWaitHoursById.get(request.id) ?? 0;
      const historySummary = approvalItemHistorySummaryMap.get(toQueueItemHistoryKey("leave", request.id));
      const reasonParts = [request.reason?.trim(), request.decisionReason?.trim()].filter(
        (value): value is string => Boolean(value)
      );

      return {
        key: `leave:${request.id}`,
        queue: "leave",
        itemId: request.id,
        employeeId: request.employeeId,
        primary: `${request.leaveType} / ${formatDateTime(request.startDate)} ~ ${formatDateTime(request.endDate)} (${formatDays(request.days)}일)`,
        secondary: reasonParts.length > 0 ? `사유: ${reasonParts.join(" / ")}` : "사유 없음",
        waitedHours,
        alertLevel: resolveQueueAlertLevel(waitedHours),
        historySummary: historySummary
          ? `history ${historySummary.total} / ok ${historySummary.success} / fail ${historySummary.fail}`
          : "history 0",
        selected: selectedLeaveIds.includes(request.id)
      };
    });

    const payrollCards: QueueEvidencePreviewCard[] = filteredPreviewedPayroll.map((run) => {
      const waitedHours = payrollWaitHoursById.get(run.id) ?? 0;
      const historySummary = approvalItemHistorySummaryMap.get(toQueueItemHistoryKey("payroll", run.id));
      return {
        key: `payroll:${run.id}`,
        queue: "payroll",
        itemId: run.id,
        employeeId: run.employeeId ?? "-",
        primary: `${formatDateTime(run.periodStart)} ~ ${formatDateTime(run.periodEnd)} / 총지급 ${formatKrw(run.grossPayKrw)}`,
        secondary: "급여 프리뷰는 개별 확정으로 처리합니다.",
        waitedHours,
        alertLevel: resolveQueueAlertLevel(waitedHours),
        historySummary: historySummary
          ? `history ${historySummary.total} / ok ${historySummary.success} / fail ${historySummary.fail}`
          : "history 0",
        selected: false
      };
    });

    const allCards = [...attendanceCards, ...leaveCards, ...payrollCards];
    const focusedCards =
      approvalQueueFocus === "all"
        ? allCards
        : allCards.filter((card) => card.queue === approvalQueueFocus);

    return [...focusedCards]
      .sort((left, right) => {
        const selectedDiff = Number(right.selected) - Number(left.selected);
        if (selectedDiff !== 0) {
          return selectedDiff;
        }
        const levelDiff = queueAlertLevelRank(right.alertLevel) - queueAlertLevelRank(left.alertLevel);
        if (levelDiff !== 0) {
          return levelDiff;
        }
        return right.waitedHours - left.waitedHours;
      })
      .slice(0, 9);
  }, [
    approvalItemHistorySummaryMap,
    approvalQueueFocus,
    attendanceWaitHoursById,
    filteredPendingAttendance,
    filteredPendingLeave,
    filteredPreviewedPayroll,
    leaveWaitHoursById,
    payrollWaitHoursById,
    resolveQueueAlertLevel,
    selectedAttendanceIds,
    selectedLeaveIds
  ]);

  const queueSlaTimelinePoints = useMemo<QueueSlaTimelinePoint[]>(
    () => [
      {
        key: "all",
        label: "전체",
        ...summarizeSlaTimelineByRule(
          [...attendanceWaitHoursValues, ...leaveWaitHoursValues, ...payrollWaitHoursValues],
          queueSlaWatchHours,
          queueSlaCriticalHours
        )
      },
      {
        key: "attendance",
        label: "출퇴근",
        ...summarizeSlaTimelineByRule(
          attendanceWaitHoursValues,
          queueSlaWatchHours,
          queueSlaCriticalHours
        )
      },
      {
        key: "leave",
        label: "휴가",
        ...summarizeSlaTimelineByRule(leaveWaitHoursValues, queueSlaWatchHours, queueSlaCriticalHours)
      },
      {
        key: "payroll",
        label: "급여",
        ...summarizeSlaTimelineByRule(
          payrollWaitHoursValues,
          queueSlaWatchHours,
          queueSlaCriticalHours
        )
      }
    ],
    [
      attendanceWaitHoursValues,
      leaveWaitHoursValues,
      payrollWaitHoursValues,
      queueSlaCriticalHours,
      queueSlaWatchHours
    ]
  );

  const activeQueueSlaTimelinePoint =
    queueSlaTimelinePoints.find((point) => point.key === approvalQueueFocus) ?? queueSlaTimelinePoints[0];

  const mobileBulkReviewSteps = useMemo<QueueMobileReviewStep[]>(
    () => [
      {
        id: "attendance",
        label: "출퇴근",
        targetCount: selectedAttendanceCount,
        approveReady: canApproveSelectedAttendance,
        rejectReady: canRejectSelectedAttendance,
        detail:
          selectedAttendanceCount === 0
            ? "선택 항목이 없습니다."
            : canApproveSelectedAttendance
              ? "일괄 승인/반려 실행 가능"
              : "현재 필터와 선택 상태를 먼저 맞춰야 합니다."
      },
      {
        id: "leave",
        label: "휴가",
        targetCount: selectedLeaveCount,
        approveReady: canApproveSelectedLeave,
        rejectReady: canRejectSelectedLeave,
        detail:
          selectedLeaveCount === 0
            ? "선택 항목이 없습니다."
            : canRejectSelectedLeave
              ? "사유 확인 완료, 일괄 반려 실행 가능"
              : hasLeaveRejectReason
                ? "선택/필터 상태를 정리하면 실행할 수 있습니다."
                : "반려 사유 입력이 필요합니다."
      },
      {
        id: "payroll",
        label: "급여",
        targetCount: filteredPreviewedPayroll.length,
        approveReady: false,
        rejectReady: false,
        detail:
          filteredPreviewedPayroll.length > 0
            ? "급여 프리뷰는 개별 확정으로 처리합니다."
            : "현재 필터 조건에서 검토할 급여 프리뷰가 없습니다."
      }
    ],
    [
      canApproveSelectedAttendance,
      canApproveSelectedLeave,
      canRejectSelectedAttendance,
      canRejectSelectedLeave,
      filteredPreviewedPayroll.length,
      hasLeaveRejectReason,
      selectedAttendanceCount,
      selectedLeaveCount
    ]
  );

  const queueEvidenceComparisonCards = useMemo<QueueEvidenceComparisonCard[]>(() => {
    const candidates = [
      ...filteredPendingAttendance.map((record) => ({
        queue: "attendance" as const,
        itemId: record.id,
        waitHours: attendanceWaitHoursById.get(record.id) ?? 0,
        failCount:
          approvalItemHistorySummaryMap.get(toQueueItemHistoryKey("attendance", record.id))?.fail ?? 0
      })),
      ...filteredPendingLeave.map((request) => ({
        queue: "leave" as const,
        itemId: request.id,
        waitHours: leaveWaitHoursById.get(request.id) ?? 0,
        failCount: approvalItemHistorySummaryMap.get(toQueueItemHistoryKey("leave", request.id))?.fail ?? 0
      })),
      ...filteredPreviewedPayroll.map((run) => ({
        queue: "payroll" as const,
        itemId: run.id,
        waitHours: payrollWaitHoursById.get(run.id) ?? 0,
        failCount: approvalItemHistorySummaryMap.get(toQueueItemHistoryKey("payroll", run.id))?.fail ?? 0
      }))
    ];

    const focusedCandidates =
      approvalQueueFocus === "all"
        ? candidates
        : candidates.filter((candidate) => candidate.queue === approvalQueueFocus);

    const cards: QueueEvidenceComparisonCard[] = [];
    for (const queue of ["attendance", "leave", "payroll"] as const) {
      const queueItems = focusedCandidates
        .filter((candidate) => candidate.queue === queue)
        .sort((left, right) => {
          const waitDiff = right.waitHours - left.waitHours;
          if (waitDiff !== 0) {
            return waitDiff;
          }
          return right.failCount - left.failCount;
        });

      if (queueItems.length < 2) {
        continue;
      }

      const baseline = queueItems[0];
      const compare = queueItems[1];
      const baselineSeverity = resolveQueueAlertLevel(baseline.waitHours);
      const compareSeverity = resolveQueueAlertLevel(compare.waitHours);
      const severity =
        queueAlertLevelRank(baselineSeverity) >= queueAlertLevelRank(compareSeverity)
          ? baselineSeverity
          : compareSeverity;
      const waitGapHours = Math.max(0, baseline.waitHours - compare.waitHours);
      const failGapCount = Math.max(0, baseline.failCount - compare.failCount);

      let recommendation = "Process by regular queue order.";
      if (severity === "critical" && failGapCount > 0) {
        recommendation = "Prioritize this item and validate failure causes before bulk approval.";
      } else if (severity === "critical") {
        recommendation = "Prioritize this item first due to SLA critical wait time.";
      } else if (severity === "watch") {
        recommendation = "Review this item before normal-priority approvals.";
      }

      cards.push({
        key: `${queue}:${baseline.itemId}:${compare.itemId}`,
        queue,
        baselineItemId: baseline.itemId,
        compareItemId: compare.itemId,
        baselineWaitHours: baseline.waitHours,
        compareWaitHours: compare.waitHours,
        waitGapHours,
        baselineFailCount: baseline.failCount,
        compareFailCount: compare.failCount,
        failGapCount,
        severity,
        recommendation
      });
    }

    return cards
      .sort((left, right) => {
        const severityDiff = queueAlertLevelRank(right.severity) - queueAlertLevelRank(left.severity);
        if (severityDiff !== 0) {
          return severityDiff;
        }
        const waitDiff = right.waitGapHours - left.waitGapHours;
        if (waitDiff !== 0) {
          return waitDiff;
        }
        return right.failGapCount - left.failGapCount;
      })
      .slice(0, 4);
  }, [
    approvalQueueFocus,
    approvalItemHistorySummaryMap,
    attendanceWaitHoursById,
    filteredPendingAttendance,
    filteredPendingLeave,
    filteredPreviewedPayroll,
    leaveWaitHoursById,
    payrollWaitHoursById,
    resolveQueueAlertLevel
  ]);

  const queueSlaRuleAlerts = useMemo<QueueSlaRuleAlert[]>(() => {
    const queueBadges = queueBadgeSummaries.filter((badge) => badge.focus !== "all");
    const totalAlerts = queueAlertOverview.totalCritical + queueAlertOverview.totalWatch;
    const baseSeverity: QueueAlertLevel =
      queueAlertOverview.totalCritical > 0
        ? "critical"
        : queueAlertOverview.totalWatch > 0
          ? "watch"
          : "normal";

    const alerts: QueueSlaRuleAlert[] = [
      {
        key: "sla-rule-threshold",
        label: "SLA threshold rule",
        severity: baseSeverity,
        count: totalAlerts,
        detail: `Watch >= ${queueSlaWatchHours}h / Critical >= ${queueSlaCriticalHours}h`,
        targetSectionId: "approval-sla-timeline"
      }
    ];

    for (const badge of queueBadges) {
      if (badge.critical > 0) {
        alerts.push({
          key: `critical-${badge.focus}`,
          label: `${badge.label} critical backlog`,
          severity: "critical",
          count: badge.critical,
          detail: `oldest ${Math.round(badge.oldestHours)}h / focus queue ${badge.label}`,
          targetSectionId: "approvals"
        });
      } else if (badge.watch > 0) {
        alerts.push({
          key: `watch-${badge.focus}`,
          label: `${badge.label} watch backlog`,
          severity: "watch",
          count: badge.watch,
          detail: `oldest ${Math.round(badge.oldestHours)}h / watch threshold ${queueSlaWatchHours}h`,
          targetSectionId: "approvals"
        });
      }
    }

    return alerts
      .sort((left, right) => {
        const severityDiff = queueAlertLevelRank(right.severity) - queueAlertLevelRank(left.severity);
        if (severityDiff !== 0) {
          return severityDiff;
        }
        return right.count - left.count;
      })
      .slice(0, 6);
  }, [
    queueAlertOverview.totalCritical,
    queueAlertOverview.totalWatch,
    queueBadgeSummaries,
    queueSlaCriticalHours,
    queueSlaWatchHours
  ]);

  const queueMobileApprovalChecklistItems = useMemo<QueueMobileApprovalChecklistItem[]>(() => {
    const hiddenAttendanceSelection = Math.max(0, selectedAttendanceCount - selectedVisibleAttendanceCount);
    const hiddenLeaveSelection = Math.max(0, selectedLeaveCount - selectedVisibleLeaveCount);
    const hiddenSelectionCount = hiddenAttendanceSelection + hiddenLeaveSelection;
    const hasActionableSelection = selectedQueueTotalCount > 0;
    const canRunImmediateBulkAction =
      canApproveSelectedAttendance || canRejectSelectedAttendance || canApproveSelectedLeave || canRejectSelectedLeave;

    return [
      {
        id: "selection-scope-sync",
        label: "Selection synced with filters",
        pass: hiddenSelectionCount === 0,
        detail:
          hiddenSelectionCount === 0
            ? "All selected items are visible in the current queue filter."
            : `${hiddenSelectionCount} selected item(s) are hidden by current filters.`,
        targetSectionId: "approvals"
      },
      {
        id: "leave-reject-reason",
        label: "Leave reject reason ready",
        pass: selectedLeaveCount === 0 || hasLeaveRejectReason,
        detail:
          selectedLeaveCount === 0 || hasLeaveRejectReason
            ? "Leave bulk reject condition is ready."
            : "Leave reject reason is required before bulk reject.",
        targetSectionId: "approvals"
      },
      {
        id: "critical-backlog-check",
        label: "Critical backlog triage",
        pass: queueAlertOverview.totalCritical === 0 || approvalQueueOnlyUrgent,
        detail:
          queueAlertOverview.totalCritical === 0
            ? "No critical backlog now."
            : approvalQueueOnlyUrgent
              ? "Urgent-only filter is enabled for critical triage."
              : "Turn on urgent-only filter to triage critical backlog first.",
        targetSectionId: "approval-sla-alert-rules"
      },
      {
        id: "mobile-bulk-action",
        label: "Bulk action ready on mobile",
        pass: hasActionableSelection && canRunImmediateBulkAction,
        detail:
          hasActionableSelection && canRunImmediateBulkAction
            ? "Bulk approval/reject can run immediately from mobile review cards."
            : hasActionableSelection
              ? "Selection exists, but validation conditions are not satisfied yet."
              : "Select at least one attendance/leave item to use mobile bulk action.",
        targetSectionId: "approval-mobile-review-sheet"
      }
    ];
  }, [
    approvalQueueOnlyUrgent,
    canApproveSelectedAttendance,
    canApproveSelectedLeave,
    canRejectSelectedAttendance,
    canRejectSelectedLeave,
    hasLeaveRejectReason,
    queueAlertOverview.totalCritical,
    selectedAttendanceCount,
    selectedLeaveCount,
    selectedQueueTotalCount,
    selectedVisibleAttendanceCount,
    selectedVisibleLeaveCount
  ]);

  const queueProcessingPredictionCards = useMemo<QueueProcessingPredictionCard[]>(() => {
    const queueBadges = queueBadgeSummaries.filter((badge) => badge.focus !== "all");
    const overallPending = queueBadges.reduce((sum, badge) => sum + badge.pending, 0);
    const overallCritical = queueBadges.reduce((sum, badge) => sum + badge.critical, 0);
    const overallWatch = queueBadges.reduce((sum, badge) => sum + badge.watch, 0);
    const overallOldestHours =
      queueBadges.length > 0 ? Math.max(...queueBadges.map((badge) => badge.oldestHours)) : 0;
    const overallOk = queueFeedbackByQueue.reduce((sum, feedback) => sum + feedback.ok, 0);
    const overallFail = queueFeedbackByQueue.reduce((sum, feedback) => sum + feedback.fail, 0);

    const buildCard = (input: {
      key: string;
      queue: QueueFocus;
      label: string;
      pendingCount: number;
      oldestHours: number;
      criticalCount: number;
      watchCount: number;
      okCount: number;
      failCount: number;
      targetSectionId: string;
    }): QueueProcessingPredictionCard => {
      const feedbackTotal = input.okCount + input.failCount;
      const recentSuccessRate = feedbackTotal > 0 ? input.okCount / feedbackTotal : 0.7;
      const baselineThroughputPerHour = Math.max(0.4, recentSuccessRate * 1.6 + feedbackTotal / 12);
      const predictedClearHours =
        input.pendingCount === 0
          ? 0
          : Math.max(1, Math.round(input.pendingCount / baselineThroughputPerHour + input.oldestHours * 0.18));
      const predictedSeverity = toQueueAlertLevelByRule(
        predictedClearHours,
        queueSlaWatchHours,
        queueSlaCriticalHours
      );
      const severity: QueueAlertLevel =
        input.criticalCount > 0
          ? "critical"
          : input.watchCount > 0 && predictedSeverity === "normal"
            ? "watch"
            : predictedSeverity;
      const predictedEta =
        input.pendingCount === 0
          ? "now"
          : formatDateTime(new Date(queueNowMs + predictedClearHours * 3_600_000).toISOString());
      const detail =
        input.pendingCount === 0
          ? "No pending items. Queue is ready for normal throughput."
          : `Pending ${input.pendingCount}, oldest ${Math.round(input.oldestHours)}h, recent success ${Math.round(
              recentSuccessRate * 100
            )}%`;

      return {
        key: input.key,
        queue: input.queue,
        label: input.label,
        pendingCount: input.pendingCount,
        severity,
        predictedClearHours,
        predictedEta,
        recentSuccessRate,
        detail,
        targetSectionId: input.targetSectionId
      };
    };

    const overallCard = buildCard({
      key: "all",
      queue: "all",
      label: "all queues",
      pendingCount: overallPending,
      oldestHours: overallOldestHours,
      criticalCount: overallCritical,
      watchCount: overallWatch,
      okCount: overallOk,
      failCount: overallFail,
      targetSectionId: "approval-sla-timeline"
    });

    const queueCards = queueBadges
      .map((badge) => {
        const queue = badge.focus as "attendance" | "leave" | "payroll";
        const feedback = queueFeedbackByQueue.find((item) => item.queue === queue);
        return buildCard({
          key: queue,
          queue,
          label: badge.label,
          pendingCount: badge.pending,
          oldestHours: badge.oldestHours,
          criticalCount: badge.critical,
          watchCount: badge.watch,
          okCount: feedback?.ok ?? 0,
          failCount: feedback?.fail ?? 0,
          targetSectionId: "approvals"
        });
      })
      .sort((left, right) => {
        const severityDiff = queueAlertLevelRank(right.severity) - queueAlertLevelRank(left.severity);
        if (severityDiff !== 0) {
          return severityDiff;
        }
        return right.predictedClearHours - left.predictedClearHours;
      });

    return [overallCard, ...queueCards].slice(0, 4);
  }, [
    queueBadgeSummaries,
    queueFeedbackByQueue,
    queueNowMs,
    queueSlaCriticalHours,
    queueSlaWatchHours
  ]);

  const queueDelayRiskPredictionCards = useMemo<QueueDelayRiskPredictionCard[]>(() => {
    const toRiskCard = (input: {
      key: string;
      queue: QueueFocus;
      label: string;
      rows: QueueSearchSortRow[];
      targetSectionId: string;
    }): QueueDelayRiskPredictionCard => {
      const pendingCount = input.rows.length;
      const watchCount = input.rows.filter((row) => row.waitHours >= queueSlaWatchHours).length;
      const criticalCount = input.rows.filter((row) => row.waitHours >= queueSlaCriticalHours).length;
      const totalWaitHours = input.rows.reduce((sum, row) => sum + row.waitHours, 0);
      const averageWaitHours = pendingCount > 0 ? totalWaitHours / pendingCount : 0;
      const maxWaitHours = pendingCount > 0 ? Math.max(...input.rows.map((row) => row.waitHours)) : 0;
      const rawRiskScore = averageWaitHours * 0.8 + maxWaitHours * 0.6 + watchCount * 10 + criticalCount * 20;
      const riskScore = pendingCount > 0 ? Math.min(100, Math.round(rawRiskScore)) : 0;
      const severity: QueueAlertLevel =
        criticalCount > 0 || riskScore >= 80 ? "critical" : watchCount > 0 || riskScore >= 45 ? "watch" : "normal";
      const etaLabel =
        pendingCount === 0
          ? "stable"
          : severity === "critical"
            ? "act now"
            : severity === "watch"
              ? "within 1 business day"
              : "within today";
      const detail =
        pendingCount === 0
          ? "No pending queue items."
          : `risk ${riskScore} / avg ${Math.round(averageWaitHours)}h / max ${Math.round(maxWaitHours)}h`;

      return {
        key: input.key,
        queue: input.queue,
        label: input.label,
        severity,
        pendingCount,
        watchCount,
        criticalCount,
        averageWaitHours,
        maxWaitHours,
        riskScore,
        etaLabel,
        detail,
        targetSectionId: input.targetSectionId
      };
    };

    const attendanceRows = queueSearchSortRows.filter((row) => row.queue === "attendance");
    const leaveRows = queueSearchSortRows.filter((row) => row.queue === "leave");
    const payrollRows = queueSearchSortRows.filter((row) => row.queue === "payroll");
    const cards = [
      toRiskCard({
        key: "all",
        queue: "all",
        label: "all queues",
        rows: queueSearchSortRows,
        targetSectionId: "approval-search-sort"
      }),
      toRiskCard({
        key: "attendance",
        queue: "attendance",
        label: "attendance",
        rows: attendanceRows,
        targetSectionId: "approvals"
      }),
      toRiskCard({
        key: "leave",
        queue: "leave",
        label: "leave",
        rows: leaveRows,
        targetSectionId: "approvals"
      }),
      toRiskCard({
        key: "payroll",
        queue: "payroll",
        label: "payroll",
        rows: payrollRows,
        targetSectionId: "approvals"
      })
    ];

    return cards.sort((left, right) => {
      const severityDiff = queueAlertLevelRank(right.severity) - queueAlertLevelRank(left.severity);
      if (severityDiff !== 0) {
        return severityDiff;
      }
      const scoreDiff = right.riskScore - left.riskScore;
      if (scoreDiff !== 0) {
        return scoreDiff;
      }
      return right.pendingCount - left.pendingCount;
    });
  }, [queueSearchSortRows, queueSlaCriticalHours, queueSlaWatchHours]);

  const queueDelayRiskResponseCards = useMemo<QueueDelayRiskResponseCard[]>(() => {
    const cards = queueDelayRiskPredictionCards.map((card) => {
      let searchScope: QueueSearchSortScope = "detail";
      let searchQuery = "pending";
      const targetSectionId = "approval-search-sort";
      let responseLabel = "Open queue search/sort and clear highest wait items first.";
      if (card.key === "attendance") {
        searchScope = "queue";
        searchQuery = "attendance";
        responseLabel = "Focus attendance backlog and process correction-heavy items first.";
      } else if (card.key === "leave") {
        searchScope = "queue";
        searchQuery = "leave";
        responseLabel = "Focus leave backlog and resolve policy-dependent requests first.";
      } else if (card.key === "payroll") {
        searchScope = "queue";
        searchQuery = "payroll";
        responseLabel = "Focus payroll backlog and confirm blocked preview runs first.";
      }

      const responseWindow =
        card.pendingCount === 0
          ? "monitor daily"
          : card.severity === "critical"
            ? "within 2h"
            : card.severity === "watch"
              ? "within 8h"
              : "within 24h";
      const recommendedSortOption: QueueSearchSortOption = "wait_desc";

      return {
        key: card.key,
        queue: card.queue,
        label: card.label,
        severity: card.severity,
        pendingCount: card.pendingCount,
        watchCount: card.watchCount,
        criticalCount: card.criticalCount,
        riskScore: card.riskScore,
        responseWindow,
        responseLabel,
        detail:
          card.pendingCount === 0
            ? "No pending queue items for response flow."
            : `Respond ${responseWindow}: risk ${card.riskScore}, watch ${card.watchCount}, critical ${card.criticalCount}.`,
        searchScope,
        searchQuery,
        recommendedSortOption,
        targetSectionId
      };
    });

    return cards.sort((left, right) => {
      const severityDiff = queueAlertLevelRank(right.severity) - queueAlertLevelRank(left.severity);
      if (severityDiff !== 0) {
        return severityDiff;
      }
      const riskDiff = right.riskScore - left.riskScore;
      if (riskDiff !== 0) {
        return riskDiff;
      }
      return right.pendingCount - left.pendingCount;
    });
  }, [queueDelayRiskPredictionCards]);

  const queueDelayRiskResponseExecutionGuideCards = useMemo<QueueDelayRiskResponseExecutionGuideCard[]>(() => {
    const cards = queueDelayRiskResponseCards.map((card) => {
      const executionLabel =
        card.pendingCount === 0
          ? "monitor"
          : card.severity === "critical"
            ? "triage now"
            : card.severity === "watch"
              ? "execute within today"
              : "keep monitoring";
      const executionChecklist =
        card.pendingCount === 0
          ? "No pending queue items in this scope."
          : card.key === "attendance"
            ? "Check correction context, evidence notes, and oldest pending items first."
            : card.key === "leave"
              ? "Check leave range, remaining days, and policy-dependent requests first."
              : card.key === "payroll"
                ? "Check blocked payroll previews, owner confirmation, and oldest pending items first."
                : "Check pending queue, urgent filters, and wait-desc ordering first.";

      return {
        key: card.key,
        queue: card.queue,
        label: card.label,
        severity: card.severity,
        pendingCount: card.pendingCount,
        riskScore: card.riskScore,
        responseWindow: card.responseWindow,
        executionLabel,
        executionChecklist,
        detail:
          card.pendingCount === 0
            ? "Execution guide is idle because there are no pending queue items."
            : `Run ${executionLabel}: risk ${card.riskScore}, pending ${card.pendingCount}.`,
        searchScope: card.searchScope,
        searchQuery: card.searchQuery,
        recommendedSortOption: card.recommendedSortOption,
        targetSectionId: card.targetSectionId
      };
    });

    return cards.sort((left, right) => {
      const severityDiff = queueAlertLevelRank(right.severity) - queueAlertLevelRank(left.severity);
      if (severityDiff !== 0) {
        return severityDiff;
      }
      const riskDiff = right.riskScore - left.riskScore;
      if (riskDiff !== 0) {
        return riskDiff;
      }
      return right.pendingCount - left.pendingCount;
    });
  }, [queueDelayRiskResponseCards]);

  const queueDelayRiskResponseExecutionTrackerCards = useMemo<QueueDelayRiskResponseExecutionTrackerCard[]>(() => {
    const cards = queueDelayRiskResponseExecutionGuideCards.map((card) => {
      const trackerScore =
        card.pendingCount === 0 ? 0 : Math.min(100, Math.max(0, card.riskScore + Math.min(30, card.pendingCount * 6)));
      const trackerLabel =
        card.pendingCount === 0
          ? "idle"
          : card.severity === "critical"
            ? "escalate now"
            : card.severity === "watch"
              ? "track within today"
              : "daily monitor";
      const executionChecklist =
        card.pendingCount === 0
          ? "No pending queue items in this scope."
          : `${card.executionChecklist} Keep ${card.responseWindow} response window in active follow-up.`;

      return {
        key: card.key,
        queue: card.queue,
        label: card.label,
        severity: card.severity,
        pendingCount: card.pendingCount,
        riskScore: card.riskScore,
        responseWindow: card.responseWindow,
        trackerScore,
        trackerLabel,
        executionChecklist,
        detail:
          card.pendingCount === 0
            ? "Execution tracker is idle because there are no pending queue items."
            : `tracker ${trackerScore} / risk ${card.riskScore} / pending ${card.pendingCount}.`,
        searchScope: card.searchScope,
        searchQuery: card.searchQuery,
        recommendedSortOption: card.recommendedSortOption,
        targetSectionId: card.targetSectionId
      };
    });

    return cards.sort((left, right) => {
      const severityDiff = queueAlertLevelRank(right.severity) - queueAlertLevelRank(left.severity);
      if (severityDiff !== 0) {
        return severityDiff;
      }
      return right.trackerScore - left.trackerScore;
    });
  }, [queueDelayRiskResponseExecutionGuideCards]);

  const queueMobileFollowUpGuideCards = useMemo<QueueMobileFollowUpGuideCard[]>(() => {
    const hiddenAttendanceSelection = Math.max(0, selectedAttendanceCount - selectedVisibleAttendanceCount);
    const hiddenLeaveSelection = Math.max(0, selectedLeaveCount - selectedVisibleLeaveCount);
    const hiddenSelectionCount = hiddenAttendanceSelection + hiddenLeaveSelection;
    const hasSearchQuery = queueSearchSortQuery.trim().length > 0;
    const hasSearchResults = filteredQueueSearchSortRows.length > 0;
    const topPredictionCard =
      queueProcessingPredictionCards.find((card) => card.queue !== "all" && card.pendingCount > 0) ??
      queueProcessingPredictionCards[0];

    return [
      {
        key: "critical-backlog-follow-up",
        label: "critical backlog follow-up",
        severity: queueAlertOverview.totalCritical > 0 ? "critical" : "normal",
        detail:
          queueAlertOverview.totalCritical > 0
            ? approvalQueueOnlyUrgent
              ? "Urgent-only filter is active. Continue triage in SLA alerts."
              : "Enable urgent-only filter, then clear critical backlog first."
            : "No critical backlog. Keep normal queue order.",
        actionLabel: queueAlertOverview.totalCritical > 0 ? "open SLA alerts" : "open queue",
        targetSectionId: queueAlertOverview.totalCritical > 0 ? "approval-sla-alert-rules" : "approvals"
      },
      {
        key: "search-sort-follow-up",
        label: "search/sort follow-up",
        severity: hasSearchQuery && !hasSearchResults ? "watch" : "normal",
        detail:
          hasSearchQuery && !hasSearchResults
            ? "No rows match current query. Reset or expand search scope."
            : `${filteredQueueSearchSortRows.length} row(s) are ready in queue search/sort panel.`,
        actionLabel: "open search/sort",
        targetSectionId: "approval-search-sort"
      },
      {
        key: "prediction-follow-up",
        label: "processing prediction follow-up",
        severity: topPredictionCard?.severity ?? "normal",
        detail: topPredictionCard
          ? `${topPredictionCard.label}: clear in ~${Math.round(
              topPredictionCard.predictedClearHours
            )}h (ETA ${topPredictionCard.predictedEta})`
          : "Prediction card is not available yet.",
        actionLabel: "open prediction",
        targetSectionId: "approval-processing-prediction"
      },
      {
        key: "selection-follow-up",
        label: "selection sync follow-up",
        severity:
          hiddenSelectionCount > 0 || (selectedLeaveCount > 0 && !hasLeaveRejectReason) ? "watch" : "normal",
        detail:
          hiddenSelectionCount > 0
            ? `${hiddenSelectionCount} selected item(s) are hidden by current filters.`
            : selectedLeaveCount > 0 && !hasLeaveRejectReason
              ? "Leave reject reason is required before mobile bulk reject."
              : "Selection and required inputs are ready.",
        actionLabel: hiddenSelectionCount > 0 ? "open queue filter" : "open mobile review",
        targetSectionId: hiddenSelectionCount > 0 ? "approvals" : "approval-mobile-review-sheet"
      }
    ];
  }, [
    approvalQueueOnlyUrgent,
    filteredQueueSearchSortRows.length,
    hasLeaveRejectReason,
    queueAlertOverview.totalCritical,
    queueProcessingPredictionCards,
    queueSearchSortQuery,
    selectedAttendanceCount,
    selectedLeaveCount,
    selectedVisibleAttendanceCount,
    selectedVisibleLeaveCount
  ]);

  const queueMobileFollowUpRecommendationCards = useMemo<QueueMobileFollowUpRecommendationCard[]>(() => {
    const hiddenAttendanceSelection = Math.max(0, selectedAttendanceCount - selectedVisibleAttendanceCount);
    const hiddenLeaveSelection = Math.max(0, selectedLeaveCount - selectedVisibleLeaveCount);
    const hiddenSelectionCount = hiddenAttendanceSelection + hiddenLeaveSelection;
    const hasSearchQuery = queueSearchSortQuery.trim().length > 0;
    const hasSearchResults = filteredQueueSearchSortRows.length > 0;
    const topSortAccuracyRisk = queueHistorySortAccuracyCards[0];
    const topDelayRisk = queueDelayRiskPredictionCards[0];
    const hasSortAccuracyRisk =
      topSortAccuracyRisk &&
      topSortAccuracyRisk.totalCompared > 0 &&
      topSortAccuracyRisk.severity !== "normal";
    const hasDelayRisk = topDelayRisk && topDelayRisk.pendingCount > 0 && topDelayRisk.severity !== "normal";

    return [
      {
        key: "sort-accuracy-follow-up",
        label: "history sort accuracy follow-up",
        severity: hasSortAccuracyRisk ? topSortAccuracyRisk?.severity ?? "watch" : "normal",
        detail: hasSortAccuracyRisk
          ? topSortAccuracyRisk?.detail ?? "Review sort-accuracy cards."
          : "Current queue history sort accuracy is stable.",
        actionLabel: "open sort accuracy",
        targetSectionId: "approval-history-sort-accuracy"
      },
      {
        key: "delay-risk-follow-up",
        label: "delay risk follow-up",
        severity: hasDelayRisk ? topDelayRisk?.severity ?? "watch" : "normal",
        detail: hasDelayRisk ? topDelayRisk?.detail ?? "Review delay-risk prediction cards." : "No immediate delay risk.",
        actionLabel: "open delay risk",
        targetSectionId: "approval-delay-risk-prediction"
      },
      {
        key: "search-follow-up",
        label: "search/sort execution follow-up",
        severity: hasSearchQuery && !hasSearchResults ? "watch" : "normal",
        detail:
          hasSearchQuery && !hasSearchResults
            ? "Current query has no matches. Reset scope or broaden query."
            : `${filteredQueueSearchSortRows.length} row(s) are ready for next action.`,
        actionLabel: "open search/sort",
        targetSectionId: "approval-search-sort"
      },
      {
        key: "selection-follow-up",
        label: "selection integrity follow-up",
        severity:
          hiddenSelectionCount > 0 || (selectedLeaveCount > 0 && !hasLeaveRejectReason)
            ? "watch"
            : "normal",
        detail:
          hiddenSelectionCount > 0
            ? `${hiddenSelectionCount} selected item(s) are hidden by active filters.`
            : selectedLeaveCount > 0 && !hasLeaveRejectReason
              ? "Leave reject reason is required before reject action."
              : "Selection and required inputs are aligned.",
        actionLabel: hiddenSelectionCount > 0 ? "open queue" : "open mobile checklist",
        targetSectionId: hiddenSelectionCount > 0 ? "approvals" : "approval-mobile-checklist"
      }
    ];
  }, [
    filteredQueueSearchSortRows.length,
    hasLeaveRejectReason,
    queueDelayRiskPredictionCards,
    queueHistorySortAccuracyCards,
    queueSearchSortQuery,
    selectedAttendanceCount,
    selectedLeaveCount,
    selectedVisibleAttendanceCount,
    selectedVisibleLeaveCount
  ]);

  const queueMobileFollowUpRecommendationUpgradeCards = useMemo<QueueMobileFollowUpRecommendationUpgradeCard[]>(() => {
    const hiddenAttendanceSelection = Math.max(0, selectedAttendanceCount - selectedVisibleAttendanceCount);
    const hiddenLeaveSelection = Math.max(0, selectedLeaveCount - selectedVisibleLeaveCount);
    const hiddenSelectionCount = hiddenAttendanceSelection + hiddenLeaveSelection;
    const hasSearchQuery = queueSearchSortQuery.trim().length > 0;
    const hasSearchResults = filteredQueueSearchSortRows.length > 0;
    const topSortHardeningRisk = queueHistorySortHardeningCards.find(
      (card) => card.totalCompared > 0 && card.severity !== "normal"
    );
    const topDelayResponseRisk = queueDelayRiskResponseCards.find(
      (card) => card.pendingCount > 0 && card.severity !== "normal"
    );

    const cards: QueueMobileFollowUpRecommendationUpgradeCard[] = [
      {
        key: "sort-hardening-upgrade",
        label: "sort hardening recommendation",
        severity: topSortHardeningRisk?.severity ?? "normal",
        priorityScore:
          topSortHardeningRisk?.severity === "critical" ? 100 : topSortHardeningRisk?.severity === "watch" ? 75 : 30,
        detail: topSortHardeningRisk
          ? topSortHardeningRisk.responseLabel
          : "No sort hardening action is required.",
        actionLabel: topSortHardeningRisk ? "apply hardening preset" : "open hardening panel",
        targetSectionId: "approval-history-sort-hardening"
      },
      {
        key: "delay-response-upgrade",
        label: "delay response recommendation",
        severity: topDelayResponseRisk?.severity ?? "normal",
        priorityScore:
          topDelayResponseRisk?.severity === "critical" ? 95 : topDelayResponseRisk?.severity === "watch" ? 70 : 25,
        detail: topDelayResponseRisk
          ? topDelayResponseRisk.responseLabel
          : "No delay-risk response action is required.",
        actionLabel: topDelayResponseRisk ? "run delay response" : "open response panel",
        targetSectionId: "approval-delay-risk-response"
      },
      {
        key: "search-upgrade",
        label: "search execution recommendation",
        severity: hasSearchQuery && !hasSearchResults ? "watch" : "normal",
        priorityScore: hasSearchQuery && !hasSearchResults ? 80 : 20,
        detail:
          hasSearchQuery && !hasSearchResults
            ? "Current query has no matches. Reset filters and widen scope."
            : `${filteredQueueSearchSortRows.length} queue row(s) are ready for follow-up.`,
        actionLabel: "open search/sort",
        targetSectionId: "approval-search-sort"
      },
      {
        key: "selection-upgrade",
        label: "selection integrity recommendation",
        severity:
          hiddenSelectionCount > 0 || (selectedLeaveCount > 0 && !hasLeaveRejectReason)
            ? "watch"
            : "normal",
        priorityScore: hiddenSelectionCount > 0 || (selectedLeaveCount > 0 && !hasLeaveRejectReason) ? 85 : 15,
        detail:
          hiddenSelectionCount > 0
            ? `${hiddenSelectionCount} selected item(s) are hidden by active filters.`
            : selectedLeaveCount > 0 && !hasLeaveRejectReason
              ? "Leave reject reason is required before reject action."
              : "Selection and required inputs are aligned.",
        actionLabel: hiddenSelectionCount > 0 ? "open queue" : "open mobile checklist",
        targetSectionId: hiddenSelectionCount > 0 ? "approvals" : "approval-mobile-checklist"
      }
    ];

    return cards.sort((left, right) => {
      const severityDiff = queueAlertLevelRank(right.severity) - queueAlertLevelRank(left.severity);
      if (severityDiff !== 0) {
        return severityDiff;
      }
      return right.priorityScore - left.priorityScore;
    });
  }, [
    filteredQueueSearchSortRows.length,
    hasLeaveRejectReason,
    queueDelayRiskResponseCards,
    queueHistorySortHardeningCards,
    queueSearchSortQuery,
    selectedAttendanceCount,
    selectedLeaveCount,
    selectedVisibleAttendanceCount,
    selectedVisibleLeaveCount
  ]);

  const queueMobileFollowUpRecommendationUpgrade2Cards = useMemo<QueueMobileFollowUpRecommendationUpgrade2Card[]>(() => {
    const hiddenAttendanceSelection = Math.max(0, selectedAttendanceCount - selectedVisibleAttendanceCount);
    const hiddenLeaveSelection = Math.max(0, selectedLeaveCount - selectedVisibleLeaveCount);
    const hiddenSelectionCount = hiddenAttendanceSelection + hiddenLeaveSelection;
    const hasSearchQuery = queueSearchSortQuery.trim().length > 0;
    const hasSearchResults = filteredQueueSearchSortRows.length > 0;
    const topSortHardeningPlusRisk = queueHistorySortHardeningPlusCards.find(
      (card) => card.stabilizationScore > 0 && card.severity !== "normal"
    );
    const topDelayExecutionRisk = queueDelayRiskResponseExecutionGuideCards.find(
      (card) => card.pendingCount > 0 && card.severity !== "normal"
    );

    const cards: QueueMobileFollowUpRecommendationUpgrade2Card[] = [
      {
        key: "sort-hardening-plus-upgrade",
        label: "sort hardening+ recommendation",
        severity: topSortHardeningPlusRisk?.severity ?? "normal",
        priorityScore: topSortHardeningPlusRisk ? topSortHardeningPlusRisk.stabilizationScore : 20,
        detail: topSortHardeningPlusRisk
          ? `${topSortHardeningPlusRisk.responseLabel} ${topSortHardeningPlusRisk.executionLabel}`
          : "No sort hardening+ action is required.",
        actionLabel: topSortHardeningPlusRisk ? "run hardening+" : "open hardening+ panel",
        targetSectionId: "approval-history-sort-hardening-plus"
      },
      {
        key: "delay-response-execution-guide-upgrade",
        label: "delay response execution guide",
        severity: topDelayExecutionRisk?.severity ?? "normal",
        priorityScore: topDelayExecutionRisk ? topDelayExecutionRisk.riskScore : 18,
        detail: topDelayExecutionRisk
          ? `${topDelayExecutionRisk.executionChecklist} (${topDelayExecutionRisk.responseWindow})`
          : "No delay-response execution guide is required.",
        actionLabel: topDelayExecutionRisk ? "run execution guide" : "open execution guide",
        targetSectionId: "approval-delay-risk-response-execution-guide"
      },
      {
        key: "search-execution-upgrade2",
        label: "search execution recommendation",
        severity: hasSearchQuery && !hasSearchResults ? "watch" : "normal",
        priorityScore: hasSearchQuery && !hasSearchResults ? 82 : 22,
        detail:
          hasSearchQuery && !hasSearchResults
            ? "Current query has no matches. Reset filters and widen scope."
            : `${filteredQueueSearchSortRows.length} queue row(s) are ready for follow-up.`,
        actionLabel: "open search/sort",
        targetSectionId: "approval-search-sort"
      },
      {
        key: "selection-integrity-upgrade2",
        label: "selection integrity recommendation",
        severity:
          hiddenSelectionCount > 0 || (selectedLeaveCount > 0 && !hasLeaveRejectReason)
            ? "watch"
            : "normal",
        priorityScore: hiddenSelectionCount > 0 || (selectedLeaveCount > 0 && !hasLeaveRejectReason) ? 88 : 14,
        detail:
          hiddenSelectionCount > 0
            ? `${hiddenSelectionCount} selected item(s) are hidden by active filters.`
            : selectedLeaveCount > 0 && !hasLeaveRejectReason
              ? "Leave reject reason is required before reject action."
              : "Selection and required inputs are aligned.",
        actionLabel: hiddenSelectionCount > 0 ? "open queue" : "open mobile checklist",
        targetSectionId: hiddenSelectionCount > 0 ? "approvals" : "approval-mobile-checklist"
      }
    ];

    return cards.sort((left, right) => {
      const severityDiff = queueAlertLevelRank(right.severity) - queueAlertLevelRank(left.severity);
      if (severityDiff !== 0) {
        return severityDiff;
      }
      return right.priorityScore - left.priorityScore;
    });
  }, [
    filteredQueueSearchSortRows.length,
    hasLeaveRejectReason,
    queueDelayRiskResponseExecutionGuideCards,
    queueHistorySortHardeningPlusCards,
    queueSearchSortQuery,
    selectedAttendanceCount,
    selectedLeaveCount,
    selectedVisibleAttendanceCount,
    selectedVisibleLeaveCount
  ]);

  const queueMobileFollowUpRecommendationUpgrade3Cards = useMemo<QueueMobileFollowUpRecommendationUpgrade3Card[]>(() => {
    const hiddenAttendanceSelection = Math.max(0, selectedAttendanceCount - selectedVisibleAttendanceCount);
    const hiddenLeaveSelection = Math.max(0, selectedLeaveCount - selectedVisibleLeaveCount);
    const hiddenSelectionCount = hiddenAttendanceSelection + hiddenLeaveSelection;
    const hasSearchQuery = queueSearchSortQuery.trim().length > 0;
    const hasSearchResults = filteredQueueSearchSortRows.length > 0;
    const topSortExecutionRisk = queueHistorySortHardeningPlusExecutionCards.find(
      (card) => card.stabilizationScore > 0 && card.severity !== "normal"
    );
    const topDelayTrackerRisk = queueDelayRiskResponseExecutionTrackerCards.find(
      (card) => card.pendingCount > 0 && card.severity !== "normal"
    );

    const cards: QueueMobileFollowUpRecommendationUpgrade3Card[] = [
      {
        key: "sort-hardening-plus-execution-upgrade",
        label: "sort hardening+ execution recommendation",
        severity: topSortExecutionRisk?.severity ?? "normal",
        priorityScore: topSortExecutionRisk ? topSortExecutionRisk.readinessScore : 18,
        detail: topSortExecutionRisk
          ? `${topSortExecutionRisk.executionChecklist} (${topSortExecutionRisk.executionLabel})`
          : "No sort hardening+ execution action is required.",
        actionLabel: topSortExecutionRisk ? "run hardening+ execution" : "open hardening+ execution",
        targetSectionId: "approval-history-sort-hardening-plus-execution"
      },
      {
        key: "delay-response-execution-tracker-upgrade",
        label: "delay response execution tracker",
        severity: topDelayTrackerRisk?.severity ?? "normal",
        priorityScore: topDelayTrackerRisk ? topDelayTrackerRisk.trackerScore : 20,
        detail: topDelayTrackerRisk
          ? `${topDelayTrackerRisk.executionChecklist} (${topDelayTrackerRisk.trackerLabel})`
          : "No delay-response execution tracker action is required.",
        actionLabel: topDelayTrackerRisk ? "run execution tracker" : "open execution tracker",
        targetSectionId: "approval-delay-risk-response-execution-tracker"
      },
      {
        key: "search-execution-upgrade3",
        label: "search execution recommendation",
        severity: hasSearchQuery && !hasSearchResults ? "watch" : "normal",
        priorityScore: hasSearchQuery && !hasSearchResults ? 84 : 24,
        detail:
          hasSearchQuery && !hasSearchResults
            ? "Current query has no matches. Reset filters and widen scope."
            : `${filteredQueueSearchSortRows.length} queue row(s) are ready for follow-up.`,
        actionLabel: "open search/sort",
        targetSectionId: "approval-search-sort"
      },
      {
        key: "selection-integrity-upgrade3",
        label: "selection integrity recommendation",
        severity:
          hiddenSelectionCount > 0 || (selectedLeaveCount > 0 && !hasLeaveRejectReason)
            ? "watch"
            : "normal",
        priorityScore: hiddenSelectionCount > 0 || (selectedLeaveCount > 0 && !hasLeaveRejectReason) ? 90 : 16,
        detail:
          hiddenSelectionCount > 0
            ? `${hiddenSelectionCount} selected item(s) are hidden by active filters.`
            : selectedLeaveCount > 0 && !hasLeaveRejectReason
              ? "Leave reject reason is required before reject action."
              : "Selection and required inputs are aligned.",
        actionLabel: hiddenSelectionCount > 0 ? "open queue" : "open mobile checklist",
        targetSectionId: hiddenSelectionCount > 0 ? "approvals" : "approval-mobile-checklist"
      }
    ];

    return cards.sort((left, right) => {
      const severityDiff = queueAlertLevelRank(right.severity) - queueAlertLevelRank(left.severity);
      if (severityDiff !== 0) {
        return severityDiff;
      }
      return right.priorityScore - left.priorityScore;
    });
  }, [
    filteredQueueSearchSortRows.length,
    hasLeaveRejectReason,
    queueDelayRiskResponseExecutionTrackerCards,
    queueHistorySortHardeningPlusExecutionCards,
    queueSearchSortQuery,
    selectedAttendanceCount,
    selectedLeaveCount,
    selectedVisibleAttendanceCount,
    selectedVisibleLeaveCount
  ]);

  const queueHistorySortExecutionTrackerCards = useMemo<QueueHistorySortExecutionTrackerCard[]>(() => {
    return queueHistorySortHardeningPlusExecutionCards
      .map((card) => ({
        key: `execution-tracker-${card.key}`,
        sourceKey: card.key,
        label: `${card.label} execution tracker`,
        severity: card.severity,
        trackerScore:
          card.readinessScore + (card.severity === "critical" ? 8 : card.severity === "watch" ? 4 : 0),
        detail: card.detail,
        executionChecklist: card.executionChecklist,
        executionLabel: card.executionLabel,
        targetSectionId: "approval-history-sort-hardening-plus-execution"
      }))
      .sort((left, right) => {
        const severityDiff = queueAlertLevelRank(right.severity) - queueAlertLevelRank(left.severity);
        if (severityDiff !== 0) {
          return severityDiff;
        }
        return right.trackerScore - left.trackerScore;
      });
  }, [queueHistorySortHardeningPlusExecutionCards]);

  const queueDelayRiskExecutionBacklogCards = useMemo<QueueDelayRiskExecutionBacklogCard[]>(() => {
    return queueDelayRiskResponseExecutionTrackerCards
      .map((card) => ({
        key: `execution-backlog-${card.key}`,
        sourceKey: card.key,
        label: `${card.label} execution backlog`,
        severity: card.severity,
        backlogScore:
          card.trackerScore +
          card.pendingCount * 2 +
          (card.severity === "critical" ? 6 : card.severity === "watch" ? 3 : 0),
        detail: card.detail,
        responseWindow: card.responseWindow,
        executionChecklist: card.executionChecklist,
        targetSectionId: "approval-delay-risk-response-execution-tracker"
      }))
      .sort((left, right) => {
        const severityDiff = queueAlertLevelRank(right.severity) - queueAlertLevelRank(left.severity);
        if (severityDiff !== 0) {
          return severityDiff;
        }
        return right.backlogScore - left.backlogScore;
      });
  }, [queueDelayRiskResponseExecutionTrackerCards]);

  const queueMobileFollowUpRecommendationUpgrade4Cards = useMemo<QueueMobileFollowUpRecommendationUpgrade4Card[]>(() => {
    const hiddenAttendanceSelection = Math.max(0, selectedAttendanceCount - selectedVisibleAttendanceCount);
    const hiddenLeaveSelection = Math.max(0, selectedLeaveCount - selectedVisibleLeaveCount);
    const hiddenSelectionCount = hiddenAttendanceSelection + hiddenLeaveSelection;
    const hasSearchQuery = queueSearchSortQuery.trim().length > 0;
    const hasSearchResults = filteredQueueSearchSortRows.length > 0;

    const topExecutionTracker = queueHistorySortExecutionTrackerCards.find((card) => card.severity !== "normal");
    const topDelayBacklog = queueDelayRiskExecutionBacklogCards.find((card) => card.severity !== "normal");

    const cards: QueueMobileFollowUpRecommendationUpgrade4Card[] = [
      {
        key: "history-execution-tracker-upgrade4",
        label: "history execution tracker",
        severity: topExecutionTracker?.severity ?? "normal",
        priorityScore: topExecutionTracker?.trackerScore ?? 18,
        detail: topExecutionTracker
          ? `${topExecutionTracker.executionChecklist} (${topExecutionTracker.executionLabel})`
          : "No history execution tracker follow-up is required.",
        actionLabel: topExecutionTracker ? "run execution tracker" : "open tracker panel",
        targetSectionId: "approval-history-sort-execution-tracker"
      },
      {
        key: "delay-execution-backlog-upgrade4",
        label: "delay execution backlog",
        severity: topDelayBacklog?.severity ?? "normal",
        priorityScore: topDelayBacklog?.backlogScore ?? 20,
        detail: topDelayBacklog
          ? `${topDelayBacklog.executionChecklist} (${topDelayBacklog.responseWindow})`
          : "No delay execution backlog follow-up is required.",
        actionLabel: topDelayBacklog ? "run backlog response" : "open backlog panel",
        targetSectionId: "approval-delay-risk-execution-backlog"
      },
      {
        key: "search-coverage-upgrade4",
        label: "search coverage recommendation",
        severity: hasSearchQuery && !hasSearchResults ? "watch" : "normal",
        priorityScore: hasSearchQuery && !hasSearchResults ? 82 : 20,
        detail:
          hasSearchQuery && !hasSearchResults
            ? "Current query has no matches. Reset filters and widen scope."
            : `${filteredQueueSearchSortRows.length} queue row(s) are visible for follow-up.`,
        actionLabel: "open search/sort",
        targetSectionId: "approval-search-sort"
      },
      {
        key: "selection-integrity-upgrade4",
        label: "selection integrity recommendation",
        severity:
          hiddenSelectionCount > 0 || (selectedLeaveCount > 0 && !hasLeaveRejectReason)
            ? "watch"
            : "normal",
        priorityScore: hiddenSelectionCount > 0 || (selectedLeaveCount > 0 && !hasLeaveRejectReason) ? 90 : 16,
        detail:
          hiddenSelectionCount > 0
            ? `${hiddenSelectionCount} selected item(s) are hidden by active filters.`
            : selectedLeaveCount > 0 && !hasLeaveRejectReason
              ? "Leave reject reason is required before reject action."
              : "Selection and required inputs are aligned.",
        actionLabel: hiddenSelectionCount > 0 ? "open queue" : "open mobile checklist",
        targetSectionId: hiddenSelectionCount > 0 ? "approvals" : "approval-mobile-checklist"
      }
    ];

    return cards.sort((left, right) => {
      const severityDiff = queueAlertLevelRank(right.severity) - queueAlertLevelRank(left.severity);
      if (severityDiff !== 0) {
        return severityDiff;
      }
      return right.priorityScore - left.priorityScore;
    });
  }, [
    filteredQueueSearchSortRows.length,
    hasLeaveRejectReason,
    queueDelayRiskExecutionBacklogCards,
    queueHistorySortExecutionTrackerCards,
    queueSearchSortQuery,
    selectedAttendanceCount,
    selectedLeaveCount,
    selectedVisibleAttendanceCount,
    selectedVisibleLeaveCount
  ]);

  const queueHistoryExecutionSummaryCards = useMemo<QueueHistoryExecutionSummaryCard[]>(() => {
    return queueHistorySortExecutionTrackerCards
      .map((card) => ({
        key: `history-execution-summary-${card.key}`,
        sourceKey: card.key,
        label: `${card.label} summary`,
        severity: card.severity,
        summaryScore: card.trackerScore + (card.severity === "critical" ? 7 : card.severity === "watch" ? 3 : 0),
        detail: card.detail,
        executionChecklist: card.executionChecklist,
        executionLabel: card.executionLabel,
        targetSectionId: "approval-history-sort-execution-tracker"
      }))
      .sort((left, right) => {
        const severityDiff = queueAlertLevelRank(right.severity) - queueAlertLevelRank(left.severity);
        if (severityDiff !== 0) {
          return severityDiff;
        }
        return right.summaryScore - left.summaryScore;
      });
  }, [queueHistorySortExecutionTrackerCards]);

  const queueDelayExecutionBacklogDigestCards = useMemo<QueueDelayExecutionBacklogDigestCard[]>(() => {
    return queueDelayRiskExecutionBacklogCards
      .map((card) => ({
        key: `delay-execution-backlog-digest-${card.key}`,
        sourceKey: card.key,
        label: `${card.label} digest`,
        severity: card.severity,
        digestScore: card.backlogScore + (card.severity === "critical" ? 6 : card.severity === "watch" ? 2 : 0),
        detail: card.detail,
        responseWindow: card.responseWindow,
        executionChecklist: card.executionChecklist,
        targetSectionId: "approval-delay-risk-execution-backlog"
      }))
      .sort((left, right) => {
        const severityDiff = queueAlertLevelRank(right.severity) - queueAlertLevelRank(left.severity);
        if (severityDiff !== 0) {
          return severityDiff;
        }
        return right.digestScore - left.digestScore;
      });
  }, [queueDelayRiskExecutionBacklogCards]);

  const queueMobileFollowUpRecommendationUpgrade5Cards = useMemo<QueueMobileFollowUpRecommendationUpgrade5Card[]>(() => {
    const hiddenAttendanceSelection = Math.max(0, selectedAttendanceCount - selectedVisibleAttendanceCount);
    const hiddenLeaveSelection = Math.max(0, selectedLeaveCount - selectedVisibleLeaveCount);
    const hiddenSelectionCount = hiddenAttendanceSelection + hiddenLeaveSelection;
    const hasSearchQuery = queueSearchSortQuery.trim().length > 0;
    const hasSearchResults = filteredQueueSearchSortRows.length > 0;

    const topHistorySummary = queueHistoryExecutionSummaryCards.find((card) => card.severity !== "normal");
    const topDelayDigest = queueDelayExecutionBacklogDigestCards.find((card) => card.severity !== "normal");

    const cards: QueueMobileFollowUpRecommendationUpgrade5Card[] = [
      {
        key: "history-execution-summary-upgrade5",
        label: "history execution summary",
        severity: topHistorySummary?.severity ?? "normal",
        priorityScore: topHistorySummary?.summaryScore ?? 22,
        detail: topHistorySummary
          ? `${topHistorySummary.executionChecklist} (${topHistorySummary.executionLabel})`
          : "No history execution summary follow-up is required.",
        actionLabel: topHistorySummary ? "run execution summary" : "open execution summary",
        targetSectionId: "approval-history-execution-summary"
      },
      {
        key: "delay-execution-backlog-digest-upgrade5",
        label: "delay execution backlog digest",
        severity: topDelayDigest?.severity ?? "normal",
        priorityScore: topDelayDigest?.digestScore ?? 24,
        detail: topDelayDigest
          ? `${topDelayDigest.executionChecklist} (${topDelayDigest.responseWindow})`
          : "No delay execution backlog digest follow-up is required.",
        actionLabel: topDelayDigest ? "run backlog digest" : "open backlog digest",
        targetSectionId: "approval-delay-execution-backlog-digest"
      },
      {
        key: "search-coverage-upgrade5",
        label: "search coverage recommendation",
        severity: hasSearchQuery && !hasSearchResults ? "watch" : "normal",
        priorityScore: hasSearchQuery && !hasSearchResults ? 82 : 20,
        detail:
          hasSearchQuery && !hasSearchResults
            ? "Current query has no matches. Reset filters and widen scope."
            : `${filteredQueueSearchSortRows.length} queue row(s) are visible for follow-up.`,
        actionLabel: "open search/sort",
        targetSectionId: "approval-search-sort"
      },
      {
        key: "selection-integrity-upgrade5",
        label: "selection integrity recommendation",
        severity:
          hiddenSelectionCount > 0 || (selectedLeaveCount > 0 && !hasLeaveRejectReason)
            ? "watch"
            : "normal",
        priorityScore: hiddenSelectionCount > 0 || (selectedLeaveCount > 0 && !hasLeaveRejectReason) ? 90 : 16,
        detail:
          hiddenSelectionCount > 0
            ? `${hiddenSelectionCount} selected item(s) are hidden by active filters.`
            : selectedLeaveCount > 0 && !hasLeaveRejectReason
              ? "Leave reject reason is required before reject action."
              : "Selection and required inputs are aligned.",
        actionLabel: hiddenSelectionCount > 0 ? "open queue" : "open mobile checklist",
        targetSectionId: hiddenSelectionCount > 0 ? "approvals" : "approval-mobile-checklist"
      }
    ];

    return cards.sort((left, right) => {
      const severityDiff = queueAlertLevelRank(right.severity) - queueAlertLevelRank(left.severity);
      if (severityDiff !== 0) {
        return severityDiff;
      }
      return right.priorityScore - left.priorityScore;
    });
  }, [
    filteredQueueSearchSortRows.length,
    hasLeaveRejectReason,
    queueDelayExecutionBacklogDigestCards,
    queueHistoryExecutionSummaryCards,
    queueSearchSortQuery,
    selectedAttendanceCount,
    selectedLeaveCount,
    selectedVisibleAttendanceCount,
    selectedVisibleLeaveCount
  ]);

  function jumpToSection(sectionId: string) {
    if (typeof document === "undefined") {
      return;
    }
    const target = document.getElementById(sectionId);
    if (!target) {
      return;
    }
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    if (typeof window !== "undefined") {
      window.history.replaceState(null, "", `#${sectionId}`);
    }
  }

  function applyQueueSearchSortPreset(preset: {
    scope: QueueSearchSortScope;
    query: string;
    option: QueueSearchSortOption;
    urgentOnly: boolean;
    targetSectionId: string;
  }) {
    setQueueSearchSortScope(preset.scope);
    setQueueSearchSortQuery(preset.query);
    setQueueSearchSortOption(preset.option);
    setApprovalQueueOnlyUrgent(preset.urgentOnly);
    jumpToSection(preset.targetSectionId);
  }

  function runQueueHistorySortHardeningAction(card: QueueHistorySortHardeningCard) {
    applyQueueSearchSortPreset({
      scope: card.searchScope,
      query: card.searchQuery,
      option: card.recommendedSortOption,
      urgentOnly: card.severity === "critical",
      targetSectionId: card.targetSectionId
    });
  }

  function runQueueDelayRiskResponseAction(card: QueueDelayRiskResponseCard) {
    applyQueueSearchSortPreset({
      scope: card.searchScope,
      query: card.searchQuery,
      option: card.recommendedSortOption,
      urgentOnly: card.severity !== "normal",
      targetSectionId: card.targetSectionId
    });
  }

  function runQueueHistorySortHardeningPlusAction(card: QueueHistorySortHardeningPlusCard) {
    applyQueueSearchSortPreset({
      scope: card.searchScope,
      query: card.searchQuery,
      option: card.recommendedSortOption,
      urgentOnly: card.severity === "critical",
      targetSectionId: card.targetSectionId
    });
  }

  function runQueueDelayRiskResponseExecutionGuideAction(card: QueueDelayRiskResponseExecutionGuideCard) {
    applyQueueSearchSortPreset({
      scope: card.searchScope,
      query: card.searchQuery,
      option: card.recommendedSortOption,
      urgentOnly: card.severity !== "normal",
      targetSectionId: card.targetSectionId
    });
  }

  function runQueueMobileFollowUpRecommendationUpgradeAction(card: QueueMobileFollowUpRecommendationUpgradeCard) {
    if (card.key === "sort-hardening-upgrade") {
      const hardeningTarget = queueHistorySortHardeningCards.find(
        (hardeningCard) => hardeningCard.totalCompared > 0 && hardeningCard.severity !== "normal"
      );
      if (hardeningTarget) {
        runQueueHistorySortHardeningAction(hardeningTarget);
        jumpToSection("approval-history-sort-hardening");
        return;
      }
    }
    if (card.key === "delay-response-upgrade") {
      const delayTarget = queueDelayRiskResponseCards.find(
        (responseCard) => responseCard.pendingCount > 0 && responseCard.severity !== "normal"
      );
      if (delayTarget) {
        runQueueDelayRiskResponseAction(delayTarget);
        jumpToSection("approval-delay-risk-response");
        return;
      }
    }
    jumpToSection(card.targetSectionId);
  }

  function runQueueMobileFollowUpRecommendationUpgrade2Action(card: QueueMobileFollowUpRecommendationUpgrade2Card) {
    if (card.key === "sort-hardening-plus-upgrade") {
      const hardeningTarget = queueHistorySortHardeningPlusCards.find(
        (hardeningCard) => hardeningCard.stabilizationScore > 0 && hardeningCard.severity !== "normal"
      );
      if (hardeningTarget) {
        runQueueHistorySortHardeningPlusAction(hardeningTarget);
        jumpToSection("approval-history-sort-hardening-plus");
        return;
      }
    }
    if (card.key === "delay-response-execution-guide-upgrade") {
      const executionGuideTarget = queueDelayRiskResponseExecutionGuideCards.find(
        (guideCard) => guideCard.pendingCount > 0 && guideCard.severity !== "normal"
      );
      if (executionGuideTarget) {
        runQueueDelayRiskResponseExecutionGuideAction(executionGuideTarget);
        jumpToSection("approval-delay-risk-response-execution-guide");
        return;
      }
    }
    jumpToSection(card.targetSectionId);
  }

  function runQueueHistorySortHardeningPlusExecutionAction(card: QueueHistorySortHardeningPlusExecutionCard) {
    applyQueueSearchSortPreset({
      scope: card.searchScope,
      query: card.searchQuery,
      option: card.recommendedSortOption,
      urgentOnly: card.severity === "critical",
      targetSectionId: card.targetSectionId
    });
  }

  function runQueueDelayRiskResponseExecutionTrackerAction(card: QueueDelayRiskResponseExecutionTrackerCard) {
    applyQueueSearchSortPreset({
      scope: card.searchScope,
      query: card.searchQuery,
      option: card.recommendedSortOption,
      urgentOnly: card.severity !== "normal",
      targetSectionId: card.targetSectionId
    });
  }

  function runQueueMobileFollowUpRecommendationUpgrade3Action(card: QueueMobileFollowUpRecommendationUpgrade3Card) {
    if (card.key === "sort-hardening-plus-execution-upgrade") {
      const hardeningTarget = queueHistorySortHardeningPlusExecutionCards.find(
        (hardeningCard) => hardeningCard.stabilizationScore > 0 && hardeningCard.severity !== "normal"
      );
      if (hardeningTarget) {
        runQueueHistorySortHardeningPlusExecutionAction(hardeningTarget);
        jumpToSection("approval-history-sort-hardening-plus-execution");
        return;
      }
    }
    if (card.key === "delay-response-execution-tracker-upgrade") {
      const trackerTarget = queueDelayRiskResponseExecutionTrackerCards.find(
        (trackerCard) => trackerCard.pendingCount > 0 && trackerCard.severity !== "normal"
      );
      if (trackerTarget) {
        runQueueDelayRiskResponseExecutionTrackerAction(trackerTarget);
        jumpToSection("approval-delay-risk-response-execution-tracker");
        return;
      }
    }
    jumpToSection(card.targetSectionId);
  }

  function runQueueHistorySortExecutionTrackerAction(card: QueueHistorySortExecutionTrackerCard) {
    const sourceCard = queueHistorySortHardeningPlusExecutionCards.find(
      (executionCard) => executionCard.key === card.sourceKey
    );
    if (sourceCard) {
      runQueueHistorySortHardeningPlusExecutionAction(sourceCard);
      jumpToSection("approval-history-sort-hardening-plus-execution");
      return;
    }
    jumpToSection(card.targetSectionId);
  }

  function runQueueDelayRiskExecutionBacklogAction(card: QueueDelayRiskExecutionBacklogCard) {
    const sourceCard = queueDelayRiskResponseExecutionTrackerCards.find(
      (trackerCard) => trackerCard.key === card.sourceKey
    );
    if (sourceCard) {
      runQueueDelayRiskResponseExecutionTrackerAction(sourceCard);
      jumpToSection("approval-delay-risk-response-execution-tracker");
      return;
    }
    jumpToSection(card.targetSectionId);
  }

  function runQueueMobileFollowUpRecommendationUpgrade4Action(card: QueueMobileFollowUpRecommendationUpgrade4Card) {
    if (card.key === "history-execution-tracker-upgrade4") {
      const trackerTarget = queueHistorySortExecutionTrackerCards.find(
        (executionTrackerCard) => executionTrackerCard.severity !== "normal"
      );
      if (trackerTarget) {
        runQueueHistorySortExecutionTrackerAction(trackerTarget);
        jumpToSection("approval-history-sort-execution-tracker");
        return;
      }
    }
    if (card.key === "delay-execution-backlog-upgrade4") {
      const backlogTarget = queueDelayRiskExecutionBacklogCards.find(
        (executionBacklogCard) => executionBacklogCard.severity !== "normal"
      );
      if (backlogTarget) {
        runQueueDelayRiskExecutionBacklogAction(backlogTarget);
        jumpToSection("approval-delay-risk-execution-backlog");
        return;
      }
    }
    jumpToSection(card.targetSectionId);
  }

  function runQueueHistoryExecutionSummaryAction(card: QueueHistoryExecutionSummaryCard) {
    const sourceCard = queueHistorySortExecutionTrackerCards.find((trackerCard) => trackerCard.key === card.sourceKey);
    if (sourceCard) {
      runQueueHistorySortExecutionTrackerAction(sourceCard);
      jumpToSection("approval-history-sort-execution-tracker");
      return;
    }
    jumpToSection(card.targetSectionId);
  }

  function runQueueDelayExecutionBacklogDigestAction(card: QueueDelayExecutionBacklogDigestCard) {
    const sourceCard = queueDelayRiskExecutionBacklogCards.find((backlogCard) => backlogCard.key === card.sourceKey);
    if (sourceCard) {
      runQueueDelayRiskExecutionBacklogAction(sourceCard);
      jumpToSection("approval-delay-risk-execution-backlog");
      return;
    }
    jumpToSection(card.targetSectionId);
  }

  function runQueueMobileFollowUpRecommendationUpgrade5Action(card: QueueMobileFollowUpRecommendationUpgrade5Card) {
    if (card.key === "history-execution-summary-upgrade5") {
      const summaryTarget = queueHistoryExecutionSummaryCards.find((summaryCard) => summaryCard.severity !== "normal");
      if (summaryTarget) {
        runQueueHistoryExecutionSummaryAction(summaryTarget);
        jumpToSection("approval-history-execution-summary");
        return;
      }
    }
    if (card.key === "delay-execution-backlog-digest-upgrade5") {
      const digestTarget = queueDelayExecutionBacklogDigestCards.find((digestCard) => digestCard.severity !== "normal");
      if (digestTarget) {
        runQueueDelayExecutionBacklogDigestAction(digestTarget);
        jumpToSection("approval-delay-execution-backlog-digest");
        return;
      }
    }
    jumpToSection(card.targetSectionId);
  }

  async function callApi(
    label: string,
    method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
    path: string,
    payload?: Record<string, unknown>,
    options?: { omitOrganizationHeader?: boolean }
  ) {
    setPendingLabel(label);
    const startedAt = Date.now();
    try {
      const headers: Record<string, string> = {};
      if (payload) {
        headers["content-type"] = "application/json";
      }

      if (usesBearerToken) {
        headers.authorization = `Bearer ${bearerToken.trim()}`;
      } else {
        headers["x-actor-role"] = "admin";
        headers["x-actor-id"] = adminActorId.trim() || "ADM-1001";
        if (!options?.omitOrganizationHeader && organizationId.trim().length > 0) {
          headers["x-actor-organization-id"] = organizationId.trim();
        }
      }

      const response = await fetch(path, {
        method,
        headers,
        body: payload ? JSON.stringify(payload) : undefined
      });

      const raw = await response.text();
      let body: unknown = null;
      if (raw.trim().length > 0) {
        try {
          body = JSON.parse(raw);
        } catch {
          body = raw;
        }
      }

      const durationMs = Date.now() - startedAt;
      setLogs((prev) => [
        {
          id: Date.now(),
          label,
          status: response.status,
          ok: response.ok,
          durationMs,
          at: new Date().toLocaleString("ko-KR"),
          body
        },
        ...prev
      ]);

      return { response, body };
    } finally {
      setPendingLabel(null);
    }
  }

  function appendApprovalActivity(input: {
    queue: "attendance" | "leave" | "payroll";
    actionKind?: "approve" | "reject" | "confirm" | "other";
    action: string;
    itemId: string;
    ok: boolean;
    status: number;
  }) {
    const createdAtMs = Date.now();
    setApprovalActivities((prev) => [
      {
        id: createdAtMs + Math.floor(Math.random() * 1000),
        queue: input.queue,
        actionKind: input.actionKind ?? "other",
        action: input.action,
        itemId: input.itemId,
        ok: input.ok,
        status: input.status,
        createdAtMs,
        at: new Date().toLocaleString("ko-KR")
      },
      ...prev
    ].slice(0, 30));
  }

  function publishMobileApprovalFeedback(input: {
    queue: "attendance" | "leave" | "payroll" | "mixed";
    action: string;
    okCount: number;
    failCount: number;
  }) {
    setMobileApprovalFeedback({
      queue: input.queue,
      action: input.action,
      okCount: input.okCount,
      failCount: input.failCount,
      total: input.okCount + input.failCount,
      at: new Date().toLocaleString("ko-KR")
    });
  }

  async function listEmployees() {
    const { response, body } = await callApi(
      "직원 목록 조회",
      "GET",
      `/api/people/employees${buildQuery({
        organizationId: organizationId.trim() || undefined
      })}`
    );
    if (!response.ok) {
      return;
    }
    const parsed = body as { employees?: EmployeeSummary[] };
    setEmployees(Array.isArray(parsed.employees) ? parsed.employees : []);
  }

  async function createEmployee() {
    const payload = {
      id: employeeId.trim(),
      organizationId: organizationId.trim() || null,
      name: employeeName.trim() || undefined,
      email: employeeEmail.trim() || undefined,
      active: employeeActive
    };
    const { response, body } = await callApi("직원 생성", "POST", "/api/people/employees", payload);
    if (!response.ok) {
      return;
    }
    const parsed = body as { employee?: { id?: string } };
    if (parsed.employee?.id) {
      setEmployeeId(parsed.employee.id);
      setAccrualEmployeeId(parsed.employee.id);
      setScheduleEmployeeId(parsed.employee.id);
      setInviteActorId(parsed.employee.id);
    }
    await listEmployees();
  }

  async function createInvite() {
    setInviteResult(null);

    const email = inviteEmail.trim();
    if (!email) {
      return;
    }

    const payload = {
      email,
      role: inviteRole,
      deliveryMode: inviteDeliveryMode,
      organizationId: organizationId.trim() || undefined,
      actorId: inviteActorId.trim() || undefined
    };

    const { response, body } = await callApi("직원 초대 생성", "POST", "/api/auth/invites", payload);
    if (!response.ok) {
      return;
    }

    const parsed = body as { invite?: InviteResultDto };
    if (parsed.invite) {
      setInviteResult(parsed.invite);
    }
  }

  async function listSchedules() {
    const { response, body } = await callApi(
      "근무 일정 조회",
      "GET",
      `/api/scheduling/schedules${buildQuery({
        from: toIso(periodStart),
        to: toIso(periodEnd),
        employeeId: scheduleEmployeeId.trim() || undefined
      })}`
    );
    if (!response.ok) {
      return;
    }
    const parsed = body as { schedules?: WorkScheduleDto[] };
    setSchedules(Array.isArray(parsed.schedules) ? parsed.schedules : []);
  }

  async function createSchedule() {
    const breakMinutesRaw = Number(scheduleBreakMinutes);
    const payload = {
      employeeId: scheduleEmployeeId.trim(),
      startAt: toIso(scheduleStartAt),
      endAt: toIso(scheduleEndAt),
      breakMinutes: Math.max(0, Math.trunc(Number.isFinite(breakMinutesRaw) ? breakMinutesRaw : 0)),
      isHoliday: scheduleIsHoliday,
      notes: scheduleNotes.trim() ? scheduleNotes.trim() : undefined
    };

    const { response } = await callApi("근무 일정 생성", "POST", "/api/scheduling/schedules", payload);
    if (!response.ok) {
      return;
    }
    await listSchedules();
  }

  async function deleteSchedule(scheduleId: string) {
    if (!scheduleId.trim()) {
      return;
    }
    const okToDelete = window.confirm(`근무 일정을 삭제할까요?\n\nID: ${scheduleId}`);
    if (!okToDelete) {
      return;
    }

    const { response } = await callApi(
      "근무 일정 삭제",
      "DELETE",
      `/api/scheduling/schedules/${encodeURIComponent(scheduleId)}`
    );
    if (!response.ok) {
      return;
    }
    setSchedules((prev) => prev.filter((item) => item.id !== scheduleId));
  }

  async function listOrganizations() {
    const { response, body } = await callApi("조직 목록 조회", "GET", "/api/people/organizations", undefined, {
      omitOrganizationHeader: true
    });
    if (!response.ok) {
      return;
    }
    const parsed = body as { organizations?: OrganizationSummary[] };
    setOrganizations(Array.isArray(parsed.organizations) ? parsed.organizations : []);
  }

  async function createOrganization() {
    const name = organizationName.trim();
    if (!name) {
      setLogs((prev) => [
        {
          id: Date.now(),
          label: "조직 생성",
          status: 400,
          ok: false,
          durationMs: 0,
          at: new Date().toLocaleString("ko-KR"),
          body: { error: "조직 이름이 필요합니다." }
        },
        ...prev
      ]);
      return;
    }

    const { response, body } = await callApi(
      "조직 생성",
      "POST",
      "/api/people/organizations",
      { name },
      { omitOrganizationHeader: true }
    );
    if (!response.ok) {
      return;
    }

    const parsed = body as { organization?: { id?: string } };
    const createdId = parsed.organization?.id;
    if (typeof createdId === "string" && createdId.trim().length > 0) {
      setOrganizationId(createdId);
    }

    await listOrganizations();
  }

  async function refreshInbox() {
    const from = toIso(periodStart);
    const to = toIso(periodEnd);

    const [attendanceRes, leaveRes, payrollRes] = await Promise.all([
      callApi(
        "승인 대기 출퇴근 조회",
        "GET",
        `/api/attendance/records${buildQuery({ from, to, state: "PENDING" })}`
      ),
      callApi(
        "승인 대기 휴가 조회",
        "GET",
        `/api/leave/requests${buildQuery({ from, to, state: "PENDING" })}`
      ),
      callApi(
        "프리뷰 급여 조회",
        "GET",
        `/api/payroll/runs${buildQuery({ from, to, state: "PREVIEWED" })}`
      )
    ]);

    if (attendanceRes.response.ok) {
      const parsed = attendanceRes.body as { records?: AttendanceRecordDto[] };
      const records = Array.isArray(parsed.records) ? parsed.records : [];
      setPendingAttendance(records);
      setSelectedAttendanceIds((prev) => prev.filter((id) => records.some((record) => record.id === id)));
    }
    if (leaveRes.response.ok) {
      const parsed = leaveRes.body as { requests?: LeaveRequestDto[] };
      const requests = Array.isArray(parsed.requests) ? parsed.requests : [];
      setPendingLeave(requests);
      setSelectedLeaveIds((prev) => prev.filter((id) => requests.some((request) => request.id === id)));
    }
    if (payrollRes.response.ok) {
      const parsed = payrollRes.body as { runs?: PayrollRunDto[] };
      const runs = Array.isArray(parsed.runs) ? parsed.runs : [];
      setPreviewedPayroll(runs);
    }
  }

  function toggleAttendanceSelection(recordId: string, checked: boolean) {
    setSelectedAttendanceIds((prev) => {
      if (checked) {
        return prev.includes(recordId) ? prev : [...prev, recordId];
      }
      return prev.filter((id) => id !== recordId);
    });
  }

  function toggleLeaveSelection(requestId: string, checked: boolean) {
    setSelectedLeaveIds((prev) => {
      if (checked) {
        return prev.includes(requestId) ? prev : [...prev, requestId];
      }
      return prev.filter((id) => id !== requestId);
    });
  }

  function selectAllAttendance() {
    setSelectedAttendanceIds(filteredPendingAttendance.map((record) => record.id));
  }

  function clearAttendanceSelection() {
    setSelectedAttendanceIds([]);
  }

  function selectAllLeave() {
    setSelectedLeaveIds(filteredPendingLeave.map((request) => request.id));
  }

  function clearLeaveSelection() {
    setSelectedLeaveIds([]);
  }

  async function approveAttendance(recordId: string) {
    const { response } = await callApi("출퇴근 승인", "POST", `/api/attendance/records/${recordId}/approve`);
    appendApprovalActivity({
      queue: "attendance",
      actionKind: "approve",
      action: "승인",
      itemId: recordId,
      ok: response.ok,
      status: response.status
    });
    publishMobileApprovalFeedback({
      queue: "attendance",
      action: "attendance-single-approve",
      okCount: response.ok ? 1 : 0,
      failCount: response.ok ? 0 : 1
    });
    await refreshInbox();
  }

  async function rejectAttendance(recordId: string) {
    const reason = attendanceRejectReason.trim();
    const payload = reason.length > 0 ? { reason } : undefined;
    const { response } = await callApi("출퇴근 반려", "POST", `/api/attendance/records/${recordId}/reject`, payload);
    appendApprovalActivity({
      queue: "attendance",
      actionKind: "reject",
      action: "반려",
      itemId: recordId,
      ok: response.ok,
      status: response.status
    });
    publishMobileApprovalFeedback({
      queue: "attendance",
      action: "attendance-single-reject",
      okCount: response.ok ? 1 : 0,
      failCount: response.ok ? 0 : 1
    });
    await refreshInbox();
  }

  async function approveLeave(requestId: string) {
    const { response } = await callApi("휴가 승인", "POST", `/api/leave/requests/${requestId}/approve`);
    appendApprovalActivity({
      queue: "leave",
      actionKind: "approve",
      action: "승인",
      itemId: requestId,
      ok: response.ok,
      status: response.status
    });
    publishMobileApprovalFeedback({
      queue: "leave",
      action: "leave-single-approve",
      okCount: response.ok ? 1 : 0,
      failCount: response.ok ? 0 : 1
    });
    await refreshInbox();
  }

  async function rejectLeave(requestId: string) {
    const reason = leaveRejectReason.trim();
    if (!reason) {
      setLogs((prev) => [
        {
          id: Date.now(),
          label: "휴가 반려",
          status: 400,
          ok: false,
          durationMs: 0,
          at: new Date().toLocaleString("ko-KR"),
          body: { error: "반려 사유는 필수입니다." }
        },
        ...prev
      ]);
      return;
    }
    const { response } = await callApi("휴가 반려", "POST", `/api/leave/requests/${requestId}/reject`, { reason });
    appendApprovalActivity({
      queue: "leave",
      actionKind: "reject",
      action: "반려",
      itemId: requestId,
      ok: response.ok,
      status: response.status
    });
    publishMobileApprovalFeedback({
      queue: "leave",
      action: "leave-single-reject",
      okCount: response.ok ? 1 : 0,
      failCount: response.ok ? 0 : 1
    });
    await refreshInbox();
  }

  async function approveSelectedAttendance() {
    if (!canApproveSelectedAttendance || selectedAttendanceIds.length === 0) {
      return;
    }
    const targets = [...selectedAttendanceIds];
    const results = await Promise.all(
      targets.map((recordId) => callApi("출퇴근 승인(일괄)", "POST", `/api/attendance/records/${recordId}/approve`))
    );
    results.forEach(({ response }, index) => {
      appendApprovalActivity({
        queue: "attendance",
        actionKind: "approve",
        action: "승인(일괄)",
        itemId: targets[index],
        ok: response.ok,
        status: response.status
      });
    });
    const okCount = results.filter(({ response }) => response.ok).length;
    publishMobileApprovalFeedback({
      queue: "attendance",
      action: "attendance-bulk-approve",
      okCount,
      failCount: results.length - okCount
    });
    await refreshInbox();
  }

  async function rejectSelectedAttendance() {
    if (!canRejectSelectedAttendance || selectedAttendanceIds.length === 0) {
      return;
    }
    const reason = attendanceRejectReason.trim();
    const payload = reason.length > 0 ? { reason } : undefined;
    const targets = [...selectedAttendanceIds];
    const results = await Promise.all(
      targets.map((recordId) => callApi("출퇴근 반려(일괄)", "POST", `/api/attendance/records/${recordId}/reject`, payload))
    );
    results.forEach(({ response }, index) => {
      appendApprovalActivity({
        queue: "attendance",
        actionKind: "reject",
        action: "반려(일괄)",
        itemId: targets[index],
        ok: response.ok,
        status: response.status
      });
    });
    const okCount = results.filter(({ response }) => response.ok).length;
    publishMobileApprovalFeedback({
      queue: "attendance",
      action: "attendance-bulk-reject",
      okCount,
      failCount: results.length - okCount
    });
    await refreshInbox();
  }

  async function approveSelectedLeave() {
    if (!canApproveSelectedLeave || selectedLeaveIds.length === 0) {
      return;
    }
    const targets = [...selectedLeaveIds];
    const results = await Promise.all(
      targets.map((requestId) => callApi("휴가 승인(일괄)", "POST", `/api/leave/requests/${requestId}/approve`))
    );
    results.forEach(({ response }, index) => {
      appendApprovalActivity({
        queue: "leave",
        actionKind: "approve",
        action: "승인(일괄)",
        itemId: targets[index],
        ok: response.ok,
        status: response.status
      });
    });
    const okCount = results.filter(({ response }) => response.ok).length;
    publishMobileApprovalFeedback({
      queue: "leave",
      action: "leave-bulk-approve",
      okCount,
      failCount: results.length - okCount
    });
    await refreshInbox();
  }

  async function rejectSelectedLeave() {
    if (!canRejectSelectedLeave || selectedLeaveIds.length === 0) {
      return;
    }
    const reason = leaveRejectReason.trim();
    if (!reason) {
      setLogs((prev) => [
        {
          id: Date.now(),
          label: "휴가 반려(일괄)",
          status: 400,
          ok: false,
          durationMs: 0,
          at: new Date().toLocaleString("ko-KR"),
          body: { error: "반려 사유는 필수입니다." }
        },
        ...prev
      ]);
      return;
    }
    const targets = [...selectedLeaveIds];
    const results = await Promise.all(
      targets.map((requestId) => callApi("휴가 반려(일괄)", "POST", `/api/leave/requests/${requestId}/reject`, { reason }))
    );
    results.forEach(({ response }, index) => {
      appendApprovalActivity({
        queue: "leave",
        actionKind: "reject",
        action: "반려(일괄)",
        itemId: targets[index],
        ok: response.ok,
        status: response.status
      });
    });
    const okCount = results.filter(({ response }) => response.ok).length;
    publishMobileApprovalFeedback({
      queue: "leave",
      action: "leave-bulk-reject",
      okCount,
      failCount: results.length - okCount
    });
    await refreshInbox();
  }

  async function confirmPayroll(runId: string) {
    const { response, body } = await callApi("급여 확정", "POST", `/api/payroll/runs/${runId}/confirm`);
    appendApprovalActivity({
      queue: "payroll",
      actionKind: "confirm",
      action: "확정",
      itemId: runId,
      ok: response.ok,
      status: response.status
    });
    publishMobileApprovalFeedback({
      queue: "payroll",
      action: "payroll-single-confirm",
      okCount: response.ok ? 1 : 0,
      failCount: response.ok ? 0 : 1
    });
    if (response.ok) {
      const parsed = body as { run?: { id?: string } };
      if (parsed.run?.id) {
        setLastPayrollRunId(parsed.run.id);
      }
    }
    await refreshInbox();
  }

  async function previewPayroll() {
    const basePayload = {
      periodStart: toIso(periodStart),
      periodEnd: toIso(periodEnd),
      employeeId: employeeId.trim() || undefined,
      hourlyRateKrw: Number(payrollHourlyRateKrw),
      multipliers: {
        overtime: 1.5,
        night: 1.5,
        holiday: 1.5
      }
    };

    const statutoryPayload = {
      ...basePayload,
      deductionMode: "statutory_kr_baseline" as const,
      statutory: {
        nonTaxableIncomeKrw: Math.max(0, Number(payrollNonTaxableIncomeKrw) || 0),
        otherDeductionsKrw: Math.max(0, Number(payrollOtherDeductionsKrw) || 0),
        additionalTaxCreditKrw: Math.max(0, Math.trunc(Number(payrollAdditionalTaxCreditKrw) || 0)),
        dependentCount: Math.max(0, Math.trunc(Number(payrollDependentCount) || 0)),
        dependentTaxCreditPerPersonKrw: Math.max(
          0,
          Math.trunc(Number(payrollDependentTaxCreditPerPersonKrw) || 0)
        ),
        requireMonthlyBoundary: payrollRequireMonthlyBoundary,
        nationalPensionCapKrw:
          payrollNationalPensionCapKrw.trim().length > 0
            ? Math.max(0, Number(payrollNationalPensionCapKrw) || 0)
            : undefined,
        healthInsuranceCapKrw:
          payrollHealthInsuranceCapKrw.trim().length > 0
            ? Math.max(0, Number(payrollHealthInsuranceCapKrw) || 0)
            : undefined,
        employmentInsuranceCapKrw:
          payrollEmploymentInsuranceCapKrw.trim().length > 0
            ? Math.max(0, Number(payrollEmploymentInsuranceCapKrw) || 0)
            : undefined
      }
    };

    const { response, body } = await callApi(
      payrollPreviewMode === "gross" ? "급여 프리뷰 생성(총지급)" : "급여 프리뷰 생성(법정공제)",
      "POST",
      payrollPreviewMode === "gross"
        ? "/api/payroll/runs/preview"
        : "/api/payroll/runs/preview-with-deductions",
      payrollPreviewMode === "gross" ? basePayload : statutoryPayload
    );
    if (!response.ok) {
      return;
    }
    const parsed = body as { run?: { id?: string } };
    if (parsed.run?.id) {
      setLastPayrollRunId(parsed.run.id);
    }
    await refreshInbox();
  }

  async function settleLeaveAccrual() {
    const year = Number(accrualYear);
    const annualGrantDaysRaw = accrualGrantDays.trim();
    const carryOverCapDaysRaw = accrualCarryCapDays.trim();
    const annualGrantDays = annualGrantDaysRaw.length > 0 ? Number(annualGrantDaysRaw) : Number.NaN;
    const carryOverCapDays = carryOverCapDaysRaw.length > 0 ? Number(carryOverCapDaysRaw) : Number.NaN;
    const payload = {
      employeeId: accrualEmployeeId.trim(),
      year,
      annualGrantDays: Number.isFinite(annualGrantDays) ? annualGrantDays : undefined,
      carryOverCapDays: Number.isFinite(carryOverCapDays) ? carryOverCapDays : undefined
    };
    const { response, body } = await callApi("휴가 정산(부여/이월)", "POST", "/api/leave/accrual/settle", payload);
    if (!response.ok) {
      return;
    }
    const parsed = body as { balance?: LeaveBalanceDto };
    setAccrualResult(parsed.balance ?? null);
  }

  async function loadLeavePolicy() {
    const orgId = organizationId.trim();
    if (!orgId) {
      setLogs((prev) => [
        {
          id: Date.now(),
          label: "휴가 정책 조회",
          status: 400,
          ok: false,
          durationMs: 0,
          at: new Date().toLocaleString("ko-KR"),
          body: { error: "Organization ID가 필요합니다." }
        },
        ...prev
      ]);
      return;
    }

    const { response, body } = await callApi(
      "휴가 정책 조회",
      "GET",
      `/api/leave/policy${buildQuery({ organizationId: orgId })}`
    );
    if (!response.ok) {
      return;
    }
    const parsed = body as {
      policy?: {
        annualGrantDays?: number;
        carryOverCapDays?: number;
        allowHalfDay?: boolean;
        allowHourly?: boolean;
        hourlyIncrementMinutes?: number;
        maxHoursPerRequest?: number;
        minNoticeDays?: number;
        maxConsecutiveDays?: number | null;
      };
    };
    if (typeof parsed.policy?.annualGrantDays === "number") {
      setAccrualGrantDays(String(parsed.policy.annualGrantDays));
    }
    if (typeof parsed.policy?.carryOverCapDays === "number") {
      setAccrualCarryCapDays(String(parsed.policy.carryOverCapDays));
    }
    if (typeof parsed.policy?.allowHalfDay === "boolean") {
      setLeaveAllowHalfDay(parsed.policy.allowHalfDay);
    }
    if (typeof parsed.policy?.allowHourly === "boolean") {
      setLeaveAllowHourly(parsed.policy.allowHourly);
    }
    if (typeof parsed.policy?.hourlyIncrementMinutes === "number") {
      setLeaveHourlyIncrementMinutes(String(parsed.policy.hourlyIncrementMinutes));
    }
    if (typeof parsed.policy?.maxHoursPerRequest === "number") {
      setLeaveMaxHoursPerRequest(String(parsed.policy.maxHoursPerRequest));
    }
    if (typeof parsed.policy?.minNoticeDays === "number") {
      setLeaveMinNoticeDays(String(parsed.policy.minNoticeDays));
    }
    if (typeof parsed.policy?.maxConsecutiveDays === "number") {
      setLeaveMaxConsecutiveDays(String(parsed.policy.maxConsecutiveDays));
    } else if (parsed.policy?.maxConsecutiveDays === null) {
      setLeaveMaxConsecutiveDays("");
    }
  }

  async function saveLeavePolicy() {
    const orgId = organizationId.trim();
    if (!orgId) {
      setLogs((prev) => [
        {
          id: Date.now(),
          label: "휴가 정책 저장",
          status: 400,
          ok: false,
          durationMs: 0,
          at: new Date().toLocaleString("ko-KR"),
          body: { error: "Organization ID가 필요합니다." }
        },
        ...prev
      ]);
      return;
    }

    const annualGrantDays = Number(accrualGrantDays.trim());
    const carryOverCapDays = Number(accrualCarryCapDays.trim());
    const hourlyIncrementMinutes = Number(leaveHourlyIncrementMinutes.trim());
    const maxHoursPerRequest = Number(leaveMaxHoursPerRequest.trim());
    const minNoticeDaysRaw = leaveMinNoticeDays.trim();
    const minNoticeDays = minNoticeDaysRaw.length > 0 ? Number(minNoticeDaysRaw) : Number.NaN;
    const maxConsecutiveDaysRaw = leaveMaxConsecutiveDays.trim();
    const maxConsecutiveDays =
      maxConsecutiveDaysRaw.length > 0 ? Number(maxConsecutiveDaysRaw) : null;
    const payload = {
      organizationId: orgId,
      annualGrantDays,
      carryOverCapDays,
      allowHalfDay: leaveAllowHalfDay,
      allowHourly: leaveAllowHourly,
      hourlyIncrementMinutes,
      maxHoursPerRequest,
      minNoticeDays: Number.isFinite(minNoticeDays) ? minNoticeDays : undefined,
      maxConsecutiveDays:
        maxConsecutiveDays === null
          ? null
          : Number.isFinite(maxConsecutiveDays)
            ? maxConsecutiveDays
            : undefined
    };
    await callApi("휴가 정책 저장", "PUT", "/api/leave/policy", payload);
  }

  async function listAttendanceAggregates(options?: { employeeId?: string }) {
    const from = toIso(periodStart);
    const to = toIso(periodEnd);
    const employeeCandidate = options?.employeeId;
    const employee =
      typeof employeeCandidate === "string" ? employeeCandidate.trim() : aggregateEmployeeId.trim();
    const { response, body } = await callApi(
      employee ? "근태 집계 조회" : "근태 집계 조회(전체)",
      "GET",
      `/api/attendance/aggregates${buildQuery({
        from,
        to,
        employeeId: employee.length > 0 ? employee : undefined
      })}`
    );
    if (!response.ok) {
      return;
    }
    const parsed = body as { aggregates?: AttendanceAggregateDto[] };
    setAggregates(Array.isArray(parsed.aggregates) ? parsed.aggregates : []);
  }

  function clearLogs() {
    setLogs([]);
  }

  async function refreshDashboard() {
    await Promise.all([refreshInbox(), listAttendanceAggregates()]);
  }

  return (
    <main className="saas-content">
      <header className="page-header">
        <div>
          <h1 className="page-title">관리자 대시보드</h1>
          <p className="page-subtitle">
            직원/조직 온보딩부터 승인 대기함 처리, 근태 집계 확인, 급여 프리뷰/확정까지 한 화면에서 처리합니다.
          </p>
        </div>
        <div className="page-actions">
          <button className="btn btn-primary" onClick={() => void refreshDashboard()}>
            대시보드 새로고침
          </button>
          <Link className="btn btn-secondary" href="/employee">
            직원 포털
          </Link>
          <Link className="btn btn-secondary" href="/login">
            로그인
          </Link>
          <Link className="btn btn-secondary" href="/">
            홈
          </Link>
          {showDevTools ? (
            <Link className="btn btn-secondary" href="/ops/mvp-console">
              (dev) ops 콘솔
            </Link>
          ) : null}
        </div>
      </header>

      {isProductionRuntime && !usesBearerToken ? (
        <p className="small" style={{ margin: "0 0 14px", color: "var(--danger)" }}>
          현재 환경은 <strong>production</strong>입니다. API 호출을 위해 로그인 세션(Bearer)이 필요합니다:{" "}
          <Link href="/login">/login</Link>
        </p>
      ) : null}

      <section className="kpi-strip">
        <article className="kpi-card">
          <p>출퇴근 승인 대기</p>
          <strong>{pendingAttendance.length}</strong>
        </article>
        <article className="kpi-card">
          <p>휴가 승인 대기</p>
          <strong>{pendingLeave.length}</strong>
        </article>
        <article className="kpi-card">
          <p>급여 프리뷰</p>
          <strong>{previewedPayroll.length}</strong>
        </article>
        <article className="kpi-card">
          <p>API 호출</p>
          <strong>
            {stats.total} (OK {stats.success} / FAIL {stats.fail})
          </strong>
        </article>
        <article className="kpi-card">
          <p>최근 실행</p>
          <strong>{pendingLabel ?? "-"}</strong>
        </article>
      </section>

      <section className="panel-grid">
        <article className="panel" id="onboarding">
          <h2>조직 온보딩</h2>
          <p className="small">
            조직(테넌트)을 먼저 만들고 선택해야 직원/근태/휴가/급여 흐름을 정상 검증할 수 있습니다. 이 패널의 조직
            생성/목록 조회 호출은 tenantScope 제한을 피하기 위해 Dev Header 모드에서{" "}
            <code>x-actor-organization-id</code> 헤더를 생략합니다.
          </p>
          <p className="small">
            현재 선택된 Organization ID: <code>{organizationId.trim() || "-"}</code>
          </p>

          <div className="input-grid">
            <label className="full">
              새 조직 이름
              <input value={organizationName} onChange={(event) => setOrganizationName(event.target.value)} />
            </label>
          </div>
          <div className="actions">
            <button className="btn btn-primary" onClick={() => void createOrganization()} disabled={!organizationName.trim()}>
              조직 생성
            </button>
            <button className="btn btn-secondary" onClick={() => void listOrganizations()}>
              조직 목록 조회
            </button>
          </div>

          {organizations.length === 0 ? (
            <p className="small muted">조직 목록을 아직 불러오지 않았습니다.</p>
          ) : (
            <ul className="simple-list" aria-label="조직 목록">
              {organizations.map((org) => (
                <li key={org.id}>
                  <span>
                    <strong>{org.id}</strong>{" "}
                    <span className="muted">
                      {org.name}
                      {organizationId.trim() === org.id ? " (선택됨)" : ""}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => setOrganizationId(org.id)}
                  >
                    이 조직 사용
                  </button>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel" id="account">
          <h2>내 계정</h2>
          {isProductionRuntime ? (
            <p className="small">
              {supabaseSession
                ? `${supabaseSession.email ?? supabaseSession.userId} · role=${supabaseSession.role ?? "-"} · org=${supabaseSession.organizationId ?? "-"}`
                : "현재 로그인되어 있지 않습니다."}{" "}
              <span className="muted">(Bearer {usesBearerToken ? "ON" : "OFF"})</span>
            </p>
          ) : (
            <p className="small muted">로컬 개발: Dev Header(x-actor-*) 모드가 기본입니다.</p>
          )}
          {supabaseSessionError ? (
            <p className="small" style={{ marginTop: 10, color: "var(--danger)" }}>
              세션 오류: {supabaseSessionError}
            </p>
          ) : null}

          {showDevTools || !isProductionRuntime ? (
            <details className="details" style={{ marginTop: 12 }}>
              <summary>
                개발/검증 설정 <small>(필요할 때만)</small>
              </summary>
              <div className="input-grid" style={{ marginTop: 12 }}>
                <label>
                  Organization ID
                  <input
                    value={organizationId}
                    placeholder="예: ORG-00001"
                    onChange={(event) => setOrganizationId(event.target.value)}
                  />
                </label>
                <label>
                  Admin Actor ID
                  <input value={adminActorId} onChange={(event) => setAdminActorId(event.target.value)} />
                </label>
                {showDevTools ? (
                  <label className="full">
                    Bearer Access Token (override)
                    <textarea
                      rows={3}
                      placeholder="비어 있으면 Dev Header(로컬) 또는 세션(Bearer)이 사용됩니다."
                      value={accessToken}
                      onChange={(event) => setAccessToken(event.target.value)}
                    />
                  </label>
                ) : null}
              </div>
              {showDevTools ? (
                <p className="small muted" style={{ marginTop: 10 }}>
                  (dev) Runtime Supabase URL: <code>{supabaseUrl}</code>
                </p>
              ) : null}
            </details>
          ) : null}
        </article>

        <article className="panel" id="people">
          <h2>직원 관리</h2>
          <p className="small">
            출퇴근/휴가/급여는 Employee 마스터가 있어야 동작합니다. 먼저 직원부터 생성하세요.
          </p>
          <div className="input-grid">
            <label>
              직원 ID
              <input value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} />
            </label>
            <label>
              이름 (선택)
              <input value={employeeName} onChange={(event) => setEmployeeName(event.target.value)} />
            </label>
            <label>
              이메일 (선택)
              <input value={employeeEmail} onChange={(event) => setEmployeeEmail(event.target.value)} />
            </label>
            <label>
              활성
              <select
                value={employeeActive ? "yes" : "no"}
                onChange={(event) => setEmployeeActive(event.target.value === "yes")}
              >
                <option value="yes">예</option>
                <option value="no">아니오</option>
              </select>
            </label>
          </div>
          <div className="actions">
            <button
              className="btn btn-primary"
              onClick={() => void createEmployee()}
              disabled={!employeeId.trim() || !organizationId.trim()}
            >
              직원 생성
            </button>
            <button className="btn btn-secondary" onClick={() => void listEmployees()}>
              직원 목록 조회
            </button>
          </div>
          {employees.length > 0 ? (
            <ul className="simple-list" aria-label="직원 목록">
              {employees.map((employee) => (
                <li key={employee.id}>
                  <span>
                    <strong>{employee.id}</strong>{" "}
                    <span className="muted">
                      {employee.active ? "활성" : "비활성"} / {employee.organizationId ?? "-"}
                      {employee.name ? ` / ${employee.name}` : ""}
                      {employee.email ? ` / ${employee.email}` : ""}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => {
                      setEmployeeId(employee.id);
                      setAccrualEmployeeId(employee.id);
                      setAggregateEmployeeId(employee.id);
                      setScheduleEmployeeId(employee.id);
                      setInviteActorId(employee.id);
                    }}
                  >
                    이 직원으로 적용
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </article>

        <article className="panel" id="invites">
          <h2>초대/가입</h2>
          <p className="small">
            직원에게 전달할 초대 링크를 생성합니다. <strong>Actor ID</strong>에 <code>Employee.id</code>를 넣으면 직원 포털이 해당
            직원으로 매핑됩니다.
          </p>
          <div className="input-grid">
            <label className="full">
              초대 이메일
              <input
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
                placeholder="you@company.com"
              />
            </label>
            <label>
              역할
              <select value={inviteRole} onChange={(event) => setInviteRole(event.target.value as InviteRole)}>
                <option value="employee">employee</option>
                <option value="manager">manager</option>
                <option value="payroll_operator">payroll_operator</option>
                <option value="admin">admin</option>
              </select>
            </label>
            <label>
              Delivery
              <select
                value={inviteDeliveryMode}
                onChange={(event) => setInviteDeliveryMode(event.target.value as InviteDeliveryMode)}
              >
                <option value="link">link</option>
                <option value="email">email</option>
              </select>
            </label>
            <label>
              Actor ID (선택)
              <input
                value={inviteActorId}
                onChange={(event) => setInviteActorId(event.target.value)}
                placeholder="예: EMP-1001"
              />
            </label>
            <label className="full">
              Organization ID
              <input value={organizationId} onChange={(event) => setOrganizationId(event.target.value)} />
            </label>
          </div>
          <div className="actions">
            <button
              className="btn btn-primary"
              onClick={() => void createInvite()}
              disabled={!inviteEmail.trim() || !organizationId.trim()}
            >
              초대 링크 생성
            </button>
          </div>
          {inviteResult ? (
            <>
              <p className="small">
                생성됨: <strong>{inviteResult.email}</strong> · role={inviteResult.role} · delivery=
                {inviteResult.deliveryMode} · org={inviteResult.organizationId}
                {inviteResult.actorId ? ` · actor=${inviteResult.actorId}` : ""}
              </p>
              {inviteResult.actionLink ? (
                <label className="full" style={{ display: "block", marginTop: 8 }}>
                  초대 링크 (action_link)
                  <textarea readOnly rows={3} value={inviteResult.actionLink} />
                </label>
              ) : (
                <p className="small muted" style={{ marginTop: 8 }}>
                  이메일 발송 모드로 생성되어 action_link를 저장하지 않았습니다.
                </p>
              )}
              <p className="small muted" style={{ marginTop: 8 }}>
                링크가 `/login`으로 리다이렉트되려면 Supabase Auth의 Redirect URL에 현재 도메인이 허용되어 있어야 합니다.
              </p>
            </>
          ) : (
            <p className="small muted">아직 초대 링크를 생성하지 않았습니다.</p>
          )}
        </article>

        <article className="panel" id="scheduling">
          <h2>근무 일정</h2>
          <p className="small">
            직원별 근무 일정을 생성/조회/삭제합니다. 기간 필터(시작/종료)는 아래 기능들과 동일하게 공유됩니다.
          </p>
          <div className="input-grid">
            <label>
              직원 ID
              <input
                value={scheduleEmployeeId}
                onChange={(event) => setScheduleEmployeeId(event.target.value)}
                placeholder="예: EMP-1001"
              />
            </label>
            <label>
              기간 시작 (조회)
              <input
                type="datetime-local"
                value={periodStart}
                onChange={(event) => setPeriodStart(event.target.value)}
              />
            </label>
            <label>
              기간 종료 (조회)
              <input
                type="datetime-local"
                value={periodEnd}
                onChange={(event) => setPeriodEnd(event.target.value)}
              />
            </label>
            <label>
              휴일 근무
              <select
                value={scheduleIsHoliday ? "yes" : "no"}
                onChange={(event) => setScheduleIsHoliday(event.target.value === "yes")}
              >
                <option value="no">아니오</option>
                <option value="yes">예</option>
              </select>
            </label>
            <label>
              시작 시각
              <input
                type="datetime-local"
                value={scheduleStartAt}
                onChange={(event) => setScheduleStartAt(event.target.value)}
              />
            </label>
            <label>
              종료 시각
              <input
                type="datetime-local"
                value={scheduleEndAt}
                onChange={(event) => setScheduleEndAt(event.target.value)}
              />
            </label>
            <label>
              휴게 분
              <input
                type="number"
                min={0}
                value={scheduleBreakMinutes}
                onChange={(event) => setScheduleBreakMinutes(event.target.value)}
              />
            </label>
            <label>
              메모 (선택)
              <input value={scheduleNotes} onChange={(event) => setScheduleNotes(event.target.value)} />
            </label>
          </div>
          <div className="actions">
            <button
              className="btn btn-primary"
              onClick={() => void createSchedule()}
              disabled={!scheduleEmployeeId.trim()}
            >
              일정 생성
            </button>
            <button className="btn btn-secondary" onClick={() => void listSchedules()}>
              일정 조회
            </button>
          </div>
          {schedules.length === 0 ? (
            <p className="small muted">근무 일정이 없습니다.</p>
          ) : (
            <ul className="simple-list" aria-label="근무 일정 목록">
              {schedules.map((schedule) => (
                <li key={schedule.id}>
                  <span>
                    <span className="ok">{schedule.isHoliday ? "HOLIDAY" : "WORK"}</span>{" "}
                    <strong>{schedule.employeeId}</strong>{" "}
                    <span className="muted">
                      {formatDateTime(schedule.startAt)} ~ {formatDateTime(schedule.endAt)} (휴게{" "}
                      {schedule.breakMinutes}분)
                      {schedule.notes ? ` / ${schedule.notes}` : ""}
                    </span>{" "}
                    <time className="muted">{schedule.id}</time>
                  </span>
                  <div className="queue-actions">
                    <button
                      type="button"
                      className="btn btn-danger btn-small"
                      onClick={() => void deleteSchedule(schedule.id)}
                    >
                      삭제
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel" id="approvals">
          <div className="approval-queue-header">
            <div>
              <h2>승인 대기함</h2>
              <p className="small">승인 큐 필터/검색/정렬로 대기열을 빠르게 좁혀 일괄 처리합니다.</p>
            </div>
            <button className="btn btn-primary" onClick={() => void refreshInbox()}>
              대기함 새로고침
            </button>
          </div>

          <div className="queue-badge-strip" role="tablist" aria-label="승인 큐 필터">
            {queueBadgeSummaries.map((badge) => (
              <button
                key={badge.focus}
                type="button"
                role="tab"
                aria-selected={approvalQueueFocus === badge.focus}
                className={`queue-badge${approvalQueueFocus === badge.focus ? " active" : ""}`}
                onClick={() => setApprovalQueueFocus(badge.focus)}
              >
                <span className="queue-badge-title">{badge.label}</span>
                <span className="queue-badge-count">대기 {badge.pending}</span>
                <span className={`queue-badge-alert alert-${badge.alertLevel}`}>
                  {badge.alertLevel === "critical"
                    ? `긴급 ${badge.critical}`
                    : badge.alertLevel === "watch"
                      ? `주의 ${badge.watch}`
                      : "정상"}
                </span>
                <span className="queue-badge-meta">
                  검색 {badge.visible} / 최장 {Math.round(badge.oldestHours)}h
                  {badge.selected > 0 ? ` / 선택 ${badge.selected}` : ""}
                </span>
              </button>
            ))}
          </div>

          <div className="queue-alert-strip" aria-label="승인 큐 알림 요약">
            <article className="queue-alert-card tone-critical">
              <p>긴급 대기</p>
              <strong>{queueAlertOverview.totalCritical}건</strong>
            </article>
            <article className="queue-alert-card tone-watch">
              <p>주의 대기</p>
              <strong>{queueAlertOverview.totalWatch}건</strong>
            </article>
            <article className="queue-alert-card tone-hot">
              <p>최우선 큐</p>
              <strong>{queueAlertOverview.hottestQueue?.label ?? "-"}</strong>
            </article>
          </div>

          <div className="input-grid" style={{ marginTop: 12 }}>
            <label>
              기간 시작
              <input
                type="datetime-local"
                value={periodStart}
                onChange={(event) => setPeriodStart(event.target.value)}
              />
            </label>
            <label>
              기간 종료
              <input
                type="datetime-local"
                value={periodEnd}
                onChange={(event) => setPeriodEnd(event.target.value)}
              />
            </label>
            <label>
              검색 범위
              <select
                value={approvalQueueSearchScope}
                onChange={(event) => setApprovalQueueSearchScope(event.target.value as QueueSearchScope)}
              >
                <option value="all">전체 필드</option>
                <option value="employee">직원 ID</option>
                <option value="request_id">요청 ID</option>
                <option value="content">메모/사유</option>
              </select>
            </label>
            <label className="full">
              큐 검색
              <input
                value={approvalQueueSearch}
                onChange={(event) => setApprovalQueueSearch(event.target.value)}
                placeholder="직원ID, 요청ID, 상태, 메모/사유 검색"
              />
            </label>
            <div className="queue-toggle-row full" role="group" aria-label="승인 큐 빠른 필터">
              <button
                type="button"
                className={`queue-toggle-chip${approvalQueueOnlyUrgent ? " active" : ""}`}
                onClick={() => setApprovalQueueOnlyUrgent((prev) => !prev)}
              >
                긴급만 보기
              </button>
              <button
                type="button"
                className={`queue-toggle-chip${approvalQueueSelectedOnly ? " active" : ""}`}
                onClick={() => setApprovalQueueSelectedOnly((prev) => !prev)}
              >
                선택 항목만
              </button>
              <button
                type="button"
                className="queue-toggle-chip"
                onClick={() => {
                  setApprovalQueueOnlyUrgent(false);
                  setApprovalQueueSelectedOnly(false);
                  setApprovalQueueSearch("");
                }}
              >
                필터 초기화
              </button>
            </div>
            <label className="full">
              출퇴근 반려 사유 (선택)
              <input
                value={attendanceRejectReason}
                onChange={(event) => setAttendanceRejectReason(event.target.value)}
                placeholder="사유 없이 반려할 수 없게 하고 싶으면 정책에서 필수로 변경하세요."
              />
            </label>
            <label className="full">
              휴가 반려 사유 (필수)
              <input
                value={leaveRejectReason}
                onChange={(event) => setLeaveRejectReason(event.target.value)}
                placeholder="예: 근무 일정 충돌"
              />
            </label>
          </div>

          <p className="small" style={{ marginTop: 10 }}>
            {activeQueueBadgeSummary.label} 큐: 대기 {activeQueueBadgeSummary.pending}건 / 검색 결과{" "}
            {activeQueueBadgeSummary.visible}건
            {activeQueueBadgeSummary.selected > 0 ? ` / 선택 ${activeQueueBadgeSummary.selected}건` : ""}
            {" / "}
            {activeQueueBadgeSummary.alertLevel === "critical"
              ? `긴급 ${activeQueueBadgeSummary.critical}건`
              : activeQueueBadgeSummary.alertLevel === "watch"
                ? `주의 ${activeQueueBadgeSummary.watch}건`
                : "정상"}
            {approvalQueueSelectedOnly && activeQueueBadgeSummary.focus !== "payroll"
              ? " / 선택 필터 ON"
              : ""}
          </p>
          {approvalQueueSelectedOnly && (approvalQueueFocus === "all" || approvalQueueFocus === "payroll") ? (
            <p className="small muted" style={{ marginTop: 6 }}>
              급여 큐는 선택 필터가 없어 검색 조건만 적용됩니다.
            </p>
          ) : null}

          <section className="queue-search-sort-panel" id="approval-search-sort">
            <div className="queue-section-head">
              <h3>Approval Queue Search/Sort</h3>
              <p className="small muted">
                Use one panel to search pending items across queues and re-order triage quickly.
              </p>
            </div>
            <div className="queue-search-sort-controls" aria-label="approval queue search and sort controls">
              <label>
                Search scope
                <select
                  value={queueSearchSortScope}
                  onChange={(event) => setQueueSearchSortScope(event.target.value as QueueSearchSortScope)}
                >
                  <option value="all">all fields</option>
                  <option value="queue">queue</option>
                  <option value="employee">employee</option>
                  <option value="request_id">request id</option>
                  <option value="detail">detail</option>
                </select>
              </label>
              <label>
                Sort
                <select
                  value={queueSearchSortOption}
                  onChange={(event) => setQueueSearchSortOption(event.target.value as QueueSearchSortOption)}
                >
                  <option value="priority_desc">priority desc</option>
                  <option value="wait_desc">wait time desc</option>
                  <option value="recent_desc">recent first</option>
                  <option value="employee_asc">employee asc</option>
                  <option value="queue_asc">queue asc</option>
                </select>
              </label>
              <label className="full">
                Search query
                <input
                  value={queueSearchSortQuery}
                  onChange={(event) => setQueueSearchSortQuery(event.target.value)}
                  placeholder="employee id, request id, state, memo"
                />
              </label>
              <div className="queue-search-sort-actions">
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => {
                    setQueueSearchSortScope("detail");
                    setQueueSearchSortQuery("PENDING");
                    setQueueSearchSortOption("priority_desc");
                  }}
                >
                  pending first
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => {
                    setQueueSearchSortScope("all");
                    setQueueSearchSortOption("wait_desc");
                    setApprovalQueueOnlyUrgent(true);
                  }}
                >
                  urgent first
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => {
                    setQueueSearchSortScope("all");
                    setQueueSearchSortQuery("");
                    setQueueSearchSortOption("priority_desc");
                  }}
                >
                  reset
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => jumpToSection("approval-history-sort-hardening")}
                >
                  sort hardening
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => jumpToSection("approval-delay-risk-response")}
                >
                  delay response
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => jumpToSection("approval-mobile-follow-up-recommendation-upgrade")}
                >
                  recommendation upgrade
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => jumpToSection("approval-history-sort-hardening-plus")}
                >
                  sort hardening+
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => jumpToSection("approval-delay-risk-response-execution-guide")}
                >
                  response execution guide
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => jumpToSection("approval-mobile-follow-up-recommendation-upgrade-2")}
                >
                  recommendation upgrade 2
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => jumpToSection("approval-history-sort-hardening-plus-execution")}
                >
                  sort hardening+ execution
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => jumpToSection("approval-delay-risk-response-execution-tracker")}
                >
                  response execution tracker
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => jumpToSection("approval-mobile-follow-up-recommendation-upgrade-3")}
                >
                  recommendation upgrade 3
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => jumpToSection("approval-history-sort-execution-tracker")}
                >
                  execution tracker
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => jumpToSection("approval-delay-risk-execution-backlog")}
                >
                  execution backlog
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => jumpToSection("approval-mobile-follow-up-recommendation-upgrade-4")}
                >
                  recommendation upgrade 4
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => jumpToSection("approval-history-execution-summary")}
                >
                  execution summary
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => jumpToSection("approval-delay-execution-backlog-digest")}
                >
                  backlog digest
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => jumpToSection("approval-mobile-follow-up-recommendation-upgrade-5")}
                >
                  recommendation upgrade 5
                </button>
              </div>
            </div>
            {filteredQueueSearchSortRows.length === 0 ? (
              <p className="small muted">No rows match current search/sort options.</p>
            ) : (
              <ul className="queue-search-sort-list" aria-label="approval queue search and sort list">
                {filteredQueueSearchSortRows.map((row) => (
                  <li key={row.key} className={`severity-${row.severity}${row.selected ? " is-selected" : ""}`}>
                    <div className="queue-search-sort-head">
                      <strong>
                        [{row.queueLabel}] {row.itemId}
                      </strong>
                      <span className={`queue-sla-chip level-${row.severity}`}>wait {Math.round(row.waitHours)}h</span>
                    </div>
                    <p className="small muted">{row.detail}</p>
                    <div className="queue-search-sort-meta">
                      <span className="queue-history-chip">{row.employeeId}</span>
                      <span className="queue-history-chip">severity {row.severity}</span>
                      {row.selected ? <span className="queue-history-chip">selected</span> : null}
                    </div>
                    <div className="queue-search-sort-item-actions">
                      <button
                        type="button"
                        className="btn btn-secondary btn-small"
                        onClick={() => setApprovalQueueFocus(row.queue)}
                      >
                        focus queue
                      </button>
                      <Link className="btn btn-secondary btn-small" href="/admin#approvals">
                        open queue
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="queue-history-sort-accuracy-panel" id="approval-history-sort-accuracy">
            <div className="queue-section-head">
              <h3>Approval History Sort Accuracy</h3>
              <p className="small muted">
                Compares top queue history rows with baseline sort models to check whether current ordering is accurate.
              </p>
            </div>
            <ul className="queue-history-sort-accuracy-list" aria-label="approval history sort accuracy feedback list">
              {queueHistorySortAccuracyCards.map((card) => (
                <li key={card.key} className={`severity-${card.severity}`}>
                  <div className="queue-history-sort-accuracy-head">
                    <strong>{card.label}</strong>
                    <span className={`queue-sla-chip level-${card.severity}`}>score {card.accuracyScore}</span>
                  </div>
                  <p className="small muted">{card.detail}</p>
                  <div className="queue-history-sort-accuracy-meta">
                    <span className="queue-history-chip">
                      match {card.matchedCount}/{card.totalCompared}
                    </span>
                    <span className="queue-history-chip">severity {card.severity}</span>
                  </div>
                  <div className="queue-history-sort-accuracy-actions">
                    <Link className="btn btn-secondary btn-small" href={`/admin#${card.targetSectionId}`}>
                      open search/sort
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="queue-history-sort-hardening-panel" id="approval-history-sort-hardening">
            <div className="queue-section-head">
              <h3>Approval History Sort Hardening</h3>
              <p className="small muted">
                Converts sort-accuracy findings into one-tap hardening presets for queue search/sort.
              </p>
            </div>
            <ul className="queue-history-sort-hardening-list" aria-label="approval history sort hardening feedback list">
              {queueHistorySortHardeningCards.map((card) => (
                <li key={card.key} className={`severity-${card.severity}`}>
                  <div className="queue-history-sort-hardening-head">
                    <strong>{card.label}</strong>
                    <span className={`queue-sla-chip level-${card.severity}`}>gap {card.confidenceGap}</span>
                  </div>
                  <p className="small muted">{card.detail}</p>
                  <p className="small muted">{card.responseLabel}</p>
                  <div className="queue-history-sort-hardening-meta">
                    <span className="queue-history-chip">score {card.accuracyScore}</span>
                    <span className="queue-history-chip">
                      {queueSearchSortOptionLabel(card.recommendedSortOption)}
                    </span>
                  </div>
                  <div className="queue-history-sort-hardening-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => runQueueHistorySortHardeningAction(card)}
                    >
                      apply hardening
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="queue-history-sort-hardening-plus-panel" id="approval-history-sort-hardening-plus">
            <div className="queue-section-head">
              <h3>Approval History Sort Hardening Plus</h3>
              <p className="small muted">
                Adds stabilization scoring and execution guidance on top of hardening presets.
              </p>
            </div>
            <ul
              className="queue-history-sort-hardening-plus-list"
              aria-label="approval history sort hardening plus feedback list"
            >
              {queueHistorySortHardeningPlusCards.map((card) => (
                <li key={card.key} className={`severity-${card.severity}`}>
                  <div className="queue-history-sort-hardening-plus-head">
                    <strong>{card.label}</strong>
                    <span className={`queue-sla-chip level-${card.severity}`}>stability {card.stabilizationScore}</span>
                  </div>
                  <p className="small muted">{card.detail}</p>
                  <p className="small muted">{card.responseLabel}</p>
                  <p className="small muted">{card.executionLabel}</p>
                  <div className="queue-history-sort-hardening-plus-meta">
                    <span className="queue-history-chip">gap {card.confidenceGap}</span>
                    <span className="queue-history-chip">
                      {queueSearchSortOptionLabel(card.recommendedSortOption)}
                    </span>
                  </div>
                  <div className="queue-history-sort-hardening-plus-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => runQueueHistorySortHardeningPlusAction(card)}
                    >
                      run hardening+
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section
            className="queue-history-sort-hardening-plus-execution-panel"
            id="approval-history-sort-hardening-plus-execution"
          >
            <div className="queue-section-head">
              <h3>Approval History Sort Hardening Plus Execution</h3>
              <p className="small muted">
                Converts hardening+ readiness into direct execution cards with one-tap presets.
              </p>
            </div>
            <ul
              className="queue-history-sort-hardening-plus-execution-list"
              aria-label="approval history sort hardening plus execution list"
            >
              {queueHistorySortHardeningPlusExecutionCards.map((card) => (
                <li key={card.key} className={`severity-${card.severity}`}>
                  <div className="queue-history-sort-hardening-plus-execution-head">
                    <strong>{card.label}</strong>
                    <span className={`queue-sla-chip level-${card.severity}`}>ready {card.readinessScore}</span>
                  </div>
                  <p className="small muted">{card.detail}</p>
                  <p className="small muted">{card.executionChecklist}</p>
                  <div className="queue-history-sort-hardening-plus-execution-meta">
                    <span className="queue-history-chip">stability {card.stabilizationScore}</span>
                    <span className="queue-history-chip">{card.executionLabel}</span>
                  </div>
                  <div className="queue-history-sort-hardening-plus-execution-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => runQueueHistorySortHardeningPlusExecutionAction(card)}
                    >
                      run hardening+ execution
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="queue-history-sort-execution-tracker-panel" id="approval-history-sort-execution-tracker">
            <div className="queue-section-head">
              <h3>Approval History Sort Execution Tracker</h3>
              <p className="small muted">
                Tracks hardening+ execution cards by tracker score so admins can process highest-impact items first.
              </p>
            </div>
            <ul
              className="queue-history-sort-execution-tracker-list"
              aria-label="approval history sort execution tracker list"
            >
              {queueHistorySortExecutionTrackerCards.map((card) => (
                <li key={card.key} className={`severity-${card.severity}`}>
                  <div className="queue-history-sort-execution-tracker-head">
                    <strong>{card.label}</strong>
                    <span className={`queue-sla-chip level-${card.severity}`}>tracker {card.trackerScore}</span>
                  </div>
                  <p className="small muted">{card.detail}</p>
                  <p className="small muted">{card.executionChecklist}</p>
                  <div className="queue-history-sort-execution-tracker-meta">
                    <span className="queue-history-chip">{card.executionLabel}</span>
                    <span className="queue-history-chip">severity {card.severity}</span>
                  </div>
                  <div className="queue-history-sort-execution-tracker-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => runQueueHistorySortExecutionTrackerAction(card)}
                    >
                      run execution tracker
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="queue-history-execution-summary-panel" id="approval-history-execution-summary">
            <div className="queue-section-head">
              <h3>Approval History Execution Summary</h3>
              <p className="small muted">
                Summarizes execution-tracker cards into a score-ordered layer for one-tap high-impact follow-up.
              </p>
            </div>
            <ul className="queue-history-execution-summary-list" aria-label="approval history execution summary list">
              {queueHistoryExecutionSummaryCards.map((card) => (
                <li key={card.key} className={`severity-${card.severity}`}>
                  <div className="queue-history-execution-summary-head">
                    <strong>{card.label}</strong>
                    <span className={`queue-sla-chip level-${card.severity}`}>summary {card.summaryScore}</span>
                  </div>
                  <p className="small muted">{card.detail}</p>
                  <p className="small muted">{card.executionChecklist}</p>
                  <div className="queue-history-execution-summary-meta">
                    <span className="queue-history-chip">{card.executionLabel}</span>
                    <span className="queue-history-chip">severity {card.severity}</span>
                  </div>
                  <div className="queue-history-execution-summary-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => runQueueHistoryExecutionSummaryAction(card)}
                    >
                      run execution summary
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="queue-evidence-preview-panel" id="approval-evidence-preview">
            <div className="queue-section-head">
              <h3>승인 근거 프리뷰</h3>
              <p className="small muted">
                선택 항목과 긴급 항목을 우선으로, 메모/사유/이력을 승인 전에 미리 확인합니다.
              </p>
            </div>
            {queueEvidencePreviewCards.length === 0 ? (
              <p className="small muted">현재 필터 조건에서 확인할 승인 근거가 없습니다.</p>
            ) : (
              <ul className="queue-evidence-preview-list" aria-label="approval evidence preview cards">
                {queueEvidencePreviewCards.map((card) => (
                  <li
                    key={card.key}
                    className={`level-${card.alertLevel}${card.selected ? " is-selected" : ""}`}
                  >
                    <div className="queue-evidence-preview-head">
                      <strong>
                        [{card.queue}] {card.itemId}
                      </strong>
                      <span className={`queue-sla-chip level-${card.alertLevel}`}>
                        대기 {Math.round(card.waitedHours)}h
                      </span>
                    </div>
                    <p>{card.primary}</p>
                    <p className="small muted">{card.secondary}</p>
                    <div className="queue-evidence-preview-meta">
                      <span className="queue-history-chip">{card.employeeId}</span>
                      <span className="queue-history-chip">{card.historySummary}</span>
                      {card.selected ? <span className="queue-history-chip">selected</span> : null}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="queue-evidence-comparison-panel" id="approval-evidence-comparison">
            <div className="queue-section-head">
              <h3>승인 근거 비교 카드</h3>
              <p className="small muted">
                동일 큐 내 최상위 대기 항목을 비교해 우선 처리 기준(대기 시간/실패 이력)을 즉시 확인합니다.
              </p>
            </div>
            {queueEvidenceComparisonCards.length === 0 ? (
              <p className="small muted">비교 가능한 큐 항목이 2건 이상일 때 카드가 표시됩니다.</p>
            ) : (
              <ul className="queue-evidence-comparison-list" aria-label="approval evidence comparison cards">
                {queueEvidenceComparisonCards.map((card) => (
                  <li key={card.key} className={`severity-${card.severity}`}>
                    <div className="queue-evidence-comparison-head">
                      <strong>
                        [{card.queue}] {card.baselineItemId} vs {card.compareItemId}
                      </strong>
                      <span className={`queue-sla-chip level-${card.severity}`}>{card.severity}</span>
                    </div>
                    <p className="small">
                      wait gap {Math.round(card.waitGapHours)}h / fail gap {card.failGapCount}
                    </p>
                    <div className="queue-evidence-comparison-metrics">
                      <span className="queue-history-chip">
                        baseline {Math.round(card.baselineWaitHours)}h / fail {card.baselineFailCount}
                      </span>
                      <span className="queue-history-chip">
                        compare {Math.round(card.compareWaitHours)}h / fail {card.compareFailCount}
                      </span>
                    </div>
                    <p className="small muted">{card.recommendation}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="queue-sla-timeline-panel" id="approval-sla-timeline">
            <div className="queue-section-head">
              <h3>대기 SLA 타임라인</h3>
              <p className="small muted">
                24h 이내 / 24~48h / 48h 초과 구간으로 대기 분포를 확인해 우선순위를 정합니다.
              </p>
            </div>
            <div className="queue-sla-rule-controls" aria-label="approval sla alert rule controls">
              <label>
                Watch 임계치 (h)
                <input
                  type="number"
                  min={1}
                  value={queueSlaWatchHoursInput}
                  onChange={(event) => setQueueSlaWatchHoursInput(event.target.value)}
                />
              </label>
              <label>
                Critical 임계치 (h)
                <input
                  type="number"
                  min={2}
                  value={queueSlaCriticalHoursInput}
                  onChange={(event) => setQueueSlaCriticalHoursInput(event.target.value)}
                />
              </label>
              <div className="queue-sla-rule-preset-row">
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => {
                    setQueueSlaWatchHoursInput("12");
                    setQueueSlaCriticalHoursInput("24");
                  }}
                >
                  12 / 24
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => {
                    setQueueSlaWatchHoursInput("24");
                    setQueueSlaCriticalHoursInput("48");
                  }}
                >
                  24 / 48
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => {
                    setQueueSlaWatchHoursInput("36");
                    setQueueSlaCriticalHoursInput("72");
                  }}
                >
                  36 / 72
                </button>
              </div>
            </div>
            <section className="queue-sla-rule-alert-panel" id="approval-sla-alert-rules">
              <ul className="queue-sla-rule-alert-list" aria-label="approval sla rule alerts">
                {queueSlaRuleAlerts.map((alert) => (
                  <li key={alert.key} className={`severity-${alert.severity}`}>
                    <div>
                      <strong>{alert.label}</strong>
                      <p className="small muted">{alert.detail}</p>
                    </div>
                    <div className="queue-sla-rule-alert-actions">
                      <span className={`queue-sla-chip level-${alert.severity}`}>count {alert.count}</span>
                      <Link className="btn btn-secondary btn-small" href={`/admin#${alert.targetSectionId}`}>
                        이동
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
            <p className="small muted" style={{ marginTop: 0 }}>
              현재 포커스: {activeQueueSlaTimelinePoint.label} / total {activeQueueSlaTimelinePoint.total} / oldest{" "}
              {Math.round(activeQueueSlaTimelinePoint.oldestHours)}h
            </p>
            <ul className="queue-sla-timeline-list" aria-label="approval queue sla timeline">
              {queueSlaTimelinePoints.map((point) => {
                const safeTotal = Math.max(1, point.total);
                const belowWatchPercent = (point.belowWatch / safeTotal) * 100;
                const watchPercent = (point.betweenWatchAndCritical / safeTotal) * 100;
                const criticalPercent = (point.overCritical / safeTotal) * 100;

                return (
                  <li key={point.key}>
                    <div className="queue-sla-timeline-head">
                      <strong>{point.label}</strong>
                      <span className="muted">
                        total {point.total} / oldest {Math.round(point.oldestHours)}h
                      </span>
                    </div>
                    <div className="queue-sla-timeline-bar" role="img" aria-label={`${point.label} sla timeline`}>
                      <span className="segment segment-normal" style={{ width: `${belowWatchPercent}%` }} />
                      <span className="segment segment-watch" style={{ width: `${watchPercent}%` }} />
                      <span className="segment segment-critical" style={{ width: `${criticalPercent}%` }} />
                    </div>
                    <div className="queue-sla-timeline-chips">
                      <span className="queue-history-chip">{queueSlaWatchHours}h 미만 {point.belowWatch}</span>
                      <span className="queue-history-chip">
                        {queueSlaWatchHours}~{queueSlaCriticalHours}h {point.betweenWatchAndCritical}
                      </span>
                      <span className="queue-history-chip">{queueSlaCriticalHours}h 이상 {point.overCritical}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="queue-processing-prediction-panel" id="approval-processing-prediction">
            <div className="queue-section-head">
              <h3>Approval Processing Prediction</h3>
              <p className="small muted">
                Predicted queue clear time is calculated from pending volume, oldest wait, and recent success rate.
              </p>
            </div>
            <ul className="queue-processing-prediction-list" aria-label="approval processing prediction feedback list">
              {queueProcessingPredictionCards.map((card) => (
                <li key={card.key} className={`severity-${card.severity}`}>
                  <div className="queue-processing-prediction-head">
                    <strong>{card.label}</strong>
                    <span className={`queue-sla-chip level-${card.severity}`}>{card.severity}</span>
                  </div>
                  <p className="small muted">{card.detail}</p>
                  <div className="queue-processing-prediction-meta">
                    <span className="queue-history-chip">pending {card.pendingCount}</span>
                    <span className="queue-history-chip">clear ~{Math.round(card.predictedClearHours)}h</span>
                    <span className="queue-history-chip">ETA {card.predictedEta}</span>
                    <span className="queue-history-chip">
                      success {Math.round(card.recentSuccessRate * 100)}%
                    </span>
                  </div>
                  <div className="queue-processing-prediction-actions">
                    <Link className="btn btn-secondary btn-small" href={`/admin#${card.targetSectionId}`}>
                      open section
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="queue-delay-risk-prediction-panel" id="approval-delay-risk-prediction">
            <div className="queue-section-head">
              <h3>Approval Delay Risk Prediction</h3>
              <p className="small muted">
                Scores delay risk by queue using wait thresholds and backlog concentration for immediate prioritization.
              </p>
            </div>
            <ul className="queue-delay-risk-prediction-list" aria-label="approval delay risk prediction feedback list">
              {queueDelayRiskPredictionCards.map((card) => (
                <li key={card.key} className={`severity-${card.severity}`}>
                  <div className="queue-delay-risk-prediction-head">
                    <strong>{card.label}</strong>
                    <span className={`queue-sla-chip level-${card.severity}`}>risk {card.riskScore}</span>
                  </div>
                  <p className="small muted">{card.detail}</p>
                  <div className="queue-delay-risk-prediction-meta">
                    <span className="queue-history-chip">pending {card.pendingCount}</span>
                    <span className="queue-history-chip">watch {card.watchCount}</span>
                    <span className="queue-history-chip">critical {card.criticalCount}</span>
                    <span className="queue-history-chip">ETA {card.etaLabel}</span>
                  </div>
                  <div className="queue-delay-risk-prediction-actions">
                    <Link className="btn btn-secondary btn-small" href={`/admin#${card.targetSectionId}`}>
                      open section
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="queue-delay-risk-response-panel" id="approval-delay-risk-response">
            <div className="queue-section-head">
              <h3>Approval Delay Risk Response</h3>
              <p className="small muted">
                Converts delay-risk prediction into response windows and one-tap mitigation presets.
              </p>
            </div>
            <ul className="queue-delay-risk-response-list" aria-label="approval delay risk response feedback list">
              {queueDelayRiskResponseCards.map((card) => (
                <li key={card.key} className={`severity-${card.severity}`}>
                  <div className="queue-delay-risk-response-head">
                    <strong>{card.label}</strong>
                    <span className={`queue-sla-chip level-${card.severity}`}>risk {card.riskScore}</span>
                  </div>
                  <p className="small muted">{card.detail}</p>
                  <p className="small muted">{card.responseLabel}</p>
                  <div className="queue-delay-risk-response-meta">
                    <span className="queue-history-chip">pending {card.pendingCount}</span>
                    <span className="queue-history-chip">window {card.responseWindow}</span>
                    <span className="queue-history-chip">critical {card.criticalCount}</span>
                  </div>
                  <div className="queue-delay-risk-response-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => runQueueDelayRiskResponseAction(card)}
                    >
                      run response
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section
            className="queue-delay-risk-response-execution-guide-panel"
            id="approval-delay-risk-response-execution-guide"
          >
            <div className="queue-section-head">
              <h3>Approval Delay Response Execution Guide</h3>
              <p className="small muted">
                Converts delay-response signals into execution checkpoints for one-run mitigation.
              </p>
            </div>
            <ul
              className="queue-delay-risk-response-execution-guide-list"
              aria-label="approval delay risk response execution guide list"
            >
              {queueDelayRiskResponseExecutionGuideCards.map((card) => (
                <li key={card.key} className={`severity-${card.severity}`}>
                  <div className="queue-delay-risk-response-execution-guide-head">
                    <strong>{card.label}</strong>
                    <span className={`queue-sla-chip level-${card.severity}`}>risk {card.riskScore}</span>
                  </div>
                  <p className="small muted">{card.detail}</p>
                  <p className="small muted">{card.executionChecklist}</p>
                  <div className="queue-delay-risk-response-execution-guide-meta">
                    <span className="queue-history-chip">window {card.responseWindow}</span>
                    <span className="queue-history-chip">pending {card.pendingCount}</span>
                    <span className="queue-history-chip">{card.executionLabel}</span>
                  </div>
                  <div className="queue-delay-risk-response-execution-guide-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => runQueueDelayRiskResponseExecutionGuideAction(card)}
                    >
                      run execution guide
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section
            className="queue-delay-risk-response-execution-tracker-panel"
            id="approval-delay-risk-response-execution-tracker"
          >
            <div className="queue-section-head">
              <h3>Approval Delay Response Execution Tracker</h3>
              <p className="small muted">
                Tracks delay-response execution status with queue-specific checklist and response window signals.
              </p>
            </div>
            <ul
              className="queue-delay-risk-response-execution-tracker-list"
              aria-label="approval delay risk response execution tracker list"
            >
              {queueDelayRiskResponseExecutionTrackerCards.map((card) => (
                <li key={card.key} className={`severity-${card.severity}`}>
                  <div className="queue-delay-risk-response-execution-tracker-head">
                    <strong>{card.label}</strong>
                    <span className={`queue-sla-chip level-${card.severity}`}>tracker {card.trackerScore}</span>
                  </div>
                  <p className="small muted">{card.detail}</p>
                  <p className="small muted">{card.executionChecklist}</p>
                  <div className="queue-delay-risk-response-execution-tracker-meta">
                    <span className="queue-history-chip">window {card.responseWindow}</span>
                    <span className="queue-history-chip">pending {card.pendingCount}</span>
                    <span className="queue-history-chip">{card.trackerLabel}</span>
                  </div>
                  <div className="queue-delay-risk-response-execution-tracker-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => runQueueDelayRiskResponseExecutionTrackerAction(card)}
                    >
                      run execution tracker
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="queue-delay-risk-execution-backlog-panel" id="approval-delay-risk-execution-backlog">
            <div className="queue-section-head">
              <h3>Approval Delay Risk Execution Backlog</h3>
              <p className="small muted">
                Prioritizes execution-tracker backlog by pending volume and response-window urgency.
              </p>
            </div>
            <ul
              className="queue-delay-risk-execution-backlog-list"
              aria-label="approval delay risk execution backlog list"
            >
              {queueDelayRiskExecutionBacklogCards.map((card) => (
                <li key={card.key} className={`severity-${card.severity}`}>
                  <div className="queue-delay-risk-execution-backlog-head">
                    <strong>{card.label}</strong>
                    <span className={`queue-sla-chip level-${card.severity}`}>backlog {card.backlogScore}</span>
                  </div>
                  <p className="small muted">{card.detail}</p>
                  <p className="small muted">{card.executionChecklist}</p>
                  <div className="queue-delay-risk-execution-backlog-meta">
                    <span className="queue-history-chip">{card.responseWindow}</span>
                    <span className="queue-history-chip">severity {card.severity}</span>
                  </div>
                  <div className="queue-delay-risk-execution-backlog-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => runQueueDelayRiskExecutionBacklogAction(card)}
                    >
                      run backlog response
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="queue-delay-execution-backlog-digest-panel" id="approval-delay-execution-backlog-digest">
            <div className="queue-section-head">
              <h3>Approval Delay Execution Backlog Digest</h3>
              <p className="small muted">
                Condenses delay execution backlog into digest scores so urgent response work is triaged first.
              </p>
            </div>
            <ul
              className="queue-delay-execution-backlog-digest-list"
              aria-label="approval delay execution backlog digest list"
            >
              {queueDelayExecutionBacklogDigestCards.map((card) => (
                <li key={card.key} className={`severity-${card.severity}`}>
                  <div className="queue-delay-execution-backlog-digest-head">
                    <strong>{card.label}</strong>
                    <span className={`queue-sla-chip level-${card.severity}`}>digest {card.digestScore}</span>
                  </div>
                  <p className="small muted">{card.detail}</p>
                  <p className="small muted">{card.executionChecklist}</p>
                  <div className="queue-delay-execution-backlog-digest-meta">
                    <span className="queue-history-chip">{card.responseWindow}</span>
                    <span className="queue-history-chip">severity {card.severity}</span>
                  </div>
                  <div className="queue-delay-execution-backlog-digest-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => runQueueDelayExecutionBacklogDigestAction(card)}
                    >
                      run backlog digest
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="queue-mobile-review-sheet" id="approval-mobile-review-sheet">
            <div className="queue-section-head">
              <h3>모바일 일괄 검토 시트</h3>
              <p className="small muted">
                선택 건수와 실행 가능 조건을 모바일 기준으로 확인하고 즉시 일괄 처리합니다.
              </p>
            </div>
            <div className="queue-mobile-review-grid" aria-label="mobile bulk review sheet">
              {mobileBulkReviewSteps.map((step) => (
                <article
                  key={step.id}
                  className={`queue-mobile-review-card ${step.approveReady || step.rejectReady ? "is-ready" : "is-blocked"}`}
                >
                  <p>
                    <strong>{step.label}</strong> · 대상 {step.targetCount}건
                  </p>
                  <p className="small muted">{step.detail}</p>
                  <div className="queue-mobile-review-actions">
                    {step.id === "attendance" ? (
                      <>
                        <button
                          type="button"
                          className="btn btn-primary btn-small"
                          onClick={() => void approveSelectedAttendance()}
                          disabled={!canApproveSelectedAttendance}
                        >
                          출퇴근 승인
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-small"
                          onClick={() => void rejectSelectedAttendance()}
                          disabled={!canRejectSelectedAttendance}
                        >
                          출퇴근 반려
                        </button>
                      </>
                    ) : null}
                    {step.id === "leave" ? (
                      <>
                        <button
                          type="button"
                          className="btn btn-primary btn-small"
                          onClick={() => void approveSelectedLeave()}
                          disabled={!canApproveSelectedLeave}
                        >
                          휴가 승인
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-small"
                          onClick={() => void rejectSelectedLeave()}
                          disabled={!canRejectSelectedLeave}
                        >
                          휴가 반려
                        </button>
                      </>
                    ) : null}
                    {step.id === "payroll" ? (
                      <button
                        type="button"
                        className="btn btn-secondary btn-small"
                        onClick={() => setApprovalQueueFocus("payroll")}
                      >
                        급여 큐 보기
                      </button>
                    ) : null}
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="queue-mobile-checklist-panel" id="approval-mobile-checklist">
            <div className="queue-section-head">
              <h3>모바일 승인 체크리스트</h3>
              <p className="small muted">
                모바일 일괄 승인 전에 필수 조건을 점검하고 필요한 섹션으로 바로 이동합니다.
              </p>
            </div>
            <ul className="queue-mobile-checklist-list" aria-label="approval mobile checklist">
              {queueMobileApprovalChecklistItems.map((item) => (
                <li key={item.id} className={item.pass ? "is-pass" : "is-fail"}>
                  <div>
                    <strong>{item.label}</strong>
                    <p className="small muted">{item.detail}</p>
                  </div>
                  <Link className="btn btn-secondary btn-small" href={`/admin#${item.targetSectionId}`}>
                    이동
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="queue-mobile-follow-up-guide-panel" id="approval-mobile-follow-up-guide">
            <div className="queue-section-head">
              <h3>Mobile Follow-up Action Guide</h3>
              <p className="small muted">
                Shows the next mobile action after queue review so follow-up can be completed in one tap.
              </p>
            </div>
            <ul className="queue-mobile-follow-up-guide-list" aria-label="approval mobile follow-up action guide list">
              {queueMobileFollowUpGuideCards.map((card) => (
                <li key={card.key} className={`severity-${card.severity}`}>
                  <div className="queue-mobile-follow-up-guide-head">
                    <strong>{card.label}</strong>
                    <span className={`queue-sla-chip level-${card.severity}`}>{card.severity}</span>
                  </div>
                  <p className="small muted">{card.detail}</p>
                  <div className="queue-mobile-follow-up-guide-actions">
                    <Link className="btn btn-secondary btn-small" href={`/admin#${card.targetSectionId}`}>
                      {card.actionLabel}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="queue-mobile-follow-up-recommendation-panel" id="approval-mobile-follow-up-recommendation">
            <div className="queue-section-head">
              <h3>Mobile Follow-up Recommendation</h3>
              <p className="small muted">
                Prioritized recommendations combine sort accuracy, delay risk, and selection readiness into one mobile panel.
              </p>
            </div>
            <ul
              className="queue-mobile-follow-up-recommendation-list"
              aria-label="approval mobile follow-up recommendation list"
            >
              {queueMobileFollowUpRecommendationCards.map((card) => (
                <li key={card.key} className={`severity-${card.severity}`}>
                  <div className="queue-mobile-follow-up-recommendation-head">
                    <strong>{card.label}</strong>
                    <span className={`queue-sla-chip level-${card.severity}`}>{card.severity}</span>
                  </div>
                  <p className="small muted">{card.detail}</p>
                  <div className="queue-mobile-follow-up-recommendation-actions">
                    <Link className="btn btn-secondary btn-small" href={`/admin#${card.targetSectionId}`}>
                      {card.actionLabel}
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section
            className="queue-mobile-follow-up-recommendation-upgrade-panel"
            id="approval-mobile-follow-up-recommendation-upgrade"
          >
            <div className="queue-section-head">
              <h3>Mobile Follow-up Recommendation Upgrade</h3>
              <p className="small muted">
                Prioritizes hardening, delay-response, search execution, and selection integrity follow-up in one panel.
              </p>
            </div>
            <ul
              className="queue-mobile-follow-up-recommendation-upgrade-list"
              aria-label="approval mobile follow-up recommendation upgrade list"
            >
              {queueMobileFollowUpRecommendationUpgradeCards.map((card) => (
                <li key={card.key} className={`severity-${card.severity}`}>
                  <div className="queue-mobile-follow-up-recommendation-upgrade-head">
                    <strong>{card.label}</strong>
                    <span className={`queue-sla-chip level-${card.severity}`}>priority {card.priorityScore}</span>
                  </div>
                  <p className="small muted">{card.detail}</p>
                  <div className="queue-mobile-follow-up-recommendation-upgrade-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => runQueueMobileFollowUpRecommendationUpgradeAction(card)}
                    >
                      {card.actionLabel}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section
            className="queue-mobile-follow-up-recommendation-upgrade-2-panel"
            id="approval-mobile-follow-up-recommendation-upgrade-2"
          >
            <div className="queue-section-head">
              <h3>Mobile Follow-up Recommendation Upgrade 2</h3>
              <p className="small muted">
                Prioritizes hardening+, execution-guide, search execution, and selection integrity in one panel.
              </p>
            </div>
            <ul
              className="queue-mobile-follow-up-recommendation-upgrade-2-list"
              aria-label="approval mobile follow-up recommendation upgrade 2 list"
            >
              {queueMobileFollowUpRecommendationUpgrade2Cards.map((card) => (
                <li key={card.key} className={`severity-${card.severity}`}>
                  <div className="queue-mobile-follow-up-recommendation-upgrade-2-head">
                    <strong>{card.label}</strong>
                    <span className={`queue-sla-chip level-${card.severity}`}>priority {card.priorityScore}</span>
                  </div>
                  <p className="small muted">{card.detail}</p>
                  <div className="queue-mobile-follow-up-recommendation-upgrade-2-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => runQueueMobileFollowUpRecommendationUpgrade2Action(card)}
                    >
                      {card.actionLabel}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section
            className="queue-mobile-follow-up-recommendation-upgrade-3-panel"
            id="approval-mobile-follow-up-recommendation-upgrade-3"
          >
            <div className="queue-section-head">
              <h3>Mobile Follow-up Recommendation Upgrade 3</h3>
              <p className="small muted">
                Prioritizes hardening+ execution, delay-response execution tracking, and queue follow-up integrity.
              </p>
            </div>
            <ul
              className="queue-mobile-follow-up-recommendation-upgrade-3-list"
              aria-label="approval mobile follow-up recommendation upgrade 3 list"
            >
              {queueMobileFollowUpRecommendationUpgrade3Cards.map((card) => (
                <li key={card.key} className={`severity-${card.severity}`}>
                  <div className="queue-mobile-follow-up-recommendation-upgrade-3-head">
                    <strong>{card.label}</strong>
                    <span className={`queue-sla-chip level-${card.severity}`}>priority {card.priorityScore}</span>
                  </div>
                  <p className="small muted">{card.detail}</p>
                  <div className="queue-mobile-follow-up-recommendation-upgrade-3-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => runQueueMobileFollowUpRecommendationUpgrade3Action(card)}
                    >
                      {card.actionLabel}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section
            className="queue-mobile-follow-up-recommendation-upgrade-4-panel"
            id="approval-mobile-follow-up-recommendation-upgrade-4"
          >
            <div className="queue-section-head">
              <h3>Mobile Follow-up Recommendation Upgrade 4</h3>
              <p className="small muted">
                Prioritizes execution-tracker follow-up, delay-backlog response, and queue integrity checks.
              </p>
            </div>
            <ul
              className="queue-mobile-follow-up-recommendation-upgrade-4-list"
              aria-label="approval mobile follow-up recommendation upgrade 4 list"
            >
              {queueMobileFollowUpRecommendationUpgrade4Cards.map((card) => (
                <li key={card.key} className={`severity-${card.severity}`}>
                  <div className="queue-mobile-follow-up-recommendation-upgrade-4-head">
                    <strong>{card.label}</strong>
                    <span className={`queue-sla-chip level-${card.severity}`}>priority {card.priorityScore}</span>
                  </div>
                  <p className="small muted">{card.detail}</p>
                  <div className="queue-mobile-follow-up-recommendation-upgrade-4-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => runQueueMobileFollowUpRecommendationUpgrade4Action(card)}
                    >
                      {card.actionLabel}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section
            className="queue-mobile-follow-up-recommendation-upgrade-5-panel"
            id="approval-mobile-follow-up-recommendation-upgrade-5"
          >
            <div className="queue-section-head">
              <h3>Mobile Follow-up Recommendation Upgrade 5</h3>
              <p className="small muted">
                Prioritizes execution summary, backlog digest, and queue integrity checks in one mobile panel.
              </p>
            </div>
            <ul
              className="queue-mobile-follow-up-recommendation-upgrade-5-list"
              aria-label="approval mobile follow-up recommendation upgrade 5 list"
            >
              {queueMobileFollowUpRecommendationUpgrade5Cards.map((card) => (
                <li key={card.key} className={`severity-${card.severity}`}>
                  <div className="queue-mobile-follow-up-recommendation-upgrade-5-head">
                    <strong>{card.label}</strong>
                    <span className={`queue-sla-chip level-${card.severity}`}>priority {card.priorityScore}</span>
                  </div>
                  <p className="small muted">{card.detail}</p>
                  <div className="queue-mobile-follow-up-recommendation-upgrade-5-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      onClick={() => runQueueMobileFollowUpRecommendationUpgrade5Action(card)}
                    >
                      {card.actionLabel}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="queue-bulk-validation-panel" id="approval-bulk-validation">
            <div className="queue-section-head">
              <h3>일괄 처리 직전 검증</h3>
              <p className="small muted">선택/필터/반려 사유를 먼저 확인한 뒤 일괄 처리를 실행하세요.</p>
            </div>
            <div className="queue-bulk-validation-grid">
              <article className="queue-precheck-card">
                <p className="small" style={{ margin: 0 }}>
                  출퇴근 일괄 처리
                </p>
                <ul className="queue-precheck-list" aria-label="attendance bulk pre-action checks">
                  {attendanceBulkValidationChecks.map((check) => (
                    <li key={check.id} className={check.ok ? "is-pass" : "is-fail"}>
                      <span className="queue-precheck-label">{check.label}</span>
                      <span className="queue-precheck-detail">{check.detail}</span>
                    </li>
                  ))}
                </ul>
                <p className={`queue-precheck-status ${canApproveSelectedAttendance ? "is-pass" : "is-fail"}`}>
                  {canApproveSelectedAttendance
                    ? "승인/반려 일괄 실행 준비 완료"
                    : "선택 상태를 먼저 정리해야 일괄 실행할 수 있습니다."}
                </p>
              </article>
              <article className="queue-precheck-card">
                <p className="small" style={{ margin: 0 }}>
                  휴가 일괄 처리
                </p>
                <ul className="queue-precheck-list" aria-label="leave bulk pre-action checks">
                  {leaveBulkValidationChecks.map((check) => (
                    <li key={check.id} className={check.ok ? "is-pass" : "is-fail"}>
                      <span className="queue-precheck-label">{check.label}</span>
                      <span className="queue-precheck-detail">{check.detail}</span>
                    </li>
                  ))}
                </ul>
                <p className={`queue-precheck-status ${canRejectSelectedLeave ? "is-pass" : "is-fail"}`}>
                  {canRejectSelectedLeave
                    ? "승인/반려 일괄 실행 준비 완료"
                    : "휴가 반려는 사유 입력 후 실행할 수 있습니다."}
                </p>
              </article>
            </div>
          </section>

          <section className="queue-item-history-panel" id="approval-item-history">
            <div className="queue-section-head">
              <h3>항목별 처리 이력 요약</h3>
              <p className="small muted">최근 처리 항목을 기준으로 성공/실패와 액션 분포를 요약합니다.</p>
            </div>
            {approvalItemHistoryRows.length === 0 ? (
              <p className="small muted">아직 항목별 이력이 없습니다.</p>
            ) : (
              <ul className="queue-item-history-summary-list" aria-label="approval item history summary">
                {approvalItemHistoryRows.map((summary) => (
                  <li key={summary.key}>
                    <div className="queue-item-history-meta">
                      <strong>
                        [{summary.queue}] {summary.itemId}
                      </strong>
                      <span className="muted">
                        {summary.lastAction} · {summary.lastStatus} · {summary.lastAt}
                      </span>
                    </div>
                    <div className="queue-item-history-stats">
                      <span className="queue-history-chip">total {summary.total}</span>
                      <span className="queue-history-chip">ok {summary.success}</span>
                      <span className="queue-history-chip">fail {summary.fail}</span>
                      <span className="queue-history-chip">approve {summary.approved}</span>
                      <span className="queue-history-chip">reject {summary.rejected}</span>
                      <span className="queue-history-chip">confirm {summary.confirmed}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {showAttendanceQueue ? (
            <>
              <hr className="divider" />
              <p className="small">
                출퇴근 (PENDING {pendingAttendance.length}건 / 검색 {filteredPendingAttendance.length}건 / 선택{" "}
                {selectedVisibleAttendanceCount}건)
              </p>
              <div className="queue-toolbar">
                <label className="queue-control-inline">
                  정렬
                  <select
                    value={attendanceQueueSort}
                    onChange={(event) => setAttendanceQueueSort(event.target.value as AttendanceQueueSort)}
                  >
                    <option value="checkin_desc">출근 최신순</option>
                    <option value="stale_desc">정체 우선순</option>
                    <option value="checkin_asc">출근 오래된순</option>
                    <option value="employee_asc">직원ID순</option>
                  </select>
                </label>
                <button className="btn btn-secondary btn-small" onClick={selectAllAttendance} disabled={filteredPendingAttendance.length === 0}>
                  전체 선택
                </button>
                <button className="btn btn-secondary btn-small" onClick={clearAttendanceSelection} disabled={selectedAttendanceCount === 0}>
                  선택 해제
                </button>
                <button className="btn btn-primary btn-small" onClick={() => void approveSelectedAttendance()} disabled={!canApproveSelectedAttendance}>
                  선택 승인
                </button>
                <button className="btn btn-danger btn-small" onClick={() => void rejectSelectedAttendance()} disabled={!canRejectSelectedAttendance}>
                  선택 반려
                </button>
              </div>
              {filteredPendingAttendance.length === 0 ? (
                <p className="small muted">대기 중인 출퇴근이 없습니다.</p>
              ) : (
                <ul className="simple-list" aria-label="출퇴근 승인 대기">
                  {filteredPendingAttendance.map((record) => (
                    <li key={record.id}>
                      <label className="queue-item-main">
                        <input
                          type="checkbox"
                          checked={selectedAttendanceIds.includes(record.id)}
                          onChange={(event) => toggleAttendanceSelection(record.id, event.target.checked)}
                        />
                        <span>
                          <strong>{record.employeeId}</strong>{" "}
                          <span
                            className={`queue-sla-chip level-${resolveQueueAlertLevel(
                              attendanceWaitHoursById.get(record.id) ?? 0
                            )}`}
                          >
                            대기 {Math.round(attendanceWaitHoursById.get(record.id) ?? 0)}h
                          </span>{" "}
                          <span className="muted">
                            {formatDateTime(record.checkInAt)} ~ {formatDateTime(record.checkOutAt)} /{" "}
                            {record.breakMinutes}분 / {record.isHoliday ? "휴일" : "평일"}
                          </span>
                          <span className="queue-item-history-inline">
                            {formatQueueItemHistoryInline("attendance", record.id)}
                          </span>
                        </span>
                      </label>
                      <div className="queue-actions">
                        <button
                          type="button"
                          className="btn btn-primary btn-small"
                          onClick={() => void approveAttendance(record.id)}
                        >
                          승인
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-small"
                          onClick={() => void rejectAttendance(record.id)}
                        >
                          반려
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : null}

          {showLeaveQueue ? (
            <>
              <hr className="divider" />
              <p className="small">
                휴가 (PENDING {pendingLeave.length}건 / 검색 {filteredPendingLeave.length}건 / 선택{" "}
                {selectedVisibleLeaveCount}건)
              </p>
              <div className="queue-toolbar">
                <label className="queue-control-inline">
                  정렬
                  <select value={leaveQueueSort} onChange={(event) => setLeaveQueueSort(event.target.value as LeaveQueueSort)}>
                    <option value="start_desc">시작일 최신순</option>
                    <option value="stale_desc">정체 우선순</option>
                    <option value="start_asc">시작일 오래된순</option>
                    <option value="employee_asc">직원ID순</option>
                  </select>
                </label>
                <button className="btn btn-secondary btn-small" onClick={selectAllLeave} disabled={filteredPendingLeave.length === 0}>
                  전체 선택
                </button>
                <button className="btn btn-secondary btn-small" onClick={clearLeaveSelection} disabled={selectedLeaveCount === 0}>
                  선택 해제
                </button>
                <button className="btn btn-primary btn-small" onClick={() => void approveSelectedLeave()} disabled={!canApproveSelectedLeave}>
                  선택 승인
                </button>
                <button className="btn btn-danger btn-small" onClick={() => void rejectSelectedLeave()} disabled={!canRejectSelectedLeave}>
                  선택 반려
                </button>
              </div>
              {filteredPendingLeave.length === 0 ? (
                <p className="small muted">대기 중인 휴가 요청이 없습니다.</p>
              ) : (
                <ul className="simple-list" aria-label="휴가 승인 대기">
                  {filteredPendingLeave.map((request) => (
                    <li key={request.id}>
                      <label className="queue-item-main">
                        <input
                          type="checkbox"
                          checked={selectedLeaveIds.includes(request.id)}
                          onChange={(event) => toggleLeaveSelection(request.id, event.target.checked)}
                        />
                        <span>
                          <strong>{request.employeeId}</strong>{" "}
                          <span
                            className={`queue-sla-chip level-${resolveQueueAlertLevel(
                              leaveWaitHoursById.get(request.id) ?? 0
                            )}`}
                          >
                            대기 {Math.round(leaveWaitHoursById.get(request.id) ?? 0)}h
                          </span>{" "}
                          <span className="muted">
                            {request.leaveType} / {formatDateTime(request.startDate)} ~{" "}
                            {formatDateTime(request.endDate)} ({formatDays(request.days)}일
                            {request.unit === "HOUR" && request.hours !== null
                              ? ` / ${request.hours.toFixed(2)}시간`
                              : request.unit === "HALF_DAY"
                                ? " / 반차"
                                : ""}
                            )
                          </span>
                          <span className="queue-item-history-inline">
                            {formatQueueItemHistoryInline("leave", request.id)}
                          </span>
                        </span>
                      </label>
                      <div className="queue-actions">
                        <button
                          type="button"
                          className="btn btn-primary btn-small"
                          onClick={() => void approveLeave(request.id)}
                        >
                          승인
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-small"
                          onClick={() => void rejectLeave(request.id)}
                        >
                          반려
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : null}

          {showPayrollQueue ? (
            <>
              <hr className="divider" />
              <p className="small">급여 (PREVIEWED {previewedPayroll.length}건 / 검색 {filteredPreviewedPayroll.length}건)</p>
              <div className="queue-toolbar">
                <label className="queue-control-inline">
                  정렬
                  <select
                    value={payrollQueueSort}
                    onChange={(event) => setPayrollQueueSort(event.target.value as PayrollQueueSort)}
                  >
                    <option value="period_desc">기간 최신순</option>
                    <option value="stale_desc">정체 우선순</option>
                    <option value="gross_desc">총지급 높은순</option>
                    <option value="employee_asc">직원ID순</option>
                  </select>
                </label>
              </div>
              {filteredPreviewedPayroll.length === 0 ? (
                <p className="small muted">확정 대기 중인 급여 프리뷰가 없습니다.</p>
              ) : (
                <ul className="simple-list" aria-label="급여 프리뷰">
                  {filteredPreviewedPayroll.map((run) => (
                    <li key={run.id}>
                      <span>
                        <strong>{run.employeeId ?? "-"}</strong>{" "}
                        <span
                          className={`queue-sla-chip level-${resolveQueueAlertLevel(
                            payrollWaitHoursById.get(run.id) ?? 0
                          )}`}
                        >
                          대기 {Math.round(payrollWaitHoursById.get(run.id) ?? 0)}h
                        </span>{" "}
                        <span className="muted">
                          {formatDateTime(run.periodStart)} ~ {formatDateTime(run.periodEnd)} / 총지급{" "}
                          {formatKrw(run.grossPayKrw)}
                        </span>
                        <span className="queue-item-history-inline">
                          {formatQueueItemHistoryInline("payroll", run.id)}
                        </span>
                      </span>
                      <div className="queue-actions">
                        <button
                          type="button"
                          className="btn btn-danger btn-small"
                          onClick={() => void confirmPayroll(run.id)}
                        >
                          확정
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : null}

          {selectedQueueTotalCount > 0 ? (
            <div className="queue-mobile-sticky" role="group" aria-label="모바일 빠른 승인 액션">
              <p>
                모바일 빠른 승인 액션 · 선택 {selectedQueueTotalCount}건
              </p>
              <div className="queue-mobile-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-small"
                  onClick={() => void approveSelectedAttendance()}
                  disabled={!canApproveSelectedAttendance}
                >
                  출퇴근 선택 승인
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-small"
                  onClick={() => void rejectSelectedAttendance()}
                  disabled={!canRejectSelectedAttendance}
                >
                  출퇴근 선택 반려
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-small"
                  onClick={() => void approveSelectedLeave()}
                  disabled={!canApproveSelectedLeave}
                >
                  휴가 선택 승인
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-small"
                  onClick={() => void rejectSelectedLeave()}
                  disabled={!canRejectSelectedLeave}
                >
                  휴가 선택 반려
                </button>
                <button
                  type="button"
                  className="btn btn-secondary btn-small"
                  onClick={() => {
                    clearAttendanceSelection();
                    clearLeaveSelection();
                  }}
                >
                  선택 전체 해제
                </button>
              </div>
            </div>
          ) : null}

          <section className="queue-mobile-feedback-panel" id="approval-mobile-feedback" aria-live="polite">
            <div className="queue-section-head">
              <h3>모바일 승인 결과 피드백</h3>
              <p className="small muted">마지막 실행 결과와 최근 큐별 성공/실패를 모바일 기준으로 요약합니다.</p>
            </div>
            {mobileApprovalFeedback ? (
              <div className="queue-mobile-feedback-card">
                <p>
                  <strong>{mobileApprovalFeedback.action}</strong> · {mobileApprovalFeedback.at}
                </p>
                <div className="queue-mobile-feedback-chips">
                  <span className="queue-history-chip">queue {mobileApprovalFeedback.queue}</span>
                  <span className="queue-history-chip">total {mobileApprovalFeedback.total}</span>
                  <span className="queue-history-chip">ok {mobileApprovalFeedback.okCount}</span>
                  <span className="queue-history-chip">fail {mobileApprovalFeedback.failCount}</span>
                </div>
              </div>
            ) : (
              <p className="small muted">아직 모바일 승인 피드백이 없습니다.</p>
            )}
            <div className="queue-mobile-feedback-chips">
              {queueFeedbackByQueue.map((item) => (
                <span key={item.queue} className="queue-history-chip">
                  {item.queue} ok {item.ok} / fail {item.fail}
                </span>
              ))}
            </div>
          </section>

          <hr className="divider" />
          <div className="actions">
            <p className="small" style={{ margin: 0 }}>
              최근 처리 이력 ({approvalActivities.length}건)
            </p>
            <button
              type="button"
              className="btn btn-secondary btn-small"
              onClick={() => {
                setApprovalActivities([]);
                setMobileApprovalFeedback(null);
              }}
              disabled={approvalActivities.length === 0}
            >
              이력 초기화
            </button>
          </div>
          {approvalActivities.length === 0 ? (
            <p className="small muted">아직 처리 이력이 없습니다.</p>
          ) : (
            <ul className="simple-list" aria-label="승인 처리 이력">
              {approvalActivities.map((activity) => (
                <li key={activity.id}>
                  <span>
                    <span className={activity.ok ? "ok" : "fail"}>{activity.ok ? "OK" : "FAIL"}</span>{" "}
                    <strong>[{activity.queue}]</strong> {activity.action} · {activity.itemId}{" "}
                    <span className="muted">
                      ({activity.status} · {activity.at})
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>

        <article className="panel" id="aggregates">
          <h2>근태 집계</h2>
          <div className="input-grid">
            <label>
              직원 ID (선택)
              <input
                value={aggregateEmployeeId}
                onChange={(event) => setAggregateEmployeeId(event.target.value)}
                placeholder="비우면 전체"
              />
            </label>
          </div>
          <div className="actions">
            <button className="btn btn-secondary" onClick={() => void listAttendanceAggregates()}>
              집계 조회
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => {
                setAggregateEmployeeId("");
                void listAttendanceAggregates({ employeeId: "" });
              }}
            >
              전체 집계
            </button>
          </div>
          {aggregates.length > 0 ? (
            <ul className="simple-list" aria-label="근태 집계 결과">
              {aggregates.map((aggregate) => (
                <li key={aggregate.employeeId}>
                  <span>
                    <strong>{aggregate.employeeId}</strong>{" "}
                    <span className="muted">
                      승인 {aggregate.counts.approved} / 대기 {aggregate.counts.pending} / 반려{" "}
                      {aggregate.counts.rejected} / 급여반영 {aggregate.counts.payable}
                      {" · "}정규 {minutesToHours(aggregate.totals.regular)} / 연장{" "}
                      {minutesToHours(aggregate.totals.overtime)} / 야간{" "}
                      {minutesToHours(aggregate.totals.night)} / 휴일{" "}
                      {minutesToHours(aggregate.totals.holiday)}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={() => {
                      setAggregateEmployeeId(aggregate.employeeId);
                      setEmployeeId(aggregate.employeeId);
                      setAccrualEmployeeId(aggregate.employeeId);
                    }}
                  >
                    이 직원으로 적용
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="small muted">집계 데이터가 없습니다.</p>
          )}
        </article>

        <article className="panel" id="leave-policy">
          <h2>휴가 정책/정산 (연차 부여/이월)</h2>
          <p className="small">
            조직 단위 휴가 정책(연간 부여/이월 상한)을 저장하고, 정산 시 부여/이월 값을 비워두면 정책 기본값이 적용됩니다.
          </p>
          <div className="input-grid">
            <label>
              직원 ID
              <input
                value={accrualEmployeeId}
                onChange={(event) => setAccrualEmployeeId(event.target.value)}
              />
            </label>
            <label>
              연도
              <input value={accrualYear} onChange={(event) => setAccrualYear(event.target.value)} />
            </label>
            <label>
              연차 부여일
              <input
                value={accrualGrantDays}
                onChange={(event) => setAccrualGrantDays(event.target.value)}
              />
            </label>
            <label>
              이월 상한일
              <input
                value={accrualCarryCapDays}
                onChange={(event) => setAccrualCarryCapDays(event.target.value)}
              />
            </label>
            <label>
              반차 허용
              <select
                value={leaveAllowHalfDay ? "true" : "false"}
                onChange={(event) => setLeaveAllowHalfDay(event.target.value === "true")}
              >
                <option value="true">허용</option>
                <option value="false">비허용</option>
              </select>
            </label>
            <label>
              시간단위 허용
              <select
                value={leaveAllowHourly ? "true" : "false"}
                onChange={(event) => setLeaveAllowHourly(event.target.value === "true")}
              >
                <option value="true">허용</option>
                <option value="false">비허용</option>
              </select>
            </label>
            <label>
              시간 단위(분)
              <input
                value={leaveHourlyIncrementMinutes}
                onChange={(event) => setLeaveHourlyIncrementMinutes(event.target.value)}
              />
            </label>
            <label>
              1회 최대 시간
              <input
                value={leaveMaxHoursPerRequest}
                onChange={(event) => setLeaveMaxHoursPerRequest(event.target.value)}
              />
            </label>
            <label>
              사전 신청 최소 일수
              <input
                type="number"
                min={0}
                value={leaveMinNoticeDays}
                onChange={(event) => setLeaveMinNoticeDays(event.target.value)}
              />
            </label>
            <label>
              연속 사용 상한(일, 비우면 무제한)
              <input
                type="number"
                min={0.5}
                step="0.5"
                value={leaveMaxConsecutiveDays}
                onChange={(event) => setLeaveMaxConsecutiveDays(event.target.value)}
              />
            </label>
          </div>
          <div className="actions">
            <button className="btn btn-secondary" onClick={() => void loadLeavePolicy()} disabled={!organizationId.trim()}>
              정책 불러오기
            </button>
            <button className="btn btn-secondary" onClick={() => void saveLeavePolicy()} disabled={!organizationId.trim()}>
              정책 저장
            </button>
            <button className="btn btn-primary" onClick={() => void settleLeaveAccrual()}>
              정산 실행
            </button>
          </div>
          {accrualResult ? (
            <p className="small">
              결과: 잔여 {formatDays(accrualResult.remainingDays)}일 (부여{" "}
              {formatDays(accrualResult.grantedDays)}일, 사용 {formatDays(accrualResult.usedDays)}일, 이월{" "}
              {formatDays(accrualResult.carryOverDays)}일) / updated{" "}
              {formatDateTime(accrualResult.updatedAt)}
            </p>
          ) : (
            <p className="small muted">정산 결과가 아직 없습니다.</p>
          )}
        </article>

        <article className="panel" id="payroll">
          <h2>급여 프리뷰/확정</h2>
          <p className="small">
            승인된 출퇴근 기반으로 총지급을 산정하거나, 법정공제 기준 프리뷰를 생성할 수 있습니다.
          </p>
          <div className="input-grid">
            <label>
              프리뷰 모드
              <select
                value={payrollPreviewMode}
                onChange={(event) =>
                  setPayrollPreviewMode(event.target.value as "gross" | "statutory_kr_baseline")
                }
              >
                <option value="gross">총지급만</option>
                <option value="statutory_kr_baseline">법정공제(KR baseline)</option>
              </select>
            </label>
            <label>
              대상 직원 ID
              <input value={employeeId} onChange={(event) => setEmployeeId(event.target.value)} />
            </label>
            <label>
              시급 (KRW)
              <input
                type="number"
                min={1}
                value={payrollHourlyRateKrw}
                onChange={(event) => setPayrollHourlyRateKrw(event.target.value)}
              />
            </label>
            {payrollPreviewMode === "statutory_kr_baseline" ? (
              <>
                <label>
                  비과세 소득(KRW)
                  <input
                    type="number"
                    min={0}
                    value={payrollNonTaxableIncomeKrw}
                    onChange={(event) => setPayrollNonTaxableIncomeKrw(event.target.value)}
                  />
                </label>
                <label>
                  기타 공제(KRW)
                  <input
                    type="number"
                    min={0}
                    value={payrollOtherDeductionsKrw}
                    onChange={(event) => setPayrollOtherDeductionsKrw(event.target.value)}
                  />
                </label>
                <label>
                  세액공제 추가(KRW)
                  <input
                    type="number"
                    min={0}
                    value={payrollAdditionalTaxCreditKrw}
                    onChange={(event) => setPayrollAdditionalTaxCreditKrw(event.target.value)}
                  />
                </label>
                <label>
                  부양가족 수
                  <input
                    type="number"
                    min={0}
                    value={payrollDependentCount}
                    onChange={(event) => setPayrollDependentCount(event.target.value)}
                  />
                </label>
                <label>
                  1인당 부양가족 공제(KRW)
                  <input
                    type="number"
                    min={0}
                    value={payrollDependentTaxCreditPerPersonKrw}
                    onChange={(event) =>
                      setPayrollDependentTaxCreditPerPersonKrw(event.target.value)
                    }
                  />
                </label>
                <label>
                  월경계 강제검증(서울)
                  <select
                    value={payrollRequireMonthlyBoundary ? "true" : "false"}
                    onChange={(event) => setPayrollRequireMonthlyBoundary(event.target.value === "true")}
                  >
                    <option value="false">비활성</option>
                    <option value="true">활성</option>
                  </select>
                </label>
                <label>
                  국민연금 상한(KRW, 선택)
                  <input
                    type="number"
                    min={0}
                    value={payrollNationalPensionCapKrw}
                    onChange={(event) => setPayrollNationalPensionCapKrw(event.target.value)}
                  />
                </label>
                <label>
                  건강보험 상한(KRW, 선택)
                  <input
                    type="number"
                    min={0}
                    value={payrollHealthInsuranceCapKrw}
                    onChange={(event) => setPayrollHealthInsuranceCapKrw(event.target.value)}
                  />
                </label>
                <label>
                  고용보험 상한(KRW, 선택)
                  <input
                    type="number"
                    min={0}
                    value={payrollEmploymentInsuranceCapKrw}
                    onChange={(event) => setPayrollEmploymentInsuranceCapKrw(event.target.value)}
                  />
                </label>
              </>
            ) : null}
            <label className="full">
              최근 Run ID
              <input
                value={lastPayrollRunId}
                onChange={(event) => setLastPayrollRunId(event.target.value)}
                placeholder="확정 버튼용"
              />
            </label>
          </div>
          <div className="actions">
            <button className="btn btn-primary" onClick={() => void previewPayroll()}>
              프리뷰 생성
            </button>
            <button
              className="btn btn-danger"
              onClick={() => void confirmPayroll(lastPayrollRunId)}
              disabled={!lastPayrollRunId.trim()}
            >
              Run 확정
            </button>
          </div>
        </article>

        {showDevTools ? (
          <article className="panel">
            <h2>디버그 로그</h2>
            <p className="small">
              개발 모드에서만 노출됩니다. PR/배포 환경에서는 사용자 경험 화면을 우선합니다.
            </p>
            <div className="actions">
              <button className="btn btn-secondary" onClick={clearLogs}>
                로그 초기화
              </button>
            </div>
            {logs.length === 0 ? (
              <p className="small muted">아직 호출 이력이 없습니다.</p>
            ) : (
              <ul className="simple-list" aria-label="API 호출 로그">
                {logs.slice(0, 12).map((log) => (
                  <li key={log.id}>
                    <span>
                      <span className={log.ok ? "ok" : "fail"}>
                        {log.ok ? "OK" : "FAIL"} {log.status}
                      </span>{" "}
                      <strong>{log.label}</strong>{" "}
                      <span className="muted">
                        {log.durationMs}ms · {log.at}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ) : null}
      </section>
    </main>
  );
}
