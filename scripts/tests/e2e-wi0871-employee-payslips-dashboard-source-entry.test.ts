import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const payslipsPage = readUtf8("src", "app", "employee", "payslips", "page.tsx");
  const payslipsView = readUtf8("src", "app", "employee", "payslips", "page-view.tsx");
  const payslipsFilterPanel = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-view-filter-panel.tsx"
  );
  const payslipsViewTypes = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-view-types.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0871-employee-payslips-dashboard-source-entry.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(payslipsPage, /useSearchParams/);
  assert.match(payslipsPage, /searchParams\.get\("source"\)/);
  assert.match(payslipsPage, /sourceContext=\{sourceContext\}/);

  assert.match(payslipsViewTypes, /sourceContext: "employee-dashboard" \| null;/);
  assert.match(payslipsView, /sourceContext,/);
  assert.match(payslipsView, /sourceContext=\{sourceContext\}/);

  assert.match(payslipsFilterPanel, /sourceContextLabel/);
  assert.match(payslipsFilterPanel, /Opened from employee dashboard\./);
  assert.match(payslipsFilterPanel, /직원 대시보드에서 이동했습니다\./);
  assert.match(payslipsFilterPanel, /Back to dashboard/);
  assert.match(payslipsFilterPanel, /대시보드로 돌아가기/);

  assert.match(workItem, /WI-0871/i);
  assert.match(workItem, /employee|payslip|dashboard|source|entry/i);
  assert.match(roadmap, /WI-0871/i);
}

run();
console.log("e2e-wi0871-employee-payslips-dashboard-source-entry.test passed");
