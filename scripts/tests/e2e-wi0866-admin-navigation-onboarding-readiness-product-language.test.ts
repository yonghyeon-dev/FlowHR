import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function extractAdminNavHrefs(layoutSource: string) {
  const match = layoutSource.match(/const adminLinks:[\s\S]*?=\s*\[([\s\S]*?)\];/);
  assert.ok(match, "adminLinks array should exist in admin layout");
  const body = match[1] ?? "";
  return [...body.matchAll(/href:\s*"([^"]+)"/g)].map((item) => item[1]);
}

function run() {
  const layout = readUtf8("src", "app", "admin", "layout.tsx");
  const onboardingReadiness = readUtf8(
    "src",
    "components",
    "admin-onboarding",
    "AdminOnboardingReadinessPanel.tsx"
  );
  const approvalQueuePanel = readUtf8(
    "src",
    "components",
    "admin-approval",
    "ApprovalQueuePanel.tsx"
  );
  const approvalQueueSearchSortPanel = readUtf8(
    "src",
    "components",
    "admin-approval",
    "ApprovalQueueSearchSortPanel.tsx"
  );
  const leaveCalendarCopy = readUtf8("src", "components", "leave-calendar", "copy.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0866-admin-navigation-onboarding-readiness-product-language.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  const adminNavHrefs = extractAdminNavHrefs(layout);
  assert.ok(adminNavHrefs.length > 0, "admin navigation hrefs should be defined");
  assert.equal(
    new Set(adminNavHrefs).size,
    adminNavHrefs.length,
    "admin navigation should not contain duplicate href values"
  );
  assert.ok(
    adminNavHrefs.includes("/admin/attendance-live?focus=aggregate"),
    "attendance aggregate link should remain available with unique href"
  );
  assert.ok(
    adminNavHrefs.includes("/admin/leave-accrual?focus=policy"),
    "leave policy link should remain available with unique href"
  );
  assert.ok(
    adminNavHrefs.includes("/admin/payroll-close?focus=all"),
    "payroll overview link should remain available with unique href"
  );

  assert.match(onboardingReadiness, /departments:\s*"\/admin\/people"/);
  assert.match(onboardingReadiness, /employees:\s*"\/admin\/people"/);
  assert.match(onboardingReadiness, /invites:\s*"\/admin\/people\?panel=invites"/);
  assert.match(onboardingReadiness, /leave_policy:\s*"\/admin\/leave-accrual"/);
  assert.match(onboardingReadiness, /contracts:\s*"\/admin\/contracts\?status=SENT"/);
  assert.match(onboardingReadiness, /onRunPriorityAction\(item\.key\)/);
  assert.match(onboardingReadiness, /canRunChecklistAction/);

  assert.match(approvalQueuePanel, /query:\s*"Queue search"/);
  assert.match(approvalQueueSearchSortPanel, /query:\s*"Search"/);

  assert.match(leaveCalendarCopy, /queryTitle:\s*"Filters"/);
  assert.match(leaveCalendarCopy, /noQueryResultYet:\s*"No results yet\."/);
  assert.match(leaveCalendarCopy, /pendingLeaveCalendarQuery:\s*"load leave calendar"/);
  assert.match(leaveCalendarCopy, /logLeaveCalendarQuery:\s*"load leave calendar"/);

  assert.match(workItem, /WI-0866/i);
  assert.match(
    workItem,
    /admin|navigation|onboarding|readiness|product|language/i
  );
  assert.match(roadmap, /WI-0866/i);
}

run();
console.log("e2e-wi0866-admin-navigation-onboarding-readiness-product-language.test passed");
