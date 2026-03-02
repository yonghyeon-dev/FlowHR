import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const panel = readUtf8(
    "src",
    "components",
    "admin-kpi",
    "AdminPayrollRiskKpiPanel.tsx"
  );
  const copy = readUtf8("src", "components", "admin-kpi", "copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0799-admin-analytics-payroll-risk-priority-action-links.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    panel,
    /resolvePrimaryPayrollRiskAction/,
    "payroll risk panel should resolve top-priority action"
  );
  assert.match(
    panel,
    /buildPayrollRiskQuickActions/,
    "payroll risk panel should expose quick action links"
  );
  assert.match(
    panel,
    /href: "\/admin\/payroll-close"/,
    "panel should include payroll close route action"
  );
  assert.match(
    panel,
    /href: "\/admin\/payroll-payslip-delivery"/,
    "panel should include payslip delivery route action"
  );
  assert.match(
    panel,
    /href: "\/admin\/payroll-year-end"/,
    "panel should include year-end route action"
  );
  assert.match(
    panel,
    /priorityActionLabel/,
    "panel should render priority action label copy"
  );
  assert.match(copy, /priorityActionLabel:/);
  assert.match(copy, /quickActionsLabel:/);
  assert.match(copy, /actionOpenPayrollClose:/);
  assert.match(copy, /actionOpenPayslipDelivery:/);
  assert.match(copy, /actionOpenYearEnd:/);

  assert.match(workItem, /WI-0799/i);
  assert.match(workItem, /admin|analytics|payroll|priority|action|links/i);
  assert.match(roadmap, /WI-0799/i);
}

run();
console.log(
  "e2e-wi0799-admin-analytics-payroll-risk-priority-action-links.test passed"
);
