import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const adminDashboardPage = readUtf8("src", "app", "admin", "page.tsx");
  const workspaceHubs = readUtf8("src", "app", "admin", "page-workspace-hubs.ts");
  const contractsWorkspace = readUtf8("src", "components", "contracts", "AdminContractsWorkspace.tsx");
  const workItem = readUtf8(
    "work-items",
    "WI-0858-admin-workspace-hub-contract-source-context.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(adminDashboardPage, /const withAdminDashboardSource = \(href: string\) =>/);
  assert.match(adminDashboardPage, /!href\.startsWith\("\/admin\/contracts"\) \|\| href\.includes\("source="\)/);
  assert.match(adminDashboardPage, /return `\$\{href\}\$\{separator\}source=admin-dashboard`/);
  assert.match(adminDashboardPage, /href=\{withAdminDashboardSource\(link\.href\)\}/);

  assert.match(workspaceHubs, /\/admin\/contracts\?decisionQueueOnly=true/);
  assert.match(workspaceHubs, /\/admin\/contracts\?status=SENT/);
  assert.match(workspaceHubs, /\/admin\/contracts\?slaRisk=OVERDUE/);
  assert.match(workspaceHubs, /\/admin\/contracts\?renewalCandidateOnly=true/);

  assert.match(contractsWorkspace, /analyticsSource === "admin-dashboard"/);
  assert.match(contractsWorkspace, /copy\.dashboardSourceBanner/);

  assert.match(workItem, /WI-0858/i);
  assert.match(workItem, /admin|workspace|hub|contract|source|context/i);
  assert.match(roadmap, /WI-0858/i);
}

run();
console.log("e2e-wi0858-admin-workspace-hub-contract-source-context.test passed");
