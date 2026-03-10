import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const filingConsole = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingConsole.tsx"
  );
  const settlementPanels = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "FilingSettlementSummaryPanels.tsx"
  );
  const filingCopy = readUtf8("src", "components", "payroll-year-end-filing", "copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0334-admin-payroll-year-end-filing-locale-dynamic-ui-gap-fix.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(filingConsole, /from "@\/components\/payroll-year-end-filing\/copy"/);
  assert.match(filingConsole, /const \{ locale \} = useI18n\(\);/);
  assert.match(filingConsole, /const runtimeLocale = locale === "ko" \? "ko-KR" : "en-US";/);
  assert.match(filingConsole, /const copy = payrollYearEndFilingCopyByLocale\[locale\];/);
  assert.match(filingConsole, /new Date\(\)\.toLocaleString\(runtimeLocale\)/);
  assert.match(settlementPanels, /from "@\/components\/payroll-year-end\/types"/);
  assert.match(
    settlementPanels,
    /formatKrw\(filingExport\.filingData\.settlementKrw\.annualTaxLiabilityKrw, runtimeLocale\)/
  );
  assert.match(
    settlementPanels,
    /formatKrw\(finalization\.settlement\.settlementKrw\.annualTaxLiabilityKrw, runtimeLocale\)/
  );
  assert.doesNotMatch(
    filingConsole,
    /<h1>Payroll Year-End Finalization, Filing Search\/Sort, ACK Catalog, and Lifecycle Console<\/h1>/
  );
  assert.doesNotMatch(filingConsole, /<h2>Input<\/h2>/);

  assert.match(filingCopy, /export const payrollYearEndFilingCopyByLocale/);
  assert.match(filingCopy, /ko:\s*\{/);
  assert.match(filingCopy, /en: filingCopyEn/);
  assert.match(filingCopy, /title: "연말정산 확정 및 신고 관리"/);
  assert.match(filingCopy, /title: "Payroll Year-End Finalization and Filing"/);
  assert.match(filingCopy, /loadAckCatalogAction/);
  assert.match(filingCopy, /loadSubmissionTimelineAction/);

  assert.match(workItem, /WI-0334/i);
  assert.match(workItem, /locale/i);
  assert.match(roadmap, /WI-0334/i);
}

run()
  .then(() => {
    console.log("e2e-wi0334-admin-payroll-year-end-filing-locale-dynamic-ui-gap-fix.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
