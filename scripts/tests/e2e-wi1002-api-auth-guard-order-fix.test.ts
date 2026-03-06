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

function actorHeaders(role: string, actorId: string, organizationId?: string) {
  return {
    "content-type": "application/json",
    "x-actor-role": role,
    "x-actor-id": actorId,
    ...(organizationId ? { "x-actor-organization-id": organizationId } : {})
  };
}

async function run() {
  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const attendanceRecordsRoute = await import("../../src/app/api/attendance/records/route.ts");
  const attendanceAggregatesRoute = await import("../../src/app/api/attendance/aggregates/route.ts");
  const leaveRequestsRoute = await import("../../src/app/api/leave/requests/route.ts");
  const leaveCalendarRoute = await import("../../src/app/api/leave/calendar/route.ts");
  const payrollRunsRoute = await import("../../src/app/api/payroll/runs/route.ts");
  const payrollPreviewRoute = await import("../../src/app/api/payroll/preview/route.ts");
  const schedulingSchedulesRoute = await import("../../src/app/api/scheduling/schedules/route.ts");
  const schedulingAnomaliesRoute = await import("../../src/app/api/scheduling/anomalies/route.ts");

  resetMemoryDataAccess();

  const organization = await memoryDataAccess.organizations.create({ name: "WI-1002 Org" });
  const employeeId = "EMP-WI1002-1001";
  await memoryDataAccess.employees.create({ id: employeeId, organizationId: organization.id });

  const employeeRequestHeaders = actorHeaders("employee", employeeId, organization.id);

  const unauthenticatedResponses = await Promise.all([
    attendanceRecordsRoute.GET(new Request("http://localhost/api/attendance/records", { method: "GET" })),
    attendanceAggregatesRoute.GET(new Request("http://localhost/api/attendance/aggregates", { method: "GET" })),
    leaveRequestsRoute.GET(new Request("http://localhost/api/leave/requests", { method: "GET" })),
    leaveCalendarRoute.GET(new Request("http://localhost/api/leave/calendar", { method: "GET" })),
    payrollRunsRoute.GET(new Request("http://localhost/api/payroll/runs", { method: "GET" })),
    payrollPreviewRoute.POST(
      new Request("http://localhost/api/payroll/preview", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: ""
      })
    ),
    schedulingSchedulesRoute.GET(new Request("http://localhost/api/scheduling/schedules", { method: "GET" })),
    schedulingAnomaliesRoute.GET(new Request("http://localhost/api/scheduling/anomalies", { method: "GET" }))
  ]);

  for (const [index, response] of unauthenticatedResponses.entries()) {
    assert.equal(response.status, 401, `unauthenticated case #${index + 1} should return 401`);
  }

  const authenticatedResponses = await Promise.all([
    attendanceRecordsRoute.GET(
      new Request("http://localhost/api/attendance/records", {
        method: "GET",
        headers: employeeRequestHeaders
      })
    ),
    attendanceAggregatesRoute.GET(
      new Request("http://localhost/api/attendance/aggregates", {
        method: "GET",
        headers: employeeRequestHeaders
      })
    ),
    leaveRequestsRoute.GET(
      new Request("http://localhost/api/leave/requests", {
        method: "GET",
        headers: employeeRequestHeaders
      })
    ),
    leaveCalendarRoute.GET(
      new Request("http://localhost/api/leave/calendar", {
        method: "GET",
        headers: employeeRequestHeaders
      })
    ),
    payrollRunsRoute.GET(
      new Request("http://localhost/api/payroll/runs", {
        method: "GET",
        headers: employeeRequestHeaders
      })
    ),
    payrollPreviewRoute.POST(
      new Request("http://localhost/api/payroll/preview", {
        method: "POST",
        headers: employeeRequestHeaders,
        body: ""
      })
    ),
    schedulingSchedulesRoute.GET(
      new Request("http://localhost/api/scheduling/schedules", {
        method: "GET",
        headers: employeeRequestHeaders
      })
    ),
    schedulingAnomaliesRoute.GET(
      new Request("http://localhost/api/scheduling/anomalies", {
        method: "GET",
        headers: employeeRequestHeaders
      })
    )
  ]);

  for (const [index, response] of authenticatedResponses.entries()) {
    assert.equal(response.status, 400, `authenticated invalid-input case #${index + 1} should return 400`);
  }
}

run()
  .then(() => {
    console.log("e2e-wi1002-api-auth-guard-order-fix.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
