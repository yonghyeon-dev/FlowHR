import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.split(/\r?\n/).length;
}

function assertLineBudget(source: string, limit: number, label: string) {
  const lines = countLines(source);
  assert.ok(lines <= limit, `${label} should stay <= ${limit} lines (current: ${lines})`);
}

async function run() {
  const approvalPolicyPage = readUtf8("src", "app", "admin", "approval-policy", "page.tsx");
  const approvalPolicyTypes = readUtf8("src", "app", "admin", "approval-policy", "page-types.ts");
  const peoplePageView = readUtf8("src", "app", "admin", "people", "page-view.tsx");
  const schedulingService = readUtf8("src", "features", "scheduling", "service.ts");
  const schedulingProjection = readUtf8("src", "features", "scheduling", "incident-audit-projection.ts");
  const leaveService = readUtf8("src", "features", "leave", "service.ts");
  const leavePromotionHelpers = readUtf8("src", "features", "leave", "promotion-delivery-helpers.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0459-core-line-budget-guard-admin-people-approval-policy-scheduling-leave.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assertLineBudget(approvalPolicyPage, 500, "admin/approval-policy/page.tsx");
  assertLineBudget(approvalPolicyTypes, 120, "admin/approval-policy/page-types.ts");
  assertLineBudget(peoplePageView, 300, "admin/people/page-view.tsx");
  assertLineBudget(schedulingService, 5300, "scheduling/service.ts");
  assertLineBudget(schedulingProjection, 260, "scheduling/incident-audit-projection.ts");
  assertLineBudget(leaveService, 3000, "leave/service.ts");
  assertLineBudget(leavePromotionHelpers, 280, "leave/promotion-delivery-helpers.ts");

  assert.match(approvalPolicyPage, /from "@\/app\/admin\/approval-policy\/page-types";/);
  assert.match(peoplePageView, /AdminPeopleDirectoryFiltersPanel/);
  assert.match(schedulingService, /from "@\/features\/scheduling\/incident-audit-projection"/);
  assert.match(leaveService, /from "@\/features\/leave\/promotion-delivery-helpers"/);

  assert.match(workItem, /WI-0459/i);
  assert.match(workItem, /core|line budget|guard|approval-policy|people|scheduling|leave/i);
  assert.match(roadmap, /WI-0459/i);
}

run()
  .then(() => {
    console.log("e2e-wi0459-core-line-budget-guard-admin-people-approval-policy-scheduling-leave.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
