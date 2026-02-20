import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

function run() {
  const payslipPage = readUtf8("src", "app", "employee", "payslips", "page.tsx");
  const globalCss = readUtf8("src", "app", "globals.css");

  assert.match(payslipPage, /인쇄\/PDF 저장/, "payslip page should provide print/pdf action");
  assert.match(payslipPage, /PDF 파일명 복사/, "payslip page should provide pdf filename copy action");
  assert.match(payslipPage, /공제 항목 설명/, "payslip page should include deduction explanation section");
  assert.match(payslipPage, /법정공제 세부 구성/, "payslip page should include statutory component section");
  assert.match(payslipPage, /세액공제 참고 항목/, "payslip page should include tax credit explanation section");

  assert.match(globalCss, /\.panel-payslip-print/, "payslip print panel styles should exist");
  assert.match(globalCss, /\.payslip-sheet/, "payslip sheet styles should exist");
  assert.match(globalCss, /@media print/, "print media layout should be defined");
}

run();
console.log("e2e-wi0129-payslip-format-and-print-layout.test passed");
