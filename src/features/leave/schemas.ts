import { z } from "zod";

const isoDateTime = z.string().datetime({ offset: true });

export const leaveTypeValues = ["ANNUAL", "SICK", "UNPAID", "MATERNITY", "PATERNITY"] as const;
const leaveTypeSchema = z.enum(leaveTypeValues);
export const leaveRequestUnitValues = ["FULL_DAY", "HALF_DAY", "HOUR"] as const;
const leaveRequestUnitSchema = z.enum(leaveRequestUnitValues);

export const leaveRequestStateValues = ["PENDING", "APPROVED", "REJECTED", "CANCELED"] as const;
const leaveRequestStateSchema = z.enum(leaveRequestStateValues);

export const createLeaveRequestSchema = z.object({
  employeeId: z.string().min(1),
  policyId: z.string().min(1).optional(),
  leaveType: leaveTypeSchema.default("ANNUAL"),
  startDate: isoDateTime,
  endDate: isoDateTime,
  unit: leaveRequestUnitSchema.default("FULL_DAY"),
  hours: z.number().positive().max(24).optional(),
  reason: z.string().max(1000).optional()
});

export const updateLeaveRequestSchema = z.object({
  leaveType: leaveTypeSchema.optional(),
  startDate: isoDateTime.optional(),
  endDate: isoDateTime.optional(),
  unit: leaveRequestUnitSchema.optional(),
  hours: z.number().positive().max(24).nullable().optional(),
  reason: z.string().max(1000).optional()
});

export const rejectLeaveRequestSchema = z.object({
  reason: z.string().min(1).max(1000)
});

export const cancelLeaveRequestSchema = z.object({
  reason: z.string().min(1).max(1000).optional()
});

export const settleLeaveAccrualSchema = z.object({
  employeeId: z.string().min(1),
  year: z.number().int().min(2000).max(9999),
  annualGrantDays: z.number().int().positive().optional(),
  carryOverCapDays: z.number().int().min(0).optional()
});

export const autoGrantLeaveAccrualSchema = z.object({
  organizationId: z.string().min(1).optional(),
  year: z.number().int().min(2000).max(9999),
  dryRun: z.preprocess(parseBooleanLike, z.boolean().optional()),
  includeAlreadySettled: z.preprocess(parseBooleanLike, z.boolean().optional())
});

export const readLeavePolicyQuerySchema = z.object({
  organizationId: z.string().min(1).optional()
});

export const upsertLeavePolicySchema = z.object({
  organizationId: z.string().min(1).optional(),
  annualGrantDays: z.number().int().positive(),
  carryOverCapDays: z.number().int().min(0),
  allowHalfDay: z.boolean().optional(),
  allowHourly: z.boolean().optional(),
  hourlyIncrementMinutes: z.number().int().min(15).max(480).optional(),
  maxHoursPerRequest: z.number().positive().max(24).optional(),
  minNoticeDays: z.number().int().min(0).max(365).optional(),
  maxConsecutiveDays: z.number().positive().max(365).nullable().optional(),
  annualLeavePromotionEnabled: z.boolean().optional(),
  annualLeavePromotionThresholdDays: z.number().positive().max(365).optional(),
  annualLeavePromotionLeadDays: z.number().int().min(0).max(365).optional(),
  annualLeavePromotionMessageTemplate: z.string().max(4000).nullable().optional()
});

export const leavePolicyStatusValues = ["ACTIVE", "ARCHIVED"] as const;
export const leavePolicyStatusSchema = z.enum(leavePolicyStatusValues);

export const listLeavePoliciesQuerySchema = z.object({
  organizationId: z.string().min(1).optional(),
  status: leavePolicyStatusSchema.default("ACTIVE")
});

export const leavePolicyPathSchema = z.object({
  policyId: z.string().min(1)
});

export const listLeaveRequestQuerySchema = z.object({
  from: isoDateTime,
  to: isoDateTime,
  employeeId: z.string().min(1).optional(),
  state: leaveRequestStateSchema.optional()
});

export const readLeaveAvailableBalanceQuerySchema = z.object({
  leaveType: leaveTypeSchema.default("ANNUAL"),
  year: z.preprocess(parseIntegerLike, z.number().int().min(2000).max(9999).optional())
});

export const listLeaveCalendarQuerySchema = z.object({
  from: isoDateTime,
  to: isoDateTime,
  organizationId: z.string().min(1).optional(),
  departmentId: z.string().min(1).optional(),
  includePending: z.preprocess(parseBooleanLike, z.boolean().optional()),
  overlapWarningThreshold: z.preprocess(parseIntegerLike, z.number().int().min(1).max(100).optional())
});

export const listEmployeeDepartmentLeaveCalendarQuerySchema = z.object({
  from: isoDateTime,
  to: isoDateTime
});

function parseBooleanLike(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "on") {
    return true;
  }
  if (normalized === "false" || normalized === "0" || normalized === "no" || normalized === "off") {
    return false;
  }
  return value;
}

function parseIntegerLike(value: unknown) {
  if (typeof value !== "string") {
    return value;
  }
  const normalized = value.trim();
  if (normalized.length === 0) {
    return undefined;
  }
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed)) {
    return value;
  }
  return parsed;
}

export const previewLeavePromotionQuerySchema = z.object({
  organizationId: z.string().min(1).optional(),
  asOf: isoDateTime.optional(),
  includeUpcoming: z.preprocess(parseBooleanLike, z.boolean().optional())
});

export const leavePromotionDeliveryChannelValues = ["webhook", "email_template"] as const;
export const leavePromotionDeliveryChannelSchema = z.enum(leavePromotionDeliveryChannelValues);
export const leavePromotionDeliveryStatusValues = [
  "dry_run",
  "skipped_no_targets",
  "dispatched",
  "failed"
] as const;
export const leavePromotionDeliveryStatusSchema = z.enum(leavePromotionDeliveryStatusValues);
export const leavePromotionRecipientStatusValues = [
  "PENDING",
  "SENT",
  "SKIPPED_NO_EMAIL",
  "FAILED"
] as const;
export const leavePromotionRecipientStatusSchema = z.enum(leavePromotionRecipientStatusValues);

export const notifyLeavePromotionSchema = z.object({
  organizationId: z.string().min(1).optional(),
  asOf: isoDateTime.optional(),
  includeUpcoming: z.preprocess(parseBooleanLike, z.boolean().optional()),
  dryRun: z.preprocess(parseBooleanLike, z.boolean().optional()),
  deliveryChannel: leavePromotionDeliveryChannelSchema.optional(),
  emailTemplateId: z.string().trim().min(1).max(120).optional()
});

export const listLeavePromotionDeliveriesQuerySchema = z.object({
  organizationId: z.string().min(1).optional(),
  channel: leavePromotionDeliveryChannelSchema.optional(),
  status: leavePromotionDeliveryStatusSchema.optional(),
  retryOfDeliveryId: z.string().min(1).optional(),
  limit: z.number().int().min(1).max(200).optional()
});

export const readLeavePromotionDeliveryQuerySchema = z.object({
  organizationId: z.string().min(1).optional()
});

export const leavePromotionDeliveryPathSchema = z.object({
  deliveryId: z.string().min(1)
});

export const retryLeavePromotionDeliverySchema = z.object({
  organizationId: z.string().min(1).optional(),
  dryRun: z.preprocess(parseBooleanLike, z.boolean().optional()),
  emailTemplateId: z.string().trim().min(1).max(120).optional(),
  recipientEmployeeIds: z.array(z.string().min(1)).max(200).optional()
});
