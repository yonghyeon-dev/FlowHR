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
  const attendancePeriodHelpers = readUtf8(
    "src",
    "features",
    "scheduling",
    "anomaly-attendance-period-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0679-scheduling-anomaly-attendance-period-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    schedulingService,
    /from "@\/features\/scheduling\/anomaly-attendance-period-helpers"/
  );
  assert.match(schedulingService, /buildAnomalyAttendancePeriodWindow\(\{/);
  assert.doesNotMatch(schedulingService, /const oneDayMs = 24 \* 60 \* 60 \* 1000;/);

  assert.match(attendancePeriodHelpers, /export function buildAnomalyAttendancePeriodWindow\(/);
  assert.match(attendancePeriodHelpers, /const oneDayMs = 24 \* 60 \* 60 \* 1000;/);
  assert.match(attendancePeriodHelpers, /periodStart: new Date\(input\.periodStart\.getTime\(\) - oneDayMs\)/);
  assert.match(attendancePeriodHelpers, /periodEnd: new Date\(input\.periodEnd\.getTime\(\) \+ oneDayMs\)/);

  assert.ok(
    countLines(schedulingService) <= 2900,
    `scheduling/service.ts should stay <= 2900 lines (current: ${countLines(schedulingService)})`
  );
  assert.ok(
    countLines(attendancePeriodHelpers) <= 60,
    `anomaly-attendance-period-helpers.ts should stay <= 60 lines (current: ${countLines(attendancePeriodHelpers)})`
  );

  assert.match(workItem, /WI-0679/i);
  assert.match(workItem, /scheduling|anomaly|attendance|period|helper|extraction/i);
  assert.match(roadmap, /WI-0679/i);
}

run()
  .then(() => {
    console.log("e2e-wi0679-scheduling-anomaly-attendance-period-helper-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
