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
    /payslipHistorySortHardeningCards/,
    "payslip page should compute history sort hardening cards"
  );
  assert.match(
    payslipPage,
    /payslipDelayRiskResponseCards/,
    "payslip page should compute delay risk response cards"
  );
  assert.match(
    payslipPage,
    /payslipMobileFollowUpRecommendationUpgradeCards/,
    "payslip page should compute mobile follow-up recommendation upgrade cards"
  );
  assert.match(
    payslipPage,
    /runPayslipHistorySortHardeningAction/,
    "payslip page should expose sort hardening action handler"
  );
  assert.match(
    payslipPage,
    /runPayslipDelayRiskResponseAction/,
    "payslip page should expose delay risk response action handler"
  );
  assert.match(
    payslipPage,
    /runPayslipMobileFollowUpRecommendationUpgradeAction/,
    "payslip page should expose recommendation upgrade action handler"
  );
  assert.match(
    payslipPage,
    /id="payslip-history-sort-hardening"/,
    "payslip page should expose history sort hardening section"
  );
  assert.match(
    payslipPage,
    /id="payslip-delay-risk-response"/,
    "payslip page should expose delay risk response section"
  );
  assert.match(
    payslipPage,
    /id="payslip-mobile-follow-up-recommendation-upgrade"/,
    "payslip page should expose mobile follow-up recommendation upgrade section"
  );
  assert.match(
    payslipPage,
    /aria-label="payslip history sort hardening feedback list"/,
    "payslip page should render history sort hardening list"
  );
  assert.match(
    payslipPage,
    /aria-label="payslip delay risk response feedback list"/,
    "payslip page should render delay risk response list"
  );
  assert.match(
    payslipPage,
    /aria-label="payslip mobile follow-up recommendation upgrade list"/,
    "payslip page should render mobile follow-up recommendation upgrade list"
  );

  assert.match(
    employeeLayout,
    /\/employee\/payslips#payslip-history-sort-hardening/,
    "employee nav should include payslip history sort hardening anchor"
  );
  assert.match(
    employeeLayout,
    /\/employee\/payslips#payslip-delay-risk-response/,
    "employee nav should include payslip delay risk response anchor"
  );
  assert.match(
    employeeLayout,
    /\/employee\/payslips#payslip-mobile-follow-up-recommendation-upgrade/,
    "employee nav should include payslip mobile recommendation upgrade anchor"
  );

  assert.match(
    globalCss,
    /\.panel-payslip-history-sort-hardening/,
    "payslip history sort hardening panel style should exist"
  );
  assert.match(
    globalCss,
    /\.payslip-history-sort-hardening-list/,
    "payslip history sort hardening list style should exist"
  );
  assert.match(
    globalCss,
    /\.panel-payslip-delay-risk-response/,
    "payslip delay risk response panel style should exist"
  );
  assert.match(
    globalCss,
    /\.payslip-delay-risk-response-list/,
    "payslip delay risk response list style should exist"
  );
  assert.match(
    globalCss,
    /\.panel-payslip-mobile-follow-up-recommendation-upgrade/,
    "payslip mobile recommendation upgrade panel style should exist"
  );
  assert.match(
    globalCss,
    /\.payslip-mobile-follow-up-recommendation-upgrade-list/,
    "payslip mobile recommendation upgrade list style should exist"
  );
  assert.match(
    globalCss,
    /#payslip-history-sort-hardening \.payslip-history-sort-hardening-list/,
    "responsive rule for payslip history sort hardening list should exist"
  );
  assert.match(
    globalCss,
    /#payslip-delay-risk-response \.payslip-delay-risk-response-list/,
    "responsive rule for payslip delay risk response list should exist"
  );
  assert.match(
    globalCss,
    /#payslip-mobile-follow-up-recommendation-upgrade \.payslip-mobile-follow-up-recommendation-upgrade-list/,
    "responsive rule for payslip mobile recommendation upgrade list should exist"
  );
}

run();
console.log(
  "e2e-wi0153-payslip-ux-phase5-history-sort-hardening-delay-risk-response-mobile-follow-up-recommendation-upgrade.test passed"
);
