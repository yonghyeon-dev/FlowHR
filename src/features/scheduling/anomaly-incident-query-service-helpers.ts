import { buildAnomalyIncidentListAuditPayload } from "@/features/scheduling/anomaly-incident-core-helpers";
import { buildScheduleAnomalyIncidentListResult } from "@/features/scheduling/anomaly-incident-list-helpers";
import {
  buildScheduleAnomalyIncidentReadAuditPayload,
  resolveScheduleAnomalyIncidentForActor
} from "@/features/scheduling/anomaly-incident-read-helpers";
import { normalizeIncidentListTopN } from "@/features/scheduling/incident-normalizers";
import {
  cloneScheduleAnomalyIncidentReadModel,
  listScheduleAnomalyIncidentReadModels
} from "@/features/scheduling/incident-read-model-helpers";
import {
  requireSchedulingWriteActor,
  resolveSchedulingTenantScope
} from "@/features/scheduling/anomaly-service-context-helpers";
import type {
  ListScheduleAnomalyIncidentsInput,
  ScheduleAnomalyIncidentListResult,
  ScheduleAnomalyIncidentReadModel,
  ServiceContext
} from "@/features/scheduling/service";

export async function listScheduleAnomalyIncidentsFromHelper(
  context: ServiceContext,
  input: ListScheduleAnomalyIncidentsInput
): Promise<ScheduleAnomalyIncidentListResult> {
  const actor = await requireSchedulingWriteActor(
    context,
    "schedule anomaly incident list requires permission"
  );

  const topN = normalizeIncidentListTopN(input.topN);
  const tenantScope = resolveSchedulingTenantScope(actor);
  const assigneeId = input.assigneeId?.trim();

  const readModels = await listScheduleAnomalyIncidentReadModels(context.dataAccess, {
    organizationId: tenantScope
  });
  const { total, items } = buildScheduleAnomalyIncidentListResult({
    readModels,
    topN,
    state: input.state,
    assigneeId
  });

  await context.dataAccess.audit.append({
    action: "scheduling.anomaly.incident.listed",
    entityType: "WorkSchedule",
    organizationId: tenantScope,
    actorRole: actor.role,
    actorId: actor.id,
    payload: buildAnomalyIncidentListAuditPayload({
      state: input.state,
      assigneeId: assigneeId ?? null,
      topN,
      total,
      returned: items.length
    })
  });

  return {
    total,
    items
  };
}

export async function getScheduleAnomalyIncidentFromHelper(
  context: ServiceContext,
  incidentId: string
): Promise<ScheduleAnomalyIncidentReadModel> {
  const actor = await requireSchedulingWriteActor(
    context,
    "schedule anomaly incident read requires permission"
  );
  const tenantScope = resolveSchedulingTenantScope(actor);
  const incident = await resolveScheduleAnomalyIncidentForActor({
    dataAccess: context.dataAccess,
    incidentId,
    tenantScope
  });

  await context.dataAccess.audit.append({
    action: "scheduling.anomaly.incident.read",
    entityType: "WorkSchedule",
    entityId: incident.incidentId,
    organizationId: incident.organizationId,
    actorRole: actor.role,
    actorId: actor.id,
    payload: buildScheduleAnomalyIncidentReadAuditPayload(incident)
  });

  return cloneScheduleAnomalyIncidentReadModel(incident);
}
