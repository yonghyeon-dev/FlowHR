import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const filterPanel = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-view-filter-panel.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0793-employee-payslips-admin-shortcut-devtools-gate.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    filterPanel,
    /\{showDevTools \? \(\s*<Link className="btn btn-secondary" href="\/admin">/,
    "employee payslip filter panel should gate admin shortcut by showDevTools"
  );
  assert.match(
    filterPanel,
    /\(개발\) 관리자|\(dev\) Admin/,
    "employee payslip admin shortcut should be labeled as dev-only"
  );
  assert.doesNotMatch(
    filterPanel,
    /<Link className="btn btn-secondary" href="\/admin">\s*\{pageCopy\.nav\.admin\}\s*<\/Link>/,
    "employee payslip filter panel should not expose plain admin shortcut in product mode"
  );

  assert.match(workItem, /WI-0793/i);
  assert.match(workItem, /employee|payslip|admin|shortcut|devtools|product mode/i);
  assert.match(roadmap, /WI-0793/i);
}

run();
console.log("e2e-wi0793-employee-payslips-admin-shortcut-devtools-gate.test passed");
