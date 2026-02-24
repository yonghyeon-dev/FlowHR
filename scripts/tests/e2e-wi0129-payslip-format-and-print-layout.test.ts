import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

function run() {
  const payslipPage = readUtf8("src", "app", "employee", "payslips", "page.tsx");
  const localeHelpers = readUtf8("src", "app", "employee", "payslips", "page-locale-helpers.ts");
  const globalCss = readUtf8("src", "app", "globals.css");

  assert.match(
    payslipPage,
    /pageCopy\.detail\.actions\.printSavePdf/,
    "payslip page should provide print/pdf action via locale copy"
  );
  assert.match(
    payslipPage,
    /pageCopy\.detail\.actions\.copyPdfFileName/,
    "payslip page should provide pdf filename copy action via locale copy"
  );
  assert.match(
    payslipPage,
    /pageCopy\.detail\.deductionGuideTitle/,
    "payslip page should include deduction explanation section"
  );
  assert.match(
    payslipPage,
    /pageCopy\.detail\.deductionComponentTitle/,
    "payslip page should include statutory component section"
  );
  assert.match(
    payslipPage,
    /pageCopy\.detail\.taxCreditReferenceTitle/,
    "payslip page should include tax credit explanation section"
  );

  assert.match(localeHelpers, /printSavePdf: "인쇄\/PDF 저장"/);
  assert.match(localeHelpers, /copyPdfFileName: "PDF 파일명 복사"/);
  assert.match(localeHelpers, /deductionGuideTitle: "공제 항목 설명"/);
  assert.match(localeHelpers, /deductionComponentTitle: "법정공제 세부 구성"/);
  assert.match(localeHelpers, /taxCreditReferenceTitle: "세액공제 참고 항목"/);

  assert.match(globalCss, /\.panel-payslip-print/, "payslip print panel styles should exist");
  assert.match(globalCss, /\.payslip-sheet/, "payslip sheet styles should exist");
  assert.match(globalCss, /@media print/, "print media layout should be defined");
}

run();
console.log("e2e-wi0129-payslip-format-and-print-layout.test passed");
