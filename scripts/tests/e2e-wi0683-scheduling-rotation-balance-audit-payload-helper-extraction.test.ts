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
    "WI-0683-scheduling-rotation-balance-audit-payload-helper-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(schedulingService, /buildRotationBalanceReportGeneratedAuditPayload\(\{/);
  assert.doesNotMatch(
    schedulingService,
    /payload: \{\s*periodStart: input\.periodStart\.toISOString\(\),\s*periodEnd: input\.periodEnd\.toISOString\(\),\s*employeeId: input\.employeeId \?\? null/
  );

  assert.match(balanceHelpers, /export function buildRotationBalanceReportGeneratedAuditPayload\(/);
  assert.match(balanceHelpers, /activeWeekdays: input\.activeWeekdaysCount/);
  assert.match(balanceHelpers, /periodStart: input\.periodStart\.toISOString\(\)/);

  assert.ok(
    countLines(schedulingService) <= 2900,
    `scheduling/service.ts should stay <= 2900 lines (current: ${countLines(schedulingService)})`
  );
  assert.ok(
    countLines(balanceHelpers) <= 230,
    `rotation-balance-report-helpers.ts should stay <= 230 lines (current: ${countLines(balanceHelpers)})`
  );

  assert.match(workItem, /WI-0683/i);
  assert.match(workItem, /scheduling|rotation|balance|audit|payload|helper|extraction/i);
  assert.match(roadmap, /WI-0683/i);
}

run()
  .then(() => {
    console.log("e2e-wi0683-scheduling-rotation-balance-audit-payload-helper-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
