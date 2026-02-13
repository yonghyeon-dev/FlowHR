export type AttendanceState = "PENDING" | "APPROVED" | "REJECTED";
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

export interface AuditStore {
  append(input: AppendAuditLogInput): Promise<void>;
}

export type DataAccess = {
  attendance: AttendanceStore;
  payroll: PayrollStore;
  audit: AuditStore;
};
