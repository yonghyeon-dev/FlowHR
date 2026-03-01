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
    "WI-0745-scheduling-replay-result-summary-helper.md"
  );

  assert.match(service, /buildScheduleAnomalyIncidentReplayResultSummary\(\{/);
  assert.match(
    replayHelpers,
    /export function buildScheduleAnomalyIncidentReplayResultSummary/
  );

  const module = await import("../../src/features/scheduling/anomaly-incident-replay-helpers.ts");
  const summary = module.buildScheduleAnomalyIncidentReplayResultSummary({
    replaySummary: {
      replayed: 3,
      dryRunCount: 1,
      notFound: 0,
      failed: 2
    },
    items: [
      {
        incidentId: "INC-1",
        state: "ACKNOWLEDGED",
        historyCount: 3,
        decision: "REPLAYED",
        reason: null
      }
    ]
  });

  assert.equal(summary.replayed, 3);
  assert.equal(summary.dryRunCount, 1);
  assert.equal(summary.failed, 2);
  assert.equal(summary.items.length, 1);
  assert.equal(summary.items[0].incidentId, "INC-1");

  assert.match(workItem, /WI-0745/i);
  assert.match(workItem, /scheduling|replay|result|summary|helper/i);
}

run()
  .then(() => {
    console.log("e2e-wi0745-scheduling-replay-result-summary-helper.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
