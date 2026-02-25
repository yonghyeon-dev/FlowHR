"use client";

import { useCallback, useMemo } from "react";

import {
  buildQuery,
  formatDateTime,
  isTruthyFlag,
  toIso
} from "@/app/admin/page-helpers";
import { performAdminApiCall } from "@/app/admin/page-api-helpers";
import { buildAdminDashboardActions } from "@/app/admin/page-dashboard-actions";
import { buildAdminDirectoryActions } from "@/app/admin/page-directory-actions";
import { AdminDashboardPanels } from "@/app/admin/page-panels";
import { resolveAdminLocaleLabelBundle } from "@/app/admin/page-locale-helpers";
import {
  buildAdminQueueDerivedState,
  summarizeAdminApiLogs
} from "@/app/admin/page-queue-helpers";
import { useAdminDashboardState } from "@/app/admin/page-state";
import { AdminDashboardChrome } from "@/components/admin-dashboard/AdminDashboardChrome";
import { useSupabaseSession } from "@/lib/client/useSupabaseSession";
import { useI18n } from "@/lib/i18n/provider";

export default function AdminDashboardPage() {
  const showDevTools = isTruthyFlag(process.env.NEXT_PUBLIC_FLOWHR_DEV_TOOLS);
  const { locale } = useI18n();
  const isKoLocale = locale === "ko";
  const runtimeLocale = isKoLocale ? "ko-KR" : "en-US";
  const localeLabelBundle = useMemo(() => resolveAdminLocaleLabelBundle(isKoLocale), [isKoLocale]);

  const isProductionRuntime = process.env.NODE_ENV === "production";
  const { snapshot: supabaseSession, error: supabaseSessionError } = useSupabaseSession();

  const pageState = useAdminDashboardState({
    demoOrganizationName: localeLabelBundle.demoOrganizationName,
    isProductionRuntime,
    supabaseOrganizationId: supabaseSession?.organizationId
  });

  const {
    accessToken,
    organizationId,
    setOrganizationId,
    adminActorId,
    organizationName,
    setOrganizations,
    periodStart,
    periodEnd,
    setEmployees,
    employeeId,
    setEmployeeId,
    employeeName,
    employeeEmail,
    employeeActive,
    inviteEmail,
    inviteRole,
    inviteDeliveryMode,
    inviteActorId,
    setInviteActorId,
    setInviteResult,
    scheduleEmployeeId,
    setScheduleEmployeeId,
    scheduleIsHoliday,
    scheduleStartAt,
    scheduleEndAt,
    scheduleBreakMinutes,
    scheduleNotes,
    setSchedules,
    pendingAttendance,
    setPendingAttendance,
    pendingLeave,
    setPendingLeave,
    previewedPayroll,
    setPreviewedPayroll,
    selectedAttendanceIds,
    selectedLeaveIds,
    approvalQueueFocus,
    approvalQueueSearch,
    approvalQueueSearchScope,
    approvalQueueOnlyUrgent,
    approvalQueueSelectedOnly,
    attendanceQueueSort,
    leaveQueueSort,
    payrollQueueSort,
    queueSearchSortScope,
    queueSearchSortQuery,
    queueSearchSortOption,
    aggregateEmployeeId,
    setAggregates,
    accrualEmployeeId,
    setAccrualEmployeeId,
    accrualYear,
    accrualGrantDays,
    setAccrualGrantDays,
    accrualCarryCapDays,
    setAccrualCarryCapDays,
    leaveAllowHalfDay,
    setLeaveAllowHalfDay,
    leaveAllowHourly,
    setLeaveAllowHourly,
    leaveHourlyIncrementMinutes,
    setLeaveHourlyIncrementMinutes,
    leaveMaxHoursPerRequest,
    setLeaveMaxHoursPerRequest,
    leaveMinNoticeDays,
    setLeaveMinNoticeDays,
    leaveMaxConsecutiveDays,
    setLeaveMaxConsecutiveDays,
    setAccrualResult,
    payrollHourlyRateKrw,
    payrollPreviewMode,
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
    setLastPayrollRunId,
    logs,
    setLogs,
    setApprovalActivities,
    setMobileApprovalFeedback,
    pendingLabel,
    setPendingLabel,
  } = pageState;

  const queueSlaWatchHoursInput = "24";
  const queueSlaCriticalHoursInput = "48";

  const bearerToken =
    accessToken.trim().length > 0
      ? accessToken.trim()
      : isProductionRuntime
        ? (supabaseSession?.accessToken ?? "")
        : "";

  const usesBearerToken = bearerToken.trim().length > 0;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? localeLabelBundle.notConfiguredLabel;

  const stats = useMemo(() => {
    return summarizeAdminApiLogs(logs);
  }, [logs]);

  const { queueLabels, logStatusLabels } = localeLabelBundle;
  const formatDateTimeByLocale = useCallback(
    (value: string | null) => formatDateTime(value, runtimeLocale),
    [runtimeLocale]
  );

  const queueNowMs = Date.now();
  const queueDerivedState = useMemo(
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
      <AdminDashboardPanels
        isKoLocale={isKoLocale}
        showDevTools={showDevTools}
        isProductionRuntime={isProductionRuntime}
        usesBearerToken={usesBearerToken}
        supabaseUrl={supabaseUrl}
        supabaseSession={supabaseSession}
        supabaseSessionError={supabaseSessionError}
        localeLabelBundle={localeLabelBundle}
        pageState={pageState}
        directoryActions={directoryActions}
        dashboardActions={dashboardActions}
        queueDerivedState={queueDerivedState}
        formatDateTimeByLocale={formatDateTimeByLocale}
      />
    </main>
  );
}
