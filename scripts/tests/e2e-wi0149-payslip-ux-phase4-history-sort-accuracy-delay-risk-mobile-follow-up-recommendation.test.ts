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
    /payslipHistorySortAccuracyCards/,
    "payslip page should compute history sort accuracy cards"
  );
  assert.match(
    payslipPage,
    /payslipDelayRiskPredictionCards/,
    "payslip page should compute delay risk prediction cards"
  );
  assert.match(
    payslipPage,
    /payslipMobileFollowUpRecommendationCards/,
    "payslip page should compute mobile follow-up recommendation cards"
  );
  assert.match(
    payslipPage,
    /runPayslipMobileFollowUpRecommendationAction/,
    "payslip page should expose recommendation action handler"
  );
  assert.match(
    payslipPage,
    /id="payslip-history-sort-accuracy"/,
    "payslip page should expose history sort accuracy section"
  );
  assert.match(
    payslipPage,
    /id="payslip-delay-risk-prediction"/,
    "payslip page should expose delay risk prediction section"
  );
  assert.match(
    payslipPage,
    /id="payslip-mobile-follow-up-recommendation"/,
    "payslip page should expose mobile follow-up recommendation section"
  );
  assert.match(
    payslipPage,
    /aria-label="payslip history sort accuracy feedback list"/,
    "payslip page should render history sort accuracy list"
  );
  assert.match(
    payslipPage,
    /aria-label="payslip delay risk prediction feedback list"/,
    "payslip page should render delay risk prediction list"
  );
  assert.match(
    payslipPage,
    /aria-label="payslip mobile follow-up recommendation list"/,
    "payslip page should render mobile follow-up recommendation list"
  );

  assert.match(
    employeeLayout,
    /\/employee\/payslips#payslip-history-sort-accuracy/,
    "employee nav should include payslip history sort accuracy anchor"
  );
  assert.match(
    employeeLayout,
    /\/employee\/payslips#payslip-delay-risk-prediction/,
    "employee nav should include payslip delay risk prediction anchor"
  );
  assert.match(
    employeeLayout,
    /\/employee\/payslips#payslip-mobile-follow-up-recommendation/,
    "employee nav should include payslip mobile follow-up recommendation anchor"
  );

  assert.match(
    globalCss,
    /\.panel-payslip-history-sort-accuracy/,
    "payslip history sort accuracy panel style should exist"
  );
  assert.match(
    globalCss,
    /\.payslip-history-sort-accuracy-list/,
    "payslip history sort accuracy list style should exist"
  );
  assert.match(
    globalCss,
    /\.panel-payslip-delay-risk-prediction/,
    "payslip delay risk prediction panel style should exist"
  );
  assert.match(
    globalCss,
    /\.payslip-delay-risk-prediction-list/,
    "payslip delay risk prediction list style should exist"
  );
  assert.match(
    globalCss,
    /\.panel-payslip-mobile-follow-up-recommendation/,
    "payslip mobile follow-up recommendation panel style should exist"
  );
  assert.match(
    globalCss,
    /\.payslip-mobile-follow-up-recommendation-list/,
    "payslip mobile follow-up recommendation list style should exist"
  );
  assert.match(
    globalCss,
    /#payslip-history-sort-accuracy \.payslip-history-sort-accuracy-list/,
    "responsive rule for payslip history sort accuracy list should exist"
  );
  assert.match(
    globalCss,
    /#payslip-delay-risk-prediction \.payslip-delay-risk-prediction-list/,
    "responsive rule for payslip delay risk prediction list should exist"
  );
  assert.match(
    globalCss,
    /#payslip-mobile-follow-up-recommendation \.payslip-mobile-follow-up-recommendation-list/,
    "responsive rule for payslip mobile follow-up recommendation list should exist"
  );
}

run();
console.log(
  "e2e-wi0149-payslip-ux-phase4-history-sort-accuracy-delay-risk-mobile-follow-up-recommendation.test passed"
);
