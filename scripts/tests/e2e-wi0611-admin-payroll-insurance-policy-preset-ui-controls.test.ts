import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

async function run() {
  const consoleSource = readUtf8(
    "src",
    "components",
    "payroll-insurance",
    "PayrollInsuranceSettlementConsole.tsx"
  );
  const inputPanelSource = readUtf8(
    "src",
    "components",
    "payroll-insurance",
    "PayrollInsuranceSettlementInputPanel.tsx"
  );
  const sectionsSource = readUtf8(
    "src",
    "components",
    "payroll-insurance",
    "PayrollInsuranceSettlementSections.tsx"
  );
  const copySource = readUtf8("src", "components", "payroll-insurance", "copy.ts");
  const typesSource = readUtf8("src", "components", "payroll-insurance", "types.ts");
  const testCases = readUtf8("specs", "payroll", "test-cases.md");
  const workItem = readUtf8(
    "work-items",
    "WI-0611-admin-payroll-insurance-policy-preset-ui-controls.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    consoleSource,
    /const \[insurancePolicyMode, setInsurancePolicyMode\] = useState<\s*"manual" \| "preset_manual" \| "preset_auto"\s*>\("manual"\);/
  );
  assert.match(consoleSource, /insurancePolicyPresetAuto: insurancePolicyMode === "preset_auto"/);
  assert.match(consoleSource, /insurancePolicyPresetId:/);
  assert.match(consoleSource, /insurancePolicyAsOf:/);
  assert.match(consoleSource, /toSeoulDateTimeIso\(insurancePolicyAsOf\)/);
  assert.match(consoleSource, /insurancePolicyMode={insurancePolicyMode}/);
  assert.match(consoleSource, /insurancePolicyPresetId={insurancePolicyPresetId}/);
  assert.match(consoleSource, /insurancePolicyAsOf={insurancePolicyAsOf}/);

  assert.match(inputPanelSource, /copy\.policyModeLabel/);
  assert.match(inputPanelSource, /copy\.policyModeManualOption/);
  assert.match(inputPanelSource, /copy\.policyModePresetOption/);
  assert.match(inputPanelSource, /copy\.policyModeAutoOption/);
  assert.match(inputPanelSource, /copy\.policyPresetIdLabel/);
  assert.match(inputPanelSource, /copy\.policyAsOfLabel/);
  assert.match(inputPanelSource, /insurancePolicyMode !== "preset_manual"/);
  assert.match(inputPanelSource, /insurancePolicyMode !== "preset_auto"/);
  assert.match(inputPanelSource, /type="datetime-local"/);

  assert.match(sectionsSource, /copy\.policyPresetSummaryLabel/);
  assert.match(sectionsSource, /copy\.policyRatesSummaryLabel/);
  assert.match(sectionsSource, /copy\.policyCapsSummaryLabel/);
  assert.match(sectionsSource, /result\.summary\.policyPresetAuto\.resolvedBy/);

  assert.match(copySource, /policyModeLabel:/);
  assert.match(copySource, /policyPresetSummaryLabel:/);
  assert.match(copySource, /policyRatesSummaryLabel:/);
  assert.match(copySource, /policyCapsSummaryLabel:/);

  assert.match(typesSource, /policyPreset:\s*{/);
  assert.match(typesSource, /policyPresetAuto:\s*{/);
  assert.match(typesSource, /policyRates:\s*{/);
  assert.match(typesSource, /policyCapsKrw:\s*{/);
  assert.match(typesSource, /export function toSeoulDateTimeIso/);

  assert.match(testCases, /Admin payroll-insurance console supports insurance policy mode controls/i);
  assert.match(testCases, /Admin Insurance Policy Preset UI Gate/i);
  assert.match(workItem, /WI-0611/i);
  assert.match(workItem, /policy mode/i);
  assert.match(roadmap, /WI-0611/i);
}

run()
  .then(() => {
    console.log("e2e-wi0611-admin-payroll-insurance-policy-preset-ui-controls.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
