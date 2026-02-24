import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const approvalHistoryPage = readUtf8("src", "app", "admin", "approval-history", "page.tsx");
  const localeHelpers = readUtf8(
    "src",
    "app",
    "admin",
    "approval-history",
    "page-locale-helpers.ts"
  );
  const workItem = readUtf8(
    "work-items",
    "WI-0328-admin-approval-history-locale-dynamic-ui-gap-fix-phase5.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(approvalHistoryPage, /from "@\/app\/admin\/approval-history\/page-locale-helpers"/);
  assert.match(approvalHistoryPage, /const \{ locale \} = useI18n\(\);/);
  assert.match(
    approvalHistoryPage,
    /const copy = useMemo\(\(\) => resolveAdminApprovalHistoryLocaleCopy\(isKoLocale\), \[isKoLocale\]\);/
  );
  assert.match(approvalHistoryPage, /copy\.hero\.title/);
  assert.match(approvalHistoryPage, /copy\.filters\.organizationId/);
  assert.match(approvalHistoryPage, /copy\.results\.title/);
  assert.match(approvalHistoryPage, /copy\.logs\.title/);
  assert.match(approvalHistoryPage, /formatApprovalHistoryDateTime\(entry\.evaluatedAt, runtimeLocale\)/);
  assert.match(approvalHistoryPage, /copy\.logs\.okBadge/);
  assert.match(approvalHistoryPage, /copy\.logs\.failBadge/);
  assert.doesNotMatch(approvalHistoryPage, /<h2>컨텍스트\/필터<\/h2>/);
  assert.doesNotMatch(approvalHistoryPage, /Organization ID/);
  assert.doesNotMatch(approvalHistoryPage, /FlowHR Admin/);

  assert.match(localeHelpers, /export function resolveAdminApprovalHistoryLocaleCopy\(isKoLocale: boolean\)/);
  assert.match(localeHelpers, /goToExecutions: "Go to approval executions"/);
  assert.match(localeHelpers, /goToTemplates: "Go to approval templates"/);
  assert.match(localeHelpers, /goToAdminHome: "Back to admin home"/);
  assert.match(localeHelpers, /okBadge: "OK"/);
  assert.match(localeHelpers, /failBadge: "FAIL"/);
  assert.match(localeHelpers, /formatApprovalHistoryDateTime\(value: string, runtimeLocale: string\)/);

  assert.match(workItem, /WI-0328/i);
  assert.match(workItem, /locale/i);
  assert.match(roadmap, /WI-0328/i);
}

run()
  .then(() => {
    console.log("e2e-wi0328-admin-approval-history-locale-dynamic-ui-gap-fix-phase5.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
