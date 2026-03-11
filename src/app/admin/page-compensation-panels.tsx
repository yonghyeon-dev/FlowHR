import { AdminAggregateLeavePanels } from "@/components/admin-dashboard/AdminAggregateLeavePanels";
import { AdminDebugLogsPanel } from "@/components/admin-dashboard/AdminDebugLogsPanel";
import { AdminPayrollWorkspaceCard } from "@/components/admin-dashboard/AdminPayrollWorkspaceCard";
import { type PayrollKrPresetShareLinkFeedback } from "@/components/payroll/PayrollKrPresetShareLinkFeedbackPanel";
import { type PayrollKrIncomeSplitItemDraft } from "@/components/payroll/PayrollKrIncomeSplitItemsTable";
import type {
  ApiLog,
  AttendanceAggregateDto,
  LeaveBalanceDto,
  PayrollRunDto
} from "@/app/admin/page-types";

type AdminCompensationPanelsProps = {
  isKoLocale: boolean;
  showDevTools: boolean;
  organizationId: string;
  employeeId: string;
  aggregateEmployeeId: string;
  aggregates: AttendanceAggregateDto[];
  accrualEmployeeId: string;
  accrualYear: string;
  accrualGrantDays: string;
  accrualCarryCapDays: string;
  leaveAllowHalfDay: boolean;
  leaveAllowHourly: boolean;
  leaveHourlyIncrementMinutes: string;
  leaveMaxHoursPerRequest: string;
  leaveMinNoticeDays: string;
  leaveMaxConsecutiveDays: string;
  accrualResult: LeaveBalanceDto | null;
  updatedAtLabel: string;
  formatDateTimeByLocale: (value: string | null) => string;
  minutesToHours: (minutes: number) => string;
  formatDays: (days: number) => string;
  onAggregateEmployeeIdChange: (value: string) => void;
  onListAttendanceAggregates: () => void;
  onListAttendanceAggregatesAll: () => void;
  onApplyAggregateEmployee: (id: string) => void;
  onAccrualEmployeeIdChange: (value: string) => void;
  onAccrualYearChange: (value: string) => void;
  onAccrualGrantDaysChange: (value: string) => void;
  onAccrualCarryCapDaysChange: (value: string) => void;
  onLeaveAllowHalfDayChange: (value: boolean) => void;
  onLeaveAllowHourlyChange: (value: boolean) => void;
  onLeaveHourlyIncrementMinutesChange: (value: string) => void;
  onLeaveMaxHoursPerRequestChange: (value: string) => void;
  onLeaveMinNoticeDaysChange: (value: string) => void;
  onLeaveMaxConsecutiveDaysChange: (value: string) => void;
  onLoadLeavePolicy: () => void;
  onSaveLeavePolicy: () => void;
  onSettleLeaveAccrual: () => void;
  payrollPreviewMode: "gross" | "statutory_kr_baseline";
  payrollHourlyRateKrw: string;
  payrollNonTaxableIncomeKrw: string;
  payrollTaxableIncomeKrw: string;
  payrollTaxableItems: PayrollKrIncomeSplitItemDraft[];
  payrollNonTaxableItems: PayrollKrIncomeSplitItemDraft[];
  payrollIncomeSplitItemPresetId: string;
  payrollOtherDeductionsKrw: string;
  payrollAdditionalTaxCreditKrw: string;
  payrollDependentCount: string;
  payrollDependentTaxCreditPerPersonKrw: string;
  payrollIncomeTaxLookupPresetId: string;
  payrollIncomeTaxLookupPresetAuto: boolean;
  payrollIncomeTaxLookupAsOf: string;
  payrollRequireMonthlyBoundary: boolean;
  payrollNationalPensionCapKrw: string;
  payrollHealthInsuranceCapKrw: string;
  payrollEmploymentInsuranceCapKrw: string;
  payrollPresetShareLinkFeedback: PayrollKrPresetShareLinkFeedback | null;
  previewedPayroll: PayrollRunDto[];
  lastPayrollRunId: string;
  logs: ApiLog[];
  logStatusLabels: {
    success: string;
    fail: string;
  };
  onEmployeeIdChange: (value: string) => void;
  onPayrollPreviewModeChange: (value: "gross" | "statutory_kr_baseline") => void;
  onPayrollHourlyRateKrwChange: (value: string) => void;
  onPayrollNonTaxableIncomeKrwChange: (value: string) => void;
  onPayrollTaxableIncomeKrwChange: (value: string) => void;
  onPayrollTaxableItemsChange: (value: PayrollKrIncomeSplitItemDraft[]) => void;
  onPayrollNonTaxableItemsChange: (value: PayrollKrIncomeSplitItemDraft[]) => void;
  onPayrollIncomeSplitItemPresetIdChange: (value: string) => void;
  onPayrollOtherDeductionsKrwChange: (value: string) => void;
  onPayrollAdditionalTaxCreditKrwChange: (value: string) => void;
  onPayrollDependentCountChange: (value: string) => void;
  onPayrollDependentTaxCreditPerPersonKrwChange: (value: string) => void;
  onPayrollIncomeTaxLookupPresetIdChange: (value: string) => void;
  onPayrollIncomeTaxLookupPresetAutoChange: (enabled: boolean) => void;
  onPayrollIncomeTaxLookupAsOfChange: (value: string) => void;
  onPayrollRequireMonthlyBoundaryChange: (enabled: boolean) => void;
  onPayrollNationalPensionCapKrwChange: (value: string) => void;
  onPayrollHealthInsuranceCapKrwChange: (value: string) => void;
  onPayrollEmploymentInsuranceCapKrwChange: (value: string) => void;
  onLastPayrollRunIdChange: (value: string) => void;
  onPreviewPayroll: () => void;
  onConfirmPayroll: () => void;
  onResetPayrollPresetShareContext: () => void;
  onReapplyPayrollPresetShareContext: () => void;
  onClearManualIncomeSplitItems: () => void;
  onClearLogs: () => void;
};

export function AdminCompensationPanels(props: AdminCompensationPanelsProps) {
  return (
    <>
      <AdminAggregateLeavePanels
        aggregateEmployeeId={props.aggregateEmployeeId}
        aggregates={props.aggregates}
        accrualEmployeeId={props.accrualEmployeeId}
        accrualYear={props.accrualYear}
        accrualGrantDays={props.accrualGrantDays}
        accrualCarryCapDays={props.accrualCarryCapDays}
        leaveAllowHalfDay={props.leaveAllowHalfDay}
        leaveAllowHourly={props.leaveAllowHourly}
        leaveHourlyIncrementMinutes={props.leaveHourlyIncrementMinutes}
        leaveMaxHoursPerRequest={props.leaveMaxHoursPerRequest}
        leaveMinNoticeDays={props.leaveMinNoticeDays}
        leaveMaxConsecutiveDays={props.leaveMaxConsecutiveDays}
        accrualResult={props.accrualResult}
        organizationId={props.organizationId}
        updatedAtLabel={props.updatedAtLabel}
        formatDateTime={props.formatDateTimeByLocale}
        minutesToHours={props.minutesToHours}
        formatDays={props.formatDays}
        onAggregateEmployeeIdChange={props.onAggregateEmployeeIdChange}
        onListAttendanceAggregates={props.onListAttendanceAggregates}
        onListAttendanceAggregatesAll={props.onListAttendanceAggregatesAll}
        onApplyAggregateEmployee={props.onApplyAggregateEmployee}
        onAccrualEmployeeIdChange={props.onAccrualEmployeeIdChange}
        onAccrualYearChange={props.onAccrualYearChange}
        onAccrualGrantDaysChange={props.onAccrualGrantDaysChange}
        onAccrualCarryCapDaysChange={props.onAccrualCarryCapDaysChange}
        onLeaveAllowHalfDayChange={props.onLeaveAllowHalfDayChange}
        onLeaveAllowHourlyChange={props.onLeaveAllowHourlyChange}
        onLeaveHourlyIncrementMinutesChange={props.onLeaveHourlyIncrementMinutesChange}
        onLeaveMaxHoursPerRequestChange={props.onLeaveMaxHoursPerRequestChange}
        onLeaveMinNoticeDaysChange={props.onLeaveMinNoticeDaysChange}
        onLeaveMaxConsecutiveDaysChange={props.onLeaveMaxConsecutiveDaysChange}
        onLoadLeavePolicy={props.onLoadLeavePolicy}
        onSaveLeavePolicy={props.onSaveLeavePolicy}
        onSettleLeaveAccrual={props.onSettleLeaveAccrual}
      />

      <AdminPayrollWorkspaceCard
        isKoLocale={props.isKoLocale}
        previewedPayroll={props.previewedPayroll}
        lastPayrollRunId={props.lastPayrollRunId}
        formatDateTime={props.formatDateTimeByLocale}
      />

      <AdminDebugLogsPanel
        showDevTools={props.showDevTools}
        isKoLocale={props.isKoLocale}
        logs={props.logs}
        logStatusLabels={props.logStatusLabels}
        onClearLogs={props.onClearLogs}
      />
    </>
  );
}
