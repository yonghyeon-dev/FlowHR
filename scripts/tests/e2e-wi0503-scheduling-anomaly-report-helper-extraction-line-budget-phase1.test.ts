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
  const anomalyReportHelpers = readUtf8(
    "src",
    "features",
    "scheduling",
    "anomaly-report-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0503-scheduling-anomaly-report-helper-extraction-line-budget-phase1.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(
    countLines(schedulingService) <= 4700,
    `scheduling/service.ts should stay <= 4700 lines (current: ${countLines(schedulingService)})`
  );
  assert.ok(
    countLines(anomalyReportHelpers) <= 260,
    `scheduling/anomaly-report-helpers.ts should stay <= 260 lines (current: ${countLines(anomalyReportHelpers)})`
  );

  assert.match(
    schedulingService,
    /from "@\/features\/scheduling\/anomaly-report-helpers"/
  );
  assert.doesNotMatch(schedulingService, /function buildScheduleAttendanceAnomalySet\(/);
  assert.doesNotMatch(schedulingService, /function anomalyCockpitRecommendedAction\(/);

  assert.match(anomalyReportHelpers, /export function buildScheduleAttendanceAnomalySet\(/);
  assert.match(anomalyReportHelpers, /export function anomalyCockpitRecommendedAction\(/);
  assert.match(anomalyReportHelpers, /export type ScheduleAttendanceAnomaly =/);
  assert.match(anomalyReportHelpers, /export type ScheduleAttendanceAnomalyCockpitReport =/);

  assert.match(workItem, /WI-0503/i);
  assert.match(workItem, /scheduling|anomaly|helper|line budget|phase1/i);
  assert.match(roadmap, /WI-0503/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0503-scheduling-anomaly-report-helper-extraction-line-budget-phase1.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
