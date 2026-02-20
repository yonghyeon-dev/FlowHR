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
    /queueEvidenceComparisonCards/,
    "admin page should compute approval evidence comparison cards"
  );
  assert.match(adminPage, /queueSlaRuleAlerts/, "admin page should compute SLA rule alerts");
  assert.match(
    adminPage,
    /queueMobileApprovalChecklistItems/,
    "admin page should compute mobile approval checklist items"
  );
  assert.match(
    adminPage,
    /queueSlaWatchHoursInput/,
    "admin page should expose watch threshold input state"
  );
  assert.match(
    adminPage,
    /queueSlaCriticalHoursInput/,
    "admin page should expose critical threshold input state"
  );
  assert.match(
    adminPage,
    /summarizeQueueAlertByRule/,
    "admin page should summarize queue badges by dynamic SLA rules"
  );
  assert.match(
    adminPage,
    /summarizeSlaTimelineByRule/,
    "admin page should summarize SLA timeline by dynamic thresholds"
  );

  assert.match(
    adminPage,
    /id="approval-evidence-comparison"/,
    "admin page should expose evidence comparison section"
  );
  assert.match(
    adminPage,
    /id="approval-sla-alert-rules"/,
    "admin page should expose SLA alert rule section"
  );
  assert.match(
    adminPage,
    /id="approval-mobile-checklist"/,
    "admin page should expose mobile checklist section"
  );
  assert.match(
    adminPage,
    /aria-label="approval evidence comparison cards"/,
    "admin page should render evidence comparison list"
  );
  assert.match(
    adminPage,
    /aria-label="approval sla alert rule controls"/,
    "admin page should render SLA alert rule controls"
  );
  assert.match(
    adminPage,
    /aria-label="approval sla rule alerts"/,
    "admin page should render SLA rule alert list"
  );
  assert.match(
    adminPage,
    /aria-label="approval mobile checklist"/,
    "admin page should render mobile approval checklist"
  );

  assert.match(
    adminLayout,
    /\/admin#approval-evidence-comparison/,
    "admin nav should include evidence comparison anchor"
  );
  assert.match(
    adminLayout,
    /\/admin#approval-sla-alert-rules/,
    "admin nav should include SLA alert rule anchor"
  );
  assert.match(
    adminLayout,
    /\/admin#approval-mobile-checklist/,
    "admin nav should include mobile checklist anchor"
  );

  assert.match(
    globalCss,
    /\.queue-evidence-comparison-panel/,
    "evidence comparison panel style should exist"
  );
  assert.match(
    globalCss,
    /\.queue-evidence-comparison-list/,
    "evidence comparison list style should exist"
  );
  assert.match(globalCss, /\.queue-sla-rule-controls/, "SLA rule controls style should exist");
  assert.match(globalCss, /\.queue-sla-rule-alert-list/, "SLA rule alert list style should exist");
  assert.match(globalCss, /\.queue-mobile-checklist-panel/, "mobile checklist panel style should exist");
  assert.match(globalCss, /\.queue-mobile-checklist-list/, "mobile checklist list style should exist");
  assert.match(
    globalCss,
    /#approvals \.queue-evidence-comparison-list/,
    "responsive rule for evidence comparison list should exist"
  );
  assert.match(
    globalCss,
    /#approvals \.queue-sla-rule-controls/,
    "responsive rule for SLA rule controls should exist"
  );
  assert.match(
    globalCss,
    /#approvals \.queue-mobile-checklist-list li/,
    "responsive rule for mobile checklist cards should exist"
  );
}

run();
console.log(
  "e2e-wi0141-admin-approval-queue-ux-phase5-evidence-compare-sla-rules-mobile-checklist.test passed"
);
