import type {
  EmployeeEntity,
  WorkScheduleEntity,
  WorkScheduleTemplateEntity
} from "@/features/shared/data-access";
import { ServiceError } from "@/features/shared/service-error";
import type { RotationOffsetEvaluation } from "@/features/scheduling/rotation-optimization-evaluation-helpers";
import { parseDateToKstBase } from "@/features/scheduling/template-date-helpers";

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
};

type ListExistingSchedulesInput = {
  periodStart: Date;
  periodEnd: Date;
  employeeId: string;
};

export type EmployeeRotationOptimizationEvaluation<TAdvancedScore extends { totalPenalty: number }> = {
  employee: EmployeeEntity;
  options: RotationOffsetEvaluation<TAdvancedScore>[];
  best: RotationOffsetEvaluation<TAdvancedScore>;
};

type EvaluateEmployeeRotationOptimizationInput<
  TAdvancedConstraints,
  TAdvancedScore extends { totalPenalty: number }
> = {
  employee: EmployeeEntity;
  fromDate: string;
  toDate: string;
  templates: WorkScheduleTemplateEntity[];
  matchedDates: string[];
  advancedConstraints: TAdvancedConstraints | undefined;
  listExistingSchedules: (input: ListExistingSchedulesInput) => Promise<WorkScheduleEntity[]>;
  buildRotationOffsetEvaluation: (
    input: BuildRotationOffsetEvaluationInput<TAdvancedConstraints, TAdvancedScore>
  ) => RotationOffsetEvaluation<TAdvancedScore>;
  sortRotationOffsetEvaluations: (
    evaluations: RotationOffsetEvaluation<TAdvancedScore>[]
  ) => RotationOffsetEvaluation<TAdvancedScore>[];
};

export async function evaluateEmployeeRotationOptimization<
  TAdvancedConstraints,
  TAdvancedScore extends { totalPenalty: number }
>(
  input: EvaluateEmployeeRotationOptimizationInput<TAdvancedConstraints, TAdvancedScore>
): Promise<EmployeeRotationOptimizationEvaluation<TAdvancedScore>> {
  for (const template of input.templates) {
    if (!input.employee.organizationId || input.employee.organizationId !== template.organizationId) {
      throw new ServiceError(409, "template organization and employee organization must match", {
        templateId: template.id,
        employeeId: input.employee.id
      });
    }
  }

  const periodStart = parseDateToKstBase(input.fromDate);
  const periodEnd = new Date(parseDateToKstBase(input.toDate).getTime() + 24 * 60 * 60 * 1000);
  const existingSchedules = await input.listExistingSchedules({
    periodStart,
    periodEnd,
    employeeId: input.employee.id
  });

  const evaluations = input.templates.map((_, offset) =>
    input.buildRotationOffsetEvaluation({
      existingSchedules,
      templates: input.templates,
      matchedDates: input.matchedDates,
      offset,
      employeeId: input.employee.id,
      advancedConstraints: input.advancedConstraints
    })
  );
  const rankedEvaluations = input.sortRotationOffsetEvaluations(evaluations);
  if (rankedEvaluations.length === 0) {
    throw new ServiceError(400, "at least one rotation template is required");
  }

  return {
    employee: input.employee,
    options: rankedEvaluations,
    best: rankedEvaluations[0]
  };
}
