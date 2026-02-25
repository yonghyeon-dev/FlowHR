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
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const adminPanels = readUtf8("src", "app", "admin", "page-panels.tsx");
  const dashboardActions = readUtf8("src", "app", "admin", "page-dashboard-actions.ts");
  const compensationPanels = readUtf8("src", "app", "admin", "page-compensation-panels.tsx");
  const workItem = readUtf8(
    "work-items",
    "WI-0412-admin-dashboard-actions-and-compensation-panels-extraction.md"
  );
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(
    adminPage,
    /import \{ buildAdminDashboardActions \} from "@\/app\/admin\/page-dashboard-actions";/
  );
  assert.match(adminPage, /import \{ AdminDashboardPanels \} from "@\/app\/admin\/page-panels";/);
  assert.match(adminPage, /const dashboardActions = buildAdminDashboardActions\(/);
  assert.match(adminPage, /<AdminDashboardPanels/);
  assert.match(
    adminPanels,
    /import \{ AdminCompensationPanels \} from "@\/app\/admin\/page-compensation-panels";/
  );
  assert.match(adminPanels, /onRefreshInbox=\{\(\) => void dashboardActions\.refreshInbox\(\)\}/);
  assert.match(adminPanels, /onLoadLeavePolicy=\{\(\) => void dashboardActions\.loadLeavePolicy\(\)\}/);
  assert.match(adminPanels, /onPreviewPayroll=\{\(\) => void dashboardActions\.previewPayroll\(\)\}/);
  assert.match(adminPanels, /onClearLogs=\{dashboardActions\.clearLogs\}/);

  assert.doesNotMatch(adminPage, /const refreshInbox = useCallback\(/);
  assert.doesNotMatch(adminPage, /const previewPayroll = useCallback\(/);
  assert.doesNotMatch(adminPage, /const confirmPayroll = useCallback\(/);
  assert.doesNotMatch(adminPage, /const listAttendanceAggregates = useCallback\(/);

  assert.match(dashboardActions, /export type BuildAdminDashboardActionsInput = \{/);
  assert.match(dashboardActions, /export function buildAdminDashboardActions\(/);
  assert.match(dashboardActions, /async function refreshInbox\(\)/);
  assert.match(dashboardActions, /async function previewPayroll\(\)/);
  assert.match(dashboardActions, /async function confirmPayroll\(runId: string\)/);
  assert.match(dashboardActions, /function clearLogs\(\)/);
  assert.match(dashboardActions, /return \{/);

  assert.match(compensationPanels, /export function AdminCompensationPanels\(/);
  assert.match(compensationPanels, /<AdminAggregateLeavePanels/);
  assert.match(compensationPanels, /<AdminPayrollPanel/);
  assert.match(compensationPanels, /<AdminDebugLogsPanel/);
  assert.match(compensationPanels, /logStatusLabels: \{\s*success: string;\s*fail: string;\s*\}/);

  assert.ok(
    countLines(adminPage) < 800,
    `admin/page.tsx must stay under 800 lines after extraction (current: ${countLines(adminPage)})`
  );
  assert.ok(
    countLines(adminPanels) <= 350,
    `page-panels.tsx must stay <= 350 lines (current: ${countLines(adminPanels)})`
  );
  assert.ok(
    countLines(dashboardActions) <= 400,
    `page-dashboard-actions.ts must stay <= 400 lines (current: ${countLines(dashboardActions)})`
  );
  assert.ok(
    countLines(compensationPanels) <= 250,
    `page-compensation-panels.tsx must stay <= 250 lines (current: ${countLines(compensationPanels)})`
  );

  assert.match(workItem, /WI-0412/i);
  assert.match(workItem, /admin|dashboard|actions|compensation|extraction/i);
  assert.match(roadmap, /WI-0412/i);
}

run()
  .then(() => {
    console.log("e2e-wi0412-admin-dashboard-action-compensation-panel-extraction.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
