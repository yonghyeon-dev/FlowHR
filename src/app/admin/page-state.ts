"use client";

import { useEffect, useState } from "react";

import { firstDayOfMonthLocal, lastDayOfMonthLocal, toLocalInputValue } from "@/app/admin/page-helpers";
import { isDefaultDemoOrganizationName } from "@/app/admin/page-locale-helpers";
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
import type {
  ApprovalActivity,
  AttendanceQueueSort,
  LeaveQueueSort,
  PayrollQueueSort,
  QueueFocus,
  QueueMobileApprovalFeedback,
  QueueSearchScope,
  QueueSearchSortOption,
  QueueSearchSortScope
} from "@/components/admin-approval/approval-queue-types";
import { type PayrollKrPresetShareLinkFeedback } from "@/components/payroll/PayrollKrPresetShareLinkFeedbackPanel";
import { useStickyStringState } from "@/lib/client/useStickyState";
import { defaultEmployeeIdForApi } from "@/lib/i18n/employee-id-locale";

type UseAdminDashboardStateInput = {
  demoOrganizationName: string;
  isProductionRuntime: boolean;
  supabaseOrganizationId: string | null | undefined;
};

export function useAdminDashboardState({
  demoOrganizationName,
  isProductionRuntime,
  supabaseOrganizationId
}: UseAdminDashboardStateInput) {
  const [accessToken, setAccessToken] = useState("");
  const [organizationId, setOrganizationId] = useStickyStringState("flowhr:ctx:organizationId", "");
  const [adminActorId, setAdminActorId] = useStickyStringState("flowhr:ctx:adminId", "ADM-1001");
  const [organizationName, setOrganizationName] = useState<string>(demoOrganizationName);
  const [organizations, setOrganizations] = useState<OrganizationSummary[]>([]);

  useEffect(() => {
    setOrganizationName((previous) => {
      if (!isDefaultDemoOrganizationName(previous)) {
        return previous;
      }
      return demoOrganizationName;
    });
  }, [demoOrganizationName]);

  const [periodStart, setPeriodStart] = useState(firstDayOfMonthLocal());
  const [periodEnd, setPeriodEnd] = useState(lastDayOfMonthLocal());

  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [employeeId, setEmployeeId] = useState(defaultEmployeeIdForApi);
  const [employeeName, setEmployeeName] = useState("");
  const [employeeEmail, setEmployeeEmail] = useState("");
  const [employeeActive, setEmployeeActive] = useState(true);

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<InviteRole>("employee");
  const [inviteDeliveryMode, setInviteDeliveryMode] = useState<InviteDeliveryMode>("link");
  const [inviteActorId, setInviteActorId] = useState(defaultEmployeeIdForApi);
  const [inviteResult, setInviteResult] = useState<InviteResultDto | null>(null);

  const [scheduleEmployeeId, setScheduleEmployeeId] = useState(defaultEmployeeIdForApi);
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
  const [queueSearchSortOption, setQueueSearchSortOption] = useState<QueueSearchSortOption>(
    "priority_desc"
  );

  const [aggregateEmployeeId, setAggregateEmployeeId] = useState("");
  const [aggregates, setAggregates] = useState<AttendanceAggregateDto[]>([]);

  const [accrualEmployeeId, setAccrualEmployeeId] = useState(defaultEmployeeIdForApi);
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

  const [lastPayrollRunId, setLastPayrollRunId] = useState("");

  useEffect(() => {
    if (previewedPayroll.length === 0) {
      if (lastPayrollRunId !== "") {
        setLastPayrollRunId("");
      }
      return;
    }
    if (previewedPayroll.some((run) => run.id === lastPayrollRunId)) {
      return;
    }
    setLastPayrollRunId(previewedPayroll[0]?.id ?? "");
  }, [lastPayrollRunId, previewedPayroll]);

  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [approvalActivities, setApprovalActivities] = useState<ApprovalActivity[]>([]);
  const [, setMobileApprovalFeedback] = useState<QueueMobileApprovalFeedback | null>(null);
  const [pendingLabel, setPendingLabel] = useState<string | null>(null);
  const [payrollPresetShareLinkFeedback] = useState<PayrollKrPresetShareLinkFeedback | null>(null);

  useEffect(() => {
    if (!isProductionRuntime || organizationId.trim()) {
      return;
    }
    const orgId = supabaseOrganizationId ?? "";
    if (orgId.trim().length > 0) {
      setOrganizationId(orgId.trim());
    }
  }, [isProductionRuntime, organizationId, setOrganizationId, supabaseOrganizationId]);

  return {
    accessToken,
    setAccessToken,
    organizationId,
    setOrganizationId,
    adminActorId,
    setAdminActorId,
    organizationName,
    setOrganizationName,
    organizations,
    setOrganizations,
    periodStart,
    setPeriodStart,
    periodEnd,
    setPeriodEnd,
    employees,
    setEmployees,
    employeeId,
    setEmployeeId,
    employeeName,
    setEmployeeName,
    employeeEmail,
    setEmployeeEmail,
    employeeActive,
    setEmployeeActive,
    inviteEmail,
    setInviteEmail,
    inviteRole,
    setInviteRole,
    inviteDeliveryMode,
    setInviteDeliveryMode,
    inviteActorId,
    setInviteActorId,
    inviteResult,
    setInviteResult,
    scheduleEmployeeId,
    setScheduleEmployeeId,
    scheduleIsHoliday,
    setScheduleIsHoliday,
    scheduleStartAt,
    setScheduleStartAt,
    scheduleEndAt,
    setScheduleEndAt,
    scheduleBreakMinutes,
    setScheduleBreakMinutes,
    scheduleNotes,
    setScheduleNotes,
    schedules,
    setSchedules,
    attendanceRejectReason,
    setAttendanceRejectReason,
    leaveRejectReason,
    setLeaveRejectReason,
    pendingAttendance,
    setPendingAttendance,
    pendingLeave,
    setPendingLeave,
    previewedPayroll,
    setPreviewedPayroll,
    selectedAttendanceIds,
    selectedLeaveIds,
    approvalQueueFocus,
    setApprovalQueueFocus,
    approvalQueueSearch,
    setApprovalQueueSearch,
    approvalQueueSearchScope,
    setApprovalQueueSearchScope,
    approvalQueueOnlyUrgent,
    setApprovalQueueOnlyUrgent,
    approvalQueueSelectedOnly,
    setApprovalQueueSelectedOnly,
    attendanceQueueSort,
    leaveQueueSort,
    payrollQueueSort,
    queueSearchSortScope,
    setQueueSearchSortScope,
    queueSearchSortQuery,
    setQueueSearchSortQuery,
    queueSearchSortOption,
    setQueueSearchSortOption,
    aggregateEmployeeId,
    setAggregateEmployeeId,
    aggregates,
    setAggregates,
    accrualEmployeeId,
    setAccrualEmployeeId,
    accrualYear,
    setAccrualYear,
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
    accrualResult,
    setAccrualResult,
    lastPayrollRunId,
    setLastPayrollRunId,
    logs,
    setLogs,
    approvalActivities,
    setApprovalActivities,
    setMobileApprovalFeedback,
    pendingLabel,
    setPendingLabel,
    payrollPresetShareLinkFeedback
  } as const;
}
