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
  const parserSource = readUtf8("src", "features", "payroll", "kr-preset-share-context.ts");
  const feedbackPanel = readUtf8(
    "src",
    "components",
    "payroll",
    "PayrollKrPresetShareLinkFeedbackPanel.tsx"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0233-payroll-kr-preset-share-link-validation-feedback-ux.md"
  );

  assert.match(payrollApiSpec, /share-link validation feedback UX/i);
  assert.match(payrollContract, /WI-0233|validation feedback UX/i);
  assert.match(payrollTestCases, /Preset Share-Link Validation Feedback UX Gate/i);
  assert.match(payrollRfc, /WI-0233/);
  assert.match(roadmap, /WI-0233/);
  assert.match(adminPage, /PayrollKrPresetShareLinkFeedbackPanel/);
  assert.match(adminPage, /setPayrollPresetShareLinkFeedback/);
  assert.match(adminPage, /resolvePayrollKrPresetShareContext/);
  assert.match(parserSource, /resolvePayrollKrPresetShareContext/);
  assert.match(parserSource, /invalid/);
  assert.match(feedbackPanel, /Ignored invalid query values/i);
  assert.match(feedbackPanel, /Applied values/i);
  assert.match(workItem, /validation feedback UX/i);

  const {
    resolvePayrollKrPresetShareContext,
    parsePayrollKrPresetShareContext,
    hasPayrollKrPresetShareContext,
    hasPayrollKrPresetShareInvalidValues
  } = await import("../../src/features/payroll/kr-preset-share-context.ts");

  const mixedResolution = resolvePayrollKrPresetShareContext(
    "?incomeSplitItemPresetId=unknown&taxableIncomeKrw=12000&nonTaxableIncomeKrw=abc"
  );
  assert.equal(mixedResolution.hasAnyQuery, true);
  assert.equal(mixedResolution.context.presetId, null);
  assert.equal(mixedResolution.context.taxableIncomeKrw, "12000");
  assert.equal(mixedResolution.context.nonTaxableIncomeKrw, null);
  assert.equal(mixedResolution.invalid.presetId, "unknown");
  assert.equal(mixedResolution.invalid.nonTaxableIncomeKrw, "abc");
  assert.equal(hasPayrollKrPresetShareInvalidValues(mixedResolution), true);
  assert.equal(hasPayrollKrPresetShareContext(mixedResolution.context), true);

  const contextOnly = parsePayrollKrPresetShareContext(
    "?incomeSplitItemPresetId=kr_income_split_template_v2026_01&taxableIncomeKrw=00100&nonTaxableIncomeKrw=0"
  );
  assert.equal(contextOnly.presetId, "kr_income_split_template_v2026_01");
  assert.equal(contextOnly.taxableIncomeKrw, "100");
  assert.equal(contextOnly.nonTaxableIncomeKrw, "0");

  const invalidOnly = resolvePayrollKrPresetShareContext(
    "?incomeSplitItemPresetId=unsupported&taxableIncomeKrw=-1&nonTaxableIncomeKrw=x"
  );
  assert.equal(hasPayrollKrPresetShareContext(invalidOnly.context), false);
  assert.equal(hasPayrollKrPresetShareInvalidValues(invalidOnly), true);
}

run()
  .then(() => {
    console.log("e2e-wi0233-payroll-kr-preset-share-link-validation-feedback-ux.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
