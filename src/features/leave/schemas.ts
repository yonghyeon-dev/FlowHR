import { z } from "zod";

const isoDateTime = z.string().datetime({ offset: true });

export const leaveTypeValues = ["ANNUAL", "SICK", "UNPAID"] as const;
const leaveTypeSchema = z.enum(leaveTypeValues);

export const createLeaveRequestSchema = z.object({
  employeeId: z.string().min(1),
  leaveType: leaveTypeSchema.default("ANNUAL"),
  startDate: isoDateTime,
  endDate: isoDateTime,
  reason: z.string().max(1000).optional()
});

export const updateLeaveRequestSchema = z.object({
  leaveType: leaveTypeSchema.optional(),
  startDate: isoDateTime.optional(),
  endDate: isoDateTime.optional(),
  reason: z.string().max(1000).optional()
});

export const rejectLeaveRequestSchema = z.object({
  reason: z.string().min(1).max(1000)
});

export const cancelLeaveRequestSchema = z.object({
  reason: z.string().min(1).max(1000).optional()
});
