import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminNavigation = readUtf8("src", "app", "admin", "admin-shell-navigation.ts");
  const workspaceHubs = readUtf8("src", "app", "admin", "page-workspace-hubs.ts");
  const adminPage = readUtf8("src", "app", "admin", "notification-defaults", "page.tsx");
  const employeePage = readUtf8("src", "app", "employee", "notifications", "settings", "page.tsx");
  const adminRoute = readUtf8("src", "app", "api", "admin", "notification-defaults", "route.ts");
  const employeeRoute = readUtf8("src", "app", "api", "employee", "notification-preferences", "route.ts");
  const helper = readUtf8("src", "features", "people", "notification-preferences.ts");
  const peopleContract = readUtf8("specs", "people", "contract.yaml");
  const peopleApi = readUtf8("specs", "people", "api.yaml");
  const workItem = readUtf8("work-items", "WI-1055-admin-operational-settings-productization.md");
  const progress = readUtf8("docs", "production-operating-progress.md");
  const migrationPath = join(
    process.cwd(),
    "prisma",
    "migrations",
    "202603090003_wi1055_notification_durability_productization",
    "migration.sql"
  );

  assert.ok(existsSync(join(process.cwd(), "src", "app", "admin", "notification-defaults", "page.tsx")));
  assert.ok(
    existsSync(join(process.cwd(), "src", "app", "api", "admin", "notification-defaults", "route.ts"))
  );
  assert.ok(
    existsSync(join(process.cwd(), "src", "app", "api", "employee", "notification-preferences", "route.ts"))
  );
  assert.ok(existsSync(migrationPath), "notification durability migration must exist");

  assert.match(adminNavigation, /href: "\/admin\/notification-defaults"/);
  assert.match(workspaceHubs, /href: "\/admin\/notification-defaults"/);
  assert.match(adminPage, /path: "\/api\/admin\/notification-defaults"/);
  assert.match(employeePage, /path: "\/api\/employee\/notification-preferences"/);
  assert.match(adminRoute, /toOrganizationNotificationDefaultUpdateInput/);
  assert.match(employeeRoute, /resetToDefaults/);
  assert.match(helper, /notificationDefaultEmailEnabled/);
  assert.match(helper, /notificationEmailEnabled/);
  assert.match(peopleContract, /notification defaults/i);
  assert.match(peopleContract, /202603090003_wi1055_notification_durability_productization/);
  assert.match(peopleApi, /\/admin\/notification-defaults/);
  assert.match(peopleApi, /\/employee\/notification-preferences/);
  assert.match(workItem, /Durable employee notification preference strategy with admin defaults/i);
  assert.match(progress, /notification durability/i);
}

run()
  .then(() => {
    console.log("e2e-wi1055-notification-durability-productization.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
