import { prisma } from "@/lib/prisma";
import type {
  AttendanceRecordEntity,
  AttendanceStore,
  AuditStore,
  CreateAttendanceRecordInput,
  CreatePayrollRunInput,
  DataAccess,
  PayrollRunEntity,
  PayrollStore,
  UpdateAttendanceRecordInput,
  UpdatePayrollRunInput
} from "@/features/shared/data-access";

function toAttendanceEntity(record: {
  id: string;
  employeeId: string;
  checkInAt: Date;
  checkOutAt: Date | null;
  breakMinutes: number;
  isHoliday: boolean;
  notes: string | null;
  state: "PENDING" | "APPROVED" | "REJECTED";
  approvedAt: Date | null;
  approvedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}): AttendanceRecordEntity {
  return record;
}

function toPayrollEntity(record: {
  id: string;
  employeeId: string | null;
  periodStart: Date;
  periodEnd: Date;
  state: "PREVIEWED" | "CONFIRMED";
  grossPayKrw: number;
  sourceRecordCount: number;
  confirmedAt: Date | null;
  confirmedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}): PayrollRunEntity {
  return record;
}

const attendance: AttendanceStore = {
  async create(input: CreateAttendanceRecordInput) {
    const record = await prisma.attendanceRecord.create({
      data: {
        employeeId: input.employeeId,
        checkInAt: input.checkInAt,
        checkOutAt: input.checkOutAt,
        breakMinutes: input.breakMinutes,
        isHoliday: input.isHoliday,
        notes: input.notes ?? null
      }
    });
    return toAttendanceEntity(record);
  },

  async findById(id: string) {
    const record = await prisma.attendanceRecord.findUnique({
      where: { id }
    });
    return record ? toAttendanceEntity(record) : null;
  },

  async update(id: string, input: UpdateAttendanceRecordInput) {
    const record = await prisma.attendanceRecord.update({
      where: { id },
      data: {
        checkInAt: input.checkInAt,
        checkOutAt: input.checkOutAt,
        breakMinutes: input.breakMinutes,
        isHoliday: input.isHoliday,
        notes: input.notes,
        state: input.state,
        approvedAt: input.approvedAt,
        approvedBy: input.approvedBy
      }
    });
    return toAttendanceEntity(record);
  },

  async listApprovedInPeriod(input: { periodStart: Date; periodEnd: Date; employeeId?: string }) {
    const records = await prisma.attendanceRecord.findMany({
      where: {
        state: "APPROVED",
        checkInAt: {
          gte: input.periodStart,
          lte: input.periodEnd
        },
        ...(input.employeeId ? { employeeId: input.employeeId } : {})
      },
      orderBy: { checkInAt: "asc" }
    });
    return records.map(toAttendanceEntity);
  }
};

const payroll: PayrollStore = {
  async create(input: CreatePayrollRunInput) {
    const run = await prisma.payrollRun.create({
      data: {
        employeeId: input.employeeId,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        grossPayKrw: input.grossPayKrw,
        sourceRecordCount: input.sourceRecordCount
      }
    });
    return toPayrollEntity(run);
  },

  async findById(id: string) {
    const run = await prisma.payrollRun.findUnique({
      where: { id }
    });
    return run ? toPayrollEntity(run) : null;
  },

  async update(id: string, input: UpdatePayrollRunInput) {
    const run = await prisma.payrollRun.update({
      where: { id },
      data: {
        state: input.state,
        confirmedAt: input.confirmedAt,
        confirmedBy: input.confirmedBy
      }
    });
    return toPayrollEntity(run);
  }
};

const audit: AuditStore = {
  async append(input) {
    await prisma.auditLog.create({
      data: {
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        actorRole: input.actorRole,
        actorId: input.actorId,
        payload: input.payload as object | undefined
      }
    });
  }
};

export const prismaDataAccess: DataAccess = {
  attendance,
  payroll,
  audit
};
