import type {
  ApprovalDelegationEntity,
  ApprovalDomain,
  ApprovalLineTemplateEntity,
  ApprovalPolicyEntity,
  AuditLogEntity,
  AttendanceRecordEntity,
  CreateApprovalDelegationInput,
  CreateApprovalLineTemplateInput,
  CreateWorkScheduleTemplateInput,
  CreateWorkScheduleInput,
  ListAuditLogsInput,
  UpdateApprovalDelegationInput,
  UpdateApprovalLineTemplateInput,
  UpdateWorkScheduleInput,
  UpdateWorkScheduleTemplateInput,
  CreateEmployeeInput,
  CreateDepartmentInput,
  CreatePositionInput,
  CreateOrganizationInput,
  DataAccess,
  DepartmentEntity,
  DeductionProfileEntity,
  EmployeeEntity,
  LeaveBalanceEntity,
  LeavePolicyEntity,
  LeaveRequestEntity,
  OrganizationEntity,
  PositionEntity,
  RoleEntity,
  RoleWithPermissionsEntity,
  ScheduleAnomalyIncidentEntity,
  ScheduleAnomalyIncidentHistoryEntryEntity,
  UpsertRoleInput,
  UpsertScheduleAnomalyIncidentInput,
  UpsertDeductionProfileInput,
  UpdateAttendanceRecordInput,
  UpdateDepartmentInput,
  UpdateEmployeeInput,
  UpdateLeaveRequestInput,
  UpsertLeavePolicyInput,
  UpsertApprovalPolicyInput,
  UpdatePositionInput,
  UpdatePayrollRunInput,
  PayrollRunEntity,
  WorkScheduleTemplateEntity,
  WorkScheduleEntity
} from "@/features/shared/data-access";
import { defaultRolePermissions } from "@/lib/rbac";

type MemoryState = {
  sequence: number;
  organizations: Map<string, OrganizationEntity>;
  departments: Map<string, DepartmentEntity>;
  positions: Map<string, PositionEntity>;
  approvalPolicies: Map<string, ApprovalPolicyEntity>;
  approvalDelegations: Map<string, ApprovalDelegationEntity>;
  approvalLineTemplates: Map<string, ApprovalLineTemplateEntity>;
  employees: Map<string, EmployeeEntity>;
  roles: Map<string, RoleEntity>;
  rolePermissions: Map<string, Set<string>>;
  attendance: Map<string, AttendanceRecordEntity>;
  workSchedules: Map<string, WorkScheduleEntity>;
  workScheduleTemplates: Map<string, WorkScheduleTemplateEntity>;
  scheduleAnomalyIncidents: Map<string, ScheduleAnomalyIncidentEntity>;
  leaveRequests: Map<string, LeaveRequestEntity>;
  leavePolicies: Map<string, LeavePolicyEntity>;
  leaveBalances: Map<string, LeaveBalanceEntity>;
  payroll: Map<string, PayrollRunEntity>;
  deductionProfiles: Map<string, DeductionProfileEntity>;
  audit: AuditLogEntity[];
};

function seedRbacDefaults(target: MemoryState) {
  const now = new Date();
  for (const [roleId, permissions] of Object.entries(defaultRolePermissions)) {
    const role: RoleEntity = {
      id: roleId,
      name: roleId,
      description: "seeded default",
      createdAt: now,
      updatedAt: now
    };
    target.roles.set(role.id, role);
    target.rolePermissions.set(role.id, new Set(permissions));
  }
}

function createState(): MemoryState {
  const created: MemoryState = {
    sequence: 1,
    organizations: new Map<string, OrganizationEntity>(),
    departments: new Map<string, DepartmentEntity>(),
    positions: new Map<string, PositionEntity>(),
    approvalPolicies: new Map<string, ApprovalPolicyEntity>(),
    approvalDelegations: new Map<string, ApprovalDelegationEntity>(),
    approvalLineTemplates: new Map<string, ApprovalLineTemplateEntity>(),
    employees: new Map<string, EmployeeEntity>(),
    roles: new Map<string, RoleEntity>(),
    rolePermissions: new Map<string, Set<string>>(),
    attendance: new Map<string, AttendanceRecordEntity>(),
    workSchedules: new Map<string, WorkScheduleEntity>(),
    workScheduleTemplates: new Map<string, WorkScheduleTemplateEntity>(),
    scheduleAnomalyIncidents: new Map<string, ScheduleAnomalyIncidentEntity>(),
    leaveRequests: new Map<string, LeaveRequestEntity>(),
    leavePolicies: new Map<string, LeavePolicyEntity>(),
    leaveBalances: new Map<string, LeaveBalanceEntity>(),
    payroll: new Map<string, PayrollRunEntity>(),
    deductionProfiles: new Map<string, DeductionProfileEntity>(),
    audit: []
  };
  seedRbacDefaults(created);
  return created;
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

function roundTo2(value: number) {
  return Math.round(value * 100) / 100;
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
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

function cloneWorkSchedule(entity: WorkScheduleEntity): WorkScheduleEntity {
  return {
    ...entity,
    startAt: cloneDate(entity.startAt),
    endAt: cloneDate(entity.endAt),
    createdAt: cloneDate(entity.createdAt),
    updatedAt: cloneDate(entity.updatedAt)
  };
}

function cloneWorkScheduleTemplate(entity: WorkScheduleTemplateEntity): WorkScheduleTemplateEntity {
  return {
    ...entity,
    weekdays: [...entity.weekdays],
    createdAt: cloneDate(entity.createdAt),
    updatedAt: cloneDate(entity.updatedAt)
  };
}

function cloneScheduleAnomalyIncidentHistoryEntry(
  entry: ScheduleAnomalyIncidentHistoryEntryEntity
): ScheduleAnomalyIncidentHistoryEntryEntity {
  return {
    action: entry.action,
    state: entry.state,
    assigneeId: entry.assigneeId,
    resolutionCode: entry.resolutionCode,
    note: entry.note,
    updatedAt: entry.updatedAt,
    updatedByActorId: entry.updatedByActorId,
    updatedByActorRole: entry.updatedByActorRole
  };
}

function cloneScheduleAnomalyIncident(
  entity: ScheduleAnomalyIncidentEntity
): ScheduleAnomalyIncidentEntity {
  return {
    incidentId: entity.incidentId,
    organizationId: entity.organizationId,
    state: entity.state,
    assigneeId: entity.assigneeId,
    resolutionCode: entity.resolutionCode,
    note: entity.note,
    updatedAt: entity.updatedAt,
    updatedByActorId: entity.updatedByActorId,
    updatedByActorRole: entity.updatedByActorRole,
    lastEscalationRequestedAt: entity.lastEscalationRequestedAt,
    history: entity.history.map(cloneScheduleAnomalyIncidentHistoryEntry),
    createdAt: cloneDate(entity.createdAt),
    rowUpdatedAt: cloneDate(entity.rowUpdatedAt)
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

function cloneLeavePolicy(entity: LeavePolicyEntity): LeavePolicyEntity {
  return {
    ...entity,
    createdAt: cloneDate(entity.createdAt),
    updatedAt: cloneDate(entity.updatedAt)
  };
}

function clonePayroll(entity: PayrollRunEntity): PayrollRunEntity {
  return {
    ...entity,
    periodStart: cloneDate(entity.periodStart),
    periodEnd: cloneDate(entity.periodEnd),
    deductionBreakdown: entity.deductionBreakdown ? cloneJson(entity.deductionBreakdown) : null,
    confirmedAt: entity.confirmedAt ? cloneDate(entity.confirmedAt) : null,
    createdAt: cloneDate(entity.createdAt),
    updatedAt: cloneDate(entity.updatedAt)
  };
}

function cloneDeductionProfile(entity: DeductionProfileEntity): DeductionProfileEntity {
  return {
    ...entity,
    createdAt: cloneDate(entity.createdAt),
    updatedAt: cloneDate(entity.updatedAt)
  };
}

function cloneOrganization(entity: OrganizationEntity): OrganizationEntity {
  return {
    ...entity,
    createdAt: cloneDate(entity.createdAt),
    updatedAt: cloneDate(entity.updatedAt)
  };
}

function cloneDepartment(entity: DepartmentEntity): DepartmentEntity {
  return {
    ...entity,
    createdAt: cloneDate(entity.createdAt),
    updatedAt: cloneDate(entity.updatedAt)
  };
}

function clonePosition(entity: PositionEntity): PositionEntity {
  return {
    ...entity,
    createdAt: cloneDate(entity.createdAt),
    updatedAt: cloneDate(entity.updatedAt)
  };
}

function cloneApprovalPolicy(entity: ApprovalPolicyEntity): ApprovalPolicyEntity {
  return {
    ...entity,
    createdAt: cloneDate(entity.createdAt),
    updatedAt: cloneDate(entity.updatedAt)
  };
}

function cloneApprovalDelegation(entity: ApprovalDelegationEntity): ApprovalDelegationEntity {
  return {
    ...entity,
    startsAt: cloneDate(entity.startsAt),
    endsAt: cloneDate(entity.endsAt),
    createdAt: cloneDate(entity.createdAt),
    updatedAt: cloneDate(entity.updatedAt)
  };
}

function cloneApprovalLineTemplate(entity: ApprovalLineTemplateEntity): ApprovalLineTemplateEntity {
  return {
    ...entity,
    approverRoles: [...entity.approverRoles],
    createdAt: cloneDate(entity.createdAt),
    updatedAt: cloneDate(entity.updatedAt)
  };
}

function cloneEmployee(entity: EmployeeEntity): EmployeeEntity {
  return {
    ...entity,
    createdAt: cloneDate(entity.createdAt),
    updatedAt: cloneDate(entity.updatedAt)
  };
}

function cloneRole(entity: RoleEntity): RoleEntity {
  return {
    ...entity,
    createdAt: cloneDate(entity.createdAt),
    updatedAt: cloneDate(entity.updatedAt)
  };
}

function toRoleWithPermissions(entity: RoleEntity, permissions: Set<string> | undefined) {
  const rows = Array.from(permissions ?? new Set<string>());
  rows.sort((a, b) => a.localeCompare(b));
  const result: RoleWithPermissionsEntity = {
    ...cloneRole(entity),
    permissions: rows
  };
  return result;
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
    captureChannel: input.captureChannel ?? existing.captureChannel,
    captureDeviceId:
      input.captureDeviceId !== undefined ? input.captureDeviceId : existing.captureDeviceId,
    captureIpAddress:
      input.captureIpAddress !== undefined ? input.captureIpAddress : existing.captureIpAddress,
    captureLatitude:
      input.captureLatitude !== undefined ? input.captureLatitude : existing.captureLatitude,
    captureLongitude:
      input.captureLongitude !== undefined ? input.captureLongitude : existing.captureLongitude,
    captureAccuracyMeters:
      input.captureAccuracyMeters !== undefined
        ? input.captureAccuracyMeters
        : existing.captureAccuracyMeters,
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
    unit: input.unit ?? existing.unit,
    hours: input.hours !== undefined ? input.hours : existing.hours,
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

function updateEmployeeEntity(existing: EmployeeEntity, input: UpdateEmployeeInput): EmployeeEntity {
  return {
    ...existing,
    organizationId: input.organizationId !== undefined ? input.organizationId : existing.organizationId,
    departmentId: input.departmentId !== undefined ? input.departmentId : existing.departmentId,
    positionId: input.positionId !== undefined ? input.positionId : existing.positionId,
    name: input.name !== undefined ? input.name : existing.name,
    email: input.email !== undefined ? input.email : existing.email,
    active: input.active !== undefined ? input.active : existing.active,
    updatedAt: new Date()
  };
}

function updateDepartmentEntity(
  existing: DepartmentEntity,
  input: UpdateDepartmentInput
): DepartmentEntity {
  return {
    ...existing,
    code: input.code ?? existing.code,
    name: input.name ?? existing.name,
    active: input.active ?? existing.active,
    updatedAt: new Date()
  };
}

function updatePositionEntity(existing: PositionEntity, input: UpdatePositionInput): PositionEntity {
  return {
    ...existing,
    code: input.code ?? existing.code,
    name: input.name ?? existing.name,
    active: input.active ?? existing.active,
    updatedAt: new Date()
  };
}

function updateApprovalDelegationEntity(
  existing: ApprovalDelegationEntity,
  input: UpdateApprovalDelegationInput
): ApprovalDelegationEntity {
  return {
    ...existing,
    delegateActorId:
      input.delegateActorId !== undefined ? input.delegateActorId : existing.delegateActorId,
    reason: input.reason !== undefined ? input.reason : existing.reason,
    startsAt: input.startsAt !== undefined ? cloneDate(input.startsAt) : existing.startsAt,
    endsAt: input.endsAt !== undefined ? cloneDate(input.endsAt) : existing.endsAt,
    active: input.active !== undefined ? input.active : existing.active,
    updatedAt: new Date()
  };
}

function updateApprovalLineTemplateEntity(
  existing: ApprovalLineTemplateEntity,
  input: UpdateApprovalLineTemplateInput
): ApprovalLineTemplateEntity {
  return {
    ...existing,
    name: input.name !== undefined ? input.name : existing.name,
    domain: input.domain !== undefined ? input.domain : existing.domain,
    approverRoles:
      input.approverRoles !== undefined ? [...input.approverRoles] : [...existing.approverRoles],
    active: input.active !== undefined ? input.active : existing.active,
    updatedAt: new Date()
  };
}

export const memoryDataAccess: DataAccess = {
  organizations: {
    async create(input: CreateOrganizationInput) {
      const now = new Date();
      const entity: OrganizationEntity = {
        id: nextId("ORG"),
        name: input.name,
        createdAt: now,
        updatedAt: now
      };
      state.organizations.set(entity.id, entity);
      return cloneOrganization(entity);
    },

    async findById(id: string) {
      const entity = state.organizations.get(id);
      return entity ? cloneOrganization(entity) : null;
    },

    async list() {
      const rows: OrganizationEntity[] = [];
      for (const entity of state.organizations.values()) {
        rows.push(cloneOrganization(entity));
      }
      rows.sort((a, b) => a.id.localeCompare(b.id));
      return rows;
    }
  },

  departments: {
    async create(input: CreateDepartmentInput) {
      const now = new Date();
      const entity: DepartmentEntity = {
        id: nextId("DEPT"),
        organizationId: input.organizationId,
        code: input.code,
        name: input.name,
        active: input.active ?? true,
        createdAt: now,
        updatedAt: now
      };
      state.departments.set(entity.id, entity);
      return cloneDepartment(entity);
    },

    async findById(id: string) {
      const entity = state.departments.get(id);
      return entity ? cloneDepartment(entity) : null;
    },

    async update(id: string, input: UpdateDepartmentInput) {
      const existing = state.departments.get(id);
      if (!existing) {
        throw new Error(`department not found: ${id}`);
      }
      const updated = updateDepartmentEntity(existing, input);
      state.departments.set(id, updated);
      return cloneDepartment(updated);
    },

    async list(input: { active?: boolean; organizationId?: string }) {
      const rows: DepartmentEntity[] = [];
      for (const entity of state.departments.values()) {
        if (input.active !== undefined && entity.active !== input.active) {
          continue;
        }
        if (input.organizationId && entity.organizationId !== input.organizationId) {
          continue;
        }
        rows.push(cloneDepartment(entity));
      }
      rows.sort((a, b) => a.code.localeCompare(b.code));
      return rows;
    }
  },

  positions: {
    async create(input: CreatePositionInput) {
      const now = new Date();
      const entity: PositionEntity = {
        id: nextId("POS"),
        organizationId: input.organizationId,
        code: input.code,
        name: input.name,
        active: input.active ?? true,
        createdAt: now,
        updatedAt: now
      };
      state.positions.set(entity.id, entity);
      return clonePosition(entity);
    },

    async findById(id: string) {
      const entity = state.positions.get(id);
      return entity ? clonePosition(entity) : null;
    },

    async update(id: string, input: UpdatePositionInput) {
      const existing = state.positions.get(id);
      if (!existing) {
        throw new Error(`position not found: ${id}`);
      }
      const updated = updatePositionEntity(existing, input);
      state.positions.set(id, updated);
      return clonePosition(updated);
    },

    async list(input: { active?: boolean; organizationId?: string }) {
      const rows: PositionEntity[] = [];
      for (const entity of state.positions.values()) {
        if (input.active !== undefined && entity.active !== input.active) {
          continue;
        }
        if (input.organizationId && entity.organizationId !== input.organizationId) {
          continue;
        }
        rows.push(clonePosition(entity));
      }
      rows.sort((a, b) => a.code.localeCompare(b.code));
      return rows;
    }
  },

  approvals: {
    async findPolicyByOrganizationId(organizationId: string) {
      const entity = state.approvalPolicies.get(organizationId);
      return entity ? cloneApprovalPolicy(entity) : null;
    },

    async upsertPolicyForOrganization(input: UpsertApprovalPolicyInput) {
      const now = new Date();
      const existing = state.approvalPolicies.get(input.organizationId);
      const entity: ApprovalPolicyEntity = {
        id: existing?.id ?? nextId("APOL"),
        organizationId: input.organizationId,
        attendanceApproverRole: input.attendanceApproverRole,
        leaveApproverRole: input.leaveApproverRole,
        payrollApproverRole: input.payrollApproverRole,
        createdAt: existing ? existing.createdAt : now,
        updatedAt: now
      };
      state.approvalPolicies.set(entity.organizationId, entity);
      return cloneApprovalPolicy(entity);
    },

    async createDelegation(input: CreateApprovalDelegationInput) {
      const now = new Date();
      const entity: ApprovalDelegationEntity = {
        id: nextId("ADEL"),
        organizationId: input.organizationId,
        domain: input.domain as ApprovalDomain,
        delegatorRole: input.delegatorRole,
        delegateActorId: input.delegateActorId,
        reason: input.reason ?? null,
        startsAt: cloneDate(input.startsAt),
        endsAt: cloneDate(input.endsAt),
        active: input.active ?? true,
        createdAt: now,
        updatedAt: now
      };
      state.approvalDelegations.set(entity.id, entity);
      return cloneApprovalDelegation(entity);
    },

    async findDelegationById(id: string) {
      const entity = state.approvalDelegations.get(id);
      return entity ? cloneApprovalDelegation(entity) : null;
    },

    async updateDelegation(id: string, input: UpdateApprovalDelegationInput) {
      const existing = state.approvalDelegations.get(id);
      if (!existing) {
        throw new Error(`approval delegation not found: ${id}`);
      }
      const updated = updateApprovalDelegationEntity(existing, input);
      state.approvalDelegations.set(id, updated);
      return cloneApprovalDelegation(updated);
    },

    async listDelegations(input: {
      organizationId?: string;
      domain?: ApprovalDomain;
      active?: boolean;
      delegateActorId?: string;
    }) {
      const rows: ApprovalDelegationEntity[] = [];
      for (const entity of state.approvalDelegations.values()) {
        if (input.organizationId && entity.organizationId !== input.organizationId) {
          continue;
        }
        if (input.domain && entity.domain !== input.domain) {
          continue;
        }
        if (input.active !== undefined && entity.active !== input.active) {
          continue;
        }
        if (input.delegateActorId && entity.delegateActorId !== input.delegateActorId) {
          continue;
        }
        rows.push(cloneApprovalDelegation(entity));
      }
      rows.sort((left, right) => {
        const byStart = right.startsAt.getTime() - left.startsAt.getTime();
        if (byStart !== 0) {
          return byStart;
        }
        return left.id.localeCompare(right.id);
      });
      return rows;
    },

    async createTemplate(input: CreateApprovalLineTemplateInput) {
      const now = new Date();
      const entity: ApprovalLineTemplateEntity = {
        id: nextId("ATPL"),
        organizationId: input.organizationId,
        name: input.name,
        domain: input.domain,
        approverRoles: [...input.approverRoles],
        active: input.active ?? true,
        createdAt: now,
        updatedAt: now
      };
      state.approvalLineTemplates.set(entity.id, entity);
      return cloneApprovalLineTemplate(entity);
    },

    async findTemplateById(id: string) {
      const entity = state.approvalLineTemplates.get(id);
      return entity ? cloneApprovalLineTemplate(entity) : null;
    },

    async updateTemplate(id: string, input: UpdateApprovalLineTemplateInput) {
      const existing = state.approvalLineTemplates.get(id);
      if (!existing) {
        throw new Error(`approval line template not found: ${id}`);
      }
      const updated = updateApprovalLineTemplateEntity(existing, input);
      state.approvalLineTemplates.set(id, updated);
      return cloneApprovalLineTemplate(updated);
    },

    async listTemplates(input: {
      organizationId?: string;
      domain?: ApprovalDomain;
      active?: boolean;
    }) {
      const rows: ApprovalLineTemplateEntity[] = [];
      for (const entity of state.approvalLineTemplates.values()) {
        if (input.organizationId && entity.organizationId !== input.organizationId) {
          continue;
        }
        if (input.domain && entity.domain !== input.domain) {
          continue;
        }
        if (input.active !== undefined && entity.active !== input.active) {
          continue;
        }
        rows.push(cloneApprovalLineTemplate(entity));
      }
      rows.sort((left, right) => {
        const byCreatedAt = left.createdAt.getTime() - right.createdAt.getTime();
        if (byCreatedAt !== 0) {
          return byCreatedAt;
        }
        return left.id.localeCompare(right.id);
      });
      return rows;
    }
  },

  employees: {
    async create(input: CreateEmployeeInput) {
      const now = new Date();
      const entity: EmployeeEntity = {
        id: input.id,
        organizationId:
          input.organizationId === undefined ? null : input.organizationId,
        departmentId:
          input.departmentId === undefined ? null : input.departmentId,
        positionId:
          input.positionId === undefined ? null : input.positionId,
        name: input.name === undefined ? null : input.name,
        email: input.email === undefined ? null : input.email,
        active: input.active ?? true,
        createdAt: now,
        updatedAt: now
      };
      state.employees.set(entity.id, entity);
      return cloneEmployee(entity);
    },

    async findById(id: string) {
      const entity = state.employees.get(id);
      return entity ? cloneEmployee(entity) : null;
    },

    async update(id: string, input: UpdateEmployeeInput) {
      const existing = state.employees.get(id);
      if (!existing) {
        throw new Error(`employee not found: ${id}`);
      }
      const updated = updateEmployeeEntity(existing, input);
      state.employees.set(id, updated);
      return cloneEmployee(updated);
    },

    async list(input) {
      const rows: EmployeeEntity[] = [];
      for (const entity of state.employees.values()) {
        if (input.active !== undefined && entity.active !== input.active) {
          continue;
        }
        if (input.organizationId && entity.organizationId !== input.organizationId) {
          continue;
        }
        rows.push(cloneEmployee(entity));
      }
      rows.sort((a, b) => a.id.localeCompare(b.id));
      return rows;
    }
  },

  rbac: {
    async listRoles() {
      const roles: RoleWithPermissionsEntity[] = [];
      for (const role of state.roles.values()) {
        roles.push(toRoleWithPermissions(role, state.rolePermissions.get(role.id)));
      }
      roles.sort((a, b) => a.id.localeCompare(b.id));
      return roles;
    },

    async findRoleById(id: string) {
      const role = state.roles.get(id);
      if (!role) {
        return null;
      }
      return toRoleWithPermissions(role, state.rolePermissions.get(id));
    },

    async listRolePermissions(roleId: string) {
      const permissions = state.rolePermissions.get(roleId);
      if (!permissions) {
        return [];
      }
      const rows = Array.from(permissions);
      rows.sort((a, b) => a.localeCompare(b));
      return rows;
    },

    async upsertRole(input: UpsertRoleInput) {
      const now = new Date();
      const existing = state.roles.get(input.id);
      const role: RoleEntity = {
        id: input.id,
        name: input.name,
        description: input.description === undefined ? existing?.description ?? null : input.description,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now
      };

      const permissions = new Set(
        (input.permissions ?? [])
          .map((value) => value.trim())
          .filter((value) => value.length > 0)
      );

      state.roles.set(role.id, role);
      state.rolePermissions.set(role.id, permissions);

      return toRoleWithPermissions(role, permissions);
    }
  },

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
        captureChannel: input.captureChannel ?? "MANUAL",
        captureDeviceId: input.captureDeviceId ?? null,
        captureIpAddress: input.captureIpAddress ?? null,
        captureLatitude: input.captureLatitude ?? null,
        captureLongitude: input.captureLongitude ?? null,
        captureAccuracyMeters: input.captureAccuracyMeters ?? null,
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
        if (input.organizationId) {
          const employee = state.employees.get(entity.employeeId);
          if (!employee || employee.organizationId !== input.organizationId) {
            continue;
          }
        }
        if (input.employeeId && entity.employeeId !== input.employeeId) {
          continue;
        }
        rows.push(cloneAttendance(entity));
      }
      rows.sort((a, b) => a.checkInAt.getTime() - b.checkInAt.getTime());
      return rows;
    },

    async listInPeriod(input) {
      const rows: AttendanceRecordEntity[] = [];
      for (const entity of state.attendance.values()) {
        if (entity.checkInAt < input.periodStart || entity.checkInAt > input.periodEnd) {
          continue;
        }
        if (input.organizationId) {
          const employee = state.employees.get(entity.employeeId);
          if (!employee || employee.organizationId !== input.organizationId) {
            continue;
          }
        }
        if (input.employeeId && entity.employeeId !== input.employeeId) {
          continue;
        }
        if (input.state && entity.state !== input.state) {
          continue;
        }
        rows.push(cloneAttendance(entity));
      }
      rows.sort((a, b) => a.checkInAt.getTime() - b.checkInAt.getTime());
      return rows;
    }
  },

  scheduling: {
    async create(input: CreateWorkScheduleInput) {
      const now = new Date();
      const entity: WorkScheduleEntity = {
        id: nextId("WS"),
        employeeId: input.employeeId,
        startAt: cloneDate(input.startAt),
        endAt: cloneDate(input.endAt),
        breakMinutes: input.breakMinutes,
        isHoliday: input.isHoliday,
        notes: input.notes ?? null,
        createdAt: now,
        updatedAt: now
      };
      state.workSchedules.set(entity.id, entity);
      return cloneWorkSchedule(entity);
    },

    async findById(id: string) {
      const entity = state.workSchedules.get(id);
      return entity ? cloneWorkSchedule(entity) : null;
    },

    async update(id: string, input: UpdateWorkScheduleInput) {
      const existing = state.workSchedules.get(id);
      if (!existing) {
        throw new Error(`work schedule not found: ${id}`);
      }

      const updated: WorkScheduleEntity = {
        ...existing,
        startAt: input.startAt ? cloneDate(input.startAt) : existing.startAt,
        endAt: input.endAt ? cloneDate(input.endAt) : existing.endAt,
        breakMinutes: input.breakMinutes ?? existing.breakMinutes,
        isHoliday: input.isHoliday ?? existing.isHoliday,
        notes: input.notes !== undefined ? input.notes : existing.notes,
        updatedAt: new Date()
      };

      state.workSchedules.set(id, updated);
      return cloneWorkSchedule(updated);
    },

    async delete(id: string) {
      const existing = state.workSchedules.get(id);
      if (!existing) {
        throw new Error(`work schedule not found: ${id}`);
      }
      state.workSchedules.delete(id);
      return cloneWorkSchedule(existing);
    },

    async createTemplate(input: CreateWorkScheduleTemplateInput) {
      const now = new Date();
      const entity: WorkScheduleTemplateEntity = {
        id: nextId("WST"),
        organizationId: input.organizationId,
        name: input.name,
        startMinute: input.startMinute,
        endMinute: input.endMinute,
        breakMinutes: input.breakMinutes,
        isHoliday: input.isHoliday,
        weekdays: [...input.weekdays],
        notes: input.notes ?? null,
        createdAt: now,
        updatedAt: now
      };
      state.workScheduleTemplates.set(entity.id, entity);
      return cloneWorkScheduleTemplate(entity);
    },

    async findTemplateById(id: string) {
      const entity = state.workScheduleTemplates.get(id);
      return entity ? cloneWorkScheduleTemplate(entity) : null;
    },

    async updateTemplate(id: string, input: UpdateWorkScheduleTemplateInput) {
      const existing = state.workScheduleTemplates.get(id);
      if (!existing) {
        throw new Error(`work schedule template not found: ${id}`);
      }

      const updated: WorkScheduleTemplateEntity = {
        ...existing,
        name: input.name ?? existing.name,
        startMinute: input.startMinute ?? existing.startMinute,
        endMinute: input.endMinute ?? existing.endMinute,
        breakMinutes: input.breakMinutes ?? existing.breakMinutes,
        isHoliday: input.isHoliday ?? existing.isHoliday,
        weekdays: input.weekdays ? [...input.weekdays] : existing.weekdays,
        notes: input.notes !== undefined ? input.notes : existing.notes,
        updatedAt: new Date()
      };

      state.workScheduleTemplates.set(id, updated);
      return cloneWorkScheduleTemplate(updated);
    },

    async deleteTemplate(id: string) {
      const existing = state.workScheduleTemplates.get(id);
      if (!existing) {
        throw new Error(`work schedule template not found: ${id}`);
      }
      state.workScheduleTemplates.delete(id);
      return cloneWorkScheduleTemplate(existing);
    },

    async listTemplates(input: { organizationId?: string }) {
      const rows: WorkScheduleTemplateEntity[] = [];
      for (const entity of state.workScheduleTemplates.values()) {
        if (input.organizationId && entity.organizationId !== input.organizationId) {
          continue;
        }
        rows.push(cloneWorkScheduleTemplate(entity));
      }
      rows.sort((a, b) => a.name.localeCompare(b.name));
      return rows;
    },

    async listInPeriod(input) {
      const rows: WorkScheduleEntity[] = [];
      for (const entity of state.workSchedules.values()) {
        const overlaps = entity.startAt <= input.periodEnd && entity.endAt >= input.periodStart;
        if (!overlaps) {
          continue;
        }
        if (input.organizationId) {
          const employee = state.employees.get(entity.employeeId);
          if (!employee || employee.organizationId !== input.organizationId) {
            continue;
          }
        }
        if (input.employeeId && entity.employeeId !== input.employeeId) {
          continue;
        }
        rows.push(cloneWorkSchedule(entity));
      }
      rows.sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
      return rows;
    },

    async upsertIncident(input: UpsertScheduleAnomalyIncidentInput) {
      const existing = state.scheduleAnomalyIncidents.get(input.incidentId);
      const now = new Date();
      const entity: ScheduleAnomalyIncidentEntity = {
        incidentId: input.incidentId,
        organizationId:
          input.organizationId === undefined ? (existing?.organizationId ?? null) : input.organizationId,
        state: input.state,
        assigneeId: input.assigneeId,
        resolutionCode: input.resolutionCode,
        note: input.note,
        updatedAt: input.updatedAt,
        updatedByActorId: input.updatedByActorId,
        updatedByActorRole: input.updatedByActorRole,
        lastEscalationRequestedAt:
          input.lastEscalationRequestedAt === undefined
            ? (existing?.lastEscalationRequestedAt ?? null)
            : input.lastEscalationRequestedAt,
        history: input.history.map(cloneScheduleAnomalyIncidentHistoryEntry),
        createdAt: existing ? cloneDate(existing.createdAt) : now,
        rowUpdatedAt: now
      };
      state.scheduleAnomalyIncidents.set(entity.incidentId, entity);
      return cloneScheduleAnomalyIncident(entity);
    },

    async findIncidentByIncidentId(incidentId: string) {
      const entity = state.scheduleAnomalyIncidents.get(incidentId);
      return entity ? cloneScheduleAnomalyIncident(entity) : null;
    },

    async listIncidents(input: {
      organizationId?: string;
      state?: "ACKNOWLEDGED" | "ASSIGNED" | "RESOLVED";
      assigneeId?: string;
      incidentIds?: string[];
    }) {
      const incidentIds =
        input.incidentIds && input.incidentIds.length > 0 ? new Set(input.incidentIds) : null;
      const rows: ScheduleAnomalyIncidentEntity[] = [];
      for (const entity of state.scheduleAnomalyIncidents.values()) {
        if (input.organizationId !== undefined && entity.organizationId !== input.organizationId) {
          continue;
        }
        if (input.state && entity.state !== input.state) {
          continue;
        }
        if (input.assigneeId && entity.assigneeId !== input.assigneeId) {
          continue;
        }
        if (incidentIds && !incidentIds.has(entity.incidentId)) {
          continue;
        }
        rows.push(cloneScheduleAnomalyIncident(entity));
      }
      rows.sort((left, right) => {
        const byUpdatedAt = right.updatedAt.localeCompare(left.updatedAt);
        if (byUpdatedAt !== 0) {
          return byUpdatedAt;
        }
        return left.incidentId.localeCompare(right.incidentId);
      });
      return rows;
    },

    async markIncidentEscalationRequested(input: {
      incidentId: string;
      organizationId?: string;
      requestedAt: string;
    }) {
      const existing = state.scheduleAnomalyIncidents.get(input.incidentId);
      if (!existing) {
        throw new Error(`schedule anomaly incident not found: ${input.incidentId}`);
      }
      if (
        input.organizationId !== undefined &&
        existing.organizationId !== input.organizationId
      ) {
        throw new Error(`schedule anomaly incident not found: ${input.incidentId}`);
      }
      const updated: ScheduleAnomalyIncidentEntity = {
        ...existing,
        lastEscalationRequestedAt: input.requestedAt,
        rowUpdatedAt: new Date()
      };
      state.scheduleAnomalyIncidents.set(updated.incidentId, updated);
      return cloneScheduleAnomalyIncident(updated);
    },

    async deleteIncident(input: {
      incidentId: string;
      organizationId?: string;
    }) {
      const existing = state.scheduleAnomalyIncidents.get(input.incidentId);
      if (!existing) {
        return false;
      }
      if (input.organizationId !== undefined && existing.organizationId !== input.organizationId) {
        return false;
      }
      state.scheduleAnomalyIncidents.delete(input.incidentId);
      return true;
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
        unit: input.unit ?? "FULL_DAY",
        hours: input.hours ?? null,
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

    async listInPeriod(input) {
      const rows: LeaveRequestEntity[] = [];
      for (const request of state.leaveRequests.values()) {
        const overlaps = request.startDate <= input.periodEnd && request.endDate >= input.periodStart;
        if (!overlaps) {
          continue;
        }
        if (input.organizationId) {
          const employee = state.employees.get(request.employeeId);
          if (!employee || employee.organizationId !== input.organizationId) {
            continue;
          }
        }
        if (input.employeeId && request.employeeId !== input.employeeId) {
          continue;
        }
        if (input.state && request.state !== input.state) {
          continue;
        }
        rows.push(cloneLeaveRequest(request));
      }
      rows.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
      return rows;
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
        organizationId: null,
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

  leavePolicy: {
    async findByOrganizationId(organizationId: string) {
      const existing = state.leavePolicies.get(organizationId);
      return existing ? cloneLeavePolicy(existing) : null;
    },

    async upsertForOrganization(input: UpsertLeavePolicyInput) {
      const now = new Date();
      const existing = state.leavePolicies.get(input.organizationId);
      const next: LeavePolicyEntity = existing
        ? {
            ...existing,
            annualGrantDays: input.annualGrantDays,
            carryOverCapDays: input.carryOverCapDays,
            allowHalfDay: input.allowHalfDay ?? existing.allowHalfDay,
            allowHourly: input.allowHourly ?? existing.allowHourly,
            hourlyIncrementMinutes:
              input.hourlyIncrementMinutes ?? existing.hourlyIncrementMinutes,
            maxHoursPerRequest: input.maxHoursPerRequest ?? existing.maxHoursPerRequest,
            updatedAt: now
          }
        : {
            id: nextId("LP"),
            organizationId: input.organizationId,
            annualGrantDays: input.annualGrantDays,
            carryOverCapDays: input.carryOverCapDays,
            allowHalfDay: input.allowHalfDay ?? true,
            allowHourly: input.allowHourly ?? true,
            hourlyIncrementMinutes: input.hourlyIncrementMinutes ?? 30,
            maxHoursPerRequest: input.maxHoursPerRequest ?? 8,
            createdAt: now,
            updatedAt: now
          };
      state.leavePolicies.set(input.organizationId, next);
      return cloneLeavePolicy(next);
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
      const usedDays = roundTo2(current.usedDays + input.usedDaysDelta);
      const remainingDays = roundTo2(current.grantedDays - usedDays);
      const next: LeaveBalanceEntity = {
        ...current,
        usedDays,
        remainingDays,
        updatedAt: new Date()
      };
      state.leaveBalances.set(input.employeeId, next);
      return cloneLeaveBalance(next);
    },

    async settleAccrual(input) {
      const current = await this.ensure(input.employeeId, input.defaultGrantedDays);
      const carryOverDays = roundTo2(
        Math.min(input.carryOverCapDays, Math.max(0, current.remainingDays))
      );
      const grantedDays = roundTo2(input.annualGrantDays + carryOverDays);

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
        organizationId: input.organizationId === undefined ? null : input.organizationId,
        employeeId: input.employeeId ?? null,
        periodStart: cloneDate(input.periodStart),
        periodEnd: cloneDate(input.periodEnd),
        state: "PREVIEWED",
        grossPayKrw: input.grossPayKrw,
        withholdingTaxKrw: input.withholdingTaxKrw ?? null,
        socialInsuranceKrw: input.socialInsuranceKrw ?? null,
        otherDeductionsKrw: input.otherDeductionsKrw ?? null,
        totalDeductionsKrw: input.totalDeductionsKrw ?? null,
        netPayKrw: input.netPayKrw ?? null,
        deductionBreakdown: input.deductionBreakdown ? cloneJson(input.deductionBreakdown) : null,
        deductionProfileId: input.deductionProfileId ?? null,
        deductionProfileVersion: input.deductionProfileVersion ?? null,
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

    async listInPeriod(input) {
      const rows: PayrollRunEntity[] = [];
      for (const run of state.payroll.values()) {
        if (run.periodStart < input.periodStart) {
          continue;
        }
        if (run.periodEnd > input.periodEnd) {
          continue;
        }
        if (input.organizationId && run.organizationId !== input.organizationId) {
          continue;
        }
        if (input.employeeId && run.employeeId !== input.employeeId) {
          continue;
        }
        if (input.state && run.state !== input.state) {
          continue;
        }
        rows.push(clonePayroll(run));
      }
      rows.sort((a, b) => a.periodStart.getTime() - b.periodStart.getTime());
      return rows;
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

  deductionProfiles: {
    async findById(id) {
      const profile = state.deductionProfiles.get(id);
      return profile ? cloneDeductionProfile(profile) : null;
    },

    async list(input) {
      const rows: DeductionProfileEntity[] = [];
      for (const profile of state.deductionProfiles.values()) {
        if (input.organizationId && profile.organizationId !== input.organizationId) {
          continue;
        }
        if (input.active !== undefined && profile.active !== input.active) {
          continue;
        }
        if (input.mode && profile.mode !== input.mode) {
          continue;
        }
        rows.push(cloneDeductionProfile(profile));
      }
      rows.sort((a, b) => a.id.localeCompare(b.id));
      return rows;
    },

    async upsert(input: UpsertDeductionProfileInput) {
      const existing = state.deductionProfiles.get(input.id);
      const now = new Date();
      const nextVersion = existing ? existing.version + 1 : 1;

      const profile: DeductionProfileEntity = {
        id: input.id,
        organizationId: input.organizationId === undefined ? null : input.organizationId,
        name: input.name,
        version: nextVersion,
        mode: input.mode,
        withholdingRate: input.withholdingRate,
        socialInsuranceRate: input.socialInsuranceRate,
        fixedOtherDeductionKrw: input.fixedOtherDeductionKrw,
        active: input.active,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now
      };

      state.deductionProfiles.set(profile.id, profile);
      return cloneDeductionProfile(profile);
    }
  },

  audit: {
    async append(input) {
      const createdAt = new Date();
      state.audit.push({
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        organizationId: input.organizationId === undefined ? null : input.organizationId,
        actorRole: input.actorRole,
        actorId: input.actorId ?? null,
        payload: input.payload ?? null,
        createdAt
      });
    },

    async list(input: ListAuditLogsInput) {
      const actions = new Set((input.actions ?? []).map((item) => item.trim()).filter((item) => item));
      const limit = input.limit ?? 500;
      const normalizedLimit = Number.isInteger(limit) && limit > 0 ? limit : 500;

      const rows = state.audit
        .filter((entry) => (actions.size > 0 ? actions.has(entry.action) : true))
        .filter((entry) => (input.entityType ? entry.entityType === input.entityType : true))
        .filter((entry) => (input.entityId ? entry.entityId === input.entityId : true))
        .filter((entry) =>
          input.organizationId !== undefined ? entry.organizationId === input.organizationId : true
        )
        .sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime())
        .slice(0, normalizedLimit)
        .map((entry) => ({
          ...entry,
          payload: cloneJson(entry.payload),
          createdAt: cloneDate(entry.createdAt)
        }));

      return rows;
    }
  }
};

export function resetMemoryDataAccess() {
  state = createState();
}

export function getMemoryAuditActions() {
  return state.audit.map((entry) => entry.action);
}

export function getMemoryAuditEntries() {
  return state.audit.map((entry) => ({
    ...entry,
    payload: cloneJson(entry.payload),
    createdAt: cloneDate(entry.createdAt)
  }));
}
