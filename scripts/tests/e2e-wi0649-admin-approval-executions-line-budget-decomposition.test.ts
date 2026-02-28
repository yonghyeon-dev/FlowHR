import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(input: string) {
  return input.split(/\r?\n/).length;
}

async function run() {
  const page = readUtf8("src", "app", "admin", "approval-executions", "page.tsx");
  const sections = readUtf8("src", "app", "admin", "approval-executions", "page-sections.tsx");
  const sectionsWorkConditions = readUtf8(
    "src",
    "app",
    "admin",
    "approval-executions",
    "page-sections-work-conditions.tsx"
  );
  const sectionsSummaryEscalation = readUtf8(
    "src",
    "app",
    "admin",
    "approval-executions",
    "page-sections-summary-escalation.tsx"
  );
  const sectionsQueue = readUtf8(
    "src",
    "app",
    "admin",
    "approval-executions",
    "page-sections-queue.tsx"
  );
  const sectionsSurface = `${sectionsWorkConditions}\n${sectionsSummaryEscalation}\n${sectionsQueue}`;
  const helpers = readUtf8("src", "app", "admin", "approval-executions", "page-helpers.ts");
  const workItem = readUtf8("work-items", "WI-0649-admin-approval-executions-line-budget-decomposition.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(
    countLines(page) <= 500,
    `approval-executions/page.tsx line budget exceeded: ${countLines(page)} > 500`
  );

  assert.match(page, /ApprovalExecutionWorkConditionsPanel/);
  assert.match(page, /ApprovalExecutionSummaryPanel/);
  assert.match(page, /ApprovalExecutionEscalationResultPanel/);
  assert.match(page, /ApprovalExecutionListPanel/);
  assert.match(page, /ApprovalExecutionHistoryPanel/);
  assert.match(page, /showDevTools \? \([\s\S]*ApprovalExecutionLogsPanel[\s\S]*\) : \([\s\S]*ApprovalExecutionRelatedWorkspacesPanel/);
  assert.match(sections, /page-sections-work-conditions/);
  assert.match(sections, /page-sections-summary-escalation/);
  assert.match(sections, /page-sections-queue/);

  assert.match(helpers, /return \"\/admin\/payroll-year-end\";/);
  assert.match(helpers, /return \"\/admin\/leave-accrual\";/);
  assert.match(helpers, /return \"\/admin\/attendance-live\";/);
  assert.doesNotMatch(helpers, /\/admin#payroll/);
  assert.doesNotMatch(helpers, /\/admin#approvals/);

  assert.match(sectionsSurface, /Work conditions/);
  assert.match(sectionsSurface, /Advanced options/);
  assert.match(sectionsSurface, /Request logs/);
  assert.match(sectionsSurface, /Related workspaces/);

  assert.match(workItem, /WI-0649/i);
  assert.match(workItem, /line budget|decomposition|approval-executions/i);
  assert.match(roadmap, /WI-0649/i);
}

run()
  .then(() => {
    console.log("e2e-wi0649-admin-approval-executions-line-budget-decomposition.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
