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
    /payslipHistorySortHardeningPlusExecutionCards/,
    "payslip page should compute history sort hardening plus execution cards"
  );
  assert.match(
    payslipPage,
    /payslipDelayRiskResponseExecutionTrackerCards/,
    "payslip page should compute delay risk response execution tracker cards"
  );
  assert.match(
    payslipPage,
    /payslipMobileFollowUpRecommendationUpgrade3Cards/,
    "payslip page should compute mobile follow-up recommendation upgrade 3 cards"
  );
  assert.match(
    payslipPage,
    /runPayslipHistorySortHardeningPlusExecutionAction/,
    "payslip page should expose hardening plus execution action handler"
  );
  assert.match(
    payslipPage,
    /runPayslipDelayRiskResponseExecutionTrackerAction/,
    "payslip page should expose delay response execution tracker action handler"
  );
  assert.match(
    payslipPage,
    /runPayslipMobileFollowUpRecommendationUpgrade3Action/,
    "payslip page should expose recommendation upgrade 3 action handler"
  );
  assert.match(
    payslipPage,
    /id="payslip-history-sort-hardening-plus-execution"/,
    "payslip page should expose history sort hardening plus execution section"
  );
  assert.match(
    payslipPage,
    /id="payslip-delay-risk-response-execution-tracker"/,
    "payslip page should expose delay risk response execution tracker section"
  );
  assert.match(
    payslipPage,
    /id="payslip-mobile-follow-up-recommendation-upgrade-3"/,
    "payslip page should expose mobile recommendation upgrade 3 section"
  );
  assert.match(
    payslipPage,
    /aria-label="payslip history sort hardening plus execution list"/,
    "payslip page should render history sort hardening plus execution list"
  );
  assert.match(
    payslipPage,
    /aria-label="payslip delay risk response execution tracker list"/,
    "payslip page should render delay response execution tracker list"
  );
  assert.match(
    payslipPage,
    /aria-label="payslip mobile follow-up recommendation upgrade 3 list"/,
    "payslip page should render mobile recommendation upgrade 3 list"
  );

  assert.match(
    employeeLayout,
    /\/employee\/payslips#payslip-history-sort-hardening-plus-execution/,
    "employee nav should include payslip history sort hardening plus execution anchor"
  );
  assert.match(
    employeeLayout,
    /\/employee\/payslips#payslip-delay-risk-response-execution-tracker/,
    "employee nav should include payslip delay response execution tracker anchor"
  );
  assert.match(
    employeeLayout,
    /\/employee\/payslips#payslip-mobile-follow-up-recommendation-upgrade-3/,
    "employee nav should include payslip mobile recommendation upgrade 3 anchor"
  );

  assert.match(
    globalCss,
    /\.panel-payslip-history-sort-hardening-plus-execution/,
    "payslip history sort hardening plus execution panel style should exist"
  );
  assert.match(
    globalCss,
    /\.payslip-history-sort-hardening-plus-execution-list/,
    "payslip history sort hardening plus execution list style should exist"
  );
  assert.match(
    globalCss,
    /\.panel-payslip-delay-risk-response-execution-tracker/,
    "payslip delay response execution tracker panel style should exist"
  );
  assert.match(
    globalCss,
    /\.payslip-delay-risk-response-execution-tracker-list/,
    "payslip delay response execution tracker list style should exist"
  );
  assert.match(
    globalCss,
    /\.panel-payslip-mobile-follow-up-recommendation-upgrade-3/,
    "payslip mobile recommendation upgrade 3 panel style should exist"
  );
  assert.match(
    globalCss,
    /\.payslip-mobile-follow-up-recommendation-upgrade-3-list/,
    "payslip mobile recommendation upgrade 3 list style should exist"
  );
  assert.match(
    globalCss,
    /#payslip-history-sort-hardening-plus-execution \.payslip-history-sort-hardening-plus-execution-list/,
    "responsive rule for payslip history sort hardening plus execution list should exist"
  );
  assert.match(
    globalCss,
    /#payslip-delay-risk-response-execution-tracker \.payslip-delay-risk-response-execution-tracker-list/,
    "responsive rule for payslip delay response execution tracker list should exist"
  );
  assert.match(
    globalCss,
    /#payslip-mobile-follow-up-recommendation-upgrade-3 \.payslip-mobile-follow-up-recommendation-upgrade-3-list/,
    "responsive rule for payslip mobile recommendation upgrade 3 list should exist"
  );
}

run();
console.log(
  "e2e-wi0161-payslip-ux-phase7-history-sort-hardening-plus-execution-delay-risk-response-execution-tracker-mobile-follow-up-recommendation-upgrade3.test passed"
);
