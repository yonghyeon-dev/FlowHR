import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const service = readUtf8("src", "features", "scheduling", "service.ts");
  const autoActionHelpers = readUtf8(
    "src",
    "features",
    "scheduling",
    "anomaly-incident-auto-action-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0736-scheduling-auto-action-notify-meta-helper.md"
  );

  assert.match(service, /resolveScheduleAnomalyIncidentAutoActionNotificationMeta\(\{/);
  assert.match(service, /notifyScheduleAnomalyIncidentAutoActionExecution\(\{\s*\.\.\.autoActionNotificationMeta,/);
  assert.match(
    autoActionHelpers,
    /export function resolveScheduleAnomalyIncidentAutoActionNotificationMeta/
  );

  const module = await import("../../src/features/scheduling/anomaly-incident-auto-action-helpers.ts");

  const meta = module.resolveScheduleAnomalyIncidentAutoActionNotificationMeta({
    dryRun: false,
    executedAt: "2026-01-15T09:00:00.000Z",
    candidates: 8,
    escalated: 5,
    assigned: 4,
    failed: 1
  });

  assert.deepEqual(meta, {
    dryRun: false,
    executedAt: "2026-01-15T09:00:00.000Z",
    candidates: 8,
    escalated: 5,
    assigned: 4,
    failed: 1
  });

  assert.match(workItem, /WI-0736/i);
  assert.match(workItem, /scheduling|auto action|notify|meta|helper/i);
}

run()
  .then(() => {
    console.log("e2e-wi0736-scheduling-auto-action-notify-meta-helper.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
