import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const derivedHelpers = readUtf8("src", "app", "employee", "page-derived-helpers.ts");
  const workItem = readUtf8("work-items", "WI-0384-employee-derived-helper-phase3-extraction.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(derivedHelpers, /export function buildLeaveCalendarCells/);
  assert.match(derivedHelpers, /export function buildLeaveCalendarRows/);
  assert.match(derivedHelpers, /export function buildAttendanceStatusSummary/);
  assert.match(derivedHelpers, /export function buildLeaveStatusSummary/);
  assert.match(derivedHelpers, /export function buildResubmitCandidates/);
  assert.match(derivedHelpers, /export function buildIntegratedSummaryCards/);

  assert.match(employeePage, /buildLeaveCalendarCells\(leaveRequests, periodStart\)/);
  assert.match(employeePage, /buildLeaveCalendarRows\(\{/);
  assert.match(employeePage, /buildAttendanceStatusSummary\(attendance\)/);
  assert.match(employeePage, /buildLeaveStatusSummary\(leaveRequests\)/);
  assert.match(employeePage, /buildResubmitCandidates\(\{/);
  assert.match(employeePage, /buildIntegratedSummaryCards\(\{/);

  assert.doesNotMatch(employeePage, /const requestByDate = new Map<string, LeaveRequestDto\[\]>\(\);/);

  assert.match(workItem, /WI-0384/i);
  assert.match(workItem, /derived helper phase3 extraction/i);
  assert.match(roadmap, /WI-0384/i);
}

run()
  .then(() => {
    console.log("e2e-wi0384-employee-derived-helper-phase3-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
