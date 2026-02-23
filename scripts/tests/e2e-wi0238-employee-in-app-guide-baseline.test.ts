import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.trimEnd().split(/\r?\n/).length;
}

async function run() {
  const roadmap = readUtf8("ROADMAP.md");
  const workItem = readUtf8("work-items", "WI-0238-employee-in-app-guide-baseline.md");
  const messages = readUtf8("src", "lib", "i18n", "messages.ts");
  const layout = readUtf8("src", "app", "employee", "layout.tsx");
  const page = readUtf8("src", "app", "employee", "guide", "page.tsx");
  const dashboard = readUtf8("src", "components", "employee-guide", "EmployeeGuideDashboard.tsx");
  const sections = readUtf8("src", "components", "employee-guide", "EmployeeGuideSections.tsx");
  const copy = readUtf8("src", "components", "employee-guide", "copy.ts");
  const hookSource = readUtf8("src", "components", "employee-guide", "useEmployeeGuideData.ts");
  const checklistSource = readUtf8("src", "features", "employee-guide", "checklist.ts");

  assert.match(roadmap, /WI-0238/);
  assert.match(workItem, /Employee In-App Guide Baseline/);
  assert.match(messages, /"employee\.nav\.guide": "인앱 가이드"/);
  assert.match(messages, /"employee\.nav\.guide": "In-App Guide"/);
  assert.match(layout, /href="\/employee\/guide"/);
  assert.match(page, /EmployeeGuideDashboard/);
  assert.match(hookSource, /\/api\/attendance\/records/);
  assert.match(hookSource, /\/api\/leave\/requests/);
  assert.match(hookSource, /\/api\/payroll\/runs/);
  assert.match(copy, /직원 인앱 가이드/);
  assert.match(checklistSource, /buildEmployeeGuideChecklist/);
  assert.match(dashboard, /EmployeeGuideChecklistPanel/);

  assert.ok(
    countLines(dashboard) <= 300,
    `EmployeeGuideDashboard.tsx should stay under 300 lines (current: ${countLines(dashboard)})`
  );
  assert.ok(
    countLines(sections) <= 300,
    `EmployeeGuideSections.tsx should stay under 300 lines (current: ${countLines(sections)})`
  );

  const { buildEmployeeGuideChecklist, employeeGuideProgressPercent } = await import(
    "../../src/features/employee-guide/checklist.ts"
  );
  const { buildQuery, parseArray, pastDaysRangeIso } = await import(
    "../../src/components/employee-guide/helpers.ts"
  );

  const checklist = buildEmployeeGuideChecklist({
    profileReady: true,
    attendanceRecordCount: 1,
    leaveRequestCount: 0,
    confirmedPayslipCount: 0
  });
  assert.equal(checklist.length, 4);
  assert.equal(checklist.find((item) => item.key === "profile")?.done, true);
  assert.equal(checklist.find((item) => item.key === "leave")?.done, false);
  assert.equal(employeeGuideProgressPercent(checklist), 50);

  const completeChecklist = buildEmployeeGuideChecklist({
    profileReady: true,
    attendanceRecordCount: 2,
    leaveRequestCount: 1,
    confirmedPayslipCount: 1
  });
  assert.equal(employeeGuideProgressPercent(completeChecklist), 100);

  const query = buildQuery({ employeeId: "EMP-1001", state: "CONFIRMED", empty: " " });
  assert.equal(query, "?employeeId=EMP-1001&state=CONFIRMED");

  const parsed = parseArray<{ id: string }>({ rows: [{ id: "A" }, { id: "B" }] }, "rows");
  assert.equal(parsed.length, 2);

  const now = new Date("2026-02-23T00:00:00.000Z");
  const range = pastDaysRangeIso(14, now);
  assert.equal(range.to, "2026-02-23T00:00:00.000Z");
  assert.equal(range.from, "2026-02-09T00:00:00.000Z");
}

run()
  .then(() => {
    console.log("e2e-wi0238-employee-in-app-guide-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
