import type { DataAccess } from "@/features/shared/data-access";
import { getScheduleAnomalyIncidentReadModel } from "@/features/scheduling/incident-read-model-helpers";
import type { ScheduleAnomalyIncidentReadModel } from "@/features/scheduling/service";
import { ServiceError } from "@/features/shared/service-error";

type ResolveScheduleAnomalyIncidentForActorInput = {
  dataAccess: Pick<DataAccess, "scheduling" | "audit">;
  incidentId: string;
  tenantScope: string | null | undefined;
};

export async function resolveScheduleAnomalyIncidentForActor(
  input: ResolveScheduleAnomalyIncidentForActorInput
): Promise<ScheduleAnomalyIncidentReadModel> {
  const normalizedIncidentId = input.incidentId.trim();
  if (!normalizedIncidentId) {
    throw new ServiceError(400, "incidentId is required");
  }

  const incident = await getScheduleAnomalyIncidentReadModel(
    input.dataAccess,
    normalizedIncidentId
  );
  if (!incident) {
    throw new ServiceError(404, "anomaly incident not found");
  }

  if (input.tenantScope && incident.organizationId !== input.tenantScope) {
    throw new ServiceError(404, "anomaly incident not found");
  }

  return incident;
}

export function buildScheduleAnomalyIncidentReadAuditPayload(
  incident: Pick<ScheduleAnomalyIncidentReadModel, "incidentId" | "state" | "assigneeId" | "history">
) {
  return {
    incidentId: incident.incidentId,
    state: incident.state,
    assigneeId: incident.assigneeId,
    historyCount: incident.history.length
  };
}
