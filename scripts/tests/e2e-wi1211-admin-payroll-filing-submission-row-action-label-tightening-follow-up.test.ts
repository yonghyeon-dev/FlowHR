import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const filingCopy = readUtf8("src", "components", "payroll-year-end-filing", "copy.ts");
  const filingConsole = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingConsole.tsx"
  );
  const bundles = readUtf8("scripts", "tests", "test-bundles.mjs");
  const progress = readUtf8("docs", "production-operating-progress.md");
  const workItem = readUtf8(
    "work-items",
    "WI-1211-admin-payroll-filing-submission-row-action-label-tightening-follow-up.md"
  );

  assert.match(filingCopy, /quickAckAcceptedAction: "Accept"/);
  assert.match(filingCopy, /quickCancelAction: "Cancel"/);
  assert.match(filingCopy, /quickResubmitAction: "Resubmit"/);
  assert.match(filingCopy, /quickReopenAction: "Reopen"/);
  assert.match(filingCopy, /timelineAction: "History"/);
  assert.match(filingCopy, /quickAckAcceptedAction: "승인"/);
  assert.match(filingCopy, /quickCancelAction: "취소"/);
  assert.match(filingCopy, /quickResubmitAction: "재제출"/);
  assert.match(filingCopy, /quickReopenAction: "재개"/);
  assert.match(filingCopy, /timelineAction: "이력"/);
  assert.match(filingConsole, /copy\.quickAckAcceptedAction/);
  assert.match(filingConsole, /copy\.timelineAction/);

  assert.match(
    bundles,
    /"scripts\/tests\/e2e-wi1211-admin-payroll-filing-submission-row-action-label-tightening-follow-up\.test\.ts"/
  );
  assert.match(progress, /Started `WI-1211`/);
  assert.match(workItem, /WI-1211/);
}

run();
console.log("e2e-wi1211-admin-payroll-filing-submission-row-action-label-tightening-follow-up.test passed");
