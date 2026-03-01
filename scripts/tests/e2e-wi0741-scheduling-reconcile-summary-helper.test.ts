import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const service = readUtf8("src", "features", "scheduling", "service.ts");
  const reconcileHelpers = readUtf8(
    "src",
    "features",
    "scheduling",
    "anomaly-incident-reconcile-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0741-scheduling-reconcile-summary-helper.md"
  );

  assert.match(service, /resolveScheduleAnomalyIncidentReconcileMeta\(\{/);
  assert.match(service, /buildScheduleAnomalyIncidentReconcileSummary\(\{/);
  assert.match(
    service,
    /buildScheduleAnomalyIncidentReconcileGeneratedAuditPayload\(\{[\s\S]*\.\.\.reconcileMeta,[\s\S]*\.\.\.reconcileSummary/
  );
  assert.match(
    reconcileHelpers,
    /export function resolveScheduleAnomalyIncidentReconcileMeta/
  );
  assert.match(
    reconcileHelpers,
    /export function buildScheduleAnomalyIncidentReconcileSummary/
  );

  const module = await import("../../src/features/scheduling/anomaly-incident-reconcile-helpers.ts");

  const meta = module.resolveScheduleAnomalyIncidentReconcileMeta({
    reconciledAt: "2026-01-21T12:00:00.000Z",
    topN: 25,
    includeMatching: false
  });
  assert.deepEqual(meta, {
    reconciledAt: "2026-01-21T12:00:00.000Z",
    topN: 25,
    includeMatching: false
  });

  const summary = module.buildScheduleAnomalyIncidentReconcileSummary({
    compared: 9,
    returned: 4,
    counts: {
      total: 9,
      match: 5,
      storeMissing: 1,
      orphanedStore: 1,
      fieldMismatch: 2
    }
  });
  assert.equal(summary.compared, 9);
  assert.equal(summary.returned, 4);
  assert.equal(summary.counts.fieldMismatch, 2);

  assert.match(workItem, /WI-0741/i);
  assert.match(workItem, /scheduling|reconcile|summary|helper/i);
}

run()
  .then(() => {
    console.log("e2e-wi0741-scheduling-reconcile-summary-helper.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
