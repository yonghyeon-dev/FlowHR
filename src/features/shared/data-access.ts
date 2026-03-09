export type AttendanceState = "PENDING" | "APPROVED" | "REJECTED";
export type AttendanceCaptureChannel = "MANUAL" | "GPS" | "QR" | "WIFI" | "DEVICE";
export type LeaveType = "ANNUAL" | "SICK" | "UNPAID" | "MATERNITY" | "PATERNITY";
export type LeaveRequestState = "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";
export type LeaveDecisionAction = "APPROVED" | "REJECTED" | "CANCELED";
export type LeaveRequestUnit = "FULL_DAY" | "HALF_DAY" | "HOUR";
export type LeavePromotionDeliveryChannel = "webhook" | "email_template";
export type LeavePromotionDeliveryStatus = "dry_run" | "skipped_no_targets" | "dispatched" | "failed";
export type LeavePromotionRecipientStatus = "PENDING" | "SENT" | "SKIPPED_NO_EMAIL" | "FAILED";
export type LeavePolicyStatus = "ACTIVE" | "ARCHIVED";
export type NoticeAudience = "all" | "employees" | "admins";
export type NoticeStatus = "DRAFT" | "SCHEDULED" | "PUBLISHED";
export type NoticeNotificationChannel = "in_app";
export type NoticeNotificationState = "QUEUED" | "DELIVERED" | "FAILED";
export type BenefitCatalogStatus = "ACTIVE" | "INACTIVE";
export type BenefitRequestStatus = "SUBMITTED" | "APPROVED" | "REJECTED" | "CANCELED";
export type OnboardingTaskStatus = "PENDING" | "COMPLETED";
export type InsuranceEnrollmentType = "NPS" | "NHI" | "EI" | "WCI";
export type InsuranceEnrollmentStatus = "ENROLLED" | "NOT_ENROLLED" | "PENDING";
export type EmployeeStatus = "ACTIVE" | "ON_LEAVE" | "RESIGNED";
export type RecruitmentOpeningStatus = "OPEN" | "CLOSED";
export type RecruitmentReferralStage =
  | "SUBMITTED"
  | "SCREENING"
  | "INTERVIEW"
  | "OFFER"
  | "HIRED"
  | "REJECTED"
  | "WITHDRAWN";
export type PayrollState = "PREVIEWED" | "CONFIRMED";
export type PayPeriod = "MONTHLY" | "BIWEEKLY";
export type WebhookProvider = "discord" | "slack";
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
  anomalyType?: string;
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
  payslipDeliveryChannel: string | null;
  payslipDistributedAt: Date | null;
  payslipDistributedBy: string | null;
  payslipReceiptConfirmedAt: Date | null;
  payslipReceiptConfirmedBy: string | null;
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
  businessRegistrationNumber: string | null;
  fiscalYearStart: string;
  fiscalYearStartMonth: number;
  workHoursPerDay: number;
  standardWorkHoursPerDay: number;
  standardWorkDaysPerWeek: number;
  overtimeThreshold: number;
  overtimeThresholdHours: number;
  payPeriod: PayPeriod;
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
  attendanceGpsRequired: boolean;
  attendanceGeofenceEnabled: boolean;
  attendanceGeofenceLatitude: number | null;
  attendanceGeofenceLongitude: number | null;
  attendanceGeofenceRadiusMeters: number | null;
  notificationDefaultEmailEnabled: boolean;
  notificationDefaultInAppEnabled: boolean;
  notificationDefaultLeaveEnabled: boolean;
  notificationDefaultAttendanceEnabled: boolean;
  notificationDefaultPayrollEnabled: boolean;
  operatorAlertWebhookUrl: string | null;
  operatorAlertWebhookProvider: WebhookProvider | null;
  approvalEscalationUseOperatorAlertWebhook: boolean;
  leavePromotionUseOperatorAlertWebhook: boolean;
  isOnboardingComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type DepartmentEntity = {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  active: boolean;
  parentId: string | null;
  managerId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PositionEntity = {
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
  phone?: string;
  address?: string;
  status: EmployeeStatus;
  notificationEmailEnabled: boolean | null;
  notificationInAppEnabled: boolean | null;
  notificationLeaveEnabled: boolean | null;
  notificationAttendanceEnabled: boolean | null;
  notificationPayrollEnabled: boolean | null;
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
  policyId: string | null;
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
  name: string;
  isStatutory: boolean;
  status: LeavePolicyStatus;
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

export type LeavePromotionDeliveryEntity = {
  id: string;
  organizationId: string;
  asOf: Date;
  includeUpcoming: boolean;
  dryRun: boolean;
  channel: LeavePromotionDeliveryChannel;
  provider: string | null;
  status: LeavePromotionDeliveryStatus;
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
};

export type LeavePromotionDeliveryRecipientEntity = {
  id: string;
  deliveryId: string;
  employeeId: string;
  email: string | null;
  name: string | null;
  remainingDays: number;
  grantedDays: number;
  usedDays: number;
  lastAccrualYear: number | null;
  eligibleNow: boolean;
  status: LeavePromotionRecipientStatus;
  lastError: string | null;
  sentAt: Date | null;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type NoticeEntity = {
  id: string;
  organizationId: string;
  title: string;
  body: string;
  audience: NoticeAudience;
  targetDepartmentIds: string[];
  status: NoticeStatus;
  publishAt: Date | null;
  publishedAt: Date | null;
  createdByActorId: string;
  createdAt: Date;
  updatedAt: Date;
};

export type NoticeReadReceiptEntity = {
  id: string;
  organizationId: string;
  noticeId: string;
  actorId: string;
  readAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type NoticeNotificationEntity = {
  id: string;
  organizationId: string;
  noticeId: string;
  employeeId: string | null;
  audience: NoticeAudience;
  channel: NoticeNotificationChannel;
  state: NoticeNotificationState;
  enqueuedAt: Date;
  deliveredAt: Date | null;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type InAppNotificationEntity = {
  id: string;
  organizationId: string;
  recipientId: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
};

export type BenefitCatalogItemEntity = {
  id: string;
  organizationId: string;
  name: string;
  description: string;
  annualLimitKrw: number;
  status: BenefitCatalogStatus;
  enrollmentStartDate?: string;
  enrollmentEndDate?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type BenefitRequestEntity = {
  id: string;
  organizationId: string;
  benefitId: string;
  employeeId: string;
  amountKrw: number;
  reason: string;
  status: BenefitRequestStatus;
  requestedAt: Date;
  reviewedAt: Date | null;
  reviewedByActorId: string | null;
  reviewNote: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type OnboardingTaskEntity = {
  id: string;
  employeeId: string;
  title: string;
  status: OnboardingTaskStatus;
  createdAt: Date;
};

export type OnboardingTaskTemplateEntity = {
  id: string;
  title: string;
  sortOrder: number;
  createdAt: Date;
};

export type InsuranceEnrollmentEntity = {
  employeeId: string;
  type: InsuranceEnrollmentType;
  status: InsuranceEnrollmentStatus;
  enrolledAt: Date | null;
  updatedAt: Date;
};

export type RecruitmentOpeningEntity = {
  id: string;
  organizationId: string;
  title: string;
  department: string;
  employmentType: string;
  hiringManagerId?: string;
  status: RecruitmentOpeningStatus;
  createdAt: Date;
  updatedAt: Date;
};

export type RecruitmentReferralEntity = {
  id: string;
  organizationId: string;
  openingId: string;
  candidateName: string;
  candidateEmail: string;
  referrerEmployeeId: string;
  note: string;
  stage: RecruitmentReferralStage;
  stageReason?: string;
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
  anomalyType?: string;
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
  anomalyType?: string | null;
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
  payslipDeliveryChannel?: string | null;
  payslipDistributedAt?: Date | null;
  payslipDistributedBy?: string | null;
  payslipReceiptConfirmedAt?: Date | null;
  payslipReceiptConfirmedBy?: string | null;
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
  id?: string;
  name: string;
};

export type UpdateOrganizationInput = {
  name?: string;
  businessRegistrationNumber?: string | null;
  fiscalYearStart?: string;
  fiscalYearStartMonth?: number;
  workHoursPerDay?: number;
  standardWorkHoursPerDay?: number;
  standardWorkDaysPerWeek?: number;
  overtimeThreshold?: number;
  overtimeThresholdHours?: number;
  payPeriod?: PayPeriod;
  industry?: string | null;
  representativeName?: string | null;
  workStartTime?: string | null;
  workEndTime?: string | null;
  workDays?: number[];
  timezone?: string | null;
  currency?: string;
  insuranceRateNps?: number | null;
  insuranceRateNhi?: number | null;
  insuranceRateEi?: number | null;
  insuranceRateWci?: number | null;
  attendanceGpsRequired?: boolean;
  attendanceGeofenceEnabled?: boolean;
  attendanceGeofenceLatitude?: number | null;
  attendanceGeofenceLongitude?: number | null;
  attendanceGeofenceRadiusMeters?: number | null;
  notificationDefaultEmailEnabled?: boolean;
  notificationDefaultInAppEnabled?: boolean;
  notificationDefaultLeaveEnabled?: boolean;
  notificationDefaultAttendanceEnabled?: boolean;
  notificationDefaultPayrollEnabled?: boolean;
  operatorAlertWebhookUrl?: string | null;
  operatorAlertWebhookProvider?: WebhookProvider | null;
  approvalEscalationUseOperatorAlertWebhook?: boolean;
  leavePromotionUseOperatorAlertWebhook?: boolean;
  isOnboardingComplete?: boolean;
};

export type CreateEmployeeInput = {
  id: string;
  organizationId?: string | null;
  departmentId?: string | null;
  positionId?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string;
  address?: string;
  status?: EmployeeStatus;
  notificationEmailEnabled?: boolean | null;
  notificationInAppEnabled?: boolean | null;
  notificationLeaveEnabled?: boolean | null;
  notificationAttendanceEnabled?: boolean | null;
  notificationPayrollEnabled?: boolean | null;
  active?: boolean;
};

export type UpdateEmployeeInput = {
  organizationId?: string | null;
  departmentId?: string | null;
  positionId?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string;
  address?: string;
  status?: EmployeeStatus;
  notificationEmailEnabled?: boolean | null;
  notificationInAppEnabled?: boolean | null;
  notificationLeaveEnabled?: boolean | null;
  notificationAttendanceEnabled?: boolean | null;
  notificationPayrollEnabled?: boolean | null;
  active?: boolean;
};

export type CreateDepartmentInput = {
  organizationId: string;
  code: string;
  name: string;
  active?: boolean;
  parentId?: string | null;
  managerId?: string | null;
};

export type UpdateDepartmentInput = {
  code?: string;
  name?: string;
  active?: boolean;
  parentId?: string | null;
  managerId?: string | null;
};

export type CreatePositionInput = {
  organizationId: string;
  code: string;
  name: string;
  title?: string;
  grade?: number | null;
  description?: string | null;
  active?: boolean;
};

export type UpdatePositionInput = {
  code?: string;
  name?: string;
  title?: string;
  grade?: number | null;
  description?: string | null;
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
  policyId?: string | null;
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

export type CreateLeavePolicyInput = {
  organizationId: string;
  name: string;
  isStatutory?: boolean;
  status?: LeavePolicyStatus;
  annualGrantDays?: number;
  carryOverCapDays?: number;
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

export type CreateLeavePromotionDeliveryInput = {
  organizationId: string;
  asOf: Date;
  includeUpcoming: boolean;
  dryRun: boolean;
  channel: LeavePromotionDeliveryChannel;
  provider?: string | null;
  status: LeavePromotionDeliveryStatus;
  announcementTitle: string;
  announcementBody: string;
  targetCount: number;
  recipientCount: number;
  missingEmailCount: number;
  sentTargetCount: number;
  webhookSource?: string | null;
  emailTemplateSource?: string | null;
  emailTemplateId?: string | null;
  dispatchedAt?: Date | null;
  requestedByActorRole: string;
  requestedByActorId?: string | null;
  retryOfDeliveryId?: string | null;
};

export type UpdateLeavePromotionDeliveryInput = {
  provider?: string | null;
  status?: LeavePromotionDeliveryStatus;
  sentTargetCount?: number;
  dispatchedAt?: Date | null;
  webhookSource?: string | null;
  emailTemplateSource?: string | null;
  emailTemplateId?: string | null;
};

export type CreateLeavePromotionDeliveryRecipientInput = {
  deliveryId: string;
  employeeId: string;
  email?: string | null;
  name?: string | null;
  remainingDays: number;
  grantedDays: number;
  usedDays: number;
  lastAccrualYear?: number | null;
  eligibleNow: boolean;
  status: LeavePromotionRecipientStatus;
  lastError?: string | null;
  sentAt?: Date | null;
  retryCount?: number;
};

export type UpdateLeavePromotionDeliveryRecipientInput = {
  email?: string | null;
  status?: LeavePromotionRecipientStatus;
  lastError?: string | null;
  sentAt?: Date | null;
  retryCount?: number;
};

export type CreateNoticeInput = {
  organizationId: string;
  title: string;
  body: string;
  audience: NoticeAudience;
  targetDepartmentIds?: string[];
  status?: NoticeStatus;
  publishAt?: Date | null;
  publishedAt?: Date | null;
  createdByActorId: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type UpdateNoticeInput = {
  title?: string;
  body?: string;
  audience?: NoticeAudience;
  targetDepartmentIds?: string[];
  status?: NoticeStatus;
  publishAt?: Date | null;
  publishedAt?: Date | null;
  updatedAt?: Date;
};

export type UpsertNoticeReadReceiptInput = {
  organizationId: string;
  noticeId: string;
  actorId: string;
  readAt: Date;
};

export type CreateNoticeNotificationInput = {
  organizationId: string;
  noticeId: string;
  employeeId?: string | null;
  audience: NoticeAudience;
  channel: NoticeNotificationChannel;
  state?: NoticeNotificationState;
  enqueuedAt: Date;
  deliveredAt?: Date | null;
  lastError?: string | null;
};

export type UpdateNoticeNotificationInput = {
  state?: NoticeNotificationState;
  deliveredAt?: Date | null;
  lastError?: string | null;
};

export type CreateInAppNotificationInput = {
  id?: string;
  organizationId: string;
  recipientId: string;
  type: string;
  title: string;
  body: string;
  isRead?: boolean;
  createdAt?: string;
  readAt?: string;
};

export type UpdateInAppNotificationInput = {
  isRead?: boolean;
  readAt?: string | null;
};

export type CreateBenefitCatalogItemInput = {
  organizationId: string;
  name: string;
  description: string;
  annualLimitKrw: number;
  status?: BenefitCatalogStatus;
  enrollmentStartDate?: string;
  enrollmentEndDate?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type UpdateBenefitCatalogItemInput = {
  name?: string;
  description?: string;
  annualLimitKrw?: number;
  status?: BenefitCatalogStatus;
  enrollmentStartDate?: string;
  enrollmentEndDate?: string;
  updatedAt?: Date;
};

export type CreateBenefitRequestInput = {
  organizationId: string;
  benefitId: string;
  employeeId: string;
  amountKrw: number;
  reason: string;
  status?: BenefitRequestStatus;
  requestedAt: Date;
  reviewedAt?: Date | null;
  reviewedByActorId?: string | null;
  reviewNote?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
};

export type UpdateBenefitRequestInput = {
  employeeId?: string;
  amountKrw?: number;
  reason?: string;
  status?: BenefitRequestStatus;
  reviewedAt?: Date | null;
  reviewedByActorId?: string | null;
  reviewNote?: string | null;
  updatedAt?: Date;
};

export type CreateOnboardingTaskInput = {
  employeeId: string;
  title: string;
  status?: OnboardingTaskStatus;
  createdAt?: Date;
};

export type CreateOnboardingTaskTemplateInput = {
  title: string;
  sortOrder?: number;
  createdAt?: Date;
};

export type UpdateOnboardingTaskInput = {
  status?: OnboardingTaskStatus;
};

export type UpsertInsuranceEnrollmentInput = {
  employeeId: string;
  type: InsuranceEnrollmentType;
  status: InsuranceEnrollmentStatus;
  enrolledAt?: Date | null;
  updatedAt?: Date;
};

export type CreateRecruitmentOpeningInput = {
  organizationId: string;
  title: string;
  department: string;
  employmentType: string;
  hiringManagerId?: string;
  status?: RecruitmentOpeningStatus;
  createdAt?: Date;
  updatedAt?: Date;
};

export type UpdateRecruitmentOpeningInput = {
  title?: string;
  department?: string;
  employmentType?: string;
  hiringManagerId?: string | null;
  status?: RecruitmentOpeningStatus;
  updatedAt?: Date;
};

export type CreateRecruitmentReferralInput = {
  organizationId: string;
  openingId: string;
  candidateName: string;
  candidateEmail: string;
  referrerEmployeeId: string;
  note: string;
  stage?: RecruitmentReferralStage;
  stageReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type UpdateRecruitmentReferralInput = {
  openingId?: string;
  candidateName?: string;
  candidateEmail?: string;
  referrerEmployeeId?: string;
  note?: string;
  stage?: RecruitmentReferralStage;
  stageReason?: string | null;
  updatedAt?: Date;
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

export type ContractTemplateVersionEntity = {
  templateId: string;
  organizationId: string;
  version: number;
  content: string;
  modifiedAt: Date;
  modifiedBy: string;
};

export type CreateContractTemplateVersionInput = {
  templateId: string;
  organizationId: string;
  version: number;
  content: string;
  modifiedAt: Date;
  modifiedBy: string;
};

export type ListContractTemplateVersionsInput = {
  templateId: string;
  organizationId?: string;
};

export interface AttendanceStore {
  create(input: CreateAttendanceRecordInput): Promise<AttendanceRecordEntity>;
  findById(id: string): Promise<AttendanceRecordEntity | null>;
  findByIdInOrganization(id: string, organizationId: string): Promise<AttendanceRecordEntity | null>;
  update(id: string, input: UpdateAttendanceRecordInput): Promise<AttendanceRecordEntity>;
  delete(id: string): Promise<AttendanceRecordEntity>;
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
  listOpenRecordsNeedingAutoClose(input: {
    clockInBefore: Date;
    organizationId?: string;
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
  findConfirmedForPeriod(organizationId: string, date: Date): Promise<PayrollRunEntity | null>;
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
  update(id: string, input: UpdateOrganizationInput): Promise<OrganizationEntity>;
  list(): Promise<OrganizationEntity[]>;
}

export interface EmployeeStore {
  create(input: CreateEmployeeInput): Promise<EmployeeEntity>;
  findById(id: string): Promise<EmployeeEntity | null>;
  update(id: string, input: UpdateEmployeeInput): Promise<EmployeeEntity>;
  list(input: { active?: boolean; status?: EmployeeStatus; organizationId?: string }): Promise<EmployeeEntity[]>;
}

export interface DepartmentStore {
  create(input: CreateDepartmentInput): Promise<DepartmentEntity>;
  findById(id: string): Promise<DepartmentEntity | null>;
  update(id: string, input: UpdateDepartmentInput): Promise<DepartmentEntity>;
  delete(id: string): Promise<DepartmentEntity>;
  list(input: { active?: boolean; organizationId?: string }): Promise<DepartmentEntity[]>;
}

export interface PositionStore {
  create(input: CreatePositionInput): Promise<PositionEntity>;
  findById(id: string): Promise<PositionEntity | null>;
  update(id: string, input: UpdatePositionInput): Promise<PositionEntity>;
  delete(id: string): Promise<PositionEntity>;
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
  findById(id: string): Promise<LeavePolicyEntity | null>;
  findByOrganizationId(organizationId: string): Promise<LeavePolicyEntity | null>;
  upsertForOrganization(input: UpsertLeavePolicyInput): Promise<LeavePolicyEntity>;
  create(input: CreateLeavePolicyInput): Promise<LeavePolicyEntity>;
  list(input: {
    organizationId: string;
    status?: LeavePolicyStatus;
    isStatutory?: boolean;
  }): Promise<LeavePolicyEntity[]>;
  archive(id: string): Promise<LeavePolicyEntity>;
  countUsage(policyId: string): Promise<number>;
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

export interface LeavePromotionDeliveryStore {
  create(input: CreateLeavePromotionDeliveryInput): Promise<LeavePromotionDeliveryEntity>;
  findById(id: string): Promise<LeavePromotionDeliveryEntity | null>;
  update(id: string, input: UpdateLeavePromotionDeliveryInput): Promise<LeavePromotionDeliveryEntity>;
  list(input: {
    organizationId: string;
    channel?: LeavePromotionDeliveryChannel;
    status?: LeavePromotionDeliveryStatus;
    retryOfDeliveryId?: string;
    limit?: number;
  }): Promise<LeavePromotionDeliveryEntity[]>;
  createRecipient(
    input: CreateLeavePromotionDeliveryRecipientInput
  ): Promise<LeavePromotionDeliveryRecipientEntity>;
  updateRecipient(
    id: string,
    input: UpdateLeavePromotionDeliveryRecipientInput
  ): Promise<LeavePromotionDeliveryRecipientEntity>;
  listRecipients(input: {
    deliveryId: string;
    status?: LeavePromotionRecipientStatus;
  }): Promise<LeavePromotionDeliveryRecipientEntity[]>;
}

export interface NoticeStore {
  create(input: CreateNoticeInput): Promise<NoticeEntity>;
  findById(id: string): Promise<NoticeEntity | null>;
  update(id: string, input: UpdateNoticeInput): Promise<NoticeEntity>;
  delete(id: string): Promise<NoticeEntity>;
  list(input: {
    organizationId: string;
    audience?: NoticeAudience;
    status?: NoticeStatus;
    limit?: number;
  }): Promise<NoticeEntity[]>;
}

export interface NoticeReadReceiptStore {
  upsert(input: UpsertNoticeReadReceiptInput): Promise<NoticeReadReceiptEntity>;
  list(input: {
    organizationId: string;
    actorId?: string;
    noticeId?: string;
    limit?: number;
  }): Promise<NoticeReadReceiptEntity[]>;
}

export interface NoticeNotificationStore {
  create(input: CreateNoticeNotificationInput): Promise<NoticeNotificationEntity>;
  findById(id: string): Promise<NoticeNotificationEntity | null>;
  update(id: string, input: UpdateNoticeNotificationInput): Promise<NoticeNotificationEntity>;
  list(input: {
    organizationId: string;
    noticeId?: string;
    employeeId?: string;
    state?: NoticeNotificationState;
    limit?: number;
  }): Promise<NoticeNotificationEntity[]>;
}

export interface InAppNotificationStore {
  create(input: CreateInAppNotificationInput): Promise<InAppNotificationEntity>;
  findById(id: string): Promise<InAppNotificationEntity | null>;
  update(id: string, input: UpdateInAppNotificationInput): Promise<InAppNotificationEntity>;
  list(input: {
    organizationId: string;
    recipientId?: string;
    unreadOnly?: boolean;
    limit?: number;
  }): Promise<InAppNotificationEntity[]>;
  markAllRead(input: {
    organizationId: string;
    recipientId: string;
    readAt: string;
  }): Promise<number>;
}

export interface BenefitStore {
  createCatalogItem(input: CreateBenefitCatalogItemInput): Promise<BenefitCatalogItemEntity>;
  findCatalogItemById(id: string): Promise<BenefitCatalogItemEntity | null>;
  updateCatalogItem(
    id: string,
    input: UpdateBenefitCatalogItemInput
  ): Promise<BenefitCatalogItemEntity>;
  listCatalogItems(input: {
    organizationId: string;
    status?: BenefitCatalogStatus;
    limit?: number;
  }): Promise<BenefitCatalogItemEntity[]>;
  createRequest(input: CreateBenefitRequestInput): Promise<BenefitRequestEntity>;
  findRequestById(id: string): Promise<BenefitRequestEntity | null>;
  updateRequest(id: string, input: UpdateBenefitRequestInput): Promise<BenefitRequestEntity>;
  listRequests(input: {
    organizationId: string;
    employeeId?: string;
    status?: BenefitRequestStatus;
    limit?: number;
  }): Promise<BenefitRequestEntity[]>;
}

export interface OnboardingTaskStore {
  create(input: CreateOnboardingTaskInput): Promise<OnboardingTaskEntity>;
  listByEmployee(employeeId: string): Promise<OnboardingTaskEntity[]>;
  findById(id: string): Promise<OnboardingTaskEntity | null>;
  update(id: string, input: UpdateOnboardingTaskInput): Promise<OnboardingTaskEntity>;
}

export interface OnboardingTaskTemplateStore {
  list(): Promise<OnboardingTaskTemplateEntity[]>;
  create(input: CreateOnboardingTaskTemplateInput): Promise<OnboardingTaskTemplateEntity>;
  ensureDefaults(titles: string[]): Promise<OnboardingTaskTemplateEntity[]>;
}

export interface InsuranceEnrollmentStore {
  upsert(input: UpsertInsuranceEnrollmentInput): Promise<InsuranceEnrollmentEntity>;
  listByEmployee(employeeId: string): Promise<InsuranceEnrollmentEntity[]>;
}

export interface RecruitmentStore {
  createOpening(input: CreateRecruitmentOpeningInput): Promise<RecruitmentOpeningEntity>;
  findOpeningById(id: string): Promise<RecruitmentOpeningEntity | null>;
  updateOpening(id: string, input: UpdateRecruitmentOpeningInput): Promise<RecruitmentOpeningEntity>;
  listOpenings(input: {
    organizationId: string;
    status?: RecruitmentOpeningStatus;
    limit?: number;
  }): Promise<RecruitmentOpeningEntity[]>;
  createReferral(input: CreateRecruitmentReferralInput): Promise<RecruitmentReferralEntity>;
  findReferralById(id: string): Promise<RecruitmentReferralEntity | null>;
  updateReferral(id: string, input: UpdateRecruitmentReferralInput): Promise<RecruitmentReferralEntity>;
  listReferrals(input: {
    organizationId: string;
    referrerEmployeeId?: string;
    stage?: RecruitmentReferralStage;
    limit?: number;
  }): Promise<RecruitmentReferralEntity[]>;
}

export interface AuditStore {
  append(input: AppendAuditLogInput): Promise<void>;
  list(input: ListAuditLogsInput): Promise<AuditLogEntity[]>;
}

export interface ContractTemplateVersionStore {
  create(input: CreateContractTemplateVersionInput): Promise<ContractTemplateVersionEntity>;
  list(input: ListContractTemplateVersionsInput): Promise<ContractTemplateVersionEntity[]>;
  find(input: {
    templateId: string;
    version: number;
    organizationId?: string;
  }): Promise<ContractTemplateVersionEntity | null>;
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
  leavePromotionDeliveries: LeavePromotionDeliveryStore;
  benefits: BenefitStore;
  onboardingTaskTemplates: OnboardingTaskTemplateStore;
  onboardingTasks: OnboardingTaskStore;
  insuranceEnrollments: InsuranceEnrollmentStore;
  recruitment: RecruitmentStore;
  inAppNotifications: InAppNotificationStore;
  notices: NoticeStore;
  noticeReadReceipts: NoticeReadReceiptStore;
  noticeNotifications: NoticeNotificationStore;
  payroll: PayrollStore;
  deductionProfiles: DeductionProfileStore;
  audit: AuditStore;
  contractTemplateVersions: ContractTemplateVersionStore;
};
