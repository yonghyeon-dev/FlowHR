import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payrollApiSpec = readUtf8("specs", "payroll", "api.yaml");
  const payrollContract = readUtf8("specs", "payroll", "contract.yaml");
  const payrollTestCases = readUtf8("specs", "payroll", "test-cases.md");
  const payrollRfc = readUtf8("specs", "payroll", "rfc.md");
  const roadmap = readUtf8("ROADMAP.md");
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const previewPanel = readUtf8(
    "src",
    "components",
    "payroll",
    "PayrollKrIncomeSplitPresetPayloadPreviewPanel.tsx"
  );
  const workItem = readUtf8("work-items", "WI-0230-payroll-kr-preset-sample-payload-preview.md");

  assert.match(payrollApiSpec, /preset-mode sample payload preview/i);
  assert.match(payrollContract, /sample payload preview/i);
  assert.match(payrollTestCases, /Preset Payload Preview Gate/i);
  assert.match(payrollRfc, /WI-0230/);
  assert.match(roadmap, /WI-0230/);
  assert.match(adminPage, /PayrollKrIncomeSplitPresetPayloadPreviewPanel/);
  assert.match(previewPanel, /request payload \(sample\)/i);
  assert.match(previewPanel, /server template application \(sample\)/i);
  assert.match(previewPanel, /\(omitted in preset mode\)/i);
  assert.match(workItem, /sample payload preview/i);

  const { getPayrollKrIncomeSplitItemPreset } = await import(
    "../../src/features/payroll/kr-income-split-item-presets.ts"
  );
  const preset = getPayrollKrIncomeSplitItemPreset("kr_income_split_template_v2026_01");
  assert.ok(preset, "known split-item preset should be resolvable");
  assert.equal(preset?.taxableTemplate.code, "TX_SALARY");
  assert.equal(preset?.nonTaxableTemplate.code, "NT_MEAL");
}

run()
  .then(() => {
    console.log("e2e-wi0230-payroll-kr-preset-sample-payload-preview.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
