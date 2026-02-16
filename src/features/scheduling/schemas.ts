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

export const updateWorkScheduleSchema = z.object({
  startAt: isoDateTime.optional(),
  endAt: isoDateTime.optional(),
  breakMinutes: z.number().int().min(0).max(300).optional(),
  isHoliday: z.boolean().optional(),
  notes: z.string().max(1000).optional()
});

const weekday = z.number().int().min(1).max(7);

export const createWorkScheduleTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  startMinute: z.number().int().min(0).max(1439),
  endMinute: z.number().int().min(0).max(1439),
  breakMinutes: z.number().int().min(0).max(300).default(0),
  isHoliday: z.boolean().default(false),
  weekdays: z
    .array(weekday)
    .min(1)
    .max(7)
    .refine((days) => new Set(days).size === days.length, "weekdays must not contain duplicates"),
  notes: z.string().max(1000).optional()
});

export const assignScheduleTemplateSchema = z.object({
  employeeId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

export const listWorkScheduleQuerySchema = z.object({
  from: isoDateTime,
  to: isoDateTime,
  employeeId: z.string().min(1).optional()
});

