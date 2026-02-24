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
import { performAdminApiCall } from "@/app/admin/page-api-helpers";
import {
  buildAdminValidationFailureLog,
  createEmployeeFromHelper,
  createInviteFromHelper,
  createOrganizationFromHelper,
  createScheduleFromHelper,
  deleteScheduleFromHelper,
  listAttendanceAggregatesFromHelper,
  listEmployeesFromHelper,
  listOrganizationsFromHelper,
  listSchedulesFromHelper,
  loadLeavePolicyFromHelper,
  saveLeavePolicyFromHelper
} from "@/app/admin/page-action-helpers";
import { buildAdminPayrollPreviewRequest } from "@/app/admin/page-payroll-helpers";
import {
  isDefaultDemoOrganizationName,
  resolveAdminLocaleLabelBundle
} from "@/app/admin/page-locale-helpers";
import {
  buildQueueBadgeSummaries,
  buildQueueSearchSortRows,
  filterPendingAttendanceQueue,
  filterPendingLeaveQueue,
  filterPreviewedPayrollQueue,
  filterQueueSearchSortRows,
  resolveQueueSlaCriticalHours,
  resolveQueueSlaWatchHours,
  summarizeAdminApiLogs,
  summarizeQueueAlertOverview,
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
import { toQueueAlertLevelByRule } from "@/components/admin-approval/approval-queue-helpers";
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
  const runtimeLocale = isKoLocale ? "ko-KR" : "en-US";
  const localeLabelBundle = useMemo(() => resolveAdminLocaleLabelBundle(isKoLocale), [isKoLocale]);

  const [accessToken, setAccessToken] = useState("");
  const [organizationId, setOrganizationId] = useStickyStringState("flowhr:ctx:organizationId", "");
  const [adminActorId, setAdminActorId] = useStickyStringState("flowhr:ctx:adminId", "ADM-1001");
  const [organizationName, setOrganizationName] = useState<string>(
    localeLabelBundle.demoOrganizationName
  );
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([]);

  useEffect(() => {
    setOrganizationName((previous) => {
      if (!isDefaultDemoOrganizationName(previous)) {
        return previous;
      }
      return localeLabelBundle.demoOrganizationName;
    });
  }, [localeLabelBundle.demoOrganizationName]);

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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? localeLabelBundle.notConfiguredLabel;

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
    return summarizeAdminApiLogs(logs);
  }, [logs]);

  const {
    queueLabels,
    workTypeLabels,
    logStatusLabels,
    inviteRoleLabels,
    inviteDeliveryModeLabels,
    updatedAtLabel
  } = localeLabelBundle;
  const toInviteRoleLabel = (role: string) =>
    inviteRoleLabels[role as keyof typeof inviteRoleLabels] ?? role;
  const toInviteDeliveryModeLabel = (mode: string) =>
    inviteDeliveryModeLabels[mode as keyof typeof inviteDeliveryModeLabels] ?? mode;
  const formatDateTimeByLocale = useCallback(
    (value: string | null) => formatDateTime(value, runtimeLocale),
    [runtimeLocale]
  );

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
    () =>
      buildQueueBadgeSummaries({
        queueLabels,
        queueSlaWatchHours,
        queueSlaCriticalHours,
        pendingAttendanceCount: pendingAttendance.length,
        pendingLeaveCount: pendingLeave.length,
        previewedPayrollCount: previewedPayroll.length,
        filteredPendingAttendanceCount: filteredPendingAttendance.length,
        filteredPendingLeaveCount: filteredPendingLeave.length,
        filteredPreviewedPayrollCount: filteredPreviewedPayroll.length,
        attendanceWaitHoursValues,
        leaveWaitHoursValues,
        payrollWaitHoursValues
      }),
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
      queueLabels,
      queueSlaCriticalHours,
      queueSlaWatchHours
    ]
  );

  const activeQueueBadgeSummary =
    queueBadgeSummaries.find((badge) => badge.focus === approvalQueueFocus) ?? queueBadgeSummaries[0];

  const queueAlertOverview = useMemo(
    () => summarizeQueueAlertOverview(queueBadgeSummaries),
    [queueBadgeSummaries]
  );

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
    try {
      const { response, body, log } = await performAdminApiCall({
        label,
        method,
        path,
        payload,
        usesBearerToken,
        bearerToken,
        adminActorId,
        organizationId,
        runtimeLocale,
        omitOrganizationHeader: options?.omitOrganizationHeader
      });
      setLogs((prev) => [log, ...prev]);

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
        at: new Date().toLocaleString(runtimeLocale)
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
      at: new Date().toLocaleString(runtimeLocale)
    });
  }

  async function listEmployees() {
    const nextEmployees = await listEmployeesFromHelper({
      callApi,
      organizationId,
      buildQuery
    });
    if (!nextEmployees) {
      return;
    }
    setEmployees(nextEmployees);
  }

  async function createEmployee() {
    const result = await createEmployeeFromHelper({
      callApi,
      employeeId,
      organizationId,
      employeeName,
      employeeEmail,
      employeeActive
    });
    if (!result.ok) {
      return;
    }
    if (result.createdEmployeeId) {
      setEmployeeId(result.createdEmployeeId);
      setAccrualEmployeeId(result.createdEmployeeId);
      setScheduleEmployeeId(result.createdEmployeeId);
      setInviteActorId(result.createdEmployeeId);
    }
    await listEmployees();
  }

  async function createInvite() {
    setInviteResult(null);
    const nextInviteResult = await createInviteFromHelper({
      callApi,
      inviteEmail,
      inviteRole,
      inviteDeliveryMode,
      organizationId,
      inviteActorId
    });
    if (nextInviteResult) {
      setInviteResult(nextInviteResult);
    }
  }

  async function listSchedules() {
    const nextSchedules = await listSchedulesFromHelper({
      callApi,
      periodStart,
      periodEnd,
      scheduleEmployeeId,
      toIso,
      buildQuery
    });
    if (!nextSchedules) {
      return;
    }
    setSchedules(nextSchedules);
  }

  async function createSchedule() {
    const created = await createScheduleFromHelper({
      callApi,
      scheduleEmployeeId,
      scheduleStartAt,
      scheduleEndAt,
      scheduleBreakMinutes,
      scheduleIsHoliday,
      scheduleNotes,
      toIso
    });
    if (!created) {
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

    const deleted = await deleteScheduleFromHelper({
      callApi,
      scheduleId
    });
    if (!deleted) {
      return;
    }
    setSchedules((prev) => prev.filter((item) => item.id !== scheduleId));
  }

  async function listOrganizations() {
    const nextOrganizations = await listOrganizationsFromHelper({
      callApi
    });
    if (!nextOrganizations) {
      return;
    }
    setOrganizations(nextOrganizations);
  }

  async function createOrganization() {
    const name = organizationName.trim();
    if (!name) {
      setLogs((prev) => [
        buildAdminValidationFailureLog({
          label: "조직 생성",
          error: "조직 이름이 필요합니다.",
          runtimeLocale
        }),
        ...prev
      ]);
      return;
    }

    const createdId = await createOrganizationFromHelper({
      callApi,
      organizationName
    });
    if (createdId) {
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
    const previewRequest = buildAdminPayrollPreviewRequest({
      payrollPreviewMode,
      periodStart,
      periodEnd,
      employeeId,
      payrollHourlyRateKrw,
      payrollNonTaxableIncomeKrw,
      payrollTaxableIncomeKrw,
      payrollTaxableItems,
      payrollNonTaxableItems,
      payrollIncomeSplitItemPresetId,
      payrollOtherDeductionsKrw,
      payrollAdditionalTaxCreditKrw,
      payrollDependentCount,
      payrollDependentTaxCreditPerPersonKrw,
      payrollIncomeTaxLookupPresetId,
      payrollIncomeTaxLookupPresetAuto,
      payrollIncomeTaxLookupAsOf,
      payrollRequireMonthlyBoundary,
      payrollNationalPensionCapKrw,
      payrollHealthInsuranceCapKrw,
      payrollEmploymentInsuranceCapKrw,
      toIso
    });

    if (previewRequest.hasBlockingConsistencyIssues) {
      setLogs((prev) => [
        {
          id: Date.now(),
          label: "Payroll preview (client consistency guard)",
          status: 400,
          ok: false,
          durationMs: 0,
          at: new Date().toLocaleString(runtimeLocale),
          body: {
            error: "Fix split-item rows before submit.",
            details: previewRequest.consistencySummary
          }
        },
        ...prev
      ]);
      return;
    }

    const { response, body } = await callApi(previewRequest.label, "POST", previewRequest.path, previewRequest.payload);
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
    if (!organizationId.trim()) {
      setLogs((prev) => [
        buildAdminValidationFailureLog({
          label: "휴가 정책 조회",
          error: "조직 ID가 필요합니다.",
          runtimeLocale
        }),
        ...prev
      ]);
      return;
    }

    const policy = await loadLeavePolicyFromHelper({
      callApi,
      organizationId,
      buildQuery
    });
    if (!policy) {
      return;
    }

    if (typeof policy.annualGrantDays === "number") {
      setAccrualGrantDays(String(policy.annualGrantDays));
    }
    if (typeof policy.carryOverCapDays === "number") {
      setAccrualCarryCapDays(String(policy.carryOverCapDays));
    }
    if (typeof policy.allowHalfDay === "boolean") {
      setLeaveAllowHalfDay(policy.allowHalfDay);
    }
    if (typeof policy.allowHourly === "boolean") {
      setLeaveAllowHourly(policy.allowHourly);
    }
    if (typeof policy.hourlyIncrementMinutes === "number") {
      setLeaveHourlyIncrementMinutes(String(policy.hourlyIncrementMinutes));
    }
    if (typeof policy.maxHoursPerRequest === "number") {
      setLeaveMaxHoursPerRequest(String(policy.maxHoursPerRequest));
    }
    if (typeof policy.minNoticeDays === "number") {
      setLeaveMinNoticeDays(String(policy.minNoticeDays));
    }
    if (typeof policy.maxConsecutiveDays === "number") {
      setLeaveMaxConsecutiveDays(String(policy.maxConsecutiveDays));
    } else if (policy.maxConsecutiveDays === null) {
      setLeaveMaxConsecutiveDays("");
    }
  }

  async function saveLeavePolicy() {
    if (!organizationId.trim()) {
      setLogs((prev) => [
        buildAdminValidationFailureLog({
          label: "휴가 정책 저장",
          error: "조직 ID가 필요합니다.",
          runtimeLocale
        }),
        ...prev
      ]);
      return;
    }

    await saveLeavePolicyFromHelper({
      callApi,
      organizationId,
      accrualGrantDays,
      accrualCarryCapDays,
      leaveAllowHalfDay,
      leaveAllowHourly,
      leaveHourlyIncrementMinutes,
      leaveMaxHoursPerRequest,
      leaveMinNoticeDays,
      leaveMaxConsecutiveDays
    });
  }

  async function listAttendanceAggregates(options?: { employeeId?: string }) {
    const nextAggregates = await listAttendanceAggregatesFromHelper({
      callApi,
      periodStart,
      periodEnd,
      aggregateEmployeeId,
      employeeIdOverride: options?.employeeId,
      toIso,
      buildQuery
    });
    if (!nextAggregates) {
      return;
    }
    setAggregates(nextAggregates);
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
          formatDateTime={formatDateTimeByLocale}
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
          formatDateTime={formatDateTimeByLocale}
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
