import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const autoActionHelpers = readUtf8(
    "src",
    "features",
    "scheduling",
    "anomaly-incident-auto-action-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0724-scheduling-auto-action-notify-audit-payload-helper.md"
  );

  assert.match(
    autoActionHelpers,
    /export function buildScheduleAnomalyIncidentAutoActionNotificationAuditPayload/
  );
  assert.match(autoActionHelpers, /action: "scheduling\.anomaly\.incident\.auto_action\.notified"/);
  assert.match(
    autoActionHelpers,
    /payload: buildScheduleAnomalyIncidentAutoActionNotificationAuditPayload\(\{/
  );

  const module = await import("../../src/features/scheduling/anomaly-incident-auto-action-helpers.ts");

  const successPayload = module.buildScheduleAnomalyIncidentAutoActionNotificationAuditPayload({
    executedAt: "2026-01-06T09:00:00.000Z",
    candidates: 10,
    escalated: 4,
    assigned: 3,
    failed: 1
  });

  assert.equal(successPayload.executedAt, "2026-01-06T09:00:00.000Z");
  assert.equal(successPayload.failed, 1);
  assert.equal("error" in successPayload, false);

  const failedPayload = module.buildScheduleAnomalyIncidentAutoActionNotificationAuditPayload({
    executedAt: "2026-01-06T09:00:00.000Z",
    candidates: 10,
    escalated: 4,
    assigned: 3,
    failed: 1,
    error: "publish failed"
  });

  assert.equal(failedPayload.error, "publish failed");
  assert.equal(failedPayload.assigned, 3);

  assert.match(workItem, /WI-0724/i);
  assert.match(workItem, /scheduling|auto action|notify|audit|payload|helper/i);
}

run()
  .then(() => {
    console.log("e2e-wi0724-scheduling-auto-action-notify-audit-payload-helper.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
