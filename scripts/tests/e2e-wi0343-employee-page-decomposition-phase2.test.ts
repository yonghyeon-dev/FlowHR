import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const dashboardDerivedState = readUtf8(
    "src",
    "app",
    "employee",
    "page-dashboard-derived-state.ts"
  );
  const derivedHelpers = readUtf8("src", "app", "employee", "page-derived-helpers.ts");
  const workItem = readUtf8("work-items", "WI-0343-employee-page-decomposition-phase2.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(employeePage, /from "@\/app\/employee\/page-dashboard-derived-state"/);
  assert.match(employeePage, /useEmployeeDashboardDerivedState\(\{/);
  assert.match(employeePage, /leaveBalanceCopy,/);
  assert.match(employeePage, /leaveUnitCopy,/);

  assert.match(dashboardDerivedState, /from "@\/app\/employee\/page-derived-helpers"/);
  assert.match(dashboardDerivedState, /summarizeEmployeeApiLogs\(logs\)/);
  assert.match(dashboardDerivedState, /buildLeaveBalanceCards\(leaveBalance, leaveBalanceCopy, formatDays\)/);
  assert.match(dashboardDerivedState, /buildLeaveUsageProjectionLabel\(leaveBalance, leaveBalanceCopy, formatDays\)/);

  assert.match(derivedHelpers, /export function summarizeEmployeeApiLogs/);
  assert.match(derivedHelpers, /export function buildLeaveBalanceCards/);
  assert.match(derivedHelpers, /export function buildLeaveUsageProjectionLabel/);

  assert.match(workItem, /WI-0343/i);
  assert.match(workItem, /decomposition/i);
  assert.match(roadmap, /WI-0343/i);
}

run()
  .then(() => {
    console.log("e2e-wi0343-employee-page-decomposition-phase2.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
