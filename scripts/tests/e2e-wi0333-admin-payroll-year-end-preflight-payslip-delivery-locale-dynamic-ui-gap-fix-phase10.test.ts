import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const yearEndConsole = readUtf8("src", "components", "payroll-year-end", "PayrollYearEndConsole.tsx");
  const preflightConsole = readUtf8(
    "src",
    "components",
    "payroll-year-end",
    "PayrollYearEndPreflightConsole.tsx"
  );
  const yearEndCopy = readUtf8("src", "components", "payroll-year-end", "copy.ts");
  const yearEndTypes = readUtf8("src", "components", "payroll-year-end", "types.ts");
  const payslipDeliveryConsole = readUtf8(
    "src",
    "components",
    "payroll-payslip-delivery",
    "PayrollPayslipDeliveryConsole.tsx"
  );
  const payslipDeliveryCopy = readUtf8("src", "components", "payroll-payslip-delivery", "copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0333-admin-payroll-year-end-preflight-payslip-delivery-locale-dynamic-ui-gap-fix-phase10.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(yearEndConsole, /from "@\/components\/payroll-year-end\/copy"/);
  assert.match(yearEndConsole, /const \{ locale \} = useI18n\(\);/);
  assert.match(yearEndConsole, /const copy = payrollYearEndCopyByLocale\[locale\];/);
  assert.match(yearEndConsole, /const runtimeLocale = locale === "ko" \? "ko-KR" : "en-US";/);
  assert.match(yearEndConsole, /new Date\(\)\.toLocaleString\(runtimeLocale\)/);
  assert.match(yearEndConsole, /formatKrw\(settlement\.summary\.annualTotalsKrw\.grossPayKrw, runtimeLocale\)/);
  assert.doesNotMatch(yearEndConsole, /<h1>Payroll Year-End and Withholding Receipt<\/h1>/);

  assert.match(preflightConsole, /from "@\/components\/payroll-year-end\/copy"/);
  assert.match(preflightConsole, /const copy = payrollYearEndPreflightCopyByLocale\[locale\];/);
  assert.match(preflightConsole, /formatKrw\(checklist\.checklist\.metrics\.annualGrossPayKrw, runtimeLocale\)/);
  assert.doesNotMatch(preflightConsole, /<h1>Payroll Year-End Preflight Checklist<\/h1>/);

  assert.match(payslipDeliveryConsole, /from "@\/components\/payroll-payslip-delivery\/copy"/);
  assert.match(payslipDeliveryConsole, /const copy = payrollPayslipDeliveryCopyByLocale\[locale\];/);
  assert.match(payslipDeliveryConsole, /const runtimeLocale = locale === "ko" \? "ko-KR" : "en-US";/);
  assert.match(payslipDeliveryConsole, /new Date\(\)\.toLocaleString\(runtimeLocale\)/);
  assert.doesNotMatch(payslipDeliveryConsole, /<h1>Payroll Payslip Delivery<\/h1>/);

  assert.match(yearEndCopy, /export const payrollYearEndCopyByLocale/);
  assert.match(yearEndCopy, /export const payrollYearEndPreflightCopyByLocale/);
  assert.match(yearEndCopy, /ko:\s*\{/);
  assert.match(yearEndCopy, /en: yearEndCopyEn/);
  assert.match(yearEndCopy, /en: yearEndPreflightCopyEn/);

  assert.match(payslipDeliveryCopy, /export const payrollPayslipDeliveryCopyByLocale/);
  assert.match(payslipDeliveryCopy, /ko:\s*\{/);
  assert.match(payslipDeliveryCopy, /en: payslipDeliveryCopyEn/);

  assert.match(yearEndTypes, /export function formatKrw\(value: number, runtimeLocale = "ko-KR"\)/);

  assert.match(workItem, /WI-0333/i);
  assert.match(workItem, /locale/i);
  assert.match(roadmap, /WI-0333/i);
}

run()
  .then(() => {
    console.log(
      "e2e-wi0333-admin-payroll-year-end-preflight-payslip-delivery-locale-dynamic-ui-gap-fix-phase10.test passed"
    );
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
