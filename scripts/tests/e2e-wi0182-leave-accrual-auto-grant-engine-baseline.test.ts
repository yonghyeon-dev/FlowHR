import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "memory";
runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
runtimeEnv.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.DIRECT_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.FLOWHR_EVENT_PUBLISHER = "memory";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

function actorHeaders(role: string, actorId: string, organizationId?: string) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-actor-role": role,
    "x-actor-id": actorId
  };
  if (organizationId) {
    headers["x-actor-organization-id"] = organizationId;
  }
  return headers;
}

function jsonRequest(method: string, pathValue: string, payload: unknown, headers: Record<string, string>) {
  return new Request(`http://localhost${pathValue}`, {
    method,
    headers,
    body: JSON.stringify(payload)
  });
}

async function readJson<T>(response: Response) {
  return (await response.json()) as T;
}

async function run() {
  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );

  const leavePolicyRoute = await import("../../src/app/api/leave/policy/route.ts");
  const autoGrantRoute = await import("../../src/app/api/leave/accrual/auto-grant/route.ts");

  resetMemoryDataAccess();

  const adminLayoutSource = readUtf8("src", "app", "admin", "layout.tsx");
  const leaveAccrualPageSource = readUtf8("src", "app", "admin", "leave-accrual", "page.tsx");
  const leaveAccrualConsoleSource = readUtf8(
    "src",
    "components",
    "leave-accrual",
    "LeaveAccrualAutoGrantConsole.tsx"
  );
  const leaveApiSpec = readUtf8("specs", "leave", "api.yaml");
  const leaveContract = readUtf8("specs", "leave", "contract.yaml");

  assert.match(adminLayoutSource, /\/admin\/leave-accrual/, "admin navigation should include leave accrual route");
  assert.match(
    leaveAccrualPageSource,
    /LeaveAccrualAutoGrantConsole/,
    "admin leave accrual page should render the dedicated console"
  );
  assert.match(
    leaveAccrualConsoleSource,
    /연차 자동 부여 엔진/,
    "leave accrual console should include clear heading text"
  );
  assert.match(
    leaveApiSpec,
    /\/leave\/accrual\/auto-grant:/,
    "leave api spec should document auto-grant endpoint"
  );
  assert.match(
    leaveContract,
    /path: \/leave\/accrual\/auto-grant/,
    "leave contract should include auto-grant endpoint"
  );

  const organization = await memoryDataAccess.organizations.create({ name: "Org Auto Grant" });
  await memoryDataAccess.employees.create({
    id: "EMP-AG-1001",
    organizationId: organization.id,
    name: "Auto Grant 1"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-AG-1002",
    organizationId: organization.id,
    name: "Auto Grant 2"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-AG-INACTIVE",
    organizationId: organization.id,
    name: "Inactive",
    active: false
  });

  const policyResponse = await leavePolicyRoute.PUT(
    jsonRequest(
      "PUT",
      "/api/leave/policy",
      {
        organizationId: organization.id,
        annualGrantDays: 18,
        carryOverCapDays: 4
      },
      actorHeaders("payroll_operator", "PAY-1001")
    )
  );
  assert.equal(policyResponse.status, 200, "leave policy upsert should succeed");

  const currentYear = new Date().getUTCFullYear();
  const pastYear = currentYear - 1;
  const futureYear = currentYear + 1;

  const pastDryRunResponse = await autoGrantRoute.POST(
    jsonRequest(
      "POST",
      "/api/leave/accrual/auto-grant",
      {
        organizationId: organization.id,
        year: pastYear,
        dryRun: true
      },
      actorHeaders("admin", "ADM-1001")
    )
  );
  assert.equal(pastDryRunResponse.status, 200, "past-year dry-run should succeed");
  const pastDryRunBody = await readJson<{
    summary: { activeEmployeeCount: number; eligibleCount: number; notEligibleCount: number };
  }>(pastDryRunResponse);
  assert.equal(pastDryRunBody.summary.activeEmployeeCount, 2, "inactive employees should be excluded");
  assert.equal(pastDryRunBody.summary.eligibleCount, 0, "past-year run should not have eligible employees");
  assert.equal(pastDryRunBody.summary.notEligibleCount, 2, "past-year run should mark active employees as not eligible");

  const futureDryRunResponse = await autoGrantRoute.POST(
    jsonRequest(
      "POST",
      "/api/leave/accrual/auto-grant",
      {
        organizationId: organization.id,
        year: futureYear,
        dryRun: true
      },
      actorHeaders("admin", "ADM-1001")
    )
  );
  assert.equal(futureDryRunResponse.status, 200, "future-year dry-run should succeed");
  const futureDryRunBody = await readJson<{
    summary: { eligibleCount: number; appliedCount: number };
  }>(futureDryRunResponse);
  assert.equal(futureDryRunBody.summary.eligibleCount, 2, "future-year run should find eligible employees");
  assert.equal(futureDryRunBody.summary.appliedCount, 0, "dry-run should not apply settlements");

  const balanceBeforeApply = await memoryDataAccess.leaveBalance.ensure("EMP-AG-1001", 15);
  assert.equal(balanceBeforeApply.lastAccrualYear, null, "dry-run must not mutate accrual year");

  const applyResponse = await autoGrantRoute.POST(
    jsonRequest(
      "POST",
      "/api/leave/accrual/auto-grant",
      {
        organizationId: organization.id,
        year: futureYear,
        dryRun: false
      },
      actorHeaders("payroll_operator", "PAY-1001")
    )
  );
  assert.equal(applyResponse.status, 200, "apply run should succeed");
  const applyBody = await readJson<{
    summary: { eligibleCount: number; appliedCount: number; failedCount: number };
    results: Array<{ employeeId: string; status: string }>;
  }>(applyResponse);
  assert.equal(applyBody.summary.eligibleCount, 2, "apply run should keep eligible count");
  assert.equal(applyBody.summary.appliedCount, 2, "apply run should settle all eligible employees");
  assert.equal(applyBody.summary.failedCount, 0, "apply run should not fail for seeded employees");
  assert.ok(
    applyBody.results.every((item) => item.status === "APPLIED"),
    "apply run should mark processed rows as APPLIED"
  );

  const balanceAfterApply = await memoryDataAccess.leaveBalance.ensure("EMP-AG-1001", 15);
  assert.equal(
    balanceAfterApply.lastAccrualYear,
    futureYear,
    "apply run should mutate target employee accrual year"
  );

  const rerunDryResponse = await autoGrantRoute.POST(
    jsonRequest(
      "POST",
      "/api/leave/accrual/auto-grant",
      {
        organizationId: organization.id,
        year: futureYear,
        dryRun: true
      },
      actorHeaders("admin", "ADM-1001")
    )
  );
  assert.equal(rerunDryResponse.status, 200, "rerun dry-run should succeed");
  const rerunDryBody = await readJson<{
    summary: { eligibleCount: number; alreadySettledCount: number };
  }>(rerunDryResponse);
  assert.equal(rerunDryBody.summary.eligibleCount, 0, "already-settled year should not stay eligible");
  assert.equal(rerunDryBody.summary.alreadySettledCount, 2, "already-settled employees should be counted");

  const unauthorizedResponse = await autoGrantRoute.POST(
    jsonRequest(
      "POST",
      "/api/leave/accrual/auto-grant",
      {
        organizationId: organization.id,
        year: futureYear,
        dryRun: true
      },
      actorHeaders("employee", "EMP-AG-1001")
    )
  );
  assert.equal(unauthorizedResponse.status, 403, "employee role should not run auto-grant");
}

run()
  .then(() => {
    console.log("e2e-wi0182-leave-accrual-auto-grant-engine-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
