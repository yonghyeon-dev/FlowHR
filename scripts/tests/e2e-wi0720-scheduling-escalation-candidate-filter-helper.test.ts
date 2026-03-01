import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const service = readUtf8("src", "features", "scheduling", "service.ts");
  const escalationHelpers = readUtf8(
    "src",
    "features",
    "scheduling",
    "anomaly-incident-escalation-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0720-scheduling-escalation-candidate-filter-helper.md"
  );

  assert.match(service, /resolveScheduleAnomalyIncidentEscalationExecutionPreparation\(\{/);
  assert.doesNotMatch(service, /selectScheduleAnomalyIncidentEscalationCandidates\(/);
  assert.doesNotMatch(
    service,
    /resolveScheduleAnomalyIncidentEscalationCooldownWindowStartMillis\(asOf, cooldownMinutes\)/
  );

  assert.match(
    escalationHelpers,
    /export function resolveScheduleAnomalyIncidentEscalationExecutionPreparation/
  );
  assert.match(escalationHelpers, /candidateCount:\s*candidates\.length/);

  const module = await import(
    "../../src/features/scheduling/anomaly-incident-escalation-helpers.ts"
  );

  const prepared = module.resolveScheduleAnomalyIncidentEscalationExecutionPreparation({
    items: [
      {
        incidentId: "INC-BREACHED",
        state: "ACKNOWLEDGED",
        status: "BREACHED",
        elapsedMinutes: 44,
        assigneeId: null,
        updatedAt: "2026-01-02T08:40:00.000Z",
        slaTargetMinutes: 30,
        warningMinutes: 20,
        updatedBy: {
          actorId: "admin-1",
          actorRole: "ADMIN"
        },
        historyCount: 1
      },
      {
        incidentId: "INC-WARNING",
        state: "ACKNOWLEDGED",
        status: "WARNING",
        elapsedMinutes: 25,
        assigneeId: "admin-1",
        updatedAt: "2026-01-02T08:25:00.000Z",
        slaTargetMinutes: 30,
        warningMinutes: 20,
        updatedBy: {
          actorId: "admin-1",
          actorRole: "ADMIN"
        },
        historyCount: 1
      }
    ],
    includeWarning: false,
    asOf: new Date("2026-01-02T09:00:00.000Z"),
    cooldownMinutes: 30,
    storedIncidents: [
      {
        incidentId: "INC-BREACHED",
        lastEscalationRequestedAt: "2026-01-02T08:55:00.000Z"
      },
      {
        incidentId: "INC-WARNING",
        lastEscalationRequestedAt: null
      }
    ]
  });

  assert.equal(prepared.candidates.length, 1);
  assert.equal(prepared.candidateCount, 1);
  assert.equal(prepared.candidates[0].incidentId, "INC-BREACHED");
  assert.equal(prepared.cooldownWindowStartMillis, Date.parse("2026-01-02T08:30:00.000Z"));
  assert.equal(prepared.latestRequestedAtMillisByIncident.get("INC-BREACHED"), Date.parse("2026-01-02T08:55:00.000Z"));

  assert.match(workItem, /WI-0720/i);
  assert.match(workItem, /scheduling|escalation|candidate|filter|helper/i);
}

run()
  .then(() => {
    console.log("e2e-wi0720-scheduling-escalation-candidate-filter-helper.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
