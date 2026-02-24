import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payrollService = readUtf8("src", "features", "payroll", "service.ts");
  const yearEndAdapters = readUtf8(
    "src",
    "features",
    "payroll",
    "service-year-end-adapter-helpers.ts"
  );
  const workItem = readUtf8("work-items", "WI-0345-payroll-service-modular-split-phase17.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(payrollService, /from "@\/features\/payroll\/service-year-end-adapter-helpers"/);
  assert.doesNotMatch(payrollService, /buildYearEndFilingSubmissionTimelineCore\(/);
  assert.doesNotMatch(payrollService, /buildYearEndWithholdingReceiptGuardCore\(/);
  assert.doesNotMatch(payrollService, /buildYearEndWithholdingReceiptSummaryCore\(/);

  assert.match(yearEndAdapters, /export function buildYearEndFilingSubmissionTimeline/);
  assert.match(yearEndAdapters, /export function buildYearEndWithholdingReceiptGuard/);
  assert.match(yearEndAdapters, /export function buildYearEndWithholdingReceiptSummary/);

  assert.match(workItem, /WI-0345/i);
  assert.match(workItem, /modular/i);
  assert.match(roadmap, /WI-0345/i);
}

run()
  .then(() => {
    console.log("e2e-wi0345-payroll-service-modular-split-phase17.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
