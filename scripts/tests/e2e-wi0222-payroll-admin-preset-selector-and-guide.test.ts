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
    "WI-0222-payroll-kr-tax-table-preset-admin-preview-ui.md"
  );

  assert.match(
    adminPageSource,
    /PayrollKrPresetGuidePanel/,
    "admin payroll preview should render the preset guide panel"
  );
  assert.match(
    adminPageSource,
    /const \[payrollIncomeTaxLookupPresetId, setPayrollIncomeTaxLookupPresetId\] = useState\(""\);/,
    "admin payroll preview should keep preset state"
  );
  assert.match(
    adminPageSource,
    /incomeTaxLookupPresetId: payrollIncomeTaxLookupPresetAuto\s*\?\s*undefined\s*:\s*payrollIncomeTaxLookupPresetId\.trim\(\) \|\| undefined,/,
    "admin payroll preview should send selected preset ID in payload"
  );
  assert.match(
    adminPageSource,
    /selectedPresetId=\{payrollIncomeTaxLookupPresetId\}/,
    "admin payroll preview should bind selected preset state"
  );
  assert.match(
    adminPageSource,
    /onPresetChange=\{setPayrollIncomeTaxLookupPresetId\}/,
    "admin payroll preview should wire preset change handler"
  );

  assert.match(
    presetGuidePanelSource,
    /listPayrollKrIncomeTaxLookupPresets/,
    "preset guide panel should use managed preset list"
  );
  assert.match(
    presetGuidePanelSource,
    /useI18n/,
    "preset guide panel should adapt guide copy to browser locale context"
  );
  assert.match(
    presetGuidePanelSource,
    /incomeTaxBrackets, incomeTaxLookupTable, incomeTaxLookupPresetId, and incomeTaxLookupPresetAuto are mutually exclusive\./,
    "preset guide panel should explain mutual-exclusion guard"
  );
  assert.ok(
    countLines(presetGuidePanelSource) <= 300,
    `PayrollKrPresetGuidePanel should stay under 300 lines (current: ${countLines(presetGuidePanelSource)})`
  );

  assert.match(
    payrollTestCasesSource,
    /Admin payroll preview exposes lookup-preset selector\/guide and forwards selected `incomeTaxLookupPresetId` deterministically\./,
    "payroll test cases should include WI-0222 admin preset selector coverage"
  );
  assert.match(
    workItemSource,
    /브라우저 로케일\(`ko`\/`en`\)에 맞춘 가이드 문구 노출/,
    "WI-0222 work-item should describe locale-aware guide copy scope"
  );
  assert.match(
    roadmapSource,
    /WI-0222 급여 관리자 프리뷰 KR 세액표 프리셋 선택\/가이드 UX baseline/,
    "roadmap should document WI-0222 delivery"
  );
}

run();
console.log("e2e-wi0222-payroll-admin-preset-selector-and-guide.test passed");
