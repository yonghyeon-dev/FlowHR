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
  const mainPanel = readUtf8("src", "components", "employee-dashboard", "EmployeeAttendanceLeavePanels.tsx");
  const formsPanel = readUtf8("src", "components", "employee-dashboard", "EmployeeAttendanceLeaveFormsPanel.tsx");
  const calendarPanel = readUtf8("src", "components", "employee-dashboard", "EmployeeLeaveCalendarPanel.tsx");
  const workItem = readUtf8(
    "work-items",
    "WI-0446-employee-attendance-leave-panels-decomposition-forms-calendar-split.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(mainPanel, /EmployeeAttendanceLeaveFormsPanel/);
  assert.match(mainPanel, /EmployeeLeaveCalendarPanel/);
  assert.ok(
    countLines(mainPanel) <= 220,
    `EmployeeAttendanceLeavePanels.tsx must stay <= 220 lines (current: ${countLines(mainPanel)})`
  );

  assert.match(formsPanel, /id="attendance"/);
  assert.match(formsPanel, /id="leave"/);
  assert.ok(
    countLines(formsPanel) <= 300,
    `EmployeeAttendanceLeaveFormsPanel.tsx must stay <= 300 lines (current: ${countLines(formsPanel)})`
  );

  assert.match(calendarPanel, /id="leave-calendar"/);
  assert.ok(
    countLines(calendarPanel) <= 200,
    `EmployeeLeaveCalendarPanel.tsx must stay <= 200 lines (current: ${countLines(calendarPanel)})`
  );

  assert.match(workItem, /WI-0446/i);
  assert.match(workItem, /employee|attendance|leave|decomposition|split/i);
  assert.match(roadmap, /WI-0446/i);
}

run()
  .then(() => {
    console.log("e2e-wi0446-employee-attendance-leave-panel-decomposition.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
