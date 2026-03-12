import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const wi = readUtf8("work-items", "WI-1155-route-first-workspace-visual-wave-fourteen.md");
  const reportsPage = readUtf8("src", "app", "admin", "reports", "page.tsx");
  const auditLogsPage = readUtf8("src", "app", "admin", "audit-logs", "page.tsx");
  const progress = readUtf8("docs", "production-operating-progress.md");

  assert.match(wi, /WI-1155/);

  assert.match(reportsPage, /RouteWorkspaceShell/);
  assert.match(reportsPage, /RouteWorkspaceHeader/);
  assert.match(reportsPage, /RouteWorkspaceSummary/);
  assert.match(reportsPage, /RouteWorkspaceSplit/);
  assert.match(reportsPage, /RouteWorkspaceEmptyState/);

  assert.match(auditLogsPage, /workspace-shell admin-workspace-shell/);
  assert.match(auditLogsPage, /workspace-page-header/);
  assert.match(auditLogsPage, /workspace-summary-strip/);
  assert.match(auditLogsPage, /workspace-source-banner/);
  assert.match(auditLogsPage, /href="\/admin"/);

  assert.match(progress, /Started `WI-1155`/);
}

run();
console.log("e2e-wi1155-route-first-workspace-visual-wave-fourteen.test passed");
