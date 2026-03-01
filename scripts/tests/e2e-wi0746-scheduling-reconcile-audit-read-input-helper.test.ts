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
    "WI-0746-scheduling-reconcile-audit-read-input-helper.md"
  );

  assert.match(service, /buildScheduleAnomalyIncidentReconcileAuditReadInput\(\{/);
  assert.match(
    reconcileHelpers,
    /export function buildScheduleAnomalyIncidentReconcileAuditReadInput/
  );

  const module = await import("../../src/features/scheduling/anomaly-incident-reconcile-helpers.ts");
  const input = module.buildScheduleAnomalyIncidentReconcileAuditReadInput({
    organizationId: "org-reconcile"
  });

  assert.deepEqual(input, {
    organizationId: "org-reconcile",
    applyArchiveActions: true
  });

  assert.match(workItem, /WI-0746/i);
  assert.match(workItem, /scheduling|reconcile|audit|read|input|helper/i);
}

run()
  .then(() => {
    console.log("e2e-wi0746-scheduling-reconcile-audit-read-input-helper.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
