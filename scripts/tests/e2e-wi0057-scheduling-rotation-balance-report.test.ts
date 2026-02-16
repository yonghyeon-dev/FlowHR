import assert from "node:assert/strict";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "memory";
runtimeEnv.FLOWHR_EVENT_PUBLISHER = "memory";
runtimeEnv.FLOWHR_TENANCY_V1 = "true";
runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
runtimeEnv.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.DIRECT_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";

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

async function readJson<T>(response: Response) {
  return (await response.json()) as T;
}

async function createSchedule(
  scheduleRoute: typeof import("../../src/app/api/scheduling/schedules/route.ts"),
  employeeId: string,
  startAt: string,
  endAt: string,
  headers: Record<string, string>
) {
  const response = await scheduleRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/schedules",
      {
        employeeId,
        startAt,
        endAt,
        breakMinutes: 60,
        isHoliday: false
      },
      headers
    )
  );
  assert.equal(response.status, 201);
}

async function run() {
  const { resetMemoryDataAccess, getMemoryAuditActions } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const { resetRuntimeMemoryDomainEvents, getRuntimeMemoryDomainEvents } = await import(
    "../../src/features/shared/runtime-domain-event-publisher.ts"
  );

  const orgRoute = await import("../../src/app/api/people/organizations/route.ts");
  const employeeRoute = await import("../../src/app/api/people/employees/route.ts");
  const scheduleRoute = await import("../../src/app/api/scheduling/schedules/route.ts");
  const rotationBalanceRoute = await import("../../src/app/api/scheduling/rotations/balance/route.ts");

  resetMemoryDataAccess();
  resetRuntimeMemoryDomainEvents();

  const orgResponse = await orgRoute.POST(
    jsonRequest("POST", "/api/people/organizations", { name: "Org-Rotation-Balance" }, actorHeaders("system", "SYS-1"))
  );
  assert.equal(orgResponse.status, 201);
  const orgBody = await readJson<{ organization: { id: string } }>(orgResponse);

  const employeeId = "EMP-ROT-BAL-001";
  const otherEmployeeId = "EMP-ROT-BAL-002";
  const employeeCreate = await employeeRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/employees",
      { id: employeeId, organizationId: orgBody.organization.id, name: "Rotation Balance Employee" },
      actorHeaders("system", "SYS-1")
    )
  );
  assert.equal(employeeCreate.status, 201);

  const otherEmployeeCreate = await employeeRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/employees",
      { id: otherEmployeeId, organizationId: orgBody.organization.id, name: "Rotation Balance Employee 2" },
      actorHeaders("system", "SYS-1")
    )
  );
  assert.equal(otherEmployeeCreate.status, 201);

  const managerHeaders = actorHeaders("manager", "MGR-ROT-BAL-1", orgBody.organization.id);
  const employeeHeaders = actorHeaders("employee", employeeId, orgBody.organization.id);

  await createSchedule(
    scheduleRoute,
    employeeId,
    "2026-03-02T09:00:00+09:00",
    "2026-03-02T18:00:00+09:00",
    managerHeaders
  );
  await createSchedule(
    scheduleRoute,
    employeeId,
    "2026-03-09T09:00:00+09:00",
    "2026-03-09T18:00:00+09:00",
    managerHeaders
  );
  await createSchedule(
    scheduleRoute,
    employeeId,
    "2026-03-16T09:00:00+09:00",
    "2026-03-16T18:00:00+09:00",
    managerHeaders
  );
  await createSchedule(
    scheduleRoute,
    employeeId,
    "2026-03-23T09:00:00+09:00",
    "2026-03-23T18:00:00+09:00",
    managerHeaders
  );
  await createSchedule(
    scheduleRoute,
    employeeId,
    "2026-03-03T09:00:00+09:00",
    "2026-03-03T18:00:00+09:00",
    managerHeaders
  );

  resetRuntimeMemoryDomainEvents();

  const managerReport = await rotationBalanceRoute.GET(
    new Request(
      `http://localhost/api/scheduling/rotations/balance?from=2026-03-01T00:00:00+09:00&to=2026-03-31T23:59:59+09:00&employeeId=${employeeId}`,
      { method: "GET", headers: managerHeaders }
    )
  );
  assert.equal(managerReport.status, 200);
  const managerBody = await readJson<{
    report: {
      counts: {
        schedules: number;
        activeWeekdays: number;
        weekdayGap: number;
        plannedMinutesGap: number;
        grade: string;
      };
      recommendations: string[];
    };
  }>(managerReport);
  assert.equal(managerBody.report.counts.schedules, 5);
  assert.equal(managerBody.report.counts.activeWeekdays, 2);
  assert.equal(managerBody.report.counts.weekdayGap, 3);
  assert.equal(managerBody.report.counts.plannedMinutesGap, 1440);
  assert.equal(managerBody.report.counts.grade, "IMBALANCED");
  assert.ok(managerBody.report.recommendations.length > 0);

  assert.equal(
    getRuntimeMemoryDomainEvents().length,
    0,
    "rotation balance report should not publish domain events"
  );

  const managerMissingEmployeeId = await rotationBalanceRoute.GET(
    new Request(
      "http://localhost/api/scheduling/rotations/balance?from=2026-03-01T00:00:00+09:00&to=2026-03-31T23:59:59+09:00",
      { method: "GET", headers: managerHeaders }
    )
  );
  assert.equal(managerMissingEmployeeId.status, 400);

  const employeeCrossDenied = await rotationBalanceRoute.GET(
    new Request(
      `http://localhost/api/scheduling/rotations/balance?from=2026-03-01T00:00:00+09:00&to=2026-03-31T23:59:59+09:00&employeeId=${otherEmployeeId}`,
      { method: "GET", headers: employeeHeaders }
    )
  );
  assert.equal(employeeCrossDenied.status, 403);

  const auditActions = getMemoryAuditActions();
  assert.ok(auditActions.includes("scheduling.rotation.balance.report.generated"));

  console.log("e2e-wi0057-scheduling-rotation-balance-report.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
