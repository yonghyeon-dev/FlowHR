import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payrollService = readUtf8("src", "features", "payroll", "service.ts");
  const finalizationRunHelpers = readUtf8(
    "src",
    "features",
    "payroll",
    "year-end-finalization-run-helpers.ts"
  );
  const workItem = readUtf8("work-items", "WI-0306-payroll-service-modular-split-phase6.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(payrollService, /from "@\/features\/payroll\/year-end-finalization-run-helpers"/);
  assert.match(
    payrollService,
    /return buildYearEndFilingGuardCore\(snapshot\) as YearEndFilingGuard;/
  );
  assert.match(
    payrollService,
    /return buildYearEndInsuranceReconciliationMonthlyBreakdownCore\(runs, \(periodStart\) => \{/
  );

  assert.doesNotMatch(payrollService, /const byMonth = new Map</);
  assert.doesNotMatch(
    payrollService,
    /blockingReasons\.push\("all confirmed runs must be distributed before year-end finalization"\);/
  );

  assert.match(finalizationRunHelpers, /export function buildYearEndFilingGuard\(/);
  assert.match(finalizationRunHelpers, /export function buildYearEndInsuranceReconciliationMonthlyBreakdown\(/);
  assert.match(
    finalizationRunHelpers,
    /blockingReasons\.push\("all confirmed runs must be distributed before year-end finalization"\);/
  );
  assert.match(finalizationRunHelpers, /const byMonth = new Map<string,/);

  assert.match(workItem, /WI-0306/i);
  assert.match(workItem, /modular split/i);
  assert.match(roadmap, /WI-0306/i);
}

run()
  .then(() => {
    console.log("e2e-wi0306-payroll-service-modular-split-phase6.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
