import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { payrollYearEndFilingCopyByLocale } from "@/components/payroll-year-end-filing/copy";
import { buildActiveSubmissionFiltersSummary } from "@/components/payroll-year-end-filing/submission-state-helpers";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const copyEn = payrollYearEndFilingCopyByLocale.en;
  const copyKo = payrollYearEndFilingCopyByLocale.ko;
  const helperSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "submission-state-helpers.ts"
  );
  const copySource = readUtf8("src", "components", "payroll-year-end-filing", "copy.ts");
  const bundles = readUtf8("scripts", "tests", "test-bundles.mjs");
  const progress = readUtf8("docs", "production-operating-progress.md");
  const workItem = readUtf8(
    "work-items",
    "WI-1214-admin-payroll-filing-filter-summary-copy-tightening-follow-up.md"
  );

  const defaultEnglishSummary = buildActiveSubmissionFiltersSummary({
    copy: copyEn,
    submissionStatusFilter: "all",
    submissionAckStatusFilter: "all",
    submissionValidationStatusFilter: "all",
    submissionTransportFilter: "all",
    submissionSettlementHashFilter: "",
    submissionSearch: "",
    submissionSortBy: "submittedAt",
    submissionSortDirection: "desc"
  });
  const compactEnglishSummary = buildActiveSubmissionFiltersSummary({
    copy: copyEn,
    submissionStatusFilter: "submitted",
    submissionAckStatusFilter: "all",
    submissionValidationStatusFilter: "fail",
    submissionTransportFilter: "manual_portal",
    submissionSettlementHashFilter: "hash-88",
    submissionSearch: "retry",
    submissionSortBy: "attempt",
    submissionSortDirection: "asc"
  });
  const defaultKoreanSummary = buildActiveSubmissionFiltersSummary({
    copy: copyKo,
    submissionStatusFilter: "all",
    submissionAckStatusFilter: "all",
    submissionValidationStatusFilter: "all",
    submissionTransportFilter: "all",
    submissionSettlementHashFilter: "",
    submissionSearch: "",
    submissionSortBy: "submittedAt",
    submissionSortDirection: "desc"
  });

  assert.equal(defaultEnglishSummary, "Default filters · newest submissions");
  assert.equal(defaultKoreanSummary, "기본 필터 · 최신 제출순");
  assert.equal(
    compactEnglishSummary,
    "Stage Submitted · Checks Failed · Route Manual portal · Match hash-88 · Search retry · Sort Attempt Oldest first"
  );
  assert.doesNotMatch(compactEnglishSummary, /Response Status|Search:|Sort By:/);

  assert.match(helperSource, /const usesDefaultSort = submissionSortBy === "submittedAt" && submissionSortDirection === "desc";/);
  assert.match(helperSource, /return parts\.length > 0 \? parts\.join\(" · "\) : copy\.defaultSubmissionFiltersSummary;/);
  assert.match(copySource, /defaultSubmissionFiltersSummary: "Default filters · newest submissions"/);
  assert.match(copySource, /defaultSubmissionFiltersSummary: "기본 필터 · 최신 제출순"/);
  assert.match(
    bundles,
    /"scripts\/tests\/e2e-wi1214-admin-payroll-filing-filter-summary-copy-tightening-follow-up\.test\.ts"/
  );
  assert.match(progress, /Started `WI-1214`/);
  assert.match(workItem, /WI-1214/);
}

run();
console.log("e2e-wi1214-admin-payroll-filing-filter-summary-copy-tightening-follow-up.test passed");
