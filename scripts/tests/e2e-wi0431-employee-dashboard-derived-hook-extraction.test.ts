import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const dashboardDerivedHook = readUtf8(
    "src",
    "app",
    "employee",
    "page-dashboard-derived-state.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0431-employee-dashboard-derived-hook-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(dashboardDerivedHook, /export function useEmployeeDashboardDerivedState\(/);
  assert.match(dashboardDerivedHook, /buildLeaveBalanceCards/);
  assert.match(dashboardDerivedHook, /buildLeaveCalendarRows/);
  assert.match(dashboardDerivedHook, /buildRequestFlowStats/);
  assert.match(dashboardDerivedHook, /buildResubmitCandidates/);
  assert.match(dashboardDerivedHook, /buildIntegratedSummaryCards/);
  assert.match(dashboardDerivedHook, /formatEmployeeDeltaMinutes/);

  assert.match(employeePage, /useEmployeeDashboardDerivedState/);
  assert.match(employeePage, /leaveCalendarRows/);
  assert.match(employeePage, /resubmitCandidates/);
  assert.match(employeePage, /integratedSummaryCards/);
  assert.doesNotMatch(employeePage, /buildLeaveBalanceCards\(/);
  assert.doesNotMatch(employeePage, /buildResubmitCandidates\(/);

  const lineCount = employeePage.split(/\r?\n/).length;
  assert.ok(lineCount <= 600, `expected employee page <= 600 lines, got ${lineCount}`);

  assert.match(workItem, /WI-0431/i);
  assert.match(workItem, /employee|dashboard|derived|hook|extraction|decomposition/i);
  assert.match(roadmap, /WI-0431/i);
}

run()
  .then(() => {
    console.log("e2e-wi0431-employee-dashboard-derived-hook-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
