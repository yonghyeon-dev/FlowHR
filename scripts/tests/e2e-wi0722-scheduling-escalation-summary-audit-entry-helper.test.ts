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
    "WI-0722-scheduling-escalation-summary-audit-entry-helper.md"
  );

  assert.match(service, /buildScheduleAnomalyIncidentEscalationGeneratedAuditEntry\(/);
  assert.doesNotMatch(service, /action:\s*"scheduling\.anomaly\.incident\.escalation\.generated"/);

  assert.match(helpers, /export function buildScheduleAnomalyIncidentEscalationGeneratedAuditEntry/);

  const module = await import(
    "../../src/features/scheduling/anomaly-incident-escalation-helpers.ts"
  );

  const payload = module.buildScheduleAnomalyIncidentEscalationSummaryPayload({
    requestedAt: "2026-01-04T09:10:00.000Z",
    dryRun: true,
    includeResolved: false,
    includeWarning: true,
    cooldownMinutes: 30,
    escalationChannel: "MANAGER_ON_CALL",
    state: "ACKNOWLEDGED",
    assigneeId: "admin-1",
    topN: 25,
    candidates: 5,
    executionSummary: {
      requested: 0,
      skippedCooldown: 3,
      failed: 0
    }
  });

  const auditEntry = module.buildScheduleAnomalyIncidentEscalationGeneratedAuditEntry({
    organizationId: "org-1",
    actorRole: "ADMIN",
    actorId: "admin-1",
    payload
  });

  assert.equal(auditEntry.action, "scheduling.anomaly.incident.escalation.generated");
  assert.equal(auditEntry.entityType, "WorkSchedule");
  assert.equal(auditEntry.organizationId, "org-1");
  assert.equal(auditEntry.payload.candidates, 5);

  assert.match(workItem, /WI-0722/i);
  assert.match(workItem, /scheduling|escalation|summary|audit|entry|helper/i);
}

run()
  .then(() => {
    console.log("e2e-wi0722-scheduling-escalation-summary-audit-entry-helper.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
