import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

function run() {
  const payslipPage = readUtf8("src", "app", "employee", "payslips", "page.tsx");
  const employeeLayout = readUtf8("src", "app", "employee", "layout.tsx");
  const globalCss = readUtf8("src", "app", "globals.css");

  assert.match(
    payslipPage,
    /payslipHistoryExecutionSummaryDigestCards/,
    "payslip page should compute history execution summary digest cards"
  );
  assert.match(
    payslipPage,
    /payslipDelayExecutionBacklogDigestCards/,
    "payslip page should compute delay execution backlog digest cards"
  );
  assert.match(
    payslipPage,
    /payslipMobileFollowUpRecommendationUpgrade5Cards/,
    "payslip page should compute mobile follow-up recommendation upgrade 5 cards"
  );
  assert.match(
    payslipPage,
    /runPayslipHistoryExecutionSummaryDigestAction/,
    "payslip page should expose history execution summary digest action handler"
  );
  assert.match(
    payslipPage,
    /runPayslipDelayExecutionBacklogDigestAction/,
    "payslip page should expose delay execution backlog digest action handler"
  );
  assert.match(
    payslipPage,
    /runPayslipMobileFollowUpRecommendationUpgrade5Action/,
    "payslip page should expose recommendation upgrade 5 action handler"
  );

  assert.match(
    payslipPage,
    /id="payslip-history-execution-summary-digest"/,
    "payslip page should expose history execution summary digest section"
  );
  assert.match(
    payslipPage,
    /id="payslip-delay-execution-backlog-digest"/,
    "payslip page should expose delay execution backlog digest section"
  );
  assert.match(
    payslipPage,
    /id="payslip-mobile-follow-up-recommendation-upgrade-5"/,
    "payslip page should expose mobile recommendation upgrade 5 section"
  );

  assert.match(
    payslipPage,
    /aria-label="payslip history execution summary digest list"/,
    "payslip page should render history execution summary digest list"
  );
  assert.match(
    payslipPage,
    /aria-label="payslip delay execution backlog digest list"/,
    "payslip page should render delay execution backlog digest list"
  );
  assert.match(
    payslipPage,
    /aria-label="payslip mobile follow-up recommendation upgrade 5 list"/,
    "payslip page should render mobile recommendation upgrade 5 list"
  );

  assert.match(
    employeeLayout,
    /\/employee\/payslips#payslip-history-execution-summary-digest/,
    "employee nav should include payslip history execution summary digest anchor"
  );
  assert.match(
    employeeLayout,
    /\/employee\/payslips#payslip-delay-execution-backlog-digest/,
    "employee nav should include payslip delay execution backlog digest anchor"
  );
  assert.match(
    employeeLayout,
    /\/employee\/payslips#payslip-mobile-follow-up-recommendation-upgrade-5/,
    "employee nav should include payslip mobile recommendation upgrade 5 anchor"
  );

  assert.match(
    globalCss,
    /\.panel-payslip-history-execution-summary-digest/,
    "payslip history execution summary digest panel style should exist"
  );
  assert.match(
    globalCss,
    /\.payslip-history-execution-summary-digest-list/,
    "payslip history execution summary digest list style should exist"
  );
  assert.match(
    globalCss,
    /\.panel-payslip-delay-execution-backlog-digest/,
    "payslip delay execution backlog digest panel style should exist"
  );
  assert.match(
    globalCss,
    /\.payslip-delay-execution-backlog-digest-list/,
    "payslip delay execution backlog digest list style should exist"
  );
  assert.match(
    globalCss,
    /\.panel-payslip-mobile-follow-up-recommendation-upgrade-5/,
    "payslip mobile recommendation upgrade 5 panel style should exist"
  );
  assert.match(
    globalCss,
    /\.payslip-mobile-follow-up-recommendation-upgrade-5-list/,
    "payslip mobile recommendation upgrade 5 list style should exist"
  );

  assert.match(
    globalCss,
    /#payslip-history-execution-summary-digest \.payslip-history-execution-summary-digest-list/,
    "responsive rule for payslip history execution summary digest list should exist"
  );
  assert.match(
    globalCss,
    /#payslip-delay-execution-backlog-digest \.payslip-delay-execution-backlog-digest-list/,
    "responsive rule for payslip delay execution backlog digest list should exist"
  );
  assert.match(
    globalCss,
    /#payslip-mobile-follow-up-recommendation-upgrade-5 \.payslip-mobile-follow-up-recommendation-upgrade-5-list/,
    "responsive rule for payslip mobile recommendation upgrade 5 list should exist"
  );
}

run();
console.log(
  "e2e-wi0169-payslip-ux-phase9-execution-summary-digest-delay-backlog-digest-mobile-follow-up-recommendation-upgrade5.test passed"
);
