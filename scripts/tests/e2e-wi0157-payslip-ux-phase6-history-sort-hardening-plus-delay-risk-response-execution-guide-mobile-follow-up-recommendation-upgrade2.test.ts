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
    /payslipHistorySortHardeningPlusCards/,
    "payslip page should compute history sort hardening plus cards"
  );
  assert.match(
    payslipPage,
    /payslipDelayRiskResponseExecutionGuideCards/,
    "payslip page should compute delay risk response execution guide cards"
  );
  assert.match(
    payslipPage,
    /payslipMobileFollowUpRecommendationUpgrade2Cards/,
    "payslip page should compute mobile follow-up recommendation upgrade 2 cards"
  );
  assert.match(
    payslipPage,
    /runPayslipHistorySortHardeningPlusAction/,
    "payslip page should expose sort hardening plus action handler"
  );
  assert.match(
    payslipPage,
    /runPayslipDelayRiskResponseExecutionGuideAction/,
    "payslip page should expose delay response execution guide action handler"
  );
  assert.match(
    payslipPage,
    /runPayslipMobileFollowUpRecommendationUpgrade2Action/,
    "payslip page should expose recommendation upgrade 2 action handler"
  );
  assert.match(
    payslipPage,
    /id="payslip-history-sort-hardening-plus"/,
    "payslip page should expose history sort hardening plus section"
  );
  assert.match(
    payslipPage,
    /id="payslip-delay-risk-response-execution-guide"/,
    "payslip page should expose delay risk response execution guide section"
  );
  assert.match(
    payslipPage,
    /id="payslip-mobile-follow-up-recommendation-upgrade-2"/,
    "payslip page should expose mobile recommendation upgrade 2 section"
  );
  assert.match(
    payslipPage,
    /aria-label="payslip history sort hardening plus feedback list"/,
    "payslip page should render history sort hardening plus list"
  );
  assert.match(
    payslipPage,
    /aria-label="payslip delay risk response execution guide list"/,
    "payslip page should render delay response execution guide list"
  );
  assert.match(
    payslipPage,
    /aria-label="payslip mobile follow-up recommendation upgrade 2 list"/,
    "payslip page should render mobile recommendation upgrade 2 list"
  );

  assert.match(
    employeeLayout,
    /\/employee\/payslips#payslip-history-sort-hardening-plus/,
    "employee nav should include payslip history sort hardening plus anchor"
  );
  assert.match(
    employeeLayout,
    /\/employee\/payslips#payslip-delay-risk-response-execution-guide/,
    "employee nav should include payslip delay response execution guide anchor"
  );
  assert.match(
    employeeLayout,
    /\/employee\/payslips#payslip-mobile-follow-up-recommendation-upgrade-2/,
    "employee nav should include payslip mobile recommendation upgrade 2 anchor"
  );

  assert.match(
    globalCss,
    /\.panel-payslip-history-sort-hardening-plus/,
    "payslip history sort hardening plus panel style should exist"
  );
  assert.match(
    globalCss,
    /\.payslip-history-sort-hardening-plus-list/,
    "payslip history sort hardening plus list style should exist"
  );
  assert.match(
    globalCss,
    /\.panel-payslip-delay-risk-response-execution-guide/,
    "payslip delay response execution guide panel style should exist"
  );
  assert.match(
    globalCss,
    /\.payslip-delay-risk-response-execution-guide-list/,
    "payslip delay response execution guide list style should exist"
  );
  assert.match(
    globalCss,
    /\.panel-payslip-mobile-follow-up-recommendation-upgrade-2/,
    "payslip mobile recommendation upgrade 2 panel style should exist"
  );
  assert.match(
    globalCss,
    /\.payslip-mobile-follow-up-recommendation-upgrade-2-list/,
    "payslip mobile recommendation upgrade 2 list style should exist"
  );
  assert.match(
    globalCss,
    /#payslip-history-sort-hardening-plus \.payslip-history-sort-hardening-plus-list/,
    "responsive rule for payslip history sort hardening plus list should exist"
  );
  assert.match(
    globalCss,
    /#payslip-delay-risk-response-execution-guide \.payslip-delay-risk-response-execution-guide-list/,
    "responsive rule for payslip delay response execution guide list should exist"
  );
  assert.match(
    globalCss,
    /#payslip-mobile-follow-up-recommendation-upgrade-2 \.payslip-mobile-follow-up-recommendation-upgrade-2-list/,
    "responsive rule for payslip mobile recommendation upgrade 2 list should exist"
  );
}

run();
console.log(
  "e2e-wi0157-payslip-ux-phase6-history-sort-hardening-plus-delay-risk-response-execution-guide-mobile-follow-up-recommendation-upgrade2.test passed"
);
