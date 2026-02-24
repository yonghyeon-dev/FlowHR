import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payrollService = readUtf8("src", "features", "payroll", "service.ts");
  const payrollAdapterHelpers = readUtf8(
    "src",
    "features",
    "payroll",
    "service-year-end-adapter-helpers.ts"
  );
  const withholdingHelpers = readUtf8(
    "src",
    "features",
    "payroll",
    "year-end-withholding-receipt-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0311-payroll-service-modular-split-phase9-withholding-helpers.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    payrollService,
    /from "@\/features\/payroll\/service-year-end-adapter-helpers"/
  );
  assert.match(payrollAdapterHelpers, /from "@\/features\/payroll\/year-end-withholding-receipt-helpers"/);
  assert.match(payrollAdapterHelpers, /return buildYearEndWithholdingReceiptGuardCore\(input\);/);
  assert.match(payrollAdapterHelpers, /return buildYearEndWithholdingReceiptSummaryCore\(input\)/);

  assert.doesNotMatch(
    payrollService,
    /blockingReasons\.push\("all payroll runs must be confirmed before withholding receipt issue"\);/
  );
  assert.doesNotMatch(payrollService, /const canIssue = blockingReasons\.length === 0;/);

  assert.match(withholdingHelpers, /export function buildYearEndWithholdingReceiptGuard\(/);
  assert.match(withholdingHelpers, /export function buildYearEndWithholdingReceiptSummary\(/);
  assert.match(
    withholdingHelpers,
    /blockingReasons\.push\("all payroll runs must be confirmed before withholding receipt issue"\);/
  );

  const serviceLineCount = payrollService.split(/\r?\n/).length;
  assert.ok(
    serviceLineCount < 4679,
    `expected payroll service line count to decrease below 4679, got ${serviceLineCount}`
  );

  assert.match(workItem, /WI-0311/i);
  assert.match(workItem, /modular split|decomposition/i);
  assert.match(roadmap, /WI-0311/i);
}

run()
  .then(() => {
    console.log("e2e-wi0311-payroll-service-modular-split-phase9-withholding-helpers.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
