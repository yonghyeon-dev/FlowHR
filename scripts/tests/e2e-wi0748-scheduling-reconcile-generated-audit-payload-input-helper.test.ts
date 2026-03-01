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
    "WI-0748-scheduling-reconcile-generated-audit-payload-input-helper.md"
  );

  assert.match(
    service,
    /buildScheduleAnomalyIncidentReconcileGeneratedAuditPayloadInputFromMetaAndSummary\(\{/
  );
  assert.match(
    helpers,
    /export function buildScheduleAnomalyIncidentReconcileGeneratedAuditPayloadInputFromMetaAndSummary/
  );

  const module = await import("../../src/features/scheduling/anomaly-incident-reconcile-helpers.ts");
  const input =
    module.buildScheduleAnomalyIncidentReconcileGeneratedAuditPayloadInputFromMetaAndSummary({
      reconcileMeta: {
        reconciledAt: "2026-01-27T11:00:00.000Z",
        topN: 40,
        includeMatching: false
      },
      reconcileSummary: {
        compared: 9,
        returned: 4,
        counts: {
          total: 9,
          match: 5,
          storeMissing: 1,
          orphanedStore: 1,
          fieldMismatch: 2
        }
      }
    });

  assert.deepEqual(input, {
    reconciledAt: "2026-01-27T11:00:00.000Z",
    topN: 40,
    includeMatching: false,
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

  assert.match(workItem, /WI-0748/i);
  assert.match(workItem, /scheduling|reconcile|generated|audit|payload|input|helper/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0748-scheduling-reconcile-generated-audit-payload-input-helper.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
