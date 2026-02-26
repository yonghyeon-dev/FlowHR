import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.split(/\r?\n/).length;
}

async function run() {
  const schedulingService = readUtf8("src", "features", "scheduling", "service.ts");
  const replayHelpers = readUtf8(
    "src",
    "features",
    "scheduling",
    "anomaly-incident-replay-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0511-scheduling-anomaly-replay-helper-extraction-line-budget-phase6.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(
    countLines(schedulingService) <= 4330,
    `scheduling/service.ts should stay <= 4330 lines (current: ${countLines(schedulingService)})`
  );
  assert.ok(
    countLines(replayHelpers) <= 200,
    `anomaly-incident-replay-helpers.ts should stay <= 200 lines (current: ${countLines(replayHelpers)})`
  );

  assert.match(
    schedulingService,
    /from "@\/features\/scheduling\/anomaly-incident-replay-helpers";/
  );
  assert.match(schedulingService, /selectScheduleAnomalyIncidentReplayTargets\(\{/);
  assert.match(schedulingService, /executeScheduleAnomalyIncidentReplayActions\(\{/);
  assert.doesNotMatch(
    schedulingService,
    /for \(const incidentId of selectedIncidentIds\)[\s\S]*if \(dryRun\)\s*\{/
  );

  assert.match(replayHelpers, /export function selectScheduleAnomalyIncidentReplayTargets</);
  assert.match(replayHelpers, /export async function executeScheduleAnomalyIncidentReplayActions</);
  assert.match(replayHelpers, /decision: "NOT_FOUND"/);
  assert.match(replayHelpers, /decision: "DRY_RUN"/);
  assert.match(replayHelpers, /decision: "REPLAYED"/);
  assert.match(replayHelpers, /decision: "FAILED"/);

  assert.match(workItem, /WI-0511/i);
  assert.match(workItem, /scheduling|anomaly|replay|helper|line budget|phase6/i);
  assert.match(roadmap, /WI-0511/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0511-scheduling-anomaly-replay-helper-extraction-line-budget-phase6.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
