import {
  DEFAULT_APPROVAL_ESCALATION_LIMIT,
  DEFAULT_APPROVAL_ESCALATION_NOTIFICATION_CHANNEL,
  DEFAULT_APPROVAL_ESCALATION_STALLED_HOURS_MIN
} from "@/features/approval/escalation-settings";
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
  defaults?: {
    stalledHoursMin: number;
    limit: number;
    notificationChannel: string;
  };
}) {
  const stalledHoursMin =
    input.stalledHoursMin !== undefined
      ? Math.max(1, Math.min(input.stalledHoursMin, 24 * 365))
      : Math.max(
          1,
          Math.min(
            input.defaults?.stalledHoursMin ?? DEFAULT_APPROVAL_ESCALATION_STALLED_HOURS_MIN,
            24 * 365
          )
        );
  const limit =
    input.limit !== undefined
      ? Math.min(Math.max(input.limit, 1), 500)
      : Math.min(Math.max(input.defaults?.limit ?? DEFAULT_APPROVAL_ESCALATION_LIMIT, 1), 500);
  const dryRun = input.dryRun ?? false;
  const notificationChannel =
    input.notificationChannel?.trim() ||
    input.defaults?.notificationChannel.trim() ||
    DEFAULT_APPROVAL_ESCALATION_NOTIFICATION_CHANNEL;

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
