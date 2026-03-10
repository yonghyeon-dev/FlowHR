"use client";

import { formatDays, minutesToHours } from "@/app/admin/page-helpers";
import { resolveAdminLocaleLabelBundle } from "@/app/admin/page-locale-helpers";
import { buildAdminQueueDerivedState } from "@/app/admin/page-queue-helpers";
import { useAdminDashboardState } from "@/app/admin/page-state";
import { buildAdminDashboardActions } from "@/app/admin/page-dashboard-actions";
import { buildAdminDirectoryActions } from "@/app/admin/page-directory-actions";
import { AdminCompensationPanels } from "@/app/admin/page-compensation-panels";
import { ApprovalQueuePanel } from "@/components/admin-approval/ApprovalQueuePanel";
import { AdminOnboardingAccountPanels } from "@/components/admin-dashboard/AdminOnboardingAccountPanels";
import { AdminPeopleInvitePanels } from "@/components/admin-dashboard/AdminPeopleInvitePanels";
import { AdminSchedulingPanel } from "@/components/admin-dashboard/AdminSchedulingPanel";
import { createEmptyPayrollKrIncomeSplitItemDraft } from "@/components/payroll/PayrollKrIncomeSplitItemsTable";
import type { SupabaseSessionSnapshot } from "@/lib/client/useSupabaseSession";

type AdminDashboardPanelsProps = {
  isKoLocale: boolean;
  showDevTools: boolean;
  isProductionRuntime: boolean;
  usesBearerToken: boolean;
  supabaseUrl: string;
  supabaseSession: SupabaseSessionSnapshot | null;
  supabaseSessionError: string | null;
  localeLabelBundle: ReturnType<typeof resolveAdminLocaleLabelBundle>;
  pageState: ReturnType<typeof useAdminDashboardState>;
  directoryActions: ReturnType<typeof buildAdminDirectoryActions>;
  dashboardActions: ReturnType<typeof buildAdminDashboardActions>;
  queueDerivedState: ReturnType<typeof buildAdminQueueDerivedState>;
  formatDateTimeByLocale: (value: string | null) => string;
};

export function AdminDashboardPanels({
  isKoLocale, showDevTools, isProductionRuntime, usesBearerToken, supabaseUrl, supabaseSession, supabaseSessionError,
  localeLabelBundle, pageState, directoryActions, dashboardActions, queueDerivedState, formatDateTimeByLocale
}: AdminDashboardPanelsProps) {
  const { queueBadgeSummaries, activeQueueBadgeSummary, queueAlertOverview, filteredQueueSearchSortRows } =
    queueDerivedState;
  const { workTypeLabels, logStatusLabels, inviteRoleLabels, inviteDeliveryModeLabels, updatedAtLabel } =
    localeLabelBundle;

  const toInviteRoleLabel = (role: string) =>
    inviteRoleLabels[role as keyof typeof inviteRoleLabels] ?? role;
  const toInviteDeliveryModeLabel = (mode: string) =>
    inviteDeliveryModeLabels[mode as keyof typeof inviteDeliveryModeLabels] ?? mode;

  return (
    <section className="panel-grid">
      <AdminOnboardingAccountPanels
        isKoLocale={isKoLocale}
        showDevTools={showDevTools}
        isProductionRuntime={isProductionRuntime}
        usesBearerToken={usesBearerToken}
        organizationId={pageState.organizationId}
        organizationName={pageState.organizationName}
        organizations={pageState.organizations}
        adminActorId={pageState.adminActorId}
        accessToken={pageState.accessToken}
        supabaseUrl={supabaseUrl}
        supabaseSession={supabaseSession}
        supabaseSessionError={supabaseSessionError}
        onOrganizationNameChange={pageState.setOrganizationName}
        onCreateOrganization={() => void directoryActions.createOrganization()}
        onListOrganizations={() => void directoryActions.listOrganizations()}
        onSelectOrganization={pageState.setOrganizationId}
        onOrganizationIdChange={pageState.setOrganizationId}
        onAdminActorIdChange={pageState.setAdminActorId}
        onAccessTokenChange={pageState.setAccessToken}
      />
      <AdminPeopleInvitePanels
        isKoLocale={isKoLocale}
        organizationId={pageState.organizationId}
        employeeId={pageState.employeeId}
        employeeName={pageState.employeeName}
        employeeEmail={pageState.employeeEmail}
        employeeActive={pageState.employeeActive}
        employees={pageState.employees}
        inviteEmail={pageState.inviteEmail}
        inviteRole={pageState.inviteRole}
        inviteDeliveryMode={pageState.inviteDeliveryMode}
        inviteActorId={pageState.inviteActorId}
        inviteResult={pageState.inviteResult}
        inviteRoleLabels={inviteRoleLabels}
        inviteDeliveryModeLabels={inviteDeliveryModeLabels}
        toInviteRoleLabel={toInviteRoleLabel}
        toInviteDeliveryModeLabel={toInviteDeliveryModeLabel}
        onEmployeeIdChange={pageState.setEmployeeId}
        onEmployeeNameChange={pageState.setEmployeeName}
        onEmployeeEmailChange={pageState.setEmployeeEmail}
        onEmployeeActiveChange={pageState.setEmployeeActive}
        onCreateEmployee={() => void directoryActions.createEmployee()}
        onListEmployees={() => void directoryActions.listEmployees()}
        onApplyEmployee={(id) => {
          pageState.setEmployeeId(id);
          pageState.setAccrualEmployeeId(id);
          pageState.setAggregateEmployeeId(id);
          pageState.setScheduleEmployeeId(id);
          pageState.setInviteActorId(id);
        }}
        onInviteEmailChange={pageState.setInviteEmail}
        onInviteRoleChange={pageState.setInviteRole}
        onInviteDeliveryModeChange={pageState.setInviteDeliveryMode}
        onInviteActorIdChange={pageState.setInviteActorId}
        onOrganizationIdChange={pageState.setOrganizationId}
        onCreateInvite={() => void directoryActions.createInvite()}
      />
      <AdminSchedulingPanel
        scheduleEmployeeId={pageState.scheduleEmployeeId}
        scheduleIsHoliday={pageState.scheduleIsHoliday}
        scheduleStartAt={pageState.scheduleStartAt}
        scheduleEndAt={pageState.scheduleEndAt}
        scheduleBreakMinutes={pageState.scheduleBreakMinutes}
        scheduleNotes={pageState.scheduleNotes}
        periodStart={pageState.periodStart}
        periodEnd={pageState.periodEnd}
        schedules={pageState.schedules}
        workTypeLabels={workTypeLabels}
        formatDateTime={formatDateTimeByLocale}
        onScheduleEmployeeIdChange={pageState.setScheduleEmployeeId}
        onScheduleIsHolidayChange={pageState.setScheduleIsHoliday}
        onScheduleStartAtChange={pageState.setScheduleStartAt}
        onScheduleEndAtChange={pageState.setScheduleEndAt}
        onScheduleBreakMinutesChange={pageState.setScheduleBreakMinutes}
        onScheduleNotesChange={pageState.setScheduleNotes}
        onPeriodStartChange={pageState.setPeriodStart}
        onPeriodEndChange={pageState.setPeriodEnd}
        onCreateSchedule={() => void directoryActions.createSchedule()}
        onListSchedules={() => void directoryActions.listSchedules()}
        onDeleteSchedule={(scheduleId) => void directoryActions.deleteSchedule(scheduleId)}
      />
      <ApprovalQueuePanel
        queueBadgeSummaries={queueBadgeSummaries}
        approvalQueueFocus={pageState.approvalQueueFocus}
        queueAlertOverview={queueAlertOverview}
        periodStart={pageState.periodStart}
        periodEnd={pageState.periodEnd}
        approvalQueueSearchScope={pageState.approvalQueueSearchScope}
        approvalQueueSearch={pageState.approvalQueueSearch}
        approvalQueueOnlyUrgent={pageState.approvalQueueOnlyUrgent}
        approvalQueueSelectedOnly={pageState.approvalQueueSelectedOnly}
        attendanceRejectReason={pageState.attendanceRejectReason}
        leaveRejectReason={pageState.leaveRejectReason}
        activeQueueBadgeSummary={activeQueueBadgeSummary}
        queueSearchSortScope={pageState.queueSearchSortScope}
        queueSearchSortOption={pageState.queueSearchSortOption}
        queueSearchSortQuery={pageState.queueSearchSortQuery}
        filteredQueueSearchSortRows={filteredQueueSearchSortRows}
        approvalActivities={pageState.approvalActivities}
        onRefreshInbox={() => void dashboardActions.refreshInbox()}
        onApprovalQueueFocusChange={pageState.setApprovalQueueFocus}
        onPeriodStartChange={pageState.setPeriodStart}
        onPeriodEndChange={pageState.setPeriodEnd}
        onApprovalQueueSearchScopeChange={pageState.setApprovalQueueSearchScope}
        onApprovalQueueSearchChange={pageState.setApprovalQueueSearch}
        onToggleUrgentOnly={() => pageState.setApprovalQueueOnlyUrgent((prev) => !prev)}
        onToggleSelectedOnly={() => pageState.setApprovalQueueSelectedOnly((prev) => !prev)}
        onResetQuickFilters={() => {
          pageState.setApprovalQueueOnlyUrgent(false);
          pageState.setApprovalQueueSelectedOnly(false);
          pageState.setApprovalQueueSearch("");
        }}
        onAttendanceRejectReasonChange={pageState.setAttendanceRejectReason}
        onLeaveRejectReasonChange={pageState.setLeaveRejectReason}
        onQueueSearchSortScopeChange={pageState.setQueueSearchSortScope}
        onQueueSearchSortOptionChange={pageState.setQueueSearchSortOption}
        onQueueSearchSortQueryChange={pageState.setQueueSearchSortQuery}
        onApplyPendingPreset={() => {
          pageState.setQueueSearchSortScope("detail");
          pageState.setQueueSearchSortQuery("PENDING");
          pageState.setQueueSearchSortOption("priority_desc");
        }}
        onApplyUrgentPreset={() => {
          pageState.setQueueSearchSortScope("all");
          pageState.setQueueSearchSortOption("wait_desc");
          pageState.setApprovalQueueOnlyUrgent(true);
        }}
        onResetSearchSortPreset={() => {
          pageState.setQueueSearchSortScope("all");
          pageState.setQueueSearchSortQuery("");
          pageState.setQueueSearchSortOption("priority_desc");
        }}
        onClearApprovalActivities={() => {
          pageState.setApprovalActivities([]);
          pageState.setMobileApprovalFeedback(null);
        }}
      />
      <AdminCompensationPanels
        isKoLocale={isKoLocale}
        showDevTools={showDevTools}
        organizationId={pageState.organizationId}
        employeeId={pageState.employeeId}
        aggregateEmployeeId={pageState.aggregateEmployeeId}
        aggregates={pageState.aggregates}
        accrualEmployeeId={pageState.accrualEmployeeId}
        accrualYear={pageState.accrualYear}
        accrualGrantDays={pageState.accrualGrantDays}
        accrualCarryCapDays={pageState.accrualCarryCapDays}
        leaveAllowHalfDay={pageState.leaveAllowHalfDay}
        leaveAllowHourly={pageState.leaveAllowHourly}
        leaveHourlyIncrementMinutes={pageState.leaveHourlyIncrementMinutes}
        leaveMaxHoursPerRequest={pageState.leaveMaxHoursPerRequest}
        leaveMinNoticeDays={pageState.leaveMinNoticeDays}
        leaveMaxConsecutiveDays={pageState.leaveMaxConsecutiveDays}
        accrualResult={pageState.accrualResult}
        updatedAtLabel={updatedAtLabel}
        formatDateTimeByLocale={formatDateTimeByLocale}
        minutesToHours={minutesToHours}
        formatDays={formatDays}
        onAggregateEmployeeIdChange={pageState.setAggregateEmployeeId}
        onListAttendanceAggregates={() => void dashboardActions.listAttendanceAggregates()}
        onListAttendanceAggregatesAll={() => {
          pageState.setAggregateEmployeeId("");
          void dashboardActions.listAttendanceAggregates({ employeeId: "" });
        }}
        onApplyAggregateEmployee={(id) => {
          pageState.setAggregateEmployeeId(id);
          pageState.setEmployeeId(id);
          pageState.setAccrualEmployeeId(id);
        }}
        onAccrualEmployeeIdChange={pageState.setAccrualEmployeeId}
        onAccrualYearChange={pageState.setAccrualYear}
        onAccrualGrantDaysChange={pageState.setAccrualGrantDays}
        onAccrualCarryCapDaysChange={pageState.setAccrualCarryCapDays}
        onLeaveAllowHalfDayChange={pageState.setLeaveAllowHalfDay}
        onLeaveAllowHourlyChange={pageState.setLeaveAllowHourly}
        onLeaveHourlyIncrementMinutesChange={pageState.setLeaveHourlyIncrementMinutes}
        onLeaveMaxHoursPerRequestChange={pageState.setLeaveMaxHoursPerRequest}
        onLeaveMinNoticeDaysChange={pageState.setLeaveMinNoticeDays}
        onLeaveMaxConsecutiveDaysChange={pageState.setLeaveMaxConsecutiveDays}
        onLoadLeavePolicy={() => void dashboardActions.loadLeavePolicy()}
        onSaveLeavePolicy={() => void dashboardActions.saveLeavePolicy()}
        onSettleLeaveAccrual={() => void dashboardActions.settleLeaveAccrual()}
        payrollPreviewMode={pageState.payrollPreviewMode}
        payrollHourlyRateKrw={pageState.payrollHourlyRateKrw}
        payrollNonTaxableIncomeKrw={pageState.payrollNonTaxableIncomeKrw}
        payrollTaxableIncomeKrw={pageState.payrollTaxableIncomeKrw}
        payrollTaxableItems={pageState.payrollTaxableItems}
        payrollNonTaxableItems={pageState.payrollNonTaxableItems}
        payrollIncomeSplitItemPresetId={pageState.payrollIncomeSplitItemPresetId}
        payrollOtherDeductionsKrw={pageState.payrollOtherDeductionsKrw}
        payrollAdditionalTaxCreditKrw={pageState.payrollAdditionalTaxCreditKrw}
        payrollDependentCount={pageState.payrollDependentCount}
        payrollDependentTaxCreditPerPersonKrw={pageState.payrollDependentTaxCreditPerPersonKrw}
        payrollIncomeTaxLookupPresetId={pageState.payrollIncomeTaxLookupPresetId}
        payrollIncomeTaxLookupPresetAuto={pageState.payrollIncomeTaxLookupPresetAuto}
        payrollIncomeTaxLookupAsOf={pageState.payrollIncomeTaxLookupAsOf}
        payrollRequireMonthlyBoundary={pageState.payrollRequireMonthlyBoundary}
        payrollNationalPensionCapKrw={pageState.payrollNationalPensionCapKrw}
        payrollHealthInsuranceCapKrw={pageState.payrollHealthInsuranceCapKrw}
        payrollEmploymentInsuranceCapKrw={pageState.payrollEmploymentInsuranceCapKrw}
        payrollPresetShareLinkFeedback={pageState.payrollPresetShareLinkFeedback}
        previewedPayroll={pageState.previewedPayroll}
        lastPayrollRunId={pageState.lastPayrollRunId}
        logs={pageState.logs}
        logStatusLabels={logStatusLabels}
        onEmployeeIdChange={pageState.setEmployeeId}
        onPayrollPreviewModeChange={pageState.setPayrollPreviewMode}
        onPayrollHourlyRateKrwChange={pageState.setPayrollHourlyRateKrw}
        onPayrollNonTaxableIncomeKrwChange={pageState.setPayrollNonTaxableIncomeKrw}
        onPayrollTaxableIncomeKrwChange={pageState.setPayrollTaxableIncomeKrw}
        onPayrollTaxableItemsChange={pageState.setPayrollTaxableItems}
        onPayrollNonTaxableItemsChange={pageState.setPayrollNonTaxableItems}
        onPayrollIncomeSplitItemPresetIdChange={pageState.setPayrollIncomeSplitItemPresetId}
        onPayrollOtherDeductionsKrwChange={pageState.setPayrollOtherDeductionsKrw}
        onPayrollAdditionalTaxCreditKrwChange={pageState.setPayrollAdditionalTaxCreditKrw}
        onPayrollDependentCountChange={pageState.setPayrollDependentCount}
        onPayrollDependentTaxCreditPerPersonKrwChange={pageState.setPayrollDependentTaxCreditPerPersonKrw}
        onPayrollIncomeTaxLookupPresetIdChange={pageState.setPayrollIncomeTaxLookupPresetId}
        onPayrollIncomeTaxLookupPresetAutoChange={(enabled) => {
          pageState.setPayrollIncomeTaxLookupPresetAuto(enabled);
          if (enabled) {
            pageState.setPayrollIncomeTaxLookupPresetId("");
          }
        }}
        onPayrollIncomeTaxLookupAsOfChange={pageState.setPayrollIncomeTaxLookupAsOf}
        onPayrollRequireMonthlyBoundaryChange={pageState.setPayrollRequireMonthlyBoundary}
        onPayrollNationalPensionCapKrwChange={pageState.setPayrollNationalPensionCapKrw}
        onPayrollHealthInsuranceCapKrwChange={pageState.setPayrollHealthInsuranceCapKrw}
        onPayrollEmploymentInsuranceCapKrwChange={pageState.setPayrollEmploymentInsuranceCapKrw}
        onLastPayrollRunIdChange={pageState.setLastPayrollRunId}
        onPreviewPayroll={() => void dashboardActions.previewPayroll()}
        onConfirmPayroll={() => void dashboardActions.confirmPayroll(pageState.lastPayrollRunId)}
        onResetPayrollPresetShareContext={pageState.resetPayrollPresetShareContext}
        onReapplyPayrollPresetShareContext={pageState.reapplyPayrollPresetShareContext}
        onClearManualIncomeSplitItems={() => {
          pageState.setPayrollTaxableItems([createEmptyPayrollKrIncomeSplitItemDraft()]);
          pageState.setPayrollNonTaxableItems([createEmptyPayrollKrIncomeSplitItemDraft()]);
        }}
        onClearLogs={dashboardActions.clearLogs}
      />
    </section>
  );
}
