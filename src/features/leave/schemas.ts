import { z } from "zod";

const isoDateTime = z.string().datetime({ offset: true });

export const leaveTypeValues = ["ANNUAL", "SICK", "UNPAID"] as const;
const leaveTypeSchema = z.enum(leaveTypeValues);
export const leaveRequestUnitValues = ["FULL_DAY", "HALF_DAY", "HOUR"] as const;
const leaveRequestUnitSchema = z.enum(leaveRequestUnitValues);

export const leaveRequestStateValues = ["PENDING", "APPROVED", "REJECTED", "CANCELED"] as const;
const leaveRequestStateSchema = z.enum(leaveRequestStateValues);

export const createLeaveRequestSchema = z.object({
  employeeId: z.string().min(1),
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
  maxConsecutiveDays: z.number().positive().max(365).nullable().optional()
});

export const listLeaveRequestQuerySchema = z.object({
  from: isoDateTime,
  to: isoDateTime,
  employeeId: z.string().min(1).optional(),
  state: leaveRequestStateSchema.optional()
});
