import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const service = readUtf8("src", "features", "scheduling", "service.ts");
  const archiveHelpers = readUtf8(
    "src",
    "features",
    "scheduling",
    "anomaly-incident-archive-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0732-scheduling-archive-summary-counts-helper.md"
  );

  assert.match(service, /buildScheduleAnomalyIncidentArchiveSummaryCounts\(\{/);
  assert.match(service, /summary:\s*archiveSummary/);
  assert.match(service, /summary:\s*\{\s*\.\.\.archiveSummary,\s*items\s*\}/);
  assert.match(archiveHelpers, /export function buildScheduleAnomalyIncidentArchiveSummaryCounts/);

  const module = await import("../../src/features/scheduling/anomaly-incident-archive-helpers.ts");

  const summary = module.buildScheduleAnomalyIncidentArchiveSummaryCounts({
    archived: 2,
    dryRunCount: 1,
    failed: 0
  });

  assert.deepEqual(summary, {
    archived: 2,
    dryRunCount: 1,
    failed: 0
  });

  assert.match(workItem, /WI-0732/i);
  assert.match(workItem, /scheduling|archive|summary|counts|helper/i);
}

run()
  .then(() => {
    console.log("e2e-wi0732-scheduling-archive-summary-counts-helper.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
