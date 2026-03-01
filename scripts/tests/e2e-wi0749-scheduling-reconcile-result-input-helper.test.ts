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
    "WI-0749-scheduling-reconcile-result-input-helper.md"
  );

  assert.match(service, /buildScheduleAnomalyIncidentReconcileResultInputFromMetaAndRows\(\{/);
  assert.match(
    helpers,
    /export function buildScheduleAnomalyIncidentReconcileResultInputFromMetaAndRows/
  );

  const module = await import("../../src/features/scheduling/anomaly-incident-reconcile-helpers.ts");
  const input = module.buildScheduleAnomalyIncidentReconcileResultInputFromMetaAndRows({
    reconcileMeta: {
      reconciledAt: "2026-01-28T10:00:00.000Z",
      topN: 30,
      includeMatching: true
    },
    counts: {
      total: 8,
      match: 5,
      storeMissing: 1,
      orphanedStore: 1,
      fieldMismatch: 1
    },
    items: [
      {
        incidentId: "INC-2",
        status: "FIELD_MISMATCH",
        fields: ["state"],
        storeState: "ACKNOWLEDGED",
        auditState: "RESOLVED",
        storeHistoryCount: 2,
        auditHistoryCount: 3
      }
    ]
  });

  assert.equal(input.reconciledAt, "2026-01-28T10:00:00.000Z");
  assert.equal(input.counts.total, 8);
  assert.equal(input.items.length, 1);

  assert.match(workItem, /WI-0749/i);
  assert.match(workItem, /scheduling|reconcile|result|input|helper/i);
}

run()
  .then(() => {
    console.log("e2e-wi0749-scheduling-reconcile-result-input-helper.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
