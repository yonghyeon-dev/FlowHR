import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const panel = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "FilingPreflightBlockerPanel.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0603-admin-payroll-year-end-preflight-direct-shortcut-actions.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(panel, /openPayrollCloseAction:/);
  assert.match(panel, /openPayslipDeliveryAction:/);

  assert.match(panel, /check\.key === "confirmed_runs_present" \|\| check\.key === "no_previewed_runs"/);
  assert.match(panel, /href="\/admin\/payroll-close"/);

  assert.match(panel, /check\.key === "no_undistributed_runs" \|\| check\.key === "no_pending_receipts"/);
  assert.match(panel, /href="\/admin\/payroll-payslip-delivery"/);

  assert.match(workItem, /WI-0603/i);
  assert.match(workItem, /preflight|shortcut|direct|actions|payroll-close|payslip-delivery/i);
  assert.match(roadmap, /WI-0603/i);
}

run()
  .then(() => {
    console.log("e2e-wi0603-admin-payroll-year-end-preflight-direct-shortcut-actions.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
