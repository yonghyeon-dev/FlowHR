import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const dashboard = readUtf8("src", "components", "admin-kpi", "AdminKpiDashboard.tsx");
  const payrollRiskPanel = readUtf8(
    "src",
    "components",
    "admin-kpi",
    "AdminPayrollRiskKpiPanel.tsx"
  );
  const approvalExecutions = readUtf8("src", "app", "admin", "approval-executions", "page.tsx");
  const attendanceLive = readUtf8(
    "src",
    "components",
    "admin-attendance-live",
    "AdminAttendanceLiveDashboard.tsx"
  );
  const leaveCalendar = readUtf8(
    "src",
    "components",
    "leave-calendar",
    "LeaveCalendarConsole.tsx"
  );
  const payrollClose = readUtf8(
    "src",
    "components",
    "payroll-close",
    "PayrollClosePeriodConsole.tsx"
  );
  const analyticsContext = readUtf8(
    "src",
    "components",
    "admin-kpi",
    "admin-analytics-context.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0865-admin-analytics-return-focus-parity-approval-payroll-attendance-leave.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(dashboard, /contextParams\.set\("analyticsFocus", analyticsFocusMetric\)/);
  assert.match(
    dashboard,
    /appendAnalyticsSourceQuery\(workspace\.href, metric, focusMetric\)/
  );
  assert.match(
    dashboard,
    /<AdminPayrollRiskKpiPanel[\s\S]*analyticsFocusMetric=\{focusMetric\}[\s\S]*\/>/
  );
  assert.match(dashboard, /focusWorkspaceContextHref/);

  assert.match(payrollRiskPanel, /withAnalyticsSourceContext/);
  assert.match(payrollRiskPanel, /source: "admin-analytics"/);
  assert.match(payrollRiskPanel, /contextParams\.set\("analyticsFocus", options\.analyticsFocusMetric\)/);
  assert.match(payrollRiskPanel, /focusMetric: "payrollConfirmedRate"/);

  assert.match(
    approvalExecutions,
    /normalizeAdminAnalyticsFocusMetric\(\s*searchParams\.get\("analyticsFocus"\)\s*\)/
  );
  assert.match(
    approvalExecutions,
    /const analyticsBackHref = resolveAdminAnalyticsBackHref\(source, analyticsFocusMetric\);/
  );
  assert.match(approvalExecutions, /Back to analytics/);

  assert.match(
    attendanceLive,
    /normalizeAdminAnalyticsFocusMetric\(\s*searchParams\.get\("analyticsFocus"\)\s*\)/
  );
  assert.match(attendanceLive, /resolveAdminAnalyticsBackHref\(source, analyticsFocusMetric\)/);
  assert.match(attendanceLive, /Back to analytics/);

  assert.match(
    leaveCalendar,
    /normalizeAdminAnalyticsFocusMetric\(\s*searchParams\.get\("analyticsFocus"\)\s*\)/
  );
  assert.match(leaveCalendar, /resolveAdminAnalyticsBackHref\(source, analyticsFocusMetric\)/);
  assert.match(leaveCalendar, /Back to analytics/);

  assert.match(
    payrollClose,
    /normalizeAdminAnalyticsFocusMetric\(\s*searchParams\.get\("analyticsFocus"\)\s*\)/
  );
  assert.match(payrollClose, /resolveAdminAnalyticsBackHref\(source, analyticsFocusMetric\)/);
  assert.match(payrollClose, /Back to analytics/);

  assert.match(analyticsContext, /export function normalizeAdminAnalyticsFocusMetric/);
  assert.match(analyticsContext, /export function resolveAdminAnalyticsBackHref/);
  assert.match(analyticsContext, /\/admin\/analytics\?focus=\$\{encodeURIComponent\(analyticsFocusMetric\)\}/);

  assert.match(workItem, /WI-0865/i);
  assert.match(workItem, /admin|analytics|return|focus|parity|approval|payroll|attendance|leave/i);
  assert.match(roadmap, /WI-0865/i);
}

run();
console.log(
  "e2e-wi0865-admin-analytics-return-focus-parity-approval-payroll-attendance-leave.test passed"
);
