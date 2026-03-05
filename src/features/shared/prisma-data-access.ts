import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
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
  ApprovalStore,
  AuditLogEntity,
  AttendanceRecordEntity,
  AttendanceStore,
  AuditStore,
  ContractTemplateVersionEntity,
  ContractTemplateVersionStore,
  CreateApprovalDelegationInput,
  CreateApprovalExecutionActionInput,
  CreateApprovalExecutionInput,
  CreateApprovalStageHistoryInput,
  CreateContractTemplateVersionInput,
  CreateApprovalLineTemplateInput,
  CreateAttendanceRecordInput,
  CreateDepartmentInput,
  CreateEmployeeInput,
  CreateLeavePolicyInput,
  CreateLeaveRequestInput,
  CreateNoticeInput,
  CreateNoticeNotificationInput,
  CreateInAppNotificationInput,
  CreateBenefitCatalogItemInput,
  CreateBenefitRequestInput,
  CreateOnboardingTaskInput,
  CreateOrganizationInput,
  CreatePayrollRunInput,
  CreatePositionInput,
  CreateRecruitmentOpeningInput,
  CreateRecruitmentReferralInput,
  CreateWorkScheduleTemplateInput,
  CreateWorkScheduleInput,
  DepartmentEntity,
  DepartmentStore,
  UpdateWorkScheduleTemplateInput,
  UpdateWorkScheduleInput,
  DataAccess,
  DeductionProfileEntity,
  BenefitCatalogItemEntity,
  BenefitRequestEntity,
  BenefitStore,
  InsuranceEnrollmentEntity,
  InsuranceEnrollmentStore,
  OnboardingTaskEntity,
  OnboardingTaskStore,
  DeductionProfileStore,
  EmployeeEntity,
  EmployeeStatus,
  EmployeeStore,
  ListAuditLogsInput,
  ListContractTemplateVersionsInput,
  LeaveBalanceEntity,
  LeaveBalanceStore,
  LeavePromotionDeliveryEntity,
  LeavePromotionDeliveryRecipientEntity,
  LeavePromotionDeliveryStore,
  LeavePromotionRecipientStatus,
  CreateLeavePromotionDeliveryInput,
  CreateLeavePromotionDeliveryRecipientInput,
  UpdateLeavePromotionDeliveryInput,
  UpdateLeavePromotionDeliveryRecipientInput,
  LeavePolicyEntity,
  LeavePolicyStore,
  LeaveRequestEntity,
  LeaveStore,
  InAppNotificationEntity,
  InAppNotificationStore,
  NoticeAudience,
  NoticeEntity,
  NoticeNotificationEntity,
  NoticeNotificationState,
  NoticeNotificationStore,
  NoticeReadReceiptEntity,
  NoticeReadReceiptStore,
  NoticeStatus,
  NoticeStore,
  OrganizationEntity,
  OrganizationStore,
  PayrollRunEntity,
  PayrollStore,
  PositionEntity,
  PositionStore,
  RecruitmentOpeningEntity,
  RecruitmentOpeningStatus,
  RecruitmentReferralEntity,
  RecruitmentReferralStage,
  RecruitmentStore,
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
  UpdateApprovalExecutionInput,
  UpdateApprovalLineTemplateInput,
  UpdateAttendanceRecordInput,
  UpdateDepartmentInput,
  UpdateEmployeeInput,
  UpdateOrganizationInput,
  UpdateLeaveRequestInput,
  UpdateNoticeInput,
  UpdateNoticeNotificationInput,
  UpdateInAppNotificationInput,
  UpdateBenefitCatalogItemInput,
  UpdateBenefitRequestInput,
  UpdateOnboardingTaskInput,
  UpsertInsuranceEnrollmentInput,
  UpdatePositionInput,
  UpdatePayrollRunInput,
  UpdateRecruitmentOpeningInput,
  UpdateRecruitmentReferralInput,
  UpsertNoticeReadReceiptInput,
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
  anomalyType: string | null;
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
  return {
    ...record,
    anomalyType: record.anomalyType ?? undefined
  };
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
  policyId: string | null;
  leaveType: "ANNUAL" | "SICK" | "UNPAID" | "MATERNITY" | "PATERNITY";
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
  name: string;
  isStatutory: boolean;
  status: "ACTIVE" | "ARCHIVED";
  annualGrantDays: number;
  carryOverCapDays: number;
  allowHalfDay: boolean;
  allowHourly: boolean;
  hourlyIncrementMinutes: number;
  maxHoursPerRequest: Prisma.Decimal;
  minNoticeDays: number;
  maxConsecutiveDays: Prisma.Decimal | null;
  annualLeavePromotionEnabled: boolean;
  annualLeavePromotionThresholdDays: Prisma.Decimal;
  annualLeavePromotionLeadDays: number;
  annualLeavePromotionMessageTemplate: string | null;
  createdAt: Date;
  updatedAt: Date;
}): LeavePolicyEntity {
  return {
    ...record,
    maxHoursPerRequest: Number(record.maxHoursPerRequest),
    annualLeavePromotionThresholdDays: Number(record.annualLeavePromotionThresholdDays),
    maxConsecutiveDays:
      record.maxConsecutiveDays === null ? null : Number(record.maxConsecutiveDays)
  };
}

function toLeavePromotionDeliveryEntity(record: {
  id: string;
  organizationId: string;
  asOf: Date;
  includeUpcoming: boolean;
  dryRun: boolean;
  channel: "webhook" | "email_template";
  provider: string | null;
  status: "dry_run" | "skipped_no_targets" | "dispatched" | "failed";
  announcementTitle: string;
  announcementBody: string;
  targetCount: number;
  recipientCount: number;
  missingEmailCount: number;
  sentTargetCount: number;
  webhookSource: string | null;
  emailTemplateSource: string | null;
  emailTemplateId: string | null;
  dispatchedAt: Date | null;
  requestedByActorRole: string;
  requestedByActorId: string | null;
  retryOfDeliveryId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): LeavePromotionDeliveryEntity {
  return record;
}

function toLeavePromotionDeliveryRecipientEntity(record: {
  id: string;
  deliveryId: string;
  employeeId: string;
  email: string | null;
  name: string | null;
  remainingDays: Prisma.Decimal;
  grantedDays: Prisma.Decimal;
  usedDays: Prisma.Decimal;
  lastAccrualYear: number | null;
  eligibleNow: boolean;
  status: "PENDING" | "SENT" | "SKIPPED_NO_EMAIL" | "FAILED";
  lastError: string | null;
  sentAt: Date | null;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
}): LeavePromotionDeliveryRecipientEntity {
  return {
    ...record,
    remainingDays: Number(record.remainingDays),
    grantedDays: Number(record.grantedDays),
    usedDays: Number(record.usedDays)
  };
}

function toNoticeEntity(record: {
  id: string;
  organizationId: string;
  title: string;
  body: string;
  audience: "all" | "employees" | "admins";
  targetDepartmentIds: string[];
  status: "DRAFT" | "SCHEDULED" | "PUBLISHED";
  publishAt: Date | null;
  publishedAt: Date | null;
  createdByActorId: string;
  createdAt: Date;
  updatedAt: Date;
}): NoticeEntity {
  return record;
}

function toNoticeReadReceiptEntity(record: {
  id: string;
  organizationId: string;
  noticeId: string;
  actorId: string;
  readAt: Date;
  createdAt: Date;
  updatedAt: Date;
}): NoticeReadReceiptEntity {
  return record;
}

function toNoticeNotificationEntity(record: {
  id: string;
  organizationId: string;
  noticeId: string;
  audience: "all" | "employees" | "admins";
  channel: "in_app";
  state: "QUEUED" | "DELIVERED" | "FAILED";
  enqueuedAt: Date;
  deliveredAt: Date | null;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
}): NoticeNotificationEntity {
  return {
    ...record,
    employeeId: null
  };
}

function toInAppNotificationEntity(record: {
  id: string;
  organizationId: string;
  recipientId: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: Date;
  readAt: Date | null;
}): InAppNotificationEntity {
  return {
    id: record.id,
    organizationId: record.organizationId,
    recipientId: record.recipientId,
    type: record.type,
    title: record.title,
    body: record.body,
    isRead: record.isRead,
    createdAt: record.createdAt.toISOString(),
    ...(record.readAt ? { readAt: record.readAt.toISOString() } : {})
  };
}

function toBenefitCatalogItemEntity(record: {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  annualLimitKrw: number;
  status: "ACTIVE" | "INACTIVE";
  enrollmentStartDate: string | null;
  enrollmentEndDate: string | null;
  createdAt: Date;
  updatedAt: Date;
}): BenefitCatalogItemEntity {
  return {
    ...record,
    enrollmentStartDate: record.enrollmentStartDate ?? undefined,
    enrollmentEndDate: record.enrollmentEndDate ?? undefined
  };
}

function toBenefitRequestEntity(record: {
  id: string;
  organizationId: string;
  benefitId: string;
  employeeId: string;
  amountKrw: number;
  reason: string;
  status: "SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELED";
  requestedAt: Date;
  reviewedAt: Date | null;
  reviewedByActorId: string | null;
  reviewNote: string | null;
  createdAt: Date;
  updatedAt: Date;
}): BenefitRequestEntity {
  return record;
}

function toRecruitmentOpeningEntity(record: {
  id: string;
  organizationId: string;
  title: string;
  department: string;
  employmentType: string;
  hiringManagerId: string | null;
  status: "OPEN" | "CLOSED";
  createdAt: Date;
  updatedAt: Date;
}): RecruitmentOpeningEntity {
  return {
    ...record,
    hiringManagerId: record.hiringManagerId ?? undefined
  };
}

function toRecruitmentReferralEntity(record: {
  id: string;
  organizationId: string;
  openingId: string;
  candidateName: string;
  candidateEmail: string;
  referrerEmployeeId: string;
  note: string;
  stage: "SUBMITTED" | "SCREENING" | "INTERVIEW" | "OFFER" | "HIRED" | "REJECTED" | "WITHDRAWN";
  stageReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}): RecruitmentReferralEntity {
  return {
    ...record,
    stageReason: record.stageReason ?? undefined
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
  payslipDeliveryChannel: string | null;
  payslipDistributedAt: Date | null;
  payslipDistributedBy: string | null;
  payslipReceiptConfirmedAt: Date | null;
  payslipReceiptConfirmedBy: string | null;
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

function parseFiscalYearStartMonth(value: string): number | undefined {
  const parsedMonth = Number.parseInt(value.slice(0, 2), 10);
  if (!Number.isInteger(parsedMonth) || parsedMonth < 1 || parsedMonth > 12) {
    return undefined;
  }
  return parsedMonth;
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
  businessRegistrationNumber: string | null;
  fiscalYearStart: string;
  fiscalYearStartMonth: number;
  workHoursPerDay: number;
  standardWorkHoursPerDay: number;
  standardWorkDaysPerWeek: number;
  overtimeThreshold: number;
  overtimeThresholdHours: number;
  payPeriod: "MONTHLY" | "BIWEEKLY";
  industry: string | null;
  representativeName: string | null;
  workStartTime: string | null;
  workEndTime: string | null;
  workDays: number[];
  timezone: string | null;
  currency: string;
  insuranceRateNps: number | null;
  insuranceRateNhi: number | null;
  insuranceRateEi: number | null;
  insuranceRateWci: number | null;
  isOnboardingComplete: boolean;
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
  parentId: string | null;
  managerId: string | null;
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
  title: string;
  grade: number | null;
  description: string | null;
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
  approvalStagesJson: Prisma.JsonValue;
  payrollGrossPayMinKrw: number | null;
  payrollGrossPayMaxKrw: number | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}): ApprovalLineTemplateEntity {
  const approvalStages = toApprovalTemplateStages(record.approvalStagesJson, record.approverRoles);
  return {
    ...record,
    domain: record.domain as ApprovalDomain,
    approverRoles: [...record.approverRoles],
    approvalStages,
    payrollGrossPayMinKrw: record.payrollGrossPayMinKrw,
    payrollGrossPayMaxKrw: record.payrollGrossPayMaxKrw
  };
}

function toApprovalTemplateStages(
  value: Prisma.JsonValue,
  fallbackApproverRoles: string[]
): ApprovalTemplateStageEntity[] {
  if (!Array.isArray(value)) {
    return [
      {
        stageIndex: 1,
        label: "stage-1",
        approverRoles: [...fallbackApproverRoles],
        minApprovals: 1
      }
    ];
  }

  const rows: ApprovalTemplateStageEntity[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      continue;
    }
    const stageIndexValue = (item as Record<string, unknown>).stageIndex;
    const labelValue = (item as Record<string, unknown>).label;
    const approverRolesValue = (item as Record<string, unknown>).approverRoles;
    const minApprovalsValue = (item as Record<string, unknown>).minApprovals;
    if (
      typeof stageIndexValue !== "number" ||
      !Number.isInteger(stageIndexValue) ||
      stageIndexValue < 1
    ) {
      continue;
    }
    if (typeof labelValue !== "string" || labelValue.trim().length === 0) {
      continue;
    }
    if (!Array.isArray(approverRolesValue)) {
      continue;
    }
    const approverRoles = approverRolesValue
      .filter((role): role is string => typeof role === "string")
      .map((role) => role.trim())
      .filter((role) => role.length > 0);
    if (approverRoles.length === 0) {
      continue;
    }
    if (
      typeof minApprovalsValue !== "number" ||
      !Number.isInteger(minApprovalsValue) ||
      minApprovalsValue < 1 ||
      minApprovalsValue > approverRoles.length
    ) {
      continue;
    }
    rows.push({
      stageIndex: stageIndexValue,
      label: labelValue.trim(),
      approverRoles,
      minApprovals: minApprovalsValue
    });
  }

  if (rows.length === 0) {
    return [
      {
        stageIndex: 1,
        label: "stage-1",
        approverRoles: [...fallbackApproverRoles],
        minApprovals: 1
      }
    ];
  }

  rows.sort((left, right) => left.stageIndex - right.stageIndex);
  return rows;
}

function toApprovalStageHistoryEntity(record: {
  id: string;
  organizationId: string;
  domain: "ATTENDANCE" | "LEAVE" | "PAYROLL";
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
  resolution: "EXPECTED_ROLE" | "ACTIVE_DELEGATION" | "PRIVILEGED_BYPASS" | "DENIED";
  payrollGrossPayKrw: number | null;
  evaluatedAt: Date;
}): ApprovalStageHistoryEntity {
  return {
    ...record,
    domain: record.domain as ApprovalDomain,
    requiredRoles: [...record.requiredRoles],
    matchedTemplateIds: [...record.matchedTemplateIds],
    activeDelegationIds: [...record.activeDelegationIds]
  };
}

function toApprovalExecutionEntity(record: {
  id: string;
  organizationId: string;
  domain: "ATTENDANCE" | "LEAVE" | "PAYROLL";
  targetEntityType: string;
  targetEntityId: string;
  templateId: string | null;
  state: "PENDING" | "APPROVED" | "REJECTED";
  totalStages: number;
  currentStageIndex: number;
  startedAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): ApprovalExecutionEntity {
  return {
    ...record,
    domain: record.domain as ApprovalDomain,
    state: record.state as ApprovalExecutionState
  };
}

function toApprovalExecutionActionEntity(record: {
  id: string;
  executionId: string;
  stageIndex: number;
  action: "APPROVE" | "REJECT";
  actorRole: string;
  actorId: string | null;
  resolution: "EXPECTED_ROLE" | "ACTIVE_DELEGATION" | "PRIVILEGED_BYPASS" | "DENIED";
  createdAt: Date;
}): ApprovalExecutionActionEntity {
  return {
    ...record,
    action: record.action as ApprovalExecutionActionType,
    resolution: record.resolution
  };
}

function toEmployeeEntity(record: {
  id: string;
  organizationId: string | null;
  departmentId: string | null;
  positionId: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  status: "ACTIVE" | "ON_LEAVE" | "RESIGNED";
  createdAt: Date;
  updatedAt: Date;
}): EmployeeEntity {
  return {
    ...record,
    status: record.status as EmployeeStatus,
    active: record.status === "ACTIVE",
    phone: record.phone ?? undefined,
    address: record.address ?? undefined
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

function toOnboardingTaskEntity(record: {
  id: string;
  employeeId: string;
  title: string;
  status: "PENDING" | "COMPLETED";
  createdAt: Date;
}): OnboardingTaskEntity {
  return record;
}

function toInsuranceEnrollmentEntity(record: {
  employeeId: string;
  type: "NPS" | "NHI" | "EI" | "WCI";
  status: "ENROLLED" | "NOT_ENROLLED" | "PENDING";
  enrolledAt: Date | null;
  updatedAt: Date;
}): InsuranceEnrollmentEntity {
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

const CONTRACT_TEMPLATE_VERSION_ACTION = "contract.template.version.snapshotted";
const CONTRACT_TEMPLATE_VERSION_ENTITY_TYPE = "ContractTemplateVersion";

function toContractTemplateVersionEntity(record: {
  organizationId: string | null;
  actorId: string | null;
  payload: unknown | null;
}): ContractTemplateVersionEntity | null {
  if (record.organizationId === null) {
    return null;
  }
  if (!record.payload || typeof record.payload !== "object" || Array.isArray(record.payload)) {
    return null;
  }

  const payload = record.payload as Record<string, unknown>;
  const templateId =
    typeof payload.templateId === "string" && payload.templateId.trim().length > 0
      ? payload.templateId.trim()
      : null;
  const version =
    typeof payload.version === "number" && Number.isInteger(payload.version) && payload.version > 0
      ? payload.version
      : null;
  const content = typeof payload.content === "string" ? payload.content : null;
  const modifiedBy =
    typeof payload.modifiedBy === "string" && payload.modifiedBy.trim().length > 0
      ? payload.modifiedBy.trim()
      : record.actorId;
  const modifiedAtRaw = typeof payload.modifiedAt === "string" ? payload.modifiedAt : null;
  const modifiedAt = modifiedAtRaw ? new Date(modifiedAtRaw) : null;

  if (
    templateId === null ||
    version === null ||
    content === null ||
    modifiedBy === null ||
    modifiedAt === null ||
    Number.isNaN(modifiedAt.getTime())
  ) {
    return null;
  }

  return {
    templateId,
    organizationId: record.organizationId,
    version,
    content,
    modifiedAt,
    modifiedBy
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
        name: input.name,
        fiscalYearStart: "01-01",
        fiscalYearStartMonth: 1,
        workHoursPerDay: 8,
        standardWorkHoursPerDay: 8,
        standardWorkDaysPerWeek: 5,
        overtimeThreshold: 8,
        overtimeThresholdHours: 8,
        payPeriod: "MONTHLY",
        currency: "KRW",
        insuranceRateNps: null,
        insuranceRateNhi: null,
        insuranceRateEi: null,
        insuranceRateWci: null,
        isOnboardingComplete: false
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

  async update(id: string, input: UpdateOrganizationInput) {
    const fiscalYearStartMonthFromLegacy =
      input.fiscalYearStart !== undefined
        ? parseFiscalYearStartMonth(input.fiscalYearStart)
        : undefined;
    const fiscalYearStart =
      input.fiscalYearStart !== undefined
        ? input.fiscalYearStart
        : input.fiscalYearStartMonth !== undefined
          ? `${String(input.fiscalYearStartMonth).padStart(2, "0")}-01`
          : undefined;
    const fiscalYearStartMonth =
      input.fiscalYearStartMonth !== undefined
        ? input.fiscalYearStartMonth
        : fiscalYearStartMonthFromLegacy;
    const standardWorkHoursPerDay =
      input.standardWorkHoursPerDay !== undefined
        ? input.standardWorkHoursPerDay
        : input.workHoursPerDay !== undefined
          ? input.workHoursPerDay
          : undefined;
    const workHoursPerDay =
      input.workHoursPerDay !== undefined
        ? input.workHoursPerDay
        : input.standardWorkHoursPerDay !== undefined
          ? input.standardWorkHoursPerDay
          : undefined;
    const overtimeThresholdHours =
      input.overtimeThresholdHours !== undefined
        ? input.overtimeThresholdHours
        : input.overtimeThreshold !== undefined
          ? input.overtimeThreshold
          : undefined;
    const overtimeThreshold =
      input.overtimeThreshold !== undefined
        ? input.overtimeThreshold
        : input.overtimeThresholdHours !== undefined
          ? input.overtimeThresholdHours
          : undefined;

    const record = await prisma.organization.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.businessRegistrationNumber !== undefined
          ? { businessRegistrationNumber: input.businessRegistrationNumber }
          : {}),
        ...(fiscalYearStart !== undefined ? { fiscalYearStart } : {}),
        ...(fiscalYearStartMonth !== undefined ? { fiscalYearStartMonth } : {}),
        ...(workHoursPerDay !== undefined ? { workHoursPerDay } : {}),
        ...(standardWorkHoursPerDay !== undefined ? { standardWorkHoursPerDay } : {}),
        ...(input.standardWorkDaysPerWeek !== undefined
          ? { standardWorkDaysPerWeek: input.standardWorkDaysPerWeek }
          : {}),
        ...(overtimeThreshold !== undefined ? { overtimeThreshold } : {}),
        ...(overtimeThresholdHours !== undefined ? { overtimeThresholdHours } : {}),
        ...(input.payPeriod !== undefined ? { payPeriod: input.payPeriod } : {}),
        ...(input.industry !== undefined ? { industry: input.industry } : {}),
        ...(input.representativeName !== undefined
          ? { representativeName: input.representativeName }
          : {}),
        ...(input.workStartTime !== undefined ? { workStartTime: input.workStartTime } : {}),
        ...(input.workEndTime !== undefined ? { workEndTime: input.workEndTime } : {}),
        ...(input.workDays !== undefined ? { workDays: input.workDays } : {}),
        ...(input.timezone !== undefined ? { timezone: input.timezone } : {}),
        ...(input.currency !== undefined ? { currency: input.currency } : {}),
        ...(input.insuranceRateNps !== undefined
          ? { insuranceRateNps: input.insuranceRateNps }
          : {}),
        ...(input.insuranceRateNhi !== undefined
          ? { insuranceRateNhi: input.insuranceRateNhi }
          : {}),
        ...(input.insuranceRateEi !== undefined
          ? { insuranceRateEi: input.insuranceRateEi }
          : {}),
        ...(input.insuranceRateWci !== undefined
          ? { insuranceRateWci: input.insuranceRateWci }
          : {}),
        ...(input.isOnboardingComplete !== undefined
          ? { isOnboardingComplete: input.isOnboardingComplete }
          : {})
      }
    });
    return toOrganizationEntity(record);
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
        active: input.active ?? true,
        parentId: input.parentId === undefined ? null : input.parentId,
        managerId: input.managerId === undefined ? null : input.managerId
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
        ...(input.active !== undefined ? { active: input.active } : {}),
        ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
        ...(input.managerId !== undefined ? { managerId: input.managerId } : {})
      }
    });
    return toDepartmentEntity(record);
  },

  async delete(id: string) {
    const record = await prisma.department.delete({
      where: { id }
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
        title: input.title ?? input.name,
        grade: input.grade ?? null,
        description: input.description ?? null,
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
        ...(input.title !== undefined ? { title: input.title } : {}),
        ...(input.grade !== undefined ? { grade: input.grade } : {}),
        ...(input.description !== undefined ? { description: input.description } : {}),
        ...(input.active !== undefined ? { active: input.active } : {})
      }
    });
    return toPositionEntity(record);
  },

  async delete(id: string) {
    const record = await prisma.position.delete({
      where: { id }
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
    const approvalStagesJson = (
      (input.approvalStages ?? [
        {
          stageIndex: 1,
          label: "stage-1",
          approverRoles: [...input.approverRoles],
          minApprovals: 1
        }
      ]) as unknown
    ) as Prisma.InputJsonValue;
    const record = await prisma.approvalLineTemplate.create({
      data: {
        organizationId: input.organizationId,
        name: input.name,
        domain: input.domain,
        approverRoles: input.approverRoles,
        approvalStagesJson,
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
    const approvalStagesJson =
      input.approvalStages !== undefined
        ? ((input.approvalStages as unknown) as Prisma.InputJsonValue)
        : undefined;
    const record = await prisma.approvalLineTemplate.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.domain !== undefined ? { domain: input.domain } : {}),
        ...(input.approverRoles !== undefined ? { approverRoles: input.approverRoles } : {}),
        ...(approvalStagesJson !== undefined ? { approvalStagesJson } : {}),
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
  },

  async appendStageHistory(input: CreateApprovalStageHistoryInput) {
    const record = await prisma.approvalStageHistory.create({
      data: {
        organizationId: input.organizationId,
        domain: input.domain,
        targetEntityType: input.targetEntityType,
        targetEntityId: input.targetEntityId,
        stageIndex: input.stageIndex ?? 1,
        stageLabel: input.stageLabel ?? "policy-gate",
        requiredRoles: input.requiredRoles,
        fallbackRole: input.fallbackRole,
        matchedTemplateIds: input.matchedTemplateIds ?? [],
        activeDelegationIds: input.activeDelegationIds ?? [],
        actorRole: input.actorRole,
        actorId: input.actorId ?? null,
        allowed: input.allowed,
        resolution: input.resolution,
        payrollGrossPayKrw: input.payrollGrossPayKrw ?? null,
        ...(input.evaluatedAt ? { evaluatedAt: input.evaluatedAt } : {})
      }
    });
    return toApprovalStageHistoryEntity(record);
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
    const records = await prisma.approvalStageHistory.findMany({
      where: {
        organizationId: input.organizationId,
        ...(input.domain ? { domain: input.domain } : {}),
        ...(input.targetEntityType ? { targetEntityType: input.targetEntityType } : {}),
        ...(input.targetEntityId ? { targetEntityId: input.targetEntityId } : {}),
        ...(input.allowed !== undefined ? { allowed: input.allowed } : {}),
        ...(input.resolution ? { resolution: input.resolution } : {}),
        ...(input.from || input.to
          ? {
              evaluatedAt: {
                ...(input.from ? { gte: input.from } : {}),
                ...(input.to ? { lte: input.to } : {})
              }
            }
          : {})
      },
      orderBy: [{ evaluatedAt: "desc" }, { id: "desc" }],
      ...(input.limit && input.limit > 0 ? { take: input.limit } : {})
    });
    return records.map(toApprovalStageHistoryEntity);
  },

  async findExecutionByTarget(input: {
    organizationId: string;
    domain: ApprovalDomain;
    targetEntityType: string;
    targetEntityId: string;
  }) {
    const record = await prisma.approvalExecution.findUnique({
      where: {
        approval_execution_target_key: {
          organizationId: input.organizationId,
          domain: input.domain,
          targetEntityType: input.targetEntityType,
          targetEntityId: input.targetEntityId
        }
      }
    });
    return record ? toApprovalExecutionEntity(record) : null;
  },

  async createExecution(input: CreateApprovalExecutionInput) {
    const record = await prisma.approvalExecution.create({
      data: {
        organizationId: input.organizationId,
        domain: input.domain,
        targetEntityType: input.targetEntityType,
        targetEntityId: input.targetEntityId,
        templateId: input.templateId ?? null,
        state: input.state ?? "PENDING",
        totalStages: input.totalStages,
        currentStageIndex: input.currentStageIndex ?? 1,
        ...(input.startedAt ? { startedAt: input.startedAt } : {}),
        ...(input.completedAt !== undefined ? { completedAt: input.completedAt } : {})
      }
    });
    return toApprovalExecutionEntity(record);
  },

  async updateExecution(id: string, input: UpdateApprovalExecutionInput) {
    const record = await prisma.approvalExecution.update({
      where: { id },
      data: {
        ...(input.templateId !== undefined ? { templateId: input.templateId } : {}),
        ...(input.state !== undefined ? { state: input.state } : {}),
        ...(input.totalStages !== undefined ? { totalStages: input.totalStages } : {}),
        ...(input.currentStageIndex !== undefined
          ? { currentStageIndex: input.currentStageIndex }
          : {}),
        ...(input.completedAt !== undefined ? { completedAt: input.completedAt } : {})
      }
    });
    return toApprovalExecutionEntity(record);
  },

  async listExecutions(input: {
    organizationId: string;
    domain?: ApprovalDomain;
    targetEntityType?: string;
    targetEntityId?: string;
    state?: ApprovalExecutionState;
    limit?: number;
  }) {
    const records = await prisma.approvalExecution.findMany({
      where: {
        organizationId: input.organizationId,
        ...(input.domain ? { domain: input.domain } : {}),
        ...(input.targetEntityType ? { targetEntityType: input.targetEntityType } : {}),
        ...(input.targetEntityId ? { targetEntityId: input.targetEntityId } : {}),
        ...(input.state ? { state: input.state } : {})
      },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      ...(input.limit && input.limit > 0 ? { take: input.limit } : {})
    });
    return records.map(toApprovalExecutionEntity);
  },

  async appendExecutionAction(input: CreateApprovalExecutionActionInput) {
    const record = await prisma.approvalExecutionActionLog.create({
      data: {
        executionId: input.executionId,
        stageIndex: input.stageIndex,
        action: input.action,
        actorRole: input.actorRole,
        actorId: input.actorId ?? null,
        resolution: input.resolution,
        ...(input.createdAt ? { createdAt: input.createdAt } : {})
      }
    });
    return toApprovalExecutionActionEntity(record);
  },

  async listExecutionActions(input: {
    executionId: string;
    stageIndex?: number;
    action?: ApprovalExecutionActionType;
    actorId?: string | null;
  }) {
    const records = await prisma.approvalExecutionActionLog.findMany({
      where: {
        executionId: input.executionId,
        ...(input.stageIndex !== undefined ? { stageIndex: input.stageIndex } : {}),
        ...(input.action ? { action: input.action } : {}),
        ...(input.actorId !== undefined ? { actorId: input.actorId } : {})
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }]
    });
    return records.map(toApprovalExecutionActionEntity);
  }
};

const employees: EmployeeStore = {
  async create(input: CreateEmployeeInput) {
    const status = resolveEmployeeStatusInput(input) ?? "ACTIVE";
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
        phone: input.phone === undefined ? null : input.phone,
        address: input.address === undefined ? null : input.address,
        status
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
    const status = resolveEmployeeStatusInput(input);
    const record = await prisma.employee.update({
      where: { id },
      data: {
        organizationId: input.organizationId,
        departmentId: input.departmentId,
        positionId: input.positionId,
        name: input.name,
        email: input.email,
        phone: input.phone,
        address: input.address,
        status
      }
    });
    return toEmployeeEntity(record);
  },

  async list(input: { active?: boolean; status?: EmployeeStatus; organizationId?: string }) {
    const statusFilter =
      input.status !== undefined
        ? input.status
        : input.active === undefined
          ? undefined
          : input.active
            ? "ACTIVE"
            : { not: "ACTIVE" as const };
    const records = await prisma.employee.findMany({
      where: {
        ...(statusFilter !== undefined ? { status: statusFilter } : {}),
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
        anomalyType: input.anomalyType ?? null,
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
        anomalyType: input.anomalyType === undefined ? undefined : input.anomalyType,
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

  async delete(id: string) {
    const record = await prisma.attendanceRecord.delete({
      where: { id }
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
  },

  async listOpenRecordsNeedingAutoClose(input: { clockInBefore: Date; organizationId?: string }) {
    const records = await prisma.attendanceRecord.findMany({
      where: {
        checkOutAt: null,
        checkInAt: {
          lte: input.clockInBefore
        },
        ...(input.organizationId ? { employee: { organizationId: input.organizationId } } : {})
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
        policyId: input.policyId === undefined ? null : input.policyId,
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

const DEFAULT_LEAVE_POLICY_NAME = "Default Leave Policy";

const leavePolicy: LeavePolicyStore = {
  async findById(id: string) {
    const policy = await prisma.leavePolicy.findUnique({
      where: { id }
    });
    return policy ? toLeavePolicyEntity(policy) : null;
  },

  async list(input: {
    organizationId: string;
    status?: "ACTIVE" | "ARCHIVED";
    isStatutory?: boolean;
  }) {
    const policies = await prisma.leavePolicy.findMany({
      where: {
        organizationId: input.organizationId,
        ...(input.status ? { status: input.status } : {}),
        ...(input.isStatutory === undefined ? {} : { isStatutory: input.isStatutory })
      },
      orderBy: [{ isStatutory: "desc" }, { updatedAt: "desc" }, { id: "desc" }]
    });
    return policies.map(toLeavePolicyEntity);
  },

  async findByOrganizationId(organizationId: string) {
    const configured = await prisma.leavePolicy.findFirst({
      where: {
        organizationId,
        status: "ACTIVE",
        isStatutory: false
      },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }]
    });
    if (configured) {
      return toLeavePolicyEntity(configured);
    }

    const fallback = await prisma.leavePolicy.findFirst({
      where: {
        organizationId,
        status: "ACTIVE"
      },
      orderBy: [{ isStatutory: "desc" }, { updatedAt: "desc" }, { id: "desc" }]
    });
    return fallback ? toLeavePolicyEntity(fallback) : null;
  },

  async upsertForOrganization(input: UpsertLeavePolicyInput) {
    const existing = await prisma.leavePolicy.findFirst({
      where: {
        organizationId: input.organizationId,
        status: "ACTIVE",
        isStatutory: false
      },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }]
    });

    const data = {
      annualGrantDays: input.annualGrantDays,
      carryOverCapDays: input.carryOverCapDays,
      ...(input.allowHalfDay !== undefined ? { allowHalfDay: input.allowHalfDay } : {}),
      ...(input.allowHourly !== undefined ? { allowHourly: input.allowHourly } : {}),
      ...(input.hourlyIncrementMinutes !== undefined
        ? { hourlyIncrementMinutes: input.hourlyIncrementMinutes }
        : {}),
      ...(input.maxHoursPerRequest !== undefined
        ? { maxHoursPerRequest: new Prisma.Decimal(input.maxHoursPerRequest) }
        : {}),
      ...(input.minNoticeDays !== undefined ? { minNoticeDays: input.minNoticeDays } : {}),
      ...(input.maxConsecutiveDays !== undefined
        ? {
            maxConsecutiveDays:
              input.maxConsecutiveDays === null ? null : new Prisma.Decimal(input.maxConsecutiveDays)
          }
        : {}),
      ...(input.annualLeavePromotionEnabled !== undefined
        ? { annualLeavePromotionEnabled: input.annualLeavePromotionEnabled }
        : {}),
      ...(input.annualLeavePromotionThresholdDays !== undefined
        ? {
            annualLeavePromotionThresholdDays: new Prisma.Decimal(
              input.annualLeavePromotionThresholdDays
            )
          }
        : {}),
      ...(input.annualLeavePromotionLeadDays !== undefined
        ? { annualLeavePromotionLeadDays: input.annualLeavePromotionLeadDays }
        : {}),
      ...(input.annualLeavePromotionMessageTemplate !== undefined
        ? { annualLeavePromotionMessageTemplate: input.annualLeavePromotionMessageTemplate }
        : {})
    };

    const policy = existing
      ? await prisma.leavePolicy.update({
          where: { id: existing.id },
          data
        })
      : await prisma.leavePolicy.create({
          data: {
            organizationId: input.organizationId,
            name: DEFAULT_LEAVE_POLICY_NAME,
            isStatutory: false,
            status: "ACTIVE",
            annualGrantDays: input.annualGrantDays,
            carryOverCapDays: input.carryOverCapDays,
            allowHalfDay: input.allowHalfDay ?? true,
            allowHourly: input.allowHourly ?? true,
            hourlyIncrementMinutes: input.hourlyIncrementMinutes ?? 30,
            maxHoursPerRequest: new Prisma.Decimal(input.maxHoursPerRequest ?? 8),
            minNoticeDays: input.minNoticeDays ?? 0,
            maxConsecutiveDays:
              input.maxConsecutiveDays === undefined || input.maxConsecutiveDays === null
                ? null
                : new Prisma.Decimal(input.maxConsecutiveDays),
            annualLeavePromotionEnabled: input.annualLeavePromotionEnabled ?? false,
            annualLeavePromotionThresholdDays: new Prisma.Decimal(
              input.annualLeavePromotionThresholdDays ?? 5
            ),
            annualLeavePromotionLeadDays: input.annualLeavePromotionLeadDays ?? 30,
            annualLeavePromotionMessageTemplate: input.annualLeavePromotionMessageTemplate ?? null
          }
        });
    return toLeavePolicyEntity(policy);
  },

  async create(input: CreateLeavePolicyInput) {
    const normalizedName = input.name.trim();
    const policy = await prisma.leavePolicy.create({
      data: {
        organizationId: input.organizationId,
        name: normalizedName.length > 0 ? normalizedName : DEFAULT_LEAVE_POLICY_NAME,
        isStatutory: input.isStatutory ?? false,
        status: input.status ?? "ACTIVE",
        annualGrantDays: input.annualGrantDays ?? 15,
        carryOverCapDays: input.carryOverCapDays ?? 5,
        allowHalfDay: input.allowHalfDay ?? true,
        allowHourly: input.allowHourly ?? true,
        hourlyIncrementMinutes: input.hourlyIncrementMinutes ?? 30,
        maxHoursPerRequest: new Prisma.Decimal(input.maxHoursPerRequest ?? 8),
        minNoticeDays: input.minNoticeDays ?? 0,
        maxConsecutiveDays:
          input.maxConsecutiveDays === undefined || input.maxConsecutiveDays === null
            ? null
            : new Prisma.Decimal(input.maxConsecutiveDays),
        annualLeavePromotionEnabled: input.annualLeavePromotionEnabled ?? false,
        annualLeavePromotionThresholdDays: new Prisma.Decimal(
          input.annualLeavePromotionThresholdDays ?? 5
        ),
        annualLeavePromotionLeadDays: input.annualLeavePromotionLeadDays ?? 30,
        annualLeavePromotionMessageTemplate: input.annualLeavePromotionMessageTemplate ?? null
      }
    });
    return toLeavePolicyEntity(policy);
  },

  async archive(id: string) {
    const policy = await prisma.leavePolicy.update({
      where: { id },
      data: {
        status: "ARCHIVED"
      }
    });
    return toLeavePolicyEntity(policy);
  },

  async countUsage(policyId: string) {
    return prisma.leaveRequest.count({
      where: {
        policyId
      }
    });
  }
};

const leavePromotionDeliveries: LeavePromotionDeliveryStore = {
  async create(input: CreateLeavePromotionDeliveryInput) {
    const record = await prisma.leavePromotionDelivery.create({
      data: {
        organizationId: input.organizationId,
        asOf: input.asOf,
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
        dispatchedAt: input.dispatchedAt ?? null,
        requestedByActorRole: input.requestedByActorRole,
        requestedByActorId: input.requestedByActorId ?? null,
        retryOfDeliveryId: input.retryOfDeliveryId ?? null
      }
    });
    return toLeavePromotionDeliveryEntity(record);
  },

  async findById(id: string) {
    const record = await prisma.leavePromotionDelivery.findUnique({
      where: { id }
    });
    return record ? toLeavePromotionDeliveryEntity(record) : null;
  },

  async update(id: string, input: UpdateLeavePromotionDeliveryInput) {
    const record = await prisma.leavePromotionDelivery.update({
      where: { id },
      data: {
        provider: input.provider,
        status: input.status,
        sentTargetCount: input.sentTargetCount,
        dispatchedAt: input.dispatchedAt,
        webhookSource: input.webhookSource,
        emailTemplateSource: input.emailTemplateSource,
        emailTemplateId: input.emailTemplateId
      }
    });
    return toLeavePromotionDeliveryEntity(record);
  },

  async list(input: {
    organizationId: string;
    channel?: "webhook" | "email_template";
    status?: "dry_run" | "skipped_no_targets" | "dispatched" | "failed";
    retryOfDeliveryId?: string;
    limit?: number;
  }) {
    const limit = input.limit ?? 100;
    const normalizedLimit = Number.isInteger(limit) && limit > 0 ? limit : 100;

    const records = await prisma.leavePromotionDelivery.findMany({
      where: {
        organizationId: input.organizationId,
        ...(input.channel ? { channel: input.channel } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(input.retryOfDeliveryId !== undefined
          ? { retryOfDeliveryId: input.retryOfDeliveryId }
          : {})
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: normalizedLimit
    });
    return records.map(toLeavePromotionDeliveryEntity);
  },

  async createRecipient(input: CreateLeavePromotionDeliveryRecipientInput) {
    const record = await prisma.leavePromotionDeliveryRecipient.create({
      data: {
        deliveryId: input.deliveryId,
        employeeId: input.employeeId,
        email: input.email ?? null,
        name: input.name ?? null,
        remainingDays: new Prisma.Decimal(input.remainingDays),
        grantedDays: new Prisma.Decimal(input.grantedDays),
        usedDays: new Prisma.Decimal(input.usedDays),
        lastAccrualYear: input.lastAccrualYear ?? null,
        eligibleNow: input.eligibleNow,
        status: input.status,
        lastError: input.lastError ?? null,
        sentAt: input.sentAt ?? null,
        retryCount: input.retryCount ?? 0
      }
    });
    return toLeavePromotionDeliveryRecipientEntity(record);
  },

  async updateRecipient(id: string, input: UpdateLeavePromotionDeliveryRecipientInput) {
    const record = await prisma.leavePromotionDeliveryRecipient.update({
      where: { id },
      data: {
        email: input.email,
        status: input.status,
        lastError: input.lastError,
        sentAt: input.sentAt,
        retryCount: input.retryCount
      }
    });
    return toLeavePromotionDeliveryRecipientEntity(record);
  },

  async listRecipients(input: { deliveryId: string; status?: LeavePromotionRecipientStatus }) {
    const records = await prisma.leavePromotionDeliveryRecipient.findMany({
      where: {
        deliveryId: input.deliveryId,
        ...(input.status ? { status: input.status } : {})
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }]
    });
    return records.map(toLeavePromotionDeliveryRecipientEntity);
  }
};

const notices: NoticeStore = {
  async create(input: CreateNoticeInput) {
    const record = await prisma.notice.create({
      data: {
        organizationId: input.organizationId,
        title: input.title,
        body: input.body,
        audience: input.audience,
        targetDepartmentIds: input.targetDepartmentIds ?? [],
        status: input.status ?? "DRAFT",
        publishAt: input.publishAt ?? null,
        publishedAt: input.publishedAt ?? null,
        createdByActorId: input.createdByActorId,
        createdAt: input.createdAt,
        updatedAt: input.updatedAt
      }
    });
    return toNoticeEntity(record);
  },

  async findById(id: string) {
    const record = await prisma.notice.findUnique({
      where: { id }
    });
    return record ? toNoticeEntity(record) : null;
  },

  async update(id: string, input: UpdateNoticeInput) {
    const record = await prisma.notice.update({
      where: { id },
      data: {
        title: input.title,
        body: input.body,
        audience: input.audience,
        targetDepartmentIds: input.targetDepartmentIds,
        status: input.status,
        publishAt: input.publishAt,
        publishedAt: input.publishedAt,
        updatedAt: input.updatedAt
      }
    });
    return toNoticeEntity(record);
  },

  async delete(id: string) {
    const record = await prisma.notice.delete({
      where: { id }
    });
    return toNoticeEntity(record);
  },

  async list(input: {
    organizationId: string;
    audience?: NoticeAudience;
    status?: NoticeStatus;
    limit?: number;
  }) {
    const limit = input.limit ?? 500;
    const normalizedLimit = Number.isInteger(limit) && limit > 0 ? limit : 500;

    const records = await prisma.notice.findMany({
      where: {
        organizationId: input.organizationId,
        ...(input.audience ? { audience: input.audience } : {}),
        ...(input.status ? { status: input.status } : {})
      },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: normalizedLimit
    });
    return records.map(toNoticeEntity);
  }
};

const noticeReadReceipts: NoticeReadReceiptStore = {
  async upsert(input: UpsertNoticeReadReceiptInput) {
    const record = await prisma.noticeReadReceipt.upsert({
      where: {
        notice_receipt_org_notice_actor_key: {
          organizationId: input.organizationId,
          noticeId: input.noticeId,
          actorId: input.actorId
        }
      },
      create: {
        organizationId: input.organizationId,
        noticeId: input.noticeId,
        actorId: input.actorId,
        readAt: input.readAt
      },
      update: {
        readAt: input.readAt
      }
    });
    return toNoticeReadReceiptEntity(record);
  },

  async list(input: {
    organizationId: string;
    actorId?: string;
    noticeId?: string;
    limit?: number;
  }) {
    const limit = input.limit ?? 500;
    const normalizedLimit = Number.isInteger(limit) && limit > 0 ? limit : 500;

    const records = await prisma.noticeReadReceipt.findMany({
      where: {
        organizationId: input.organizationId,
        ...(input.actorId ? { actorId: input.actorId } : {}),
        ...(input.noticeId ? { noticeId: input.noticeId } : {})
      },
      orderBy: [{ readAt: "desc" }, { id: "desc" }],
      take: normalizedLimit
    });
    return records.map(toNoticeReadReceiptEntity);
  }
};

const noticeNotifications: NoticeNotificationStore = {
  async create(input: CreateNoticeNotificationInput) {
    const record = await prisma.noticeNotificationQueue.create({
      data: {
        organizationId: input.organizationId,
        noticeId: input.noticeId,
        audience: input.audience,
        channel: input.channel,
        state: input.state ?? "QUEUED",
        enqueuedAt: input.enqueuedAt,
        deliveredAt: input.deliveredAt ?? null,
        lastError: input.lastError ?? null
      }
    });
    return toNoticeNotificationEntity(record);
  },

  async findById(id: string) {
    const record = await prisma.noticeNotificationQueue.findUnique({
      where: { id }
    });
    return record ? toNoticeNotificationEntity(record) : null;
  },

  async update(id: string, input: UpdateNoticeNotificationInput) {
    const record = await prisma.noticeNotificationQueue.update({
      where: { id },
      data: {
        state: input.state,
        deliveredAt: input.deliveredAt,
        lastError: input.lastError
      }
    });
    return toNoticeNotificationEntity(record);
  },

  async list(input: {
    organizationId: string;
    noticeId?: string;
    employeeId?: string;
    state?: NoticeNotificationState;
    limit?: number;
  }) {
    const limit = input.limit ?? 500;
    const normalizedLimit = Number.isInteger(limit) && limit > 0 ? limit : 500;

    const records = await prisma.noticeNotificationQueue.findMany({
      where: {
        organizationId: input.organizationId,
        ...(input.noticeId ? { noticeId: input.noticeId } : {}),
        ...(input.state ? { state: input.state } : {})
      },
      orderBy: [{ enqueuedAt: "desc" }, { id: "desc" }],
      take: normalizedLimit
    });
    return records.map(toNoticeNotificationEntity);
  }
};

const inAppNotifications: InAppNotificationStore = {
  async create(input: CreateInAppNotificationInput) {
    const createdAt = input.createdAt ? new Date(input.createdAt) : undefined;
    const readAt = input.readAt ? new Date(input.readAt) : undefined;
    const record = await prisma.inAppNotification.create({
      data: {
        ...(input.id ? { id: input.id } : {}),
        organizationId: input.organizationId,
        recipientId: input.recipientId,
        type: input.type,
        title: input.title,
        body: input.body,
        isRead: input.isRead ?? false,
        createdAt,
        readAt: readAt ?? null
      }
    });
    return toInAppNotificationEntity(record);
  },

  async findById(id: string) {
    const record = await prisma.inAppNotification.findUnique({
      where: { id }
    });
    return record ? toInAppNotificationEntity(record) : null;
  },

  async update(id: string, input: UpdateInAppNotificationInput) {
    const record = await prisma.inAppNotification.update({
      where: { id },
      data: {
        isRead: input.isRead,
        ...(input.readAt === undefined
          ? {}
          : {
              readAt: input.readAt === null ? null : new Date(input.readAt)
            })
      }
    });
    return toInAppNotificationEntity(record);
  },

  async list(input: {
    organizationId: string;
    recipientId?: string;
    unreadOnly?: boolean;
    limit?: number;
  }) {
    const limit = input.limit ?? 500;
    const normalizedLimit = Number.isInteger(limit) && limit > 0 ? limit : 500;
    const records = await prisma.inAppNotification.findMany({
      where: {
        organizationId: input.organizationId,
        ...(input.recipientId ? { recipientId: input.recipientId } : {}),
        ...(input.unreadOnly ? { isRead: false } : {})
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: normalizedLimit
    });
    return records.map(toInAppNotificationEntity);
  },

  async markAllRead(input: { organizationId: string; recipientId: string; readAt: string }) {
    const result = await prisma.inAppNotification.updateMany({
      where: {
        organizationId: input.organizationId,
        recipientId: input.recipientId,
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date(input.readAt)
      }
    });
    return result.count;
  }
};

const benefits: BenefitStore = {
  async createCatalogItem(input: CreateBenefitCatalogItemInput) {
    const record = await prisma.benefitCatalogItem.create({
      data: {
        organizationId: input.organizationId,
        name: input.name,
        description: input.description,
        annualLimitKrw: Math.max(0, Math.trunc(input.annualLimitKrw)),
        status: input.status ?? "ACTIVE",
        enrollmentStartDate:
          input.enrollmentStartDate === undefined ? null : input.enrollmentStartDate,
        enrollmentEndDate: input.enrollmentEndDate === undefined ? null : input.enrollmentEndDate,
        createdAt: input.createdAt,
        updatedAt: input.updatedAt
      }
    });
    return toBenefitCatalogItemEntity(record);
  },

  async findCatalogItemById(id: string) {
    const record = await prisma.benefitCatalogItem.findUnique({
      where: { id }
    });
    return record ? toBenefitCatalogItemEntity(record) : null;
  },

  async updateCatalogItem(id: string, input: UpdateBenefitCatalogItemInput) {
    const record = await prisma.benefitCatalogItem.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description,
        annualLimitKrw:
          input.annualLimitKrw === undefined
            ? undefined
            : Math.max(0, Math.trunc(input.annualLimitKrw)),
        status: input.status,
        enrollmentStartDate: input.enrollmentStartDate,
        enrollmentEndDate: input.enrollmentEndDate,
        updatedAt: input.updatedAt
      }
    });
    return toBenefitCatalogItemEntity(record);
  },

  async listCatalogItems(input: {
    organizationId: string;
    status?: "ACTIVE" | "INACTIVE";
    limit?: number;
  }) {
    const limit = input.limit ?? 500;
    const normalizedLimit = Number.isInteger(limit) && limit > 0 ? limit : 500;
    const records = await prisma.benefitCatalogItem.findMany({
      where: {
        organizationId: input.organizationId,
        ...(input.status ? { status: input.status } : {})
      },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: normalizedLimit
    });
    return records.map(toBenefitCatalogItemEntity);
  },

  async createRequest(input: CreateBenefitRequestInput) {
    const record = await prisma.benefitRequest.create({
      data: {
        organizationId: input.organizationId,
        benefitId: input.benefitId,
        employeeId: input.employeeId,
        amountKrw: Math.max(0, Math.trunc(input.amountKrw)),
        reason: input.reason,
        status: input.status ?? "SUBMITTED",
        requestedAt: input.requestedAt,
        reviewedAt: input.reviewedAt ?? null,
        reviewedByActorId: input.reviewedByActorId ?? null,
        reviewNote: input.reviewNote ?? null,
        createdAt: input.createdAt,
        updatedAt: input.updatedAt
      }
    });
    return toBenefitRequestEntity(record);
  },

  async findRequestById(id: string) {
    const record = await prisma.benefitRequest.findUnique({
      where: { id }
    });
    return record ? toBenefitRequestEntity(record) : null;
  },

  async updateRequest(id: string, input: UpdateBenefitRequestInput) {
    const record = await prisma.benefitRequest.update({
      where: { id },
      data: {
        employeeId: input.employeeId,
        amountKrw:
          input.amountKrw === undefined ? undefined : Math.max(0, Math.trunc(input.amountKrw)),
        reason: input.reason,
        status: input.status,
        reviewedAt: input.reviewedAt,
        reviewedByActorId: input.reviewedByActorId,
        reviewNote: input.reviewNote,
        updatedAt: input.updatedAt
      }
    });
    return toBenefitRequestEntity(record);
  },

  async listRequests(input: {
    organizationId: string;
    employeeId?: string;
    status?: "SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELED";
    limit?: number;
  }) {
    const limit = input.limit ?? 500;
    const normalizedLimit = Number.isInteger(limit) && limit > 0 ? limit : 500;

    const records = await prisma.benefitRequest.findMany({
      where: {
        organizationId: input.organizationId,
        ...(input.employeeId ? { employeeId: input.employeeId } : {}),
        ...(input.status ? { status: input.status } : {})
      },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: normalizedLimit
    });
    return records.map(toBenefitRequestEntity);
  }
};

const onboardingTasks: OnboardingTaskStore = {
  async create(input: CreateOnboardingTaskInput) {
    const record = await prisma.onboardingTask.create({
      data: {
        employeeId: input.employeeId,
        title: input.title,
        status: input.status ?? "PENDING",
        ...(input.createdAt ? { createdAt: input.createdAt } : {})
      }
    });
    return toOnboardingTaskEntity(record);
  },

  async listByEmployee(employeeId: string) {
    const records = await prisma.onboardingTask.findMany({
      where: { employeeId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }]
    });
    return records.map(toOnboardingTaskEntity);
  },

  async findById(id: string) {
    const record = await prisma.onboardingTask.findUnique({
      where: { id }
    });
    return record ? toOnboardingTaskEntity(record) : null;
  },

  async update(id: string, input: UpdateOnboardingTaskInput) {
    const record = await prisma.onboardingTask.update({
      where: { id },
      data: {
        status: input.status
      }
    });
    return toOnboardingTaskEntity(record);
  }
};

const insuranceEnrollments: InsuranceEnrollmentStore = {
  async upsert(input: UpsertInsuranceEnrollmentInput) {
    const record = await prisma.insuranceEnrollment.upsert({
      where: {
        employeeId_type: {
          employeeId: input.employeeId,
          type: input.type
        }
      },
      create: {
        employeeId: input.employeeId,
        type: input.type,
        status: input.status,
        enrolledAt:
          input.enrolledAt === undefined
            ? null
            : input.enrolledAt === null
              ? null
              : input.enrolledAt,
        ...(input.updatedAt ? { updatedAt: input.updatedAt } : {})
      },
      update: {
        status: input.status,
        enrolledAt:
          input.enrolledAt === undefined
            ? null
            : input.enrolledAt === null
              ? null
              : input.enrolledAt,
        ...(input.updatedAt ? { updatedAt: input.updatedAt } : {})
      }
    });
    return toInsuranceEnrollmentEntity(record);
  },

  async listByEmployee(employeeId: string) {
    const records = await prisma.insuranceEnrollment.findMany({
      where: { employeeId },
      orderBy: [{ type: "asc" }, { updatedAt: "asc" }]
    });
    return records.map(toInsuranceEnrollmentEntity);
  }
};

const recruitment: RecruitmentStore = {
  async createOpening(input: CreateRecruitmentOpeningInput) {
    const record = await prisma.recruitmentOpening.create({
      data: {
        organizationId: input.organizationId,
        title: input.title,
        department: input.department,
        employmentType: input.employmentType,
        hiringManagerId: input.hiringManagerId ?? null,
        status: input.status ?? "OPEN",
        createdAt: input.createdAt,
        updatedAt: input.updatedAt
      }
    });
    return toRecruitmentOpeningEntity(record);
  },

  async findOpeningById(id: string) {
    const record = await prisma.recruitmentOpening.findUnique({
      where: { id }
    });
    return record ? toRecruitmentOpeningEntity(record) : null;
  },

  async updateOpening(id: string, input: UpdateRecruitmentOpeningInput) {
    const record = await prisma.recruitmentOpening.update({
      where: { id },
      data: {
        title: input.title,
        department: input.department,
        employmentType: input.employmentType,
        hiringManagerId:
          input.hiringManagerId === undefined ? undefined : input.hiringManagerId,
        status: input.status,
        updatedAt: input.updatedAt
      }
    });
    return toRecruitmentOpeningEntity(record);
  },

  async listOpenings(input: {
    organizationId: string;
    status?: RecruitmentOpeningStatus;
    limit?: number;
  }) {
    const limit = input.limit ?? 500;
    const normalizedLimit = Number.isInteger(limit) && limit > 0 ? limit : 500;

    const records = await prisma.recruitmentOpening.findMany({
      where: {
        organizationId: input.organizationId,
        ...(input.status ? { status: input.status } : {})
      },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: normalizedLimit
    });

    return records.map(toRecruitmentOpeningEntity);
  },

  async createReferral(input: CreateRecruitmentReferralInput) {
    const record = await prisma.recruitmentReferral.create({
      data: {
        organizationId: input.organizationId,
        openingId: input.openingId,
        candidateName: input.candidateName,
        candidateEmail: input.candidateEmail,
        referrerEmployeeId: input.referrerEmployeeId,
        note: input.note,
        stage: input.stage ?? "SUBMITTED",
        stageReason: input.stageReason ?? null,
        createdAt: input.createdAt,
        updatedAt: input.updatedAt
      }
    });
    return toRecruitmentReferralEntity(record);
  },

  async findReferralById(id: string) {
    const record = await prisma.recruitmentReferral.findUnique({
      where: { id }
    });
    return record ? toRecruitmentReferralEntity(record) : null;
  },

  async updateReferral(id: string, input: UpdateRecruitmentReferralInput) {
    const record = await prisma.recruitmentReferral.update({
      where: { id },
      data: {
        openingId: input.openingId,
        candidateName: input.candidateName,
        candidateEmail: input.candidateEmail,
        referrerEmployeeId: input.referrerEmployeeId,
        note: input.note,
        stage: input.stage,
        stageReason: input.stageReason === undefined ? undefined : input.stageReason,
        updatedAt: input.updatedAt
      }
    });
    return toRecruitmentReferralEntity(record);
  },

  async listReferrals(input: {
    organizationId: string;
    referrerEmployeeId?: string;
    stage?: RecruitmentReferralStage;
    limit?: number;
  }) {
    const limit = input.limit ?? 500;
    const normalizedLimit = Number.isInteger(limit) && limit > 0 ? limit : 500;

    const records = await prisma.recruitmentReferral.findMany({
      where: {
        organizationId: input.organizationId,
        ...(input.referrerEmployeeId ? { referrerEmployeeId: input.referrerEmployeeId } : {}),
        ...(input.stage ? { stage: input.stage } : {})
      },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: normalizedLimit
    });

    return records.map(toRecruitmentReferralEntity);
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
        sourceRecordCount: input.sourceRecordCount,
        payslipDeliveryChannel: null,
        payslipDistributedAt: null,
        payslipDistributedBy: null,
        payslipReceiptConfirmedAt: null,
        payslipReceiptConfirmedBy: null
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
        confirmedBy: input.confirmedBy,
        payslipDeliveryChannel: input.payslipDeliveryChannel,
        payslipDistributedAt: input.payslipDistributedAt,
        payslipDistributedBy: input.payslipDistributedBy,
        payslipReceiptConfirmedAt: input.payslipReceiptConfirmedAt,
        payslipReceiptConfirmedBy: input.payslipReceiptConfirmedBy
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

const contractTemplateVersions: ContractTemplateVersionStore = {
  async create(input: CreateContractTemplateVersionInput) {
    await prisma.auditLog.create({
      data: {
        action: CONTRACT_TEMPLATE_VERSION_ACTION,
        entityType: CONTRACT_TEMPLATE_VERSION_ENTITY_TYPE,
        entityId: `${input.templateId}:${input.version}`,
        organizationId: input.organizationId,
        actorRole: "system",
        actorId: input.modifiedBy,
        payload: {
          templateId: input.templateId,
          version: input.version,
          content: input.content,
          modifiedAt: input.modifiedAt.toISOString(),
          modifiedBy: input.modifiedBy
        } satisfies Prisma.InputJsonValue
      }
    });

    return {
      templateId: input.templateId,
      organizationId: input.organizationId,
      version: input.version,
      content: input.content,
      modifiedAt: input.modifiedAt,
      modifiedBy: input.modifiedBy
    };
  },

  async list(input: ListContractTemplateVersionsInput) {
    const records = await prisma.auditLog.findMany({
      where: {
        action: CONTRACT_TEMPLATE_VERSION_ACTION,
        entityType: CONTRACT_TEMPLATE_VERSION_ENTITY_TYPE,
        entityId: {
          startsWith: `${input.templateId}:`
        },
        ...(input.organizationId !== undefined ? { organizationId: input.organizationId } : {})
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: 5_000
    });

    const rows = records
      .map((record) =>
        toContractTemplateVersionEntity({
          organizationId: record.organizationId,
          actorId: record.actorId,
          payload: record.payload
        })
      )
      .filter((record): record is ContractTemplateVersionEntity => record !== null);

    rows.sort((left, right) => {
      const byVersion = right.version - left.version;
      if (byVersion !== 0) {
        return byVersion;
      }
      return right.modifiedAt.getTime() - left.modifiedAt.getTime();
    });

    return rows;
  },

  async find(input: { templateId: string; version: number; organizationId?: string }) {
    const record = await prisma.auditLog.findFirst({
      where: {
        action: CONTRACT_TEMPLATE_VERSION_ACTION,
        entityType: CONTRACT_TEMPLATE_VERSION_ENTITY_TYPE,
        entityId: `${input.templateId}:${input.version}`,
        ...(input.organizationId !== undefined ? { organizationId: input.organizationId } : {})
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }]
    });

    if (!record) {
      return null;
    }

    return toContractTemplateVersionEntity({
      organizationId: record.organizationId,
      actorId: record.actorId,
      payload: record.payload
    });
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
  leavePromotionDeliveries,
  benefits,
  onboardingTasks,
  insuranceEnrollments,
  recruitment,
  inAppNotifications,
  notices,
  noticeReadReceipts,
  noticeNotifications,
  payroll,
  deductionProfiles,
  audit,
  contractTemplateVersions
};
