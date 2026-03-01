import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const service = readUtf8("src", "features", "scheduling", "service.ts");
  const replayHelpers = readUtf8(
    "src",
    "features",
    "scheduling",
    "anomaly-incident-replay-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0742-scheduling-replay-audit-list-input-helper.md"
  );

  assert.match(service, /buildScheduleAnomalyIncidentReplayAuditListInput\(\{/);
  assert.match(
    replayHelpers,
    /export function buildScheduleAnomalyIncidentReplayAuditListInput/
  );

  const module = await import("../../src/features/scheduling/anomaly-incident-replay-helpers.ts");
  const input = module.buildScheduleAnomalyIncidentReplayAuditListInput({
    actions: [
      "scheduling.anomaly.incident.lifecycle.updated",
      "scheduling.anomaly.incident.archived"
    ],
    organizationId: "org-replay",
    limit: 500
  });

  assert.deepEqual(input, {
    actions: [
      "scheduling.anomaly.incident.lifecycle.updated",
      "scheduling.anomaly.incident.archived"
    ],
    entityType: "WorkSchedule",
    organizationId: "org-replay",
    limit: 500
  });

  assert.match(workItem, /WI-0742/i);
  assert.match(workItem, /scheduling|replay|audit|list|input|helper/i);
}

run()
  .then(() => {
    console.log("e2e-wi0742-scheduling-replay-audit-list-input-helper.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
