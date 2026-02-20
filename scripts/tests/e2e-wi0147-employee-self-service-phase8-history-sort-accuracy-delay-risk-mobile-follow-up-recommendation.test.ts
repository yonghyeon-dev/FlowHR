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
    /requestHistorySortAccuracyCards/,
    "employee page should compute request history sort accuracy cards"
  );
  assert.match(
    employeePage,
    /approvalDelayRiskPredictionCards/,
    "employee page should compute approval delay risk prediction cards"
  );
  assert.match(
    employeePage,
    /mobileFollowUpRecommendationCards/,
    "employee page should compute mobile follow-up recommendation cards"
  );
  assert.match(
    employeePage,
    /runMobileFollowUpRecommendationAction/,
    "employee page should expose follow-up recommendation action handler"
  );
  assert.match(
    employeePage,
    /id="request-history-sort-accuracy"/,
    "employee page should expose request history sort accuracy section"
  );
  assert.match(
    employeePage,
    /id="approval-delay-risk-prediction"/,
    "employee page should expose approval delay risk prediction section"
  );
  assert.match(
    employeePage,
    /id="mobile-follow-up-recommendation"/,
    "employee page should expose mobile follow-up recommendation section"
  );
  assert.match(
    employeePage,
    /aria-label="request history sort accuracy feedback list"/,
    "employee page should render request history sort accuracy list"
  );
  assert.match(
    employeePage,
    /aria-label="approval delay risk prediction feedback list"/,
    "employee page should render approval delay risk prediction list"
  );
  assert.match(
    employeePage,
    /aria-label="mobile follow-up recommendation guide list"/,
    "employee page should render mobile follow-up recommendation list"
  );

  assert.match(
    employeeLayout,
    /\/employee#request-history-sort-accuracy/,
    "employee nav should include request history sort accuracy anchor"
  );
  assert.match(
    employeeLayout,
    /\/employee#approval-delay-risk-prediction/,
    "employee nav should include approval delay risk prediction anchor"
  );
  assert.match(
    employeeLayout,
    /\/employee#mobile-follow-up-recommendation/,
    "employee nav should include mobile follow-up recommendation anchor"
  );

  assert.match(
    globalCss,
    /\.panel-request-history-sort-accuracy/,
    "request history sort accuracy panel style should exist"
  );
  assert.match(
    globalCss,
    /\.request-history-sort-accuracy-list/,
    "request history sort accuracy list style should exist"
  );
  assert.match(
    globalCss,
    /\.panel-approval-delay-risk-prediction/,
    "approval delay risk prediction panel style should exist"
  );
  assert.match(
    globalCss,
    /\.approval-delay-risk-prediction-list/,
    "approval delay risk prediction list style should exist"
  );
  assert.match(
    globalCss,
    /\.panel-mobile-follow-up-recommendation/,
    "mobile follow-up recommendation panel style should exist"
  );
  assert.match(
    globalCss,
    /\.mobile-follow-up-recommendation-list/,
    "mobile follow-up recommendation list style should exist"
  );
  assert.match(
    globalCss,
    /#request-history-sort-accuracy \.request-history-sort-accuracy-list/,
    "responsive rule for request history sort accuracy list should exist"
  );
  assert.match(
    globalCss,
    /#approval-delay-risk-prediction \.approval-delay-risk-prediction-list/,
    "responsive rule for approval delay risk prediction list should exist"
  );
  assert.match(
    globalCss,
    /#mobile-follow-up-recommendation \.mobile-follow-up-recommendation-list/,
    "responsive rule for mobile follow-up recommendation list should exist"
  );
}

run();
console.log(
  "e2e-wi0147-employee-self-service-phase8-history-sort-accuracy-delay-risk-mobile-follow-up-recommendation.test passed"
);
