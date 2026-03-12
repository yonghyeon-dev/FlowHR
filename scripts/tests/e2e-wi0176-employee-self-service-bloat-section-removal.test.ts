import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

function run() {
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const employeeLayout = readUtf8("src", "app", "employee", "layout.tsx");
  const employeePageLineCount = employeePage.split(/\r?\n/).length;

  const removedSectionIds = [
    "request-history-sort-accuracy",
    "request-history-sort-hardening",
    "request-history-sort-hardening-plus",
    "request-history-sort-hardening-plus-execution",
    "request-history-sort-execution-summary",
    "request-history-execution-summary-digest",
    "request-bottleneck-feedback",
    "request-wait-prediction",
    "approval-delay-risk-prediction",
    "approval-delay-risk-response",
    "approval-delay-risk-response-execution-guide",
    "approval-delay-risk-response-execution-tracker",
    "approval-delay-risk-execution-backlog",
    "approval-delay-execution-backlog-digest",
    "mobile-shortcuts",
    "mobile-status-badges",
    "mobile-submit-guide",
    "mobile-follow-up-guide",
    "mobile-follow-up-recommendation",
    "mobile-follow-up-recommendation-upgrade",
    "mobile-follow-up-recommendation-upgrade-2",
    "mobile-follow-up-recommendation-upgrade-3",
    "mobile-follow-up-recommendation-upgrade-4",
    "mobile-follow-up-recommendation-upgrade-5",
    "attendance-correction-insights",
    "leave-balance-forecast",
    "leave-calendar-insights"
  ];

  for (const sectionId of removedSectionIds) {
    assert.equal(
      employeePage.includes(`id="${sectionId}"`),
      false,
      `employee page should remove bloated section id="${sectionId}"`
    );
    assert.equal(
      employeeLayout.includes(`/employee#${sectionId}`),
      false,
      `employee layout should remove bloated anchor /employee#${sectionId}`
    );
    assert.equal(
      employeeLayout.includes(`/employee?focus=${sectionId}`),
      false,
      `employee layout should remove bloated focus route /employee?focus=${sectionId}`
    );
  }

  const requiredEmployeeRoutes = [
    "/employee/guide",
    "/employee/schedule",
    "/employee/requests",
    "/employee/attendance/correction",
    "/employee/leave/request",
    "/employee/benefits",
    "/employee/contracts",
    "/employee/payslips",
    "/employee/notifications",
    "/employee/notices"
  ];

  for (const route of requiredEmployeeRoutes) {
    assert.equal(
      employeeLayout.includes(route),
      true,
      `employee layout should keep core route ${route}`
    );
  }

  assert.ok(
    employeePageLineCount < 3000,
    `employee page should stay under 3000 lines after WI-0176 cleanup (current: ${employeePageLineCount})`
  );
}

run();
console.log("e2e-wi0176-employee-self-service-bloat-section-removal.test passed");
