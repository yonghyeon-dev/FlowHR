import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payrollService = readUtf8("src", "features", "payroll", "service.ts");
  const runtimeHelpers = readUtf8(
    "src",
    "features",
    "payroll",
    "service-runtime-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0309-payroll-service-modular-split-phase8-runtime-helpers.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(payrollService, /from "@\/features\/payroll\/service-runtime-helpers"/);
  assert.match(payrollService, /ensureValidPeriod\(input\.periodStart, input\.periodEnd\);/);
  assert.match(runtimeHelpers, /const start = toSeoulDateTimeParts\(periodStart\);/);
  assert.match(runtimeHelpers, /const end = toSeoulDateTimeParts\(periodEnd\);/);

  assert.doesNotMatch(payrollService, /function isPayrollDeductionsEnabled\(/);
  assert.doesNotMatch(payrollService, /function isPayrollYearEndEnabled\(/);
  assert.doesNotMatch(payrollService, /function getYearPeriodInSeoul\(/);
  assert.doesNotMatch(payrollService, /const seoulDateTimeFormatter = new Intl\.DateTimeFormat/);

  assert.match(runtimeHelpers, /export function ensureValidPeriod\(/);
  assert.match(runtimeHelpers, /export function toKrwInteger\(/);
  assert.match(runtimeHelpers, /export function toRateNumber\(/);
  assert.match(runtimeHelpers, /export function isPayrollYearEndFilingSubmissionEnabled\(/);
  assert.match(runtimeHelpers, /export function getYearPeriodInSeoul\(/);
  assert.match(runtimeHelpers, /export function toSeoulDateTimeParts\(/);
  assert.match(runtimeHelpers, /export function ensureMonthlyBoundaryInSeoul\(/);

  const serviceLineCount = payrollService.split(/\r?\n/).length;
  assert.ok(
    serviceLineCount < 4854,
    `expected payroll service line count to decrease below 4854, got ${serviceLineCount}`
  );

  assert.match(workItem, /WI-0309/i);
  assert.match(workItem, /modular split|decomposition/i);
  assert.match(roadmap, /WI-0309/i);
}

run()
  .then(() => {
    console.log("e2e-wi0309-payroll-service-modular-split-phase8-runtime-helpers.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
