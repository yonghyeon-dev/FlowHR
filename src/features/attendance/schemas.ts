import { z } from "zod";

const isoDateTime = z.string().datetime({ offset: true });

export const createAttendanceSchema = z.object({
  employeeId: z.string().min(1),
  checkInAt: isoDateTime,
  checkOutAt: isoDateTime.optional(),
  breakMinutes: z.number().int().min(0).max(300).default(0),
  isHoliday: z.boolean().default(false),
  notes: z.string().max(1000).optional()
});

export const updateAttendanceSchema = z.object({
  checkInAt: isoDateTime.optional(),
  checkOutAt: isoDateTime.optional(),
  breakMinutes: z.number().int().min(0).max(300).optional(),
  isHoliday: z.boolean().optional(),
  notes: z.string().max(1000).optional()
});

export const rejectAttendanceSchema = z.object({
  reason: z.string().min(1).max(500).optional()
});
