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
    /requestHistorySortExecutionSummaryCards/,
    "employee page should compute request history sort execution summary cards"
  );
  assert.match(
    employeePage,
    /approvalDelayRiskExecutionBacklogCards/,
    "employee page should compute approval delay risk execution backlog cards"
  );
  assert.match(
    employeePage,
    /mobileFollowUpRecommendationUpgrade4Cards/,
    "employee page should compute mobile follow-up recommendation upgrade 4 cards"
  );
  assert.match(
    employeePage,
    /runRequestHistorySortExecutionSummaryAction/,
    "employee page should expose request history sort execution summary action handler"
  );
  assert.match(
    employeePage,
    /runApprovalDelayRiskExecutionBacklogAction/,
    "employee page should expose approval delay risk execution backlog action handler"
  );
  assert.match(
    employeePage,
    /runMobileFollowUpRecommendationUpgrade4Action/,
    "employee page should expose recommendation upgrade 4 action handler"
  );

  assert.match(
    employeePage,
    /id="request-history-sort-execution-summary"/,
    "employee page should expose request history sort execution summary section"
  );
  assert.match(
    employeePage,
    /id="approval-delay-risk-execution-backlog"/,
    "employee page should expose approval delay risk execution backlog section"
  );
  assert.match(
    employeePage,
    /id="mobile-follow-up-recommendation-upgrade-4"/,
    "employee page should expose mobile follow-up recommendation upgrade 4 section"
  );

  assert.match(
    employeePage,
    /aria-label="request history sort execution summary list"/,
    "employee page should render request history sort execution summary list"
  );
  assert.match(
    employeePage,
    /aria-label="approval delay risk execution backlog list"/,
    "employee page should render approval delay risk execution backlog list"
  );
  assert.match(
    employeePage,
    /aria-label="mobile follow-up recommendation upgrade 4 list"/,
    "employee page should render mobile follow-up recommendation upgrade 4 list"
  );

  assert.match(
    employeeLayout,
    /\/employee#request-history-sort-execution-summary/,
    "employee nav should include request history sort execution summary anchor"
  );
  assert.match(
    employeeLayout,
    /\/employee#approval-delay-risk-execution-backlog/,
    "employee nav should include approval delay risk execution backlog anchor"
  );
  assert.match(
    employeeLayout,
    /\/employee#mobile-follow-up-recommendation-upgrade-4/,
    "employee nav should include mobile recommendation upgrade 4 anchor"
  );

  assert.match(
    globalCss,
    /\.panel-request-history-sort-execution-summary/,
    "request history sort execution summary panel style should exist"
  );
  assert.match(
    globalCss,
    /\.request-history-sort-execution-summary-list/,
    "request history sort execution summary list style should exist"
  );
  assert.match(
    globalCss,
    /\.panel-approval-delay-risk-execution-backlog/,
    "approval delay risk execution backlog panel style should exist"
  );
  assert.match(
    globalCss,
    /\.approval-delay-risk-execution-backlog-list/,
    "approval delay risk execution backlog list style should exist"
  );
  assert.match(
    globalCss,
    /\.panel-mobile-follow-up-recommendation-upgrade-4/,
    "mobile recommendation upgrade 4 panel style should exist"
  );
  assert.match(
    globalCss,
    /\.mobile-follow-up-recommendation-upgrade-4-list/,
    "mobile recommendation upgrade 4 list style should exist"
  );
  assert.match(
    globalCss,
    /#request-history-sort-execution-summary \.request-history-sort-execution-summary-list/,
    "responsive rule for request history sort execution summary list should exist"
  );
  assert.match(
    globalCss,
    /#approval-delay-risk-execution-backlog \.approval-delay-risk-execution-backlog-list/,
    "responsive rule for approval delay risk execution backlog list should exist"
  );
  assert.match(
    globalCss,
    /#mobile-follow-up-recommendation-upgrade-4 \.mobile-follow-up-recommendation-upgrade-4-list/,
    "responsive rule for mobile recommendation upgrade 4 list should exist"
  );
}

run();
console.log(
  "e2e-wi0167-employee-self-service-ux-phase13-execution-summary-delay-backlog-mobile-follow-up-recommendation-upgrade4.test passed"
);
