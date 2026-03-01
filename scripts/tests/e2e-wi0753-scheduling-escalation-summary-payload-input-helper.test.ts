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
    "WI-0753-scheduling-escalation-summary-payload-input-helper.md"
  );

  assert.match(
    service,
    /buildScheduleAnomalyIncidentEscalationSummaryPayloadInputFromMetaAndExecution\(\{/
  );
  assert.match(
    service,
    /buildScheduleAnomalyIncidentEscalationSummaryPayload\(escalationSummaryPayloadInput\)/
  );
  assert.match(
    helpers,
    /export function buildScheduleAnomalyIncidentEscalationSummaryPayloadInputFromMetaAndExecution/
  );

  const module = await import("../../src/features/scheduling/anomaly-incident-escalation-helpers.ts");
  const payloadInput =
    module.buildScheduleAnomalyIncidentEscalationSummaryPayloadInputFromMetaAndExecution({
      escalationMeta: {
        requestedAt: "2026-01-30T09:00:00.000Z",
        dryRun: false,
        includeResolved: false,
        includeWarning: true,
        cooldownMinutes: 120,
        escalationChannel: "email",
        state: "ACKNOWLEDGED",
        assigneeId: "emp-2",
        topN: 30,
        candidates: 11
      },
      executionSummary: {
        requested: 5,
        skippedCooldown: 4,
        failed: 2
      }
    });

  assert.equal(payloadInput.candidates, 11);
  assert.equal(payloadInput.executionSummary.requested, 5);
  assert.equal(payloadInput.executionSummary.failed, 2);

  assert.match(workItem, /WI-0753/i);
  assert.match(workItem, /scheduling|escalation|summary|payload|input|helper/i);
}

run()
  .then(() => {
    console.log("e2e-wi0753-scheduling-escalation-summary-payload-input-helper.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
