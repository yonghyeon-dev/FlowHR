export type AttendanceState = "PENDING" | "APPROVED" | "REJECTED";
export type LeaveType = "ANNUAL" | "SICK" | "UNPAID";
export type LeaveRequestState = "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";
export type LeaveDecisionAction = "APPROVED" | "REJECTED" | "CANCELED";
export type PayrollState = "PREVIEWED" | "CONFIRMED";

export type AttendanceRecordEntity = {
  id: string;
  employeeId: string;
  checkInAt: Date;
  checkOutAt: Date | null;
  breakMinutes: number;
  isHoliday: boolean;
  notes: string | null;
  state: AttendanceState;
  approvedAt: Date | null;
  approvedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PayrollRunEntity = {
  id: string;
  employeeId: string | null;
  periodStart: Date;
  periodEnd: Date;
  state: PayrollState;
  grossPayKrw: number;
  sourceRecordCount: number;
  confirmedAt: Date | null;
  confirmedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type LeaveRequestEntity = {
  id: string;
  employeeId: string;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  days: number;
  reason: string | null;
  state: LeaveRequestState;
  decisionReason: string | null;
  approvedAt: Date | null;
  approvedBy: string | null;
  rejectedAt: Date | null;
  rejectedBy: string | null;
  canceledAt: Date | null;
  canceledBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type LeaveBalanceEntity = {
  employeeId: string;
  grantedDays: number;
  usedDays: number;
  remainingDays: number;
  updatedAt: Date;
};

export type CreateAttendanceRecordInput = {
  employeeId: string;
  checkInAt: Date;
  checkOutAt: Date | null;
  breakMinutes: number;
  isHoliday: boolean;
  notes?: string;
};

export type UpdateAttendanceRecordInput = {
  checkInAt?: Date;
  checkOutAt?: Date | null;
  breakMinutes?: number;
  isHoliday?: boolean;
  notes?: string | null;
  state?: AttendanceState;
  approvedAt?: Date | null;
  approvedBy?: string | null;
};

export type CreatePayrollRunInput = {
  employeeId?: string;
  periodStart: Date;
  periodEnd: Date;
  grossPayKrw: number;
  sourceRecordCount: number;
};

export type UpdatePayrollRunInput = {
  state?: PayrollState;
  confirmedAt?: Date | null;
  confirmedBy?: string | null;
};

export type CreateLeaveRequestInput = {
  employeeId: string;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  days: number;
  reason?: string;
};

export type UpdateLeaveRequestInput = {
  leaveType?: LeaveType;
  startDate?: Date;
  endDate?: Date;
  days?: number;
  reason?: string | null;
  state?: LeaveRequestState;
  decisionReason?: string | null;
  approvedAt?: Date | null;
  approvedBy?: string | null;
  rejectedAt?: Date | null;
  rejectedBy?: string | null;
  canceledAt?: Date | null;
  canceledBy?: string | null;
};

export type RecordLeaveDecisionInput = {
  requestId: string;
  action: LeaveDecisionAction;
  actorId: string;
  actorRole: string;
  reason?: string;
};

export type AppendAuditLogInput = {
  action: string;
  entityType: string;
  entityId?: string;
  actorRole: string;
  actorId?: string;
  payload?: unknown;
};

export interface AttendanceStore {
  create(input: CreateAttendanceRecordInput): Promise<AttendanceRecordEntity>;
  findById(id: string): Promise<AttendanceRecordEntity | null>;
  update(id: string, input: UpdateAttendanceRecordInput): Promise<AttendanceRecordEntity>;
  listApprovedInPeriod(input: {
    periodStart: Date;
    periodEnd: Date;
    employeeId?: string;
  }): Promise<AttendanceRecordEntity[]>;
}

export interface PayrollStore {
  create(input: CreatePayrollRunInput): Promise<PayrollRunEntity>;
  findById(id: string): Promise<PayrollRunEntity | null>;
  update(id: string, input: UpdatePayrollRunInput): Promise<PayrollRunEntity>;
}

export interface LeaveStore {
  create(input: CreateLeaveRequestInput): Promise<LeaveRequestEntity>;
  findById(id: string): Promise<LeaveRequestEntity | null>;
  update(id: string, input: UpdateLeaveRequestInput): Promise<LeaveRequestEntity>;
  findOverlappingActiveRequests(input: {
    employeeId: string;
    startDate: Date;
    endDate: Date;
    excludeRequestId?: string;
  }): Promise<LeaveRequestEntity[]>;
  appendDecision(input: RecordLeaveDecisionInput): Promise<void>;
}

export interface LeaveBalanceStore {
  ensure(employeeId: string, defaultGrantedDays: number): Promise<LeaveBalanceEntity>;
  applyUsage(input: {
    employeeId: string;
    usedDaysDelta: number;
    defaultGrantedDays: number;
  }): Promise<LeaveBalanceEntity>;
}

export interface AuditStore {
  append(input: AppendAuditLogInput): Promise<void>;
}

export type DataAccess = {
  attendance: AttendanceStore;
  leave: LeaveStore;
  leaveBalance: LeaveBalanceStore;
  payroll: PayrollStore;
  audit: AuditStore;
};
