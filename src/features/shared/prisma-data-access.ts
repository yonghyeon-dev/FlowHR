import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type {
  ApprovalDelegationEntity,
  ApprovalDomain,
  ApprovalLineTemplateEntity,
  ApprovalPolicyEntity,
  ApprovalStore,
  AuditLogEntity,
  AttendanceRecordEntity,
  AttendanceStore,
  AuditStore,
  CreateApprovalDelegationInput,
  CreateApprovalLineTemplateInput,
  CreateAttendanceRecordInput,
  CreateDepartmentInput,
  CreateEmployeeInput,
  CreateLeaveRequestInput,
  CreateOrganizationInput,
  CreatePayrollRunInput,
  CreatePositionInput,
  CreateWorkScheduleTemplateInput,
  CreateWorkScheduleInput,
  DepartmentEntity,
  DepartmentStore,
  UpdateWorkScheduleTemplateInput,
  UpdateWorkScheduleInput,
  DataAccess,
  DeductionProfileEntity,
  DeductionProfileStore,
  EmployeeEntity,
  EmployeeStore,
  ListAuditLogsInput,
  LeaveBalanceEntity,
  LeaveBalanceStore,
  LeavePolicyEntity,
  LeavePolicyStore,
  LeaveRequestEntity,
  LeaveStore,
  OrganizationEntity,
  OrganizationStore,
  PayrollRunEntity,
  PayrollStore,
  PositionEntity,
  PositionStore,
  RbacStore,
  RecordLeaveDecisionInput,
  RoleEntity,
  RoleWithPermissionsEntity,
  ScheduleAnomalyIncidentEntity,
  ScheduleAnomalyIncidentHistoryEntryEntity,
  SchedulingStore,
  UpsertApprovalPolicyInput,
  UpsertRoleInput,
  UpsertScheduleAnomalyIncidentInput,
  UpsertDeductionProfileInput,
  UpdateApprovalDelegationInput,
  UpdateApprovalLineTemplateInput,
  UpdateAttendanceRecordInput,
  UpdateDepartmentInput,
  UpdateEmployeeInput,
  UpdateLeaveRequestInput,
  UpdatePositionInput,
  UpdatePayrollRunInput,
  UpsertLeavePolicyInput,
  WorkScheduleTemplateEntity,
  WorkScheduleEntity
} from "@/features/shared/data-access";

function toAttendanceEntity(record: {
  id: string;
  employeeId: string;
  checkInAt: Date;
  checkOutAt: Date | null;
  breakMinutes: number;
  isHoliday: boolean;
  notes: string | null;
  captureChannel: "MANUAL" | "GPS" | "QR" | "WIFI" | "DEVICE";
  captureDeviceId: string | null;
  captureIpAddress: string | null;
  captureLatitude: number | null;
  captureLongitude: number | null;
  captureAccuracyMeters: number | null;
  state: "PENDING" | "APPROVED" | "REJECTED";
  approvedAt: Date | null;
  approvedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
}): AttendanceRecordEntity {
  return record;
}

function toWorkScheduleEntity(record: {
  id: string;
  employeeId: string;
  startAt: Date;
  endAt: Date;
  breakMinutes: number;
  isHoliday: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): WorkScheduleEntity {
  return record;
}

function toWorkScheduleTemplateEntity(record: {
  id: string;
  organizationId: string;
  name: string;
  startMinute: number;
  endMinute: number;
  breakMinutes: number;
  isHoliday: boolean;
  weekdays: number[];
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): WorkScheduleTemplateEntity {
  return record;
}

function toLeaveRequestEntity(record: {
  id: string;
  employeeId: string;
  leaveType: "ANNUAL" | "SICK" | "UNPAID";
  startDate: Date;
  endDate: Date;
  unit: "FULL_DAY" | "HALF_DAY" | "HOUR";
  hours: Prisma.Decimal | null;
  days: Prisma.Decimal;
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
  return {
    ...record,
    hours: decimalToNumber(record.hours),
    days: Number(record.days)
  };
}

function toLeaveBalanceEntity(record: {
  employeeId: string;
  grantedDays: Prisma.Decimal;
  usedDays: Prisma.Decimal;
  remainingDays: Prisma.Decimal;
  carryOverDays: Prisma.Decimal;
  lastAccrualYear: number | null;
  updatedAt: Date;
}): LeaveBalanceEntity {
  return {
    ...record,
    grantedDays: Number(record.grantedDays),
    usedDays: Number(record.usedDays),
    remainingDays: Number(record.remainingDays),
    carryOverDays: Number(record.carryOverDays)
  };
}

function toLeavePolicyEntity(record: {
  id: string;
  organizationId: string;
  annualGrantDays: number;
  carryOverCapDays: number;
  allowHalfDay: boolean;
  allowHourly: boolean;
  hourlyIncrementMinutes: number;
  maxHoursPerRequest: Prisma.Decimal;
  createdAt: Date;
  updatedAt: Date;
}): LeavePolicyEntity {
  return {
    ...record,
    maxHoursPerRequest: Number(record.maxHoursPerRequest)
  };
}

function toPayrollEntity(record: {
  id: string;
  organizationId: string | null;
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
  organizationId: string | null;
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
    organizationId: record.organizationId,
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

function toDepartmentEntity(record: {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}): DepartmentEntity {
  return record;
}

function toPositionEntity(record: {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}): PositionEntity {
  return record;
}

function toApprovalPolicyEntity(record: {
  id: string;
  organizationId: string;
  attendanceApproverRole: string;
  leaveApproverRole: string;
  payrollApproverRole: string;
  createdAt: Date;
  updatedAt: Date;
}): ApprovalPolicyEntity {
  return record;
}

function toApprovalDelegationEntity(record: {
  id: string;
  organizationId: string;
  domain: "ATTENDANCE" | "LEAVE" | "PAYROLL";
  delegatorRole: string;
  delegateActorId: string;
  reason: string | null;
  startsAt: Date;
  endsAt: Date;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}): ApprovalDelegationEntity {
  return {
    ...record,
    domain: record.domain as ApprovalDomain
  };
}

function toApprovalLineTemplateEntity(record: {
  id: string;
  organizationId: string;
  name: string;
  domain: "ATTENDANCE" | "LEAVE" | "PAYROLL";
  approverRoles: string[];
  payrollGrossPayMinKrw: number | null;
  payrollGrossPayMaxKrw: number | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}): ApprovalLineTemplateEntity {
  return {
    ...record,
    domain: record.domain as ApprovalDomain,
    approverRoles: [...record.approverRoles],
    payrollGrossPayMinKrw: record.payrollGrossPayMinKrw,
    payrollGrossPayMaxKrw: record.payrollGrossPayMaxKrw
  };
}

function toEmployeeEntity(record: {
  id: string;
  organizationId: string | null;
  departmentId: string | null;
  positionId: string | null;
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

function toAuditLogEntity(record: {
  action: string;
  entityType: string;
  entityId: string | null;
  organizationId: string | null;
  actorRole: string;
  actorId: string | null;
  payload: unknown | null;
  createdAt: Date;
}): AuditLogEntity {
  return {
    action: record.action,
    entityType: record.entityType,
    entityId: record.entityId,
    organizationId: record.organizationId,
    actorRole: record.actorRole,
    actorId: record.actorId,
    payload: record.payload,
    createdAt: record.createdAt
  };
}

function toIncidentHistoryAction(
  value: unknown
): "ACKNOWLEDGE" | "ASSIGN" | "RESOLVE" {
  if (value === "ACKNOWLEDGE" || value === "ASSIGN" || value === "RESOLVE") {
    return value;
  }
  return "ACKNOWLEDGE";
}

function toIncidentHistoryState(
  value: unknown
): "ACKNOWLEDGED" | "ASSIGNED" | "RESOLVED" {
  if (value === "ACKNOWLEDGED" || value === "ASSIGNED" || value === "RESOLVED") {
    return value;
  }
  return "ACKNOWLEDGED";
}

function toIncidentHistoryResolutionCode(
  value: unknown
): "FALSE_POSITIVE" | "ATTENDANCE_CORRECTED" | "MANUAL_CONFIRMED" | "OTHER" | null {
  if (
    value === "FALSE_POSITIVE" ||
    value === "ATTENDANCE_CORRECTED" ||
    value === "MANUAL_CONFIRMED" ||
    value === "OTHER"
  ) {
    return value;
  }
  return null;
}

function normalizeIncidentHistoryEntry(
  value: unknown
): ScheduleAnomalyIncidentHistoryEntryEntity | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const row = value as Record<string, unknown>;
  const updatedAtRaw = typeof row.updatedAt === "string" ? row.updatedAt : "";
  const updatedAt = Number.isFinite(Date.parse(updatedAtRaw))
    ? updatedAtRaw
    : new Date(0).toISOString();
  return {
    action: toIncidentHistoryAction(row.action),
    state: toIncidentHistoryState(row.state),
    assigneeId: typeof row.assigneeId === "string" ? row.assigneeId : null,
    resolutionCode: toIncidentHistoryResolutionCode(row.resolutionCode),
    note: typeof row.note === "string" ? row.note : null,
    updatedAt,
    updatedByActorId: typeof row.updatedByActorId === "string" ? row.updatedByActorId : null,
    updatedByActorRole:
      typeof row.updatedByActorRole === "string" && row.updatedByActorRole.trim().length > 0
        ? row.updatedByActorRole
        : "system"
  };
}

function normalizeIncidentHistory(
  value: unknown
): ScheduleAnomalyIncidentHistoryEntryEntity[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const rows = value
    .map(normalizeIncidentHistoryEntry)
    .filter((entry): entry is ScheduleAnomalyIncidentHistoryEntryEntity => entry !== null);
  rows.sort((left, right) => left.updatedAt.localeCompare(right.updatedAt));
  return rows;
}

function toScheduleAnomalyIncidentEntity(record: {
  incidentId: string;
  organizationId: string | null;
  state: "ACKNOWLEDGED" | "ASSIGNED" | "RESOLVED";
  assigneeId: string | null;
  resolutionCode: "FALSE_POSITIVE" | "ATTENDANCE_CORRECTED" | "MANUAL_CONFIRMED" | "OTHER" | null;
  note: string | null;
  updatedAt: Date;
  updatedByActorId: string | null;
  updatedByActorRole: string;
  lastEscalationRequestedAt: Date | null;
  history: unknown;
  createdAt: Date;
  rowUpdatedAt: Date;
}): ScheduleAnomalyIncidentEntity {
  return {
    incidentId: record.incidentId,
    organizationId: record.organizationId,
    state: record.state,
    assigneeId: record.assigneeId,
    resolutionCode: record.resolutionCode,
    note: record.note,
    updatedAt: record.updatedAt.toISOString(),
    updatedByActorId: record.updatedByActorId,
    updatedByActorRole: record.updatedByActorRole,
    lastEscalationRequestedAt: record.lastEscalationRequestedAt
      ? record.lastEscalationRequestedAt.toISOString()
      : null,
    history: normalizeIncidentHistory(record.history),
    createdAt: record.createdAt,
    rowUpdatedAt: record.rowUpdatedAt
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

const departments: DepartmentStore = {
  async create(input: CreateDepartmentInput) {
    const record = await prisma.department.create({
      data: {
        organizationId: input.organizationId,
        code: input.code,
        name: input.name,
        active: input.active ?? true
      }
    });
    return toDepartmentEntity(record);
  },

  async findById(id: string) {
    const record = await prisma.department.findUnique({
      where: { id }
    });
    return record ? toDepartmentEntity(record) : null;
  },

  async update(id: string, input: UpdateDepartmentInput) {
    const record = await prisma.department.update({
      where: { id },
      data: {
        ...(input.code !== undefined ? { code: input.code } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.active !== undefined ? { active: input.active } : {})
      }
    });
    return toDepartmentEntity(record);
  },

  async list(input: { active?: boolean; organizationId?: string }) {
    const records = await prisma.department.findMany({
      where: {
        ...(input.active !== undefined ? { active: input.active } : {}),
        ...(input.organizationId ? { organizationId: input.organizationId } : {})
      },
      orderBy: [{ code: "asc" }, { createdAt: "asc" }]
    });
    return records.map(toDepartmentEntity);
  }
};

const positions: PositionStore = {
  async create(input: CreatePositionInput) {
    const record = await prisma.position.create({
      data: {
        organizationId: input.organizationId,
        code: input.code,
        name: input.name,
        active: input.active ?? true
      }
    });
    return toPositionEntity(record);
  },

  async findById(id: string) {
    const record = await prisma.position.findUnique({
      where: { id }
    });
    return record ? toPositionEntity(record) : null;
  },

  async update(id: string, input: UpdatePositionInput) {
    const record = await prisma.position.update({
      where: { id },
      data: {
        ...(input.code !== undefined ? { code: input.code } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.active !== undefined ? { active: input.active } : {})
      }
    });
    return toPositionEntity(record);
  },

  async list(input: { active?: boolean; organizationId?: string }) {
    const records = await prisma.position.findMany({
      where: {
        ...(input.active !== undefined ? { active: input.active } : {}),
        ...(input.organizationId ? { organizationId: input.organizationId } : {})
      },
      orderBy: [{ code: "asc" }, { createdAt: "asc" }]
    });
    return records.map(toPositionEntity);
  }
};

const approvals: ApprovalStore = {
  async findPolicyByOrganizationId(organizationId: string) {
    const record = await prisma.approvalPolicy.findUnique({
      where: { organizationId }
    });
    return record ? toApprovalPolicyEntity(record) : null;
  },

  async upsertPolicyForOrganization(input: UpsertApprovalPolicyInput) {
    const record = await prisma.approvalPolicy.upsert({
      where: { organizationId: input.organizationId },
      create: {
        organizationId: input.organizationId,
        attendanceApproverRole: input.attendanceApproverRole,
        leaveApproverRole: input.leaveApproverRole,
        payrollApproverRole: input.payrollApproverRole
      },
      update: {
        attendanceApproverRole: input.attendanceApproverRole,
        leaveApproverRole: input.leaveApproverRole,
        payrollApproverRole: input.payrollApproverRole
      }
    });
    return toApprovalPolicyEntity(record);
  },

  async createDelegation(input: CreateApprovalDelegationInput) {
    const record = await prisma.approvalDelegation.create({
      data: {
        organizationId: input.organizationId,
        domain: input.domain,
        delegatorRole: input.delegatorRole,
        delegateActorId: input.delegateActorId,
        reason: input.reason ?? null,
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        active: input.active ?? true
      }
    });
    return toApprovalDelegationEntity(record);
  },

  async findDelegationById(id: string) {
    const record = await prisma.approvalDelegation.findUnique({
      where: { id }
    });
    return record ? toApprovalDelegationEntity(record) : null;
  },

  async updateDelegation(id: string, input: UpdateApprovalDelegationInput) {
    const record = await prisma.approvalDelegation.update({
      where: { id },
      data: {
        ...(input.delegateActorId !== undefined ? { delegateActorId: input.delegateActorId } : {}),
        ...(input.reason !== undefined ? { reason: input.reason } : {}),
        ...(input.startsAt !== undefined ? { startsAt: input.startsAt } : {}),
        ...(input.endsAt !== undefined ? { endsAt: input.endsAt } : {}),
        ...(input.active !== undefined ? { active: input.active } : {})
      }
    });
    return toApprovalDelegationEntity(record);
  },

  async listDelegations(input: {
    organizationId?: string;
    domain?: ApprovalDomain;
    active?: boolean;
    delegateActorId?: string;
  }) {
    const records = await prisma.approvalDelegation.findMany({
      where: {
        ...(input.organizationId ? { organizationId: input.organizationId } : {}),
        ...(input.domain ? { domain: input.domain } : {}),
        ...(input.active !== undefined ? { active: input.active } : {}),
        ...(input.delegateActorId ? { delegateActorId: input.delegateActorId } : {})
      },
      orderBy: [{ startsAt: "desc" }, { createdAt: "desc" }]
    });
    return records.map(toApprovalDelegationEntity);
  },

  async createTemplate(input: CreateApprovalLineTemplateInput) {
    const record = await prisma.approvalLineTemplate.create({
      data: {
        organizationId: input.organizationId,
        name: input.name,
        domain: input.domain,
        approverRoles: input.approverRoles,
        payrollGrossPayMinKrw:
          input.payrollGrossPayMinKrw === undefined ? null : input.payrollGrossPayMinKrw,
        payrollGrossPayMaxKrw:
          input.payrollGrossPayMaxKrw === undefined ? null : input.payrollGrossPayMaxKrw,
        active: input.active ?? true
      }
    });
    return toApprovalLineTemplateEntity(record);
  },

  async findTemplateById(id: string) {
    const record = await prisma.approvalLineTemplate.findUnique({
      where: { id }
    });
    return record ? toApprovalLineTemplateEntity(record) : null;
  },

  async updateTemplate(id: string, input: UpdateApprovalLineTemplateInput) {
    const record = await prisma.approvalLineTemplate.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.domain !== undefined ? { domain: input.domain } : {}),
        ...(input.approverRoles !== undefined ? { approverRoles: input.approverRoles } : {}),
        ...(input.payrollGrossPayMinKrw !== undefined
          ? { payrollGrossPayMinKrw: input.payrollGrossPayMinKrw }
          : {}),
        ...(input.payrollGrossPayMaxKrw !== undefined
          ? { payrollGrossPayMaxKrw: input.payrollGrossPayMaxKrw }
          : {}),
        ...(input.active !== undefined ? { active: input.active } : {})
      }
    });
    return toApprovalLineTemplateEntity(record);
  },

  async listTemplates(input: {
    organizationId?: string;
    domain?: ApprovalDomain;
    active?: boolean;
  }) {
    const records = await prisma.approvalLineTemplate.findMany({
      where: {
        ...(input.organizationId ? { organizationId: input.organizationId } : {}),
        ...(input.domain ? { domain: input.domain } : {}),
        ...(input.active !== undefined ? { active: input.active } : {})
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }]
    });
    return records.map(toApprovalLineTemplateEntity);
  }
};

const employees: EmployeeStore = {
  async create(input: CreateEmployeeInput) {
    const record = await prisma.employee.create({
      data: {
        id: input.id,
        organizationId:
          input.organizationId === undefined ? null : input.organizationId,
        departmentId:
          input.departmentId === undefined ? null : input.departmentId,
        positionId:
          input.positionId === undefined ? null : input.positionId,
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
        departmentId: input.departmentId,
        positionId: input.positionId,
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
        notes: input.notes ?? null,
        captureChannel: input.captureChannel ?? "MANUAL",
        captureDeviceId: input.captureDeviceId ?? null,
        captureIpAddress: input.captureIpAddress ?? null,
        captureLatitude: input.captureLatitude ?? null,
        captureLongitude: input.captureLongitude ?? null,
        captureAccuracyMeters: input.captureAccuracyMeters ?? null
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
        captureChannel: input.captureChannel,
        captureDeviceId: input.captureDeviceId,
        captureIpAddress: input.captureIpAddress,
        captureLatitude: input.captureLatitude,
        captureLongitude: input.captureLongitude,
        captureAccuracyMeters: input.captureAccuracyMeters,
        state: input.state,
        approvedAt: input.approvedAt,
        approvedBy: input.approvedBy
      }
    });
    return toAttendanceEntity(record);
  },

  async listApprovedInPeriod(input: {
    periodStart: Date;
    periodEnd: Date;
    organizationId?: string;
    employeeId?: string;
  }) {
    const records = await prisma.attendanceRecord.findMany({
      where: {
        state: "APPROVED",
        checkInAt: {
          gte: input.periodStart,
          lte: input.periodEnd
        },
        ...(input.organizationId ? { employee: { organizationId: input.organizationId } } : {}),
        ...(input.employeeId ? { employeeId: input.employeeId } : {})
      },
      orderBy: { checkInAt: "asc" }
    });
    return records.map(toAttendanceEntity);
  },

  async listInPeriod(input: {
    periodStart: Date;
    periodEnd: Date;
    organizationId?: string;
    employeeId?: string;
    state?: "PENDING" | "APPROVED" | "REJECTED";
  }) {
    const records = await prisma.attendanceRecord.findMany({
      where: {
        checkInAt: {
          gte: input.periodStart,
          lte: input.periodEnd
        },
        ...(input.organizationId ? { employee: { organizationId: input.organizationId } } : {}),
        ...(input.employeeId ? { employeeId: input.employeeId } : {}),
        ...(input.state ? { state: input.state } : {})
      },
      orderBy: { checkInAt: "asc" }
    });
    return records.map(toAttendanceEntity);
  }
};

const scheduling: SchedulingStore = {
  async create(input: CreateWorkScheduleInput) {
    const record = await prisma.workSchedule.create({
      data: {
        employeeId: input.employeeId,
        startAt: input.startAt,
        endAt: input.endAt,
        breakMinutes: input.breakMinutes,
        isHoliday: input.isHoliday,
        notes: input.notes ?? null
      }
    });
    return toWorkScheduleEntity(record);
  },

  async findById(id: string) {
    const record = await prisma.workSchedule.findUnique({
      where: { id }
    });
    return record ? toWorkScheduleEntity(record) : null;
  },

  async update(id: string, input: UpdateWorkScheduleInput) {
    const record = await prisma.workSchedule.update({
      where: { id },
      data: {
        ...(input.startAt ? { startAt: input.startAt } : {}),
        ...(input.endAt ? { endAt: input.endAt } : {}),
        ...(input.breakMinutes !== undefined ? { breakMinutes: input.breakMinutes } : {}),
        ...(input.isHoliday !== undefined ? { isHoliday: input.isHoliday } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {})
      }
    });
    return toWorkScheduleEntity(record);
  },

  async delete(id: string) {
    const record = await prisma.workSchedule.delete({
      where: { id }
    });
    return toWorkScheduleEntity(record);
  },

  async createTemplate(input: CreateWorkScheduleTemplateInput) {
    const record = await prisma.workScheduleTemplate.create({
      data: {
        organizationId: input.organizationId,
        name: input.name,
        startMinute: input.startMinute,
        endMinute: input.endMinute,
        breakMinutes: input.breakMinutes,
        isHoliday: input.isHoliday,
        weekdays: input.weekdays,
        notes: input.notes ?? null
      }
    });
    return toWorkScheduleTemplateEntity(record);
  },

  async findTemplateById(id: string) {
    const record = await prisma.workScheduleTemplate.findUnique({
      where: { id }
    });
    return record ? toWorkScheduleTemplateEntity(record) : null;
  },

  async updateTemplate(id: string, input: UpdateWorkScheduleTemplateInput) {
    const record = await prisma.workScheduleTemplate.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.startMinute !== undefined ? { startMinute: input.startMinute } : {}),
        ...(input.endMinute !== undefined ? { endMinute: input.endMinute } : {}),
        ...(input.breakMinutes !== undefined ? { breakMinutes: input.breakMinutes } : {}),
        ...(input.isHoliday !== undefined ? { isHoliday: input.isHoliday } : {}),
        ...(input.weekdays !== undefined ? { weekdays: input.weekdays } : {}),
        ...(input.notes !== undefined ? { notes: input.notes } : {})
      }
    });
    return toWorkScheduleTemplateEntity(record);
  },

  async deleteTemplate(id: string) {
    const record = await prisma.workScheduleTemplate.delete({
      where: { id }
    });
    return toWorkScheduleTemplateEntity(record);
  },

  async listTemplates(input: { organizationId?: string }) {
    const records = await prisma.workScheduleTemplate.findMany({
      where: {
        ...(input.organizationId ? { organizationId: input.organizationId } : {})
      },
      orderBy: [{ name: "asc" }, { createdAt: "asc" }]
    });
    return records.map(toWorkScheduleTemplateEntity);
  },

  async listInPeriod(input: {
    periodStart: Date;
    periodEnd: Date;
    organizationId?: string;
    employeeId?: string;
  }) {
    const records = await prisma.workSchedule.findMany({
      where: {
        startAt: {
          lte: input.periodEnd
        },
        endAt: {
          gte: input.periodStart
        },
        ...(input.organizationId ? { employee: { organizationId: input.organizationId } } : {}),
        ...(input.employeeId ? { employeeId: input.employeeId } : {})
      },
      orderBy: { startAt: "asc" }
    });
    return records.map(toWorkScheduleEntity);
  },

  async upsertIncident(input: UpsertScheduleAnomalyIncidentInput) {
    const record = await prisma.scheduleAnomalyIncident.upsert({
      where: { incidentId: input.incidentId },
      create: {
        incidentId: input.incidentId,
        organizationId:
          input.organizationId === undefined ? null : input.organizationId,
        state: input.state,
        assigneeId: input.assigneeId,
        resolutionCode: input.resolutionCode,
        note: input.note,
        updatedAt: new Date(input.updatedAt),
        updatedByActorId: input.updatedByActorId,
        updatedByActorRole: input.updatedByActorRole,
        lastEscalationRequestedAt: input.lastEscalationRequestedAt
          ? new Date(input.lastEscalationRequestedAt)
          : null,
        history: input.history as unknown as Prisma.InputJsonValue
      },
      update: {
        organizationId:
          input.organizationId === undefined ? undefined : input.organizationId,
        state: input.state,
        assigneeId: input.assigneeId,
        resolutionCode: input.resolutionCode,
        note: input.note,
        updatedAt: new Date(input.updatedAt),
        updatedByActorId: input.updatedByActorId,
        updatedByActorRole: input.updatedByActorRole,
        lastEscalationRequestedAt:
          input.lastEscalationRequestedAt === undefined
            ? undefined
            : input.lastEscalationRequestedAt
              ? new Date(input.lastEscalationRequestedAt)
              : null,
        history: input.history as unknown as Prisma.InputJsonValue
      }
    });
    return toScheduleAnomalyIncidentEntity(record);
  },

  async findIncidentByIncidentId(incidentId: string) {
    const record = await prisma.scheduleAnomalyIncident.findUnique({
      where: { incidentId }
    });
    return record ? toScheduleAnomalyIncidentEntity(record) : null;
  },

  async listIncidents(input: {
    organizationId?: string;
    state?: "ACKNOWLEDGED" | "ASSIGNED" | "RESOLVED";
    assigneeId?: string;
    incidentIds?: string[];
  }) {
    const records = await prisma.scheduleAnomalyIncident.findMany({
      where: {
        ...(input.organizationId !== undefined ? { organizationId: input.organizationId } : {}),
        ...(input.state ? { state: input.state } : {}),
        ...(input.assigneeId ? { assigneeId: input.assigneeId } : {}),
        ...(input.incidentIds && input.incidentIds.length > 0
          ? { incidentId: { in: input.incidentIds } }
          : {})
      },
      orderBy: [{ updatedAt: "desc" }, { incidentId: "asc" }]
    });
    return records.map(toScheduleAnomalyIncidentEntity);
  },

  async markIncidentEscalationRequested(input: {
    incidentId: string;
    organizationId?: string;
    requestedAt: string;
  }) {
    const existing = await prisma.scheduleAnomalyIncident.findUnique({
      where: { incidentId: input.incidentId }
    });
    if (!existing) {
      throw new Error(`schedule anomaly incident not found: ${input.incidentId}`);
    }
    if (input.organizationId !== undefined && existing.organizationId !== input.organizationId) {
      throw new Error(`schedule anomaly incident not found: ${input.incidentId}`);
    }
    const record = await prisma.scheduleAnomalyIncident.update({
      where: { incidentId: input.incidentId },
      data: {
        lastEscalationRequestedAt: new Date(input.requestedAt)
      }
    });
    return toScheduleAnomalyIncidentEntity(record);
  },

  async deleteIncident(input: {
    incidentId: string;
    organizationId?: string;
  }) {
    const existing = await prisma.scheduleAnomalyIncident.findUnique({
      where: { incidentId: input.incidentId }
    });
    if (!existing) {
      return false;
    }
    if (input.organizationId !== undefined && existing.organizationId !== input.organizationId) {
      return false;
    }
    await prisma.scheduleAnomalyIncident.delete({
      where: { incidentId: input.incidentId }
    });
    return true;
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
        unit: input.unit ?? "FULL_DAY",
        hours: input.hours === undefined || input.hours === null ? null : new Prisma.Decimal(input.hours),
        days: new Prisma.Decimal(input.days),
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
        unit: input.unit,
        hours:
          input.hours === undefined
            ? undefined
            : input.hours === null
              ? null
              : new Prisma.Decimal(input.hours),
        days: input.days === undefined ? undefined : new Prisma.Decimal(input.days),
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
    organizationId?: string;
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
        ...(input.organizationId ? { employee: { organizationId: input.organizationId } } : {}),
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
        grantedDays: new Prisma.Decimal(defaultGrantedDays),
        usedDays: new Prisma.Decimal(0),
        remainingDays: new Prisma.Decimal(defaultGrantedDays),
        carryOverDays: new Prisma.Decimal(0),
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
        usedDays: new Prisma.Decimal(usedDays),
        remainingDays: new Prisma.Decimal(remainingDays)
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
        grantedDays: new Prisma.Decimal(grantedDays),
        usedDays: new Prisma.Decimal(0),
        remainingDays: new Prisma.Decimal(grantedDays),
        carryOverDays: new Prisma.Decimal(carryOverDays),
        lastAccrualYear: input.year
      }
    });
    return toLeaveBalanceEntity(updated);
  }
};

const leavePolicy: LeavePolicyStore = {
  async findByOrganizationId(organizationId: string) {
    const policy = await prisma.leavePolicy.findUnique({
      where: { organizationId }
    });
    return policy ? toLeavePolicyEntity(policy) : null;
  },

  async upsertForOrganization(input: UpsertLeavePolicyInput) {
    const policy = await prisma.leavePolicy.upsert({
      where: { organizationId: input.organizationId },
      update: {
        annualGrantDays: input.annualGrantDays,
        carryOverCapDays: input.carryOverCapDays,
        ...(input.allowHalfDay !== undefined ? { allowHalfDay: input.allowHalfDay } : {}),
        ...(input.allowHourly !== undefined ? { allowHourly: input.allowHourly } : {}),
        ...(input.hourlyIncrementMinutes !== undefined
          ? { hourlyIncrementMinutes: input.hourlyIncrementMinutes }
          : {}),
        ...(input.maxHoursPerRequest !== undefined
          ? { maxHoursPerRequest: new Prisma.Decimal(input.maxHoursPerRequest) }
          : {})
      },
      create: {
        organizationId: input.organizationId,
        annualGrantDays: input.annualGrantDays,
        carryOverCapDays: input.carryOverCapDays,
        allowHalfDay: input.allowHalfDay ?? true,
        allowHourly: input.allowHourly ?? true,
        hourlyIncrementMinutes: input.hourlyIncrementMinutes ?? 30,
        maxHoursPerRequest: new Prisma.Decimal(input.maxHoursPerRequest ?? 8)
      }
    });
    return toLeavePolicyEntity(policy);
  }
};

const payroll: PayrollStore = {
  async create(input: CreatePayrollRunInput) {
    const run = await prisma.payrollRun.create({
      data: {
        organizationId: input.organizationId === undefined ? null : input.organizationId,
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
    organizationId?: string;
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
        ...(input.organizationId ? { organizationId: input.organizationId } : {}),
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

  async list(input: { organizationId?: string; active?: boolean; mode?: "manual" | "profile" }) {
    const profiles = await prisma.deductionProfile.findMany({
      where: {
        ...(input.organizationId ? { organizationId: input.organizationId } : {}),
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
        organizationId: input.organizationId === undefined ? null : input.organizationId,
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
        organizationId: input.organizationId === undefined ? undefined : input.organizationId,
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
        organizationId: input.organizationId === undefined ? null : input.organizationId,
        actorRole: input.actorRole,
        actorId: input.actorId,
        payload: input.payload as object | undefined
      }
    });
  },

  async list(input: ListAuditLogsInput) {
    const actions = (input.actions ?? [])
      .map((value) => value.trim())
      .filter((value) => value.length > 0);
    const limit = input.limit ?? 500;
    const normalizedLimit = Number.isInteger(limit) && limit > 0 ? limit : 500;

    const records = await prisma.auditLog.findMany({
      where: {
        ...(actions.length > 0 ? { action: { in: actions } } : {}),
        ...(input.entityType ? { entityType: input.entityType } : {}),
        ...(input.entityId ? { entityId: input.entityId } : {}),
        ...(input.organizationId !== undefined ? { organizationId: input.organizationId } : {})
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: normalizedLimit
    });
    return records.map(toAuditLogEntity);
  }
};

export const prismaDataAccess: DataAccess = {
  organizations,
  employees,
  departments,
  positions,
  approvals,
  rbac,
  attendance,
  scheduling,
  leave,
  leavePolicy,
  leaveBalance,
  payroll,
  deductionProfiles,
  audit
};
