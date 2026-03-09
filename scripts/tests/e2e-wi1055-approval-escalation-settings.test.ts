import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminLayout = readUtf8("src", "app", "admin", "layout.tsx");
  const workspaceHubs = readUtf8("src", "app", "admin", "page-workspace-hubs.ts");
  const page = readUtf8("src", "app", "admin", "approval-escalation-settings", "page.tsx");
  const route = readUtf8("src", "app", "api", "admin", "approval-escalation-settings", "route.ts");
  const helper = readUtf8("src", "features", "approval", "escalation-settings.ts");
  const pageSurface = readUtf8("src", "app", "admin", "approval-executions", "page.tsx");
  const approvalService = readUtf8("src", "features", "approval", "service.ts");
  const approvalInputHelper = readUtf8("src", "features", "approval", "execution-escalation-input-helpers.ts");
  const approvalContract = readUtf8("specs", "approval", "contract.yaml");
  const approvalApi = readUtf8("specs", "approval", "api.yaml");
  const approvalCases = readUtf8("specs", "approval", "test-cases.md");
  const workItem = readUtf8("work-items", "WI-1055-admin-operational-settings-productization.md");
  const progress = readUtf8("docs", "production-operating-progress.md");
  const migrationPath = join(
    process.cwd(),
    "prisma",
    "migrations",
    "202603090006_wi1055_approval_escalation_settings_productization",
    "migration.sql"
  );

  assert.ok(existsSync(join(process.cwd(), "src", "app", "admin", "approval-escalation-settings", "page.tsx")));
  assert.ok(existsSync(join(process.cwd(), "src", "app", "api", "admin", "approval-escalation-settings", "route.ts")));
  assert.ok(existsSync(migrationPath), "approval escalation settings migration must exist");

  assert.match(adminLayout, /href: "\/admin\/approval-escalation-settings"/);
  assert.match(workspaceHubs, /href: "\/admin\/approval-escalation-settings"/);
  assert.match(page, /path: "\/api\/admin\/approval-escalation-settings"/);
  assert.match(route, /stalledHoursMin/);
  assert.match(route, /notificationChannel/);
  assert.match(helper, /DEFAULT_APPROVAL_ESCALATION_STALLED_HOURS_MIN/);
  assert.match(helper, /approvalEscalationDefaultNotificationChannel/);
  assert.match(pageSurface, /\/api\/admin\/approval-escalation-settings/);
  assert.match(approvalService, /resolveOrganizationApprovalEscalationSettings/);
  assert.match(approvalInputHelper, /DEFAULT_APPROVAL_ESCALATION_NOTIFICATION_CHANNEL/);
  assert.match(approvalContract, /approval escalation admin settings/i);
  assert.match(approvalContract, /202603090006_wi1055_approval_escalation_settings_productization/);
  assert.match(approvalApi, /\/admin\/approval-escalation-settings/);
  assert.match(approvalCases, /approval-escalation-settings/);
  assert.match(workItem, /approval escalation settings/i);
  assert.match(progress, /approval escalation settings/i);
}

run()
  .then(() => {
    console.log("e2e-wi1055-approval-escalation-settings.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
