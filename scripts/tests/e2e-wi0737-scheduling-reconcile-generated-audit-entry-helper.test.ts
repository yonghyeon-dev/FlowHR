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
    "WI-0737-scheduling-reconcile-generated-audit-entry-helper.md"
  );

  assert.match(service, /buildScheduleAnomalyIncidentReconcileGeneratedAuditEntry\(\{/);
  assert.match(
    reconcileHelpers,
    /export function buildScheduleAnomalyIncidentReconcileGeneratedAuditEntry/
  );

  const module = await import("../../src/features/scheduling/anomaly-incident-reconcile-helpers.ts");

  const payload = module.buildScheduleAnomalyIncidentReconcileGeneratedAuditPayload({
    reconciledAt: "2026-01-16T10:00:00.000Z",
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

  const entry = module.buildScheduleAnomalyIncidentReconcileGeneratedAuditEntry({
    organizationId: "org-audit",
    actorRole: "ADMIN",
    actorId: "actor-audit",
    payload
  });

  assert.equal(entry.action, "scheduling.anomaly.incident.reconciliation.generated");
  assert.equal(entry.entityType, "WorkSchedule");
  assert.equal(entry.organizationId, "org-audit");
  assert.equal(entry.actorRole, "ADMIN");
  assert.equal(entry.actorId, "actor-audit");
  assert.equal(entry.payload.returned, 4);

  assert.match(workItem, /WI-0737/i);
  assert.match(workItem, /scheduling|reconcile|generated|audit|entry|helper/i);
}

run()
  .then(() => {
    console.log("e2e-wi0737-scheduling-reconcile-generated-audit-entry-helper.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
