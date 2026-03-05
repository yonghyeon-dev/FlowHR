type RotationAssignmentPayloadInput = {
  employeeId: string;
  templateIds: string[];
  fromDate: string;
  toDate: string;
  matchedDates: string[];
  createdScheduleIds: string[];
};

type RotationAssignmentAuditEntryInput = RotationAssignmentPayloadInput & {
  organizationId?: string;
  actorRole: string;
  actorId: string;
};

type RotationAssignmentEventInput = RotationAssignmentPayloadInput & {
  actorRole: string;
  actorId: string;
};

function buildRotationAssignmentPayload(input: RotationAssignmentPayloadInput) {
  return {
    employeeId: input.employeeId,
    templateIds: input.templateIds,
    fromDate: input.fromDate,
    toDate: input.toDate,
    matchedDates: input.matchedDates,
    createdScheduleIds: input.createdScheduleIds,
    createdCount: input.createdScheduleIds.length
  };
}

export function buildRotationAssignmentAuditEntry(input: RotationAssignmentAuditEntryInput) {
  return {
    action: "scheduling.rotation.assigned",
    entityType: "WorkSchedule",
    organizationId: input.organizationId,
    actorRole: input.actorRole,
    actorId: input.actorId,
    payload: buildRotationAssignmentPayload(input)
  };
}

export function buildRotationAssignmentEvent(input: RotationAssignmentEventInput): DomainEvent {
  return {
    name: "scheduling.rotation.assigned.v1",
    occurredAt: new Date().toISOString(),
    entityType: "WorkSchedule",
    actorRole: input.actorRole,
    actorId: input.actorId,
    payload: buildRotationAssignmentPayload(input)
  };
}
