import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.split(/\r?\n/).length;
}

async function run() {
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const interactionActions = readUtf8("src", "app", "employee", "page-interaction-actions.ts");
  const interactionOrchestrator = readUtf8(
    "src",
    "app",
    "employee",
    "page-interaction-orchestrator.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0507-employee-page-interaction-orchestrator-hook-extraction-line-budget-margin.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(
    countLines(employeePage) <= 500,
    `employee/page.tsx should stay <= 500 lines (current: ${countLines(employeePage)})`
  );
  assert.ok(
    countLines(interactionOrchestrator) <= 220,
    `page-interaction-orchestrator.ts should stay <= 220 lines (current: ${countLines(interactionOrchestrator)})`
  );

  assert.match(
    employeePage,
    /from "@\/app\/employee\/page-interaction-orchestrator";/
  );
  assert.match(employeePage, /useEmployeeInteractionOrchestratorInput\(\{/);
  assert.match(employeePage, /}\s*=\s*buildEmployeeInteractionHandlers\(\{/);
  assert.doesNotMatch(employeePage, /refreshEmployeeSnapshot:\s*async\s*\(\{\s*fromIso,\s*toIso\s*\}\)\s*=>/);

  assert.match(
    employeePage,
    /onRefreshEmployeeSnapshot=\{\(\)\s*=>\s*void mutationActions\.refreshEmployeeSnapshot\(\)\}/
  );
  assert.match(
    employeePage,
    /onCreateAttendance=\{\(\)\s*=>\s*void mutationActions\.createAttendance\(\)\}/
  );
  assert.match(
    employeePage,
    /onCancelLeave=\{\(\)\s*=>\s*void mutationActions\.cancelLeave\(\)\}/
  );
  assert.match(employeePage, /onPrefillLeaveFromCalendarDate=\{prefillLeaveFormFromCalendarDate\}/);

  assert.match(
    interactionActions,
    /export interface BuildEmployeeInteractionHandlersInput/
  );
  assert.match(
    interactionOrchestrator,
    /export function useEmployeeInteractionOrchestratorInput\(/
  );
  assert.match(
    interactionOrchestrator,
    /refreshEmployeeSnapshot:\s*async\s*\(\{\s*fromIso,\s*toIso\s*\}\)\s*=>/
  );
  assert.match(interactionOrchestrator, /\.\.\.input\.attendanceInteractionSetters/);
  assert.match(interactionOrchestrator, /\.\.\.input\.requestInteractionSetters/);

  assert.match(workItem, /WI-0507/i);
  assert.match(workItem, /employee|interaction|orchestrator|hook|line budget/i);
  assert.match(roadmap, /WI-0507/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0507-employee-page-interaction-orchestrator-hook-extraction-line-budget-margin.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
