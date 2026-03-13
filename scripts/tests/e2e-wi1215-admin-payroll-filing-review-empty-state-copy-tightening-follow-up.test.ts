import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { payrollYearEndFilingCopyByLocale } from "@/components/payroll-year-end-filing/copy";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const copyEn = payrollYearEndFilingCopyByLocale.en;
  const copyKo = payrollYearEndFilingCopyByLocale.ko;
  const copySource = readUtf8("src", "components", "payroll-year-end-filing", "copy.ts");
  const consoleSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingConsole.tsx"
  );
  const bundles = readUtf8("scripts", "tests", "test-bundles.mjs");
  const progress = readUtf8("docs", "production-operating-progress.md");
  const workItem = readUtf8(
    "work-items",
    "WI-1215-admin-payroll-filing-review-empty-state-copy-tightening-follow-up.md"
  );

  assert.equal(copyEn.noSubmissionSummaryYet, "No review summary yet. Refresh submissions.");
  assert.equal(copyEn.noFilingSubmissionYet, "No submissions yet.");
  assert.equal(copyEn.noSubmissionMatchesFilters, "No matches for current filters.");

  assert.equal(copyKo.noSubmissionSummaryYet, "아직 검토 요약이 없습니다. 제출 목록을 새로고침하세요.");
  assert.equal(copyKo.noFilingSubmissionYet, "아직 제출 이력이 없습니다.");
  assert.equal(copyKo.noSubmissionMatchesFilters, "현재 필터와 맞는 제출 건이 없습니다.");

  assert.match(consoleSource, /copy\.noSubmissionSummaryYet/);
  assert.match(consoleSource, /copy\.noSubmissionMatchesFilters/);
  assert.match(consoleSource, /copy\.noFilingSubmissionYet/);
  assert.match(copySource, /No review summary yet\. Refresh submissions\./);
  assert.match(copySource, /아직 검토 요약이 없습니다\. 제출 목록을 새로고침하세요\./);
  assert.match(
    bundles,
    /"scripts\/tests\/e2e-wi1215-admin-payroll-filing-review-empty-state-copy-tightening-follow-up\.test\.ts"/
  );
  assert.match(progress, /Started `WI-1215`/);
  assert.match(workItem, /WI-1215/);
}

run();
console.log("e2e-wi1215-admin-payroll-filing-review-empty-state-copy-tightening-follow-up.test passed");
