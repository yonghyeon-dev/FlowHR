export type AttendanceState = "PENDING" | "APPROVED" | "REJECTED";
export type AttendanceCaptureChannel = "MANUAL" | "GPS" | "QR" | "WIFI" | "DEVICE";
export type LeaveType = "ANNUAL" | "SICK" | "UNPAID";
export type LeaveRequestState = "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";
export type LeaveDecisionAction = "APPROVED" | "REJECTED" | "CANCELED";
export type LeaveRequestUnit = "FULL_DAY" | "HALF_DAY" | "HOUR";
export type PayrollState = "PREVIEWED" | "CONFIRMED";
export type DeductionProfileMode = "manual" | "profile";
export type ApprovalDomain = "ATTENDANCE" | "LEAVE" | "PAYROLL";
export type ApprovalStageResolution =
  | "EXPECTED_ROLE"
  | "ACTIVE_DELEGATION"
  | "PRIVILEGED_BYPASS"
  | "DENIED";
export type ApprovalExecutionState = "PENDING" | "APPROVED" | "REJECTED";
export type ApprovalExecutionActionType = "APPROVE" | "REJECT";

export type AttendanceRecordEntity = {
  id: string;
  employeeId: string;
  checkInAt: Date;
  checkOutAt: Date | null;
  breakMinutes: number;
  isHoliday: boolean;
  notes: string | null;
  captureChannel: AttendanceCaptureChannel;
  captureDeviceId: string | null;
  captureIpAddress: string | null;
  captureLatitude: number | null;
  captureLongitude: number | null;
  captureAccuracyMeters: number | null;
  state: AttendanceState;
  approvedAt: Date | null;
  approvedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type WorkScheduleEntity = {
  id: string;
  employeeId: string;
  startAt: Date;
  endAt: Date;
  breakMinutes: number;
  isHoliday: boolean;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type WorkScheduleTemplateEntity = {
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
};

export type ScheduleAnomalyIncidentLifecycleAction = "ACKNOWLEDGE" | "ASSIGN" | "RESOLVE";
export type ScheduleAnomalyIncidentLifecycleState = "ACKNOWLEDGED" | "ASSIGNED" | "RESOLVED";
export type ScheduleAnomalyIncidentResolutionCode =
  | "FALSE_POSITIVE"
  | "ATTENDANCE_CORRECTED"
  | "MANUAL_CONFIRMED"
  | "OTHER";

export type ScheduleAnomalyIncidentHistoryEntryEntity = {
  action: ScheduleAnomalyIncidentLifecycleAction;
  state: ScheduleAnomalyIncidentLifecycleState;
  assigneeId: string | null;
  resolutionCode: ScheduleAnomalyIncidentResolutionCode | null;
  note: string | null;
  updatedAt: string;
  updatedByActorId: string | null;
  updatedByActorRole: string;
};

export type ScheduleAnomalyIncidentEntity = {
  incidentId: string;
  organizationId: string | null;
  state: ScheduleAnomalyIncidentLifecycleState;
  assigneeId: string | null;
  resolutionCode: ScheduleAnomalyIncidentResolutionCode | null;
  note: string | null;
  updatedAt: string;
  updatedByActorId: string | null;
  updatedByActorRole: string;
  lastEscalationRequestedAt: string | null;
  history: ScheduleAnomalyIncidentHistoryEntryEntity[];
  createdAt: Date;
  rowUpdatedAt: Date;
};

export type PayrollRunEntity = {
  id: string;
  organizationId: string | null;
  employeeId: string | null;
  periodStart: Date;
  periodEnd: Date;
  state: PayrollState;
  grossPayKrw: number;
  withholdingTaxKrw: number | null;
  socialInsuranceKrw: number | null;
  otherDeductionsKrw: number | null;
  totalDeductionsKrw: number | null;
  netPayKrw: number | null;
  deductionBreakdown: Record<string, unknown> | null;
  deductionProfileId: string | null;
  deductionProfileVersion: number | null;
  sourceRecordCount: number;
  confirmedAt: Date | null;
  confirmedBy: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type DeductionProfileEntity = {
  id: string;
  organizationId: string | null;
  name: string;
  version: number;
  mode: DeductionProfileMode;
  withholdingRate: number | null;
  socialInsuranceRate: number | null;
  fixedOtherDeductionKrw: number;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type OrganizationEntity = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
};

export type DepartmentEntity = {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type PositionEntity = {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ApprovalPolicyEntity = {
  id: string;
  organizationId: string;
  attendanceApproverRole: string;
  leaveApproverRole: string;
  payrollApproverRole: string;
  createdAt: Date;
  updatedAt: Date;
};

export type ApprovalDelegationEntity = {
  id: string;
  organizationId: string;
  domain: ApprovalDomain;
  delegatorRole: string;
  delegateActorId: string;
  reason: string | null;
  startsAt: Date;
  endsAt: Date;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ApprovalLineTemplateEntity = {
  id: string;
  organizationId: string;
  name: string;
  domain: ApprovalDomain;
  approverRoles: string[];
  approvalStages: ApprovalTemplateStageEntity[];
  payrollGrossPayMinKrw: number | null;
  payrollGrossPayMaxKrw: number | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ApprovalTemplateStageEntity = {
  stageIndex: number;
  label: string;
  approverRoles: string[];
  minApprovals: number;
};

export type ApprovalStageHistoryEntity = {
  id: string;
  organizationId: string;
  domain: ApprovalDomain;
  targetEntityType: string;
  targetEntityId: string;
  stageIndex: number;
  stageLabel: string;
  requiredRoles: string[];
  fallbackRole: string;
  matchedTemplateIds: string[];
  activeDelegationIds: string[];
  actorRole: string;
  actorId: string | null;
  allowed: boolean;
  resolution: ApprovalStageResolution;
  payrollGrossPayKrw: number | null;
  evaluatedAt: Date;
};

export type ApprovalExecutionEntity = {
  id: string;
  organizationId: string;
  domain: ApprovalDomain;
  targetEntityType: string;
  targetEntityId: string;
  templateId: string | null;
  state: ApprovalExecutionState;
  totalStages: number;
  currentStageIndex: number;
  startedAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ApprovalExecutionActionEntity = {
  id: string;
  executionId: string;
  stageIndex: number;
  action: ApprovalExecutionActionType;
  actorRole: string;
  actorId: string | null;
  resolution: ApprovalStageResolution;
  createdAt: Date;
};

export type EmployeeEntity = {
  id: string;
  organizationId: string | null;
  departmentId: string | null;
  positionId: string | null;
  name: string | null;
  email: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type RoleEntity = {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type RoleWithPermissionsEntity = RoleEntity & {
  permissions: string[];
};

export type LeaveRequestEntity = {
  id: string;
  employeeId: string;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  unit: LeaveRequestUnit;
  hours: number | null;
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
  carryOverDays: number;
  lastAccrualYear: number | null;
  updatedAt: Date;
};

export type LeavePolicyEntity = {
  id: string;
  organizationId: string;
  annualGrantDays: number;
  carryOverCapDays: number;
  allowHalfDay: boolean;
  allowHourly: boolean;
  hourlyIncrementMinutes: number;
  maxHoursPerRequest: number;
  minNoticeDays: number;
  maxConsecutiveDays: number | null;
  annualLeavePromotionEnabled: boolean;
  annualLeavePromotionThresholdDays: number;
  annualLeavePromotionLeadDays: number;
  annualLeavePromotionMessageTemplate: string | null;
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
  captureChannel?: AttendanceCaptureChannel;
  captureDeviceId?: string | null;
  captureIpAddress?: string | null;
  captureLatitude?: number | null;
  captureLongitude?: number | null;
  captureAccuracyMeters?: number | null;
};

export type UpdateAttendanceRecordInput = {
  checkInAt?: Date;
  checkOutAt?: Date | null;
  breakMinutes?: number;
  isHoliday?: boolean;
  notes?: string | null;
  captureChannel?: AttendanceCaptureChannel;
  captureDeviceId?: string | null;
  captureIpAddress?: string | null;
  captureLatitude?: number | null;
  captureLongitude?: number | null;
  captureAccuracyMeters?: number | null;
  state?: AttendanceState;
  approvedAt?: Date | null;
  approvedBy?: string | null;
};

export type CreateWorkScheduleInput = {
  employeeId: string;
  startAt: Date;
  endAt: Date;
  breakMinutes: number;
  isHoliday: boolean;
  notes?: string;
};

export type UpdateWorkScheduleInput = {
  startAt?: Date;
  endAt?: Date;
  breakMinutes?: number;
  isHoliday?: boolean;
  notes?: string | null;
};

export type CreateWorkScheduleTemplateInput = {
  organizationId: string;
  name: string;
  startMinute: number;
  endMinute: number;
  breakMinutes: number;
  isHoliday: boolean;
  weekdays: number[];
  notes?: string;
};

export type UpdateWorkScheduleTemplateInput = {
  name?: string;
  startMinute?: number;
  endMinute?: number;
  breakMinutes?: number;
  isHoliday?: boolean;
  weekdays?: number[];
  notes?: string | null;
};

export type UpsertScheduleAnomalyIncidentInput = {
  incidentId: string;
  organizationId?: string | null;
  state: ScheduleAnomalyIncidentLifecycleState;
  assigneeId: string | null;
  resolutionCode: ScheduleAnomalyIncidentResolutionCode | null;
  note: string | null;
  updatedAt: string;
  updatedByActorId: string | null;
  updatedByActorRole: string;
  lastEscalationRequestedAt?: string | null;
  history: ScheduleAnomalyIncidentHistoryEntryEntity[];
};

export type CreatePayrollRunInput = {
  organizationId?: string | null;
  employeeId?: string;
  periodStart: Date;
  periodEnd: Date;
  grossPayKrw: number;
  withholdingTaxKrw?: number | null;
  socialInsuranceKrw?: number | null;
  otherDeductionsKrw?: number | null;
  totalDeductionsKrw?: number | null;
  netPayKrw?: number | null;
  deductionBreakdown?: Record<string, unknown> | null;
  deductionProfileId?: string | null;
  deductionProfileVersion?: number | null;
  sourceRecordCount: number;
};

export type UpdatePayrollRunInput = {
  state?: PayrollState;
  confirmedAt?: Date | null;
  confirmedBy?: string | null;
};

export type UpsertDeductionProfileInput = {
  id: string;
  organizationId?: string | null;
  name: string;
  mode: DeductionProfileMode;
  withholdingRate: number | null;
  socialInsuranceRate: number | null;
  fixedOtherDeductionKrw: number;
  active: boolean;
};

export type CreateOrganizationInput = {
  name: string;
};

export type CreateEmployeeInput = {
  id: string;
  organizationId?: string | null;
  departmentId?: string | null;
  positionId?: string | null;
  name?: string | null;
  email?: string | null;
  active?: boolean;
};

export type UpdateEmployeeInput = {
  organizationId?: string | null;
  departmentId?: string | null;
  positionId?: string | null;
  name?: string | null;
  email?: string | null;
  active?: boolean;
};

export type CreateDepartmentInput = {
  organizationId: string;
  code: string;
  name: string;
  active?: boolean;
};

export type UpdateDepartmentInput = {
  code?: string;
  name?: string;
  active?: boolean;
};

export type CreatePositionInput = {
  organizationId: string;
  code: string;
  name: string;
  active?: boolean;
};

export type UpdatePositionInput = {
  code?: string;
  name?: string;
  active?: boolean;
};

export type UpsertApprovalPolicyInput = {
  organizationId: string;
  attendanceApproverRole: string;
  leaveApproverRole: string;
  payrollApproverRole: string;
};

export type CreateApprovalDelegationInput = {
  organizationId: string;
  domain: ApprovalDomain;
  delegatorRole: string;
  delegateActorId: string;
  reason?: string | null;
  startsAt: Date;
  endsAt: Date;
  active?: boolean;
};

export type UpdateApprovalDelegationInput = {
  delegateActorId?: string;
  reason?: string | null;
  startsAt?: Date;
  endsAt?: Date;
  active?: boolean;
};

export type CreateApprovalLineTemplateInput = {
  organizationId: string;
  name: string;
  domain: ApprovalDomain;
  approverRoles: string[];
  approvalStages?: ApprovalTemplateStageEntity[];
  payrollGrossPayMinKrw?: number | null;
  payrollGrossPayMaxKrw?: number | null;
  active?: boolean;
};

export type UpdateApprovalLineTemplateInput = {
  name?: string;
  domain?: ApprovalDomain;
  approverRoles?: string[];
  approvalStages?: ApprovalTemplateStageEntity[];
  payrollGrossPayMinKrw?: number | null;
  payrollGrossPayMaxKrw?: number | null;
  active?: boolean;
};

export type CreateApprovalStageHistoryInput = {
  organizationId: string;
  domain: ApprovalDomain;
  targetEntityType: string;
  targetEntityId: string;
  stageIndex?: number;
  stageLabel?: string;
  requiredRoles: string[];
  fallbackRole: string;
  matchedTemplateIds?: string[];
  activeDelegationIds?: string[];
  actorRole: string;
  actorId?: string | null;
  allowed: boolean;
  resolution: ApprovalStageResolution;
  payrollGrossPayKrw?: number | null;
  evaluatedAt?: Date;
};

export type CreateApprovalExecutionInput = {
  organizationId: string;
  domain: ApprovalDomain;
  targetEntityType: string;
  targetEntityId: string;
  templateId?: string | null;
  totalStages: number;
  currentStageIndex?: number;
  state?: ApprovalExecutionState;
  startedAt?: Date;
  completedAt?: Date | null;
};

export type UpdateApprovalExecutionInput = {
  templateId?: string | null;
  state?: ApprovalExecutionState;
  totalStages?: number;
  currentStageIndex?: number;
  completedAt?: Date | null;
};

export type CreateApprovalExecutionActionInput = {
  executionId: string;
  stageIndex: number;
  action: ApprovalExecutionActionType;
  actorRole: string;
  actorId?: string | null;
  resolution: ApprovalStageResolution;
  createdAt?: Date;
};

export type UpsertRoleInput = {
  id: string;
  name: string;
  description?: string | null;
  permissions: string[];
};

export type CreateLeaveRequestInput = {
  employeeId: string;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  unit?: LeaveRequestUnit;
  hours?: number | null;
  days: number;
  reason?: string;
};

export type UpdateLeaveRequestInput = {
  leaveType?: LeaveType;
  startDate?: Date;
  endDate?: Date;
  unit?: LeaveRequestUnit;
  hours?: number | null;
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

export type UpsertLeavePolicyInput = {
  organizationId: string;
  annualGrantDays: number;
  carryOverCapDays: number;
  allowHalfDay?: boolean;
  allowHourly?: boolean;
  hourlyIncrementMinutes?: number;
  maxHoursPerRequest?: number;
  minNoticeDays?: number;
  maxConsecutiveDays?: number | null;
  annualLeavePromotionEnabled?: boolean;
  annualLeavePromotionThresholdDays?: number;
  annualLeavePromotionLeadDays?: number;
  annualLeavePromotionMessageTemplate?: string | null;
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
  organizationId?: string | null;
  actorRole: string;
  actorId?: string;
  payload?: unknown;
};

export type AuditLogEntity = {
  action: string;
  entityType: string;
  entityId: string | null;
  organizationId: string | null;
  actorRole: string;
  actorId: string | null;
  payload: unknown;
  createdAt: Date;
};

export type ListAuditLogsInput = {
  actions?: string[];
  entityType?: string;
  entityId?: string;
  organizationId?: string;
  limit?: number;
};

export interface AttendanceStore {
  create(input: CreateAttendanceRecordInput): Promise<AttendanceRecordEntity>;
  findById(id: string): Promise<AttendanceRecordEntity | null>;
  update(id: string, input: UpdateAttendanceRecordInput): Promise<AttendanceRecordEntity>;
  listApprovedInPeriod(input: {
    periodStart: Date;
    periodEnd: Date;
    organizationId?: string;
    employeeId?: string;
  }): Promise<AttendanceRecordEntity[]>;
  listInPeriod(input: {
    periodStart: Date;
    periodEnd: Date;
    organizationId?: string;
    employeeId?: string;
    state?: AttendanceState;
  }): Promise<AttendanceRecordEntity[]>;
}

export interface SchedulingStore {
  create(input: CreateWorkScheduleInput): Promise<WorkScheduleEntity>;
  findById(id: string): Promise<WorkScheduleEntity | null>;
  update(id: string, input: UpdateWorkScheduleInput): Promise<WorkScheduleEntity>;
  delete(id: string): Promise<WorkScheduleEntity>;
  createTemplate(input: CreateWorkScheduleTemplateInput): Promise<WorkScheduleTemplateEntity>;
  findTemplateById(id: string): Promise<WorkScheduleTemplateEntity | null>;
  updateTemplate(id: string, input: UpdateWorkScheduleTemplateInput): Promise<WorkScheduleTemplateEntity>;
  deleteTemplate(id: string): Promise<WorkScheduleTemplateEntity>;
  listTemplates(input: { organizationId?: string }): Promise<WorkScheduleTemplateEntity[]>;
  listInPeriod(input: {
    periodStart: Date;
    periodEnd: Date;
    organizationId?: string;
    employeeId?: string;
  }): Promise<WorkScheduleEntity[]>;
  upsertIncident(input: UpsertScheduleAnomalyIncidentInput): Promise<ScheduleAnomalyIncidentEntity>;
  findIncidentByIncidentId(incidentId: string): Promise<ScheduleAnomalyIncidentEntity | null>;
  listIncidents(input: {
    organizationId?: string;
    state?: ScheduleAnomalyIncidentLifecycleState;
    assigneeId?: string;
    incidentIds?: string[];
  }): Promise<ScheduleAnomalyIncidentEntity[]>;
  markIncidentEscalationRequested(input: {
    incidentId: string;
    organizationId?: string;
    requestedAt: string;
  }): Promise<ScheduleAnomalyIncidentEntity>;
  deleteIncident(input: {
    incidentId: string;
    organizationId?: string;
  }): Promise<boolean>;
}

export interface PayrollStore {
  create(input: CreatePayrollRunInput): Promise<PayrollRunEntity>;
  findById(id: string): Promise<PayrollRunEntity | null>;
  update(id: string, input: UpdatePayrollRunInput): Promise<PayrollRunEntity>;
  listInPeriod(input: {
    periodStart: Date;
    periodEnd: Date;
    organizationId?: string;
    employeeId?: string;
    state?: PayrollState;
  }): Promise<PayrollRunEntity[]>;
}

export interface DeductionProfileStore {
  findById(id: string): Promise<DeductionProfileEntity | null>;
  upsert(input: UpsertDeductionProfileInput): Promise<DeductionProfileEntity>;
  list(input: {
    organizationId?: string;
    active?: boolean;
    mode?: DeductionProfileMode;
  }): Promise<DeductionProfileEntity[]>;
}

export interface OrganizationStore {
  create(input: CreateOrganizationInput): Promise<OrganizationEntity>;
  findById(id: string): Promise<OrganizationEntity | null>;
  list(): Promise<OrganizationEntity[]>;
}

export interface EmployeeStore {
  create(input: CreateEmployeeInput): Promise<EmployeeEntity>;
  findById(id: string): Promise<EmployeeEntity | null>;
  update(id: string, input: UpdateEmployeeInput): Promise<EmployeeEntity>;
  list(input: { active?: boolean; organizationId?: string }): Promise<EmployeeEntity[]>;
}

export interface DepartmentStore {
  create(input: CreateDepartmentInput): Promise<DepartmentEntity>;
  findById(id: string): Promise<DepartmentEntity | null>;
  update(id: string, input: UpdateDepartmentInput): Promise<DepartmentEntity>;
  list(input: { active?: boolean; organizationId?: string }): Promise<DepartmentEntity[]>;
}

export interface PositionStore {
  create(input: CreatePositionInput): Promise<PositionEntity>;
  findById(id: string): Promise<PositionEntity | null>;
  update(id: string, input: UpdatePositionInput): Promise<PositionEntity>;
  list(input: { active?: boolean; organizationId?: string }): Promise<PositionEntity[]>;
}

export interface ApprovalStore {
  findPolicyByOrganizationId(organizationId: string): Promise<ApprovalPolicyEntity | null>;
  upsertPolicyForOrganization(input: UpsertApprovalPolicyInput): Promise<ApprovalPolicyEntity>;
  createDelegation(input: CreateApprovalDelegationInput): Promise<ApprovalDelegationEntity>;
  findDelegationById(id: string): Promise<ApprovalDelegationEntity | null>;
  updateDelegation(id: string, input: UpdateApprovalDelegationInput): Promise<ApprovalDelegationEntity>;
  listDelegations(input: {
    organizationId?: string;
    domain?: ApprovalDomain;
    active?: boolean;
    delegateActorId?: string;
  }): Promise<ApprovalDelegationEntity[]>;
  createTemplate(input: CreateApprovalLineTemplateInput): Promise<ApprovalLineTemplateEntity>;
  findTemplateById(id: string): Promise<ApprovalLineTemplateEntity | null>;
  updateTemplate(id: string, input: UpdateApprovalLineTemplateInput): Promise<ApprovalLineTemplateEntity>;
  listTemplates(input: {
    organizationId?: string;
    domain?: ApprovalDomain;
    active?: boolean;
  }): Promise<ApprovalLineTemplateEntity[]>;
  appendStageHistory(input: CreateApprovalStageHistoryInput): Promise<ApprovalStageHistoryEntity>;
  listStageHistory(input: {
    organizationId: string;
    domain?: ApprovalDomain;
    targetEntityType?: string;
    targetEntityId?: string;
    allowed?: boolean;
    resolution?: ApprovalStageResolution;
    from?: Date;
    to?: Date;
    limit?: number;
  }): Promise<ApprovalStageHistoryEntity[]>;
  findExecutionByTarget(input: {
    organizationId: string;
    domain: ApprovalDomain;
    targetEntityType: string;
    targetEntityId: string;
  }): Promise<ApprovalExecutionEntity | null>;
  createExecution(input: CreateApprovalExecutionInput): Promise<ApprovalExecutionEntity>;
  updateExecution(id: string, input: UpdateApprovalExecutionInput): Promise<ApprovalExecutionEntity>;
  listExecutions(input: {
    organizationId: string;
    domain?: ApprovalDomain;
    targetEntityType?: string;
    targetEntityId?: string;
    state?: ApprovalExecutionState;
    limit?: number;
  }): Promise<ApprovalExecutionEntity[]>;
  appendExecutionAction(
    input: CreateApprovalExecutionActionInput
  ): Promise<ApprovalExecutionActionEntity>;
  listExecutionActions(input: {
    executionId: string;
    stageIndex?: number;
    action?: ApprovalExecutionActionType;
    actorId?: string | null;
  }): Promise<ApprovalExecutionActionEntity[]>;
}

export interface RbacStore {
  listRoles(): Promise<RoleWithPermissionsEntity[]>;
  findRoleById(id: string): Promise<RoleWithPermissionsEntity | null>;
  upsertRole(input: UpsertRoleInput): Promise<RoleWithPermissionsEntity>;
  listRolePermissions(roleId: string): Promise<string[]>;
}

export interface LeaveStore {
  create(input: CreateLeaveRequestInput): Promise<LeaveRequestEntity>;
  findById(id: string): Promise<LeaveRequestEntity | null>;
  update(id: string, input: UpdateLeaveRequestInput): Promise<LeaveRequestEntity>;
  listInPeriod(input: {
    periodStart: Date;
    periodEnd: Date;
    organizationId?: string;
    employeeId?: string;
    state?: LeaveRequestState;
  }): Promise<LeaveRequestEntity[]>;
  findOverlappingActiveRequests(input: {
    employeeId: string;
    startDate: Date;
    endDate: Date;
    excludeRequestId?: string;
  }): Promise<LeaveRequestEntity[]>;
  appendDecision(input: RecordLeaveDecisionInput): Promise<void>;
}

export interface LeavePolicyStore {
  findByOrganizationId(organizationId: string): Promise<LeavePolicyEntity | null>;
  upsertForOrganization(input: UpsertLeavePolicyInput): Promise<LeavePolicyEntity>;
}

export interface LeaveBalanceStore {
  ensure(employeeId: string, defaultGrantedDays: number): Promise<LeaveBalanceEntity>;
  applyUsage(input: {
    employeeId: string;
    usedDaysDelta: number;
    defaultGrantedDays: number;
  }): Promise<LeaveBalanceEntity>;
  settleAccrual(input: {
    employeeId: string;
    year: number;
    annualGrantDays: number;
    carryOverCapDays: number;
    defaultGrantedDays: number;
  }): Promise<LeaveBalanceEntity>;
}

export interface AuditStore {
  append(input: AppendAuditLogInput): Promise<void>;
  list(input: ListAuditLogsInput): Promise<AuditLogEntity[]>;
}

export type DataAccess = {
  organizations: OrganizationStore;
  employees: EmployeeStore;
  departments: DepartmentStore;
  positions: PositionStore;
  approvals: ApprovalStore;
  rbac: RbacStore;
  attendance: AttendanceStore;
  scheduling: SchedulingStore;
  leave: LeaveStore;
  leavePolicy: LeavePolicyStore;
  leaveBalance: LeaveBalanceStore;
  payroll: PayrollStore;
  deductionProfiles: DeductionProfileStore;
  audit: AuditStore;
};
