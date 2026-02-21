import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

function run() {
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const employeeLayout = readUtf8("src", "app", "employee", "layout.tsx");
  const globalCss = readUtf8("src", "app", "globals.css");

  assert.match(
    employeePage,
    /requestHistorySortHardeningPlusExecutionCards/,
    "employee page should compute request history sort hardening plus execution cards"
  );
  assert.match(
    employeePage,
    /approvalDelayRiskResponseExecutionTrackerCards/,
    "employee page should compute approval delay risk response execution tracker cards"
  );
  assert.match(
    employeePage,
    /mobileFollowUpRecommendationUpgrade3Cards/,
    "employee page should compute mobile follow-up recommendation upgrade 3 cards"
  );
  assert.match(
    employeePage,
    /runRequestHistorySortHardeningPlusExecutionAction/,
    "employee page should expose hardening plus execution action handler"
  );
  assert.match(
    employeePage,
    /runApprovalDelayRiskResponseExecutionTrackerAction/,
    "employee page should expose delay response execution tracker action handler"
  );
  assert.match(
    employeePage,
    /runMobileFollowUpRecommendationUpgrade3Action/,
    "employee page should expose recommendation upgrade 3 action handler"
  );
  assert.match(
    employeePage,
    /id="request-history-sort-hardening-plus-execution"/,
    "employee page should expose request history sort hardening plus execution section"
  );
  assert.match(
    employeePage,
    /id="approval-delay-risk-response-execution-tracker"/,
    "employee page should expose approval delay risk response execution tracker section"
  );
  assert.match(
    employeePage,
    /id="mobile-follow-up-recommendation-upgrade-3"/,
    "employee page should expose mobile follow-up recommendation upgrade 3 section"
  );
  assert.match(
    employeePage,
    /aria-label="request history sort hardening plus execution list"/,
    "employee page should render request history sort hardening plus execution list"
  );
  assert.match(
    employeePage,
    /aria-label="approval delay risk response execution tracker list"/,
    "employee page should render approval delay risk response execution tracker list"
  );
  assert.match(
    employeePage,
    /aria-label="mobile follow-up recommendation upgrade 3 list"/,
    "employee page should render mobile follow-up recommendation upgrade 3 list"
  );

  assert.match(
    employeeLayout,
    /\/employee#request-history-sort-hardening-plus-execution/,
    "employee nav should include request history sort hardening plus execution anchor"
  );
  assert.match(
    employeeLayout,
    /\/employee#approval-delay-risk-response-execution-tracker/,
    "employee nav should include delay response execution tracker anchor"
  );
  assert.match(
    employeeLayout,
    /\/employee#mobile-follow-up-recommendation-upgrade-3/,
    "employee nav should include mobile recommendation upgrade 3 anchor"
  );

  assert.match(
    globalCss,
    /\.panel-request-history-sort-hardening-plus-execution/,
    "request history sort hardening plus execution panel style should exist"
  );
  assert.match(
    globalCss,
    /\.request-history-sort-hardening-plus-execution-list/,
    "request history sort hardening plus execution list style should exist"
  );
  assert.match(
    globalCss,
    /\.panel-approval-delay-risk-response-execution-tracker/,
    "approval delay risk response execution tracker panel style should exist"
  );
  assert.match(
    globalCss,
    /\.approval-delay-risk-response-execution-tracker-list/,
    "approval delay risk response execution tracker list style should exist"
  );
  assert.match(
    globalCss,
    /\.panel-mobile-follow-up-recommendation-upgrade-3/,
    "mobile recommendation upgrade 3 panel style should exist"
  );
  assert.match(
    globalCss,
    /\.mobile-follow-up-recommendation-upgrade-3-list/,
    "mobile recommendation upgrade 3 list style should exist"
  );
  assert.match(
    globalCss,
    /#request-history-sort-hardening-plus-execution \.request-history-sort-hardening-plus-execution-list/,
    "responsive rule for request history sort hardening plus execution list should exist"
  );
  assert.match(
    globalCss,
    /#approval-delay-risk-response-execution-tracker \.approval-delay-risk-response-execution-tracker-list/,
    "responsive rule for delay response execution tracker list should exist"
  );
  assert.match(
    globalCss,
    /#mobile-follow-up-recommendation-upgrade-3 \.mobile-follow-up-recommendation-upgrade-3-list/,
    "responsive rule for mobile recommendation upgrade 3 list should exist"
  );
}

run();
console.log(
  "e2e-wi0159-employee-self-service-phase11-history-sort-hardening-plus-execution-delay-risk-response-execution-tracker-mobile-follow-up-recommendation-upgrade3.test passed"
);
