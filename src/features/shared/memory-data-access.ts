import type {
  AppendAuditLogInput,
  AttendanceRecordEntity,
  DataAccess,
  PayrollRunEntity,
  UpdateAttendanceRecordInput,
  UpdatePayrollRunInput
} from "@/features/shared/data-access";

type MemoryState = {
  sequence: number;
  attendance: Map<string, AttendanceRecordEntity>;
  payroll: Map<string, PayrollRunEntity>;
  audit: Array<AppendAuditLogInput & { createdAt: Date }>;
};

function createState(): MemoryState {
  return {
    sequence: 1,
    attendance: new Map<string, AttendanceRecordEntity>(),
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
