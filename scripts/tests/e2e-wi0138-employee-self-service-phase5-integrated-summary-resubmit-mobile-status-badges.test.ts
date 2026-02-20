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

  assert.match(employeePage, /integratedSummaryCards/, "employee page should compute integrated summary cards");
  assert.match(employeePage, /resubmitCandidates/, "employee page should compute resubmit candidates");
  assert.match(employeePage, /selectedResubmitCandidateKey/, "employee page should track selected resubmit candidate");
  assert.match(employeePage, /lastAppliedResubmitCandidateKey/, "employee page should track last applied resubmit key");
  assert.match(employeePage, /applyResubmitCandidateToDraft/, "employee page should apply resubmit candidate draft");
  assert.match(employeePage, /resubmitFlowChecks/, "employee page should compute resubmit flow checks");
  assert.match(employeePage, /mobileStatusBadges/, "employee page should compute mobile status badges");
  assert.match(employeePage, /id="self-service-overview"/, "employee page should expose integrated summary section");
  assert.match(employeePage, /id="request-resubmit"/, "employee page should expose request resubmit section");
  assert.match(employeePage, /id="mobile-status-badges"/, "employee page should expose mobile status badge section");
  assert.match(
    employeePage,
    /aria-label="employee integrated summary cards"/,
    "employee page should render integrated summary card list"
  );
  assert.match(employeePage, /aria-label="resubmit candidate list"/, "employee page should render resubmit list");
  assert.match(employeePage, /aria-label="mobile status badges"/, "employee page should render mobile status badges");

  assert.match(
    employeeLayout,
    /\/employee#self-service-overview/,
    "employee nav should include integrated summary anchor"
  );
  assert.match(
    employeeLayout,
    /\/employee#request-resubmit/,
    "employee nav should include request resubmit anchor"
  );
  assert.match(
    employeeLayout,
    /\/employee#mobile-status-badges/,
    "employee nav should include mobile status badge anchor"
  );

  assert.match(globalCss, /\.panel-self-service-overview/, "self-service overview panel style should exist");
  assert.match(globalCss, /\.integrated-summary-grid/, "integrated summary grid style should exist");
  assert.match(globalCss, /\.panel-request-resubmit/, "request resubmit panel style should exist");
  assert.match(globalCss, /\.resubmit-candidate-list/, "resubmit candidate list style should exist");
  assert.match(globalCss, /\.resubmit-applied-chip/, "resubmit applied chip style should exist");
  assert.match(globalCss, /\.panel-mobile-status-badges/, "mobile status badge panel style should exist");
  assert.match(globalCss, /\.mobile-status-badge-list/, "mobile status badge list style should exist");
  assert.match(globalCss, /#request-resubmit \.resubmit-candidate-list li/, "resubmit mobile responsive rule should exist");
  assert.match(
    globalCss,
    /#mobile-status-badges \.mobile-status-badge-list/,
    "mobile status badge responsive rule should exist"
  );
}

run();
console.log("e2e-wi0138-employee-self-service-phase5-integrated-summary-resubmit-mobile-status-badges.test passed");
