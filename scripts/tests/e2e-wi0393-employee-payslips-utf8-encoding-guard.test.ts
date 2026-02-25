import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payslipPath = join(process.cwd(), "src", "app", "employee", "payslips", "page.tsx");
  const payslipRaw = readFileSync(payslipPath);
  const payslipSource = payslipRaw.toString("utf8");
  const localeHelperSource = readUtf8("src", "app", "employee", "payslips", "page-locale-helpers.ts");
  const workItem = readUtf8("work-items", "WI-0393-employee-payslips-utf8-encoding-guard.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.ok(!payslipSource.includes("\uFFFD"), "payslip page should not contain UTF-8 replacement chars");
  assert.ok(
    Buffer.from(payslipSource, "utf8").equals(payslipRaw),
    "payslip page should be valid UTF-8 bytes"
  );

  assert.match(
    payslipSource,
    /const compareInsightTitle = useMemo\(\(\) => resolveCompareInsightTitle\(isKoLocale\), \[isKoLocale\]\);/
  );
  assert.match(
    payslipSource,
    /const compareInsightAriaLabel = useMemo\(\(\) => resolveCompareInsightAriaLabel\(isKoLocale\), \[isKoLocale\]\);/
  );
  assert.match(
    payslipSource,
    /return formatCompareWindowLabel\(selectedLabel, compareLabel, isKoLocale\);/
  );

  assert.match(
    localeHelperSource,
    /export function resolveCompareInsightTitle\(isKoLocale: boolean\)/
  );
  assert.match(
    localeHelperSource,
    /return isKoLocale \? "전월 대비 설명" : "Month-over-month explanation";/
  );
  assert.match(
    localeHelperSource,
    /export function resolveCompareInsightAriaLabel\(isKoLocale: boolean\)/
  );
  assert.match(
    localeHelperSource,
    /return isKoLocale \? "전월 대비 설명 카드" : "Month-over-month explanation cards";/
  );
  assert.match(
    localeHelperSource,
    /export function formatCompareWindowLabel\([\s\S]*isKoLocale: boolean[\s\S]*\)/
  );
  assert.match(
    localeHelperSource,
    /return isKoLocale \? `\$\{selectedLabel\} 대비 \$\{compareLabel\}` : `\$\{selectedLabel\} vs \$\{compareLabel\}`;/
  );

  assert.doesNotMatch(payslipSource, /Àü¿ù|´ëºñ|¼³¸í|ì „ì›”|ëŒ€ë¹„|ì„¤ëª…|\?€ë¹?/);

  assert.match(workItem, /WI-0393/i);
  assert.match(workItem, /UTF-8|encoding|인코딩/i);
  assert.match(roadmap, /WI-0393/i);
}

run()
  .then(() => {
    console.log("e2e-wi0393-employee-payslips-utf8-encoding-guard.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
