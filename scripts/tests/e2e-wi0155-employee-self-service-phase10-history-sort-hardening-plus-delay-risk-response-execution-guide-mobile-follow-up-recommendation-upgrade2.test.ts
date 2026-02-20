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
    /requestHistorySortHardeningPlusCards/,
    "employee page should compute request history sort hardening plus cards"
  );
  assert.match(
    employeePage,
    /approvalDelayRiskResponseExecutionGuideCards/,
    "employee page should compute approval delay risk response execution guide cards"
  );
  assert.match(
    employeePage,
    /mobileFollowUpRecommendationUpgrade2Cards/,
    "employee page should compute mobile follow-up recommendation upgrade 2 cards"
  );
  assert.match(
    employeePage,
    /runRequestHistorySortHardeningPlusAction/,
    "employee page should expose sort hardening plus action handler"
  );
  assert.match(
    employeePage,
    /runApprovalDelayRiskResponseExecutionGuideAction/,
    "employee page should expose delay risk response execution guide action handler"
  );
  assert.match(
    employeePage,
    /runMobileFollowUpRecommendationUpgrade2Action/,
    "employee page should expose recommendation upgrade 2 action handler"
  );
  assert.match(
    employeePage,
    /id="request-history-sort-hardening-plus"/,
    "employee page should expose request history sort hardening plus section"
  );
  assert.match(
    employeePage,
    /id="approval-delay-risk-response-execution-guide"/,
    "employee page should expose approval delay risk response execution guide section"
  );
  assert.match(
    employeePage,
    /id="mobile-follow-up-recommendation-upgrade-2"/,
    "employee page should expose mobile follow-up recommendation upgrade 2 section"
  );
  assert.match(
    employeePage,
    /aria-label="request history sort hardening plus feedback list"/,
    "employee page should render request history sort hardening plus list"
  );
  assert.match(
    employeePage,
    /aria-label="approval delay risk response execution guide list"/,
    "employee page should render delay risk response execution guide list"
  );
  assert.match(
    employeePage,
    /aria-label="mobile follow-up recommendation upgrade 2 list"/,
    "employee page should render mobile recommendation upgrade 2 list"
  );

  assert.match(
    employeeLayout,
    /\/employee#request-history-sort-hardening-plus/,
    "employee nav should include request history sort hardening plus anchor"
  );
  assert.match(
    employeeLayout,
    /\/employee#approval-delay-risk-response-execution-guide/,
    "employee nav should include delay risk response execution guide anchor"
  );
  assert.match(
    employeeLayout,
    /\/employee#mobile-follow-up-recommendation-upgrade-2/,
    "employee nav should include mobile recommendation upgrade 2 anchor"
  );

  assert.match(
    globalCss,
    /\.panel-request-history-sort-hardening-plus/,
    "request history sort hardening plus panel style should exist"
  );
  assert.match(
    globalCss,
    /\.request-history-sort-hardening-plus-list/,
    "request history sort hardening plus list style should exist"
  );
  assert.match(
    globalCss,
    /\.panel-approval-delay-risk-response-execution-guide/,
    "approval delay risk response execution guide panel style should exist"
  );
  assert.match(
    globalCss,
    /\.approval-delay-risk-response-execution-guide-list/,
    "approval delay risk response execution guide list style should exist"
  );
  assert.match(
    globalCss,
    /\.panel-mobile-follow-up-recommendation-upgrade-2/,
    "mobile recommendation upgrade 2 panel style should exist"
  );
  assert.match(
    globalCss,
    /\.mobile-follow-up-recommendation-upgrade-2-list/,
    "mobile recommendation upgrade 2 list style should exist"
  );
  assert.match(
    globalCss,
    /#request-history-sort-hardening-plus \.request-history-sort-hardening-plus-list/,
    "responsive rule for request history sort hardening plus list should exist"
  );
  assert.match(
    globalCss,
    /#approval-delay-risk-response-execution-guide \.approval-delay-risk-response-execution-guide-list/,
    "responsive rule for delay risk response execution guide list should exist"
  );
  assert.match(
    globalCss,
    /#mobile-follow-up-recommendation-upgrade-2 \.mobile-follow-up-recommendation-upgrade-2-list/,
    "responsive rule for mobile recommendation upgrade 2 list should exist"
  );
}

run();
console.log(
  "e2e-wi0155-employee-self-service-phase10-history-sort-hardening-plus-delay-risk-response-execution-guide-mobile-follow-up-recommendation-upgrade2.test passed"
);
