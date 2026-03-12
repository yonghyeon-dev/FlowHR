import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function run() {
  const workItem = readUtf8("work-items", "WI-1173-shared-workspace-primitives-and-visual-contract.md");
  const primitives = readUtf8("src", "components", "workspace", "RouteWorkspacePrimitives.tsx");
  const requestsWorkspace = readUtf8("src", "app", "employee", "requests", "workspace-content.tsx");
  const reportsPage = readUtf8("src", "app", "admin", "reports", "page.tsx");
  const globalsCss = readUtf8("src", "app", "globals.css");
  const progress = readUtf8("docs", "production-operating-progress.md");

  assert.match(workItem, /WI-1173/);
  assert.match(workItem, /공통 워크스페이스 프리미티브/);

  assert.match(primitives, /export function RouteWorkspaceShell/);
  assert.match(primitives, /export function RouteWorkspaceHeader/);
  assert.match(primitives, /export function RouteWorkspaceTabs/);
  assert.match(primitives, /export function RouteWorkspaceSummary/);
  assert.match(primitives, /export function RouteWorkspaceSplit/);
  assert.match(primitives, /export function RouteWorkspaceSectionCard/);
  assert.match(primitives, /export function RouteWorkspaceEmptyState/);
  assert.match(primitives, /export function RouteWorkspaceStatus/);

  assert.match(requestsWorkspace, /RouteWorkspaceShell/);
  assert.match(requestsWorkspace, /RouteWorkspaceHeader/);
  assert.match(requestsWorkspace, /RouteWorkspaceTabs/);
  assert.match(requestsWorkspace, /RouteWorkspaceSectionCard/);
  assert.match(requestsWorkspace, /v2-requests-shell/);
  assert.match(requestsWorkspace, /id: "attendance-actions"/);
  assert.match(requestsWorkspace, /id: "leave-actions"/);

  assert.match(reportsPage, /RouteWorkspaceShell/);
  assert.match(reportsPage, /RouteWorkspaceHeader/);
  assert.match(reportsPage, /RouteWorkspaceTabs/);
  assert.match(reportsPage, /RouteWorkspaceSummary/);
  assert.match(reportsPage, /RouteWorkspaceSplit/);
  assert.match(reportsPage, /RouteWorkspaceEmptyState/);

  assert.match(globalsCss, /\.v2-workspace-split \{/);
  assert.match(globalsCss, /\.v2-workspace-feedback \{/);
  assert.match(globalsCss, /\.v2-workspace-empty \{/);

  assert.match(progress, /Started `WI-1173`/);
}

run();
console.log("e2e-wi1173-shared-workspace-primitives-and-visual-contract.test passed");
