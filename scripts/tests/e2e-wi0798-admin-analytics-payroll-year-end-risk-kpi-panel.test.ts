import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const dashboard = readUtf8(
    "src",
    "components",
    "admin-kpi",
    "AdminKpiDashboard.tsx"
  );
  const panel = readUtf8(
    "src",
    "components",
    "admin-kpi",
    "AdminPayrollRiskKpiPanel.tsx"
  );
  const copy = readUtf8("src", "components", "admin-kpi", "copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0798-admin-analytics-payroll-year-end-risk-kpi-panel.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    dashboard,
    /loadPayrollRiskKpi/,
    "admin KPI dashboard should load payroll risk KPI snapshot"
  );
  assert.match(
    dashboard,
    /payroll risk runs/,
    "payroll risk KPI loader should use dedicated request label"
  );
  assert.match(
    dashboard,
    /\/api\/payroll\/runs/,
    "payroll risk KPI should query payroll runs API"
  );
  assert.match(
    dashboard,
    /<AdminPayrollRiskKpiPanel copy=\{copy\} snapshot=\{payrollRiskKpi\} \/>/,
    "analytics mode should render payroll risk KPI panel"
  );

  assert.match(
    panel,
    /buildPayrollRiskKpiSnapshot/,
    "payroll risk KPI panel should expose snapshot builder"
  );
  assert.match(
    panel,
    /confirmedUndistributedCount/,
    "payroll risk KPI snapshot should include confirmed-undistributed count"
  );
  assert.match(
    panel,
    /distributedUnacknowledgedCount/,
    "payroll risk KPI snapshot should include distributed-unacknowledged count"
  );
  assert.match(
    panel,
    /yearEndReadinessPercent/,
    "payroll risk KPI snapshot should include year-end readiness percent"
  );

  assert.match(copy, /payrollRiskPanel:/);

  assert.match(workItem, /WI-0798/i);
  assert.match(workItem, /admin|analytics|payroll|year-end|risk|kpi/i);
  assert.match(roadmap, /WI-0798/i);
}

run();
console.log(
  "e2e-wi0798-admin-analytics-payroll-year-end-risk-kpi-panel.test passed"
);
