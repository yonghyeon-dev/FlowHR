import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

function run() {
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const adminLayout = readUtf8("src", "app", "admin", "layout.tsx");
  const adminPageLineCount = adminPage.split(/\r?\n/).length;

  const removedSectionIds = [
    "approval-history-sort-accuracy",
    "approval-history-sort-hardening",
    "approval-history-sort-hardening-plus",
    "approval-history-sort-hardening-plus-execution",
    "approval-history-sort-execution-tracker",
    "approval-history-execution-summary",
    "approval-history-execution-summary-digest",
    "approval-evidence-preview",
    "approval-evidence-comparison",
    "approval-sla-timeline",
    "approval-sla-alert-rules",
    "approval-processing-prediction",
    "approval-delay-risk-prediction",
    "approval-delay-risk-response",
    "approval-delay-risk-response-execution-guide",
    "approval-delay-risk-response-execution-tracker",
    "approval-delay-risk-execution-backlog",
    "approval-delay-execution-backlog-digest",
    "approval-mobile-review-sheet",
    "approval-mobile-checklist",
    "approval-mobile-follow-up-guide",
    "approval-mobile-follow-up-recommendation",
    "approval-mobile-follow-up-recommendation-upgrade",
    "approval-mobile-follow-up-recommendation-upgrade-2",
    "approval-mobile-follow-up-recommendation-upgrade-3",
    "approval-mobile-follow-up-recommendation-upgrade-4",
    "approval-mobile-follow-up-recommendation-upgrade-5",
    "approval-mobile-follow-up-recommendation-upgrade-6",
    "approval-bulk-validation",
    "approval-item-history",
    "approval-mobile-feedback"
  ];

  for (const sectionId of removedSectionIds) {
    assert.equal(
      adminPage.includes(`id="${sectionId}"`),
      false,
      `admin page should remove bloated section id="${sectionId}"`
    );
    assert.equal(
      adminLayout.includes(`/admin#${sectionId}`),
      false,
      `admin layout should remove bloated anchor /admin#${sectionId}`
    );
  }

  const removedAdminAnchors = [
    "/admin#onboarding",
    "/admin#people",
    "/admin#invites",
    "/admin#scheduling",
    "/admin#approval-search-sort",
    "/admin#account",
    "/admin/approval-templates",
    "/admin/contracts#contract-template-library",
    "/admin/contracts#contract-signature-readiness",
    "/admin/approval-history",
    "/admin/approval-executions"
  ];

  for (const anchor of removedAdminAnchors) {
    assert.equal(
      adminLayout.includes(anchor),
      false,
      `admin layout should remove non-core anchor ${anchor}`
    );
  }

  const requiredAdminAnchors = [
    "/admin",
    "/admin#approvals",
    "/admin#aggregates",
    "/admin#leave-policy",
    "/admin#payroll",
    "/admin/people",
    "/admin/contracts",
    "/admin/approval-policy"
  ];

  for (const anchor of requiredAdminAnchors) {
    assert.equal(
      adminLayout.includes(anchor),
      true,
      `admin layout should keep core anchor ${anchor}`
    );
  }

  assert.ok(
    adminPageLineCount < 3000,
    `admin page should stay under 3000 lines after WI-0177 cleanup (current: ${adminPageLineCount})`
  );
}

run();
console.log("e2e-wi0177-admin-dashboard-bloat-section-removal.test passed");
