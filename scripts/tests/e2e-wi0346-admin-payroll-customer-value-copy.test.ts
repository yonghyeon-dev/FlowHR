import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminPayrollPanel = readUtf8("src", "components", "admin-dashboard", "AdminPayrollPanel.tsx");
  const workItem = readUtf8("work-items", "WI-0346-admin-payroll-customer-value-copy.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(adminPayrollPanel, /const valueNarrative = isKoLocale/);
  assert.match(adminPayrollPanel, /summaryTitle: "급여 고객가치"/);
  assert.match(adminPayrollPanel, /summaryTitle: "Payroll Customer Value"/);
  assert.match(adminPayrollPanel, /label: "정확성"/);
  assert.match(adminPayrollPanel, /label: "Accuracy"/);
  assert.match(adminPayrollPanel, /<section className="kpi-strip" aria-label=\{valueNarrative\.summaryTitle\}>/);

  assert.match(workItem, /WI-0346/i);
  assert.match(workItem, /customer[- ]value/i);
  assert.match(roadmap, /WI-0346/i);
}

run()
  .then(() => {
    console.log("e2e-wi0346-admin-payroll-customer-value-copy.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
