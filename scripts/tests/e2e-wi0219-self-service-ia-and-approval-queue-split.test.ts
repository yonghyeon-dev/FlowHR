import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.split(/\r?\n/).length;
}

function run() {
  const adminPageSource = readUtf8("src", "app", "admin", "page.tsx");
  const employeePageSource = readUtf8("src", "app", "employee", "page.tsx");
  const approvalQueuePanelSource = readUtf8(
    "src",
    "components",
    "admin-approval",
    "ApprovalQueuePanel.tsx"
  );
  const approvalQueueSearchSortSource = readUtf8(
    "src",
    "components",
    "admin-approval",
    "ApprovalQueueSearchSortPanel.tsx"
  );
  const employeeJourneyShortcutSource = readUtf8(
    "src",
    "components",
    "employee-self-service",
    "EmployeeJourneyShortcutPanel.tsx"
  );

  assert.match(adminPageSource, /ApprovalQueuePanel/, "admin page should render extracted approval queue component");
  assert.doesNotMatch(
    adminPageSource,
    /<article className="panel" id="approvals">/,
    "admin page should not inline-render the approvals article after component split"
  );
  assert.ok(
    countLines(adminPageSource) <= 2500,
    `admin page should stay under 2500 lines after WI-0219 split (current: ${countLines(adminPageSource)})`
  );

  assert.ok(
    countLines(approvalQueuePanelSource) <= 300,
    `ApprovalQueuePanel should stay under 300 lines (current: ${countLines(approvalQueuePanelSource)})`
  );
  assert.ok(
    countLines(approvalQueueSearchSortSource) <= 300,
    `ApprovalQueueSearchSortPanel should stay under 300 lines (current: ${countLines(approvalQueueSearchSortSource)})`
  );

  assert.match(
    employeePageSource,
    /EmployeeJourneyShortcutPanel/,
    "employee page should include extracted IA shortcut panel"
  );
  assert.match(
    employeeJourneyShortcutSource,
    /핵심 여정 바로가기/,
    "employee journey shortcut panel should expose a simplified IA entry"
  );
  assert.ok(
    countLines(employeeJourneyShortcutSource) <= 300,
    `EmployeeJourneyShortcutPanel should stay under 300 lines (current: ${countLines(employeeJourneyShortcutSource)})`
  );
}

run();
console.log("e2e-wi0219-self-service-ia-and-approval-queue-split.test passed");
