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
    "WI-0731-scheduling-replay-summary-counts-helper.md"
  );

  assert.match(service, /buildScheduleAnomalyIncidentReplaySummaryCounts\(\{/);
  assert.match(service, /summary:\s*replaySummary/);
  assert.match(service, /summary:\s*\{\s*\.\.\.replaySummary,\s*items\s*\}/);
  assert.match(replayHelpers, /export function buildScheduleAnomalyIncidentReplaySummaryCounts/);

  const module = await import("../../src/features/scheduling/anomaly-incident-replay-helpers.ts");

  const summary = module.buildScheduleAnomalyIncidentReplaySummaryCounts({
    replayed: 3,
    dryRunCount: 1,
    notFound: 2,
    failed: 0
  });

  assert.deepEqual(summary, {
    replayed: 3,
    dryRunCount: 1,
    notFound: 2,
    failed: 0
  });

  assert.match(workItem, /WI-0731/i);
  assert.match(workItem, /scheduling|replay|summary|counts|helper/i);
}

run()
  .then(() => {
    console.log("e2e-wi0731-scheduling-replay-summary-counts-helper.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
