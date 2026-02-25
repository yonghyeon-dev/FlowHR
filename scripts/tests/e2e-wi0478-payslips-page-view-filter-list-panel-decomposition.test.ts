import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function lineCount(...parts: string[]) {
  return readUtf8(...parts).split(/\r?\n/).length;
}

async function run() {
  const pageViewSource = readUtf8("src", "app", "employee", "payslips", "page-view.tsx");
  const filterPanelSource = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-view-filter-panel.tsx"
  );
  const runListPanelSource = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-view-run-list-panel.tsx"
  );
  const typesSource = readUtf8("src", "app", "employee", "payslips", "page-view-types.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0478-payslips-page-view-filter-list-panel-decomposition.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(pageViewSource, /EmployeePayslipFilterPanel/);
  assert.match(pageViewSource, /EmployeePayslipRunListPanel/);
  assert.match(pageViewSource, /EmployeePayslipsPageViewProps/);

  assert.doesNotMatch(pageViewSource, /pageCopy\.devTools\.summary/);
  assert.doesNotMatch(pageViewSource, /pageCopy\.payslipList\.title/);

  assert.match(filterPanelSource, /pageCopy\.filters\.title/);
  assert.match(filterPanelSource, /pageCopy\.devTools\.summary/);
  assert.match(runListPanelSource, /pageCopy\.payslipList\.title/);
  assert.match(typesSource, /export type EmployeePayslipsPageViewProps/);

  assert.ok(
    lineCount("src", "app", "employee", "payslips", "page-view.tsx") <= 300,
    "page-view.tsx must be <= 300 lines"
  );
  assert.ok(
    lineCount("src", "app", "employee", "payslips", "page-view-filter-panel.tsx") <= 300,
    "page-view-filter-panel.tsx must be <= 300 lines"
  );
  assert.ok(
    lineCount("src", "app", "employee", "payslips", "page-view-run-list-panel.tsx") <= 300,
    "page-view-run-list-panel.tsx must be <= 300 lines"
  );

  assert.match(workItem, /WI-0478/i);
  assert.match(workItem, /payslips|page view|filter|list|panel|decomposition/i);
  assert.match(roadmap, /WI-0478/i);
}

run()
  .then(() => {
    console.log("e2e-wi0478-payslips-page-view-filter-list-panel-decomposition.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
