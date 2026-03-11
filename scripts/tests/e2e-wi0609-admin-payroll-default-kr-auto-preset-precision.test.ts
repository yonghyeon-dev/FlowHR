import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

function run() {
  const pageStateSource = readUtf8("src", "app", "admin", "page-state.ts");
  const previewBuilderStateSource = readUtf8(
    "src",
    "app",
    "admin",
    "payroll-close",
    "preview-builder",
    "page-state.ts"
  );
  const adminPayrollHelperSource = readUtf8("src", "app", "admin", "page-payroll-helpers.ts");
  const adminPayrollPanelSource = readUtf8("src", "components", "admin-dashboard", "AdminPayrollPanel.tsx");
  const payrollTestCasesSource = readUtf8("specs", "payroll", "test-cases.md");
  const roadmapSource = readUtf8("ROADMAP.md");
  const workItemSource = readUtf8(
    "work-items",
    "WI-0609-admin-payroll-kr-withholding-precision-default-auto-preset.md"
  );

  assert.match(
    `${pageStateSource}\n${previewBuilderStateSource}`,
    /const \[payrollIncomeTaxLookupPresetAuto, setPayrollIncomeTaxLookupPresetAuto\] = useState\(true\);/,
    "admin payroll state should default lookup preset auto mode to true"
  );

  assert.match(
    adminPayrollHelperSource,
    /incomeTaxLookupPresetAuto:\s*input\.payrollIncomeTaxLookupPresetAuto,/,
    "statutory payload should continue forwarding lookup auto flag"
  );
  assert.match(
    adminPayrollHelperSource,
    /incomeTaxLookupPresetId:\s*input\.payrollIncomeTaxLookupPresetAuto\s*\?\s*undefined\s*:\s*input\.payrollIncomeTaxLookupPresetId\.trim\(\)\s*\|\|\s*undefined,/,
    "manual preset id should stay disabled when auto mode is enabled"
  );

  assert.match(
    adminPayrollPanelSource,
    /presetAutoEnabled=\{payrollIncomeTaxLookupPresetAuto\}/,
    "admin payroll panel should keep auto-mode control binding"
  );

  assert.match(
    payrollTestCasesSource,
    /Admin payroll statutory preview defaults `incomeTaxLookupPresetAuto=true` for KR simple-tax-table precision and preserves deterministic manual override replay\./,
    "payroll test cases should include WI-0609 default-auto precision coverage"
  );

  assert.match(roadmapSource, /WI-0609/i);
  assert.match(workItemSource, /incomeTaxLookupPresetAuto=true/);
}

run();
console.log("e2e-wi0609-admin-payroll-default-kr-auto-preset-precision.test passed");
