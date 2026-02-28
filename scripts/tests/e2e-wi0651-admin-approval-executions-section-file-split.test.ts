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
  const sectionsBarrel = readUtf8("src", "app", "admin", "approval-executions", "page-sections.tsx");
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
  const workItem = readUtf8("work-items", "WI-0651-admin-approval-executions-section-file-split.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(countLines(sectionsWorkConditions) <= 300, "work-conditions section file exceeds 300 lines");
  assert.ok(countLines(sectionsSummaryEscalation) <= 300, "summary-escalation section file exceeds 300 lines");
  assert.ok(countLines(sectionsQueue) <= 300, "queue section file exceeds 300 lines");

  assert.match(sectionsBarrel, /page-sections-work-conditions/);
  assert.match(sectionsBarrel, /page-sections-summary-escalation/);
  assert.match(sectionsBarrel, /page-sections-queue/);

  assert.match(sectionsWorkConditions, /ApprovalExecutionWorkConditionsPanel/);
  assert.match(sectionsSummaryEscalation, /ApprovalExecutionSummaryPanel/);
  assert.match(sectionsSummaryEscalation, /ApprovalExecutionEscalationResultPanel/);
  assert.match(sectionsQueue, /ApprovalExecutionListPanel/);
  assert.match(sectionsQueue, /ApprovalExecutionLogsPanel/);

  assert.match(workItem, /WI-0651/i);
  assert.match(workItem, /section file split|line budget|approval-executions/i);
  assert.match(roadmap, /WI-0651/i);
}

run()
  .then(() => {
    console.log("e2e-wi0651-admin-approval-executions-section-file-split.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
