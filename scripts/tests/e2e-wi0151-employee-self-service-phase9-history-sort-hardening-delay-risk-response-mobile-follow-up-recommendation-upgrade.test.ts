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
    /requestHistorySortHardeningCards/,
    "employee page should compute request history sort hardening cards"
  );
  assert.match(
    employeePage,
    /approvalDelayRiskResponseCards/,
    "employee page should compute approval delay risk response cards"
  );
  assert.match(
    employeePage,
    /mobileFollowUpRecommendationUpgradeCards/,
    "employee page should compute mobile follow-up recommendation upgrade cards"
  );
  assert.match(
    employeePage,
    /runRequestHistorySortHardeningAction/,
    "employee page should expose sort hardening action handler"
  );
  assert.match(
    employeePage,
    /runApprovalDelayRiskResponseAction/,
    "employee page should expose delay risk response action handler"
  );
  assert.match(
    employeePage,
    /runMobileFollowUpRecommendationUpgradeAction/,
    "employee page should expose recommendation upgrade action handler"
  );
  assert.match(
    employeePage,
    /id="request-history-sort-hardening"/,
    "employee page should expose request history sort hardening section"
  );
  assert.match(
    employeePage,
    /id="approval-delay-risk-response"/,
    "employee page should expose approval delay risk response section"
  );
  assert.match(
    employeePage,
    /id="mobile-follow-up-recommendation-upgrade"/,
    "employee page should expose mobile follow-up recommendation upgrade section"
  );
  assert.match(
    employeePage,
    /aria-label="request history sort hardening feedback list"/,
    "employee page should render request history sort hardening list"
  );
  assert.match(
    employeePage,
    /aria-label="approval delay risk response feedback list"/,
    "employee page should render approval delay risk response list"
  );
  assert.match(
    employeePage,
    /aria-label="mobile follow-up recommendation upgrade list"/,
    "employee page should render mobile follow-up recommendation upgrade list"
  );

  assert.match(
    employeeLayout,
    /\/employee#request-history-sort-hardening/,
    "employee nav should include request history sort hardening anchor"
  );
  assert.match(
    employeeLayout,
    /\/employee#approval-delay-risk-response/,
    "employee nav should include approval delay risk response anchor"
  );
  assert.match(
    employeeLayout,
    /\/employee#mobile-follow-up-recommendation-upgrade/,
    "employee nav should include mobile follow-up recommendation upgrade anchor"
  );

  assert.match(
    globalCss,
    /\.panel-request-history-sort-hardening/,
    "request history sort hardening panel style should exist"
  );
  assert.match(
    globalCss,
    /\.request-history-sort-hardening-list/,
    "request history sort hardening list style should exist"
  );
  assert.match(
    globalCss,
    /\.panel-approval-delay-risk-response/,
    "approval delay risk response panel style should exist"
  );
  assert.match(
    globalCss,
    /\.approval-delay-risk-response-list/,
    "approval delay risk response list style should exist"
  );
  assert.match(
    globalCss,
    /\.panel-mobile-follow-up-recommendation-upgrade/,
    "mobile follow-up recommendation upgrade panel style should exist"
  );
  assert.match(
    globalCss,
    /\.mobile-follow-up-recommendation-upgrade-list/,
    "mobile follow-up recommendation upgrade list style should exist"
  );
  assert.match(
    globalCss,
    /#request-history-sort-hardening \.request-history-sort-hardening-list/,
    "responsive rule for request history sort hardening list should exist"
  );
  assert.match(
    globalCss,
    /#approval-delay-risk-response \.approval-delay-risk-response-list/,
    "responsive rule for approval delay risk response list should exist"
  );
  assert.match(
    globalCss,
    /#mobile-follow-up-recommendation-upgrade \.mobile-follow-up-recommendation-upgrade-list/,
    "responsive rule for mobile recommendation upgrade list should exist"
  );
}

run();
console.log(
  "e2e-wi0151-employee-self-service-phase9-history-sort-hardening-delay-risk-response-mobile-follow-up-recommendation-upgrade.test passed"
);
