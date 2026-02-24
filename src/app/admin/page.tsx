"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  buildQuery,
  firstDayOfMonthLocal,
  formatDateTime,
  formatDays,
  isTruthyFlag,
  lastDayOfMonthLocal,
  minutesToHours,
  toIso,
  toLocalInputValue
} from "@/app/admin/page-helpers";
import {
  buildQueueSearchSortRows,
  filterPendingAttendanceQueue,
  filterPendingLeaveQueue,
  filterPreviewedPayrollQueue,
  filterQueueSearchSortRows,
  resolveQueueSlaCriticalHours,
  resolveQueueSlaWatchHours,
  toWaitHoursById
} from "@/app/admin/page-queue-helpers";
import type {
  ApiLog,
  AttendanceAggregateDto,
  AttendanceRecordDto,
  EmployeeSummary,
  InviteDeliveryMode,
  InviteResultDto,
  InviteRole,
  LeaveBalanceDto,
  LeaveRequestDto,
  OrganizationSummary,
  PayrollRunDto,
  WorkScheduleDto
} from "@/app/admin/page-types";
import { ApprovalQueuePanel } from "@/components/admin-approval/ApprovalQueuePanel";
import {
  queueAlertLevelRank,
  summarizeQueueAlertByRule,
  toQueueAlertLevelByRule
} from "@/components/admin-approval/approval-queue-helpers";
import {
  type ApprovalActivity,
  type AttendanceQueueSort,
  type LeaveQueueSort,
  type PayrollQueueSort,
  type QueueBadgeSummary,
  type QueueFocus,
  type QueueMobileApprovalFeedback,
  type QueueSearchScope,
  type QueueSearchSortOption,
  type QueueSearchSortRow,
  type QueueSearchSortScope
} from "@/components/admin-approval/approval-queue-types";
import { AdminAggregateLeavePanels } from "@/components/admin-dashboard/AdminAggregateLeavePanels";
import { AdminDashboardChrome } from "@/components/admin-dashboard/AdminDashboardChrome";
import { AdminDebugLogsPanel } from "@/components/admin-dashboard/AdminDebugLogsPanel";
import { AdminOnboardingAccountPanels } from "@/components/admin-dashboard/AdminOnboardingAccountPanels";
import { AdminPayrollPanel } from "@/components/admin-dashboard/AdminPayrollPanel";
import { AdminPeopleInvitePanels } from "@/components/admin-dashboard/AdminPeopleInvitePanels";
import { AdminSchedulingPanel } from "@/components/admin-dashboard/AdminSchedulingPanel";
import { type PayrollKrPresetShareLinkFeedback } from "@/components/payroll/PayrollKrPresetShareLinkFeedbackPanel";
import {
  createEmptyPayrollKrIncomeSplitItemDraft,
  type PayrollKrIncomeSplitItemDraft
} from "@/components/payroll/PayrollKrIncomeSplitItemsTable";
import { analyzePayrollKrIncomeSplitDraftConsistency } from "@/features/payroll/kr-income-split-item-consistency";
import {
  hasPayrollKrPresetShareContext,
  parsePayrollKrPresetShareContext,
  resolvePayrollKrPresetShareContext
} from "@/features/payroll/kr-preset-share-context";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";
import { useI18n } from "@/lib/i18n/provider";

export default function AdminDashboardPage() {
  const showDevTools = isTruthyFlag(process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS);
  const { locale } = useI18n();
  const isKoLocale = locale === "ko";

  const [accessToken, setAccessToken] = useState("");
  const [organizationId, setOrganizationId] = useStickyStringState("flowhr:ctx:organizationId", "");
  const [adminActorId, setAdminActorId] = useStickyStringState("flowhr:ctx:adminId", "ADM-1001");
  const [organizationName, setOrganizationName] = useState(
    isKoLocale ? "FlowHR 데모 조직" : "FlowHR Demo Org"
  );
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([]);

  useEffect(() => {
    setOrganizationName((previous) => {
      if (previous !== "FlowHR Demo Org" && previous !== "FlowHR 데모 조직") {
        return previous;
      }
      return isKoLocale ? "FlowHR 데모 조직" : "FlowHR Demo Org";
    });
  }, [isKoLocale]);

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
  const [selectedAttendanceIds] = useState<string[]>([]);
  const [selectedLeaveIds] = useState<string[]>([]);
  const [approvalQueueFocus, setApprovalQueueFocus] = useState<QueueFocus>("all");
  const [approvalQueueSearch, setApprovalQueueSearch] = useState("");
  const [approvalQueueSearchScope, setApprovalQueueSearchScope] = useState<QueueSearchScope>("all");
  const [approvalQueueOnlyUrgent, setApprovalQueueOnlyUrgent] = useState(false);
  const [approvalQueueSelectedOnly, setApprovalQueueSelectedOnly] = useState(false);
  const [attendanceQueueSort] = useState<AttendanceQueueSort>("checkin_desc");
  const [leaveQueueSort] = useState<LeaveQueueSort>("start_desc");
  const [payrollQueueSort] = useState<PayrollQueueSort>("period_desc");
  const [queueSearchSortScope, setQueueSearchSortScope] = useState<QueueSearchSortScope>("all");
  const [queueSearchSortQuery, setQueueSearchSortQuery] = useState("");
  const [queueSearchSortOption, setQueueSearchSortOption] = useState<QueueSearchSortOption>("priority_desc");
  const queueSlaWatchHoursInput = "24";
  const queueSlaCriticalHoursInput = "48";

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
  const [payrollTaxableIncomeKrw, setPayrollTaxableIncomeKrw] = useState("");
  const [payrollTaxableItems, setPayrollTaxableItems] = useState<PayrollKrIncomeSplitItemDraft[]>([
    createEmptyPayrollKrIncomeSplitItemDraft()
  ]);
  const [payrollNonTaxableItems, setPayrollNonTaxableItems] = useState<PayrollKrIncomeSplitItemDraft[]>(
    [createEmptyPayrollKrIncomeSplitItemDraft()]
  );
  const [payrollIncomeSplitItemPresetId, setPayrollIncomeSplitItemPresetId] = useState("");
  const [payrollOtherDeductionsKrw, setPayrollOtherDeductionsKrw] = useState("0");
  const [payrollAdditionalTaxCreditKrw, setPayrollAdditionalTaxCreditKrw] = useState("0");
  const [payrollDependentCount, setPayrollDependentCount] = useState("0");
  const [payrollDependentTaxCreditPerPersonKrw, setPayrollDependentTaxCreditPerPersonKrw] =
    useState("0");
  const [payrollIncomeTaxLookupPresetId, setPayrollIncomeTaxLookupPresetId] = useState("");
  const [payrollIncomeTaxLookupPresetAuto, setPayrollIncomeTaxLookupPresetAuto] = useState(false);
  const [payrollIncomeTaxLookupAsOf, setPayrollIncomeTaxLookupAsOf] = useState("");
  const [payrollRequireMonthlyBoundary, setPayrollRequireMonthlyBoundary] = useState(false);
  const [payrollNationalPensionCapKrw, setPayrollNationalPensionCapKrw] = useState("");
  const [payrollHealthInsuranceCapKrw, setPayrollHealthInsuranceCapKrw] = useState("");
  const [payrollEmploymentInsuranceCapKrw, setPayrollEmploymentInsuranceCapKrw] = useState("");
  const [lastPayrollRunId, setLastPayrollRunId] = useState("");

  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [approvalActivities, setApprovalActivities] = useState<ApprovalActivity[]>([]);
  const [, setMobileApprovalFeedback] = useState<QueueMobileApprovalFeedback | null>(null);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [payrollPresetShareLinkFeedback, setPayrollPresetShareLinkFeedback] =
    useState<PayrollKrPresetShareLinkFeedback | null>(null);
  const payrollPresetShareContextAppliedRef = useRef(false);

  const isProductionRuntime = process.env.NODE_ENV === "production";
  const { snapshot: supabaseSession, error: supabaseSessionError } = useSupabaseSession();

  const bearerToken =
    accessToken.trim().length > 0
      ? accessToken.trim()
      : isProductionRuntime
        ? (supabaseSession?.accessToken ?? "")
        : "";

  const usesBearerToken = bearerToken.trim().length > 0;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? (isKoLocale ? "미설정" : "not configured");

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

  const applyPayrollPresetShareContext = useCallback((search: string) => {
    const resolution = resolvePayrollKrPresetShareContext(search);
    const context = parsePayrollKrPresetShareContext(search);
    setPayrollPresetShareLinkFeedback({
      hasAnyQuery: resolution.hasAnyQuery,
      applied: {
        presetId: context.presetId,
        taxableIncomeKrw: context.taxableIncomeKrw,
        nonTaxableIncomeKrw: context.nonTaxableIncomeKrw
      },
      invalid: resolution.invalid
    });
    if (!hasPayrollKrPresetShareContext(context)) {
      return false;
    }

    setPayrollPreviewMode("statutory_kr_baseline");
    if (context.presetId) {
      setPayrollIncomeSplitItemPresetId(context.presetId);
    }
    if (context.taxableIncomeKrw !== null) {
      setPayrollTaxableIncomeKrw(context.taxableIncomeKrw);
    }
    if (context.nonTaxableIncomeKrw !== null) {
      setPayrollNonTaxableIncomeKrw(context.nonTaxableIncomeKrw);
    }
    return true;
  }, []);

  const resetPayrollPresetShareContext = useCallback(() => {
    setPayrollIncomeSplitItemPresetId("");
    setPayrollTaxableIncomeKrw("");
    setPayrollNonTaxableIncomeKrw("0");
  }, []);

  const reapplyPayrollPresetShareContext = useCallback(() => {
    if (typeof window === "undefined") {
      return;
    }
    applyPayrollPresetShareContext(window.location.search);
  }, [applyPayrollPresetShareContext]);

  useEffect(() => {
    if (payrollPresetShareContextAppliedRef.current) {
      return;
    }
    if (typeof window === "undefined") {
      return;
    }
    payrollPresetShareContextAppliedRef.current = true;
    applyPayrollPresetShareContext(window.location.search);
  }, [applyPayrollPresetShareContext]);

  const stats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter((log) => log.ok).length;
    const fail = total - success;
    return { total, success, fail };
  }, [logs]);

  const queueLabels = useMemo(
    () => ({
      all: isKoLocale ? "전체" : "All",
      attendance: isKoLocale ? "출퇴근" : "Attendance",
      leave: isKoLocale ? "휴가" : "Leave",
      payroll: isKoLocale ? "급여" : "Payroll"
    }),
    [isKoLocale]
  );
  const workTypeLabels = useMemo(
    () => ({
      holiday: isKoLocale ? "휴일" : "Holiday",
      work: isKoLocale ? "근무" : "Work"
    }),
    [isKoLocale]
  );
  const logStatusLabels = useMemo(
    () => ({
      success: isKoLocale ? "성공" : "OK",
      fail: isKoLocale ? "실패" : "FAIL"
    }),
    [isKoLocale]
  );
  const inviteRoleLabels = useMemo(
    () =>
      ({
        employee: isKoLocale ? "직원" : "Employee",
        manager: isKoLocale ? "매니저" : "Manager",
        payroll_operator: isKoLocale ? "급여 담당" : "Payroll Operator",
        admin: isKoLocale ? "관리자" : "Admin"
      }) as const,
    [isKoLocale]
  );
  const inviteDeliveryModeLabels = useMemo(
    () =>
      ({
        link: isKoLocale ? "링크" : "Link",
        email: isKoLocale ? "이메일" : "Email"
      }) as const,
    [isKoLocale]
  );
  const toInviteRoleLabel = (role: string) =>
    inviteRoleLabels[role as keyof typeof inviteRoleLabels] ?? role;
  const toInviteDeliveryModeLabel = (mode: string) =>
    inviteDeliveryModeLabels[mode as keyof typeof inviteDeliveryModeLabels] ?? mode;
  const updatedAtLabel = isKoLocale ? "업데이트" : "Updated";

  const normalizedQueueSearch = approvalQueueSearch.trim().toLowerCase();
  const queueNowMs = Date.now();

  const attendanceWaitHoursById = useMemo(
    () => toWaitHoursById(pendingAttendance, (record) => record.id, (record) => record.checkInAt, queueNowMs),
    [pendingAttendance, queueNowMs]
  );
  const leaveWaitHoursById = useMemo(
    () => toWaitHoursById(pendingLeave, (request) => request.id, (request) => request.startDate, queueNowMs),
    [pendingLeave, queueNowMs]
  );
  const payrollWaitHoursById = useMemo(
    () => toWaitHoursById(previewedPayroll, (run) => run.id, (run) => run.periodStart, queueNowMs),
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
  const queueSlaWatchHours = useMemo(
    () => resolveQueueSlaWatchHours(queueSlaWatchHoursInput),
    [queueSlaWatchHoursInput]
  );
  const queueSlaCriticalHours = useMemo(
    () => resolveQueueSlaCriticalHours(queueSlaCriticalHoursInput, queueSlaWatchHours),
    [queueSlaCriticalHoursInput, queueSlaWatchHours]
  );
  const resolveQueueAlertLevel = useMemo(
    () =>
      (waitHours: number) =>
        toQueueAlertLevelByRule(waitHours, queueSlaWatchHours, queueSlaCriticalHours),
    [queueSlaCriticalHours, queueSlaWatchHours]
  );

  const filteredPendingAttendance = useMemo(() => {
    return filterPendingAttendanceQueue({
      pendingAttendance,
      attendanceWaitHoursById,
      approvalQueueOnlyUrgent,
      approvalQueueSelectedOnly,
      selectedAttendanceIds,
      approvalQueueSearchScope,
      normalizedQueueSearch,
      attendanceQueueSort,
      resolveQueueAlertLevel
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
    return filterPendingLeaveQueue({
      pendingLeave,
      leaveWaitHoursById,
      approvalQueueOnlyUrgent,
      approvalQueueSelectedOnly,
      selectedLeaveIds,
      approvalQueueSearchScope,
      normalizedQueueSearch,
      leaveQueueSort,
      resolveQueueAlertLevel
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
    return filterPreviewedPayrollQueue({
      previewedPayroll,
      payrollWaitHoursById,
      approvalQueueOnlyUrgent,
      approvalQueueSelectedOnly,
      approvalQueueSearchScope,
      normalizedQueueSearch,
      payrollQueueSort,
      resolveQueueAlertLevel
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

  const queueBadgeSummaries = useMemo<QueueBadgeSummary[]>(
    () => [
      {
        focus: "all",
        label: queueLabels.all,
        pending: pendingAttendance.length + pendingLeave.length + previewedPayroll.length,
        visible:
          filteredPendingAttendance.length +
          filteredPendingLeave.length +
          filteredPreviewedPayroll.length,
        selected: 0,
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
        label: queueLabels.attendance,
        pending: pendingAttendance.length,
        visible: filteredPendingAttendance.length,
        selected: 0,
        ...summarizeQueueAlertByRule(
          attendanceWaitHoursValues,
          queueSlaWatchHours,
          queueSlaCriticalHours
        )
      },
      {
        focus: "leave",
        label: queueLabels.leave,
        pending: pendingLeave.length,
        visible: filteredPendingLeave.length,
        selected: 0,
        ...summarizeQueueAlertByRule(leaveWaitHoursValues, queueSlaWatchHours, queueSlaCriticalHours)
      },
      {
        focus: "payroll",
        label: queueLabels.payroll,
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
      queueLabels.all,
      queueLabels.attendance,
      queueLabels.leave,
      queueLabels.payroll,
      queueSlaCriticalHours,
      queueSlaWatchHours
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
    return buildQueueSearchSortRows({
      filteredPendingAttendance,
      filteredPendingLeave,
      filteredPreviewedPayroll,
      attendanceWaitHoursById,
      leaveWaitHoursById,
      payrollWaitHoursById,
      resolveQueueAlertLevel,
      queueLabels
    });
  }, [
    attendanceWaitHoursById,
    filteredPendingAttendance,
    filteredPendingLeave,
    filteredPreviewedPayroll,
    leaveWaitHoursById,
    payrollWaitHoursById,
    queueLabels,
    resolveQueueAlertLevel
  ]);

  const filteredQueueSearchSortRows = useMemo(() => {
    return filterQueueSearchSortRows({
      queueSearchSortRows,
      queueSearchSortScope,
      queueSearchSortQuery,
      queueSearchSortOption
    });
  }, [queueSearchSortOption, queueSearchSortQuery, queueSearchSortRows, queueSearchSortScope]);


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
    }
    if (leaveRes.response.ok) {
      const parsed = leaveRes.body as { requests?: LeaveRequestDto[] };
      const requests = Array.isArray(parsed.requests) ? parsed.requests : [];
      setPendingLeave(requests);
    }
    if (payrollRes.response.ok) {
      const parsed = payrollRes.body as { runs?: PayrollRunDto[] };
      const runs = Array.isArray(parsed.runs) ? parsed.runs : [];
      setPreviewedPayroll(runs);
    }
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
    function buildIncomeSplitItems(items: PayrollKrIncomeSplitItemDraft[]) {
      return items.flatMap((item) => {
        const codeValue = item.code.trim();
        const categoryValue = item.category.trim();
        const amountValue = item.amountKrw.trim();
        if (!codeValue && !categoryValue && !amountValue) {
          return [];
        }
        const parsedAmount =
          amountValue.length > 0 ? Math.max(0, Math.trunc(Number(amountValue) || 0)) : -1;
        return [
          {
            code: codeValue,
            category: categoryValue,
            amountKrw: parsedAmount
          }
        ];
      });
    }

    const taxableIncomeItems = buildIncomeSplitItems(payrollTaxableItems);
    const nonTaxableIncomeItems = buildIncomeSplitItems(payrollNonTaxableItems);
    const incomeSplitItemPresetId = payrollIncomeSplitItemPresetId.trim();
    const incomeSplitConsistencySummary = analyzePayrollKrIncomeSplitDraftConsistency({
      taxableItems: payrollTaxableItems,
      nonTaxableItems: payrollNonTaxableItems
    });

    if (
      payrollPreviewMode === "statutory_kr_baseline" &&
      incomeSplitItemPresetId.length === 0 &&
      incomeSplitConsistencySummary.hasBlockingIssues
    ) {
      setLogs((prev) => [
        {
          id: Date.now(),
          label: "Payroll preview (client consistency guard)",
          status: 400,
          ok: false,
          durationMs: 0,
          at: new Date().toLocaleString("ko-KR"),
          body: {
            error: "Fix split-item rows before submit.",
            details: incomeSplitConsistencySummary
          }
        },
        ...prev
      ]);
      return;
    }

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
        taxableIncomeKrw:
          payrollTaxableIncomeKrw.trim().length > 0
            ? Math.max(0, Math.trunc(Number(payrollTaxableIncomeKrw) || 0))
            : undefined,
        taxableIncomeItems:
          incomeSplitItemPresetId.length > 0
            ? undefined
            : taxableIncomeItems.length > 0
              ? taxableIncomeItems
              : undefined,
        nonTaxableIncomeItems:
          incomeSplitItemPresetId.length > 0
            ? undefined
            : nonTaxableIncomeItems.length > 0
              ? nonTaxableIncomeItems
              : undefined,
        incomeSplitItemPresetId: incomeSplitItemPresetId || undefined,
        otherDeductionsKrw: Math.max(0, Number(payrollOtherDeductionsKrw) || 0),
        additionalTaxCreditKrw: Math.max(0, Math.trunc(Number(payrollAdditionalTaxCreditKrw) || 0)),
        dependentCount: Math.max(0, Math.trunc(Number(payrollDependentCount) || 0)),
        dependentTaxCreditPerPersonKrw: Math.max(
          0,
          Math.trunc(Number(payrollDependentTaxCreditPerPersonKrw) || 0)
        ),
        incomeTaxLookupPresetId: payrollIncomeTaxLookupPresetAuto
          ? undefined
          : payrollIncomeTaxLookupPresetId.trim() || undefined,
        incomeTaxLookupPresetAuto: payrollIncomeTaxLookupPresetAuto,
        incomeTaxLookupAsOf:
          payrollIncomeTaxLookupPresetAuto && payrollIncomeTaxLookupAsOf.trim().length > 0
            ? toIso(payrollIncomeTaxLookupAsOf)
            : undefined,
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
          body: { error: "조직 ID가 필요합니다." }
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
          body: { error: "조직 ID가 필요합니다." }
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
      <AdminDashboardChrome
        showDevTools={showDevTools}
        isKoLocale={isKoLocale}
        isProductionRuntime={isProductionRuntime}
        usesBearerToken={usesBearerToken}
        pendingAttendanceCount={pendingAttendance.length}
        pendingLeaveCount={pendingLeave.length}
        previewedPayrollCount={previewedPayroll.length}
        stats={stats}
        logStatusLabels={logStatusLabels}
        pendingLabel={pendingLabel}
        onRefreshDashboard={() => void refreshDashboard()}
      />

      <section className="panel-grid">
        <AdminOnboardingAccountPanels
          isKoLocale={isKoLocale}
          showDevTools={showDevTools}
          isProductionRuntime={isProductionRuntime}
          usesBearerToken={usesBearerToken}
          organizationId={organizationId}
          organizationName={organizationName}
          organizations={organizations}
          adminActorId={adminActorId}
          accessToken={accessToken}
          supabaseUrl={supabaseUrl}
          supabaseSession={supabaseSession}
          supabaseSessionError={supabaseSessionError}
          onOrganizationNameChange={setOrganizationName}
          onCreateOrganization={() => void createOrganization()}
          onListOrganizations={() => void listOrganizations()}
          onSelectOrganization={setOrganizationId}
          onOrganizationIdChange={setOrganizationId}
          onAdminActorIdChange={setAdminActorId}
          onAccessTokenChange={setAccessToken}
        />

        <AdminPeopleInvitePanels
          isKoLocale={isKoLocale}
          organizationId={organizationId}
          employeeId={employeeId}
          employeeName={employeeName}
          employeeEmail={employeeEmail}
          employeeActive={employeeActive}
          employees={employees}
          inviteEmail={inviteEmail}
          inviteRole={inviteRole}
          inviteDeliveryMode={inviteDeliveryMode}
          inviteActorId={inviteActorId}
          inviteResult={inviteResult}
          inviteRoleLabels={inviteRoleLabels}
          inviteDeliveryModeLabels={inviteDeliveryModeLabels}
          toInviteRoleLabel={toInviteRoleLabel}
          toInviteDeliveryModeLabel={toInviteDeliveryModeLabel}
          onEmployeeIdChange={setEmployeeId}
          onEmployeeNameChange={setEmployeeName}
          onEmployeeEmailChange={setEmployeeEmail}
          onEmployeeActiveChange={setEmployeeActive}
          onCreateEmployee={() => void createEmployee()}
          onListEmployees={() => void listEmployees()}
          onApplyEmployee={(id) => {
            setEmployeeId(id);
            setAccrualEmployeeId(id);
            setAggregateEmployeeId(id);
            setScheduleEmployeeId(id);
            setInviteActorId(id);
          }}
          onInviteEmailChange={setInviteEmail}
          onInviteRoleChange={setInviteRole}
          onInviteDeliveryModeChange={setInviteDeliveryMode}
          onInviteActorIdChange={setInviteActorId}
          onOrganizationIdChange={setOrganizationId}
          onCreateInvite={() => void createInvite()}
        />

        <AdminSchedulingPanel
          scheduleEmployeeId={scheduleEmployeeId}
          scheduleIsHoliday={scheduleIsHoliday}
          scheduleStartAt={scheduleStartAt}
          scheduleEndAt={scheduleEndAt}
          scheduleBreakMinutes={scheduleBreakMinutes}
          scheduleNotes={scheduleNotes}
          periodStart={periodStart}
          periodEnd={periodEnd}
          schedules={schedules}
          workTypeLabels={workTypeLabels}
          formatDateTime={formatDateTime}
          onScheduleEmployeeIdChange={setScheduleEmployeeId}
          onScheduleIsHolidayChange={setScheduleIsHoliday}
          onScheduleStartAtChange={setScheduleStartAt}
          onScheduleEndAtChange={setScheduleEndAt}
          onScheduleBreakMinutesChange={setScheduleBreakMinutes}
          onScheduleNotesChange={setScheduleNotes}
          onPeriodStartChange={setPeriodStart}
          onPeriodEndChange={setPeriodEnd}
          onCreateSchedule={() => void createSchedule()}
          onListSchedules={() => void listSchedules()}
          onDeleteSchedule={(scheduleId) => void deleteSchedule(scheduleId)}
        />

        <ApprovalQueuePanel
          queueBadgeSummaries={queueBadgeSummaries}
          approvalQueueFocus={approvalQueueFocus}
          queueAlertOverview={queueAlertOverview}
          periodStart={periodStart}
          periodEnd={periodEnd}
          approvalQueueSearchScope={approvalQueueSearchScope}
          approvalQueueSearch={approvalQueueSearch}
          approvalQueueOnlyUrgent={approvalQueueOnlyUrgent}
          approvalQueueSelectedOnly={approvalQueueSelectedOnly}
          attendanceRejectReason={attendanceRejectReason}
          leaveRejectReason={leaveRejectReason}
          activeQueueBadgeSummary={activeQueueBadgeSummary}
          queueSearchSortScope={queueSearchSortScope}
          queueSearchSortOption={queueSearchSortOption}
          queueSearchSortQuery={queueSearchSortQuery}
          filteredQueueSearchSortRows={filteredQueueSearchSortRows}
          approvalActivities={approvalActivities}
          onRefreshInbox={() => void refreshInbox()}
          onApprovalQueueFocusChange={setApprovalQueueFocus}
          onPeriodStartChange={setPeriodStart}
          onPeriodEndChange={setPeriodEnd}
          onApprovalQueueSearchScopeChange={setApprovalQueueSearchScope}
          onApprovalQueueSearchChange={setApprovalQueueSearch}
          onToggleUrgentOnly={() => setApprovalQueueOnlyUrgent((prev) => !prev)}
          onToggleSelectedOnly={() => setApprovalQueueSelectedOnly((prev) => !prev)}
          onResetQuickFilters={() => {
            setApprovalQueueOnlyUrgent(false);
            setApprovalQueueSelectedOnly(false);
            setApprovalQueueSearch("");
          }}
          onAttendanceRejectReasonChange={setAttendanceRejectReason}
          onLeaveRejectReasonChange={setLeaveRejectReason}
          onQueueSearchSortScopeChange={setQueueSearchSortScope}
          onQueueSearchSortOptionChange={setQueueSearchSortOption}
          onQueueSearchSortQueryChange={setQueueSearchSortQuery}
          onApplyPendingPreset={() => {
            setQueueSearchSortScope("detail");
            setQueueSearchSortQuery("PENDING");
            setQueueSearchSortOption("priority_desc");
          }}
          onApplyUrgentPreset={() => {
            setQueueSearchSortScope("all");
            setQueueSearchSortOption("wait_desc");
            setApprovalQueueOnlyUrgent(true);
          }}
          onResetSearchSortPreset={() => {
            setQueueSearchSortScope("all");
            setQueueSearchSortQuery("");
            setQueueSearchSortOption("priority_desc");
          }}
          onClearApprovalActivities={() => {
            setApprovalActivities([]);
            setMobileApprovalFeedback(null);
          }}
        />

        <AdminAggregateLeavePanels
          aggregateEmployeeId={aggregateEmployeeId}
          aggregates={aggregates}
          accrualEmployeeId={accrualEmployeeId}
          accrualYear={accrualYear}
          accrualGrantDays={accrualGrantDays}
          accrualCarryCapDays={accrualCarryCapDays}
          leaveAllowHalfDay={leaveAllowHalfDay}
          leaveAllowHourly={leaveAllowHourly}
          leaveHourlyIncrementMinutes={leaveHourlyIncrementMinutes}
          leaveMaxHoursPerRequest={leaveMaxHoursPerRequest}
          leaveMinNoticeDays={leaveMinNoticeDays}
          leaveMaxConsecutiveDays={leaveMaxConsecutiveDays}
          accrualResult={accrualResult}
          organizationId={organizationId}
          updatedAtLabel={updatedAtLabel}
          formatDateTime={formatDateTime}
          minutesToHours={minutesToHours}
          formatDays={formatDays}
          onAggregateEmployeeIdChange={setAggregateEmployeeId}
          onListAttendanceAggregates={() => void listAttendanceAggregates()}
          onListAttendanceAggregatesAll={() => {
            setAggregateEmployeeId("");
            void listAttendanceAggregates({ employeeId: "" });
          }}
          onApplyAggregateEmployee={(id) => {
            setAggregateEmployeeId(id);
            setEmployeeId(id);
            setAccrualEmployeeId(id);
          }}
          onAccrualEmployeeIdChange={setAccrualEmployeeId}
          onAccrualYearChange={setAccrualYear}
          onAccrualGrantDaysChange={setAccrualGrantDays}
          onAccrualCarryCapDaysChange={setAccrualCarryCapDays}
          onLeaveAllowHalfDayChange={setLeaveAllowHalfDay}
          onLeaveAllowHourlyChange={setLeaveAllowHourly}
          onLeaveHourlyIncrementMinutesChange={setLeaveHourlyIncrementMinutes}
          onLeaveMaxHoursPerRequestChange={setLeaveMaxHoursPerRequest}
          onLeaveMinNoticeDaysChange={setLeaveMinNoticeDays}
          onLeaveMaxConsecutiveDaysChange={setLeaveMaxConsecutiveDays}
          onLoadLeavePolicy={() => void loadLeavePolicy()}
          onSaveLeavePolicy={() => void saveLeavePolicy()}
          onSettleLeaveAccrual={() => void settleLeaveAccrual()}
        />

        <AdminPayrollPanel
          isKoLocale={isKoLocale}
          payrollPreviewMode={payrollPreviewMode}
          employeeId={employeeId}
          payrollHourlyRateKrw={payrollHourlyRateKrw}
          payrollNonTaxableIncomeKrw={payrollNonTaxableIncomeKrw}
          payrollTaxableIncomeKrw={payrollTaxableIncomeKrw}
          payrollTaxableItems={payrollTaxableItems}
          payrollNonTaxableItems={payrollNonTaxableItems}
          payrollIncomeSplitItemPresetId={payrollIncomeSplitItemPresetId}
          payrollOtherDeductionsKrw={payrollOtherDeductionsKrw}
          payrollAdditionalTaxCreditKrw={payrollAdditionalTaxCreditKrw}
          payrollDependentCount={payrollDependentCount}
          payrollDependentTaxCreditPerPersonKrw={payrollDependentTaxCreditPerPersonKrw}
          payrollIncomeTaxLookupPresetId={payrollIncomeTaxLookupPresetId}
          payrollIncomeTaxLookupPresetAuto={payrollIncomeTaxLookupPresetAuto}
          payrollIncomeTaxLookupAsOf={payrollIncomeTaxLookupAsOf}
          payrollRequireMonthlyBoundary={payrollRequireMonthlyBoundary}
          payrollNationalPensionCapKrw={payrollNationalPensionCapKrw}
          payrollHealthInsuranceCapKrw={payrollHealthInsuranceCapKrw}
          payrollEmploymentInsuranceCapKrw={payrollEmploymentInsuranceCapKrw}
          payrollPresetShareLinkFeedback={payrollPresetShareLinkFeedback}
          lastPayrollRunId={lastPayrollRunId}
          onPayrollPreviewModeChange={setPayrollPreviewMode}
          onEmployeeIdChange={setEmployeeId}
          onPayrollHourlyRateKrwChange={setPayrollHourlyRateKrw}
          onPayrollNonTaxableIncomeKrwChange={setPayrollNonTaxableIncomeKrw}
          onPayrollTaxableIncomeKrwChange={setPayrollTaxableIncomeKrw}
          onPayrollTaxableItemsChange={setPayrollTaxableItems}
          onPayrollNonTaxableItemsChange={setPayrollNonTaxableItems}
          onPayrollIncomeSplitItemPresetIdChange={setPayrollIncomeSplitItemPresetId}
          onPayrollOtherDeductionsKrwChange={setPayrollOtherDeductionsKrw}
          onPayrollAdditionalTaxCreditKrwChange={setPayrollAdditionalTaxCreditKrw}
          onPayrollDependentCountChange={setPayrollDependentCount}
          onPayrollDependentTaxCreditPerPersonKrwChange={setPayrollDependentTaxCreditPerPersonKrw}
          onPayrollIncomeTaxLookupPresetIdChange={setPayrollIncomeTaxLookupPresetId}
          onPayrollIncomeTaxLookupPresetAutoChange={(enabled) => {
            setPayrollIncomeTaxLookupPresetAuto(enabled);
            if (enabled) {
              setPayrollIncomeTaxLookupPresetId("");
            }
          }}
          onPayrollIncomeTaxLookupAsOfChange={setPayrollIncomeTaxLookupAsOf}
          onPayrollRequireMonthlyBoundaryChange={setPayrollRequireMonthlyBoundary}
          onPayrollNationalPensionCapKrwChange={setPayrollNationalPensionCapKrw}
          onPayrollHealthInsuranceCapKrwChange={setPayrollHealthInsuranceCapKrw}
          onPayrollEmploymentInsuranceCapKrwChange={setPayrollEmploymentInsuranceCapKrw}
          onLastPayrollRunIdChange={setLastPayrollRunId}
          onPreviewPayroll={() => void previewPayroll()}
          onConfirmPayroll={() => void confirmPayroll(lastPayrollRunId)}
          onResetPayrollPresetShareContext={resetPayrollPresetShareContext}
          onReapplyPayrollPresetShareContext={reapplyPayrollPresetShareContext}
          onClearManualIncomeSplitItems={() => {
            setPayrollTaxableItems([createEmptyPayrollKrIncomeSplitItemDraft()]);
            setPayrollNonTaxableItems([createEmptyPayrollKrIncomeSplitItemDraft()]);
          }}
        />

        <AdminDebugLogsPanel
          showDevTools={showDevTools}
          isKoLocale={isKoLocale}
          logs={logs}
          logStatusLabels={logStatusLabels}
          onClearLogs={clearLogs}
        />
      </section>
    </main>
  );
}
