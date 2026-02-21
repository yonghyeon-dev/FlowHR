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
    /requestHistoryExecutionSummaryDigestCards/,
    "employee page should compute request history execution summary digest cards"
  );
  assert.match(
    employeePage,
    /approvalDelayExecutionBacklogDigestCards/,
    "employee page should compute approval delay execution backlog digest cards"
  );
  assert.match(
    employeePage,
    /mobileFollowUpRecommendationUpgrade5Cards/,
    "employee page should compute mobile follow-up recommendation upgrade 5 cards"
  );
  assert.match(
    employeePage,
    /runRequestHistoryExecutionSummaryDigestAction/,
    "employee page should expose request history execution summary digest action handler"
  );
  assert.match(
    employeePage,
    /runApprovalDelayExecutionBacklogDigestAction/,
    "employee page should expose approval delay execution backlog digest action handler"
  );
  assert.match(
    employeePage,
    /runMobileFollowUpRecommendationUpgrade5Action/,
    "employee page should expose recommendation upgrade 5 action handler"
  );

  assert.match(
    employeePage,
    /id="request-history-execution-summary-digest"/,
    "employee page should expose request history execution summary digest section"
  );
  assert.match(
    employeePage,
    /id="approval-delay-execution-backlog-digest"/,
    "employee page should expose approval delay execution backlog digest section"
  );
  assert.match(
    employeePage,
    /id="mobile-follow-up-recommendation-upgrade-5"/,
    "employee page should expose mobile follow-up recommendation upgrade 5 section"
  );

  assert.match(
    employeePage,
    /aria-label="request history execution summary digest list"/,
    "employee page should render request history execution summary digest list"
  );
  assert.match(
    employeePage,
    /aria-label="approval delay execution backlog digest list"/,
    "employee page should render approval delay execution backlog digest list"
  );
  assert.match(
    employeePage,
    /aria-label="mobile follow-up recommendation upgrade 5 list"/,
    "employee page should render mobile follow-up recommendation upgrade 5 list"
  );

  assert.match(
    employeeLayout,
    /\/employee#request-history-execution-summary-digest/,
    "employee nav should include request history execution summary digest anchor"
  );
  assert.match(
    employeeLayout,
    /\/employee#approval-delay-execution-backlog-digest/,
    "employee nav should include approval delay execution backlog digest anchor"
  );
  assert.match(
    employeeLayout,
    /\/employee#mobile-follow-up-recommendation-upgrade-5/,
    "employee nav should include mobile recommendation upgrade 5 anchor"
  );

  assert.match(
    globalCss,
    /\.panel-request-history-execution-summary-digest/,
    "request history execution summary digest panel style should exist"
  );
  assert.match(
    globalCss,
    /\.request-history-execution-summary-digest-list/,
    "request history execution summary digest list style should exist"
  );
  assert.match(
    globalCss,
    /\.panel-approval-delay-execution-backlog-digest/,
    "approval delay execution backlog digest panel style should exist"
  );
  assert.match(
    globalCss,
    /\.approval-delay-execution-backlog-digest-list/,
    "approval delay execution backlog digest list style should exist"
  );
  assert.match(
    globalCss,
    /\.panel-mobile-follow-up-recommendation-upgrade-5/,
    "mobile recommendation upgrade 5 panel style should exist"
  );
  assert.match(
    globalCss,
    /\.mobile-follow-up-recommendation-upgrade-5-list/,
    "mobile recommendation upgrade 5 list style should exist"
  );

  assert.match(
    globalCss,
    /#request-history-execution-summary-digest \.request-history-execution-summary-digest-list/,
    "responsive rule for request history execution summary digest list should exist"
  );
  assert.match(
    globalCss,
    /#approval-delay-execution-backlog-digest \.approval-delay-execution-backlog-digest-list/,
    "responsive rule for approval delay execution backlog digest list should exist"
  );
  assert.match(
    globalCss,
    /#mobile-follow-up-recommendation-upgrade-5 \.mobile-follow-up-recommendation-upgrade-5-list/,
    "responsive rule for mobile recommendation upgrade 5 list should exist"
  );
}

run();
console.log(
  "e2e-wi0171-employee-self-service-ux-phase14-execution-summary-digest-delay-backlog-digest-mobile-follow-up-recommendation-upgrade5.test passed"
);
