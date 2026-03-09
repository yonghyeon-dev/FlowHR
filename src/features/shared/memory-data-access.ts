import type {
  ApprovalDelegationEntity,
  ApprovalDomain,
  ApprovalExecutionActionEntity,
  ApprovalExecutionActionType,
  ApprovalExecutionEntity,
  ApprovalExecutionState,
  ApprovalLineTemplateEntity,
  ApprovalPolicyEntity,
  ApprovalTemplateStageEntity,
  ApprovalStageHistoryEntity,
  AuditLogEntity,
  AttendanceRecordEntity,
  CreateApprovalDelegationInput,
  CreateApprovalExecutionActionInput,
  CreateApprovalExecutionInput,
  CreateApprovalStageHistoryInput,
  CreateContractTemplateVersionInput,
  CreateApprovalLineTemplateInput,
  CreateWorkScheduleTemplateInput,
  CreateWorkScheduleInput,
  ContractTemplateVersionEntity,
  ListAuditLogsInput,
  ListContractTemplateVersionsInput,
  UpdateApprovalDelegationInput,
  UpdateApprovalExecutionInput,
  UpdateApprovalLineTemplateInput,
  UpdateWorkScheduleInput,
  UpdateWorkScheduleTemplateInput,
  CreateEmployeeInput,
  CreateLeavePolicyInput,
  CreateBenefitCatalogItemInput,
  CreateBenefitRequestInput,
  CreateOnboardingTaskInput,
  CreateOnboardingTaskTemplateInput,
  CreateRecruitmentOpeningInput,
  CreateRecruitmentReferralInput,
  CreateDepartmentInput,
  CreatePositionInput,
  CreateNoticeInput,
  CreateNoticeNotificationInput,
  CreateOrganizationInput,
  DataAccess,
  DepartmentEntity,
  DeductionProfileEntity,
  EmployeeEntity,
  EmployeeStatus,
  BenefitCatalogItemEntity,
  BenefitRequestEntity,
  CreateInAppNotificationInput,
  InsuranceEnrollmentEntity,
  InsuranceEnrollmentType,
  InAppNotificationEntity,
  OnboardingTaskEntity,
  OnboardingTaskStatus,
  OnboardingTaskTemplateEntity,
  LeaveBalanceEntity,
  LeavePromotionDeliveryEntity,
  LeavePromotionDeliveryRecipientEntity,
  LeavePolicyEntity,
  LeavePromotionRecipientStatus,
  LeaveRequestEntity,
  NoticeAudience,
  NoticeEntity,
  NoticeNotificationEntity,
  NoticeNotificationState,
  NoticeReadReceiptEntity,
  NoticeStatus,
  RecruitmentOpeningEntity,
  RecruitmentReferralEntity,
  RecruitmentReferralStage,
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
  UpdateOrganizationInput,
  UpdateBenefitCatalogItemInput,
  UpdateBenefitRequestInput,
  UpdateInAppNotificationInput,
  UpdateOnboardingTaskInput,
  UpsertInsuranceEnrollmentInput,
  UpdateLeaveRequestInput,
  UpdateLeavePromotionDeliveryInput,
  UpdateLeavePromotionDeliveryRecipientInput,
  UpdateNoticeInput,
  UpdateNoticeNotificationInput,
  UpdateRecruitmentOpeningInput,
  UpdateRecruitmentReferralInput,
  UpsertLeavePolicyInput,
  UpsertApprovalPolicyInput,
  UpsertNoticeReadReceiptInput,
  UpdatePositionInput,
  UpdatePayrollRunInput,
  PayrollRunEntity,
  WorkScheduleTemplateEntity,
  WorkScheduleEntity,
  CreateLeavePromotionDeliveryInput,
  CreateLeavePromotionDeliveryRecipientInput
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
  approvalStageHistory: Map<string, ApprovalStageHistoryEntity>;
  approvalExecutions: Map<string, ApprovalExecutionEntity>;
  approvalExecutionActions: Map<string, ApprovalExecutionActionEntity>;
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
  leavePromotionDeliveries: Map<string, LeavePromotionDeliveryEntity>;
  leavePromotionDeliveryRecipients: Map<string, LeavePromotionDeliveryRecipientEntity>;
  benefitCatalogItems: Map<string, BenefitCatalogItemEntity>;
  benefitRequests: Map<string, BenefitRequestEntity>;
  onboardingTaskTemplates: Map<string, OnboardingTaskTemplateEntity>;
  onboardingTasks: Map<string, OnboardingTaskEntity>;
  insuranceEnrollments: Map<string, InsuranceEnrollmentEntity>;
  notices: Map<string, NoticeEntity>;
  noticeReadReceipts: Map<string, NoticeReadReceiptEntity>;
  noticeNotifications: Map<string, NoticeNotificationEntity>;
  recruitmentOpenings: Map<string, RecruitmentOpeningEntity>;
  recruitmentReferrals: Map<string, RecruitmentReferralEntity>;
  inAppNotifications: Map<string, InAppNotificationEntity>;
  payroll: Map<string, PayrollRunEntity>;
  deductionProfiles: Map<string, DeductionProfileEntity>;
  audit: AuditLogEntity[];
  contractTemplateVersions: Map<string, ContractTemplateVersionEntity[]>;
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
    approvalStageHistory: new Map<string, ApprovalStageHistoryEntity>(),
    approvalExecutions: new Map<string, ApprovalExecutionEntity>(),
    approvalExecutionActions: new Map<string, ApprovalExecutionActionEntity>(),
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
    leavePromotionDeliveries: new Map<string, LeavePromotionDeliveryEntity>(),
    leavePromotionDeliveryRecipients: new Map<string, LeavePromotionDeliveryRecipientEntity>(),
    benefitCatalogItems: new Map<string, BenefitCatalogItemEntity>(),
    benefitRequests: new Map<string, BenefitRequestEntity>(),
    onboardingTaskTemplates: new Map<string, OnboardingTaskTemplateEntity>(),
    onboardingTasks: new Map<string, OnboardingTaskEntity>(),
    insuranceEnrollments: new Map<string, InsuranceEnrollmentEntity>(),
    notices: new Map<string, NoticeEntity>(),
    noticeReadReceipts: new Map<string, NoticeReadReceiptEntity>(),
    noticeNotifications: new Map<string, NoticeNotificationEntity>(),
    recruitmentOpenings: new Map<string, RecruitmentOpeningEntity>(),
    recruitmentReferrals: new Map<string, RecruitmentReferralEntity>(),
    inAppNotifications: new Map<string, InAppNotificationEntity>(),
    payroll: new Map<string, PayrollRunEntity>(),
    deductionProfiles: new Map<string, DeductionProfileEntity>(),
    audit: [],
    contractTemplateVersions: new Map<string, ContractTemplateVersionEntity[]>()
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

function cloneLeavePromotionDelivery(
  entity: LeavePromotionDeliveryEntity
): LeavePromotionDeliveryEntity {
  return {
    ...entity,
    asOf: cloneDate(entity.asOf),
    dispatchedAt: entity.dispatchedAt ? cloneDate(entity.dispatchedAt) : null,
    createdAt: cloneDate(entity.createdAt),
    updatedAt: cloneDate(entity.updatedAt)
  };
}

function cloneLeavePromotionDeliveryRecipient(
  entity: LeavePromotionDeliveryRecipientEntity
): LeavePromotionDeliveryRecipientEntity {
  return {
    ...entity,
    sentAt: entity.sentAt ? cloneDate(entity.sentAt) : null,
    createdAt: cloneDate(entity.createdAt),
    updatedAt: cloneDate(entity.updatedAt)
  };
}

function cloneNotice(entity: NoticeEntity): NoticeEntity {
  return {
    ...entity,
    targetDepartmentIds: [...entity.targetDepartmentIds],
    publishAt: entity.publishAt ? cloneDate(entity.publishAt) : null,
    publishedAt: entity.publishedAt ? cloneDate(entity.publishedAt) : null,
    createdAt: cloneDate(entity.createdAt),
    updatedAt: cloneDate(entity.updatedAt)
  };
}

function cloneNoticeReadReceipt(entity: NoticeReadReceiptEntity): NoticeReadReceiptEntity {
  return {
    ...entity,
    readAt: cloneDate(entity.readAt),
    createdAt: cloneDate(entity.createdAt),
    updatedAt: cloneDate(entity.updatedAt)
  };
}

function cloneNoticeNotification(entity: NoticeNotificationEntity): NoticeNotificationEntity {
  return {
    ...entity,
    employeeId: entity.employeeId,
    enqueuedAt: cloneDate(entity.enqueuedAt),
    deliveredAt: entity.deliveredAt ? cloneDate(entity.deliveredAt) : null,
    createdAt: cloneDate(entity.createdAt),
    updatedAt: cloneDate(entity.updatedAt)
  };
}

function cloneInAppNotification(entity: InAppNotificationEntity): InAppNotificationEntity {
  return {
    ...entity,
    readAt: entity.readAt
  };
}

function cloneBenefitCatalogItem(entity: BenefitCatalogItemEntity): BenefitCatalogItemEntity {
  return {
    ...entity,
    createdAt: cloneDate(entity.createdAt),
    updatedAt: cloneDate(entity.updatedAt)
  };
}

function cloneBenefitRequest(entity: BenefitRequestEntity): BenefitRequestEntity {
  return {
    ...entity,
    requestedAt: cloneDate(entity.requestedAt),
    reviewedAt: entity.reviewedAt ? cloneDate(entity.reviewedAt) : null,
    createdAt: cloneDate(entity.createdAt),
    updatedAt: cloneDate(entity.updatedAt)
  };
}

function cloneOnboardingTask(entity: OnboardingTaskEntity): OnboardingTaskEntity {
  return {
    ...entity,
    createdAt: cloneDate(entity.createdAt)
  };
}

function cloneOnboardingTaskTemplate(
  entity: OnboardingTaskTemplateEntity
): OnboardingTaskTemplateEntity {
  return {
    ...entity,
    createdAt: cloneDate(entity.createdAt)
  };
}

function listOnboardingTaskTemplatesFromState() {
  const rows = Array.from(state.onboardingTaskTemplates.values()).map(cloneOnboardingTaskTemplate);
  rows.sort((left, right) => {
    const byOrder = left.sortOrder - right.sortOrder;
    if (byOrder !== 0) {
      return byOrder;
    }
    const byCreatedAt = left.createdAt.getTime() - right.createdAt.getTime();
    if (byCreatedAt !== 0) {
      return byCreatedAt;
    }
    return left.id.localeCompare(right.id);
  });
  return rows;
}

const insuranceEnrollmentTypeOrder: Record<InsuranceEnrollmentType, number> = {
  NPS: 0,
  NHI: 1,
  EI: 2,
  WCI: 3
};

function insuranceEnrollmentKey(employeeId: string, type: InsuranceEnrollmentType) {
  return `${employeeId}::${type}`;
}

function cloneInsuranceEnrollment(entity: InsuranceEnrollmentEntity): InsuranceEnrollmentEntity {
  return {
    ...entity,
    enrolledAt: entity.enrolledAt ? cloneDate(entity.enrolledAt) : null,
    updatedAt: cloneDate(entity.updatedAt)
  };
}

function cloneRecruitmentOpening(entity: RecruitmentOpeningEntity): RecruitmentOpeningEntity {
  return {
    ...entity,
    createdAt: cloneDate(entity.createdAt),
    updatedAt: cloneDate(entity.updatedAt)
  };
}

function cloneRecruitmentReferral(entity: RecruitmentReferralEntity): RecruitmentReferralEntity {
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
    payslipDistributedAt: entity.payslipDistributedAt ? cloneDate(entity.payslipDistributedAt) : null,
    payslipReceiptConfirmedAt: entity.payslipReceiptConfirmedAt
      ? cloneDate(entity.payslipReceiptConfirmedAt)
      : null,
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

function cloneContractTemplateVersion(
  entity: ContractTemplateVersionEntity
): ContractTemplateVersionEntity {
  return {
    ...entity,
    modifiedAt: cloneDate(entity.modifiedAt)
  };
}

function cloneOrganization(entity: OrganizationEntity): OrganizationEntity {
  return {
    ...entity,
    workDays: [...entity.workDays],
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
    approvalStages: entity.approvalStages.map((stage) => ({
      stageIndex: stage.stageIndex,
      label: stage.label,
      approverRoles: [...stage.approverRoles],
      minApprovals: stage.minApprovals
    })),
    createdAt: cloneDate(entity.createdAt),
    updatedAt: cloneDate(entity.updatedAt)
  };
}

function cloneApprovalStageHistory(entity: ApprovalStageHistoryEntity): ApprovalStageHistoryEntity {
  return {
    ...entity,
    requiredRoles: [...entity.requiredRoles],
    matchedTemplateIds: [...entity.matchedTemplateIds],
    activeDelegationIds: [...entity.activeDelegationIds],
    evaluatedAt: cloneDate(entity.evaluatedAt)
  };
}

function cloneApprovalExecution(entity: ApprovalExecutionEntity): ApprovalExecutionEntity {
  return {
    ...entity,
    startedAt: cloneDate(entity.startedAt),
    completedAt: entity.completedAt ? cloneDate(entity.completedAt) : null,
    createdAt: cloneDate(entity.createdAt),
    updatedAt: cloneDate(entity.updatedAt)
  };
}

function cloneApprovalExecutionAction(entity: ApprovalExecutionActionEntity): ApprovalExecutionActionEntity {
  return {
    ...entity,
    createdAt: cloneDate(entity.createdAt)
  };
}

function cloneEmployee(entity: EmployeeEntity): EmployeeEntity {
  const status = entity.status;
  return {
    ...entity,
    status,
    active: status === "ACTIVE",
    createdAt: cloneDate(entity.createdAt),
    updatedAt: cloneDate(entity.updatedAt)
  };
}

function mapLegacyActiveToEmployeeStatus(active: boolean): EmployeeStatus {
  return active ? "ACTIVE" : "ON_LEAVE";
}

function resolveEmployeeStatusInput(input: {
  status?: EmployeeStatus;
  active?: boolean;
}): EmployeeStatus | undefined {
  if (input.status !== undefined) {
    return input.status;
  }
  if (input.active !== undefined) {
    return mapLegacyActiveToEmployeeStatus(input.active);
  }
  return undefined;
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
    anomalyType: input.anomalyType !== undefined ? input.anomalyType ?? undefined : existing.anomalyType,
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

function updateNoticeEntity(existing: NoticeEntity, input: UpdateNoticeInput): NoticeEntity {
  return {
    ...existing,
    title: input.title !== undefined ? input.title : existing.title,
    body: input.body !== undefined ? input.body : existing.body,
    audience: input.audience !== undefined ? input.audience : existing.audience,
    targetDepartmentIds:
      input.targetDepartmentIds !== undefined
        ? [...input.targetDepartmentIds]
        : existing.targetDepartmentIds,
    status: input.status !== undefined ? input.status : existing.status,
    publishAt: input.publishAt !== undefined ? input.publishAt : existing.publishAt,
    publishedAt: input.publishedAt !== undefined ? input.publishedAt : existing.publishedAt,
    updatedAt: input.updatedAt !== undefined ? input.updatedAt : new Date()
  };
}

function updatePayrollEntity(existing: PayrollRunEntity, input: UpdatePayrollRunInput): PayrollRunEntity {
  return {
    ...existing,
    state: input.state ?? existing.state,
    payslipDeliveryChannel:
      input.payslipDeliveryChannel !== undefined
        ? input.payslipDeliveryChannel
        : existing.payslipDeliveryChannel,
    payslipDistributedAt:
      input.payslipDistributedAt !== undefined
        ? input.payslipDistributedAt
        : existing.payslipDistributedAt,
    payslipDistributedBy:
      input.payslipDistributedBy !== undefined
        ? input.payslipDistributedBy
        : existing.payslipDistributedBy,
    payslipReceiptConfirmedAt:
      input.payslipReceiptConfirmedAt !== undefined
        ? input.payslipReceiptConfirmedAt
        : existing.payslipReceiptConfirmedAt,
    payslipReceiptConfirmedBy:
      input.payslipReceiptConfirmedBy !== undefined
        ? input.payslipReceiptConfirmedBy
        : existing.payslipReceiptConfirmedBy,
    confirmedAt: input.confirmedAt !== undefined ? input.confirmedAt : existing.confirmedAt,
    confirmedBy: input.confirmedBy !== undefined ? input.confirmedBy : existing.confirmedBy,
    updatedAt: new Date()
  };
}

function updateEmployeeEntity(existing: EmployeeEntity, input: UpdateEmployeeInput): EmployeeEntity {
  const status = resolveEmployeeStatusInput(input) ?? existing.status;
  return {
    ...existing,
    organizationId: input.organizationId !== undefined ? input.organizationId : existing.organizationId,
    departmentId: input.departmentId !== undefined ? input.departmentId : existing.departmentId,
    positionId: input.positionId !== undefined ? input.positionId : existing.positionId,
    name: input.name !== undefined ? input.name : existing.name,
    email: input.email !== undefined ? input.email : existing.email,
    phone: input.phone !== undefined ? input.phone : existing.phone,
    address: input.address !== undefined ? input.address : existing.address,
    notificationEmailEnabled:
      input.notificationEmailEnabled !== undefined
        ? input.notificationEmailEnabled
        : existing.notificationEmailEnabled,
    notificationInAppEnabled:
      input.notificationInAppEnabled !== undefined
        ? input.notificationInAppEnabled
        : existing.notificationInAppEnabled,
    notificationLeaveEnabled:
      input.notificationLeaveEnabled !== undefined
        ? input.notificationLeaveEnabled
        : existing.notificationLeaveEnabled,
    notificationAttendanceEnabled:
      input.notificationAttendanceEnabled !== undefined
        ? input.notificationAttendanceEnabled
        : existing.notificationAttendanceEnabled,
    notificationPayrollEnabled:
      input.notificationPayrollEnabled !== undefined
        ? input.notificationPayrollEnabled
        : existing.notificationPayrollEnabled,
    status,
    active: status === "ACTIVE",
    updatedAt: new Date()
  };
}

function updateOrganizationEntity(
  existing: OrganizationEntity,
  input: UpdateOrganizationInput
): OrganizationEntity {
  const fiscalYearStartMonthFromLegacy =
    input.fiscalYearStart !== undefined
      ? (() => {
          const parsedMonth = Number.parseInt(input.fiscalYearStart.slice(0, 2), 10);
          if (!Number.isInteger(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
            return undefined;
          }
          return parsedMonth;
        })()
      : undefined;
  const fiscalYearStartMonth =
    input.fiscalYearStartMonth !== undefined
      ? input.fiscalYearStartMonth
      : fiscalYearStartMonthFromLegacy !== undefined
        ? fiscalYearStartMonthFromLegacy
        : existing.fiscalYearStartMonth;
  const fiscalYearStart =
    input.fiscalYearStart !== undefined
      ? input.fiscalYearStart
      : input.fiscalYearStartMonth !== undefined
        ? `${String(input.fiscalYearStartMonth).padStart(2, "0")}-01`
        : existing.fiscalYearStart;
  const standardWorkHoursPerDay =
    input.standardWorkHoursPerDay !== undefined
      ? input.standardWorkHoursPerDay
      : input.workHoursPerDay !== undefined
        ? input.workHoursPerDay
        : existing.standardWorkHoursPerDay;
  const workHoursPerDay =
    input.workHoursPerDay !== undefined
      ? input.workHoursPerDay
      : input.standardWorkHoursPerDay !== undefined
        ? input.standardWorkHoursPerDay
        : existing.workHoursPerDay;
  const overtimeThresholdHours =
    input.overtimeThresholdHours !== undefined
      ? input.overtimeThresholdHours
      : input.overtimeThreshold !== undefined
        ? input.overtimeThreshold
        : existing.overtimeThresholdHours;
  const overtimeThreshold =
    input.overtimeThreshold !== undefined
      ? input.overtimeThreshold
      : input.overtimeThresholdHours !== undefined
        ? input.overtimeThresholdHours
        : existing.overtimeThreshold;
  return {
    ...existing,
    name: input.name !== undefined ? input.name : existing.name,
    businessRegistrationNumber:
      input.businessRegistrationNumber !== undefined
        ? input.businessRegistrationNumber
        : existing.businessRegistrationNumber,
    fiscalYearStart,
    fiscalYearStartMonth,
    workHoursPerDay,
    standardWorkHoursPerDay,
    standardWorkDaysPerWeek:
      input.standardWorkDaysPerWeek !== undefined
        ? input.standardWorkDaysPerWeek
        : existing.standardWorkDaysPerWeek,
    overtimeThreshold,
    overtimeThresholdHours,
    payPeriod: input.payPeriod !== undefined ? input.payPeriod : existing.payPeriod,
    industry: input.industry !== undefined ? input.industry : existing.industry,
    representativeName:
      input.representativeName !== undefined ? input.representativeName : existing.representativeName,
    workStartTime: input.workStartTime !== undefined ? input.workStartTime : existing.workStartTime,
    workEndTime: input.workEndTime !== undefined ? input.workEndTime : existing.workEndTime,
    workDays: input.workDays !== undefined ? [...input.workDays] : [...existing.workDays],
    timezone: input.timezone !== undefined ? input.timezone : existing.timezone,
    currency: input.currency !== undefined ? input.currency : existing.currency,
    insuranceRateNps:
      input.insuranceRateNps !== undefined ? input.insuranceRateNps : existing.insuranceRateNps,
    insuranceRateNhi:
      input.insuranceRateNhi !== undefined ? input.insuranceRateNhi : existing.insuranceRateNhi,
    insuranceRateEi:
      input.insuranceRateEi !== undefined ? input.insuranceRateEi : existing.insuranceRateEi,
    insuranceRateWci:
      input.insuranceRateWci !== undefined ? input.insuranceRateWci : existing.insuranceRateWci,
    attendanceGpsRequired:
      input.attendanceGpsRequired !== undefined
        ? input.attendanceGpsRequired
        : existing.attendanceGpsRequired,
    attendanceGeofenceEnabled:
      input.attendanceGeofenceEnabled !== undefined
        ? input.attendanceGeofenceEnabled
        : existing.attendanceGeofenceEnabled,
    attendanceGeofenceLatitude:
      input.attendanceGeofenceLatitude !== undefined
        ? input.attendanceGeofenceLatitude
        : existing.attendanceGeofenceLatitude,
    attendanceGeofenceLongitude:
      input.attendanceGeofenceLongitude !== undefined
        ? input.attendanceGeofenceLongitude
        : existing.attendanceGeofenceLongitude,
    attendanceGeofenceRadiusMeters:
      input.attendanceGeofenceRadiusMeters !== undefined
        ? input.attendanceGeofenceRadiusMeters
        : existing.attendanceGeofenceRadiusMeters,
    notificationDefaultEmailEnabled:
      input.notificationDefaultEmailEnabled !== undefined
        ? input.notificationDefaultEmailEnabled
        : existing.notificationDefaultEmailEnabled,
    notificationDefaultInAppEnabled:
      input.notificationDefaultInAppEnabled !== undefined
        ? input.notificationDefaultInAppEnabled
        : existing.notificationDefaultInAppEnabled,
    notificationDefaultLeaveEnabled:
      input.notificationDefaultLeaveEnabled !== undefined
        ? input.notificationDefaultLeaveEnabled
        : existing.notificationDefaultLeaveEnabled,
    notificationDefaultAttendanceEnabled:
      input.notificationDefaultAttendanceEnabled !== undefined
        ? input.notificationDefaultAttendanceEnabled
        : existing.notificationDefaultAttendanceEnabled,
    notificationDefaultPayrollEnabled:
      input.notificationDefaultPayrollEnabled !== undefined
        ? input.notificationDefaultPayrollEnabled
        : existing.notificationDefaultPayrollEnabled,
    operatorAlertWebhookUrl:
      input.operatorAlertWebhookUrl !== undefined
        ? input.operatorAlertWebhookUrl
        : existing.operatorAlertWebhookUrl,
    operatorAlertWebhookProvider:
      input.operatorAlertWebhookProvider !== undefined
        ? input.operatorAlertWebhookProvider
        : existing.operatorAlertWebhookProvider,
    approvalEscalationUseOperatorAlertWebhook:
      input.approvalEscalationUseOperatorAlertWebhook !== undefined
        ? input.approvalEscalationUseOperatorAlertWebhook
        : existing.approvalEscalationUseOperatorAlertWebhook,
    leavePromotionUseOperatorAlertWebhook:
      input.leavePromotionUseOperatorAlertWebhook !== undefined
        ? input.leavePromotionUseOperatorAlertWebhook
        : existing.leavePromotionUseOperatorAlertWebhook,
    leavePromotionEmailTemplateUrl:
      input.leavePromotionEmailTemplateUrl !== undefined
        ? input.leavePromotionEmailTemplateUrl
        : existing.leavePromotionEmailTemplateUrl,
    leavePromotionEmailFrom:
      input.leavePromotionEmailFrom !== undefined
        ? input.leavePromotionEmailFrom
        : existing.leavePromotionEmailFrom,
    leavePromotionEmailTemplateToken:
      input.leavePromotionEmailTemplateToken !== undefined
        ? input.leavePromotionEmailTemplateToken
        : existing.leavePromotionEmailTemplateToken,
    leavePromotionEmailTemplateId:
      input.leavePromotionEmailTemplateId !== undefined
        ? input.leavePromotionEmailTemplateId
        : existing.leavePromotionEmailTemplateId,
    isOnboardingComplete:
      input.isOnboardingComplete !== undefined
        ? input.isOnboardingComplete
        : existing.isOnboardingComplete,
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
    parentId: input.parentId !== undefined ? input.parentId : existing.parentId,
    managerId: input.managerId !== undefined ? input.managerId : existing.managerId,
    updatedAt: new Date()
  };
}

function updatePositionEntity(existing: PositionEntity, input: UpdatePositionInput): PositionEntity {
  return {
    ...existing,
    code: input.code ?? existing.code,
    name: input.name ?? existing.name,
    title: input.title ?? existing.title,
    grade: input.grade !== undefined ? input.grade : existing.grade,
    description: input.description !== undefined ? input.description : existing.description,
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
  const approvalStages: ApprovalTemplateStageEntity[] =
    input.approvalStages !== undefined
      ? input.approvalStages.map((stage) => ({
          stageIndex: stage.stageIndex,
          label: stage.label,
          approverRoles: [...stage.approverRoles],
          minApprovals: stage.minApprovals
        }))
      : existing.approvalStages.map((stage) => ({
          stageIndex: stage.stageIndex,
          label: stage.label,
          approverRoles: [...stage.approverRoles],
          minApprovals: stage.minApprovals
        }));
  return {
    ...existing,
    name: input.name !== undefined ? input.name : existing.name,
    domain: input.domain !== undefined ? input.domain : existing.domain,
    approverRoles:
      input.approverRoles !== undefined ? [...input.approverRoles] : [...existing.approverRoles],
    approvalStages,
    payrollGrossPayMinKrw:
      input.payrollGrossPayMinKrw !== undefined
        ? input.payrollGrossPayMinKrw
        : existing.payrollGrossPayMinKrw,
    payrollGrossPayMaxKrw:
      input.payrollGrossPayMaxKrw !== undefined
        ? input.payrollGrossPayMaxKrw
        : existing.payrollGrossPayMaxKrw,
    active: input.active !== undefined ? input.active : existing.active,
    updatedAt: new Date()
  };
}

function updateApprovalExecutionEntity(
  existing: ApprovalExecutionEntity,
  input: UpdateApprovalExecutionInput
): ApprovalExecutionEntity {
  return {
    ...existing,
    templateId: input.templateId !== undefined ? input.templateId : existing.templateId,
    state: input.state !== undefined ? input.state : existing.state,
    totalStages: input.totalStages !== undefined ? input.totalStages : existing.totalStages,
    currentStageIndex:
      input.currentStageIndex !== undefined ? input.currentStageIndex : existing.currentStageIndex,
    completedAt: input.completedAt !== undefined ? input.completedAt : existing.completedAt,
    updatedAt: new Date()
  };
}

export const memoryDataAccess: DataAccess = {
  organizations: {
    async create(input: CreateOrganizationInput) {
      const now = new Date();
      const entity: OrganizationEntity = {
        id: input.id ?? nextId("ORG"),
        name: input.name,
        businessRegistrationNumber: null,
        fiscalYearStart: "01-01",
        fiscalYearStartMonth: 1,
        workHoursPerDay: 8,
        standardWorkHoursPerDay: 8,
        standardWorkDaysPerWeek: 5,
        overtimeThreshold: 8,
        overtimeThresholdHours: 8,
        payPeriod: "MONTHLY",
        industry: null,
        representativeName: null,
        workStartTime: null,
        workEndTime: null,
        workDays: [],
        timezone: null,
        currency: "KRW",
        insuranceRateNps: null,
        insuranceRateNhi: null,
        insuranceRateEi: null,
        insuranceRateWci: null,
        attendanceGpsRequired: false,
        attendanceGeofenceEnabled: false,
        attendanceGeofenceLatitude: null,
        attendanceGeofenceLongitude: null,
        attendanceGeofenceRadiusMeters: null,
        notificationDefaultEmailEnabled: true,
        notificationDefaultInAppEnabled: true,
        notificationDefaultLeaveEnabled: true,
        notificationDefaultAttendanceEnabled: true,
        notificationDefaultPayrollEnabled: true,
        operatorAlertWebhookUrl: null,
        operatorAlertWebhookProvider: null,
        approvalEscalationUseOperatorAlertWebhook: true,
        leavePromotionUseOperatorAlertWebhook: true,
        leavePromotionEmailTemplateUrl: null,
        leavePromotionEmailFrom: null,
        leavePromotionEmailTemplateToken: null,
        leavePromotionEmailTemplateId: null,
        isOnboardingComplete: false,
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

    async update(id: string, input: UpdateOrganizationInput) {
      const existing = state.organizations.get(id);
      if (!existing) {
        throw new Error(`organization not found: ${id}`);
      }
      const updated = updateOrganizationEntity(existing, input);
      state.organizations.set(id, updated);
      return cloneOrganization(updated);
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
        parentId: input.parentId === undefined ? null : input.parentId,
        managerId: input.managerId === undefined ? null : input.managerId,
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

    async delete(id: string) {
      const existing = state.departments.get(id);
      if (!existing) {
        throw new Error(`department not found: ${id}`);
      }
      state.departments.delete(id);
      for (const [departmentId, department] of state.departments.entries()) {
        if (department.parentId !== id) {
          continue;
        }
        state.departments.set(departmentId, {
          ...department,
          parentId: null,
          updatedAt: new Date()
        });
      }
      return cloneDepartment(existing);
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
        title: input.title ?? input.name,
        grade: input.grade ?? null,
        description: input.description ?? null,
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

    async delete(id: string) {
      const existing = state.positions.get(id);
      if (!existing) {
        throw new Error(`position not found: ${id}`);
      }
      state.positions.delete(id);
      return clonePosition(existing);
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
      const approvalStages =
        input.approvalStages && input.approvalStages.length > 0
          ? input.approvalStages.map((stage) => ({
              stageIndex: stage.stageIndex,
              label: stage.label,
              approverRoles: [...stage.approverRoles],
              minApprovals: stage.minApprovals
            }))
          : [
              {
                stageIndex: 1,
                label: "stage-1",
                approverRoles: [...input.approverRoles],
                minApprovals: 1
              }
            ];
      const entity: ApprovalLineTemplateEntity = {
        id: nextId("ATPL"),
        organizationId: input.organizationId,
        name: input.name,
        domain: input.domain,
        approverRoles: [...input.approverRoles],
        approvalStages,
        payrollGrossPayMinKrw:
          input.payrollGrossPayMinKrw === undefined ? null : input.payrollGrossPayMinKrw,
        payrollGrossPayMaxKrw:
          input.payrollGrossPayMaxKrw === undefined ? null : input.payrollGrossPayMaxKrw,
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
    },

    async appendStageHistory(input: CreateApprovalStageHistoryInput) {
      const entity: ApprovalStageHistoryEntity = {
        id: nextId("ASH"),
        organizationId: input.organizationId,
        domain: input.domain,
        targetEntityType: input.targetEntityType,
        targetEntityId: input.targetEntityId,
        stageIndex: input.stageIndex ?? 1,
        stageLabel: input.stageLabel ?? "policy-gate",
        requiredRoles: [...input.requiredRoles],
        fallbackRole: input.fallbackRole,
        matchedTemplateIds: [...(input.matchedTemplateIds ?? [])],
        activeDelegationIds: [...(input.activeDelegationIds ?? [])],
        actorRole: input.actorRole,
        actorId: input.actorId ?? null,
        allowed: input.allowed,
        resolution: input.resolution,
        payrollGrossPayKrw: input.payrollGrossPayKrw ?? null,
        evaluatedAt: input.evaluatedAt ? cloneDate(input.evaluatedAt) : new Date()
      };
      state.approvalStageHistory.set(entity.id, entity);
      return cloneApprovalStageHistory(entity);
    },

    async listStageHistory(input: {
      organizationId: string;
      domain?: ApprovalDomain;
      targetEntityType?: string;
      targetEntityId?: string;
      allowed?: boolean;
      resolution?: "EXPECTED_ROLE" | "ACTIVE_DELEGATION" | "PRIVILEGED_BYPASS" | "DENIED";
      from?: Date;
      to?: Date;
      limit?: number;
    }) {
      const rows: ApprovalStageHistoryEntity[] = [];
      for (const entity of state.approvalStageHistory.values()) {
        if (entity.organizationId !== input.organizationId) {
          continue;
        }
        if (input.domain && entity.domain !== input.domain) {
          continue;
        }
        if (input.targetEntityType && entity.targetEntityType !== input.targetEntityType) {
          continue;
        }
        if (input.targetEntityId && entity.targetEntityId !== input.targetEntityId) {
          continue;
        }
        if (input.allowed !== undefined && entity.allowed !== input.allowed) {
          continue;
        }
        if (input.resolution && entity.resolution !== input.resolution) {
          continue;
        }
        if (input.from && entity.evaluatedAt < input.from) {
          continue;
        }
        if (input.to && entity.evaluatedAt > input.to) {
          continue;
        }
        rows.push(cloneApprovalStageHistory(entity));
      }
      rows.sort((left, right) => {
        const byEvaluatedAt = right.evaluatedAt.getTime() - left.evaluatedAt.getTime();
        if (byEvaluatedAt !== 0) {
          return byEvaluatedAt;
        }
        return right.id.localeCompare(left.id);
      });
      if (input.limit !== undefined && input.limit > 0) {
        return rows.slice(0, input.limit);
      }
      return rows;
    },

    async findExecutionByTarget(input: {
      organizationId: string;
      domain: ApprovalDomain;
      targetEntityType: string;
      targetEntityId: string;
    }) {
      for (const entity of state.approvalExecutions.values()) {
        if (entity.organizationId !== input.organizationId) {
          continue;
        }
        if (entity.domain !== input.domain) {
          continue;
        }
        if (entity.targetEntityType !== input.targetEntityType) {
          continue;
        }
        if (entity.targetEntityId !== input.targetEntityId) {
          continue;
        }
        return cloneApprovalExecution(entity);
      }
      return null;
    },

    async createExecution(input: CreateApprovalExecutionInput) {
      const now = new Date();
      const entity: ApprovalExecutionEntity = {
        id: nextId("AEX"),
        organizationId: input.organizationId,
        domain: input.domain,
        targetEntityType: input.targetEntityType,
        targetEntityId: input.targetEntityId,
        templateId: input.templateId ?? null,
        state: input.state ?? "PENDING",
        totalStages: input.totalStages,
        currentStageIndex: input.currentStageIndex ?? 1,
        startedAt: input.startedAt ? cloneDate(input.startedAt) : now,
        completedAt:
          input.completedAt === undefined
            ? null
            : input.completedAt === null
              ? null
              : cloneDate(input.completedAt),
        createdAt: now,
        updatedAt: now
      };
      state.approvalExecutions.set(entity.id, entity);
      return cloneApprovalExecution(entity);
    },

    async updateExecution(id: string, input: UpdateApprovalExecutionInput) {
      const existing = state.approvalExecutions.get(id);
      if (!existing) {
        throw new Error(`approval execution not found: ${id}`);
      }
      const updated = updateApprovalExecutionEntity(existing, input);
      state.approvalExecutions.set(id, updated);
      return cloneApprovalExecution(updated);
    },

    async listExecutions(input: {
      organizationId: string;
      domain?: ApprovalDomain;
      targetEntityType?: string;
      targetEntityId?: string;
      state?: ApprovalExecutionState;
      limit?: number;
    }) {
      const rows: ApprovalExecutionEntity[] = [];
      for (const entity of state.approvalExecutions.values()) {
        if (entity.organizationId !== input.organizationId) {
          continue;
        }
        if (input.domain && entity.domain !== input.domain) {
          continue;
        }
        if (input.targetEntityType && entity.targetEntityType !== input.targetEntityType) {
          continue;
        }
        if (input.targetEntityId && entity.targetEntityId !== input.targetEntityId) {
          continue;
        }
        if (input.state && entity.state !== input.state) {
          continue;
        }
        rows.push(cloneApprovalExecution(entity));
      }
      rows.sort((left, right) => {
        const byUpdatedAt = right.updatedAt.getTime() - left.updatedAt.getTime();
        if (byUpdatedAt !== 0) {
          return byUpdatedAt;
        }
        return right.id.localeCompare(left.id);
      });
      if (input.limit !== undefined && input.limit > 0) {
        return rows.slice(0, input.limit);
      }
      return rows;
    },

    async appendExecutionAction(input: CreateApprovalExecutionActionInput) {
      const entity: ApprovalExecutionActionEntity = {
        id: nextId("AEXA"),
        executionId: input.executionId,
        stageIndex: input.stageIndex,
        action: input.action,
        actorRole: input.actorRole,
        actorId: input.actorId ?? null,
        resolution: input.resolution,
        createdAt: input.createdAt ? cloneDate(input.createdAt) : new Date()
      };
      state.approvalExecutionActions.set(entity.id, entity);
      return cloneApprovalExecutionAction(entity);
    },

    async listExecutionActions(input: {
      executionId: string;
      stageIndex?: number;
      action?: ApprovalExecutionActionType;
      actorId?: string | null;
    }) {
      const rows: ApprovalExecutionActionEntity[] = [];
      for (const entity of state.approvalExecutionActions.values()) {
        if (entity.executionId !== input.executionId) {
          continue;
        }
        if (input.stageIndex !== undefined && entity.stageIndex !== input.stageIndex) {
          continue;
        }
        if (input.action !== undefined && entity.action !== input.action) {
          continue;
        }
        if (input.actorId !== undefined && entity.actorId !== input.actorId) {
          continue;
        }
        rows.push(cloneApprovalExecutionAction(entity));
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
      const status = resolveEmployeeStatusInput(input) ?? "ACTIVE";
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
        phone: input.phone,
        address: input.address,
        status,
        notificationEmailEnabled: input.notificationEmailEnabled === undefined ? null : input.notificationEmailEnabled,
        notificationInAppEnabled: input.notificationInAppEnabled === undefined ? null : input.notificationInAppEnabled,
        notificationLeaveEnabled: input.notificationLeaveEnabled === undefined ? null : input.notificationLeaveEnabled,
        notificationAttendanceEnabled:
          input.notificationAttendanceEnabled === undefined ? null : input.notificationAttendanceEnabled,
        notificationPayrollEnabled:
          input.notificationPayrollEnabled === undefined ? null : input.notificationPayrollEnabled,
        active: status === "ACTIVE",
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
        if (input.status !== undefined && entity.status !== input.status) {
          continue;
        }
        if (input.active !== undefined && (entity.status === "ACTIVE") !== input.active) {
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
        anomalyType: input.anomalyType,
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

    async findByIdInOrganization(id, organizationId) {
      const found = state.attendance.get(id);
      if (!found) {
        return null;
      }
      const employee = state.employees.get(found.employeeId);
      if (!employee || employee.organizationId !== organizationId) {
        return null;
      }
      return cloneAttendance(found);
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

    async delete(id) {
      const existing = state.attendance.get(id);
      if (!existing) {
        throw new Error(`attendance record not found: ${id}`);
      }
      state.attendance.delete(id);
      return cloneAttendance(existing);
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
    },

    async listOpenRecordsNeedingAutoClose(input) {
      const rows: AttendanceRecordEntity[] = [];
      for (const entity of state.attendance.values()) {
        if (entity.checkOutAt !== null) {
          continue;
        }
        if (entity.checkInAt > input.clockInBefore) {
          continue;
        }
        if (input.organizationId) {
          const employee = state.employees.get(entity.employeeId);
          if (!employee || employee.organizationId !== input.organizationId) {
            continue;
          }
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
        policyId: input.policyId === undefined ? null : input.policyId,
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
    async findById(id: string) {
      const existing = state.leavePolicies.get(id);
      return existing ? cloneLeavePolicy(existing) : null;
    },

    async list(input: {
      organizationId: string;
      status?: "ACTIVE" | "ARCHIVED";
      isStatutory?: boolean;
    }) {
      const rows: LeavePolicyEntity[] = [];
      for (const policy of state.leavePolicies.values()) {
        if (policy.organizationId !== input.organizationId) {
          continue;
        }
        if (input.status && policy.status !== input.status) {
          continue;
        }
        if (input.isStatutory !== undefined && policy.isStatutory !== input.isStatutory) {
          continue;
        }
        rows.push(cloneLeavePolicy(policy));
      }
      rows.sort((left, right) => {
        if (left.isStatutory !== right.isStatutory) {
          return left.isStatutory ? -1 : 1;
        }
        const byUpdatedAt = right.updatedAt.getTime() - left.updatedAt.getTime();
        if (byUpdatedAt !== 0) {
          return byUpdatedAt;
        }
        return right.id.localeCompare(left.id);
      });
      return rows;
    },

    async findByOrganizationId(organizationId: string) {
      const active = await this.list({
        organizationId,
        status: "ACTIVE"
      });
      const configured = active.find((policy) => !policy.isStatutory) ?? null;
      return configured ?? active[0] ?? null;
    },

    async upsertForOrganization(input: UpsertLeavePolicyInput) {
      const now = new Date();
      const existing = (
        await this.list({
          organizationId: input.organizationId,
          status: "ACTIVE",
          isStatutory: false
        })
      )[0];
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
            minNoticeDays: input.minNoticeDays ?? existing.minNoticeDays,
            maxConsecutiveDays:
              input.maxConsecutiveDays !== undefined
                ? input.maxConsecutiveDays
                : existing.maxConsecutiveDays,
            annualLeavePromotionEnabled:
              input.annualLeavePromotionEnabled ?? existing.annualLeavePromotionEnabled,
            annualLeavePromotionThresholdDays:
              input.annualLeavePromotionThresholdDays ??
              existing.annualLeavePromotionThresholdDays,
            annualLeavePromotionLeadDays:
              input.annualLeavePromotionLeadDays ?? existing.annualLeavePromotionLeadDays,
            annualLeavePromotionMessageTemplate:
              input.annualLeavePromotionMessageTemplate !== undefined
                ? input.annualLeavePromotionMessageTemplate
                : existing.annualLeavePromotionMessageTemplate,
            updatedAt: now
          }
        : {
            id: nextId("LP"),
            organizationId: input.organizationId,
            name: "Default Leave Policy",
            isStatutory: false,
            status: "ACTIVE",
            annualGrantDays: input.annualGrantDays,
            carryOverCapDays: input.carryOverCapDays,
            allowHalfDay: input.allowHalfDay ?? true,
            allowHourly: input.allowHourly ?? true,
            hourlyIncrementMinutes: input.hourlyIncrementMinutes ?? 30,
            maxHoursPerRequest: input.maxHoursPerRequest ?? 8,
            minNoticeDays: input.minNoticeDays ?? 0,
            maxConsecutiveDays: input.maxConsecutiveDays ?? null,
            annualLeavePromotionEnabled: input.annualLeavePromotionEnabled ?? false,
            annualLeavePromotionThresholdDays: input.annualLeavePromotionThresholdDays ?? 5,
            annualLeavePromotionLeadDays: input.annualLeavePromotionLeadDays ?? 30,
            annualLeavePromotionMessageTemplate: input.annualLeavePromotionMessageTemplate ?? null,
            createdAt: now,
            updatedAt: now
          };
      state.leavePolicies.set(next.id, next);
      return cloneLeavePolicy(next);
    },

    async create(input: CreateLeavePolicyInput) {
      const now = new Date();
      const normalizedName = input.name.trim();
      const policy: LeavePolicyEntity = {
        id: nextId("LP"),
        organizationId: input.organizationId,
        name: normalizedName.length > 0 ? normalizedName : "Default Leave Policy",
        isStatutory: input.isStatutory ?? false,
        status: input.status ?? "ACTIVE",
        annualGrantDays: input.annualGrantDays ?? 15,
        carryOverCapDays: input.carryOverCapDays ?? 5,
        allowHalfDay: input.allowHalfDay ?? true,
        allowHourly: input.allowHourly ?? true,
        hourlyIncrementMinutes: input.hourlyIncrementMinutes ?? 30,
        maxHoursPerRequest: input.maxHoursPerRequest ?? 8,
        minNoticeDays: input.minNoticeDays ?? 0,
        maxConsecutiveDays:
          input.maxConsecutiveDays === undefined ? null : input.maxConsecutiveDays,
        annualLeavePromotionEnabled: input.annualLeavePromotionEnabled ?? false,
        annualLeavePromotionThresholdDays: input.annualLeavePromotionThresholdDays ?? 5,
        annualLeavePromotionLeadDays: input.annualLeavePromotionLeadDays ?? 30,
        annualLeavePromotionMessageTemplate: input.annualLeavePromotionMessageTemplate ?? null,
        createdAt: now,
        updatedAt: now
      };
      state.leavePolicies.set(policy.id, policy);
      return cloneLeavePolicy(policy);
    },

    async archive(id: string) {
      const existing = state.leavePolicies.get(id);
      if (!existing) {
        throw new Error(`leave policy not found: ${id}`);
      }
      const updated: LeavePolicyEntity = {
        ...existing,
        status: "ARCHIVED",
        updatedAt: new Date()
      };
      state.leavePolicies.set(id, updated);
      return cloneLeavePolicy(updated);
    },

    async countUsage(policyId: string) {
      let count = 0;
      for (const request of state.leaveRequests.values()) {
        if (request.policyId === policyId) {
          count += 1;
        }
      }
      return count;
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

  leavePromotionDeliveries: {
    async create(input: CreateLeavePromotionDeliveryInput) {
      const now = new Date();
      const delivery: LeavePromotionDeliveryEntity = {
        id: nextId("LPD"),
        organizationId: input.organizationId,
        asOf: cloneDate(input.asOf),
        includeUpcoming: input.includeUpcoming,
        dryRun: input.dryRun,
        channel: input.channel,
        provider: input.provider ?? null,
        status: input.status,
        announcementTitle: input.announcementTitle,
        announcementBody: input.announcementBody,
        targetCount: input.targetCount,
        recipientCount: input.recipientCount,
        missingEmailCount: input.missingEmailCount,
        sentTargetCount: input.sentTargetCount,
        webhookSource: input.webhookSource ?? null,
        emailTemplateSource: input.emailTemplateSource ?? null,
        emailTemplateId: input.emailTemplateId ?? null,
        dispatchedAt: input.dispatchedAt ? cloneDate(input.dispatchedAt) : null,
        requestedByActorRole: input.requestedByActorRole,
        requestedByActorId: input.requestedByActorId ?? null,
        retryOfDeliveryId: input.retryOfDeliveryId ?? null,
        createdAt: now,
        updatedAt: now
      };
      state.leavePromotionDeliveries.set(delivery.id, delivery);
      return cloneLeavePromotionDelivery(delivery);
    },

    async findById(id: string) {
      const delivery = state.leavePromotionDeliveries.get(id);
      return delivery ? cloneLeavePromotionDelivery(delivery) : null;
    },

    async update(id: string, input: UpdateLeavePromotionDeliveryInput) {
      const existing = state.leavePromotionDeliveries.get(id);
      if (!existing) {
        throw new Error(`leave promotion delivery not found: ${id}`);
      }
      const updated: LeavePromotionDeliveryEntity = {
        ...existing,
        provider: input.provider !== undefined ? input.provider : existing.provider,
        status: input.status ?? existing.status,
        sentTargetCount:
          input.sentTargetCount !== undefined ? input.sentTargetCount : existing.sentTargetCount,
        dispatchedAt:
          input.dispatchedAt !== undefined
            ? (input.dispatchedAt ? cloneDate(input.dispatchedAt) : null)
            : existing.dispatchedAt,
        webhookSource:
          input.webhookSource !== undefined ? input.webhookSource : existing.webhookSource,
        emailTemplateSource:
          input.emailTemplateSource !== undefined
            ? input.emailTemplateSource
            : existing.emailTemplateSource,
        emailTemplateId:
          input.emailTemplateId !== undefined ? input.emailTemplateId : existing.emailTemplateId,
        updatedAt: new Date()
      };
      state.leavePromotionDeliveries.set(id, updated);
      return cloneLeavePromotionDelivery(updated);
    },

    async list(input: {
      organizationId: string;
      channel?: "webhook" | "email_template";
      status?: "dry_run" | "skipped_no_targets" | "dispatched" | "failed";
      retryOfDeliveryId?: string;
      limit?: number;
    }) {
      const rows: LeavePromotionDeliveryEntity[] = [];
      const limit = input.limit && input.limit > 0 ? input.limit : 100;
      for (const delivery of state.leavePromotionDeliveries.values()) {
        if (delivery.organizationId !== input.organizationId) {
          continue;
        }
        if (input.channel && delivery.channel !== input.channel) {
          continue;
        }
        if (input.status && delivery.status !== input.status) {
          continue;
        }
        if (input.retryOfDeliveryId !== undefined && delivery.retryOfDeliveryId !== input.retryOfDeliveryId) {
          continue;
        }
        rows.push(cloneLeavePromotionDelivery(delivery));
      }
      rows.sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime());
      return rows.slice(0, limit);
    },

    async createRecipient(input: CreateLeavePromotionDeliveryRecipientInput) {
      const now = new Date();
      const recipient: LeavePromotionDeliveryRecipientEntity = {
        id: nextId("LPDR"),
        deliveryId: input.deliveryId,
        employeeId: input.employeeId,
        email: input.email ?? null,
        name: input.name ?? null,
        remainingDays: input.remainingDays,
        grantedDays: input.grantedDays,
        usedDays: input.usedDays,
        lastAccrualYear: input.lastAccrualYear ?? null,
        eligibleNow: input.eligibleNow,
        status: input.status,
        lastError: input.lastError ?? null,
        sentAt: input.sentAt ? cloneDate(input.sentAt) : null,
        retryCount: input.retryCount ?? 0,
        createdAt: now,
        updatedAt: now
      };
      state.leavePromotionDeliveryRecipients.set(recipient.id, recipient);
      return cloneLeavePromotionDeliveryRecipient(recipient);
    },

    async updateRecipient(id: string, input: UpdateLeavePromotionDeliveryRecipientInput) {
      const existing = state.leavePromotionDeliveryRecipients.get(id);
      if (!existing) {
        throw new Error(`leave promotion delivery recipient not found: ${id}`);
      }
      const updated: LeavePromotionDeliveryRecipientEntity = {
        ...existing,
        email: input.email !== undefined ? input.email : existing.email,
        status: input.status ?? existing.status,
        lastError: input.lastError !== undefined ? input.lastError : existing.lastError,
        sentAt:
          input.sentAt !== undefined ? (input.sentAt ? cloneDate(input.sentAt) : null) : existing.sentAt,
        retryCount: input.retryCount !== undefined ? input.retryCount : existing.retryCount,
        updatedAt: new Date()
      };
      state.leavePromotionDeliveryRecipients.set(id, updated);
      return cloneLeavePromotionDeliveryRecipient(updated);
    },

    async listRecipients(input: { deliveryId: string; status?: LeavePromotionRecipientStatus }) {
      const rows: LeavePromotionDeliveryRecipientEntity[] = [];
      for (const recipient of state.leavePromotionDeliveryRecipients.values()) {
        if (recipient.deliveryId !== input.deliveryId) {
          continue;
        }
        if (input.status && recipient.status !== input.status) {
          continue;
        }
        rows.push(cloneLeavePromotionDeliveryRecipient(recipient));
      }
      rows.sort((left, right) => left.createdAt.getTime() - right.createdAt.getTime());
      return rows;
    }
  },

  notices: {
    async create(input: CreateNoticeInput) {
      const now = new Date();
      const notice: NoticeEntity = {
        id: nextId("NOTICE"),
        organizationId: input.organizationId,
        title: input.title,
        body: input.body,
        audience: input.audience,
        targetDepartmentIds: [...(input.targetDepartmentIds ?? [])],
        status: input.status ?? "DRAFT",
        publishAt: input.publishAt ?? null,
        publishedAt: input.publishedAt ?? null,
        createdByActorId: input.createdByActorId,
        createdAt: input.createdAt ? cloneDate(input.createdAt) : now,
        updatedAt: input.updatedAt ? cloneDate(input.updatedAt) : now
      };
      state.notices.set(notice.id, notice);
      return cloneNotice(notice);
    },

    async findById(id: string) {
      const notice = state.notices.get(id);
      return notice ? cloneNotice(notice) : null;
    },

    async update(id: string, input: UpdateNoticeInput) {
      const existing = state.notices.get(id);
      if (!existing) {
        throw new Error(`notice not found: ${id}`);
      }
      const updated = updateNoticeEntity(existing, input);
      state.notices.set(id, updated);
      return cloneNotice(updated);
    },

    async delete(id: string) {
      const existing = state.notices.get(id);
      if (!existing) {
        throw new Error(`notice not found: ${id}`);
      }
      state.notices.delete(id);
      return cloneNotice(existing);
    },

    async list(input: {
      organizationId: string;
      audience?: NoticeAudience;
      status?: NoticeStatus;
      limit?: number;
    }) {
      const rows: NoticeEntity[] = [];
      const limit = input.limit && input.limit > 0 ? input.limit : 500;
      for (const notice of state.notices.values()) {
        if (notice.organizationId !== input.organizationId) {
          continue;
        }
        if (input.audience && notice.audience !== input.audience) {
          continue;
        }
        if (input.status && notice.status !== input.status) {
          continue;
        }
        rows.push(cloneNotice(notice));
      }
      rows.sort((left, right) => {
        const byUpdatedAt = right.updatedAt.getTime() - left.updatedAt.getTime();
        if (byUpdatedAt !== 0) {
          return byUpdatedAt;
        }
        return right.id.localeCompare(left.id);
      });
      return rows.slice(0, limit);
    }
  },

  noticeReadReceipts: {
    async upsert(input: UpsertNoticeReadReceiptInput) {
      let existingId: string | null = null;
      for (const [id, receipt] of state.noticeReadReceipts.entries()) {
        if (
          receipt.organizationId === input.organizationId &&
          receipt.noticeId === input.noticeId &&
          receipt.actorId === input.actorId
        ) {
          existingId = id;
          break;
        }
      }

      if (existingId) {
        const existing = state.noticeReadReceipts.get(existingId);
        if (!existing) {
          throw new Error(`notice read receipt not found: ${existingId}`);
        }
        const updated: NoticeReadReceiptEntity = {
          ...existing,
          readAt: cloneDate(input.readAt),
          updatedAt: new Date()
        };
        state.noticeReadReceipts.set(existingId, updated);
        return cloneNoticeReadReceipt(updated);
      }

      const now = new Date();
      const created: NoticeReadReceiptEntity = {
        id: nextId("NREAD"),
        organizationId: input.organizationId,
        noticeId: input.noticeId,
        actorId: input.actorId,
        readAt: cloneDate(input.readAt),
        createdAt: now,
        updatedAt: now
      };
      state.noticeReadReceipts.set(created.id, created);
      return cloneNoticeReadReceipt(created);
    },

    async list(input: {
      organizationId: string;
      actorId?: string;
      noticeId?: string;
      limit?: number;
    }) {
      const rows: NoticeReadReceiptEntity[] = [];
      const limit = input.limit && input.limit > 0 ? input.limit : 500;
      for (const receipt of state.noticeReadReceipts.values()) {
        if (receipt.organizationId !== input.organizationId) {
          continue;
        }
        if (input.actorId && receipt.actorId !== input.actorId) {
          continue;
        }
        if (input.noticeId && receipt.noticeId !== input.noticeId) {
          continue;
        }
        rows.push(cloneNoticeReadReceipt(receipt));
      }
      rows.sort((left, right) => {
        const byReadAt = right.readAt.getTime() - left.readAt.getTime();
        if (byReadAt !== 0) {
          return byReadAt;
        }
        return right.id.localeCompare(left.id);
      });
      return rows.slice(0, limit);
    }
  },

  noticeNotifications: {
    async create(input: CreateNoticeNotificationInput) {
      const now = new Date();
      const notification: NoticeNotificationEntity = {
        id: nextId("NQ"),
        organizationId: input.organizationId,
        noticeId: input.noticeId,
        // NoticeNotificationQueue schema has no employeeId column; keep parity with Prisma store.
        employeeId: null,
        audience: input.audience,
        channel: input.channel,
        state: input.state ?? "QUEUED",
        enqueuedAt: cloneDate(input.enqueuedAt),
        deliveredAt: input.deliveredAt ? cloneDate(input.deliveredAt) : null,
        lastError: input.lastError ?? null,
        createdAt: now,
        updatedAt: now
      };
      state.noticeNotifications.set(notification.id, notification);
      return cloneNoticeNotification(notification);
    },

    async findById(id: string) {
      const notification = state.noticeNotifications.get(id);
      return notification ? cloneNoticeNotification(notification) : null;
    },

    async update(id: string, input: UpdateNoticeNotificationInput) {
      const existing = state.noticeNotifications.get(id);
      if (!existing) {
        throw new Error(`notice notification not found: ${id}`);
      }
      const updated: NoticeNotificationEntity = {
        ...existing,
        state: input.state !== undefined ? input.state : existing.state,
        deliveredAt: input.deliveredAt !== undefined ? input.deliveredAt : existing.deliveredAt,
        lastError: input.lastError !== undefined ? input.lastError : existing.lastError,
        updatedAt: new Date()
      };
      state.noticeNotifications.set(id, updated);
      return cloneNoticeNotification(updated);
    },

    async list(input: {
      organizationId: string;
      noticeId?: string;
      employeeId?: string;
      state?: NoticeNotificationState;
      limit?: number;
    }) {
      const rows: NoticeNotificationEntity[] = [];
      const limit = input.limit && input.limit > 0 ? input.limit : 500;
      for (const notification of state.noticeNotifications.values()) {
        if (notification.organizationId !== input.organizationId) {
          continue;
        }
        if (input.noticeId && notification.noticeId !== input.noticeId) {
          continue;
        }
        if (input.state && notification.state !== input.state) {
          continue;
        }
        rows.push(cloneNoticeNotification(notification));
      }
      rows.sort((left, right) => {
        const byEnqueuedAt = right.enqueuedAt.getTime() - left.enqueuedAt.getTime();
        if (byEnqueuedAt !== 0) {
          return byEnqueuedAt;
        }
        return right.id.localeCompare(left.id);
      });
      return rows.slice(0, limit);
    }
  },

  inAppNotifications: {
    async create(input: CreateInAppNotificationInput) {
      const createdAt = input.createdAt ?? new Date().toISOString();
      const normalizedReadAt = input.readAt ?? (input.isRead ? createdAt : undefined);
      const notification: InAppNotificationEntity = {
        id: input.id ?? nextId("IAPN"),
        organizationId: input.organizationId,
        recipientId: input.recipientId,
        type: input.type,
        title: input.title,
        body: input.body,
        isRead: input.isRead ?? false,
        createdAt,
        ...(normalizedReadAt ? { readAt: normalizedReadAt } : {})
      };
      state.inAppNotifications.set(notification.id, notification);
      return cloneInAppNotification(notification);
    },

    async findById(id: string) {
      const notification = state.inAppNotifications.get(id);
      return notification ? cloneInAppNotification(notification) : null;
    },

    async update(id: string, input: UpdateInAppNotificationInput) {
      const existing = state.inAppNotifications.get(id);
      if (!existing) {
        throw new Error(`in-app notification not found: ${id}`);
      }
      const nextIsRead = input.isRead ?? existing.isRead;
      const readAt = input.readAt === null ? undefined : input.readAt ?? existing.readAt;
      const updated: InAppNotificationEntity = {
        ...existing,
        isRead: nextIsRead,
        ...(readAt ? { readAt } : {})
      };
      if (!readAt) {
        delete updated.readAt;
      }
      state.inAppNotifications.set(id, updated);
      return cloneInAppNotification(updated);
    },

    async list(input: {
      organizationId: string;
      recipientId?: string;
      unreadOnly?: boolean;
      limit?: number;
    }) {
      const rows: InAppNotificationEntity[] = [];
      const limit = input.limit && input.limit > 0 ? input.limit : 500;
      for (const notification of state.inAppNotifications.values()) {
        if (notification.organizationId !== input.organizationId) {
          continue;
        }
        if (input.recipientId && notification.recipientId !== input.recipientId) {
          continue;
        }
        if (input.unreadOnly && notification.isRead) {
          continue;
        }
        rows.push(cloneInAppNotification(notification));
      }
      rows.sort((left, right) => {
        const byCreatedAt = right.createdAt.localeCompare(left.createdAt);
        if (byCreatedAt !== 0) {
          return byCreatedAt;
        }
        return right.id.localeCompare(left.id);
      });
      return rows.slice(0, limit);
    },

    async markAllRead(input: { organizationId: string; recipientId: string; readAt: string }) {
      let updatedCount = 0;
      for (const [id, notification] of state.inAppNotifications.entries()) {
        if (notification.organizationId !== input.organizationId) {
          continue;
        }
        if (notification.recipientId !== input.recipientId) {
          continue;
        }
        if (notification.isRead) {
          continue;
        }
        state.inAppNotifications.set(id, {
          ...notification,
          isRead: true,
          readAt: input.readAt
        });
        updatedCount += 1;
      }
      return updatedCount;
    }
  },

  benefits: {
    async createCatalogItem(input: CreateBenefitCatalogItemInput) {
      const now = new Date();
      const item: BenefitCatalogItemEntity = {
        id: nextId("BENEFIT"),
        organizationId: input.organizationId,
        name: input.name,
        description: input.description,
        annualLimitKrw: Math.max(0, Math.trunc(input.annualLimitKrw)),
        status: input.status ?? "ACTIVE",
        enrollmentStartDate: input.enrollmentStartDate,
        enrollmentEndDate: input.enrollmentEndDate,
        createdAt: input.createdAt ? cloneDate(input.createdAt) : now,
        updatedAt: input.updatedAt ? cloneDate(input.updatedAt) : now
      };
      state.benefitCatalogItems.set(item.id, item);
      return cloneBenefitCatalogItem(item);
    },

    async findCatalogItemById(id: string) {
      const item = state.benefitCatalogItems.get(id);
      return item ? cloneBenefitCatalogItem(item) : null;
    },

    async updateCatalogItem(id: string, input: UpdateBenefitCatalogItemInput) {
      const existing = state.benefitCatalogItems.get(id);
      if (!existing) {
        throw new Error(`benefit catalog item not found: ${id}`);
      }
      const updated: BenefitCatalogItemEntity = {
        ...existing,
        name: input.name !== undefined ? input.name : existing.name,
        description: input.description !== undefined ? input.description : existing.description,
        annualLimitKrw:
          input.annualLimitKrw !== undefined
            ? Math.max(0, Math.trunc(input.annualLimitKrw))
            : existing.annualLimitKrw,
        status: input.status !== undefined ? input.status : existing.status,
        enrollmentStartDate:
          input.enrollmentStartDate !== undefined
            ? input.enrollmentStartDate
            : existing.enrollmentStartDate,
        enrollmentEndDate:
          input.enrollmentEndDate !== undefined ? input.enrollmentEndDate : existing.enrollmentEndDate,
        updatedAt: input.updatedAt ? cloneDate(input.updatedAt) : new Date()
      };
      state.benefitCatalogItems.set(id, updated);
      return cloneBenefitCatalogItem(updated);
    },

    async listCatalogItems(input: { organizationId: string; status?: "ACTIVE" | "INACTIVE"; limit?: number }) {
      const rows: BenefitCatalogItemEntity[] = [];
      const limit = input.limit && input.limit > 0 ? input.limit : 500;
      for (const item of state.benefitCatalogItems.values()) {
        if (item.organizationId !== input.organizationId) {
          continue;
        }
        if (input.status && item.status !== input.status) {
          continue;
        }
        rows.push(cloneBenefitCatalogItem(item));
      }
      rows.sort((left, right) => {
        const byUpdatedAt = right.updatedAt.getTime() - left.updatedAt.getTime();
        if (byUpdatedAt !== 0) {
          return byUpdatedAt;
        }
        return right.id.localeCompare(left.id);
      });
      return rows.slice(0, limit);
    },

    async createRequest(input: CreateBenefitRequestInput) {
      const now = new Date();
      const request: BenefitRequestEntity = {
        id: nextId("BENEFIT-REQ"),
        organizationId: input.organizationId,
        benefitId: input.benefitId,
        employeeId: input.employeeId,
        amountKrw: Math.max(0, Math.trunc(input.amountKrw)),
        reason: input.reason,
        status: input.status ?? "SUBMITTED",
        requestedAt: cloneDate(input.requestedAt),
        reviewedAt: input.reviewedAt ? cloneDate(input.reviewedAt) : null,
        reviewedByActorId: input.reviewedByActorId ?? null,
        reviewNote: input.reviewNote ?? null,
        createdAt: input.createdAt ? cloneDate(input.createdAt) : now,
        updatedAt: input.updatedAt ? cloneDate(input.updatedAt) : now
      };
      state.benefitRequests.set(request.id, request);
      return cloneBenefitRequest(request);
    },

    async findRequestById(id: string) {
      const request = state.benefitRequests.get(id);
      return request ? cloneBenefitRequest(request) : null;
    },

    async updateRequest(id: string, input: UpdateBenefitRequestInput) {
      const existing = state.benefitRequests.get(id);
      if (!existing) {
        throw new Error(`benefit request not found: ${id}`);
      }
      const updated: BenefitRequestEntity = {
        ...existing,
        employeeId: input.employeeId !== undefined ? input.employeeId : existing.employeeId,
        amountKrw:
          input.amountKrw !== undefined ? Math.max(0, Math.trunc(input.amountKrw)) : existing.amountKrw,
        reason: input.reason !== undefined ? input.reason : existing.reason,
        status: input.status !== undefined ? input.status : existing.status,
        reviewedAt:
          input.reviewedAt !== undefined
            ? input.reviewedAt
              ? cloneDate(input.reviewedAt)
              : null
            : existing.reviewedAt,
        reviewedByActorId:
          input.reviewedByActorId !== undefined
            ? input.reviewedByActorId
            : existing.reviewedByActorId,
        reviewNote: input.reviewNote !== undefined ? input.reviewNote : existing.reviewNote,
        updatedAt: input.updatedAt ? cloneDate(input.updatedAt) : new Date()
      };
      state.benefitRequests.set(id, updated);
      return cloneBenefitRequest(updated);
    },

    async listRequests(input: {
      organizationId: string;
      employeeId?: string;
      status?: "SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELED";
      limit?: number;
    }) {
      const rows: BenefitRequestEntity[] = [];
      const limit = input.limit && input.limit > 0 ? input.limit : 500;
      for (const request of state.benefitRequests.values()) {
        if (request.organizationId !== input.organizationId) {
          continue;
        }
        if (input.employeeId && request.employeeId !== input.employeeId) {
          continue;
        }
        if (input.status && request.status !== input.status) {
          continue;
        }
        rows.push(cloneBenefitRequest(request));
      }
      rows.sort((left, right) => {
        const byUpdatedAt = right.updatedAt.getTime() - left.updatedAt.getTime();
        if (byUpdatedAt !== 0) {
          return byUpdatedAt;
        }
        return right.id.localeCompare(left.id);
      });
      return rows.slice(0, limit);
    }
  },

  onboardingTaskTemplates: {
    async list() {
      return listOnboardingTaskTemplatesFromState();
    },

    async create(input: CreateOnboardingTaskTemplateInput) {
      const normalizedTitle = input.title.trim();
      if (!normalizedTitle) {
        throw new Error("onboarding task template title is required");
      }
      if (
        Array.from(state.onboardingTaskTemplates.values()).some(
          (template) => template.title === normalizedTitle
        )
      ) {
        throw new Error(`onboarding task template already exists: ${normalizedTitle}`);
      }
      const template: OnboardingTaskTemplateEntity = {
        id: nextId("ONBT"),
        title: normalizedTitle,
        sortOrder: input.sortOrder ?? 0,
        createdAt: input.createdAt ? cloneDate(input.createdAt) : new Date()
      };
      state.onboardingTaskTemplates.set(template.id, template);
      return cloneOnboardingTaskTemplate(template);
    },

    async ensureDefaults(titles: string[]) {
      const normalizedTitles = titles
        .map((title) => title.trim())
        .filter((title) => title.length > 0);
      if (normalizedTitles.length === 0) {
        return listOnboardingTaskTemplatesFromState();
      }

      const existing = Array.from(state.onboardingTaskTemplates.values());
      const existingTitleSet = new Set(existing.map((template) => template.title));
      let nextSortOrder =
        existing.length === 0 ? 0 : Math.max(...existing.map((template) => template.sortOrder)) + 1;

      for (const title of normalizedTitles) {
        if (existingTitleSet.has(title)) {
          continue;
        }
        const template: OnboardingTaskTemplateEntity = {
          id: nextId("ONBT"),
          title,
          sortOrder: nextSortOrder,
          createdAt: new Date()
        };
        nextSortOrder += 1;
        existingTitleSet.add(title);
        state.onboardingTaskTemplates.set(template.id, template);
      }

      return listOnboardingTaskTemplatesFromState();
    }
  },

  onboardingTasks: {
    async create(input: CreateOnboardingTaskInput) {
      const task: OnboardingTaskEntity = {
        id: nextId("ONB"),
        employeeId: input.employeeId,
        title: input.title,
        status: input.status ?? "PENDING",
        createdAt: input.createdAt ? cloneDate(input.createdAt) : new Date()
      };
      state.onboardingTasks.set(task.id, task);
      return cloneOnboardingTask(task);
    },

    async listByEmployee(employeeId: string) {
      const rows: OnboardingTaskEntity[] = [];
      for (const task of state.onboardingTasks.values()) {
        if (task.employeeId !== employeeId) {
          continue;
        }
        rows.push(cloneOnboardingTask(task));
      }
      rows.sort((left, right) => {
        const byCreatedAt = left.createdAt.getTime() - right.createdAt.getTime();
        if (byCreatedAt !== 0) {
          return byCreatedAt;
        }
        return left.id.localeCompare(right.id);
      });
      return rows;
    },

    async findById(id: string) {
      const task = state.onboardingTasks.get(id);
      return task ? cloneOnboardingTask(task) : null;
    },

    async update(id: string, input: UpdateOnboardingTaskInput) {
      const existing = state.onboardingTasks.get(id);
      if (!existing) {
        throw new Error(`onboarding task not found: ${id}`);
      }

      const nextStatus: OnboardingTaskStatus = input.status ?? existing.status;
      const updated: OnboardingTaskEntity = {
        ...existing,
        status: nextStatus
      };
      state.onboardingTasks.set(id, updated);
      return cloneOnboardingTask(updated);
    }
  },

  insuranceEnrollments: {
    async upsert(input: UpsertInsuranceEnrollmentInput) {
      const key = insuranceEnrollmentKey(input.employeeId, input.type);
      const updated: InsuranceEnrollmentEntity = {
        employeeId: input.employeeId,
        type: input.type,
        status: input.status,
        enrolledAt:
          input.enrolledAt === undefined
            ? null
            : input.enrolledAt === null
              ? null
              : cloneDate(input.enrolledAt),
        updatedAt: input.updatedAt ? cloneDate(input.updatedAt) : new Date()
      };
      state.insuranceEnrollments.set(key, updated);
      return cloneInsuranceEnrollment(updated);
    },

    async listByEmployee(employeeId: string) {
      const rows: InsuranceEnrollmentEntity[] = [];
      for (const enrollment of state.insuranceEnrollments.values()) {
        if (enrollment.employeeId !== employeeId) {
          continue;
        }
        rows.push(cloneInsuranceEnrollment(enrollment));
      }
      rows.sort((left, right) => {
        const typeOrderDiff = insuranceEnrollmentTypeOrder[left.type] - insuranceEnrollmentTypeOrder[right.type];
        if (typeOrderDiff !== 0) {
          return typeOrderDiff;
        }
        return left.updatedAt.getTime() - right.updatedAt.getTime();
      });
      return rows;
    }
  },

  recruitment: {
    async createOpening(input: CreateRecruitmentOpeningInput) {
      const now = new Date();
      const opening: RecruitmentOpeningEntity = {
        id: nextId("ROPEN"),
        organizationId: input.organizationId,
        title: input.title,
        department: input.department,
        employmentType: input.employmentType,
        hiringManagerId: input.hiringManagerId,
        status: input.status ?? "OPEN",
        createdAt: input.createdAt ? cloneDate(input.createdAt) : now,
        updatedAt: input.updatedAt ? cloneDate(input.updatedAt) : now
      };
      state.recruitmentOpenings.set(opening.id, opening);
      return cloneRecruitmentOpening(opening);
    },

    async findOpeningById(id: string) {
      const opening = state.recruitmentOpenings.get(id);
      return opening ? cloneRecruitmentOpening(opening) : null;
    },

    async updateOpening(id: string, input: UpdateRecruitmentOpeningInput) {
      const existing = state.recruitmentOpenings.get(id);
      if (!existing) {
        throw new Error(`recruitment opening not found: ${id}`);
      }
      const updated: RecruitmentOpeningEntity = {
        ...existing,
        title: input.title !== undefined ? input.title : existing.title,
        department: input.department !== undefined ? input.department : existing.department,
        employmentType:
          input.employmentType !== undefined ? input.employmentType : existing.employmentType,
        hiringManagerId:
          input.hiringManagerId !== undefined
            ? (input.hiringManagerId ?? undefined)
            : existing.hiringManagerId,
        status: input.status !== undefined ? input.status : existing.status,
        updatedAt: input.updatedAt ? cloneDate(input.updatedAt) : new Date()
      };
      state.recruitmentOpenings.set(id, updated);
      return cloneRecruitmentOpening(updated);
    },

    async listOpenings(input: {
      organizationId: string;
      status?: "OPEN" | "CLOSED";
      limit?: number;
    }) {
      const rows: RecruitmentOpeningEntity[] = [];
      const limit = input.limit && input.limit > 0 ? input.limit : 500;
      for (const opening of state.recruitmentOpenings.values()) {
        if (opening.organizationId !== input.organizationId) {
          continue;
        }
        if (input.status && opening.status !== input.status) {
          continue;
        }
        rows.push(cloneRecruitmentOpening(opening));
      }
      rows.sort((left, right) => {
        const byUpdatedAt = right.updatedAt.getTime() - left.updatedAt.getTime();
        if (byUpdatedAt !== 0) {
          return byUpdatedAt;
        }
        return right.id.localeCompare(left.id);
      });
      return rows.slice(0, limit);
    },

    async createReferral(input: CreateRecruitmentReferralInput) {
      const now = new Date();
      const referral: RecruitmentReferralEntity = {
        id: nextId("RREF"),
        organizationId: input.organizationId,
        openingId: input.openingId,
        candidateName: input.candidateName,
        candidateEmail: input.candidateEmail,
        referrerEmployeeId: input.referrerEmployeeId,
        note: input.note,
        stage: input.stage ?? "SUBMITTED",
        stageReason: input.stageReason,
        createdAt: input.createdAt ? cloneDate(input.createdAt) : now,
        updatedAt: input.updatedAt ? cloneDate(input.updatedAt) : now
      };
      state.recruitmentReferrals.set(referral.id, referral);
      return cloneRecruitmentReferral(referral);
    },

    async findReferralById(id: string) {
      const referral = state.recruitmentReferrals.get(id);
      return referral ? cloneRecruitmentReferral(referral) : null;
    },

    async updateReferral(id: string, input: UpdateRecruitmentReferralInput) {
      const existing = state.recruitmentReferrals.get(id);
      if (!existing) {
        throw new Error(`recruitment referral not found: ${id}`);
      }
      const updated: RecruitmentReferralEntity = {
        ...existing,
        openingId: input.openingId !== undefined ? input.openingId : existing.openingId,
        candidateName: input.candidateName !== undefined ? input.candidateName : existing.candidateName,
        candidateEmail:
          input.candidateEmail !== undefined ? input.candidateEmail : existing.candidateEmail,
        referrerEmployeeId:
          input.referrerEmployeeId !== undefined ? input.referrerEmployeeId : existing.referrerEmployeeId,
        note: input.note !== undefined ? input.note : existing.note,
        stage: input.stage !== undefined ? input.stage : existing.stage,
        stageReason:
          input.stageReason !== undefined
            ? (input.stageReason ?? undefined)
            : existing.stageReason,
        updatedAt: input.updatedAt ? cloneDate(input.updatedAt) : new Date()
      };
      state.recruitmentReferrals.set(id, updated);
      return cloneRecruitmentReferral(updated);
    },

    async listReferrals(input: {
      organizationId: string;
      referrerEmployeeId?: string;
      stage?: RecruitmentReferralStage;
      limit?: number;
    }) {
      const rows: RecruitmentReferralEntity[] = [];
      const limit = input.limit && input.limit > 0 ? input.limit : 500;
      for (const referral of state.recruitmentReferrals.values()) {
        if (referral.organizationId !== input.organizationId) {
          continue;
        }
        if (input.referrerEmployeeId && referral.referrerEmployeeId !== input.referrerEmployeeId) {
          continue;
        }
        if (input.stage && referral.stage !== input.stage) {
          continue;
        }
        rows.push(cloneRecruitmentReferral(referral));
      }
      rows.sort((left, right) => {
        const byUpdatedAt = right.updatedAt.getTime() - left.updatedAt.getTime();
        if (byUpdatedAt !== 0) {
          return byUpdatedAt;
        }
        return right.id.localeCompare(left.id);
      });
      return rows.slice(0, limit);
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
        payslipDeliveryChannel: null,
        payslipDistributedAt: null,
        payslipDistributedBy: null,
        payslipReceiptConfirmedAt: null,
        payslipReceiptConfirmedBy: null,
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

    async findConfirmedForPeriod(organizationId, date) {
      let matched: PayrollRunEntity | null = null;
      for (const run of state.payroll.values()) {
        if (run.organizationId !== organizationId) {
          continue;
        }
        if (run.state !== "CONFIRMED") {
          continue;
        }
        if (run.periodStart > date || run.periodEnd < date) {
          continue;
        }
        if (
          !matched ||
          run.periodStart.getTime() > matched.periodStart.getTime() ||
          (run.periodStart.getTime() === matched.periodStart.getTime() && run.id > matched.id)
        ) {
          matched = run;
        }
      }
      return matched ? clonePayroll(matched) : null;
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

  contractTemplateVersions: {
    async create(input: CreateContractTemplateVersionInput) {
      const versionEntity: ContractTemplateVersionEntity = {
        templateId: input.templateId,
        organizationId: input.organizationId,
        version: input.version,
        content: input.content,
        modifiedAt: cloneDate(input.modifiedAt),
        modifiedBy: input.modifiedBy
      };

      const existing = state.contractTemplateVersions.get(input.templateId) ?? [];
      const withoutVersion = existing.filter((row) => row.version !== input.version);
      withoutVersion.push(versionEntity);
      state.contractTemplateVersions.set(input.templateId, withoutVersion);

      return cloneContractTemplateVersion(versionEntity);
    },

    async list(input: ListContractTemplateVersionsInput) {
      const rows = state.contractTemplateVersions.get(input.templateId) ?? [];
      return rows
        .filter((row) =>
          input.organizationId !== undefined ? row.organizationId === input.organizationId : true
        )
        .map(cloneContractTemplateVersion)
        .sort((left, right) => {
          const byVersion = right.version - left.version;
          if (byVersion !== 0) {
            return byVersion;
          }
          return right.modifiedAt.getTime() - left.modifiedAt.getTime();
        });
    },

    async find(input: { templateId: string; version: number; organizationId?: string }) {
      const rows = state.contractTemplateVersions.get(input.templateId) ?? [];
      const row = rows.find((entry) => {
        if (entry.version !== input.version) {
          return false;
        }
        if (input.organizationId !== undefined && entry.organizationId !== input.organizationId) {
          return false;
        }
        return true;
      });
      return row ? cloneContractTemplateVersion(row) : null;
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
