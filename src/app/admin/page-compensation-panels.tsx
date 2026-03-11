import { AdminAggregateLeavePanels } from "@/components/admin-dashboard/AdminAggregateLeavePanels";
import { AdminDebugLogsPanel } from "@/components/admin-dashboard/AdminDebugLogsPanel";
import { AdminPayrollWorkspaceCard } from "@/components/admin-dashboard/AdminPayrollWorkspaceCard";
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
  previewedPayroll: PayrollRunDto[];
  lastPayrollRunId: string;
  logs: ApiLog[];
  logStatusLabels: {
    success: string;
    fail: string;
  };
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
