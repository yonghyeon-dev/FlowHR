import { z } from "zod";

const isoDateTime = z.string().datetime({ offset: true });

export const createWorkScheduleSchema = z.object({
  employeeId: z.string().min(1),
  startAt: isoDateTime,
  endAt: isoDateTime,
  breakMinutes: z.number().int().min(0).max(300).default(0),
  isHoliday: z.boolean().default(false),
  notes: z.string().max(1000).optional()
});

export const listWorkScheduleQuerySchema = z.object({
  from: isoDateTime,
  to: isoDateTime,
  employeeId: z.string().min(1).optional()
});

