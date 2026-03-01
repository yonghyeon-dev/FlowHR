import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const service = readUtf8("src", "features", "scheduling", "service.ts");
  const helpers = readUtf8(
    "src",
    "features",
    "scheduling",
    "anomaly-incident-escalation-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0721-scheduling-escalation-request-side-effect-helper.md"
  );

  assert.match(service, /buildScheduleAnomalyIncidentEscalationRequestedAuditEntry\(/);
  assert.match(service, /buildScheduleAnomalyIncidentEscalationRequestFailedAuditEntry\(/);
  assert.doesNotMatch(service, /action:\s*"scheduling\.anomaly\.incident\.escalation\.requested"/);
  assert.doesNotMatch(service, /action:\s*"scheduling\.anomaly\.incident\.escalation\.request\.failed"/);

  assert.match(helpers, /export function buildScheduleAnomalyIncidentEscalationRequestedAuditEntry/);
  assert.match(helpers, /export function buildScheduleAnomalyIncidentEscalationRequestFailedAuditEntry/);

  const module = await import(
    "../../src/features/scheduling/anomaly-incident-escalation-helpers.ts"
  );

  const requestedPayload = module.buildScheduleAnomalyIncidentEscalationRequestPayload({
    candidate: {
      incidentId: "INC-REQ-001",
      state: "ACKNOWLEDGED",
      status: "BREACHED",
      elapsedMinutes: 41,
      assigneeId: "admin-1",
      updatedAt: "2026-01-03T08:41:00.000Z",
      slaTargetMinutes: 30,
      warningMinutes: 20,
      updatedBy: {
        actorId: "admin-1",
        actorRole: "ADMIN"
      },
      historyCount: 2
    },
    cooldownMinutes: 30,
    escalationChannel: "MANAGER_ON_CALL",
    requestedAt: "2026-01-03T09:00:00.000Z"
  });

  const requestedAudit = module.buildScheduleAnomalyIncidentEscalationRequestedAuditEntry({
    organizationId: "org-1",
    actorRole: "ADMIN",
    actorId: "admin-1",
    payload: requestedPayload
  });

  assert.equal(requestedAudit.action, "scheduling.anomaly.incident.escalation.requested");
  assert.equal(requestedAudit.entityId, "INC-REQ-001");
  assert.equal(requestedAudit.organizationId, "org-1");

  const failedPayload = module.buildScheduleAnomalyIncidentEscalationRequestFailedPayload({
    candidate: {
      incidentId: "INC-REQ-001",
      state: "ACKNOWLEDGED",
      status: "BREACHED",
      elapsedMinutes: 41,
      assigneeId: "admin-1",
      updatedAt: "2026-01-03T08:41:00.000Z",
      slaTargetMinutes: 30,
      warningMinutes: 20,
      updatedBy: {
        actorId: "admin-1",
        actorRole: "ADMIN"
      },
      historyCount: 2
    },
    cooldownMinutes: 30,
    escalationChannel: "MANAGER_ON_CALL",
    error: "publish failed"
  });

  const failedAudit = module.buildScheduleAnomalyIncidentEscalationRequestFailedAuditEntry({
    organizationId: "org-1",
    actorRole: "ADMIN",
    actorId: "admin-1",
    payload: failedPayload
  });

  assert.equal(failedAudit.action, "scheduling.anomaly.incident.escalation.request.failed");
  assert.equal(failedAudit.entityId, "INC-REQ-001");
  assert.equal(failedAudit.payload.error, "publish failed");

  assert.match(workItem, /WI-0721/i);
  assert.match(workItem, /scheduling|escalation|request|side|effect|helper/i);
}

run()
  .then(() => {
    console.log("e2e-wi0721-scheduling-escalation-request-side-effect-helper.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
