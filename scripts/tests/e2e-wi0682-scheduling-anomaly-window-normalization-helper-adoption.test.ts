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
  const normalizationHelpers = readUtf8(
    "src",
    "features",
    "scheduling",
    "schedule-input-normalization-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0682-scheduling-anomaly-window-normalization-helper-adoption.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(schedulingService, /normalizeScheduleAnomalyReportWindowInput\(\{/);
  assert.match(schedulingService, /normalizeScheduleAnomalyCockpitWindowInput\(\{/);
  assert.doesNotMatch(
    schedulingService,
    /const lateThresholdMinutes = normalizeLateThresholdMinutes\(input\.lateThresholdMinutes\);/
  );
  assert.doesNotMatch(schedulingService, /const topN = normalizeTopN\(input\.topN\);/);

  assert.match(normalizationHelpers, /export function normalizeScheduleAnomalyReportWindowInput\(/);
  assert.match(normalizationHelpers, /export function normalizeScheduleAnomalyCockpitWindowInput\(/);
  assert.match(normalizationHelpers, /lateThresholdMinutes: normalizeLateThresholdMinutes/);
  assert.match(normalizationHelpers, /topN: normalizeTopN/);

  assert.ok(
    countLines(schedulingService) <= 2900,
    `scheduling/service.ts should stay <= 2900 lines (current: ${countLines(schedulingService)})`
  );

  assert.match(workItem, /WI-0682/i);
  assert.match(workItem, /scheduling|anomaly|window|normalization|helper|adoption/i);
  assert.match(roadmap, /WI-0682/i);
}

run()
  .then(() => {
    console.log("e2e-wi0682-scheduling-anomaly-window-normalization-helper-adoption.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
