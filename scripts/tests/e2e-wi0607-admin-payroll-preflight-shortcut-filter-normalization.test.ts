import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const consoleFile = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingConsole.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0607-admin-payroll-preflight-shortcut-filter-normalization.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(consoleFile, /function runOpenPendingSubmissionsFromPreflight\(\)/);
  assert.match(consoleFile, /function runOpenRejectedSubmissionsFromPreflight\(\)/);

  assert.match(consoleFile, /runOpenPendingSubmissionsFromPreflight\(\)[\s\S]*setSubmissionSettlementHashFilter\(""\)/);
  assert.match(consoleFile, /runOpenPendingSubmissionsFromPreflight\(\)[\s\S]*setSubmissionSortBy\("submittedAt"\)/);
  assert.match(consoleFile, /runOpenPendingSubmissionsFromPreflight\(\)[\s\S]*setSubmissionSortDirection\("desc"\)/);

  assert.match(consoleFile, /runOpenRejectedSubmissionsFromPreflight\(\)[\s\S]*setSubmissionSettlementHashFilter\(""\)/);
  assert.match(consoleFile, /runOpenRejectedSubmissionsFromPreflight\(\)[\s\S]*setSubmissionSortBy\("submittedAt"\)/);
  assert.match(consoleFile, /runOpenRejectedSubmissionsFromPreflight\(\)[\s\S]*setSubmissionSortDirection\("desc"\)/);

  assert.match(workItem, /WI-0607/i);
  assert.match(workItem, /shortcut|filter|normalization|preflight|rejected|pending/i);
  assert.match(roadmap, /WI-0607/i);
}

run()
  .then(() => {
    console.log("e2e-wi0607-admin-payroll-preflight-shortcut-filter-normalization.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
