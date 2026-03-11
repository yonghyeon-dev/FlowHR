import {
  buildAdminValidationFailureLog,
  confirmPayrollFromHelper,
  listAttendanceAggregatesFromHelper,
  loadLeavePolicyFromHelper,
  refreshAdminInboxFromHelper,
  saveLeavePolicyFromHelper,
  settleLeaveAccrualFromHelper,
  type AdminCallApi
} from "@/app/admin/page-action-helpers";
import type {
  ApiLog,
  AttendanceAggregateDto,
  AttendanceRecordDto,
  LeaveBalanceDto,
  LeaveRequestDto,
  PayrollRunDto
} from "@/app/admin/page-types";
import type { QueueMobileApprovalFeedback } from "@/components/admin-approval/approval-queue-types";

type StringSetter = (value: string) => void;
type BooleanSetter = (value: boolean | ((prev: boolean) => boolean)) => void;
type LogsSetter = (updater: (prev: ApiLog[]) => ApiLog[]) => void;
type QueueMobileFeedbackSetter = (
  value: QueueMobileApprovalFeedback | null | ((prev: QueueMobileApprovalFeedback | null) => QueueMobileApprovalFeedback | null)
) => void;
type ApprovalActivity = {
  id: number;
  queue: "attendance" | "leave" | "payroll";
  actionKind: "approve" | "reject" | "confirm" | "other";
  action: string;
  itemId: string;
  ok: boolean;
  status: number;
  createdAtMs: number;
  at: string;
};
type ApprovalActivitySetter = (updater: (prev: ApprovalActivity[]) => ApprovalActivity[]) => void;
type QueryBuilder = (params: Record<string, string | undefined>) => string;
type IsoConverter = (value: string) => string;
type AggregatesSetter = (value: AttendanceAggregateDto[]) => void;
type PendingAttendanceSetter = (value: AttendanceRecordDto[]) => void;
type PendingLeaveSetter = (value: LeaveRequestDto[]) => void;
type PreviewedPayrollSetter = (value: PayrollRunDto[]) => void;
type AccrualResultSetter = (value: LeaveBalanceDto | null) => void;

export type BuildAdminDashboardActionsInput = {
  callApi: AdminCallApi;
  buildQuery: QueryBuilder;
  toIso: IsoConverter;
  runtimeLocale: string;
  periodStart: string;
  periodEnd: string;
  organizationId: string;
  setPendingAttendance: PendingAttendanceSetter;
  setPendingLeave: PendingLeaveSetter;
  setPreviewedPayroll: PreviewedPayrollSetter;
  setLastPayrollRunId: StringSetter;
  setLogs: LogsSetter;
  setAccrualResult: AccrualResultSetter;
  setLeaveAllowHalfDay: BooleanSetter;
  setLeaveAllowHourly: BooleanSetter;
  setLeaveHourlyIncrementMinutes: StringSetter;
  setLeaveMaxHoursPerRequest: StringSetter;
  setLeaveMinNoticeDays: StringSetter;
  setLeaveMaxConsecutiveDays: StringSetter;
  setAccrualGrantDays: StringSetter;
  setAccrualCarryCapDays: StringSetter;
  aggregateEmployeeId: string;
  setAggregates: AggregatesSetter;
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
  setApprovalActivities: ApprovalActivitySetter;
  setMobileApprovalFeedback: QueueMobileFeedbackSetter;
};

export function buildAdminDashboardActions(input: BuildAdminDashboardActionsInput) {
  function appendApprovalActivity(payload: {
    queue: "attendance" | "leave" | "payroll";
    actionKind?: "approve" | "reject" | "confirm" | "other";
    action: string;
    itemId: string;
    ok: boolean;
    status: number;
  }) {
    const createdAtMs = Date.now();
    input.setApprovalActivities((prev) =>
      [
        {
          id: createdAtMs + Math.floor(Math.random() * 1000),
          queue: payload.queue,
          actionKind: payload.actionKind ?? "other",
          action: payload.action,
          itemId: payload.itemId,
          ok: payload.ok,
          status: payload.status,
          createdAtMs,
          at: new Date().toLocaleString(input.runtimeLocale)
        },
        ...prev
      ].slice(0, 30)
    );
  }

  function publishMobileApprovalFeedback(payload: {
    queue: "attendance" | "leave" | "payroll" | "mixed";
    action: string;
    okCount: number;
    failCount: number;
  }) {
    input.setMobileApprovalFeedback({
      queue: payload.queue,
      action: payload.action,
      okCount: payload.okCount,
      failCount: payload.failCount,
      total: payload.okCount + payload.failCount,
      at: new Date().toLocaleString(input.runtimeLocale)
    });
  }

  async function refreshInbox() {
    const inbox = await refreshAdminInboxFromHelper({
      callApi: input.callApi,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      toIso: input.toIso,
      buildQuery: input.buildQuery
    });
    input.setPendingAttendance(inbox.pendingAttendance);
    input.setPendingLeave(inbox.pendingLeave);
    input.setPreviewedPayroll(inbox.previewedPayroll);
  }

  async function confirmPayroll(runId: string) {
    const confirmed = await confirmPayrollFromHelper({
      callApi: input.callApi,
      runId
    });
    appendApprovalActivity({
      queue: "payroll",
      actionKind: "confirm",
      action: "확정",
      itemId: runId,
      ok: confirmed.ok,
      status: confirmed.status
    });
    publishMobileApprovalFeedback({
      queue: "payroll",
      action: "payroll-single-confirm",
      okCount: confirmed.ok ? 1 : 0,
      failCount: confirmed.ok ? 0 : 1
    });
    if (confirmed.ok && confirmed.confirmedRunId) {
      input.setLastPayrollRunId(confirmed.confirmedRunId);
    }
    await refreshInbox();
  }

  async function settleLeaveAccrual() {
    const balance = await settleLeaveAccrualFromHelper({
      callApi: input.callApi,
      accrualYear: input.accrualYear,
      accrualGrantDays: input.accrualGrantDays,
      accrualCarryCapDays: input.accrualCarryCapDays,
      accrualEmployeeId: input.accrualEmployeeId
    });
    if (!balance) {
      return;
    }
    input.setAccrualResult(balance);
  }

  async function loadLeavePolicy() {
    if (!input.organizationId.trim()) {
      input.setLogs((prev) => [
        buildAdminValidationFailureLog({
          label: "휴가 정책 조회",
          error: "작업할 조직을 먼저 선택해 주세요.",
          runtimeLocale: input.runtimeLocale
        }),
        ...prev
      ]);
      return;
    }

    const policy = await loadLeavePolicyFromHelper({
      callApi: input.callApi,
      organizationId: input.organizationId,
      buildQuery: input.buildQuery
    });
    if (!policy) {
      return;
    }

    if (typeof policy.annualGrantDays === "number") {
      input.setAccrualGrantDays(String(policy.annualGrantDays));
    }
    if (typeof policy.carryOverCapDays === "number") {
      input.setAccrualCarryCapDays(String(policy.carryOverCapDays));
    }
    if (typeof policy.allowHalfDay === "boolean") {
      input.setLeaveAllowHalfDay(policy.allowHalfDay);
    }
    if (typeof policy.allowHourly === "boolean") {
      input.setLeaveAllowHourly(policy.allowHourly);
    }
    if (typeof policy.hourlyIncrementMinutes === "number") {
      input.setLeaveHourlyIncrementMinutes(String(policy.hourlyIncrementMinutes));
    }
    if (typeof policy.maxHoursPerRequest === "number") {
      input.setLeaveMaxHoursPerRequest(String(policy.maxHoursPerRequest));
    }
    if (typeof policy.minNoticeDays === "number") {
      input.setLeaveMinNoticeDays(String(policy.minNoticeDays));
    }
    if (typeof policy.maxConsecutiveDays === "number") {
      input.setLeaveMaxConsecutiveDays(String(policy.maxConsecutiveDays));
    } else if (policy.maxConsecutiveDays === null) {
      input.setLeaveMaxConsecutiveDays("");
    }
  }

  async function saveLeavePolicy() {
    if (!input.organizationId.trim()) {
      input.setLogs((prev) => [
        buildAdminValidationFailureLog({
          label: "휴가 정책 저장",
          error: "작업할 조직을 먼저 선택해 주세요.",
          runtimeLocale: input.runtimeLocale
        }),
        ...prev
      ]);
      return;
    }

    await saveLeavePolicyFromHelper({
      callApi: input.callApi,
      organizationId: input.organizationId,
      accrualGrantDays: input.accrualGrantDays,
      accrualCarryCapDays: input.accrualCarryCapDays,
      leaveAllowHalfDay: input.leaveAllowHalfDay,
      leaveAllowHourly: input.leaveAllowHourly,
      leaveHourlyIncrementMinutes: input.leaveHourlyIncrementMinutes,
      leaveMaxHoursPerRequest: input.leaveMaxHoursPerRequest,
      leaveMinNoticeDays: input.leaveMinNoticeDays,
      leaveMaxConsecutiveDays: input.leaveMaxConsecutiveDays
    });
  }

  async function listAttendanceAggregates(options?: { employeeId?: string }) {
    const nextAggregates = await listAttendanceAggregatesFromHelper({
      callApi: input.callApi,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      aggregateEmployeeId: input.aggregateEmployeeId,
      employeeIdOverride: options?.employeeId,
      toIso: input.toIso,
      buildQuery: input.buildQuery
    });
    if (!nextAggregates) {
      return;
    }
    input.setAggregates(nextAggregates);
  }

  function clearLogs() {
    input.setLogs(() => []);
  }

  async function refreshDashboard() {
    await Promise.all([refreshInbox(), listAttendanceAggregates()]);
  }

  return {
    refreshInbox,
    confirmPayroll,
    settleLeaveAccrual,
    loadLeavePolicy,
    saveLeavePolicy,
    listAttendanceAggregates,
    clearLogs,
    refreshDashboard
  };
}
