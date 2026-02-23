import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.split(/\r?\n/).length;
}

function run() {
  const adminPageSource = readUtf8("src", "app", "admin", "page.tsx");
  const presetGuidePanelSource = readUtf8(
    "src",
    "components",
    "payroll",
    "PayrollKrPresetGuidePanel.tsx"
  );
  const payrollTestCasesSource = readUtf8("specs", "payroll", "test-cases.md");
  const roadmapSource = readUtf8("ROADMAP.md");
  const workItemSource = readUtf8(
    "work-items",
    "WI-0283-payroll-admin-preset-auto-resolution-ux-visibility.md"
  );

  assert.match(
    adminPageSource,
    /const \[payrollIncomeTaxLookupPresetAuto, setPayrollIncomeTaxLookupPresetAuto\] = useState\(false\);/,
    "admin payroll preview should keep preset auto mode state"
  );
  assert.match(
    adminPageSource,
    /const \[payrollIncomeTaxLookupAsOf, setPayrollIncomeTaxLookupAsOf\] = useState\(""\);/,
    "admin payroll preview should keep preset asOf state"
  );
  assert.match(
    adminPageSource,
    /incomeTaxLookupPresetId: payrollIncomeTaxLookupPresetAuto\s*\?\s*undefined\s*:\s*payrollIncomeTaxLookupPresetId\.trim\(\) \|\| undefined,/,
    "admin payroll payload should skip manual preset id when auto mode is enabled"
  );
  assert.match(
    adminPageSource,
    /incomeTaxLookupPresetAuto: payrollIncomeTaxLookupPresetAuto,/,
    "admin payroll payload should forward preset auto flag"
  );
  assert.match(
    adminPageSource,
    /incomeTaxLookupAsOf:\s*payrollIncomeTaxLookupPresetAuto && payrollIncomeTaxLookupAsOf\.trim\(\)\.length > 0/,
    "admin payroll payload should forward optional asOf in auto mode"
  );
  assert.match(
    adminPageSource,
    /presetAutoEnabled=\{payrollIncomeTaxLookupPresetAuto\}/,
    "admin payroll preview should bind preset auto mode to guide panel"
  );
  assert.match(
    adminPageSource,
    /presetAsOfInput=\{payrollIncomeTaxLookupAsOf\}/,
    "admin payroll preview should bind preset asOf input to guide panel"
  );

  assert.match(
    presetGuidePanelSource,
    /presetAutoEnabled: boolean;/,
    "preset guide panel should expose preset auto mode prop"
  );
  assert.match(
    presetGuidePanelSource,
    /presetAsOfInput: string;/,
    "preset guide panel should expose preset asOf prop"
  );
  assert.match(
    presetGuidePanelSource,
    /type=\"datetime-local\"/,
    "preset guide panel should expose datetime-local input for asOf"
  );
  assert.match(
    presetGuidePanelSource,
    /incomeTaxBrackets, incomeTaxLookupTable, incomeTaxLookupPresetId, and incomeTaxLookupPresetAuto are mutually exclusive\./,
    "preset guide panel should explain auto-mode mutual exclusion guard"
  );
  assert.ok(
    countLines(presetGuidePanelSource) <= 340,
    `PayrollKrPresetGuidePanel should stay under 340 lines (current: ${countLines(presetGuidePanelSource)})`
  );

  assert.match(
    payrollTestCasesSource,
    /Admin payroll preview supports lookup preset auto-selection toggle/i,
    "payroll test cases should include WI-0283 admin auto preset UX coverage"
  );
  assert.match(workItemSource, /incomeTaxLookupPresetAuto/);
  assert.match(workItemSource, /incomeTaxLookupAsOf/);
  assert.match(
    roadmapSource,
    /WI-0283 payroll admin preset auto-resolution UX visibility baseline/i,
    "roadmap should track WI-0283 delivery"
  );
}

run();
console.log("e2e-wi0283-payroll-admin-preset-auto-resolution-ux-visibility.test passed");
