import type {
  WorkScheduleEntity,
  WorkScheduleTemplateEntity
} from "@/features/shared/data-access";
import type { GeneratedScheduleWindow } from "@/features/scheduling/rotation-window-helpers";

type RotationScoreGrade = "BALANCED" | "MODERATE" | "IMBALANCED";

export type RotationOffsetEvaluation<TAdvancedScore extends { totalPenalty: number }> = {
  offset: number;
  optimizedTemplateIds: string[];
  weekdayGap: number;
  plannedMinutesGap: number;
  grade: RotationScoreGrade;
  generatedWindows: GeneratedScheduleWindow[];
  dailyPlannedMinutes: Array<{
    date: string;
    plannedMinutes: number;
  }>;
  advancedScore: TAdvancedScore | null;
};

type BuildRotationOffsetEvaluationInput<
  TAdvancedConstraints,
  TAdvancedScore extends { totalPenalty: number }
> = {
  existingSchedules: WorkScheduleEntity[];
  templates: WorkScheduleTemplateEntity[];
  matchedDates: string[];
  offset: number;
  employeeId: string;
  advancedConstraints: TAdvancedConstraints | undefined;
  rotateTemplatesByOffset: (
    templates: WorkScheduleTemplateEntity[],
    offset: number
  ) => WorkScheduleTemplateEntity[];
  buildRotationWindowsForTemplates: (
    templates: WorkScheduleTemplateEntity[],
    matchedDates: string[]
  ) => GeneratedScheduleWindow[];
  weekdayFromDateTime: (value: Date) => number;
  plannedMinutesForSchedule: (schedule: WorkScheduleEntity) => number;
  plannedMinutesForGeneratedWindow: (window: GeneratedScheduleWindow) => number;
  evaluateAdvancedScore: (input: {
    employeeId: string;
    optimizedTemplateIds: string[];
    generatedWindows: GeneratedScheduleWindow[];
    existingSchedules: WorkScheduleEntity[];
    advancedConstraints: TAdvancedConstraints | undefined;
  }) => TAdvancedScore | null;
  deriveRotationBalanceGrade: (
    weekdayGap: number,
    plannedMinutesGap: number
  ) => RotationScoreGrade;
};

export function buildRotationOffsetEvaluation<
  TAdvancedConstraints,
  TAdvancedScore extends { totalPenalty: number }
>(
  input: BuildRotationOffsetEvaluationInput<TAdvancedConstraints, TAdvancedScore>
): RotationOffsetEvaluation<TAdvancedScore> {
  const rotated = input.rotateTemplatesByOffset(input.templates, input.offset);
  const generatedWindows = input.buildRotationWindowsForTemplates(rotated, input.matchedDates);

  const weekdayCounts = new Array<number>(8).fill(0);
  const weekdayMinutes = new Array<number>(8).fill(0);

  for (const schedule of input.existingSchedules) {
    const weekday = input.weekdayFromDateTime(schedule.startAt);
    weekdayCounts[weekday] += 1;
    weekdayMinutes[weekday] += input.plannedMinutesForSchedule(schedule);
  }
  for (const window of generatedWindows) {
    const weekday = input.weekdayFromDateTime(window.startAt);
    const plannedMinutes = input.plannedMinutesForGeneratedWindow(window);
    weekdayCounts[weekday] += 1;
    weekdayMinutes[weekday] += plannedMinutes;
  }

  const activeWeekdays = [1, 2, 3, 4, 5, 6, 7].filter(
    (weekday) => weekdayCounts[weekday] > 0
  );
  const weekdayGap =
    activeWeekdays.length === 0
      ? 0
      : Math.max(...activeWeekdays.map((weekday) => weekdayCounts[weekday])) -
        Math.min(...activeWeekdays.map((weekday) => weekdayCounts[weekday]));
  const plannedMinutesGap =
    activeWeekdays.length === 0
      ? 0
      : Math.max(...activeWeekdays.map((weekday) => weekdayMinutes[weekday])) -
        Math.min(...activeWeekdays.map((weekday) => weekdayMinutes[weekday]));
  const dailyPlannedMinutes = generatedWindows.map((window) => ({
    date: window.date,
    plannedMinutes: input.plannedMinutesForGeneratedWindow(window)
  }));

  const optimizedTemplateIds = rotated.map((template) => template.id);
  const advancedScore = input.evaluateAdvancedScore({
    employeeId: input.employeeId,
    optimizedTemplateIds,
    generatedWindows,
    existingSchedules: input.existingSchedules,
    advancedConstraints: input.advancedConstraints
  });

  return {
    offset: input.offset,
    optimizedTemplateIds,
    weekdayGap,
    plannedMinutesGap,
    grade: input.deriveRotationBalanceGrade(weekdayGap, plannedMinutesGap),
    generatedWindows,
    dailyPlannedMinutes,
    advancedScore
  };
}

export function sortRotationOffsetEvaluations<TAdvancedScore extends { totalPenalty: number }>(
  evaluations: RotationOffsetEvaluation<TAdvancedScore>[]
) {
  return [...evaluations].sort((left, right) => {
    const leftAdvancedPenalty = left.advancedScore?.totalPenalty ?? 0;
    const rightAdvancedPenalty = right.advancedScore?.totalPenalty ?? 0;
    if (leftAdvancedPenalty !== rightAdvancedPenalty) {
      return leftAdvancedPenalty - rightAdvancedPenalty;
    }
    if (left.plannedMinutesGap !== right.plannedMinutesGap) {
      return left.plannedMinutesGap - right.plannedMinutesGap;
    }
    if (left.weekdayGap !== right.weekdayGap) {
      return left.weekdayGap - right.weekdayGap;
    }
    return left.offset - right.offset;
  });
}
