import type {
  EmployeeEntity,
  WorkScheduleEntity,
  WorkScheduleTemplateEntity
} from "@/features/shared/data-access";
import {
  deriveRotationBalanceGrade,
  evaluateRotationFairnessAdvancedScore,
  plannedMinutesForGeneratedWindow,
  plannedMinutesForSchedule
} from "@/features/scheduling/rotation-fairness-core-helpers";
import {
  buildRotationOffsetEvaluation,
  sortRotationOffsetEvaluations
} from "@/features/scheduling/rotation-optimization-evaluation-helpers";
import {
  evaluateEmployeeRotationOptimization,
  type EmployeeRotationOptimizationEvaluation as EmployeeRotationOptimizationEvaluationBase
} from "@/features/scheduling/rotation-employee-optimization-helpers";
import { weekdayFromKstDateTime } from "@/features/scheduling/template-date-helpers";
import {
  buildRotationWindowsForTemplates,
  rotateTemplatesByOffset
} from "@/features/scheduling/rotation-window-helpers";
import type {
  RotationFairnessAdvancedConstraints,
  RotationFairnessAdvancedScore
} from "@/features/scheduling/helpers/service-types";

export type EmployeeRotationOptimizationEvaluation =
  EmployeeRotationOptimizationEvaluationBase<RotationFairnessAdvancedScore>;

type EvaluateBestRotationForEmployeeInput = {
  employee: EmployeeEntity;
  fromDate: string;
  toDate: string;
  templates: WorkScheduleTemplateEntity[];
  matchedDates: string[];
  advancedConstraints: RotationFairnessAdvancedConstraints | undefined;
  listExistingSchedules: (input: {
    periodStart: Date;
    periodEnd: Date;
    employeeId: string;
  }) => Promise<WorkScheduleEntity[]>;
};

export async function evaluateBestRotationForEmployee(
  input: EvaluateBestRotationForEmployeeInput
): Promise<EmployeeRotationOptimizationEvaluation> {
  return evaluateEmployeeRotationOptimization({
    employee: input.employee,
    fromDate: input.fromDate,
    toDate: input.toDate,
    templates: input.templates,
    matchedDates: input.matchedDates,
    advancedConstraints: input.advancedConstraints,
    listExistingSchedules: input.listExistingSchedules,
    buildRotationOffsetEvaluation: (evaluationInput) =>
      buildRotationOffsetEvaluation({
        existingSchedules: evaluationInput.existingSchedules,
        templates: evaluationInput.templates,
        matchedDates: evaluationInput.matchedDates,
        offset: evaluationInput.offset,
        employeeId: evaluationInput.employeeId,
        advancedConstraints: evaluationInput.advancedConstraints,
        rotateTemplatesByOffset,
        buildRotationWindowsForTemplates,
        weekdayFromDateTime: weekdayFromKstDateTime,
        plannedMinutesForSchedule,
        plannedMinutesForGeneratedWindow,
        evaluateAdvancedScore: (advancedEvaluationInput) =>
          evaluateRotationFairnessAdvancedScore(
            advancedEvaluationInput.employeeId,
            {
              optimizedTemplateIds: advancedEvaluationInput.optimizedTemplateIds,
              generatedWindows: advancedEvaluationInput.generatedWindows
            },
            advancedEvaluationInput.existingSchedules,
            advancedEvaluationInput.advancedConstraints
          ),
        deriveRotationBalanceGrade
      }),
    sortRotationOffsetEvaluations
  });
}
