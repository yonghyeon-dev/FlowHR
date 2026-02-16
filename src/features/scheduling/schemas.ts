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

export const assignScheduleTemplateRangeSchema = z.object({
  employeeId: z.string().min(1),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
});

export const assignScheduleRotationSchema = z.object({
  employeeId: z.string().min(1),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  templateIds: z
    .array(z.string().min(1))
    .min(2)
    .max(14)
    .refine((ids) => new Set(ids).size === ids.length, "templateIds must not contain duplicates")
});

export const assignScheduleRotationOptimizeSchema = z.object({
  employeeId: z.string().min(1),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  templateIds: z
    .array(z.string().min(1))
    .min(2)
    .max(14)
    .refine((ids) => new Set(ids).size === ids.length, "templateIds must not contain duplicates"),
  apply: z.boolean().optional().default(false)
});

const rotationFairnessGlobalConstraintsSchema = z.object({
  objective: z.literal("MINIMIZE_DAILY_PLANNED_MINUTES_GAP").optional(),
  maxDailyPlannedMinutesGap: z.number().int().min(0).max(100_000).optional()
});

export const listScheduleRotationFairnessSchema = z.object({
  organizationId: z.string().min(1).optional(),
  fromDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  toDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  templateIds: z
    .array(z.string().min(1))
    .min(2)
    .max(14)
    .refine((ids) => new Set(ids).size === ids.length, "templateIds must not contain duplicates"),
  employeeIds: z
    .array(z.string().min(1))
    .min(1)
    .max(200)
    .refine((ids) => new Set(ids).size === ids.length, "employeeIds must not contain duplicates")
    .optional(),
  globalConstraints: rotationFairnessGlobalConstraintsSchema.optional()
});

export const listWorkScheduleQuerySchema = z.object({
  from: isoDateTime,
  to: isoDateTime,
  employeeId: z.string().min(1).optional()
});

export const listScheduleAnomaliesQuerySchema = z.object({
  from: isoDateTime,
  to: isoDateTime,
  employeeId: z.string().min(1).optional(),
  lateThresholdMinutes: z.coerce.number().int().min(0).max(240).optional()
});

export const listScheduleAnomalyCockpitQuerySchema = z.object({
  from: isoDateTime,
  to: isoDateTime,
  lateThresholdMinutes: z.coerce.number().int().min(0).max(240).optional(),
  topN: z.coerce.number().int().min(1).max(200).optional()
});

export const listScheduleRotationBalanceQuerySchema = z.object({
  from: isoDateTime,
  to: isoDateTime,
  employeeId: z.string().min(1).optional()
});

