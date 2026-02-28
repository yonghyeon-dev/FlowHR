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
  const balanceHelpers = readUtf8(
    "src",
    "features",
    "scheduling",
    "rotation-balance-report-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0678-scheduling-rotation-balance-summary-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    schedulingService,
    /from "@\/features\/scheduling\/rotation-balance-report-helpers"/
  );
  assert.match(schedulingService, /buildRotationBalanceSummary\(\{ schedules \}\)/);
  assert.doesNotMatch(
    schedulingService,
    /const buckets = new Map<number, \{ weekday: number; scheduleCount: number; plannedMinutes: number \}>\(\);/
  );

  assert.match(balanceHelpers, /export function buildRotationBalanceSummary\(/);
  assert.match(balanceHelpers, /const buckets = new Map<number, RotationBalanceWeekdayBucket>\(\)/);
  assert.match(balanceHelpers, /const grade = deriveRotationBalanceGrade\(weekdayGap, plannedMinutesGap\)/);
  assert.match(balanceHelpers, /const recommendations: string\[\] = \[\]/);

  assert.ok(
    countLines(schedulingService) <= 2900,
    `scheduling/service.ts should stay <= 2900 lines (current: ${countLines(schedulingService)})`
  );
  assert.ok(
    countLines(balanceHelpers) <= 180,
    `rotation-balance-report-helpers.ts should stay <= 180 lines (current: ${countLines(balanceHelpers)})`
  );

  assert.match(workItem, /WI-0678/i);
  assert.match(workItem, /scheduling|rotation|balance|summary|helper|extraction/i);
  assert.match(roadmap, /WI-0678/i);
}

run()
  .then(() => {
    console.log("e2e-wi0678-scheduling-rotation-balance-summary-helper-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
