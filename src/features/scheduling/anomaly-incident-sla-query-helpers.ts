import {
  normalizeIncidentListTopN,
  resolveAnomalyIncidentSlaTargetMinutes,
  resolveAnomalyIncidentWarningMinutes
} from "@/features/scheduling/incident-normalizers";

type ScheduleAnomalyIncidentSlaQueryInput = {
  topN?: number;
  assigneeId?: string;
  includeResolved?: boolean;
  slaTargetMinutes?: number;
  warningMinutes?: number;
  asOf?: Date;
};

export function resolveScheduleAnomalyIncidentSlaQueryInput(
  input: ScheduleAnomalyIncidentSlaQueryInput
) {
  const topN = normalizeIncidentListTopN(input.topN);
  const assigneeId = input.assigneeId?.trim();
  const includeResolved = input.includeResolved ?? false;
  const slaTargetMinutes = resolveAnomalyIncidentSlaTargetMinutes(input.slaTargetMinutes);
  const warningMinutes = resolveAnomalyIncidentWarningMinutes(input.warningMinutes, slaTargetMinutes);
  const asOf = input.asOf ?? new Date();

  return {
    topN,
    assigneeId,
    includeResolved,
    slaTargetMinutes,
    warningMinutes,
    asOf,
    asOfMillis: asOf.getTime()
  };
}
