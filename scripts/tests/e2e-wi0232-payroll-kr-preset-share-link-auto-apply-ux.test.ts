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
  const parserSource = readUtf8(
    "src",
    "features",
    "payroll",
    "kr-preset-share-context.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0232-payroll-kr-preset-share-link-auto-apply-ux.md"
  );

  assert.match(payrollApiSpec, /share-link auto-apply UX/i);
  assert.match(payrollContract, /WI-0232|share-link auto-apply UX/i);
  assert.match(payrollTestCases, /Preset Share-Link Auto-Apply UX Gate/i);
  assert.match(payrollRfc, /WI-0232/);
  assert.match(roadmap, /WI-0232/);
  assert.match(adminPage, /parsePayrollKrPresetShareContext/);
  assert.match(adminPage, /hasPayrollKrPresetShareContext/);
  assert.match(adminPage, /setPayrollPreviewMode\("statutory_kr_baseline"\)/);
  assert.match(parserSource, /incomeSplitItemPresetId/);
  assert.match(parserSource, /normalizeNonNegativeInteger/);
  assert.match(workItem, /share-link auto-apply UX/i);

  const {
    parsePayrollKrPresetShareContext,
    hasPayrollKrPresetShareContext
  } = await import("../../src/features/payroll/kr-preset-share-context.ts");

  const valid = parsePayrollKrPresetShareContext(
    "?incomeSplitItemPresetId=kr_income_split_template_v2026_01&taxableIncomeKrw=00123000&nonTaxableIncomeKrw=000"
  );
  assert.equal(valid.presetId, "kr_income_split_template_v2026_01");
  assert.equal(valid.taxableIncomeKrw, "123000");
  assert.equal(valid.nonTaxableIncomeKrw, "0");
  assert.equal(hasPayrollKrPresetShareContext(valid), true);

  const invalid = parsePayrollKrPresetShareContext(
    "?incomeSplitItemPresetId=unknown&taxableIncomeKrw=-10&nonTaxableIncomeKrw=abc"
  );
  assert.equal(invalid.presetId, null);
  assert.equal(invalid.taxableIncomeKrw, null);
  assert.equal(invalid.nonTaxableIncomeKrw, null);
  assert.equal(hasPayrollKrPresetShareContext(invalid), false);
}

run()
  .then(() => {
    console.log("e2e-wi0232-payroll-kr-preset-share-link-auto-apply-ux.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
