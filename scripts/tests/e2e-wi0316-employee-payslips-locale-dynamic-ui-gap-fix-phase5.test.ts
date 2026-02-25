import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payslipPage = readUtf8("src", "app", "employee", "payslips", "page.tsx");
  const payslipPageView = readUtf8("src", "app", "employee", "payslips", "page-view.tsx");
  const payslipSurface = `${payslipPage}\n${payslipPageView}`;
  const payslipLocaleHelpers = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-locale-helpers.ts"
  );
  const payslipLocaleRuntime = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-locale-runtime.ts"
  );
  const payslipSearchSortCopy = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-locale-search-sort-copy.ts"
  );
  const payslipApi = readUtf8("src", "app", "employee", "payslips", "use-payslip-api.ts");
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
  assert.match(payslipPage, /setPayslipRuntimeLocale\(runtimeLocale\)/);
  assert.match(payslipPage, /setPayslipRuntimeLocale\(null\)/);
  assert.match(payslipPage, /usePayslipApi\(\{/);
  assert.match(payslipPage, /runtimeLocale,/);
  assert.match(payslipPageView, /<h2>\{searchSortCopy\.title\}<\/h2>/);
  assert.match(payslipPageView, /<p className="small">\{searchSortCopy\.description\}<\/p>/);

  assert.match(
    payslipApi,
    /function buildApiLogEntry\(label: string, runtimeLocale: string, status: number, ok: boolean, body: unknown\)/
  );
  assert.match(payslipApi, /at: new Date\(\)\.toLocaleString\(runtimeLocale\),/);
  assert.match(payslipApi, /buildApiLogEntry\(label, runtimeLocale, status, ok, body\)/);

  assert.match(payslipLocaleHelpers, /resolveRuntimeLocale,/);
  assert.match(payslipLocaleHelpers, /formatDateTime,/);
  assert.match(payslipLocaleHelpers, /formatDateOnly,/);
  assert.match(payslipLocaleHelpers, /setPayslipRuntimeLocale/);

  assert.match(payslipLocaleRuntime, /export function resolveRuntimeLocale\(\)/);
  assert.match(payslipLocaleRuntime, /export function formatDateTime\(value: string \| null\)/);
  assert.match(payslipLocaleRuntime, /export function formatDateOnly\(value: string \| null\)/);
  assert.match(payslipLocaleRuntime, /parsed\.toLocaleString\(resolveRuntimeLocale\(\)\)/);
  assert.match(payslipLocaleRuntime, /parsed\.toLocaleDateString\(resolveRuntimeLocale\(\)\)/);

  assert.match(payslipSearchSortCopy, /export function resolvePayslipSearchSortCopy\(isKoLocale: boolean\)/);
  assert.match(payslipSearchSortCopy, /title: "Payslip Search\/Sort"/);

  assert.doesNotMatch(payslipSurface, /toLocaleString\("ko-KR"\)/);
  assert.doesNotMatch(payslipSurface, /toLocaleDateString\("ko-KR"\)/);

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
