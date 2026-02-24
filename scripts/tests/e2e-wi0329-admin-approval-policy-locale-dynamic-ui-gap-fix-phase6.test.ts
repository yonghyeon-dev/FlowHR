import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const approvalPolicyPage = readUtf8("src", "app", "admin", "approval-policy", "page.tsx");
  const localeHelpers = readUtf8(
    "src",
    "app",
    "admin",
    "approval-policy",
    "page-locale-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0329-admin-approval-policy-locale-dynamic-ui-gap-fix-phase6.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(approvalPolicyPage, /from "@\/app\/admin\/approval-policy\/page-locale-helpers"/);
  assert.match(approvalPolicyPage, /const \{ locale \} = useI18n\(\);/);
  assert.match(
    approvalPolicyPage,
    /const copy = useMemo\(\(\) => resolveAdminApprovalPolicyLocaleCopy\(isKoLocale\), \[isKoLocale\]\);/
  );
  assert.match(approvalPolicyPage, /copy\.context\.organizationId/);
  assert.match(approvalPolicyPage, /copy\.policy\.title/);
  assert.match(approvalPolicyPage, /copy\.delegationCreate\.title/);
  assert.match(approvalPolicyPage, /copy\.delegationList\.title/);
  assert.match(approvalPolicyPage, /copy\.logs\.title/);
  assert.match(approvalPolicyPage, /copy\.domainLabels\[domain\]/);
  assert.match(approvalPolicyPage, /formatApprovalPolicyDateTime\(delegation\.startsAt, runtimeLocale\)/);
  assert.match(approvalPolicyPage, /formatApprovalPolicyDateTime\(delegation\.endsAt, runtimeLocale\)/);
  assert.match(approvalPolicyPage, /formatApprovalPolicyDateTime\(lastExpireResult\.effectiveAt, runtimeLocale\)/);
  assert.doesNotMatch(approvalPolicyPage, /<h2>Context<\/h2>/);
  assert.doesNotMatch(approvalPolicyPage, /FlowHR Admin<\/p>/);
  assert.doesNotMatch(approvalPolicyPage, /Organization ID/);

  assert.match(localeHelpers, /export function resolveAdminApprovalPolicyLocaleCopy\(isKoLocale: boolean\)/);
  assert.match(localeHelpers, /title: "Approval and delegation policy"/);
  assert.match(localeHelpers, /goToAdminHome|toAdmin/);
  assert.match(localeHelpers, /domainLabels: \{/);
  assert.match(localeHelpers, /ATTENDANCE: "Attendance"/);
  assert.match(localeHelpers, /LEAVE: "Leave"/);
  assert.match(localeHelpers, /PAYROLL: "Payroll"/);
  assert.match(localeHelpers, /formatApprovalPolicyDateTime\(value: string, runtimeLocale: string\)/);

  assert.match(workItem, /WI-0329/i);
  assert.match(workItem, /locale/i);
  assert.match(roadmap, /WI-0329/i);
}

run()
  .then(() => {
    console.log("e2e-wi0329-admin-approval-policy-locale-dynamic-ui-gap-fix-phase6.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
