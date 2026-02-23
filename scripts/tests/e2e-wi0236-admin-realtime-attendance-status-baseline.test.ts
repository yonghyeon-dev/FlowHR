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
  const workItem = readUtf8("work-items", "WI-0236-admin-realtime-attendance-status-baseline.md");
  const messages = readUtf8("src", "lib", "i18n", "messages.ts");
  const layout = readUtf8("src", "app", "admin", "layout.tsx");
  const page = readUtf8("src", "app", "admin", "attendance-live", "page.tsx");
  const dashboard = readUtf8(
    "src",
    "components",
    "admin-attendance-live",
    "AdminAttendanceLiveDashboard.tsx"
  );
  const sections = readUtf8(
    "src",
    "components",
    "admin-attendance-live",
    "AdminAttendanceLiveSections.tsx"
  );
  const copy = readUtf8("src", "components", "admin-attendance-live", "copy.ts");
  const summarySource = readUtf8("src", "features", "admin-attendance-live", "summary.ts");

  assert.match(roadmap, /WI-0236/);
  assert.match(workItem, /Admin Realtime Attendance Status Baseline/);
  assert.match(messages, /"admin\.nav\.attendanceLive": "실시간 근태"/);
  assert.match(messages, /"admin\.nav\.attendanceLive": "Realtime Attendance"/);
  assert.match(layout, /href="\/admin\/attendance-live"/);
  assert.match(page, /AdminAttendanceLiveDashboard/);
  assert.match(dashboard, /\/api\/scheduling\/schedules/);
  assert.match(dashboard, /\/api\/attendance\/records/);
  assert.match(dashboard, /\/api\/people\/departments/);
  assert.match(copy, /실시간 근태 현황/);
  assert.match(summarySource, /buildAttendanceLiveSnapshot/);

  assert.ok(
    countLines(dashboard) <= 300,
    `AdminAttendanceLiveDashboard.tsx should stay under 300 lines (current: ${countLines(dashboard)})`
  );
  assert.ok(
    countLines(sections) <= 300,
    `AdminAttendanceLiveSections.tsx should stay under 300 lines (current: ${countLines(sections)})`
  );

  const {
    buildAttendanceLiveSnapshot,
    summarizeAttendanceLiveRows
  } = await import("../../src/features/admin-attendance-live/summary.ts");

  const now = new Date("2026-02-23T10:00:00.000Z");
  const snapshot = buildAttendanceLiveSnapshot({
    employees: [
      { id: "EMP-1", name: "Alpha", departmentId: "DEP-1" },
      { id: "EMP-2", name: "Beta", departmentId: "DEP-1" }
    ],
    departments: [{ id: "DEP-1", name: "Ops" }],
    schedules: [
      {
        id: "SCH-1",
        employeeId: "EMP-1",
        startAt: "2026-02-23T09:00:00.000Z",
        endAt: "2026-02-23T18:00:00.000Z"
      },
      {
        id: "SCH-2",
        employeeId: "EMP-2",
        startAt: "2026-02-23T09:00:00.000Z",
        endAt: "2026-02-23T18:00:00.000Z"
      }
    ],
    records: [
      {
        id: "AT-1",
        employeeId: "EMP-1",
        checkInAt: "2026-02-23T09:20:00.000Z",
        checkOutAt: null,
        state: "APPROVED"
      }
    ],
    now,
    lateThresholdMinutes: 15,
    criticalLateThresholdMinutes: 60
  });

  assert.equal(snapshot.rows.length, 2);
  assert.equal(snapshot.summary.totalScheduled, 2);
  assert.equal(snapshot.summary.lateCount, 1);
  assert.equal(snapshot.summary.absentCount, 1);
  assert.equal(snapshot.summary.watchCount, 1);
  assert.equal(snapshot.summary.criticalCount, 1);

  const lateRow = snapshot.rows.find((row) => row.employeeId === "EMP-1");
  const absentRow = snapshot.rows.find((row) => row.employeeId === "EMP-2");
  assert.equal(lateRow?.status, "late");
  assert.equal(lateRow?.alertLevel, "watch");
  assert.equal(absentRow?.status, "absent");
  assert.equal(absentRow?.alertLevel, "critical");

  const recomputed = summarizeAttendanceLiveRows(snapshot.rows);
  assert.equal(recomputed.totalScheduled, snapshot.summary.totalScheduled);
  assert.equal(recomputed.criticalCount, snapshot.summary.criticalCount);
}

run()
  .then(() => {
    console.log("e2e-wi0236-admin-realtime-attendance-status-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
