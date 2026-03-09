import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminLayout = readUtf8("src", "app", "admin", "layout.tsx");
  const workspaceHubs = readUtf8("src", "app", "admin", "page-workspace-hubs.ts");
  const page = readUtf8("src", "app", "admin", "operator-alerts", "page.tsx");
  const route = readUtf8("src", "app", "api", "admin", "operator-alerts", "route.ts");
  const helper = readUtf8("src", "features", "people", "operator-alert-settings.ts");
  const approvalService = readUtf8("src", "features", "approval", "service.ts");
  const leaveService = readUtf8("src", "features", "leave", "helpers", "promotion-service-helpers.ts");
  const peopleContract = readUtf8("specs", "people", "contract.yaml");
  const peopleApi = readUtf8("specs", "people", "api.yaml");
  const workItem = readUtf8("work-items", "WI-1055-admin-operational-settings-productization.md");
  const progress = readUtf8("docs", "production-operating-progress.md");
  const migrationPath = join(
    process.cwd(),
    "prisma",
    "migrations",
    "202603090004_wi1055_operator_alert_webhook_productization",
    "migration.sql"
  );

  assert.ok(existsSync(join(process.cwd(), "src", "app", "admin", "operator-alerts", "page.tsx")));
  assert.ok(existsSync(join(process.cwd(), "src", "app", "api", "admin", "operator-alerts", "route.ts")));
  assert.ok(existsSync(migrationPath), "operator alert webhook migration must exist");

  assert.match(adminLayout, /href: "\/admin\/operator-alerts"/);
  assert.match(workspaceHubs, /href: "\/admin\/operator-alerts"/);
  assert.match(page, /path: "\/api\/admin\/operator-alerts"/);
  assert.match(route, /approvalEscalation/);
  assert.match(route, /leavePromotion/);
  assert.match(helper, /resolveOperatorAlertWebhookConfig/);
  assert.match(helper, /operatorAlertWebhookUrl/);
  assert.match(approvalService, /resolveOperatorAlertWebhookConfig/);
  assert.match(leaveService, /resolveOperatorAlertWebhookConfig/);
  assert.match(peopleContract, /operator alert webhook fallback settings/i);
  assert.match(peopleContract, /202603090004_wi1055_operator_alert_webhook_productization/);
  assert.match(peopleApi, /\/admin\/operator-alerts/);
  assert.match(workItem, /operator alert webhook fallback settings/i);
  assert.match(progress, /operator alert webhook/i);
}

run()
  .then(() => {
    console.log("e2e-wi1055-operator-alert-webhook-settings.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
