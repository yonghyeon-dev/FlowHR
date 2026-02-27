import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function countLines(source: string) {
  return source.split(/\r?\n/).length;
}

async function run() {
  const dashboard = readUtf8("src", "components", "admin-kpi", "AdminKpiDashboard.tsx");
  const sections = readUtf8("src", "components", "admin-kpi", "AdminKpiSections.tsx");
  const utils = readUtf8("src", "components", "admin-kpi", "dashboard-utils.ts");
  const copy = readUtf8("src", "components", "admin-kpi", "copy.ts");
  const summary = readUtf8("src", "features", "admin-kpi", "summary.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0592-admin-analytics-contract-decision-queue-kpi.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(summary, /contractDecisionQueueCount: number;/);
  assert.match(summary, /contractDecisionQueueCount: Math\.max\(0, Math\.trunc\(input\.contractDecisionQueueCount\)\)/);

  assert.match(dashboard, /resolveAdminContractDocumentNextStep/);
  assert.match(dashboard, /const contractDecisionQueueSteps = new Set\(\["REQUEST_APPROVAL", "APPROVE_OR_REJECT", "SEND_DOCUMENT"\]\)/);
  assert.match(dashboard, /const contractDecisionQueueCount = contractDocuments\.filter/);
  assert.match(dashboard, /contractDecisionQueueCount,/);

  assert.match(sections, /"contractDecisionQueueCount"/);
  assert.match(sections, /option value="contractDecisionQueueCount"/);
  assert.match(sections, /copy\.cards\.contractDecisionQueueCount/);
  assert.match(sections, /kpi\.summary\.contractDecisionQueueCount/);

  assert.match(utils, /key: "contractDecisionQueueCount"/);
  assert.match(utils, /summary\.contractDecisionQueueCount/);

  assert.match(copy, /contractDecisionQueueCount:/);

  assert.ok(
    countLines(dashboard) <= 300,
    `AdminKpiDashboard.tsx should stay <= 300 lines (current: ${countLines(dashboard)})`
  );
  assert.ok(
    countLines(sections) <= 300,
    `AdminKpiSections.tsx should stay <= 300 lines (current: ${countLines(sections)})`
  );

  assert.match(workItem, /WI-0592/i);
  assert.match(workItem, /admin|analytics|contracts|decision|queue|kpi/i);
  assert.match(roadmap, /WI-0592/i);
}

run()
  .then(() => {
    console.log("e2e-wi0592-admin-analytics-contract-decision-queue-kpi.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
