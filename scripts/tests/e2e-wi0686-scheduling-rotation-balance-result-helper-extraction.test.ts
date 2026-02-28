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
    "WI-0686-scheduling-rotation-balance-result-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(schedulingService, /buildRotationBalanceReportResult\(\{/);
  assert.doesNotMatch(
    schedulingService,
    /return \{\s*periodStart: input\.periodStart,\s*periodEnd: input\.periodEnd,\s*employeeId: input\.employeeId \?\? null,\s*counts: \{/
  );

  assert.match(balanceHelpers, /export function buildRotationBalanceReportResult\(/);
  assert.match(balanceHelpers, /counts: \{\s*schedules: input\.schedules,/);
  assert.match(balanceHelpers, /employeeId: input\.employeeId \?\? null,/);

  assert.ok(
    countLines(schedulingService) <= 2900,
    `scheduling/service.ts should stay <= 2900 lines (current: ${countLines(schedulingService)})`
  );

  assert.match(workItem, /WI-0686/i);
  assert.match(workItem, /scheduling|rotation|balance|result|helper|extraction/i);
  assert.match(roadmap, /WI-0686/i);
}

run()
  .then(() => {
    console.log("e2e-wi0686-scheduling-rotation-balance-result-helper-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
