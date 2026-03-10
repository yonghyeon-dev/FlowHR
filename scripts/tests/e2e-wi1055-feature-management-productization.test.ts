import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const adminNavigation = readUtf8("src", "app", "admin", "admin-shell-navigation.ts");
  const workspaceHubs = readUtf8("src", "app", "admin", "page-workspace-hubs.ts");
  const messages = readUtf8("src", "lib", "i18n", "messages.ts");
  const page = readUtf8("src", "app", "admin", "feature-management", "page.tsx");
  const route = readUtf8("src", "app", "api", "admin", "feature-management", "route.ts");
  const helper = readUtf8("src", "features", "payroll", "feature-management-settings.ts");
  const runtimeHelpers = readUtf8("src", "features", "payroll", "service-runtime-helpers.ts");
  const serviceFeatureFlags = readUtf8("src", "features", "payroll", "service-feature-flags.ts");
  const service = readUtf8("src", "features", "payroll", "service.ts");
  const payrollContract = readUtf8("specs", "payroll", "contract.yaml");
  const payrollApi = readUtf8("specs", "payroll", "api.yaml");
  const payrollCases = readUtf8("specs", "payroll", "test-cases.md");
  const workItem = readUtf8("work-items", "WI-1055-admin-operational-settings-productization.md");
  const progress = readUtf8("docs", "production-operating-progress.md");
  const packageJson = readUtf8("package.json");
  const migrationPath = join(
    process.cwd(),
    "prisma",
    "migrations",
    "202603090007_wi1055_feature_management_productization",
    "migration.sql"
  );

  assert.ok(existsSync(join(process.cwd(), "src", "app", "admin", "feature-management", "page.tsx")));
  assert.ok(existsSync(join(process.cwd(), "src", "app", "api", "admin", "feature-management", "route.ts")));
  assert.ok(existsSync(migrationPath), "feature management migration must exist");

  assert.match(adminNavigation, /href: "\/admin\/feature-management"/);
  assert.match(workspaceHubs, /href: "\/admin\/feature-management"/);
  assert.match(messages, /admin\.nav\.featureManagement/);
  assert.match(page, /path: "\/api\/admin\/feature-management"/);
  assert.match(page, /Ops 전용 제어|Ops-only controls/);
  assert.match(route, /admin\.feature_management/);
  assert.match(helper, /payrollFeatureYearEndFilingSubmissionEnabled/);
  assert.match(helper, /resolveOrganizationPayrollFeatureManagementSettings/);
  assert.match(runtimeHelpers, /flags\?: PayrollRuntimeFeatureFlags/);
  assert.match(serviceFeatureFlags, /resolvePayrollRuntimeFeatureFlags/);
  assert.match(service, /loadPayrollRuntimeFeatureFlags/);
  assert.match(payrollContract, /admin-managed organization payroll feature overrides/i);
  assert.match(payrollContract, /202603090007_wi1055_feature_management_productization/);
  assert.match(payrollApi, /\/admin\/feature-management/);
  assert.match(payrollCases, /^85\. Admin feature management/m);
  assert.match(workItem, /Seventh execution slice productizes organization-level payroll feature management/i);
  assert.match(progress, /feature management slice/i);
  assert.match(packageJson, /e2e-wi1055-feature-management-productization\.test\.ts/);
}

run()
  .then(() => {
    console.log("e2e-wi1055-feature-management-productization.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
