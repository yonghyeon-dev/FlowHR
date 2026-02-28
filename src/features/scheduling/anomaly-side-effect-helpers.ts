import type { Actor } from "@/lib/actor";
import {
  buildAnomalyAlertPayload,
  buildAnomalyEscalationPayload,
  buildAnomalyTicketRequestPayload,
  isSchedulingAnomalyAlertsEnabled,
  isSchedulingAnomalyEscalationEnabled,
  isSchedulingAnomalyTicketAutomationEnabled,
  parseAnomalySeverityFromEnv,
  parsePositiveIntegerRangeFromEnv,
  type AnomalyAlertInputWindow
} from "@/features/scheduling/anomaly-automation-helpers";
import type {
  ScheduleAnomalyCockpitQueueEntry,
  ScheduleAttendanceAnomaly
} from "@/features/scheduling/anomaly-report-helpers";
import type { DataAccess } from "@/features/shared/data-access";
import type { DomainEventPublisher } from "@/features/shared/domain-event-publisher";

type ScheduleAnomalySideEffectContext = {
  actor: Pick<Actor, "id" | "role">;
  tenantScope?: string;
  dataAccess: Pick<DataAccess, "audit">;
  publish: DomainEventPublisher["publish"];
};

export function buildScheduleAnomalySideEffectContext(input: {
  actor: Pick<Actor, "id" | "role">;
  tenantScope?: string;
  dataAccess: Pick<DataAccess, "audit">;
  publish: DomainEventPublisher["publish"];
}): ScheduleAnomalySideEffectContext {
  return {
    actor: input.actor,
    tenantScope: input.tenantScope,
    dataAccess: input.dataAccess,
    publish: input.publish
  };
}

type ScheduleAnomalySummaryInput = {
  window: AnomalyAlertInputWindow;
  lateThresholdMinutes: number;
  evaluatedSchedules: number;
  anomalies: ScheduleAttendanceAnomaly[];
  lateCount: number;
  noShowCount: number;
};

export function buildScheduleAnomalySummarySideEffectInput(
  input: ScheduleAnomalySummaryInput
): ScheduleAnomalySummaryInput {
  return {
    window: input.window,
    lateThresholdMinutes: input.lateThresholdMinutes,
    evaluatedSchedules: input.evaluatedSchedules,
    anomalies: input.anomalies,
    lateCount: input.lateCount,
    noShowCount: input.noShowCount
  };
}

type ScheduleAnomalyTicketInput = {
  window: { periodStart: Date; periodEnd: Date };
  lateThresholdMinutes: number;
  topN: number;
  queue: ScheduleAnomalyCockpitQueueEntry[];
};

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "unknown error";
}

async function appendNonBlockingAudit(
  context: ScheduleAnomalySideEffectContext,
  action: string,
  payload: Record<string, unknown>
) {
  try {
    await context.dataAccess.audit.append({
      action,
      entityType: "WorkSchedule",
      organizationId: context.tenantScope,
      actorRole: context.actor.role,
      actorId: context.actor.id,
      payload
    });
  } catch {
    // Non-blocking path: do not fail anomaly APIs on side-effects.
  }
}

export async function emitAnomalyAlertIfEnabled(
  context: ScheduleAnomalySideEffectContext,
  input: ScheduleAnomalySummaryInput
) {
  if (!isSchedulingAnomalyAlertsEnabled() || input.anomalies.length === 0) {
    return;
  }

  const payload = buildAnomalyAlertPayload(
    input.window,
    input.lateThresholdMinutes,
    input.evaluatedSchedules,
    input.anomalies,
    input.lateCount,
    input.noShowCount
  );

  try {
    await context.publish({
      name: "scheduling.anomaly.detected.v1",
      occurredAt: new Date().toISOString(),
      entityType: "WorkSchedule",
      actorRole: context.actor.role,
      actorId: context.actor.id,
      payload
    });

    await appendNonBlockingAudit(context, "scheduling.anomaly.alert.triggered", payload);
  } catch (error) {
    await appendNonBlockingAudit(context, "scheduling.anomaly.alert.failed", {
      ...payload,
      error: toErrorMessage(error)
    });
  }
}

export async function emitAnomalyEscalationIfEnabled(
  context: ScheduleAnomalySideEffectContext,
  input: ScheduleAnomalySummaryInput
) {
  if (!isSchedulingAnomalyEscalationEnabled() || input.anomalies.length === 0) {
    return;
  }

  const payload = buildAnomalyEscalationPayload(
    input.window,
    input.lateThresholdMinutes,
    input.evaluatedSchedules,
    input.anomalies,
    input.lateCount,
    input.noShowCount
  );

  try {
    await context.publish({
      name: "scheduling.anomaly.escalated.v1",
      occurredAt: new Date().toISOString(),
      entityType: "WorkSchedule",
      actorRole: context.actor.role,
      actorId: context.actor.id,
      payload
    });

    await appendNonBlockingAudit(context, "scheduling.anomaly.escalation.triggered", payload);
  } catch (error) {
    await appendNonBlockingAudit(context, "scheduling.anomaly.escalation.failed", {
      ...payload,
      error: toErrorMessage(error)
    });
  }
}

export async function emitAnomalySummarySideEffects(
  context: ScheduleAnomalySideEffectContext,
  input: ScheduleAnomalySummaryInput
) {
  await emitAnomalyAlertIfEnabled(context, input);
  await emitAnomalyEscalationIfEnabled(context, input);
}

export async function emitAnomalyCockpitTicketRequestsIfEnabled(
  context: ScheduleAnomalySideEffectContext,
  input: ScheduleAnomalyTicketInput
) {
  if (!isSchedulingAnomalyTicketAutomationEnabled() || input.queue.length === 0) {
    return;
  }

  const contextName = "scheduling anomaly ticket automation";
  try {
    const minSeverity = parseAnomalySeverityFromEnv(
      process.env.FLOWHR_SCHEDULING_ANOMALY_TICKET_MIN_SEVERITY ??
        process.env.SCHEDULING_ANOMALY_TICKET_MIN_SEVERITY,
      "CRITICAL",
      "FLOWHR_SCHEDULING_ANOMALY_TICKET_MIN_SEVERITY",
      contextName
    );

    const maxPerRun = parsePositiveIntegerRangeFromEnv(
      process.env.FLOWHR_SCHEDULING_ANOMALY_TICKET_MAX_PER_RUN ??
        process.env.SCHEDULING_ANOMALY_TICKET_MAX_PER_RUN,
      20,
      1,
      200,
      "FLOWHR_SCHEDULING_ANOMALY_TICKET_MAX_PER_RUN",
      contextName
    );

    const payload = buildAnomalyTicketRequestPayload(
      input.window,
      input.lateThresholdMinutes,
      input.topN,
      input.queue,
      minSeverity,
      maxPerRun
    );
    if (payload.requestedCount === 0) {
      return;
    }

    await context.publish({
      name: "scheduling.anomaly.ticket.requested.v1",
      occurredAt: new Date().toISOString(),
      entityType: "WorkSchedule",
      actorRole: context.actor.role,
      actorId: context.actor.id,
      payload
    });

    await appendNonBlockingAudit(context, "scheduling.anomaly.ticket.requested", payload);
  } catch (error) {
    await appendNonBlockingAudit(context, "scheduling.anomaly.ticket.request.failed", {
      periodStart: input.window.periodStart.toISOString(),
      periodEnd: input.window.periodEnd.toISOString(),
      lateThresholdMinutes: input.lateThresholdMinutes,
      topN: input.topN,
      error: toErrorMessage(error)
    });
  }
}
