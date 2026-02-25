import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const payslipPage = readUtf8("src", "app", "employee", "payslips", "page.tsx");
  const payslipPageView = readUtf8("src", "app", "employee", "payslips", "page-view.tsx");
  const payslipDerivedState = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "use-payslip-derived-state.ts"
  );
  const localeHelpers = readUtf8("src", "app", "employee", "payslips", "page-locale-helpers.ts");
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

  assert.match(payslipPageView, /<h1 className="page-title">\{pageCopy\.pageTitle\}<\/h1>/);
  assert.match(payslipPageView, /\{pageCopy\.status\.title\}/);
  assert.match(payslipPageView, /\{pageCopy\.compare\.title\}/);

  assert.doesNotMatch(payslipPageView, /<h1 className="page-title">급여 명세서<\/h1>/);
  assert.doesNotMatch(payslipPageView, /<h2>상태\/오류 피드백<\/h2>/);
  assert.doesNotMatch(payslipPageView, /<h2>명세서 비교 조회<\/h2>/);

  assert.match(localeHelpers, /export function resolvePayslipPageCopy\(isKoLocale: boolean\)/);
  assert.match(localeHelpers, /export function resolvePayslipRunStateLabel\(state: PayslipRunState, isKoLocale: boolean\)/);
  assert.match(localeHelpers, /export function resolveDeductionDescriptionMap\(isKoLocale: boolean\)/);
  assert.match(localeHelpers, /pageTitle: "급여 명세서"/);
  assert.match(localeHelpers, /pageTitle: "Payslips"/);

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
