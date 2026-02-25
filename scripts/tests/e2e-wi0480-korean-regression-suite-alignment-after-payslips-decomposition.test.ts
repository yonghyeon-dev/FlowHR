import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const legacy0386 = readUtf8(
    "scripts",
    "tests",
    "e2e-wi0386-employee-payroll-contracts-korean-copy-audit.test.ts"
  );
  const legacy0416 = readUtf8(
    "scripts",
    "tests",
    "e2e-wi0416-korean-runtime-english-residual-sweep-withholding-payslip-contracts.test.ts"
  );
  const payslipView = readUtf8("src", "app", "employee", "payslips", "page-view.tsx");
  const payslipFilterPanel = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-view-filter-panel.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0480-korean-regression-suite-alignment-after-payslips-decomposition.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(legacy0386, /copy-runtime\.ts/);
  assert.match(legacy0386, /page-view-filter-panel\.tsx/);
  assert.doesNotMatch(legacy0386, /page-locale-helpers\.ts/);

  assert.match(legacy0416, /page-view-filter-panel\.tsx/);
  assert.match(legacy0416, /<EmployeePayslipFilterPanel/);
  assert.doesNotMatch(legacy0416, /assert\.match\(payslipView, \/<strong>/);

  assert.match(payslipView, /<EmployeePayslipFilterPanel/);
  assert.match(payslipFilterPanel, /<strong>\{pageCopy\.productionNotice\.runtimeLabel\}<\/strong>/);

  assert.match(workItem, /WI-0480/i);
  assert.match(workItem, /korean|regression|payslips|decomposition|alignment/i);
  assert.match(roadmap, /WI-0480/i);
}

run()
  .then(() => {
    console.log("e2e-wi0480-korean-regression-suite-alignment-after-payslips-decomposition.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
