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
import { buildAdminDashboardActions } from "@/app/admin/page-dashboard-actions";
import { buildAdminDirectoryActions } from "@/app/admin/page-directory-actions";
import {
  isDefaultDemoOrganizationName,
  resolveAdminLocaleLabelBundle
} from "@/app/admin/page-locale-helpers";
import {
  buildAdminQueueDerivedState,
  summarizeAdminApiLogs
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
  type ApprovalActivity,
  type AttendanceQueueSort,
  type LeaveQueueSort,
  type PayrollQueueSort,
  type QueueFocus,
  type QueueMobileApprovalFeedback,
  type QueueSearchScope,
  type QueueSearchSortOption,
  type QueueSearchSortScope
} from "@/components/admin-approval/approval-queue-types";
import { AdminCompensationPanels } from "@/app/admin/page-compensation-panels";
import { AdminDashboardChrome } from "@/components/admin-dashboard/AdminDashboardChrome";
import { AdminOnboardingAccountPanels } from "@/components/admin-dashboard/AdminOnboardingAccountPanels";
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

  const queueNowMs = Date.now();
  const {
    queueBadgeSummaries,
    activeQueueBadgeSummary,
    queueAlertOverview,
    filteredQueueSearchSortRows
  } = useMemo(
    () =>
      buildAdminQueueDerivedState({
        pendingAttendance,
        pendingLeave,
        previewedPayroll,
        approvalQueueFocus,
        approvalQueueOnlyUrgent,
        approvalQueueSelectedOnly,
        selectedAttendanceIds,
        selectedLeaveIds,
        approvalQueueSearch,
        approvalQueueSearchScope,
        attendanceQueueSort,
        leaveQueueSort,
        payrollQueueSort,
        queueSearchSortScope,
        queueSearchSortQuery,
        queueSearchSortOption,
        queueSlaWatchHoursInput,
        queueSlaCriticalHoursInput,
        queueLabels,
        queueNowMs
      }),
    [
      approvalQueueFocus,
      approvalQueueOnlyUrgent,
      approvalQueueSearch,
      approvalQueueSearchScope,
      approvalQueueSelectedOnly,
      attendanceQueueSort,
      leaveQueueSort,
      pendingAttendance,
      pendingLeave,
      payrollQueueSort,
      previewedPayroll,
      queueLabels,
      queueNowMs,
      queueSearchSortOption,
      queueSearchSortQuery,
      queueSearchSortScope,
      queueSlaCriticalHoursInput,
      queueSlaWatchHoursInput,
      selectedAttendanceIds,
      selectedLeaveIds
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

  const directoryActions = buildAdminDirectoryActions({
    callApi,
    buildQuery,
    toIso,
    runtimeLocale,
    organizationId,
    organizationName,
    setOrganizationId,
    employeeId,
    employeeName,
    employeeEmail,
    employeeActive,
    setEmployeeId,
    setEmployees,
    setAccrualEmployeeId,
    setScheduleEmployeeId,
    setInviteActorId,
    inviteEmail,
    inviteRole,
    inviteDeliveryMode,
    inviteActorId,
    setInviteResult,
    periodStart,
    periodEnd,
    scheduleEmployeeId,
    scheduleStartAt,
    scheduleEndAt,
    scheduleBreakMinutes,
    scheduleIsHoliday,
    scheduleNotes,
    setSchedules,
    setOrganizations,
    setLogs,
    confirmScheduleDelete: (scheduleId) => window.confirm(`근무 일정을 삭제할까요?\n\nID: ${scheduleId}`)
  });

  const dashboardActions = buildAdminDashboardActions({
    callApi,
    buildQuery,
    toIso,
    runtimeLocale,
    periodStart,
    periodEnd,
    organizationId,
    setPendingAttendance,
    setPendingLeave,
    setPreviewedPayroll,
    setLastPayrollRunId,
    setLogs,
    setAccrualResult,
    setLeaveAllowHalfDay,
    setLeaveAllowHourly,
    setLeaveHourlyIncrementMinutes,
    setLeaveMaxHoursPerRequest,
    setLeaveMinNoticeDays,
    setLeaveMaxConsecutiveDays,
    setAccrualGrantDays,
    setAccrualCarryCapDays,
    aggregateEmployeeId,
    setAggregates,
    accrualEmployeeId,
    accrualYear,
    accrualGrantDays,
    accrualCarryCapDays,
    leaveAllowHalfDay,
    leaveAllowHourly,
    leaveHourlyIncrementMinutes,
    leaveMaxHoursPerRequest,
    leaveMinNoticeDays,
    leaveMaxConsecutiveDays,
    payrollPreviewMode,
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
    setApprovalActivities,
    setMobileApprovalFeedback
  });

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
        onRefreshDashboard={() => void dashboardActions.refreshDashboard()}
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
          onCreateOrganization={() => void directoryActions.createOrganization()}
          onListOrganizations={() => void directoryActions.listOrganizations()}
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
          onCreateEmployee={() => void directoryActions.createEmployee()}
          onListEmployees={() => void directoryActions.listEmployees()}
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
          onCreateInvite={() => void directoryActions.createInvite()}
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
          onCreateSchedule={() => void directoryActions.createSchedule()}
          onListSchedules={() => void directoryActions.listSchedules()}
          onDeleteSchedule={(scheduleId) => void directoryActions.deleteSchedule(scheduleId)}
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
          onRefreshInbox={() => void dashboardActions.refreshInbox()}
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

        <AdminCompensationPanels
          isKoLocale={isKoLocale}
          showDevTools={showDevTools}
          organizationId={organizationId}
          employeeId={employeeId}
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
          updatedAtLabel={updatedAtLabel}
          formatDateTimeByLocale={formatDateTimeByLocale}
          minutesToHours={minutesToHours}
          formatDays={formatDays}
          onAggregateEmployeeIdChange={setAggregateEmployeeId}
          onListAttendanceAggregates={() => void dashboardActions.listAttendanceAggregates()}
          onListAttendanceAggregatesAll={() => {
            setAggregateEmployeeId("");
            void dashboardActions.listAttendanceAggregates({ employeeId: "" });
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
          onLoadLeavePolicy={() => void dashboardActions.loadLeavePolicy()}
          onSaveLeavePolicy={() => void dashboardActions.saveLeavePolicy()}
          onSettleLeaveAccrual={() => void dashboardActions.settleLeaveAccrual()}
          payrollPreviewMode={payrollPreviewMode}
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
          logs={logs}
          logStatusLabels={logStatusLabels}
          onEmployeeIdChange={setEmployeeId}
          onPayrollPreviewModeChange={setPayrollPreviewMode}
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
          onPreviewPayroll={() => void dashboardActions.previewPayroll()}
          onConfirmPayroll={() => void dashboardActions.confirmPayroll(lastPayrollRunId)}
          onResetPayrollPresetShareContext={resetPayrollPresetShareContext}
          onReapplyPayrollPresetShareContext={reapplyPayrollPresetShareContext}
          onClearManualIncomeSplitItems={() => {
            setPayrollTaxableItems([createEmptyPayrollKrIncomeSplitItemDraft()]);
            setPayrollNonTaxableItems([createEmptyPayrollKrIncomeSplitItemDraft()]);
          }}
          onClearLogs={dashboardActions.clearLogs}
        />
      </section>
    </main>
  );
}
