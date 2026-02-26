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
  const cockpitHelpers = readUtf8(
    "src",
    "features",
    "scheduling",
    "anomaly-cockpit-report-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0506-scheduling-anomaly-cockpit-projection-helper-extraction-line-budget-phase2.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(
    countLines(schedulingService) <= 4600,
    `scheduling/service.ts should stay <= 4600 lines (current: ${countLines(schedulingService)})`
  );
  assert.ok(
    countLines(cockpitHelpers) <= 220,
    `scheduling/anomaly-cockpit-report-helpers.ts should stay <= 220 lines (current: ${countLines(cockpitHelpers)})`
  );

  assert.match(
    schedulingService,
    /from "@\/features\/scheduling\/anomaly-cockpit-report-helpers"/
  );
  assert.match(schedulingService, /buildScheduleAttendanceAnomalyCockpitProjection\(/);
  assert.doesNotMatch(schedulingService, /const anomaliesByEmployee = new Map/);

  assert.match(cockpitHelpers, /export function buildScheduleAttendanceAnomalyCockpitProjection\(/);
  assert.match(cockpitHelpers, /buildScheduleAttendanceAnomalySet\(/);
  assert.match(cockpitHelpers, /anomalyCockpitRecommendedAction\(/);

  assert.match(workItem, /WI-0506/i);
  assert.match(workItem, /scheduling|anomaly|cockpit|projection|helper|line budget|phase2/i);
  assert.match(roadmap, /WI-0506/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0506-scheduling-anomaly-cockpit-projection-helper-extraction-line-budget-phase2.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
