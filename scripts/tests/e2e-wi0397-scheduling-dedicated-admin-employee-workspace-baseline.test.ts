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
  const adminPage = readUtf8("src", "app", "admin", "scheduling", "page.tsx");
  const employeePage = readUtf8("src", "app", "employee", "schedule", "page.tsx");
  const adminNavSource = readUtf8("src", "app", "admin", "admin-shell-navigation.ts");
  const employeeLayout = readUtf8("src", "app", "employee", "layout.tsx");
  const messages = readUtf8("src", "lib", "i18n", "messages.ts");
  const adminWorkspace = readUtf8("src", "components", "scheduling", "AdminSchedulingWorkspace.tsx");
  const adminWorkspaceView = readUtf8("src", "components", "scheduling", "AdminSchedulingWorkspaceView.tsx");
  const employeeScheduleBoard = readUtf8("src", "components", "scheduling", "EmployeeScheduleBoard.tsx");
  const schedulingCopy = readUtf8("src", "components", "scheduling", "copy.ts");
  const schedulingHelpers = readUtf8("src", "components", "scheduling", "helpers.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0397-scheduling-dedicated-admin-employee-workspace-baseline.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    adminPage,
    /import AdminSchedulingWorkspace from "@\/components\/scheduling\/AdminSchedulingWorkspace";/
  );
  assert.match(employeePage, /import EmployeeScheduleBoard from "@\/components\/scheduling\/EmployeeScheduleBoard";/);

  assert.match(adminNavSource, /\/admin\/scheduling/);
  assert.match(adminNavSource, /admin\.nav\.scheduling/);
  assert.match(employeeLayout, /href: "\/employee\/schedule(?:\?source=employee-mobile-menu)?"/);
  assert.match(employeeLayout, /t\("employee\.nav\.scheduleBoard"\)/);

  assert.match(messages, /"admin\.nav\.scheduling": "근무 스케줄"/);
  assert.match(messages, /"admin\.nav\.scheduling": "Work Scheduling"/);
  assert.match(messages, /"employee\.nav\.scheduleBoard": "내 근무 스케줄"/);
  assert.match(messages, /"employee\.nav\.scheduleBoard": "My Work Schedule"/);

  assert.match(adminWorkspace, /AdminSchedulingWorkspaceView/);
  assert.match(adminWorkspace, /\/api\/scheduling\/schedules/);
  assert.match(adminWorkspace, /"PATCH"/);
  assert.match(adminWorkspace, /"DELETE"/);
  assert.match(adminWorkspace, /useI18n/);
  assert.match(adminWorkspaceView, /copy\.createTitle/);

  assert.match(employeeScheduleBoard, /\/api\/scheduling\/schedules/);
  assert.match(employeeScheduleBoard, /summaryTotalShifts/);
  assert.match(employeeScheduleBoard, /useI18n/);

  assert.match(schedulingCopy, /adminSchedulingCopyByLocale/);
  assert.match(schedulingCopy, /employeeScheduleCopyByLocale/);
  assert.match(schedulingHelpers, /toIsoDateRangeStart/);
  assert.match(schedulingHelpers, /extractErrorMessage/);

  assert.ok(
    countLines(adminWorkspace) <= 300,
    `AdminSchedulingWorkspace.tsx must stay <= 300 lines (current: ${countLines(adminWorkspace)})`
  );
  assert.ok(
    countLines(adminWorkspaceView) <= 300,
    `AdminSchedulingWorkspaceView.tsx must stay <= 300 lines (current: ${countLines(adminWorkspaceView)})`
  );
  assert.ok(
    countLines(employeeScheduleBoard) <= 300,
    `EmployeeScheduleBoard.tsx must stay <= 300 lines (current: ${countLines(employeeScheduleBoard)})`
  );

  assert.match(workItem, /WI-0397/i);
  assert.match(workItem, /scheduling|스케줄/i);
  assert.match(roadmap, /WI-0397/i);
}

run()
  .then(() => {
    console.log("e2e-wi0397-scheduling-dedicated-admin-employee-workspace-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
