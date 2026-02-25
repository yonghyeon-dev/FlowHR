import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const attendanceLeavePanels = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeAttendanceLeavePanels.tsx"
  );
  const leaveCalendarPanel = readUtf8(
    "src",
    "components",
    "employee-dashboard",
    "EmployeeLeaveCalendarPanel.tsx"
  );
  const localeHelpers = readUtf8("src", "app", "employee", "page-locale-helpers.ts");
  const globalsCss = readUtf8("src", "app", "globals.css");
  const workItem = readUtf8(
    "work-items",
    "WI-0351-leave-calendar-cell-click-prefill-leave-form.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(employeePage, /prefillLeaveFormFromCalendarDate/);
  assert.match(employeePage, /onPrefillLeaveFromCalendarDate=\{prefillLeaveFormFromCalendarDate\}/);
  assert.match(attendanceLeavePanels, /onPrefillLeaveFromCalendarDate: \(dateKey: string\) => void/);
  assert.match(leaveCalendarPanel, /clickToPrefill/);
  assert.match(leaveCalendarPanel, /is-clickable/);
  assert.match(localeHelpers, /clickToPrefill/);
  assert.match(globalsCss, /\.leave-calendar-day\.is-clickable/);

  assert.match(workItem, /WI-0351/i);
  assert.match(workItem, /prefill/i);
  assert.match(roadmap, /WI-0351/i);
}

run()
  .then(() => {
    console.log("e2e-wi0351-leave-calendar-cell-click-prefill-leave-form.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
