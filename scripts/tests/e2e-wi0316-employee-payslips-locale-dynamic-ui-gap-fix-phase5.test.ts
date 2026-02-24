import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payslipPage = readUtf8("src", "app", "employee", "payslips", "page.tsx");
  const payslipLocaleHelpers = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-locale-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0316-employee-payslips-locale-dynamic-ui-gap-fix-phase5.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(payslipPage, /import \{ useI18n \} from "@\/lib\/i18n\/provider";/);
  assert.match(payslipPage, /const \{ locale \} = useI18n\(\);/);
  assert.match(payslipPage, /const isKoLocale = locale === "ko";/);
  assert.match(payslipPage, /const runtimeLocale = isKoLocale \? "ko-KR" : "en-US";/);
  assert.match(payslipPage, /from "@\/app\/employee\/payslips\/page-locale-helpers"/);
  assert.match(payslipPage, /const searchSortCopy = useMemo\(\(\) => resolvePayslipSearchSortCopy\(isKoLocale\), \[isKoLocale\]\);/);
  assert.match(payslipPage, /<h2>\{searchSortCopy\.title\}<\/h2>/);
  assert.match(payslipPage, /<p className="small">\{searchSortCopy\.description\}<\/p>/);
  assert.match(payslipPage, /new Date\(\)\.toLocaleString\(runtimeLocale\)/);

  assert.match(payslipLocaleHelpers, /export function resolveRuntimeLocale\(\)/);
  assert.match(payslipLocaleHelpers, /export function formatDateTime\(value: string \| null\)/);
  assert.match(payslipLocaleHelpers, /export function formatDateOnly\(value: string \| null\)/);
  assert.match(payslipLocaleHelpers, /parsed\.toLocaleString\(resolveRuntimeLocale\(\)\)/);
  assert.match(payslipLocaleHelpers, /parsed\.toLocaleDateString\(resolveRuntimeLocale\(\)\)/);
  assert.match(payslipLocaleHelpers, /title: "명세서 검색\/정렬"/);
  assert.match(payslipLocaleHelpers, /title: "Payslip Search\/Sort"/);

  assert.doesNotMatch(payslipPage, /toLocaleString\("ko-KR"\)/);
  assert.doesNotMatch(payslipPage, /toLocaleDateString\("ko-KR"\)/);

  assert.match(workItem, /WI-0316/i);
  assert.match(workItem, /locale/i);
  assert.match(roadmap, /WI-0316/i);
}

run()
  .then(() => {
    console.log("e2e-wi0316-employee-payslips-locale-dynamic-ui-gap-fix-phase5.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
