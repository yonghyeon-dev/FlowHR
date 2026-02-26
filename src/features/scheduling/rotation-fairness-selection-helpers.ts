type DailyPlannedMinutesEntry = {
  date: string;
  plannedMinutes: number;
};

type RotationOptionLike = {
  offset: number;
  plannedMinutesGap: number;
  weekdayGap: number;
  advancedScore: {
    totalPenalty: number;
  } | null;
  dailyPlannedMinutes: DailyPlannedMinutesEntry[];
};

type EmployeeRotationEvaluationLike<TOption extends RotationOptionLike> = {
  employee: {
    id: string;
  };
  options: TOption[];
  best: TOption;
};

type RotationFairnessGlobalConstraintsLike<TObjective extends string> = {
  objective: TObjective;
  maxDailyPlannedMinutesGap: number | null;
};

type RotationFairnessAdvancedConstraintsLike = {
  preference?:
    | {
        weight: number;
      }
    | null;
  laborLaw?:
    | {
        weight: number;
      }
    | null;
};

type RotationFairnessAdvancedScoreLike = {
  preferencePenalty: number;
  laborLawPenalty: number;
  totalPenalty: number;
  preferenceMismatchCount: number;
  avoidTemplateViolationCount: number;
  minRestViolationCount: number;
  maxConsecutiveWorkDayViolationCount: number;
};

type RotationFairnessEmployeeResultLike = {
  advancedScore: RotationFairnessAdvancedScoreLike | null;
};

function addDailyPlannedMinutes(
  totals: Map<string, number>,
  entries: DailyPlannedMinutesEntry[]
) {
  for (const entry of entries) {
    totals.set(entry.date, (totals.get(entry.date) ?? 0) + entry.plannedMinutes);
  }
}

function calculateDailyPlannedMinutesGap(totals: Map<string, number>, matchedDates: string[]) {
  if (matchedDates.length === 0) {
    return 0;
  }
  const values = matchedDates.map((date) => totals.get(date) ?? 0);
  return Math.max(...values) - Math.min(...values);
}

function buildRotationFairnessGlobalSummary<TObjective extends string>(
  globalConstraints: RotationFairnessGlobalConstraintsLike<TObjective>,
  totals: Map<string, number>,
  matchedDates: string[]
) {
  const dailyPlannedMinutes = matchedDates.map((date) => ({
    date,
    plannedMinutes: totals.get(date) ?? 0
  }));
  const dailyPlannedMinutesGap = calculateDailyPlannedMinutesGap(totals, matchedDates);
  const maxDailyPlannedMinutesGap = globalConstraints.maxDailyPlannedMinutesGap;
  const thresholdBreached =
    maxDailyPlannedMinutesGap !== null && dailyPlannedMinutesGap > maxDailyPlannedMinutesGap;

  return {
    objective: globalConstraints.objective,
    dailyPlannedMinutesGap,
    maxDailyPlannedMinutesGap,
    thresholdBreached,
    dailyPlannedMinutes
  };
}

export function selectRotationFairnessRecommendations<
  TOption extends RotationOptionLike,
  TObjective extends string
>(
  evaluations: Array<EmployeeRotationEvaluationLike<TOption>>,
  matchedDates: string[],
  globalConstraints: RotationFairnessGlobalConstraintsLike<TObjective> | undefined
): {
  selectedByEmployeeId: Map<string, TOption>;
  global: ReturnType<typeof buildRotationFairnessGlobalSummary<TObjective>> | null;
} {
  const selectedByEmployeeId = new Map<string, TOption>();
  if (!globalConstraints) {
    for (const evaluation of evaluations) {
      selectedByEmployeeId.set(evaluation.employee.id, evaluation.best);
    }
    return {
      selectedByEmployeeId,
      global: null
    };
  }

  const ordered = [...evaluations].sort((left, right) => left.employee.id.localeCompare(right.employee.id));
  const totals = new Map<string, number>();

  for (const evaluation of ordered) {
    let bestOption = evaluation.options[0];
    let bestGap = Number.POSITIVE_INFINITY;
    let bestLocalPenalty = Number.POSITIVE_INFINITY;

    for (const option of evaluation.options) {
      const candidateTotals = new Map(totals);
      addDailyPlannedMinutes(candidateTotals, option.dailyPlannedMinutes);
      const gap = calculateDailyPlannedMinutesGap(candidateTotals, matchedDates);
      const localPenalty =
        option.plannedMinutesGap * 10 + option.weekdayGap + (option.advancedScore?.totalPenalty ?? 0);

      if (gap < bestGap) {
        bestOption = option;
        bestGap = gap;
        bestLocalPenalty = localPenalty;
        continue;
      }

      if (gap === bestGap && localPenalty < bestLocalPenalty) {
        bestOption = option;
        bestLocalPenalty = localPenalty;
        continue;
      }

      if (gap === bestGap && localPenalty === bestLocalPenalty && option.offset < bestOption.offset) {
        bestOption = option;
      }
    }

    selectedByEmployeeId.set(evaluation.employee.id, bestOption);
    addDailyPlannedMinutes(totals, bestOption.dailyPlannedMinutes);
  }

  return {
    selectedByEmployeeId,
    global: buildRotationFairnessGlobalSummary(globalConstraints, totals, matchedDates)
  };
}

export function buildRotationFairnessAdvancedSummary(
  results: RotationFairnessEmployeeResultLike[],
  advancedConstraints: RotationFairnessAdvancedConstraintsLike | undefined
) {
  if (!advancedConstraints) {
    return null;
  }

  const totals = {
    totalPreferencePenalty: 0,
    totalLaborLawPenalty: 0,
    totalPenalty: 0,
    totalPreferenceMismatchCount: 0,
    totalAvoidTemplateViolationCount: 0,
    totalMinRestViolationCount: 0,
    totalMaxConsecutiveWorkDayViolationCount: 0
  };

  for (const result of results) {
    const advancedScore = result.advancedScore;
    if (!advancedScore) {
      continue;
    }
    totals.totalPreferencePenalty += advancedScore.preferencePenalty;
    totals.totalLaborLawPenalty += advancedScore.laborLawPenalty;
    totals.totalPenalty += advancedScore.totalPenalty;
    totals.totalPreferenceMismatchCount += advancedScore.preferenceMismatchCount;
    totals.totalAvoidTemplateViolationCount += advancedScore.avoidTemplateViolationCount;
    totals.totalMinRestViolationCount += advancedScore.minRestViolationCount;
    totals.totalMaxConsecutiveWorkDayViolationCount += advancedScore.maxConsecutiveWorkDayViolationCount;
  }

  return {
    enabled: true,
    preferenceWeight: advancedConstraints.preference?.weight ?? null,
    laborLawWeight: advancedConstraints.laborLaw?.weight ?? null,
    ...totals
  };
}
