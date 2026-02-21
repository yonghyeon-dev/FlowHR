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
    /payslipHistorySortExecutionSummaryCards/,
    "payslip page should compute history sort execution summary cards"
  );
  assert.match(
    payslipPage,
    /payslipDelayRiskExecutionBacklogCards/,
    "payslip page should compute delay risk execution backlog cards"
  );
  assert.match(
    payslipPage,
    /payslipMobileFollowUpRecommendationUpgrade4Cards/,
    "payslip page should compute mobile follow-up recommendation upgrade 4 cards"
  );
  assert.match(
    payslipPage,
    /runPayslipHistorySortExecutionSummaryAction/,
    "payslip page should expose history sort execution summary action handler"
  );
  assert.match(
    payslipPage,
    /runPayslipDelayRiskExecutionBacklogAction/,
    "payslip page should expose delay risk execution backlog action handler"
  );
  assert.match(
    payslipPage,
    /runPayslipMobileFollowUpRecommendationUpgrade4Action/,
    "payslip page should expose recommendation upgrade 4 action handler"
  );

  assert.match(
    payslipPage,
    /id="payslip-history-sort-execution-summary"/,
    "payslip page should expose history sort execution summary section"
  );
  assert.match(
    payslipPage,
    /id="payslip-delay-risk-execution-backlog"/,
    "payslip page should expose delay risk execution backlog section"
  );
  assert.match(
    payslipPage,
    /id="payslip-mobile-follow-up-recommendation-upgrade-4"/,
    "payslip page should expose mobile recommendation upgrade 4 section"
  );

  assert.match(
    payslipPage,
    /aria-label="payslip history sort execution summary list"/,
    "payslip page should render history sort execution summary list"
  );
  assert.match(
    payslipPage,
    /aria-label="payslip delay risk execution backlog list"/,
    "payslip page should render delay risk execution backlog list"
  );
  assert.match(
    payslipPage,
    /aria-label="payslip mobile follow-up recommendation upgrade 4 list"/,
    "payslip page should render mobile recommendation upgrade 4 list"
  );

  assert.match(
    employeeLayout,
    /\/employee\/payslips#payslip-history-sort-execution-summary/,
    "employee nav should include payslip history sort execution summary anchor"
  );
  assert.match(
    employeeLayout,
    /\/employee\/payslips#payslip-delay-risk-execution-backlog/,
    "employee nav should include payslip delay risk execution backlog anchor"
  );
  assert.match(
    employeeLayout,
    /\/employee\/payslips#payslip-mobile-follow-up-recommendation-upgrade-4/,
    "employee nav should include payslip mobile recommendation upgrade 4 anchor"
  );

  assert.match(
    globalCss,
    /\.panel-payslip-history-sort-execution-summary/,
    "payslip history sort execution summary panel style should exist"
  );
  assert.match(
    globalCss,
    /\.payslip-history-sort-execution-summary-list/,
    "payslip history sort execution summary list style should exist"
  );
  assert.match(
    globalCss,
    /\.panel-payslip-delay-risk-execution-backlog/,
    "payslip delay risk execution backlog panel style should exist"
  );
  assert.match(
    globalCss,
    /\.payslip-delay-risk-execution-backlog-list/,
    "payslip delay risk execution backlog list style should exist"
  );
  assert.match(
    globalCss,
    /\.panel-payslip-mobile-follow-up-recommendation-upgrade-4/,
    "payslip mobile recommendation upgrade 4 panel style should exist"
  );
  assert.match(
    globalCss,
    /\.payslip-mobile-follow-up-recommendation-upgrade-4-list/,
    "payslip mobile recommendation upgrade 4 list style should exist"
  );

  assert.match(
    globalCss,
    /#payslip-history-sort-execution-summary \.payslip-history-sort-execution-summary-list/,
    "responsive rule for payslip history sort execution summary list should exist"
  );
  assert.match(
    globalCss,
    /#payslip-delay-risk-execution-backlog \.payslip-delay-risk-execution-backlog-list/,
    "responsive rule for payslip delay risk execution backlog list should exist"
  );
  assert.match(
    globalCss,
    /#payslip-mobile-follow-up-recommendation-upgrade-4 \.payslip-mobile-follow-up-recommendation-upgrade-4-list/,
    "responsive rule for payslip mobile recommendation upgrade 4 list should exist"
  );
}

run();
console.log(
  "e2e-wi0165-payslip-ux-phase8-execution-summary-delay-backlog-mobile-follow-up-recommendation-upgrade4.test passed"
);
