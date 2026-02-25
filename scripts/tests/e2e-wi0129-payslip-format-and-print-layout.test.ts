import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

function run() {
  const payslipPage = readUtf8("src", "app", "employee", "payslips", "page.tsx");
  const payslipPageView = readUtf8("src", "app", "employee", "payslips", "page-view.tsx");
  const payslipDerivedState = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "use-payslip-derived-state.ts"
  );
  const payslipDetailPanel = readUtf8(
    "src",
    "app",
    "employee",
    "payslips",
    "page-view-detail-panel.tsx"
  );
  const payslipSurface = `${payslipPage}\n${payslipPageView}\n${payslipDerivedState}\n${payslipDetailPanel}`;
  const localePageCopy = readUtf8("src", "app", "employee", "payslips", "page-locale-page-copy.ts");
  const globalCss = readUtf8("src", "app", "globals.css");

  assert.match(
    payslipSurface,
    /pageCopy\.detail\.actions\.printSavePdf/,
    "payslip page should provide print/pdf action via locale copy"
  );
  assert.match(
    payslipSurface,
    /pageCopy\.detail\.actions\.copyPdfFileName/,
    "payslip page should provide pdf filename copy action via locale copy"
  );
  assert.match(
    payslipSurface,
    /pageCopy\.detail\.deductionGuideTitle/,
    "payslip page should include deduction explanation section"
  );
  assert.match(
    payslipSurface,
    /pageCopy\.detail\.deductionComponentTitle/,
    "payslip page should include statutory component section"
  );
  assert.match(
    payslipSurface,
    /pageCopy\.detail\.taxCreditReferenceTitle/,
    "payslip page should include tax credit explanation section"
  );

  assert.match(localePageCopy, /printSavePdf:\s*"/, "locale copy should define print/pdf action text");
  assert.match(localePageCopy, /copyPdfFileName:\s*"/, "locale copy should define pdf filename action text");
  assert.match(localePageCopy, /deductionGuideTitle:\s*"/, "locale copy should define deduction guide title");
  assert.match(
    localePageCopy,
    /deductionComponentTitle:\s*"/,
    "locale copy should define deduction component title"
  );
  assert.match(
    localePageCopy,
    /taxCreditReferenceTitle:\s*"/,
    "locale copy should define tax credit reference title"
  );

  assert.match(globalCss, /\.panel-payslip-print/, "payslip print panel styles should exist");
  assert.match(globalCss, /\.payslip-sheet/, "payslip sheet styles should exist");
  assert.match(globalCss, /@media print/, "print media layout should be defined");
}

run();
console.log("e2e-wi0129-payslip-format-and-print-layout.test passed");
