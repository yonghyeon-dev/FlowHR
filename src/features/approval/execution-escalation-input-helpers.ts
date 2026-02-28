import type { ApprovalExecutionEntity } from "@/features/shared/data-access";
import {
  calculateExecutionStalledHours,
  compareExecutionsByPriority
} from "@/features/approval/execution-escalation-core-helpers";

export function normalizeApprovalExecutionEscalationPolicy(input: {
  stalledHoursMin: number | undefined;
  limit: number | undefined;
  dryRun: boolean | undefined;
  notificationChannel: string | undefined;
}) {
  const stalledHoursMin =
    input.stalledHoursMin !== undefined ? Math.max(1, Math.min(input.stalledHoursMin, 24 * 365)) : 24;
  const limit = input.limit !== undefined ? Math.min(Math.max(input.limit, 1), 500) : 50;
  const dryRun = input.dryRun ?? false;
  const notificationChannel = input.notificationChannel?.trim() || "approval-stalled-queue";

  return {
    stalledHoursMin,
    limit,
    dryRun,
    notificationChannel
  };
}

export function selectApprovalExecutionEscalationCandidates(input: {
  executions: ApprovalExecutionEntity[];
  asOf: Date;
  stalledHoursMin: number;
  limit: number;
}) {
  const filtered = input.executions.filter(
    (execution) => calculateExecutionStalledHours(execution, input.asOf) >= input.stalledHoursMin
  );
  filtered.sort((left, right) => compareExecutionsByPriority(left, right, input.asOf));
  return filtered.slice(0, input.limit);
}
