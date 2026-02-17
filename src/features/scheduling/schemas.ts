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

const rotationFairnessPreferenceRuleSchema = z
  .object({
    employeeId: z.string().min(1),
    preferredTemplateIds: z
      .array(z.string().min(1))
      .min(1)
      .max(14)
      .refine((ids) => new Set(ids).size === ids.length, "preferredTemplateIds must not contain duplicates")
      .optional(),
    avoidTemplateIds: z
      .array(z.string().min(1))
      .min(1)
      .max(14)
      .refine((ids) => new Set(ids).size === ids.length, "avoidTemplateIds must not contain duplicates")
      .optional()
  })
  .refine(
    (rule) =>
      (rule.preferredTemplateIds && rule.preferredTemplateIds.length > 0) ||
      (rule.avoidTemplateIds && rule.avoidTemplateIds.length > 0),
    "preference rule must include preferredTemplateIds or avoidTemplateIds"
  );

const rotationFairnessAdvancedConstraintsSchema = z
  .object({
    preference: z
      .object({
        weight: z.number().int().min(0).max(100).optional(),
        rules: z.array(rotationFairnessPreferenceRuleSchema).min(1).max(200)
      })
      .optional(),
    laborLaw: z
      .object({
        weight: z.number().int().min(0).max(100).optional(),
        minRestMinutesBetweenShifts: z.number().int().min(0).max(1440).optional(),
        maxConsecutiveWorkDays: z.number().int().min(1).max(31).optional()
      })
      .refine(
        (value) =>
          value.minRestMinutesBetweenShifts !== undefined ||
          value.maxConsecutiveWorkDays !== undefined,
        "laborLaw must include at least one rule"
      )
      .optional()
  })
  .refine(
    (value) => value.preference !== undefined || value.laborLaw !== undefined,
    "advancedConstraints must include preference or laborLaw"
  );

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
  globalConstraints: rotationFairnessGlobalConstraintsSchema.optional(),
  advancedConstraints: rotationFairnessAdvancedConstraintsSchema.optional()
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

const queryBooleanSchema = z
  .string()
  .trim()
  .toLowerCase()
  .refine((value) => ["1", "0", "true", "false", "yes", "no", "on", "off"].includes(value))
  .transform((value) => ["1", "true", "yes", "on"].includes(value));

export const listScheduleAnomalyCockpitStreamQuerySchema = z.object({
  from: isoDateTime,
  to: isoDateTime,
  lateThresholdMinutes: z.coerce.number().int().min(0).max(240).optional(),
  topN: z.coerce.number().int().min(1).max(200).optional(),
  intervalSeconds: z.coerce.number().int().min(0).max(60).optional(),
  sampleCount: z.coerce.number().int().min(1).max(30).optional(),
  incidentAutomation: queryBooleanSchema.optional(),
  incidentSeverity: z.enum(["MINOR", "MAJOR", "CRITICAL"]).optional(),
  incidentCooldownSeconds: z.coerce.number().int().min(0).max(3600).optional()
});

const incidentLifecycleNoteSchema = z.string().trim().min(1).max(500);

export const acknowledgeScheduleAnomalyIncidentSchema = z.object({
  note: incidentLifecycleNoteSchema.optional()
});

export const assignScheduleAnomalyIncidentSchema = z.object({
  assigneeId: z.string().trim().min(1),
  note: incidentLifecycleNoteSchema.optional()
});

export const resolveScheduleAnomalyIncidentSchema = z.object({
  resolutionCode: z
    .enum(["FALSE_POSITIVE", "ATTENDANCE_CORRECTED", "MANUAL_CONFIRMED", "OTHER"])
    .optional()
    .default("OTHER"),
  note: incidentLifecycleNoteSchema.optional()
});

export const listScheduleAnomalyIncidentQuerySchema = z.object({
  state: z.enum(["ACKNOWLEDGED", "ASSIGNED", "RESOLVED"]).optional(),
  assigneeId: z.string().trim().min(1).optional(),
  topN: z.coerce.number().int().min(1).max(200).optional()
});

export const listScheduleAnomalyIncidentSlaQuerySchema = z
  .object({
    state: z.enum(["ACKNOWLEDGED", "ASSIGNED", "RESOLVED"]).optional(),
    assigneeId: z.string().trim().min(1).optional(),
    topN: z.coerce.number().int().min(1).max(200).optional(),
    includeResolved: queryBooleanSchema.optional(),
    slaTargetMinutes: z.coerce.number().int().min(1).max(10080).optional(),
    warningMinutes: z.coerce.number().int().min(0).max(10079).optional(),
    asOf: isoDateTime.optional()
  })
  .refine(
    (value) =>
      value.warningMinutes === undefined ||
      value.slaTargetMinutes === undefined ||
      value.warningMinutes < value.slaTargetMinutes,
    {
      path: ["warningMinutes"],
      message: "warningMinutes must be less than slaTargetMinutes"
    }
  );

export const triggerScheduleAnomalyIncidentEscalationSchema = z
  .object({
    state: z.enum(["ACKNOWLEDGED", "ASSIGNED", "RESOLVED"]).optional(),
    assigneeId: z.string().trim().min(1).optional(),
    topN: z.number().int().min(1).max(200).optional(),
    includeResolved: z.boolean().optional(),
    includeWarning: z.boolean().optional(),
    slaTargetMinutes: z.number().int().min(1).max(10080).optional(),
    warningMinutes: z.number().int().min(0).max(10079).optional(),
    cooldownMinutes: z.number().int().min(1).max(10080).optional(),
    asOf: isoDateTime.optional(),
    escalationChannel: z.string().trim().min(1).max(100).optional(),
    dryRun: z.boolean().optional()
  })
  .refine(
    (value) =>
      value.warningMinutes === undefined ||
      value.slaTargetMinutes === undefined ||
      value.warningMinutes < value.slaTargetMinutes,
    {
      path: ["warningMinutes"],
      message: "warningMinutes must be less than slaTargetMinutes"
    }
  );

export const executeScheduleAnomalyIncidentAutoActionSchema = z
  .object({
    state: z.enum(["ACKNOWLEDGED", "ASSIGNED", "RESOLVED"]).optional(),
    assigneeId: z.string().trim().min(1).optional(),
    topN: z.number().int().min(1).max(200).optional(),
    includeResolved: z.boolean().optional(),
    includeWarning: z.boolean().optional(),
    slaTargetMinutes: z.number().int().min(1).max(10080).optional(),
    warningMinutes: z.number().int().min(0).max(10079).optional(),
    cooldownMinutes: z.number().int().min(1).max(10080).optional(),
    asOf: isoDateTime.optional(),
    escalationChannel: z.string().trim().min(1).max(100).optional(),
    dryRun: z.boolean().optional(),
    autoAssigneeId: z.string().trim().min(1).max(100),
    autoAssignMode: z.enum(["ASSIGN_IF_UNASSIGNED", "FORCE_ASSIGN"]).optional(),
    autoAssignNote: incidentLifecycleNoteSchema.optional()
  })
  .refine(
    (value) =>
      value.warningMinutes === undefined ||
      value.slaTargetMinutes === undefined ||
      value.warningMinutes < value.slaTargetMinutes,
    {
      path: ["warningMinutes"],
      message: "warningMinutes must be less than slaTargetMinutes"
    }
  );

export const listScheduleRotationBalanceQuerySchema = z.object({
  from: isoDateTime,
  to: isoDateTime,
  employeeId: z.string().min(1).optional()
});

