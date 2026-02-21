import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

function run() {
  const payslipPage = readUtf8("src", "app", "employee", "payslips", "page.tsx");
  const employeeLayout = readUtf8("src", "app", "employee", "layout.tsx");
  const payslipPageLineCount = payslipPage.split(/\r?\n/).length;

  const removedSectionIds = [
    "payslip-history-sort-accuracy",
    "payslip-history-sort-hardening",
    "payslip-history-sort-hardening-plus",
    "payslip-history-sort-hardening-plus-execution",
    "payslip-history-sort-execution-summary",
    "payslip-history-execution-summary-digest",
    "payslip-confirmation-prediction",
    "payslip-delay-risk-prediction",
    "payslip-delay-risk-response",
    "payslip-delay-risk-response-execution-guide",
    "payslip-delay-risk-response-execution-tracker",
    "payslip-delay-risk-execution-backlog",
    "payslip-delay-execution-backlog-digest",
    "mobile-delivery",
    "payslip-mobile-follow-up-guide",
    "payslip-mobile-follow-up-recommendation",
    "payslip-mobile-follow-up-recommendation-upgrade",
    "payslip-mobile-follow-up-recommendation-upgrade-2",
    "payslip-mobile-follow-up-recommendation-upgrade-3",
    "payslip-mobile-follow-up-recommendation-upgrade-4",
    "payslip-mobile-follow-up-recommendation-upgrade-5"
  ];

  for (const sectionId of removedSectionIds) {
    assert.equal(
      payslipPage.includes(`id="${sectionId}"`),
      false,
      `payslip page should remove bloated section id="${sectionId}"`
    );
    assert.equal(
      employeeLayout.includes(`/employee/payslips#${sectionId}`),
      false,
      `employee layout should remove bloated anchor /employee/payslips#${sectionId}`
    );
  }

  const requiredPayslipAnchors = [
    "/employee/payslips",
    "/employee/payslips#payslip-search-sort",
    "/employee/payslips#status-feedback",
    "/employee/payslips#compare-view"
  ];

  for (const anchor of requiredPayslipAnchors) {
    assert.equal(
      employeeLayout.includes(anchor),
      true,
      `employee layout should keep core payslip anchor ${anchor}`
    );
  }

  assert.ok(
    payslipPageLineCount < 3000,
    `payslip page should stay under 3000 lines after WI-0178 cleanup (current: ${payslipPageLineCount})`
  );
}

run();
console.log("e2e-wi0178-payslip-bloat-section-removal.test passed");
