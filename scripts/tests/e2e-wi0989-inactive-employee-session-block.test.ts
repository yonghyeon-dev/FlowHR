import assert from "node:assert/strict";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "memory";
runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
runtimeEnv.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.DIRECT_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.FLOWHR_EVENT_PUBLISHER = "memory";

function actorHeaders(role: string, actorId: string, organizationId: string) {
  return {
    "content-type": "application/json",
    "x-actor-role": role,
    "x-actor-id": actorId,
    "x-actor-organization-id": organizationId
  };
}

async function run() {
  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const { clearEmployeeStatusValidationCacheForTests } = await import(
    "../../src/lib/auth/validate-employee.ts"
  );
  const attendanceRecordsRoute = await import("../../src/app/api/attendance/records/route.ts");
  const leaveRequestsRoute = await import("../../src/app/api/leave/requests/route.ts");
  const payrollRunsRoute = await import("../../src/app/api/payroll/runs/route.ts");

  resetMemoryDataAccess();
  clearEmployeeStatusValidationCacheForTests();

  const organization = await memoryDataAccess.organizations.create({ name: "WI-0989 Org" });
  const activeEmployeeId = "EMP-WI0989-ACTIVE";
  const inactiveEmployeeId = "EMP-WI0989-INACTIVE";

  await memoryDataAccess.employees.create({
    id: activeEmployeeId,
    organizationId: organization.id,
    status: "ACTIVE"
  });
  await memoryDataAccess.employees.create({
    id: inactiveEmployeeId,
    organizationId: organization.id,
    status: "RESIGNED"
  });

  const periodFrom = "2026-03-01T00:00:00+09:00";
  const periodTo = "2026-03-31T23:59:59+09:00";

  const activeHeaders = actorHeaders("employee", activeEmployeeId, organization.id);
  const inactiveHeaders = actorHeaders("employee", inactiveEmployeeId, organization.id);

  const activeResponses = await Promise.all([
    attendanceRecordsRoute.GET(
      new Request(`http://localhost/api/attendance/records?from=${periodFrom}&to=${periodTo}`, {
        method: "GET",
        headers: activeHeaders
      })
    ),
    leaveRequestsRoute.GET(
      new Request(`http://localhost/api/leave/requests?from=${periodFrom}&to=${periodTo}`, {
        method: "GET",
        headers: activeHeaders
      })
    ),
    payrollRunsRoute.GET(
      new Request(
        `http://localhost/api/payroll/runs?from=${periodFrom}&to=${periodTo}&employeeId=${activeEmployeeId}`,
        {
          method: "GET",
          headers: activeHeaders
        }
      )
    )
  ]);

  assert.equal(activeResponses[0].status, 200, "active employee should access attendance API");
  assert.equal(activeResponses[1].status, 200, "active employee should access leave API");
  assert.equal(activeResponses[2].status, 200, "active employee should access payroll API");

  const inactiveResponses = await Promise.all([
    attendanceRecordsRoute.GET(
      new Request(`http://localhost/api/attendance/records?from=${periodFrom}&to=${periodTo}`, {
        method: "GET",
        headers: inactiveHeaders
      })
    ),
    leaveRequestsRoute.GET(
      new Request(`http://localhost/api/leave/requests?from=${periodFrom}&to=${periodTo}`, {
        method: "GET",
        headers: inactiveHeaders
      })
    ),
    payrollRunsRoute.GET(
      new Request(
        `http://localhost/api/payroll/runs?from=${periodFrom}&to=${periodTo}&employeeId=${inactiveEmployeeId}`,
        {
          method: "GET",
          headers: inactiveHeaders
        }
      )
    )
  ]);

  assert.equal(inactiveResponses[0].status, 401, "inactive employee should be blocked from attendance API");
  assert.equal(inactiveResponses[1].status, 401, "inactive employee should be blocked from leave API");
  assert.equal(inactiveResponses[2].status, 401, "inactive employee should be blocked from payroll API");
}

run()
  .then(() => {
    console.log("e2e-wi0989-inactive-employee-session-block.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

