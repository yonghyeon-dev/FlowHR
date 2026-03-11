import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

function run() {
  const globalCss = readUtf8("src", "app", "globals.css");
  const lineCount = globalCss.split(/\r?\n/).length;

  const removedTokens = [
    ".queue-history-sort-hardening",
    ".queue-history-sort-hardening-plus",
    ".queue-history-sort-execution-tracker",
    ".queue-history-execution-summary",
    ".queue-history-execution-summary-digest",
    ".queue-evidence-preview",
    ".queue-evidence-comparison",
    ".queue-processing-prediction",
    ".queue-delay-risk-prediction",
    ".queue-delay-risk-response",
    ".queue-mobile-review-sheet",
    ".queue-mobile-checklist",
    ".queue-mobile-follow-up-recommendation",
    ".panel-history-sort-hardening",
    ".panel-history-sort-hardening-plus",
    ".panel-history-sort-hardening-plus-execution",
    ".panel-history-sort-execution-summary",
    ".panel-history-execution-summary-digest",
    ".panel-history-risk-prediction",
    ".panel-history-delay-risk-prediction",
    ".panel-history-delay-risk-response",
    ".panel-history-delay-risk-response-execution-guide",
    ".panel-history-delay-risk-response-execution-tracker",
    ".panel-history-delay-risk-execution-backlog",
    ".panel-history-delay-execution-backlog-digest",
    ".panel-people-mobile-follow-up",
    ".panel-payslip-history-sort-hardening",
    ".panel-payslip-history-sort-hardening-plus",
    ".panel-payslip-history-sort-hardening-plus-execution",
    ".panel-payslip-history-sort-execution-summary",
    ".panel-payslip-history-execution-summary-digest",
    ".panel-payslip-delay-risk",
    ".panel-payslip-delay-execution-backlog-digest",
    ".panel-payslip-mobile-follow-up",
    ".panel-mobile-follow-up-recommendation",
    ".panel-mobile-shortcuts",
    ".panel-mobile-submit-guide",
    ".panel-mobile-status-badges",
    ".panel-attendance-correction-insights",
    ".panel-leave-balance-forecast",
    ".panel-leave-calendar-insights",
    ".panel-request-bottleneck-feedback",
    ".panel-request-wait-prediction"
  ];

  for (const token of removedTokens) {
    assert.equal(globalCss.includes(token), false, `globals.css should remove bloat selector token ${token}`);
  }

  const requiredTokens = [
    ".queue-sla-chip",
    ".panel-org-chart",
    ".panel-employee-history",
    ".compare-change-chip",
    ".history-change-summary-list"
  ];

  for (const token of requiredTokens) {
    assert.equal(globalCss.includes(token), true, `globals.css should keep core selector token ${token}`);
  }

  assert.ok(
    lineCount <= 5050,
    `globals.css should stay under the 5050-line visual-wave guard after WI-0180 cleanup (current: ${lineCount})`
  );
}

run();
console.log("e2e-wi0180-globals-css-bloat-class-cleanup.test passed");
