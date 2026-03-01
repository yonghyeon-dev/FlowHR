import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const autoActionHelpers = readUtf8(
    "src",
    "features",
    "scheduling",
    "anomaly-incident-auto-action-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0725-scheduling-auto-action-notify-event-payload-helper.md"
  );

  assert.match(
    autoActionHelpers,
    /export function buildScheduleAnomalyIncidentAutoActionExecutedEventPayload/
  );
  assert.match(autoActionHelpers, /buildScheduleAnomalyIncidentAutoActionExecutedEventPayload\(\{/);

  const module = await import("../../src/features/scheduling/anomaly-incident-auto-action-helpers.ts");

  const payload = module.buildScheduleAnomalyIncidentAutoActionExecutedEventPayload({
    summaryPayload: {
      executedAt: "2026-01-07T09:00:00.000Z",
      candidates: 4,
      assigned: 2
    },
    items: [
      {
        incidentId: "INC-1",
        state: "ASSIGNED",
        status: "BREACHED",
        escalationDecision: "REQUESTED",
        previousAssigneeId: null,
        assignedAssigneeId: "admin-1",
        decision: "ASSIGNED",
        reason: null
      }
    ]
  });

  const recordPayload = payload as Record<string, unknown>;
  assert.equal(recordPayload.executedAt, "2026-01-07T09:00:00.000Z");
  assert.equal(recordPayload.candidates, 4);
  assert.ok(Array.isArray(payload.items));
  assert.equal(payload.items.length, 1);
  assert.equal(payload.items[0].incidentId, "INC-1");

  assert.match(workItem, /WI-0725/i);
  assert.match(workItem, /scheduling|auto action|notify|event|payload|helper/i);
}

run()
  .then(() => {
    console.log("e2e-wi0725-scheduling-auto-action-notify-event-payload-helper.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
