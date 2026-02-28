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
  const listHelpers = readUtf8(
    "src",
    "features",
    "scheduling",
    "schedule-list-query-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0676-scheduling-list-query-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    schedulingService,
    /from "@\/features\/scheduling\/schedule-list-query-helpers"/
  );
  assert.match(schedulingService, /const employeeId = resolveScheduleListEmployeeFilter\(\{/);
  assert.doesNotMatch(
    schedulingService,
    /employeeId is required for manager schedule list queries/
  );
  assert.doesNotMatch(schedulingService, /employee can only list own schedules/);

  assert.match(listHelpers, /export function resolveScheduleListEmployeeFilter\(/);
  assert.match(listHelpers, /Permissions\.schedulingScheduleListAny/);
  assert.match(listHelpers, /Permissions\.schedulingScheduleListByEmployee/);
  assert.match(listHelpers, /Permissions\.schedulingScheduleListOwn/);
  assert.match(listHelpers, /employeeId is required for manager schedule list queries/);
  assert.match(listHelpers, /employee can only list own schedules/);

  assert.ok(
    countLines(schedulingService) <= 2900,
    `scheduling/service.ts should stay <= 2900 lines (current: ${countLines(schedulingService)})`
  );
  assert.ok(
    countLines(listHelpers) <= 120,
    `schedule-list-query-helpers.ts should stay <= 120 lines (current: ${countLines(listHelpers)})`
  );

  assert.match(workItem, /WI-0676/i);
  assert.match(workItem, /scheduling|list|query|helper|extraction/i);
  assert.match(roadmap, /WI-0676/i);
}

run()
  .then(() => {
    console.log("e2e-wi0676-scheduling-list-query-helper-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
