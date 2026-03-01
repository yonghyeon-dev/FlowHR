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
    "WI-0733-scheduling-replay-log-range-filter-helper.md"
  );

  assert.match(service, /filterScheduleAnomalyIncidentReplayLogsByRange\(\{/);
  assert.doesNotMatch(service, /logs\.filter\(\(entry\) =>\s*isWithinOptionalCreatedAtRange/);
  assert.match(replayHelpers, /export function filterScheduleAnomalyIncidentReplayLogsByRange/);

  const module = await import("../../src/features/scheduling/anomaly-incident-replay-helpers.ts");

  const logs = [
    { createdAt: new Date("2026-01-01T00:00:00.000Z"), id: "A" },
    { createdAt: new Date("2026-01-05T00:00:00.000Z"), id: "B" },
    { createdAt: new Date("2026-01-09T00:00:00.000Z"), id: "C" }
  ];

  const filtered = module.filterScheduleAnomalyIncidentReplayLogsByRange({
    logs,
    from: new Date("2026-01-02T00:00:00.000Z"),
    to: new Date("2026-01-08T00:00:00.000Z")
  });

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, "B");

  assert.match(workItem, /WI-0733/i);
  assert.match(workItem, /scheduling|replay|log|range|filter|helper/i);
}

run()
  .then(() => {
    console.log("e2e-wi0733-scheduling-replay-log-range-filter-helper.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
