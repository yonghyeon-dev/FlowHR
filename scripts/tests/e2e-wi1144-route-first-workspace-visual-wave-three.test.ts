import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payslipFilterPanel = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-view-filter-panel.tsx"
  );
  const payslipPageView = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-view.tsx"
  );
  const payslipDetailPanel = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-view-detail-panel.tsx"
  );
  const payslipDeliveryConsole = readUtf8(
    "src",
    "components",
    "payroll-payslip-delivery",
    "PayrollPayslipDeliveryConsole.tsx"
  );
  const globalsCss = readUtf8("src", "app", "globals.css");
  const workItem = readUtf8(
    "work-items",
    "WI-1144-route-first-workspace-visual-wave-three.md"
  );

  assert.match(
    payslipFilterPanel,
    /className="page-header workspace-page-header employee-workspace-status-header"/
  );
  assert.match(
    payslipFilterPanel,
    /className="small fail workspace-inline-status"/
  );
  assert.match(
    payslipFilterPanel,
    /className="kpi-strip workspace-summary-strip employee-workspace-status-strip"/
  );
  assert.match(
    payslipFilterPanel,
    /className="kpi-card workspace-summary-card employee-workspace-status-card"/
  );
  assert.match(
    payslipFilterPanel,
    /className="panel workspace-section-card workspace-toolbar-card"/
  );

  assert.match(
    payslipPageView,
    /className="saas-content workspace-shell employee-workspace-shell"/
  );
  assert.match(
    payslipPageView,
    /className="panel-grid workspace-panel-grid"/
  );
  assert.match(
    payslipPageView,
    /className="panel workspace-section-card panel-payslip-search-sort"/
  );
  assert.match(
    payslipPageView,
    /className="panel workspace-section-card panel-payslip-status-feedback"/
  );
  assert.match(
    payslipPageView,
    /className="panel workspace-section-card workspace-note-card panel-payslip-compare"/
  );

  assert.match(
    payslipDetailPanel,
    /className="panel workspace-section-card workspace-detail-card panel-payslip-print"/
  );

  assert.match(
    payslipDeliveryConsole,
    /className="saas-content workspace-shell admin-workspace-shell"/
  );
  assert.match(
    payslipDeliveryConsole,
    /className="page-header workspace-page-header"/
  );
  assert.match(
    payslipDeliveryConsole,
    /className="panel-grid workspace-panel-grid"/
  );
  assert.match(
    payslipDeliveryConsole,
    /className="panel workspace-section-card"/
  );
  assert.match(
    payslipDeliveryConsole,
    /className="panel workspace-side-panel"/
  );

  assert.match(globalsCss, /\.workspace-toolbar-card \{/);
  assert.match(globalsCss, /\.workspace-detail-card \{/);

  assert.match(workItem, /WI-1144/);
  assert.match(workItem, /visual/i);
}

run()
  .then(() => {
    console.log("e2e-wi1144-route-first-workspace-visual-wave-three.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
