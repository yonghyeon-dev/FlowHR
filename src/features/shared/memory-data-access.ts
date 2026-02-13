import type {
  AppendAuditLogInput,
  AttendanceRecordEntity,
  DataAccess,
  LeaveBalanceEntity,
  LeaveRequestEntity,
  UpdateAttendanceRecordInput,
  UpdateLeaveRequestInput,
  UpdatePayrollRunInput,
  PayrollRunEntity
} from "@/features/shared/data-access";

type MemoryState = {
  sequence: number;
  attendance: Map<string, AttendanceRecordEntity>;
  leaveRequests: Map<string, LeaveRequestEntity>;
  leaveBalances: Map<string, LeaveBalanceEntity>;
  payroll: Map<string, PayrollRunEntity>;
  audit: Array<AppendAuditLogInput & { createdAt: Date }>;
};

function createState(): MemoryState {
  return {
    sequence: 1,
    attendance: new Map<string, AttendanceRecordEntity>(),
    leaveRequests: new Map<string, LeaveRequestEntity>(),
    leaveBalances: new Map<string, LeaveBalanceEntity>(),
    payroll: new Map<string, PayrollRunEntity>(),
    audit: []
  };
}

let state = createState();

function nextId(prefix: string) {
  const id = `${prefix}-${String(state.sequence).padStart(5, "0")}`;
  state.sequence += 1;
  return id;
}

function cloneDate(value: Date) {
  return new Date(value.getTime());
}

function cloneAttendance(entity: AttendanceRecordEntity): AttendanceRecordEntity {
  return {
    ...entity,
    checkInAt: cloneDate(entity.checkInAt),
    checkOutAt: entity.checkOutAt ? cloneDate(entity.checkOutAt) : null,
    approvedAt: entity.approvedAt ? cloneDate(entity.approvedAt) : null,
    createdAt: cloneDate(entity.createdAt),
    updatedAt: cloneDate(entity.updatedAt)
  };
}

function cloneLeaveRequest(entity: LeaveRequestEntity): LeaveRequestEntity {
  return {
    ...entity,
    startDate: cloneDate(entity.startDate),
    endDate: cloneDate(entity.endDate),
    approvedAt: entity.approvedAt ? cloneDate(entity.approvedAt) : null,
    rejectedAt: entity.rejectedAt ? cloneDate(entity.rejectedAt) : null,
    canceledAt: entity.canceledAt ? cloneDate(entity.canceledAt) : null,
    createdAt: cloneDate(entity.createdAt),
    updatedAt: cloneDate(entity.updatedAt)
  };
}

function cloneLeaveBalance(entity: LeaveBalanceEntity): LeaveBalanceEntity {
  return {
    ...entity,
    updatedAt: cloneDate(entity.updatedAt)
  };
}

function clonePayroll(entity: PayrollRunEntity): PayrollRunEntity {
  return {
    ...entity,
    periodStart: cloneDate(entity.periodStart),
    periodEnd: cloneDate(entity.periodEnd),
    confirmedAt: entity.confirmedAt ? cloneDate(entity.confirmedAt) : null,
    createdAt: cloneDate(entity.createdAt),
    updatedAt: cloneDate(entity.updatedAt)
  };
}

function updateAttendanceEntity(
  existing: AttendanceRecordEntity,
  input: UpdateAttendanceRecordInput
): AttendanceRecordEntity {
  return {
    ...existing,
    checkInAt: input.checkInAt ?? existing.checkInAt,
    checkOutAt: input.checkOutAt !== undefined ? input.checkOutAt : existing.checkOutAt,
    breakMinutes: input.breakMinutes ?? existing.breakMinutes,
    isHoliday: input.isHoliday ?? existing.isHoliday,
    notes: input.notes !== undefined ? input.notes : existing.notes,
    state: input.state ?? existing.state,
    approvedAt: input.approvedAt !== undefined ? input.approvedAt : existing.approvedAt,
    approvedBy: input.approvedBy !== undefined ? input.approvedBy : existing.approvedBy,
    updatedAt: new Date()
  };
}

function updateLeaveRequestEntity(
  existing: LeaveRequestEntity,
  input: UpdateLeaveRequestInput
): LeaveRequestEntity {
  return {
    ...existing,
    leaveType: input.leaveType ?? existing.leaveType,
    startDate: input.startDate ?? existing.startDate,
    endDate: input.endDate ?? existing.endDate,
    days: input.days ?? existing.days,
    reason: input.reason !== undefined ? input.reason : existing.reason,
    state: input.state ?? existing.state,
    decisionReason: input.decisionReason !== undefined ? input.decisionReason : existing.decisionReason,
    approvedAt: input.approvedAt !== undefined ? input.approvedAt : existing.approvedAt,
    approvedBy: input.approvedBy !== undefined ? input.approvedBy : existing.approvedBy,
    rejectedAt: input.rejectedAt !== undefined ? input.rejectedAt : existing.rejectedAt,
    rejectedBy: input.rejectedBy !== undefined ? input.rejectedBy : existing.rejectedBy,
    canceledAt: input.canceledAt !== undefined ? input.canceledAt : existing.canceledAt,
    canceledBy: input.canceledBy !== undefined ? input.canceledBy : existing.canceledBy,
    updatedAt: new Date()
  };
}

function updatePayrollEntity(existing: PayrollRunEntity, input: UpdatePayrollRunInput): PayrollRunEntity {
  return {
    ...existing,
    state: input.state ?? existing.state,
    confirmedAt: input.confirmedAt !== undefined ? input.confirmedAt : existing.confirmedAt,
    confirmedBy: input.confirmedBy !== undefined ? input.confirmedBy : existing.confirmedBy,
    updatedAt: new Date()
  };
}

export const memoryDataAccess: DataAccess = {
  attendance: {
    async create(input) {
      const now = new Date();
      const entity: AttendanceRecordEntity = {
        id: nextId("AR"),
        employeeId: input.employeeId,
        checkInAt: cloneDate(input.checkInAt),
        checkOutAt: input.checkOutAt ? cloneDate(input.checkOutAt) : null,
        breakMinutes: input.breakMinutes,
        isHoliday: input.isHoliday,
        notes: input.notes ?? null,
        state: "PENDING",
        approvedAt: null,
        approvedBy: null,
        createdAt: now,
        updatedAt: now
      };
      state.attendance.set(entity.id, entity);
      return cloneAttendance(entity);
    },

    async findById(id) {
      const found = state.attendance.get(id);
      return found ? cloneAttendance(found) : null;
    },

    async update(id, input) {
      const existing = state.attendance.get(id);
      if (!existing) {
        throw new Error(`attendance record not found: ${id}`);
      }
      const updated = updateAttendanceEntity(existing, input);
      state.attendance.set(id, updated);
      return cloneAttendance(updated);
    },

    async listApprovedInPeriod(input) {
      const rows: AttendanceRecordEntity[] = [];
      for (const entity of state.attendance.values()) {
        if (entity.state !== "APPROVED") {
          continue;
        }
        if (entity.checkInAt < input.periodStart || entity.checkInAt > input.periodEnd) {
          continue;
        }
        if (input.employeeId && entity.employeeId !== input.employeeId) {
          continue;
        }
        rows.push(cloneAttendance(entity));
      }
      rows.sort((a, b) => a.checkInAt.getTime() - b.checkInAt.getTime());
      return rows;
    }
  },

  leave: {
    async create(input) {
      const now = new Date();
      const request: LeaveRequestEntity = {
        id: nextId("LR"),
        employeeId: input.employeeId,
        leaveType: input.leaveType,
        startDate: cloneDate(input.startDate),
        endDate: cloneDate(input.endDate),
        days: input.days,
        reason: input.reason ?? null,
        state: "PENDING",
        decisionReason: null,
        approvedAt: null,
        approvedBy: null,
        rejectedAt: null,
        rejectedBy: null,
        canceledAt: null,
        canceledBy: null,
        createdAt: now,
        updatedAt: now
      };
      state.leaveRequests.set(request.id, request);
      return cloneLeaveRequest(request);
    },

    async findById(id) {
      const request = state.leaveRequests.get(id);
      return request ? cloneLeaveRequest(request) : null;
    },

    async update(id, input) {
      const existing = state.leaveRequests.get(id);
      if (!existing) {
        throw new Error(`leave request not found: ${id}`);
      }
      const updated = updateLeaveRequestEntity(existing, input);
      state.leaveRequests.set(id, updated);
      return cloneLeaveRequest(updated);
    },

    async findOverlappingActiveRequests(input) {
      const rows: LeaveRequestEntity[] = [];
      for (const request of state.leaveRequests.values()) {
        if (request.employeeId !== input.employeeId) {
          continue;
        }
        if (request.state !== "PENDING" && request.state !== "APPROVED") {
          continue;
        }
        if (input.excludeRequestId && request.id === input.excludeRequestId) {
          continue;
        }
        const overlaps = request.startDate <= input.endDate && request.endDate >= input.startDate;
        if (overlaps) {
          rows.push(cloneLeaveRequest(request));
        }
      }
      rows.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
      return rows;
    },

    async appendDecision(input) {
      state.audit.push({
        action: `leave.decision.${input.action.toLowerCase()}`,
        entityType: "LeaveApproval",
        entityId: input.requestId,
        actorRole: input.actorRole,
        actorId: input.actorId,
        payload: {
          action: input.action,
          reason: input.reason ?? null
        },
        createdAt: new Date()
      });
    }
  },

  leaveBalance: {
    async ensure(employeeId, defaultGrantedDays) {
      const existing = state.leaveBalances.get(employeeId);
      if (existing) {
        return cloneLeaveBalance(existing);
      }

      const now = new Date();
      const created: LeaveBalanceEntity = {
        employeeId,
        grantedDays: defaultGrantedDays,
        usedDays: 0,
        remainingDays: defaultGrantedDays,
        carryOverDays: 0,
        lastAccrualYear: null,
        updatedAt: now
      };
      state.leaveBalances.set(employeeId, created);
      return cloneLeaveBalance(created);
    },

    async applyUsage(input) {
      const current = await this.ensure(input.employeeId, input.defaultGrantedDays);
      const next: LeaveBalanceEntity = {
        ...current,
        usedDays: current.usedDays + input.usedDaysDelta,
        remainingDays: current.grantedDays - (current.usedDays + input.usedDaysDelta),
        updatedAt: new Date()
      };
      state.leaveBalances.set(input.employeeId, next);
      return cloneLeaveBalance(next);
    },

    async settleAccrual(input) {
      const current = await this.ensure(input.employeeId, input.defaultGrantedDays);
      const carryOverDays = Math.min(input.carryOverCapDays, Math.max(0, current.remainingDays));
      const grantedDays = input.annualGrantDays + carryOverDays;

      const next: LeaveBalanceEntity = {
        ...current,
        grantedDays,
        usedDays: 0,
        remainingDays: grantedDays,
        carryOverDays,
        lastAccrualYear: input.year,
        updatedAt: new Date()
      };
      state.leaveBalances.set(input.employeeId, next);
      return cloneLeaveBalance(next);
    }
  },

  payroll: {
    async create(input) {
      const now = new Date();
      const run: PayrollRunEntity = {
        id: nextId("PR"),
        employeeId: input.employeeId ?? null,
        periodStart: cloneDate(input.periodStart),
        periodEnd: cloneDate(input.periodEnd),
        state: "PREVIEWED",
        grossPayKrw: input.grossPayKrw,
        sourceRecordCount: input.sourceRecordCount,
        confirmedAt: null,
        confirmedBy: null,
        createdAt: now,
        updatedAt: now
      };
      state.payroll.set(run.id, run);
      return clonePayroll(run);
    },

    async findById(id) {
      const run = state.payroll.get(id);
      return run ? clonePayroll(run) : null;
    },

    async update(id, input) {
      const existing = state.payroll.get(id);
      if (!existing) {
        throw new Error(`payroll run not found: ${id}`);
      }
      const updated = updatePayrollEntity(existing, input);
      state.payroll.set(id, updated);
      return clonePayroll(updated);
    }
  },

  audit: {
    async append(input) {
      state.audit.push({
        ...input,
        createdAt: new Date()
      });
    }
  }
};

export function resetMemoryDataAccess() {
  state = createState();
}

export function getMemoryAuditActions() {
  return state.audit.map((entry) => entry.action);
}
