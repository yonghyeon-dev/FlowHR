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
    "WI-0743-scheduling-replay-meta-input-helper.md"
  );

  assert.match(service, /resolveScheduleAnomalyIncidentReplayMetaFromServiceInput\(\{/);
  assert.match(
    replayHelpers,
    /export function resolveScheduleAnomalyIncidentReplayMetaFromServiceInput/
  );

  const module = await import("../../src/features/scheduling/anomaly-incident-replay-helpers.ts");

  const meta = module.resolveScheduleAnomalyIncidentReplayMetaFromServiceInput({
    dryRun: false,
    includeArchived: true,
    from: new Date("2026-01-22T00:00:00.000Z"),
    to: new Date("2026-01-23T00:00:00.000Z"),
    topN: 30,
    incidentIds: ["INC-1", "INC-2"],
    selectedIncidentIds: ["INC-1", "INC-2", "INC-3"],
    now: new Date("2026-01-24T10:00:00.000Z")
  });

  assert.deepEqual(meta, {
    replayedAt: "2026-01-24T10:00:00.000Z",
    dryRun: false,
    includeArchived: true,
    fromIso: "2026-01-22T00:00:00.000Z",
    toIso: "2026-01-23T00:00:00.000Z",
    topN: 30,
    incidentIds: ["INC-1", "INC-2"],
    requested: 3
  });

  assert.match(workItem, /WI-0743/i);
  assert.match(workItem, /scheduling|replay|meta|input|helper/i);
}

run()
  .then(() => {
    console.log("e2e-wi0743-scheduling-replay-meta-input-helper.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
