import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payslipPage = readUtf8("src", "app", "employee", "payslips", "page.tsx");
  const payslipPageView = readUtf8("src", "app", "employee", "payslips", "page-view.tsx");
  const payslipFilterPanel = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-view-filter-panel.tsx"
  );
  const payslipRunListPanel = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-view-run-list-panel.tsx"
  );
  const payslipViewSurface = `${payslipPageView}\n${payslipFilterPanel}\n${payslipRunListPanel}`;

  const payslipDerivedState = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "use-payslip-derived-state.ts"
  );
  const localeHelpers = readUtf8("src", "app", "employee", "payslips", "page-locale-helpers.ts");
  const localeCopy = readUtf8("src", "app", "employee", "payslips", "page-locale-copy.ts");
  const localePageCopy = readUtf8("src", "app", "employee", "payslips", "page-locale-page-copy.ts");
  const localeDeductionCopy = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-locale-deduction-copy.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0319-employee-payslips-locale-dynamic-residual-gap-fix-phase7.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(payslipPage, /const pageCopy = useMemo\(\(\) => resolvePayslipPageCopy\(isKoLocale\), \[isKoLocale\]\);/);
  assert.match(
    payslipPage,
    /const deductionDescriptionMap = useMemo<DeductionDescriptionMap>\(\s*\(\) => resolveDeductionDescriptionMap\(isKoLocale\),/
  );
  assert.match(payslipDerivedState, /resolvePayslipRunStateLabel\(run\.state, isKoLocale\)/);
  assert.match(
    payslipDerivedState,
    /stateSearchText: `\$\{run\.state\.toLowerCase\(\)\} \$\{stateLabel\.toLowerCase\(\)\}`/
  );

  assert.match(payslipViewSurface, /<h1 className="page-title">\{pageCopy\.pageTitle\}<\/h1>/);
  assert.match(payslipViewSurface, /\{pageCopy\.status\.title\}/);
  assert.match(payslipViewSurface, /\{pageCopy\.compare\.title\}/);
  assert.doesNotMatch(payslipViewSurface, /�/);

  assert.match(localeHelpers, /resolvePayslipPageCopy,/);
  assert.match(localeHelpers, /resolvePayslipRunStateLabel,/);
  assert.match(localeHelpers, /resolveDeductionDescriptionMap,/);
  assert.match(localeHelpers, /from "@\/app\/employee\/payslips\/page-locale-copy"/);

  assert.match(localeCopy, /export \{ resolvePayslipPageCopy \} from "@\/app\/employee\/payslips\/page-locale-page-copy";/);
  assert.match(localeCopy, /resolveDeductionDescriptionMap,/);
  assert.match(localeCopy, /resolvePayslipRunStateLabel/);

  assert.match(localePageCopy, /export function resolvePayslipPageCopy\(isKoLocale: boolean\): PayslipPageCopy/);
  assert.match(localePageCopy, /pageTitle: "Payslips"/);
  assert.match(localeDeductionCopy, /export function resolvePayslipRunStateLabel\(state: PayslipRunState \| string, isKoLocale: boolean\)/);
  assert.match(localeDeductionCopy, /export function resolveDeductionDescriptionMap\(isKoLocale: boolean\): DeductionDescriptionMap/);

  const payslipPageLineCount = payslipPage.split(/\r?\n/).length;
  assert.ok(
    payslipPageLineCount < 1500,
    `expected employee payslips page line count below 1500, got ${payslipPageLineCount}`
  );

  assert.match(workItem, /WI-0319/i);
  assert.match(workItem, /locale/i);
  assert.match(roadmap, /WI-0319/i);
}

run()
  .then(() => {
    console.log("e2e-wi0319-employee-payslips-locale-dynamic-residual-gap-fix-phase7.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
