import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.split(/\r?\n/).length;
}

function run() {
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const summaryHelpers = readUtf8("src", "app", "admin", "page-summary-helpers.ts");
  const dashboardTypes = readUtf8("src", "app", "admin", "page-dashboard-types.ts");
  const benefitsWorkspace = readUtf8("src", "components", "benefits", "AdminBenefitsWorkspace.tsx");
  const workItem = readUtf8(
    "work-items",
    "WI-0813-admin-dashboard-summary-split-and-benefits-deeplink-autoload.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(adminPage, /buildAdminSummaryFromApiResults\(/);
  assert.match(adminPage, /from "@\/app\/admin\/page-summary-helpers"/);
  assert.match(adminPage, /from "@\/app\/admin\/page-dashboard-types"/);
  assert.ok(
    countLines(adminPage) <= 360,
    `admin/page.tsx should stay <= 360 lines after split (current: ${countLines(adminPage)})`
  );

  assert.match(summaryHelpers, /export function buildAdminSummaryFromApiResults\(/);
  assert.match(summaryHelpers, /resolveAdminContractDocumentNextStep/);
  assert.match(summaryHelpers, /contractDecisionQueueCount/);
  assert.match(summaryHelpers, /contractSlaOverdueCount/);

  assert.match(dashboardTypes, /export type AdminSummary = \{/);
  assert.match(dashboardTypes, /export const EMPTY_SUMMARY/);

  assert.match(benefitsWorkspace, /import \{ useSearchParams \} from "next\/navigation";/);
  assert.match(benefitsWorkspace, /normalizeBenefitRequestFilter\(searchParams\.get\("status"\)\)/);
  assert.match(benefitsWorkspace, /normalizeBenefitRiskFilter\(searchParams\.get\("risk"\)\)/);
  assert.match(benefitsWorkspace, /parseBenefitSearchQuery\(searchParams\.get\("q"\)\)/);
  assert.match(benefitsWorkspace, /const \[autoLoadAttempted, setAutoLoadAttempted\] = useState\(false\);/);
  assert.match(benefitsWorkspace, /void loadWorkspace\(\);/);

  assert.match(workItem, /WI-0813/i);
  assert.match(workItem, /admin|dashboard|summary|split|benefits|deeplink|autoload/i);
  assert.match(roadmap, /WI-0813/i);
}

run();
console.log("e2e-wi0813-admin-dashboard-summary-split-and-benefits-deeplink-autoload.test passed");
