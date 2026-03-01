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
    "anomaly-incident-reconcile-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0747-scheduling-reconcile-snapshot-input-helper.md"
  );

  assert.match(service, /buildScheduleAnomalyIncidentReconcileSnapshotInputFromRows\(\{/);
  assert.match(
    helpers,
    /export function buildScheduleAnomalyIncidentReconcileSnapshotInputFromRows/
  );

  const module = await import("../../src/features/scheduling/anomaly-incident-reconcile-helpers.ts");
  const input = module.buildScheduleAnomalyIncidentReconcileSnapshotInputFromRows({
    storeRows: [
      {
        incidentId: "INC-1",
        state: "ACKNOWLEDGED",
        assigneeId: "manager",
        resolutionCode: null,
        note: "a",
        updatedAt: "2026-01-26T00:00:00.000Z",
        history: []
      }
    ],
    auditRows: []
  });

  assert.equal(input.storeRows.length, 1);
  assert.equal(input.auditRows.length, 0);
  assert.equal(input.storeRows[0].incidentId, "INC-1");

  assert.match(workItem, /WI-0747/i);
  assert.match(workItem, /scheduling|reconcile|snapshot|input|helper/i);
}

run()
  .then(() => {
    console.log("e2e-wi0747-scheduling-reconcile-snapshot-input-helper.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
