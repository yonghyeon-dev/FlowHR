import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const operationsPage = readUtf8("src", "app", "admin", "operations", "page.tsx");
  const adminNav = readUtf8("src", "app", "admin", "admin-shell-navigation.ts");
  const workspaceHubs = readUtf8("src", "app", "admin", "page-workspace-hubs.ts");
  const globalsCss = readUtf8("src", "app", "globals.css");
  const workItem = readUtf8("work-items", "WI-1175-admin-operations-lane-rollout.md");

  assert.match(adminNav, /dashboardEntryHref: "\/admin\/operations"/);
  assert.match(adminNav, /href: "\/admin\/operations", labelKey: "admin\.nav\.operationsLane"/);

  assert.match(workspaceHubs, /href: "\/admin\/operations", label: \{ ko: "운영 레인", en: "Operations lane" \}/);

  assert.match(operationsPage, /title=\{isKoLocale \? "운영 레인" : "Operations lane"\}/);
  assert.match(operationsPage, /withAdminSource\("\/admin\/attendance-live", ADMIN_OPERATIONS_SOURCE\)/);
  assert.match(operationsPage, /withAdminSource\("\/admin\/contracts\?decisionQueueOnly=true", ADMIN_OPERATIONS_SOURCE\)/);
  assert.match(operationsPage, /title=\{isKoLocale \? "오늘 바로 처리" : "Handle first today"\}/);
  assert.match(operationsPage, /title=\{isKoLocale \? "운영 워크스페이스 레인" : "Operations workspace lanes"\}/);
  assert.match(operationsPage, /title=\{isKoLocale \? "레인 운영 원칙" : "Lane operating principles"\}/);

  assert.match(globalsCss, /\.admin-operations-lane-shell \{/);
  assert.match(globalsCss, /\.admin-operations-lane-cards \{/);
  assert.match(globalsCss, /\.admin-operations-rule-list \{/);

  assert.match(workItem, /WI-1175/);
  assert.match(workItem, /\/admin\/operations/);
}

run()
  .then(() => {
    console.log("e2e-wi1175-admin-operations-lane-rollout.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
