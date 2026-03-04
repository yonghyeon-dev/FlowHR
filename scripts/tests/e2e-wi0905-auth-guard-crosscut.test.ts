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

type JsonPayload = Record<string, unknown>;

function actorHeaders(role: string, actorId: string, organizationId?: string) {
  return {
    "content-type": "application/json",
    "x-actor-role": role,
    "x-actor-id": actorId,
    ...(organizationId ? { "x-actor-organization-id": organizationId } : {})
  };
}

function jsonRequest(method: string, path: string, payload: JsonPayload, headers: Record<string, string>) {
  return new Request(`http://localhost${path}`, {
    method,
    headers,
    body: JSON.stringify(payload)
  });
}

function assertUnauthorizedOrForbidden(status: number, label: string) {
  assert.ok(
    status === 401 || status === 403,
    `${label} should reject unauthenticated request with 401/403 (received ${status})`
  );
}

async function run() {
  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const attendanceRecordsRoute = await import("../../src/app/api/attendance/records/route.ts");
  const leaveRequestsRoute = await import("../../src/app/api/leave/requests/route.ts");
  const payrollRunsRoute = await import("../../src/app/api/payroll/runs/route.ts");
  const payrollPreviewRoute = await import("../../src/app/api/payroll/runs/preview/route.ts");
  const peopleEmployeesRoute = await import("../../src/app/api/people/employees/route.ts");
  const schedulingSchedulesRoute = await import("../../src/app/api/scheduling/schedules/route.ts");

  resetMemoryDataAccess();

  const organization = await memoryDataAccess.organizations.create({ name: "WI-0905 Org" });
  const employeeId = "EMP-WI0905-1001";
  await memoryDataAccess.employees.create({ id: employeeId, organizationId: organization.id });

  const employeeHeaders = actorHeaders("employee", employeeId, organization.id);
  const listFrom = "2026-03-01T00:00:00+09:00";
  const listTo = "2026-03-31T23:59:59+09:00";

  const unauthenticatedGetResponses = await Promise.all([
    attendanceRecordsRoute.GET(
      new Request(`http://localhost/api/attendance/records?from=${listFrom}&to=${listTo}`, { method: "GET" })
    ),
    leaveRequestsRoute.GET(
      new Request(`http://localhost/api/leave/requests?from=${listFrom}&to=${listTo}`, { method: "GET" })
    ),
    payrollRunsRoute.GET(
      new Request(
        `http://localhost/api/payroll/runs?from=${listFrom}&to=${listTo}&employeeId=${employeeId}`,
        { method: "GET" }
      )
    ),
    peopleEmployeesRoute.GET(new Request("http://localhost/api/people/employees", { method: "GET" })),
    schedulingSchedulesRoute.GET(
      new Request(`http://localhost/api/scheduling/schedules?from=${listFrom}&to=${listTo}`, { method: "GET" })
    )
  ]);

  assertUnauthorizedOrForbidden(unauthenticatedGetResponses[0].status, "GET /api/attendance/records");
  assertUnauthorizedOrForbidden(unauthenticatedGetResponses[1].status, "GET /api/leave/requests");
  assertUnauthorizedOrForbidden(unauthenticatedGetResponses[2].status, "GET /api/payroll/runs");
  assertUnauthorizedOrForbidden(unauthenticatedGetResponses[3].status, "GET /api/people/employees");
  assertUnauthorizedOrForbidden(unauthenticatedGetResponses[4].status, "GET /api/scheduling/schedules");

  const authenticatedGetResponses = await Promise.all([
    attendanceRecordsRoute.GET(
      new Request(`http://localhost/api/attendance/records?from=${listFrom}&to=${listTo}`, {
        method: "GET",
        headers: employeeHeaders
      })
    ),
    leaveRequestsRoute.GET(
      new Request(`http://localhost/api/leave/requests?from=${listFrom}&to=${listTo}`, {
        method: "GET",
        headers: employeeHeaders
      })
    ),
    payrollRunsRoute.GET(
      new Request(
        `http://localhost/api/payroll/runs?from=${listFrom}&to=${listTo}&employeeId=${employeeId}`,
        {
          method: "GET",
          headers: employeeHeaders
        }
      )
    ),
    schedulingSchedulesRoute.GET(
      new Request(`http://localhost/api/scheduling/schedules?from=${listFrom}&to=${listTo}`, {
        method: "GET",
        headers: employeeHeaders
      })
    )
  ]);

  assert.equal(authenticatedGetResponses[0].status, 200, "employee GET /api/attendance/records should succeed");
  assert.equal(authenticatedGetResponses[1].status, 200, "employee GET /api/leave/requests should succeed");
  assert.equal(authenticatedGetResponses[2].status, 200, "employee GET /api/payroll/runs should succeed");
  assert.equal(authenticatedGetResponses[3].status, 200, "employee GET /api/scheduling/schedules should succeed");

  const payrollPreviewDeniedResponse = await payrollPreviewRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview",
      {
        periodStart: listFrom,
        periodEnd: listTo,
        employeeId,
        hourlyRateKrw: 12000
      },
      employeeHeaders
    )
  );
  assert.equal(
    payrollPreviewDeniedResponse.status,
    403,
    "employee POST /api/payroll/runs/preview should be forbidden"
  );

  const peopleListDeniedResponse = await peopleEmployeesRoute.GET(
    new Request("http://localhost/api/people/employees", { method: "GET", headers: employeeHeaders })
  );
  assert.equal(peopleListDeniedResponse.status, 403, "employee GET /api/people/employees should be forbidden");

  const peopleCreateDeniedResponse = await peopleEmployeesRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/employees",
      {
        id: "EMP-WI0905-NEW",
        organizationId: organization.id,
        name: "WI-0905 New Employee",
        email: "wi0905.new.employee@flowhr.local"
      },
      employeeHeaders
    )
  );
  assert.equal(peopleCreateDeniedResponse.status, 403, "employee POST /api/people/employees should be forbidden");
}

run()
  .then(() => {
    console.log("e2e-wi0905-auth-guard-crosscut.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
