import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

function run() {
  const adminLayout = readUtf8("src", "app", "admin", "layout.tsx");
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const globalCss = readUtf8("src", "app", "globals.css");

  assert.match(
    adminPage,
    /queueHistorySortAccuracyCards/,
    "admin page should compute queue history sort accuracy cards"
  );
  assert.match(
    adminPage,
    /queueDelayRiskPredictionCards/,
    "admin page should compute queue delay risk prediction cards"
  );
  assert.match(
    adminPage,
    /queueMobileFollowUpRecommendationCards/,
    "admin page should compute queue mobile follow-up recommendation cards"
  );
  assert.match(
    adminPage,
    /id="approval-history-sort-accuracy"/,
    "admin page should expose history sort accuracy section"
  );
  assert.match(
    adminPage,
    /id="approval-delay-risk-prediction"/,
    "admin page should expose delay risk prediction section"
  );
  assert.match(
    adminPage,
    /id="approval-mobile-follow-up-recommendation"/,
    "admin page should expose mobile follow-up recommendation section"
  );
  assert.match(
    adminPage,
    /aria-label="approval history sort accuracy feedback list"/,
    "admin page should render history sort accuracy list"
  );
  assert.match(
    adminPage,
    /aria-label="approval delay risk prediction feedback list"/,
    "admin page should render delay risk prediction list"
  );
  assert.match(
    adminPage,
    /aria-label="approval mobile follow-up recommendation list"/,
    "admin page should render mobile follow-up recommendation list"
  );

  assert.match(
    adminLayout,
    /\/admin#approval-history-sort-accuracy/,
    "admin nav should include history sort accuracy anchor"
  );
  assert.match(
    adminLayout,
    /\/admin#approval-delay-risk-prediction/,
    "admin nav should include delay risk prediction anchor"
  );
  assert.match(
    adminLayout,
    /\/admin#approval-mobile-follow-up-recommendation/,
    "admin nav should include mobile follow-up recommendation anchor"
  );

  assert.match(
    globalCss,
    /\.queue-history-sort-accuracy-panel/,
    "history sort accuracy panel style should exist"
  );
  assert.match(
    globalCss,
    /\.queue-history-sort-accuracy-list/,
    "history sort accuracy list style should exist"
  );
  assert.match(
    globalCss,
    /\.queue-delay-risk-prediction-panel/,
    "delay risk prediction panel style should exist"
  );
  assert.match(
    globalCss,
    /\.queue-delay-risk-prediction-list/,
    "delay risk prediction list style should exist"
  );
  assert.match(
    globalCss,
    /\.queue-mobile-follow-up-recommendation-panel/,
    "mobile follow-up recommendation panel style should exist"
  );
  assert.match(
    globalCss,
    /\.queue-mobile-follow-up-recommendation-list/,
    "mobile follow-up recommendation list style should exist"
  );
  assert.match(
    globalCss,
    /#approvals \.queue-history-sort-accuracy-list/,
    "responsive rule for history sort accuracy list should exist"
  );
  assert.match(
    globalCss,
    /#approvals \.queue-delay-risk-prediction-list/,
    "responsive rule for delay risk prediction list should exist"
  );
  assert.match(
    globalCss,
    /#approvals \.queue-mobile-follow-up-recommendation-list/,
    "responsive rule for mobile follow-up recommendation list should exist"
  );
}

run();
console.log(
  "e2e-wi0148-admin-approval-queue-ux-phase7-history-sort-accuracy-delay-risk-mobile-follow-up-recommendation.test passed"
);
