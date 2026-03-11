import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const workspaceContent = readUtf8(
    "src",
    "app",
    "employee",
    "requests",
    "workspace-content.tsx"
  );
  const requestsClient = readUtf8(
    "src",
    "app",
    "employee",
    "requests",
    "page-client.tsx"
  );
  const resubmitPanel = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeRequestsResubmitWorkspacePanel.tsx"
  );
  const globalsCss = readUtf8("src", "app", "globals.css");
  const workItem = readUtf8(
    "work-items",
    "WI-1165-employee-requests-visual-hierarchy.md"
  );

  assert.match(workspaceContent, /employee-requests-hub-grid/);
  assert.match(workspaceContent, /employee-requests-hub-card/);
  assert.match(workspaceContent, /employee-requests-hub-primary/);
  assert.match(workspaceContent, /employee-requests-hub-secondary/);
  assert.match(
    workspaceContent,
    /\uC694\uCCAD \uC0C1\uD0DC\uC640 \uD6C4\uC18D \uC870\uCE58|Request monitoring/
  );
  assert.match(
    workspaceContent,
    /\uC65C \uC694\uCCAD \uC6CC\uD06C\uC2A4\uD398\uC774\uC2A4\uB97C \uB354 \uC138\uBD84\uD654\uD558\uB098\uC694\?|Why promote request monitoring into subroutes\?/
  );

  assert.match(requestsClient, /employee-requests-status-strip/);
  assert.match(requestsClient, /employee-requests-detail-grid/);
  assert.match(requestsClient, /employee-requests-monitoring-stack/);

  assert.match(resubmitPanel, /employee-requests-resubmit-summary/);
  assert.match(resubmitPanel, /candidateCountLabel/);
  assert.match(
    resubmitPanel,
    /\uC7AC\uC81C\uCD9C \uD6C4\uBCF4 \d+\uAC74|resubmit candidates/
  );

  assert.match(globalsCss, /\.employee-requests-hub-grid \{/);
  assert.match(globalsCss, /\.employee-requests-resubmit-summary \{/);
  assert.match(globalsCss, /\.employee-requests-detail-grid \{/);

  assert.match(workItem, /WI-1165/);
  assert.match(workItem, /visual hierarchy/i);
}

run();
console.log("e2e-wi1165-employee-requests-visual-hierarchy.test passed");
