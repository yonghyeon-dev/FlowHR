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
  const workItem = readUtf8("work-items", "WI-0256-mobile-analytics-dashboard-baseline.md");
  const navigator = readUtf8("apps", "mobile", "src", "navigation", "RootNavigator.js");
  const analyticsScreen = readUtf8("apps", "mobile", "src", "screens", "MobileAnalyticsDashboardScreen.js");
  const analyticsLib = readUtf8("apps", "mobile", "src", "lib", "mobileAnalytics.js");
  const adminScreen = readUtf8("apps", "mobile", "src", "screens", "AdminHomeScreen.js");
  const employeeScreen = readUtf8("apps", "mobile", "src", "screens", "EmployeeHomeScreen.js");
  const readme = readUtf8("apps", "mobile", "README.md");

  assert.match(roadmap, /WI-0256/);
  assert.match(workItem, /Mobile Analytics Dashboard Baseline/);
  assert.match(navigator, /MobileAnalyticsDashboardScreen/);
  assert.match(navigator, /name="MobileAnalyticsDashboard"/);
  assert.match(navigator, /onOpenMobileAnalytics/);
  assert.match(analyticsScreen, /Analytics Dashboard/);
  assert.match(analyticsScreen, /KPI snapshot/);
  assert.match(analyticsScreen, /Domain breakdown/);
  assert.match(analyticsScreen, /Daily trend/);
  assert.match(analyticsScreen, /Export snapshot/);
  assert.match(analyticsLib, /buildMobileAnalyticsSnapshot/);
  assert.match(analyticsLib, /buildMobileAnalyticsTrendSeries/);
  assert.match(analyticsLib, /serializeMobileAnalyticsSnapshot/);
  assert.match(analyticsLib, /MOBILE_ANALYTICS_EXPORT_TYPE/);
  assert.match(adminScreen, /WI-0258~/);
  assert.match(employeeScreen, /WI-0258~/);
  assert.match(adminScreen, /분석 대시보드/);
  assert.match(employeeScreen, /분석 대시보드/);
  assert.match(readme, /Mobile analytics dashboard shell/);

  assert.ok(
    countLines(navigator) <= 320,
    `RootNavigator.js should stay under 320 lines (current: ${countLines(navigator)})`
  );
  assert.ok(
    countLines(analyticsScreen) <= 390,
    `MobileAnalyticsDashboardScreen.js should stay under 390 lines (current: ${countLines(analyticsScreen)})`
  );
  assert.ok(
    countLines(adminScreen) <= 300,
    `AdminHomeScreen.js should stay under 300 lines (current: ${countLines(adminScreen)})`
  );
  assert.ok(
    countLines(employeeScreen) <= 300,
    `EmployeeHomeScreen.js should stay under 300 lines (current: ${countLines(employeeScreen)})`
  );

  // @ts-expect-error Mobile sub-app baseline currently ships JS modules without d.ts.
  const analyticsModule = await import("../../apps/mobile/src/lib/mobileAnalytics.js");
  const {
    MOBILE_ANALYTICS_EXPORT_TYPE,
    MOBILE_ANALYTICS_EXPORT_VERSION,
    buildMobileAnalyticsSnapshot,
    buildMobileAnalyticsTrendSeries,
    formatMobileAnalyticsRate,
    resolveMobileAnalyticsPeriodDays,
    serializeMobileAnalyticsSnapshot
  } = analyticsModule;

  const now = new Date("2026-02-23T12:00:00.000Z");
  const source = {
    approvals: [
      { id: "a1", status: "pending", priority: "high", stalledHours: 26, submittedAt: "2026-02-23T10:00:00.000Z" },
      { id: "a2", status: "approved", priority: "normal", stalledHours: 0, submittedAt: "2026-02-22T09:00:00.000Z" }
    ],
    requests: [
      { id: "r1", requestType: "attendanceCorrection", status: "submitted", createdAt: "2026-02-23T08:00:00.000Z" },
      { id: "r2", requestType: "leaveRequest", status: "approved", createdAt: "2026-02-21T07:00:00.000Z" }
    ],
    notifications: [
      { id: "n1", category: "approvalRequest", read: false, archivedAt: null, createdAt: "2026-02-23T06:00:00.000Z" },
      { id: "n2", category: "approvalResult", read: true, archivedAt: null, createdAt: "2026-02-22T05:00:00.000Z" },
      { id: "n3", category: "payslipReady", read: false, archivedAt: "2026-02-23T07:00:00.000Z", createdAt: "2026-02-23T04:00:00.000Z" }
    ]
  };

  const snapshot = buildMobileAnalyticsSnapshot(source, { periodDays: 7, now });
  assert.equal(snapshot.window.periodDays, 7);
  assert.equal(snapshot.kpi.approvalsPending, 1);
  assert.equal(snapshot.kpi.requestsPendingAction, 1);
  assert.equal(snapshot.kpi.notificationsUnread, 1);
  assert.equal(snapshot.kpi.actionRequired, 3);

  const trend = buildMobileAnalyticsTrendSeries(source, { periodDays: 7, now });
  assert.equal(trend.length, 7);
  assert.ok(trend.some((row: any) => row.approvals > 0));
  assert.ok(trend.some((row: any) => row.requests > 0));
  assert.ok(trend.some((row: any) => row.notifications > 0));

  const payload = serializeMobileAnalyticsSnapshot(snapshot, now);
  assert.match(payload, new RegExp(MOBILE_ANALYTICS_EXPORT_TYPE));
  const parsed = JSON.parse(payload);
  assert.equal(parsed.type, MOBILE_ANALYTICS_EXPORT_TYPE);
  assert.equal(parsed.version, MOBILE_ANALYTICS_EXPORT_VERSION);

  assert.equal(resolveMobileAnalyticsPeriodDays("14d", 7), 14);
  assert.equal(resolveMobileAnalyticsPeriodDays("unknown", 7), 7);
  assert.equal(formatMobileAnalyticsRate(55.25), "55.3%");
}

run()
  .then(() => {
    console.log("e2e-wi0256-mobile-analytics-dashboard-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
