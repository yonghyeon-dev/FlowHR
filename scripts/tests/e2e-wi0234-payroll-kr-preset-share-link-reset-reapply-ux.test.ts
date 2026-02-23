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
  const feedbackPanel = readUtf8(
    "src",
    "components",
    "payroll",
    "PayrollKrPresetShareLinkFeedbackPanel.tsx"
  );
  const parserSource = readUtf8("src", "features", "payroll", "kr-preset-share-context.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0234-payroll-kr-preset-share-link-reset-reapply-ux.md"
  );

  assert.match(payrollApiSpec, /share-link reset\/reapply UX/i);
  assert.match(payrollContract, /WI-0234|reset\/reapply UX/i);
  assert.match(payrollTestCases, /Preset Share-Link Reset\/Reapply UX Gate/i);
  assert.match(payrollRfc, /WI-0234/);
  assert.match(roadmap, /WI-0234/);
  assert.match(adminPage, /applyPayrollPresetShareContext/);
  assert.match(adminPage, /resetPayrollPresetShareContext/);
  assert.match(adminPage, /reapplyPayrollPresetShareContext/);
  assert.match(adminPage, /setPayrollIncomeSplitItemPresetId\(""\)/);
  assert.match(adminPage, /setPayrollTaxableIncomeKrw\(""\)/);
  assert.match(adminPage, /setPayrollNonTaxableIncomeKrw\("0"\)/);
  assert.match(adminPage, /window\.location\.search/);
  assert.match(adminPage, /onResetAppliedValues=\{resetPayrollPresetShareContext\}/);
  assert.match(adminPage, /onReapplyQueryValues=\{reapplyPayrollPresetShareContext\}/);
  assert.match(feedbackPanel, /Reset share-applied values/i);
  assert.match(feedbackPanel, /Re-apply query values/i);
  assert.match(feedbackPanel, /onResetAppliedValues/);
  assert.match(feedbackPanel, /onReapplyQueryValues/);
  assert.match(parserSource, /resolvePayrollKrPresetShareContext/);
  assert.match(workItem, /reset\/reapply UX/i);

  const {
    resolvePayrollKrPresetShareContext,
    hasPayrollKrPresetShareContext,
    hasPayrollKrPresetShareInvalidValues
  } = await import("../../src/features/payroll/kr-preset-share-context.ts");

  const validResolution = resolvePayrollKrPresetShareContext(
    "?incomeSplitItemPresetId=kr_income_split_template_v2026_01&taxableIncomeKrw=120000&nonTaxableIncomeKrw=0"
  );
  assert.equal(hasPayrollKrPresetShareContext(validResolution.context), true);
  assert.equal(hasPayrollKrPresetShareInvalidValues(validResolution), false);

  const invalidResolution = resolvePayrollKrPresetShareContext(
    "?incomeSplitItemPresetId=unknown&taxableIncomeKrw=-1&nonTaxableIncomeKrw=abc"
  );
  assert.equal(hasPayrollKrPresetShareContext(invalidResolution.context), false);
  assert.equal(hasPayrollKrPresetShareInvalidValues(invalidResolution), true);
}

run()
  .then(() => {
    console.log("e2e-wi0234-payroll-kr-preset-share-link-reset-reapply-ux.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
