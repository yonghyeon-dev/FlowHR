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
  const adminPayrollPanel = readUtf8(
    "src",
    "components",
    "admin-dashboard",
    "AdminPayrollPanel.tsx"
  );
  const previewPanel = readUtf8(
    "src",
    "components",
    "payroll",
    "PayrollKrIncomeSplitPresetPayloadPreviewPanel.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0231-payroll-kr-preset-payload-copy-share-ux.md"
  );

  assert.match(payrollApiSpec, /copy\/share UX/i);
  assert.match(payrollContract, /WI-0231|copy\/share UX/i);
  assert.match(payrollTestCases, /Preset Payload Copy\/Share UX Gate/i);
  assert.match(payrollRfc, /WI-0231/);
  assert.match(roadmap, /WI-0231/);
  assert.match(adminPayrollPanel, /PayrollKrIncomeSplitPresetPayloadPreviewPanel/);
  assert.match(previewPanel, /navigator\.clipboard\.writeText/);
  assert.match(previewPanel, /navigator\.share/);
  assert.match(previewPanel, /Copy request payload/);
  assert.match(previewPanel, /Share preview/);
  assert.match(previewPanel, /\/admin\/payroll-close\/preview-builder\?\$\{search\.toString\(\)\}/);
  assert.match(workItem, /copy\/share UX/i);

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
    console.log("e2e-wi0231-payroll-kr-preset-payload-copy-share-ux.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
