import { formatKstDateYmd, parseDateToKstBase } from "@/features/scheduling/template-date-helpers";
import { normalizeWeekdays } from "@/features/scheduling/schedule-input-normalization-helpers";
import { ServiceError } from "@/features/shared/service-error";

type WorkScheduleLike = {
  startAt: Date;
  endAt: Date;
  breakMinutes: number;
  isHoliday: boolean;
};

type GeneratedScheduleWindowLike = {
  startAt: Date;
  endAt: Date;
  breakMinutes: number;
  isHoliday: boolean;
};

type ScopedEmployeeLike = {
  id: string;
};

export type RotationBalanceGradeLike = "BALANCED" | "MODERATE" | "IMBALANCED";
export type RotationFairnessGlobalObjectiveLike = "MINIMIZE_DAILY_PLANNED_MINUTES_GAP";

export type RotationFairnessGlobalConstraintsInputLike = {
  objective?: RotationFairnessGlobalObjectiveLike;
  maxDailyPlannedMinutesGap?: number;
};

export type RotationFairnessGlobalConstraintsLike = {
  objective: RotationFairnessGlobalObjectiveLike;
  maxDailyPlannedMinutesGap: number | null;
};

export type RotationFairnessPreferenceRuleInputLike = {
  employeeId: string;
  preferredTemplateIds?: string[];
  avoidTemplateIds?: string[];
};

export type RotationFairnessAdvancedConstraintsInputLike = {
  preference?: {
    weight?: number;
    rules: RotationFairnessPreferenceRuleInputLike[];
  };
  laborLaw?: {
    weight?: number;
    minRestMinutesBetweenShifts?: number;
    maxConsecutiveWorkDays?: number;
  };
};

export type RotationFairnessAdvancedConstraintsLike = {
  preference:
    | {
        weight: number;
        rulesByEmployeeId: Map<
          string,
          {
            preferredTemplateIds: Set<string>;
            avoidTemplateIds: Set<string>;
          }
        >;
      }
    | null;
  laborLaw:
    | {
        weight: number;
        minRestMinutesBetweenShifts: number | null;
        maxConsecutiveWorkDays: number | null;
      }
    | null;
};

export type RotationFairnessAdvancedScoreLike = {
  preferencePenalty: number;
  laborLawPenalty: number;
  totalPenalty: number;
  preferenceMismatchCount: number;
  avoidTemplateViolationCount: number;
  minRestViolationCount: number;
  maxConsecutiveWorkDayViolationCount: number;
};

export function plannedMinutesForSchedule(schedule: Pick<WorkScheduleLike, "startAt" | "endAt" | "breakMinutes">) {
  const durationMinutes = Math.floor((schedule.endAt.getTime() - schedule.startAt.getTime()) / 60_000);
  return Math.max(0, durationMinutes - schedule.breakMinutes);
}

export function plannedMinutesForGeneratedWindow(
  window: Pick<GeneratedScheduleWindowLike, "startAt" | "endAt" | "breakMinutes">
) {
  const durationMinutes = Math.floor((window.endAt.getTime() - window.startAt.getTime()) / 60_000);
  return Math.max(0, durationMinutes - window.breakMinutes);
}

export function deriveRotationBalanceGrade(
  weekdayGap: number,
  plannedMinutesGap: number
): RotationBalanceGradeLike {
  if (weekdayGap <= 1 && plannedMinutesGap <= 240) {
    return "BALANCED";
  }
  if (weekdayGap <= 2 && plannedMinutesGap <= 480) {
    return "MODERATE";
  }
  return "IMBALANCED";
}

export function normalizeTemplateIds(templateIds: string[]) {
  const trimmed = templateIds.map((value) => value.trim()).filter((value) => value.length > 0);
  if (trimmed.length < 2) {
    throw new ServiceError(400, "templateIds must include at least two template ids for rotation");
  }
  if (trimmed.length > 14) {
    throw new ServiceError(400, "templateIds must not exceed 14 entries");
  }
  const unique = new Set(trimmed);
  if (unique.size !== trimmed.length) {
    throw new ServiceError(400, "templateIds must not contain duplicates");
  }
  return trimmed;
}

export function normalizeEmployeeIds(employeeIds: string[] | undefined) {
  if (!employeeIds) {
    return undefined;
  }
  const trimmed = employeeIds.map((value) => value.trim()).filter((value) => value.length > 0);
  if (trimmed.length === 0) {
    throw new ServiceError(400, "employeeIds must include at least one employee id when provided");
  }
  if (trimmed.length > 200) {
    throw new ServiceError(400, "employeeIds must not exceed 200 entries");
  }
  const unique = new Set(trimmed);
  if (unique.size !== trimmed.length) {
    throw new ServiceError(400, "employeeIds must not contain duplicates");
  }
  return trimmed;
}

export function normalizeRotationFairnessGlobalConstraints(
  globalConstraints: RotationFairnessGlobalConstraintsInputLike | undefined
): RotationFairnessGlobalConstraintsLike | undefined {
  if (!globalConstraints) {
    return undefined;
  }

  const objective = globalConstraints.objective ?? "MINIMIZE_DAILY_PLANNED_MINUTES_GAP";
  if (objective !== "MINIMIZE_DAILY_PLANNED_MINUTES_GAP") {
    throw new ServiceError(400, "unsupported global fairness objective");
  }

  let maxDailyPlannedMinutesGap: number | null = null;
  if (globalConstraints.maxDailyPlannedMinutesGap !== undefined) {
    const value = globalConstraints.maxDailyPlannedMinutesGap;
    if (!Number.isInteger(value) || value < 0 || value > 100_000) {
      throw new ServiceError(400, "maxDailyPlannedMinutesGap must be integer in range 0..100000");
    }
    maxDailyPlannedMinutesGap = value;
  }

  return {
    objective,
    maxDailyPlannedMinutesGap
  };
}

function normalizeRotationFairnessWeight(value: number | undefined, fieldName: string) {
  const normalized = value ?? 0;
  if (!Number.isInteger(normalized) || normalized < 0 || normalized > 100) {
    throw new ServiceError(400, `${fieldName} must be integer in range 0..100`);
  }
  return normalized;
}

export function normalizeRotationFairnessAdvancedConstraints(
  advancedConstraints: RotationFairnessAdvancedConstraintsInputLike | undefined,
  scopedEmployees: ScopedEmployeeLike[],
  templateIds: string[]
): RotationFairnessAdvancedConstraintsLike | undefined {
  if (!advancedConstraints) {
    return undefined;
  }

  const scopedEmployeeIds = new Set(scopedEmployees.map((employee) => employee.id));
  const templateIdSet = new Set(templateIds);

  let preference:
    | {
        weight: number;
        rulesByEmployeeId: Map<
          string,
          {
            preferredTemplateIds: Set<string>;
            avoidTemplateIds: Set<string>;
          }
        >;
      }
    | null = null;

  if (advancedConstraints.preference) {
    const weight = normalizeRotationFairnessWeight(
      advancedConstraints.preference.weight,
      "advancedConstraints.preference.weight"
    );
    const rulesByEmployeeId = new Map<
      string,
      {
        preferredTemplateIds: Set<string>;
        avoidTemplateIds: Set<string>;
      }
    >();

    for (const rule of advancedConstraints.preference.rules) {
      if (!scopedEmployeeIds.has(rule.employeeId)) {
        throw new ServiceError(404, "employee not found in organization scope", {
          employeeIds: [rule.employeeId]
        });
      }
      if (rulesByEmployeeId.has(rule.employeeId)) {
        throw new ServiceError(400, "advanced preference rules must not contain duplicate employeeId");
      }

      const preferredTemplateIds = new Set((rule.preferredTemplateIds ?? []).map((value) => value.trim()));
      const avoidTemplateIds = new Set((rule.avoidTemplateIds ?? []).map((value) => value.trim()));

      if (preferredTemplateIds.size === 0 && avoidTemplateIds.size === 0) {
        throw new ServiceError(
          400,
          "advanced preference rule must include preferredTemplateIds or avoidTemplateIds"
        );
      }

      const unknownTemplateIds = [...preferredTemplateIds, ...avoidTemplateIds].filter(
        (templateId) => !templateIdSet.has(templateId)
      );
      if (unknownTemplateIds.length > 0) {
        throw new ServiceError(404, "template not found in fairness templateIds scope", {
          templateIds: unknownTemplateIds
        });
      }

      const overlapTemplateIds = [...preferredTemplateIds].filter((templateId) => avoidTemplateIds.has(templateId));
      if (overlapTemplateIds.length > 0) {
        throw new ServiceError(400, "preferredTemplateIds and avoidTemplateIds must not overlap", {
          templateIds: overlapTemplateIds
        });
      }

      rulesByEmployeeId.set(rule.employeeId, {
        preferredTemplateIds,
        avoidTemplateIds
      });
    }

    preference = {
      weight,
      rulesByEmployeeId
    };
  }

  let laborLaw:
    | {
        weight: number;
        minRestMinutesBetweenShifts: number | null;
        maxConsecutiveWorkDays: number | null;
      }
    | null = null;

  if (advancedConstraints.laborLaw) {
    const weight = normalizeRotationFairnessWeight(
      advancedConstraints.laborLaw.weight,
      "advancedConstraints.laborLaw.weight"
    );
    const minRestMinutesBetweenShifts = advancedConstraints.laborLaw.minRestMinutesBetweenShifts ?? null;
    const maxConsecutiveWorkDays = advancedConstraints.laborLaw.maxConsecutiveWorkDays ?? null;

    if (minRestMinutesBetweenShifts === null && maxConsecutiveWorkDays === null) {
      throw new ServiceError(
        400,
        "advancedConstraints.laborLaw must include minRestMinutesBetweenShifts or maxConsecutiveWorkDays"
      );
    }

    laborLaw = {
      weight,
      minRestMinutesBetweenShifts,
      maxConsecutiveWorkDays
    };
  }

  if (!preference && !laborLaw) {
    return undefined;
  }

  return {
    preference,
    laborLaw
  };
}

export function countMaxConsecutiveWorkDayViolations(
  workDates: string[],
  maxConsecutiveWorkDays: number
) {
  if (workDates.length === 0) {
    return 0;
  }

  const sorted = [...workDates].sort((left, right) => left.localeCompare(right));
  let violations = 0;
  let streak = 1;
  const oneDayMs = 24 * 60 * 60 * 1000;

  for (let index = 1; index < sorted.length; index += 1) {
    const previous = parseDateToKstBase(sorted[index - 1]);
    const current = parseDateToKstBase(sorted[index]);
    const diffDays = Math.round((current.getTime() - previous.getTime()) / oneDayMs);

    if (diffDays === 1) {
      streak += 1;
      continue;
    }

    if (streak > maxConsecutiveWorkDays) {
      violations += streak - maxConsecutiveWorkDays;
    }
    streak = 1;
  }

  if (streak > maxConsecutiveWorkDays) {
    violations += streak - maxConsecutiveWorkDays;
  }

  return violations;
}

export function evaluateRotationFairnessAdvancedScore(
  employeeId: string,
  option: {
    optimizedTemplateIds: string[];
    generatedWindows: GeneratedScheduleWindowLike[];
  },
  existingSchedules: WorkScheduleLike[],
  advancedConstraints: RotationFairnessAdvancedConstraintsLike | undefined
): RotationFairnessAdvancedScoreLike | null {
  if (!advancedConstraints) {
    return null;
  }

  let preferenceMismatchCount = 0;
  let avoidTemplateViolationCount = 0;
  let minRestViolationCount = 0;
  let maxConsecutiveWorkDayViolationCount = 0;

  if (advancedConstraints.preference) {
    const rule = advancedConstraints.preference.rulesByEmployeeId.get(employeeId);
    if (rule) {
      for (let index = 0; index < option.generatedWindows.length; index += 1) {
        const templateId = option.optimizedTemplateIds[index % option.optimizedTemplateIds.length];
        if (rule.preferredTemplateIds.size > 0 && !rule.preferredTemplateIds.has(templateId)) {
          preferenceMismatchCount += 1;
        }
        if (rule.avoidTemplateIds.has(templateId)) {
          avoidTemplateViolationCount += 1;
        }
      }
    }
  }

  if (advancedConstraints.laborLaw) {
    const minRest = advancedConstraints.laborLaw.minRestMinutesBetweenShifts;
    const maxConsecutive = advancedConstraints.laborLaw.maxConsecutiveWorkDays;

    const windows = [
      ...existingSchedules.map((schedule) => ({
        startAt: schedule.startAt,
        endAt: schedule.endAt,
        isHoliday: schedule.isHoliday,
        plannedMinutes: plannedMinutesForSchedule(schedule)
      })),
      ...option.generatedWindows.map((window) => ({
        startAt: window.startAt,
        endAt: window.endAt,
        isHoliday: window.isHoliday,
        plannedMinutes: plannedMinutesForGeneratedWindow(window)
      }))
    ].sort((left, right) => {
      const leftStart = left.startAt.getTime();
      const rightStart = right.startAt.getTime();
      if (leftStart !== rightStart) {
        return leftStart - rightStart;
      }
      return left.endAt.getTime() - right.endAt.getTime();
    });

    if (minRest !== null) {
      for (let index = 1; index < windows.length; index += 1) {
        const previous = windows[index - 1];
        const current = windows[index];
        const restMinutes = Math.floor((current.startAt.getTime() - previous.endAt.getTime()) / 60_000);
        if (restMinutes < minRest) {
          minRestViolationCount += 1;
        }
      }
    }

    if (maxConsecutive !== null) {
      const workDates = Array.from(
        new Set(
          windows
            .filter((window) => !window.isHoliday && window.plannedMinutes > 0)
            .map((window) => formatKstDateYmd(window.startAt))
        )
      );
      maxConsecutiveWorkDayViolationCount = countMaxConsecutiveWorkDayViolations(workDates, maxConsecutive);
    }
  }

  const preferencePenaltyUnits = preferenceMismatchCount + avoidTemplateViolationCount * 2;
  const laborLawPenaltyUnits = minRestViolationCount + maxConsecutiveWorkDayViolationCount;
  const preferencePenalty = (advancedConstraints.preference?.weight ?? 0) * preferencePenaltyUnits;
  const laborLawPenalty = (advancedConstraints.laborLaw?.weight ?? 0) * laborLawPenaltyUnits;
  const totalPenalty = preferencePenalty + laborLawPenalty;

  return {
    preferencePenalty,
    laborLawPenalty,
    totalPenalty,
    preferenceMismatchCount,
    avoidTemplateViolationCount,
    minRestViolationCount,
    maxConsecutiveWorkDayViolationCount
  };
}

export function weekdaySetKey(weekdays: number[]) {
  return normalizeWeekdays(weekdays).join(",");
}
