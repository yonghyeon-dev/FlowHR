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
  const workItem = readUtf8(
    "work-items",
    "WI-0696-scheduling-anomaly-attendance-period-normalized-window-adoption.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    schedulingService,
    /buildAnomalyAttendancePeriodWindow\(\{\s*periodStart: normalizedWindow\.periodStart,\s*periodEnd: normalizedWindow\.periodEnd\s*\}\)/
  );
  assert.doesNotMatch(
    schedulingService,
    /buildAnomalyAttendancePeriodWindow\(\{\s*periodStart: input\.periodStart,\s*periodEnd: input\.periodEnd\s*\}\)/
  );

  assert.ok(
    countLines(schedulingService) <= 2900,
    `scheduling/service.ts should stay <= 2900 lines (current: ${countLines(schedulingService)})`
  );

  assert.match(workItem, /WI-0696/i);
  assert.match(workItem, /scheduling|anomaly|attendance period|normalized window|adoption/i);
  assert.match(roadmap, /WI-0696/i);
}

run()
  .then(() => {
    console.log("e2e-wi0696-scheduling-anomaly-attendance-period-normalized-window-adoption.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
