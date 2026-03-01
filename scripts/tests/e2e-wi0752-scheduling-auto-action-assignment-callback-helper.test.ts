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
    "anomaly-incident-auto-action-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0752-scheduling-auto-action-assignment-callback-helper.md"
  );

  assert.match(service, /buildScheduleAnomalyIncidentAutoActionAssignIncidentCallback\(\{/);
  assert.match(service, /assignIncident:\s*assignAutoActionIncident/);
  assert.match(
    helpers,
    /export function buildScheduleAnomalyIncidentAutoActionAssignIncidentCallback/
  );

  const module = await import("../../src/features/scheduling/anomaly-incident-auto-action-helpers.ts");
  const calls: Array<{ incidentId: string; assigneeId: string; note: string | undefined }> = [];

  const callback = module.buildScheduleAnomalyIncidentAutoActionAssignIncidentCallback({
    autoAssigneeId: "emp-auto",
    autoAssignNote: "auto-note",
    updateLifecycle: async (input) => {
      calls.push(input);
      return { state: "ASSIGNED", assigneeId: input.assigneeId };
    }
  });

  const result = await callback({
    incidentId: "INC-AUTO-2",
    previousAssigneeId: null,
    escalationDecision: "REQUESTED"
  });

  assert.deepEqual(result, { state: "ASSIGNED", assigneeId: "emp-auto" });
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], {
    incidentId: "INC-AUTO-2",
    assigneeId: "emp-auto",
    note: "auto-note"
  });

  assert.match(workItem, /WI-0752/i);
  assert.match(workItem, /scheduling|auto|action|assignment|callback|helper/i);
}

run()
  .then(() => {
    console.log("e2e-wi0752-scheduling-auto-action-assignment-callback-helper.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
