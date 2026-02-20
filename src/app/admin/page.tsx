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
  within24: number;
  between24And48: number;
  over48: number;
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

function toQueueAlertLevel(waitHours: number): QueueAlertLevel {
  if (waitHours >= 48) {
    return "critical";
  }
  if (waitHours >= 24) {
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

function summarizeQueueAlert(waitHoursValues: number[]) {
  const oldestHours = waitHoursValues.length > 0 ? Math.max(...waitHoursValues) : 0;
  const critical = waitHoursValues.filter((value) => toQueueAlertLevel(value) === "critical").length;
  const watch = waitHoursValues.filter((value) => toQueueAlertLevel(value) === "watch").length;
  const alertLevel: QueueAlertLevel = critical > 0 ? "critical" : watch > 0 ? "watch" : "normal";
  return { oldestHours, critical, watch, alertLevel };
}

function summarizeSlaTimeline(waitHoursValues: number[]) {
  const total = waitHoursValues.length;
  let within24 = 0;
  let between24And48 = 0;
  let over48 = 0;

  for (const waitHours of waitHoursValues) {
    if (waitHours > 48) {
      over48 += 1;
    } else if (waitHours >= 24) {
      between24And48 += 1;
    } else {
      within24 += 1;
    }
  }

  const oldestHours = total > 0 ? Math.max(...waitHoursValues) : 0;
  return { total, within24, between24And48, over48, oldestHours };
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

  const filteredPendingAttendance = useMemo(() => {
    const filtered = pendingAttendance.filter((record) => {
      const waitHours = attendanceWaitHoursById.get(record.id) ?? 0;
      const alertLevel = toQueueAlertLevel(waitHours);
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
    selectedAttendanceIds
  ]);

  const filteredPendingLeave = useMemo(() => {
    const filtered = pendingLeave.filter((request) => {
      const waitHours = leaveWaitHoursById.get(request.id) ?? 0;
      const alertLevel = toQueueAlertLevel(waitHours);
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
    selectedLeaveIds
  ]);

  const filteredPreviewedPayroll = useMemo(() => {
    const filtered = previewedPayroll.filter((run) => {
      if (approvalQueueOnlyUrgent && toQueueAlertLevel(payrollWaitHoursById.get(run.id) ?? 0) === "normal") {
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
    previewedPayroll
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
        ...summarizeQueueAlert([
          ...attendanceWaitHoursValues,
          ...leaveWaitHoursValues,
          ...payrollWaitHoursValues
        ])
      },
      {
        focus: "attendance",
        label: "출퇴근",
        pending: pendingAttendance.length,
        visible: filteredPendingAttendance.length,
        selected: selectedVisibleAttendanceCount,
        ...summarizeQueueAlert(attendanceWaitHoursValues)
      },
      {
        focus: "leave",
        label: "휴가",
        pending: pendingLeave.length,
        visible: filteredPendingLeave.length,
        selected: selectedVisibleLeaveCount,
        ...summarizeQueueAlert(leaveWaitHoursValues)
      },
      {
        focus: "payroll",
        label: "급여",
        pending: previewedPayroll.length,
        visible: filteredPreviewedPayroll.length,
        selected: 0,
        ...summarizeQueueAlert(payrollWaitHoursValues)
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
        alertLevel: toQueueAlertLevel(waitedHours),
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
        alertLevel: toQueueAlertLevel(waitedHours),
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
        alertLevel: toQueueAlertLevel(waitedHours),
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
    selectedAttendanceIds,
    selectedLeaveIds
  ]);

  const queueSlaTimelinePoints = useMemo<QueueSlaTimelinePoint[]>(
    () => [
      {
        key: "all",
        label: "전체",
        ...summarizeSlaTimeline([
          ...attendanceWaitHoursValues,
          ...leaveWaitHoursValues,
          ...payrollWaitHoursValues
        ])
      },
      {
        key: "attendance",
        label: "출퇴근",
        ...summarizeSlaTimeline(attendanceWaitHoursValues)
      },
      {
        key: "leave",
        label: "휴가",
        ...summarizeSlaTimeline(leaveWaitHoursValues)
      },
      {
        key: "payroll",
        label: "급여",
        ...summarizeSlaTimeline(payrollWaitHoursValues)
      }
    ],
    [attendanceWaitHoursValues, leaveWaitHoursValues, payrollWaitHoursValues]
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

          <section className="queue-sla-timeline-panel" id="approval-sla-timeline">
            <div className="queue-section-head">
              <h3>대기 SLA 타임라인</h3>
              <p className="small muted">
                24h 이내 / 24~48h / 48h 초과 구간으로 대기 분포를 확인해 우선순위를 정합니다.
              </p>
            </div>
            <p className="small muted" style={{ marginTop: 0 }}>
              현재 포커스: {activeQueueSlaTimelinePoint.label} / total {activeQueueSlaTimelinePoint.total} / oldest{" "}
              {Math.round(activeQueueSlaTimelinePoint.oldestHours)}h
            </p>
            <ul className="queue-sla-timeline-list" aria-label="approval queue sla timeline">
              {queueSlaTimelinePoints.map((point) => {
                const safeTotal = Math.max(1, point.total);
                const withinPercent = (point.within24 / safeTotal) * 100;
                const watchPercent = (point.between24And48 / safeTotal) * 100;
                const criticalPercent = (point.over48 / safeTotal) * 100;

                return (
                  <li key={point.key}>
                    <div className="queue-sla-timeline-head">
                      <strong>{point.label}</strong>
                      <span className="muted">
                        total {point.total} / oldest {Math.round(point.oldestHours)}h
                      </span>
                    </div>
                    <div className="queue-sla-timeline-bar" role="img" aria-label={`${point.label} sla timeline`}>
                      <span className="segment segment-normal" style={{ width: `${withinPercent}%` }} />
                      <span className="segment segment-watch" style={{ width: `${watchPercent}%` }} />
                      <span className="segment segment-critical" style={{ width: `${criticalPercent}%` }} />
                    </div>
                    <div className="queue-sla-timeline-chips">
                      <span className="queue-history-chip">24h 이내 {point.within24}</span>
                      <span className="queue-history-chip">24~48h {point.between24And48}</span>
                      <span className="queue-history-chip">48h 초과 {point.over48}</span>
                    </div>
                  </li>
                );
              })}
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
                            className={`queue-sla-chip level-${toQueueAlertLevel(
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
                            className={`queue-sla-chip level-${toQueueAlertLevel(
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
                          className={`queue-sla-chip level-${toQueueAlertLevel(
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
