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
    "WI-0693-scheduling-list-in-period-query-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(schedulingService, /buildScheduleListInPeriodQueryInput\(\{/);
  assert.doesNotMatch(
    schedulingService,
    /context\.dataAccess\.scheduling\.listInPeriod\(\{\s*periodStart: input\.periodStart,\s*periodEnd: input\.periodEnd,\s*organizationId: tenantScope \?\? undefined,\s*employeeId/
  );

  assert.match(listHelpers, /export function buildScheduleListInPeriodQueryInput\(/);
  assert.match(listHelpers, /organizationId: input\.tenantScope \?\? undefined,/);

  assert.ok(
    countLines(schedulingService) <= 2900,
    `scheduling/service.ts should stay <= 2900 lines (current: ${countLines(schedulingService)})`
  );

  assert.match(workItem, /WI-0693/i);
  assert.match(workItem, /scheduling|listInPeriod|query|helper|extraction/i);
  assert.match(roadmap, /WI-0693/i);
}

run()
  .then(() => {
    console.log("e2e-wi0693-scheduling-list-in-period-query-helper-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
