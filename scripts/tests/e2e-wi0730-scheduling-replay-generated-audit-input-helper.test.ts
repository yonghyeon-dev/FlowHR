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
    "WI-0730-scheduling-replay-generated-audit-input-helper.md"
  );

  assert.match(service, /resolveScheduleAnomalyIncidentReplayMeta\(\{/);
  assert.match(service, /buildScheduleAnomalyIncidentReplayGeneratedAuditPayload\(\{\s*\.\.\.replayMeta,/);
  assert.match(service, /buildScheduleAnomalyIncidentReplayResult\(\{\s*\.\.\.replayMeta,/);

  assert.match(replayHelpers, /export function resolveScheduleAnomalyIncidentReplayMeta/);

  const module = await import("../../src/features/scheduling/anomaly-incident-replay-helpers.ts");

  const meta = module.resolveScheduleAnomalyIncidentReplayMeta({
    replayedAt: "2026-01-12T09:00:00.000Z",
    dryRun: true,
    includeArchived: false,
    from: new Date("2026-01-01T00:00:00.000Z"),
    to: new Date("2026-01-10T00:00:00.000Z"),
    topN: 30,
    incidentIds: ["INC-1", "INC-2"],
    selectedIncidentIds: ["INC-1"]
  });

  assert.equal(meta.replayedAt, "2026-01-12T09:00:00.000Z");
  assert.equal(meta.dryRun, true);
  assert.equal(meta.includeArchived, false);
  assert.equal(meta.fromIso, "2026-01-01T00:00:00.000Z");
  assert.equal(meta.toIso, "2026-01-10T00:00:00.000Z");
  assert.equal(meta.requested, 1);

  assert.match(workItem, /WI-0730/i);
  assert.match(workItem, /scheduling|replay|generated|audit|input|helper/i);
}

run()
  .then(() => {
    console.log("e2e-wi0730-scheduling-replay-generated-audit-input-helper.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
