import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminLayout = readUtf8("src", "app", "admin", "layout.tsx");
  const workspaceHubs = readUtf8("src", "app", "admin", "page-workspace-hubs.ts");
  const page = readUtf8("src", "app", "admin", "leave-promotion-email", "page.tsx");
  const route = readUtf8("src", "app", "api", "admin", "leave-promotion-email-settings", "route.ts");
  const helper = readUtf8("src", "features", "leave", "promotion-email-settings.ts");
  const deliveryHelpers = readUtf8("src", "features", "leave", "promotion-delivery-helpers.ts");
  const service = readUtf8("src", "features", "leave", "helpers", "promotion-service-helpers.ts");
  const leaveContract = readUtf8("specs", "leave", "contract.yaml");
  const leaveApi = readUtf8("specs", "leave", "api.yaml");
  const leaveCases = readUtf8("specs", "leave", "test-cases.md");
  const workItem = readUtf8("work-items", "WI-1055-admin-operational-settings-productization.md");
  const progress = readUtf8("docs", "production-operating-progress.md");
  const migrationPath = join(
    process.cwd(),
    "prisma",
    "migrations",
    "202603090005_wi1055_leave_promotion_email_settings_productization",
    "migration.sql"
  );

  assert.ok(existsSync(join(process.cwd(), "src", "app", "admin", "leave-promotion-email", "page.tsx")));
  assert.ok(existsSync(join(process.cwd(), "src", "app", "api", "admin", "leave-promotion-email-settings", "route.ts")));
  assert.ok(existsSync(migrationPath), "leave promotion email settings migration must exist");

  assert.match(adminLayout, /href: "\/admin\/leave-promotion-email"/);
  assert.match(workspaceHubs, /href: "\/admin\/leave-promotion-email"/);
  assert.match(page, /path: "\/api\/admin\/leave-promotion-email-settings"/);
  assert.match(route, /defaultTemplateId/);
  assert.match(route, /clearToken/);
  assert.match(helper, /resolveOrganizationPromotionEmailTemplateOverride/);
  assert.match(helper, /leavePromotionEmailTemplateToken/);
  assert.match(deliveryHelpers, /defaultTemplateId/);
  assert.match(service, /admin leave promotion email settings/);
  assert.match(leaveContract, /organization-level leave promotion email template settings/i);
  assert.match(leaveContract, /202603090005_wi1055_leave_promotion_email_settings_productization/);
  assert.match(leaveApi, /\/admin\/leave-promotion-email-settings/);
  assert.match(leaveCases, /\/admin\/leave-promotion-email-settings/);
  assert.match(workItem, /leave promotion email template settings/i);
  assert.match(progress, /leave promotion email/i);
}

run()
  .then(() => {
    console.log("e2e-wi1055-leave-promotion-email-settings.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
