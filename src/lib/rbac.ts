import type { ActorRole } from "@/lib/actor";

export const Permissions = {
  rbacManage: "rbac.manage",

  peopleOrganizationsManage: "people.organizations.manage",
  peopleEmployeesManage: "people.employees.manage",

  attendanceRecordWriteAny: "attendance.record.write.any",
  attendanceRecordWriteOwn: "attendance.record.write.own",
  attendanceRecordApprove: "attendance.record.approve",
  attendanceRecordReject: "attendance.record.reject",
  attendanceRecordListAny: "attendance.record.list.any",
  attendanceRecordListByEmployee: "attendance.record.list.by_employee",
  attendanceRecordListOwn: "attendance.record.list.own",
  attendanceAggregateListAny: "attendance.aggregate.list.any",
  attendanceAggregateListByEmployee: "attendance.aggregate.list.by_employee",
  attendanceAggregateListOwn: "attendance.aggregate.list.own",

  leaveRequestWriteAny: "leave.request.write.any",
  leaveRequestWriteOwn: "leave.request.write.own",
  leaveRequestApprove: "leave.request.approve",
  leaveRequestReject: "leave.request.reject",
  leaveRequestListAny: "leave.request.list.any",
  leaveRequestListByEmployee: "leave.request.list.by_employee",
  leaveRequestListOwn: "leave.request.list.own",
  leaveBalanceReadAny: "leave.balance.read.any",
  leaveBalanceReadOwn: "leave.balance.read.own",
  leaveAccrualSettle: "leave.accrual.settle",

  payrollRunPreview: "payroll.run.preview",
  payrollRunConfirm: "payroll.run.confirm",
  payrollRunList: "payroll.run.list",
  payrollDeductionProfileRead: "payroll.deduction_profile.read",
  payrollDeductionProfileWrite: "payroll.deduction_profile.write"
} as const;

export type Permission = (typeof Permissions)[keyof typeof Permissions];

// Default RBAC mapping used for memory mode and runtime fallback.
// This must remain aligned with the seed data in `202602150001_rbac_foundation`.
export const defaultRolePermissions: Record<ActorRole, readonly Permission[]> = {
  admin: Object.values(Permissions),
  system: Object.values(Permissions),
  manager: [
    Permissions.attendanceRecordWriteAny,
    Permissions.attendanceRecordApprove,
    Permissions.attendanceRecordReject,
    Permissions.attendanceRecordListByEmployee,
    Permissions.attendanceAggregateListByEmployee,
    Permissions.leaveRequestWriteAny,
    Permissions.leaveRequestApprove,
    Permissions.leaveRequestReject,
    Permissions.leaveRequestListByEmployee,
    Permissions.leaveBalanceReadAny
  ],
  payroll_operator: [
    Permissions.attendanceRecordListAny,
    Permissions.attendanceAggregateListAny,
    Permissions.leaveRequestListAny,
    Permissions.leaveBalanceReadAny,
    Permissions.leaveAccrualSettle,
    Permissions.payrollRunPreview,
    Permissions.payrollRunConfirm,
    Permissions.payrollRunList,
    Permissions.payrollDeductionProfileRead,
    Permissions.payrollDeductionProfileWrite
  ],
  employee: [
    Permissions.attendanceRecordWriteOwn,
    Permissions.attendanceRecordListOwn,
    Permissions.attendanceAggregateListOwn,
    Permissions.leaveRequestWriteOwn,
    Permissions.leaveRequestListOwn,
    Permissions.leaveBalanceReadOwn
  ]
};

