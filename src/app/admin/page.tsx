"use client";

import Link from "next/link";
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
  toLocalInputValue,
  toTimestamp,
  toWaitHours
} from "@/app/admin/page-helpers";
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
  matchesQueueSearch,
  matchesQueueSearchSort,
  queueAlertLevelRank,
  sortQueueSearchSortRows,
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
import { PayrollKrIncomeSplitGuideField } from "@/components/payroll/PayrollKrIncomeSplitGuideField";
import { PayrollKrIncomeSplitConsistencyGuidePanel } from "@/components/payroll/PayrollKrIncomeSplitConsistencyGuidePanel";
import { PayrollKrIncomeSplitPresetPayloadPreviewPanel } from "@/components/payroll/PayrollKrIncomeSplitPresetPayloadPreviewPanel";
import {
  PayrollKrPresetShareLinkFeedbackPanel,
  type PayrollKrPresetShareLinkFeedback
} from "@/components/payroll/PayrollKrPresetShareLinkFeedbackPanel";
import {
  createEmptyPayrollKrIncomeSplitItemDraft,
  PayrollKrIncomeSplitItemsTable,
  type PayrollKrIncomeSplitItemDraft
} from "@/components/payroll/PayrollKrIncomeSplitItemsTable";
import { PayrollKrIncomeSplitItemPresetField } from "@/components/payroll/PayrollKrIncomeSplitItemPresetField";
import { PayrollKrPresetGuidePanel } from "@/components/payroll/PayrollKrPresetGuidePanel";
import { analyzePayrollKrIncomeSplitDraftConsistency } from "@/features/payroll/kr-income-split-item-consistency";
import {
  hasPayrollKrPresetShareContext,
  parsePayrollKrPresetShareContext,
  resolvePayrollKrPresetShareContext
} from "@/features/payroll/kr-preset-share-context";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useStickyStringState } from "@/lib/client/useStickyState";

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
        label: "출퇴근",
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
        label: "휴가",
        pending: pendingLeave.length,
        visible: filteredPendingLeave.length,
        selected: 0,
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
    const attendanceRows = filteredPendingAttendance.map((record) => ({
      key: `attendance:${record.id}`,
      queue: "attendance" as const,
      queueLabel: "attendance",
      itemId: record.id,
      employeeId: record.employeeId,
      waitHours: attendanceWaitHoursById.get(record.id) ?? 0,
      waitedAtMs: toTimestamp(record.checkInAt),
      severity: resolveQueueAlertLevel(attendanceWaitHoursById.get(record.id) ?? 0),
      selected: false,
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
      selected: false,
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
    resolveQueueAlertLevel
  ]);

  const filteredQueueSearchSortRows = useMemo(() => {
    const normalizedQuery = queueSearchSortQuery.trim().toLowerCase();
    const filteredRows = queueSearchSortRows.filter((row) =>
      matchesQueueSearchSort(queueSearchSortScope, normalizedQuery, row)
    );

    return sortQueueSearchSortRows(filteredRows, queueSearchSortOption).slice(0, 18);
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
                <div className="full">
                  <PayrollKrIncomeSplitGuideField
                    taxableIncomeKrw={payrollTaxableIncomeKrw}
                    onTaxableIncomeKrwChange={setPayrollTaxableIncomeKrw}
                  />
                </div>
                <div className="full">
                  <PayrollKrIncomeSplitItemPresetField
                    selectedPresetId={payrollIncomeSplitItemPresetId}
                    onPresetChange={setPayrollIncomeSplitItemPresetId}
                  />
                </div>
                <div className="full">
                  <PayrollKrIncomeSplitPresetPayloadPreviewPanel
                    selectedPresetId={payrollIncomeSplitItemPresetId}
                    taxableIncomeKrw={payrollTaxableIncomeKrw}
                    nonTaxableIncomeKrw={payrollNonTaxableIncomeKrw}
                  />
                </div>
                <div className="full">
                  <PayrollKrPresetShareLinkFeedbackPanel
                    feedback={payrollPresetShareLinkFeedback}
                    onResetAppliedValues={resetPayrollPresetShareContext}
                    onReapplyQueryValues={reapplyPayrollPresetShareContext}
                  />
                </div>
                <div className="full">
                  <PayrollKrIncomeSplitItemsTable
                    taxableItems={payrollTaxableItems}
                    onTaxableItemsChange={setPayrollTaxableItems}
                    nonTaxableItems={payrollNonTaxableItems}
                    onNonTaxableItemsChange={setPayrollNonTaxableItems}
                    disabled={payrollIncomeSplitItemPresetId.trim().length > 0}
                  />
                </div>
                <div className="full">
                  <PayrollKrIncomeSplitConsistencyGuidePanel
                    taxableItems={payrollTaxableItems}
                    nonTaxableItems={payrollNonTaxableItems}
                    selectedPresetId={payrollIncomeSplitItemPresetId}
                    onClearManualItems={() => {
                      setPayrollTaxableItems([createEmptyPayrollKrIncomeSplitItemDraft()]);
                      setPayrollNonTaxableItems([createEmptyPayrollKrIncomeSplitItemDraft()]);
                    }}
                  />
                </div>
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
                <div className="full">
                  <PayrollKrPresetGuidePanel
                    selectedPresetId={payrollIncomeTaxLookupPresetId}
                    onPresetChange={setPayrollIncomeTaxLookupPresetId}
                    presetAutoEnabled={payrollIncomeTaxLookupPresetAuto}
                    onPresetAutoEnabledChange={(enabled) => {
                      setPayrollIncomeTaxLookupPresetAuto(enabled);
                      if (enabled) {
                        setPayrollIncomeTaxLookupPresetId("");
                      }
                    }}
                    presetAsOfInput={payrollIncomeTaxLookupAsOf}
                    onPresetAsOfInputChange={setPayrollIncomeTaxLookupAsOf}
                  />
                </div>
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
