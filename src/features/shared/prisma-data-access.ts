import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  AttendanceRecordEntity,
  AttendanceStore,
  AuditStore,
  CreateAttendanceRecordInput,
  CreateEmployeeInput,
  CreateLeaveRequestInput,
  CreateOrganizationInput,
  CreatePayrollRunInput,
  DataAccess,
  DeductionProfileEntity,
  DeductionProfileStore,
  EmployeeEntity,
  EmployeeStore,
  LeaveBalanceEntity,
  LeaveBalanceStore,
  LeaveRequestEntity,
  LeaveStore,
  OrganizationEntity,
  OrganizationStore,
  PayrollRunEntity,
  PayrollStore,
  RbacStore,
  RecordLeaveDecisionInput,
  RoleEntity,
  RoleWithPermissionsEntity,
  UpsertRoleInput,
  UpsertDeductionProfileInput,
  UpdateAttendanceRecordInput,
  UpdateEmployeeInput,
  UpdateLeaveRequestInput,
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

function toLeaveRequestEntity(record: {
  id: string;
  employeeId: string;
  leaveType: "ANNUAL" | "SICK" | "UNPAID";
  startDate: Date;
  endDate: Date;
  days: number;
  reason: string | null;
  state: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";
  decisionReason: string | null;
  approvedAt: Date | null;
  approvedBy: string | null;
  rejectedAt: Date | null;
  rejectedBy: string | null;
  canceledAt: Date | null;
  canceledBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}): LeaveRequestEntity {
  return record;
}

function toLeaveBalanceEntity(record: {
  employeeId: string;
  grantedDays: number;
  usedDays: number;
  remainingDays: number;
  carryOverDays: number;
  lastAccrualYear: number | null;
  updatedAt: Date;
}): LeaveBalanceEntity {
  return record;
}

function toPayrollEntity(record: {
  id: string;
  employeeId: string | null;
  periodStart: Date;
  periodEnd: Date;
  state: "PREVIEWED" | "CONFIRMED";
  grossPayKrw: number;
  withholdingTaxKrw: number | null;
  socialInsuranceKrw: number | null;
  otherDeductionsKrw: number | null;
  totalDeductionsKrw: number | null;
  netPayKrw: number | null;
  deductionBreakdown: unknown | null;
  deductionProfileId: string | null;
  deductionProfileVersion: number | null;
  sourceRecordCount: number;
  confirmedAt: Date | null;
  confirmedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}): PayrollRunEntity {
  return {
    ...record,
    deductionBreakdown:
      record.deductionBreakdown &&
      typeof record.deductionBreakdown === "object" &&
      !Array.isArray(record.deductionBreakdown)
        ? (record.deductionBreakdown as Record<string, unknown>)
        : null
  };
}

function decimalToNumber(value: Prisma.Decimal | null): number | null {
  if (value === null) {
    return null;
  }
  return Number(value);
}

function toDeductionProfileEntity(record: {
  id: string;
  name: string;
  version: number;
  mode: string;
  withholdingRate: Prisma.Decimal | null;
  socialInsuranceRate: Prisma.Decimal | null;
  fixedOtherDeductionKrw: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}): DeductionProfileEntity {
  return {
    id: record.id,
    name: record.name,
    version: record.version,
    mode: record.mode === "manual" ? "manual" : "profile",
    withholdingRate: decimalToNumber(record.withholdingRate),
    socialInsuranceRate: decimalToNumber(record.socialInsuranceRate),
    fixedOtherDeductionKrw: record.fixedOtherDeductionKrw,
    active: record.active,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt
  };
}

function toOrganizationEntity(record: {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}): OrganizationEntity {
  return record;
}

function toEmployeeEntity(record: {
  id: string;
  organizationId: string | null;
  name: string | null;
  email: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}): EmployeeEntity {
  return record;
}

function toRoleEntity(record: {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
}): RoleEntity {
  return record;
}

function toRoleWithPermissionsEntity(record: {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  permissions: Array<{ permission: string }>;
}): RoleWithPermissionsEntity {
  const permissions = record.permissions.map((row) => row.permission).sort((a, b) => a.localeCompare(b));
  return {
    ...toRoleEntity(record),
    permissions
  };
}

const organizations: OrganizationStore = {
  async create(input: CreateOrganizationInput) {
    const record = await prisma.organization.create({
      data: {
        name: input.name
      }
    });
    return toOrganizationEntity(record);
  },

  async findById(id: string) {
    const record = await prisma.organization.findUnique({
      where: { id }
    });
    return record ? toOrganizationEntity(record) : null;
  },

  async list() {
    const records = await prisma.organization.findMany({
      orderBy: { createdAt: "asc" }
    });
    return records.map(toOrganizationEntity);
  }
};

const employees: EmployeeStore = {
  async create(input: CreateEmployeeInput) {
    const record = await prisma.employee.create({
      data: {
        id: input.id,
        organizationId:
          input.organizationId === undefined ? null : input.organizationId,
        name: input.name === undefined ? null : input.name,
        email: input.email === undefined ? null : input.email,
        active: input.active ?? true
      }
    });
    return toEmployeeEntity(record);
  },

  async findById(id: string) {
    const record = await prisma.employee.findUnique({
      where: { id }
    });
    return record ? toEmployeeEntity(record) : null;
  },

  async update(id: string, input: UpdateEmployeeInput) {
    const record = await prisma.employee.update({
      where: { id },
      data: {
        organizationId: input.organizationId,
        name: input.name,
        email: input.email,
        active: input.active
      }
    });
    return toEmployeeEntity(record);
  },

  async list(input: { active?: boolean; organizationId?: string }) {
    const records = await prisma.employee.findMany({
      where: {
        ...(input.active !== undefined ? { active: input.active } : {}),
        ...(input.organizationId ? { organizationId: input.organizationId } : {})
      },
      orderBy: { id: "asc" }
    });
    return records.map(toEmployeeEntity);
  }
};

const rbac: RbacStore = {
  async listRoles() {
    const roles = await prisma.role.findMany({
      include: {
        permissions: {
          select: { permission: true }
        }
      },
      orderBy: { id: "asc" }
    });
    return roles.map(toRoleWithPermissionsEntity);
  },

  async findRoleById(id: string) {
    const role = await prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          select: { permission: true }
        }
      }
    });
    return role ? toRoleWithPermissionsEntity(role) : null;
  },

  async listRolePermissions(roleId: string) {
    const rows = await prisma.rolePermission.findMany({
      where: { roleId },
      select: { permission: true },
      orderBy: { permission: "asc" }
    });
    return rows.map((row) => row.permission);
  },

  async upsertRole(input: UpsertRoleInput) {
    const role = await prisma.role.upsert({
      where: { id: input.id },
      create: {
        id: input.id,
        name: input.name,
        description: input.description === undefined ? null : input.description
      },
      update: {
        name: input.name,
        description: input.description === undefined ? null : input.description
      }
    });

    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id }
    });

    const permissions = (input.permissions ?? [])
      .map((value) => value.trim())
      .filter((value) => value.length > 0);

    if (permissions.length > 0) {
      await prisma.rolePermission.createMany({
        data: permissions.map((permission) => ({
          roleId: role.id,
          permission
        })),
        skipDuplicates: true
      });
    }

    const stored = await prisma.role.findUnique({
      where: { id: role.id },
      include: {
        permissions: {
          select: { permission: true }
        }
      }
    });

    // stored must exist because upsert succeeded.
    return toRoleWithPermissionsEntity(stored!);
  }
};

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
  },

  async listInPeriod(input: {
    periodStart: Date;
    periodEnd: Date;
    employeeId?: string;
    state?: "PENDING" | "APPROVED" | "REJECTED";
  }) {
    const records = await prisma.attendanceRecord.findMany({
      where: {
        checkInAt: {
          gte: input.periodStart,
          lte: input.periodEnd
        },
        ...(input.employeeId ? { employeeId: input.employeeId } : {}),
        ...(input.state ? { state: input.state } : {})
      },
      orderBy: { checkInAt: "asc" }
    });
    return records.map(toAttendanceEntity);
  }
};

const leave: LeaveStore = {
  async create(input: CreateLeaveRequestInput) {
    const request = await prisma.leaveRequest.create({
      data: {
        employeeId: input.employeeId,
        leaveType: input.leaveType,
        startDate: input.startDate,
        endDate: input.endDate,
        days: input.days,
        reason: input.reason ?? null
      }
    });
    return toLeaveRequestEntity(request);
  },

  async findById(id: string) {
    const request = await prisma.leaveRequest.findUnique({
      where: { id }
    });
    return request ? toLeaveRequestEntity(request) : null;
  },

  async update(id: string, input: UpdateLeaveRequestInput) {
    const request = await prisma.leaveRequest.update({
      where: { id },
      data: {
        leaveType: input.leaveType,
        startDate: input.startDate,
        endDate: input.endDate,
        days: input.days,
        reason: input.reason,
        state: input.state,
        decisionReason: input.decisionReason,
        approvedAt: input.approvedAt,
        approvedBy: input.approvedBy,
        rejectedAt: input.rejectedAt,
        rejectedBy: input.rejectedBy,
        canceledAt: input.canceledAt,
        canceledBy: input.canceledBy
      }
    });
    return toLeaveRequestEntity(request);
  },

  async listInPeriod(input: {
    periodStart: Date;
    periodEnd: Date;
    employeeId?: string;
    state?: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";
  }) {
    const requests = await prisma.leaveRequest.findMany({
      where: {
        startDate: {
          lte: input.periodEnd
        },
        endDate: {
          gte: input.periodStart
        },
        ...(input.employeeId ? { employeeId: input.employeeId } : {}),
        ...(input.state ? { state: input.state } : {})
      },
      orderBy: { startDate: "asc" }
    });
    return requests.map(toLeaveRequestEntity);
  },

  async findOverlappingActiveRequests(input: {
    employeeId: string;
    startDate: Date;
    endDate: Date;
    excludeRequestId?: string;
  }) {
    const requests = await prisma.leaveRequest.findMany({
      where: {
        employeeId: input.employeeId,
        state: {
          in: ["PENDING", "APPROVED"]
        },
        startDate: {
          lte: input.endDate
        },
        endDate: {
          gte: input.startDate
        },
        ...(input.excludeRequestId
          ? {
              id: {
                not: input.excludeRequestId
              }
            }
          : {})
      },
      orderBy: { startDate: "asc" }
    });
    return requests.map(toLeaveRequestEntity);
  },

  async appendDecision(input: RecordLeaveDecisionInput) {
    await prisma.leaveApproval.create({
      data: {
        requestId: input.requestId,
        action: input.action,
        actorId: input.actorId,
        actorRole: input.actorRole,
        reason: input.reason
      }
    });
  }
};

const leaveBalance: LeaveBalanceStore = {
  async ensure(employeeId: string, defaultGrantedDays: number) {
    const existing = await prisma.leaveBalanceProjection.findUnique({
      where: { employeeId }
    });

    if (existing) {
      return toLeaveBalanceEntity(existing);
    }

    const created = await prisma.leaveBalanceProjection.create({
      data: {
        employeeId,
        grantedDays: defaultGrantedDays,
        usedDays: 0,
        remainingDays: defaultGrantedDays,
        carryOverDays: 0,
        lastAccrualYear: null
      }
    });
    return toLeaveBalanceEntity(created);
  },

  async applyUsage(input: { employeeId: string; usedDaysDelta: number; defaultGrantedDays: number }) {
    const current = await leaveBalance.ensure(input.employeeId, input.defaultGrantedDays);
    const usedDays = current.usedDays + input.usedDaysDelta;
    const remainingDays = current.grantedDays - usedDays;

    const updated = await prisma.leaveBalanceProjection.update({
      where: { employeeId: input.employeeId },
      data: {
        usedDays,
        remainingDays
      }
    });
    return toLeaveBalanceEntity(updated);
  },

  async settleAccrual(input: {
    employeeId: string;
    year: number;
    annualGrantDays: number;
    carryOverCapDays: number;
    defaultGrantedDays: number;
  }) {
    const current = await leaveBalance.ensure(input.employeeId, input.defaultGrantedDays);
    const carryOverDays = Math.min(input.carryOverCapDays, Math.max(0, current.remainingDays));
    const grantedDays = input.annualGrantDays + carryOverDays;

    const updated = await prisma.leaveBalanceProjection.update({
      where: { employeeId: input.employeeId },
      data: {
        grantedDays,
        usedDays: 0,
        remainingDays: grantedDays,
        carryOverDays,
        lastAccrualYear: input.year
      }
    });
    return toLeaveBalanceEntity(updated);
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
        withholdingTaxKrw: input.withholdingTaxKrw ?? null,
        socialInsuranceKrw: input.socialInsuranceKrw ?? null,
        otherDeductionsKrw: input.otherDeductionsKrw ?? null,
        totalDeductionsKrw: input.totalDeductionsKrw ?? null,
        netPayKrw: input.netPayKrw ?? null,
        deductionBreakdown:
          input.deductionBreakdown === undefined
            ? undefined
            : input.deductionBreakdown === null
              ? Prisma.JsonNull
              : (input.deductionBreakdown as Prisma.InputJsonValue),
        deductionProfileId: input.deductionProfileId ?? null,
        deductionProfileVersion: input.deductionProfileVersion ?? null,
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

  async listInPeriod(input: {
    periodStart: Date;
    periodEnd: Date;
    employeeId?: string;
    state?: "PREVIEWED" | "CONFIRMED";
  }) {
    const runs = await prisma.payrollRun.findMany({
      where: {
        periodStart: {
          gte: input.periodStart
        },
        periodEnd: {
          lte: input.periodEnd
        },
        ...(input.employeeId ? { employeeId: input.employeeId } : {}),
        ...(input.state ? { state: input.state } : {})
      },
      orderBy: { periodStart: "asc" }
    });
    return runs.map(toPayrollEntity);
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

const deductionProfiles: DeductionProfileStore = {
  async findById(id: string) {
    const profile = await prisma.deductionProfile.findUnique({
      where: { id }
    });
    return profile ? toDeductionProfileEntity(profile) : null;
  },

  async list(input: { active?: boolean; mode?: "manual" | "profile" }) {
    const profiles = await prisma.deductionProfile.findMany({
      where: {
        ...(input.active === undefined ? {} : { active: input.active }),
        ...(input.mode ? { mode: input.mode } : {})
      },
      orderBy: { id: "asc" }
    });
    return profiles.map(toDeductionProfileEntity);
  },

  async upsert(input: UpsertDeductionProfileInput) {
    const profile = await prisma.deductionProfile.upsert({
      where: { id: input.id },
      create: {
        id: input.id,
        name: input.name,
        version: 1,
        mode: input.mode,
        withholdingRate:
          input.withholdingRate === null ? null : new Prisma.Decimal(input.withholdingRate),
        socialInsuranceRate:
          input.socialInsuranceRate === null ? null : new Prisma.Decimal(input.socialInsuranceRate),
        fixedOtherDeductionKrw: input.fixedOtherDeductionKrw,
        active: input.active
      },
      update: {
        name: input.name,
        mode: input.mode,
        withholdingRate:
          input.withholdingRate === null ? null : new Prisma.Decimal(input.withholdingRate),
        socialInsuranceRate:
          input.socialInsuranceRate === null ? null : new Prisma.Decimal(input.socialInsuranceRate),
        fixedOtherDeductionKrw: input.fixedOtherDeductionKrw,
        active: input.active,
        version: {
          increment: 1
        }
      }
    });
    return toDeductionProfileEntity(profile);
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
  organizations,
  employees,
  rbac,
  attendance,
  leave,
  leaveBalance,
  payroll,
  deductionProfiles,
  audit
};
