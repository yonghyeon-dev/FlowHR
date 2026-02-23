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
  const workItem = readUtf8("work-items", "WI-0235-admin-kpi-dashboard-baseline.md");
  const messages = readUtf8("src", "lib", "i18n", "messages.ts");
  const adminLayout = readUtf8("src", "app", "admin", "layout.tsx");
  const adminKpiPage = readUtf8("src", "app", "admin", "kpi", "page.tsx");
  const dashboard = readUtf8("src", "components", "admin-kpi", "AdminKpiDashboard.tsx");
  const sections = readUtf8("src", "components", "admin-kpi", "AdminKpiSections.tsx");
  const copy = readUtf8("src", "components", "admin-kpi", "copy.ts");

  assert.match(roadmap, /WI-0235/);
  assert.match(workItem, /Admin KPI Dashboard Baseline/);
  assert.match(messages, /"admin\.nav\.kpi": "KPI 대시보드"/);
  assert.match(messages, /"admin\.nav\.kpi": "KPI Dashboard"/);
  assert.match(adminLayout, /href="\/admin\/kpi"/);
  assert.match(adminKpiPage, /AdminKpiDashboard/);
  assert.match(dashboard, /computePreviousPeriodRange/);
  assert.match(dashboard, /\/api\/approval\/executions/);
  assert.match(dashboard, /\/api\/attendance\/aggregates/);
  assert.match(dashboard, /\/api\/leave\/requests/);
  assert.match(dashboard, /\/api\/payroll\/runs/);
  assert.match(copy, /관리자 KPI 대시보드/);
  assert.match(copy, /결재 대기 건수/);
  assert.match(copy, /KPI Dashboard/);

  assert.ok(
    countLines(dashboard) <= 300,
    `AdminKpiDashboard.tsx should stay under 300 lines (current: ${countLines(dashboard)})`
  );
  assert.ok(
    countLines(sections) <= 300,
    `AdminKpiSections.tsx should stay under 300 lines (current: ${countLines(sections)})`
  );

  const {
    buildAdminKpiSummary,
    computeKpiDelta,
    computePreviousPeriodRange,
    computeStalledHours
  } = await import("../../src/features/admin-kpi/summary.ts");

  const summary = buildAdminKpiSummary({
    approvalPendingCount: 7,
    approvalStalledCount: 2,
    attendanceApprovedCount: 18,
    attendanceTotalCount: 20,
    leaveApprovedDays: 3.5,
    payrollConfirmedCount: 9,
    payrollTotalCount: 10
  });

  assert.equal(summary.approvalPendingCount, 7);
  assert.equal(summary.approvalStalledCount, 2);
  assert.equal(summary.attendanceApprovalRate, 90);
  assert.equal(summary.leaveApprovedDays, 3.5);
  assert.equal(summary.payrollConfirmedRate, 90);
  assert.equal(computeKpiDelta(100, 96), 4);

  const previous = computePreviousPeriodRange(
    "2026-02-10T00:00:00.000Z",
    "2026-02-20T00:00:00.000Z"
  );
  assert.equal(previous.to, "2026-02-09T23:59:59.999Z");

  const stalledHours = computeStalledHours(
    "2026-02-20T00:00:00.000Z",
    new Date("2026-02-21T00:00:00.000Z")
  );
  assert.equal(stalledHours, 24);
}

run()
  .then(() => {
    console.log("e2e-wi0235-admin-kpi-dashboard-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
