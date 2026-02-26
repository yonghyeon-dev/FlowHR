import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.split(/\r?\n/).length;
}

async function run() {
  const schedulingService = readUtf8("src", "features", "scheduling", "service.ts");
  const reconcileHelpers = readUtf8(
    "src",
    "features",
    "scheduling",
    "anomaly-incident-reconcile-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0512-scheduling-anomaly-reconcile-helper-extraction-line-budget-phase7.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(
    countLines(schedulingService) <= 4260,
    `scheduling/service.ts should stay <= 4260 lines (current: ${countLines(schedulingService)})`
  );
  assert.ok(
    countLines(reconcileHelpers) <= 200,
    `anomaly-incident-reconcile-helpers.ts should stay <= 200 lines (current: ${countLines(reconcileHelpers)})`
  );

  assert.match(
    schedulingService,
    /from "@\/features\/scheduling\/anomaly-incident-reconcile-helpers";/
  );
  assert.match(schedulingService, /buildScheduleAnomalyIncidentReconcileSnapshot\(\{/);
  assert.match(schedulingService, /selectScheduleAnomalyIncidentReconcileItems\(/);
  assert.doesNotMatch(schedulingService, /const storeById = new Map\(storeRows\.map/);
  assert.doesNotMatch(schedulingService, /for \(const incidentId of allIncidentIds\)/);

  assert.match(reconcileHelpers, /export function buildScheduleAnomalyIncidentReconcileSnapshot\(/);
  assert.match(reconcileHelpers, /export function selectScheduleAnomalyIncidentReconcileItems\(/);
  assert.match(reconcileHelpers, /status: "STORE_MISSING"/);
  assert.match(reconcileHelpers, /status: "ORPHANED_STORE"/);
  assert.match(reconcileHelpers, /status: fields\.length > 0 \? "FIELD_MISMATCH" : "MATCH"/);

  assert.match(workItem, /WI-0512/i);
  assert.match(workItem, /scheduling|anomaly|reconcile|helper|line budget|phase7/i);
  assert.match(roadmap, /WI-0512/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0512-scheduling-anomaly-reconcile-helper-extraction-line-budget-phase7.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
