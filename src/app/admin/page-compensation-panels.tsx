import { AdminAggregateLeavePanels } from "@/components/admin-dashboard/AdminAggregateLeavePanels";
import { AdminDebugLogsPanel } from "@/components/admin-dashboard/AdminDebugLogsPanel";
import { AdminPayrollPanel } from "@/components/admin-dashboard/AdminPayrollPanel";
import { type PayrollKrPresetShareLinkFeedback } from "@/components/payroll/PayrollKrPresetShareLinkFeedbackPanel";
import { type PayrollKrIncomeSplitItemDraft } from "@/components/payroll/PayrollKrIncomeSplitItemsTable";
import type {
  ApiLog,
  AttendanceAggregateDto,
  LeaveBalanceDto
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

      <AdminPayrollPanel
        isKoLocale={props.isKoLocale}
        payrollPreviewMode={props.payrollPreviewMode}
        employeeId={props.employeeId}
        payrollHourlyRateKrw={props.payrollHourlyRateKrw}
        payrollNonTaxableIncomeKrw={props.payrollNonTaxableIncomeKrw}
        payrollTaxableIncomeKrw={props.payrollTaxableIncomeKrw}
        payrollTaxableItems={props.payrollTaxableItems}
        payrollNonTaxableItems={props.payrollNonTaxableItems}
        payrollIncomeSplitItemPresetId={props.payrollIncomeSplitItemPresetId}
        payrollOtherDeductionsKrw={props.payrollOtherDeductionsKrw}
        payrollAdditionalTaxCreditKrw={props.payrollAdditionalTaxCreditKrw}
        payrollDependentCount={props.payrollDependentCount}
        payrollDependentTaxCreditPerPersonKrw={props.payrollDependentTaxCreditPerPersonKrw}
        payrollIncomeTaxLookupPresetId={props.payrollIncomeTaxLookupPresetId}
        payrollIncomeTaxLookupPresetAuto={props.payrollIncomeTaxLookupPresetAuto}
        payrollIncomeTaxLookupAsOf={props.payrollIncomeTaxLookupAsOf}
        payrollRequireMonthlyBoundary={props.payrollRequireMonthlyBoundary}
        payrollNationalPensionCapKrw={props.payrollNationalPensionCapKrw}
        payrollHealthInsuranceCapKrw={props.payrollHealthInsuranceCapKrw}
        payrollEmploymentInsuranceCapKrw={props.payrollEmploymentInsuranceCapKrw}
        payrollPresetShareLinkFeedback={props.payrollPresetShareLinkFeedback}
        lastPayrollRunId={props.lastPayrollRunId}
        onPayrollPreviewModeChange={props.onPayrollPreviewModeChange}
        onEmployeeIdChange={props.onEmployeeIdChange}
        onPayrollHourlyRateKrwChange={props.onPayrollHourlyRateKrwChange}
        onPayrollNonTaxableIncomeKrwChange={props.onPayrollNonTaxableIncomeKrwChange}
        onPayrollTaxableIncomeKrwChange={props.onPayrollTaxableIncomeKrwChange}
        onPayrollTaxableItemsChange={props.onPayrollTaxableItemsChange}
        onPayrollNonTaxableItemsChange={props.onPayrollNonTaxableItemsChange}
        onPayrollIncomeSplitItemPresetIdChange={props.onPayrollIncomeSplitItemPresetIdChange}
        onPayrollOtherDeductionsKrwChange={props.onPayrollOtherDeductionsKrwChange}
        onPayrollAdditionalTaxCreditKrwChange={props.onPayrollAdditionalTaxCreditKrwChange}
        onPayrollDependentCountChange={props.onPayrollDependentCountChange}
        onPayrollDependentTaxCreditPerPersonKrwChange={props.onPayrollDependentTaxCreditPerPersonKrwChange}
        onPayrollIncomeTaxLookupPresetIdChange={props.onPayrollIncomeTaxLookupPresetIdChange}
        onPayrollIncomeTaxLookupPresetAutoChange={props.onPayrollIncomeTaxLookupPresetAutoChange}
        onPayrollIncomeTaxLookupAsOfChange={props.onPayrollIncomeTaxLookupAsOfChange}
        onPayrollRequireMonthlyBoundaryChange={props.onPayrollRequireMonthlyBoundaryChange}
        onPayrollNationalPensionCapKrwChange={props.onPayrollNationalPensionCapKrwChange}
        onPayrollHealthInsuranceCapKrwChange={props.onPayrollHealthInsuranceCapKrwChange}
        onPayrollEmploymentInsuranceCapKrwChange={props.onPayrollEmploymentInsuranceCapKrwChange}
        onLastPayrollRunIdChange={props.onLastPayrollRunIdChange}
        onPreviewPayroll={props.onPreviewPayroll}
        onConfirmPayroll={props.onConfirmPayroll}
        onResetPayrollPresetShareContext={props.onResetPayrollPresetShareContext}
        onReapplyPayrollPresetShareContext={props.onReapplyPayrollPresetShareContext}
        onClearManualIncomeSplitItems={props.onClearManualIncomeSplitItems}
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
