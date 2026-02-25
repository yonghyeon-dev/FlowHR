import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminApprovalExecutionsPage = readUtf8("src", "app", "admin", "approval-executions", "page.tsx");
  const adminPeoplePage = readUtf8("src", "app", "admin", "people", "page.tsx");
  const adminPeoplePageView = readUtf8("src", "app", "admin", "people", "page-view.tsx");
  const adminPeopleDirectoryFiltersPanel = readUtf8(
    "src",
    "app",
    "admin",
    "people",
    "page-view-directory-filters-panel.tsx"
  );
  const adminPeopleHistoryPanel = readUtf8(
    "src",
    "app",
    "admin",
    "people",
    "page-view-history-panel.tsx"
  );
  const adminPeopleSurface = `${adminPeoplePage}\n${adminPeoplePageView}\n${adminPeopleDirectoryFiltersPanel}\n${adminPeopleHistoryPanel}`;
  const employeePage = readUtf8("src", "app", "employee", "page.tsx");
  const employeeInteractionActions = readUtf8("src", "app", "employee", "page-interaction-actions.ts");
  const workItem = readUtf8("work-items", "WI-0307-admin-pages-locale-dynamic-ui-gap-fix-phase4.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(adminApprovalExecutionsPage, /const \{ locale \} = useI18n\(\);/);
  assert.match(adminApprovalExecutionsPage, /Organization ID/);
  assert.match(adminApprovalExecutionsPage, /Escalation channel/);
  assert.match(adminApprovalExecutionsPage, /requestedAt/);
  assert.match(adminApprovalExecutionsPage, /toDomainLabel\(execution\.domain\)/);
  assert.match(adminApprovalExecutionsPage, /toStateLabel\(execution\.state\)/);
  assert.doesNotMatch(adminApprovalExecutionsPage, /Execution Limit/);
  assert.doesNotMatch(adminApprovalExecutionsPage, /History Limit/);
  assert.doesNotMatch(adminApprovalExecutionsPage, /Escalation Channel/);

  assert.match(adminPeoplePage, /const \{ locale \} = useI18n\(\);/);
  assert.match(adminPeopleSurface, /Organization ID/);
  assert.match(adminPeopleSurface, /Department filter/);
  assert.match(adminPeopleSurface, /Position filter/);
  assert.match(adminPeopleSurface, /Reset filters/);
  assert.match(adminPeopleSurface, /History change summary/);
  assert.doesNotMatch(adminPeopleSurface, /Department Filter/);
  assert.doesNotMatch(adminPeopleSurface, /Position Filter/);
  assert.doesNotMatch(adminPeopleSurface, /Updated Window/);
  assert.doesNotMatch(adminPeopleSurface, /History Limit/);
  assert.doesNotMatch(adminPeopleSurface, /Filter Reset/);
  assert.doesNotMatch(adminPeopleSurface, /History Change Summary/);

  assert.ok(
    /feedback: feedbackCopy\.pendingRequestFilterApplied/.test(employeePage) ||
      /feedback:\s*input\.feedbackCopy\.pendingRequestFilterApplied/.test(employeeInteractionActions)
  );

  assert.match(workItem, /WI-0307/i);
  assert.match(workItem, /locale/i);
  assert.match(roadmap, /WI-0307/i);
}

run()
  .then(() => {
    console.log("e2e-wi0307-admin-pages-locale-dynamic-ui-gap-fix-phase4.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
