import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payrollInsuranceConsole = readUtf8(
    "src",
    "components",
    "payroll-insurance",
    "PayrollInsuranceSettlementConsole.tsx"
  );
  const payrollInsuranceCopy = readUtf8("src", "components", "payroll-insurance", "copy.ts");
  const payrollInsuranceSections = readUtf8(
    "src",
    "components",
    "payroll-insurance",
    "PayrollInsuranceSettlementSections.tsx"
  );
  const payrollInsuranceInputPanel = readUtf8(
    "src",
    "components",
    "payroll-insurance",
    "PayrollInsuranceSettlementInputPanel.tsx"
  );
  const payrollInsuranceTypes = readUtf8("src", "components", "payroll-insurance", "types.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0332-admin-payroll-insurance-locale-dynamic-ui-gap-fix-phase9.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(payrollInsuranceConsole, /from "@\/components\/payroll-insurance\/copy"/);
  assert.match(
    payrollInsuranceConsole,
    /from "@\/components\/payroll-insurance\/PayrollInsuranceSettlementInputPanel"/
  );
  assert.match(
    payrollInsuranceConsole,
    /from "@\/components\/payroll-insurance\/PayrollInsuranceSettlementSections"/
  );
  assert.match(payrollInsuranceConsole, /const \{ locale \} = useI18n\(\);/);
  assert.match(payrollInsuranceConsole, /const copy = payrollInsuranceCopyByLocale\[locale\];/);
  assert.match(payrollInsuranceConsole, /const runtimeLocale = locale === "ko" \? "ko-KR" : "en-US";/);
  assert.match(payrollInsuranceConsole, /<PayrollInsuranceInputPanel/);
  assert.match(payrollInsuranceConsole, /<PayrollInsuranceSummaryPanel/);
  assert.match(payrollInsuranceConsole, /<PayrollInsuranceComponentsPanel/);
  assert.match(payrollInsuranceConsole, /<PayrollInsuranceLogsPanel/);
  assert.match(payrollInsuranceConsole, /formatKrw\(parsed\.summary\.grossPayKrw, runtimeLocale\)/);
  assert.match(payrollInsuranceConsole, /new Date\(\)\.toLocaleString\(runtimeLocale\)/);
  assert.doesNotMatch(payrollInsuranceConsole, /<h1>Payroll Insurance Settlement<\/h1>/);
  assert.doesNotMatch(payrollInsuranceConsole, /<h2>Input<\/h2>/);
  assert.doesNotMatch(payrollInsuranceConsole, /No API call yet\./);

  assert.match(payrollInsuranceCopy, /export const payrollInsuranceCopyByLocale/);
  assert.match(payrollInsuranceCopy, /title: "급여 4대보험 정산"/);
  assert.match(payrollInsuranceCopy, /title: "Payroll Insurance Settlement"/);
  assert.match(payrollInsuranceCopy, /previewAction: "정산 프리뷰"/);
  assert.match(payrollInsuranceCopy, /previewAction: "Preview Settlement"/);
  assert.match(payrollInsuranceCopy, /okLabel: "성공"/);
  assert.match(payrollInsuranceCopy, /okLabel: "OK"/);

  assert.match(payrollInsuranceSections, /export function PayrollInsuranceSummaryPanel/);
  assert.match(payrollInsuranceSections, /export function PayrollInsuranceComponentsPanel/);
  assert.match(payrollInsuranceSections, /export function PayrollInsuranceLogsPanel/);
  assert.match(payrollInsuranceSections, /copy\.summaryTitle/);
  assert.match(payrollInsuranceSections, /copy\.componentsTitle/);
  assert.match(payrollInsuranceSections, /copy\.apiLogsTitle/);
  assert.match(payrollInsuranceSections, /formatKrw\(result\.summary\.grossPayKrw, runtimeLocale\)/);
  assert.match(
    payrollInsuranceSections,
    /formatKrwRaw\(result\.summary\.rawContributionKrw\.employee\.nationalPensionKrw, runtimeLocale\)/
  );

  assert.match(payrollInsuranceInputPanel, /export function PayrollInsuranceInputPanel/);
  assert.match(payrollInsuranceInputPanel, /copy\.inputTitle/);
  assert.match(payrollInsuranceInputPanel, /copy\.accessTokenLabel/);
  assert.match(payrollInsuranceInputPanel, /copy\.sessionErrorPrefix/);

  assert.match(payrollInsuranceTypes, /export function formatKrw\(value: number, runtimeLocale: string\)/);

  assert.match(workItem, /WI-0332/i);
  assert.match(workItem, /locale/i);
  assert.match(roadmap, /WI-0332/i);
}

run()
  .then(() => {
    console.log("e2e-wi0332-admin-payroll-insurance-locale-dynamic-ui-gap-fix-phase9.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
