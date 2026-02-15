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

async function readJson(response: Response) {
  return (await response.json()) as unknown;
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

  resetMemoryDataAccess();
  resetRuntimeMemoryDomainEvents();

  const orgAResponse = await orgRoute.POST(
    jsonRequest("POST", "/api/people/organizations", { name: "OrgA" }, actorHeaders("system", "SYS-1"))
  );
  assert.equal(orgAResponse.status, 201);
  const orgA = (await readJson(orgAResponse)) as { organization: { id: string } };
  assert.ok(orgA.organization.id);

  const orgBResponse = await orgRoute.POST(
    jsonRequest("POST", "/api/people/organizations", { name: "OrgB" }, actorHeaders("system", "SYS-1"))
  );
  assert.equal(orgBResponse.status, 201);
  const orgB = (await readJson(orgBResponse)) as { organization: { id: string } };
  assert.ok(orgB.organization.id);

  const employeeAId = "EMP-A1";
  const employeeBId = "EMP-B1";

  const employeeACreate = await employeeRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/employees",
      { id: employeeAId, organizationId: orgA.organization.id, name: "A1" },
      actorHeaders("system", "SYS-1")
    )
  );
  assert.equal(employeeACreate.status, 201);

  const employeeBCreate = await employeeRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/employees",
      { id: employeeBId, organizationId: orgB.organization.id, name: "B1" },
      actorHeaders("system", "SYS-1")
    )
  );
  assert.equal(employeeBCreate.status, 201);

  const managerOrgAHeaders = actorHeaders("manager", "MGR-A1", orgA.organization.id);

  const crossTenantCreateDenied = await scheduleRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/schedules",
      {
        employeeId: employeeBId,
        startAt: "2026-02-15T09:00:00+09:00",
        endAt: "2026-02-15T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      managerOrgAHeaders
    )
  );
  assert.equal(crossTenantCreateDenied.status, 404, "manager cannot assign schedule across tenant");

  const scheduleCreateResponse = await scheduleRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/schedules",
      {
        employeeId: employeeAId,
        startAt: "2026-02-15T09:00:00+09:00",
        endAt: "2026-02-15T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false,
        notes: "baseline schedule"
      },
      managerOrgAHeaders
    )
  );
  assert.equal(scheduleCreateResponse.status, 201, "manager can assign schedule within tenant");
  const scheduleCreateBody = (await readJson(scheduleCreateResponse)) as { schedule: { id: string } };
  assert.ok(scheduleCreateBody.schedule.id);

  const managerListMissingEmployeeId = await scheduleRoute.GET(
    new Request("http://localhost/api/scheduling/schedules?from=2026-02-01T00:00:00+09:00&to=2026-02-28T23:59:59+09:00", {
      method: "GET",
      headers: managerOrgAHeaders
    })
  );
  assert.equal(managerListMissingEmployeeId.status, 400, "manager list query requires employeeId");

  const managerListResponse = await scheduleRoute.GET(
    new Request(
      `http://localhost/api/scheduling/schedules?from=2026-02-01T00:00:00+09:00&to=2026-02-28T23:59:59+09:00&employeeId=${employeeAId}`,
      {
        method: "GET",
        headers: managerOrgAHeaders
      }
    )
  );
  assert.equal(managerListResponse.status, 200);
  const managerListBody = (await readJson(managerListResponse)) as { schedules: Array<{ employeeId: string }> };
  assert.equal(managerListBody.schedules.length, 1);
  assert.equal(managerListBody.schedules[0].employeeId, employeeAId);

  const employeeHeadersA = actorHeaders("employee", employeeAId, orgA.organization.id);
  const employeeListOwn = await scheduleRoute.GET(
    new Request("http://localhost/api/scheduling/schedules?from=2026-02-01T00:00:00+09:00&to=2026-02-28T23:59:59+09:00", {
      method: "GET",
      headers: employeeHeadersA
    })
  );
  assert.equal(employeeListOwn.status, 200);
  const employeeListOwnBody = (await readJson(employeeListOwn)) as { schedules: Array<{ employeeId: string }> };
  assert.equal(employeeListOwnBody.schedules.length, 1);
  assert.equal(employeeListOwnBody.schedules[0].employeeId, employeeAId);

  const employeeCrossListDenied = await scheduleRoute.GET(
    new Request(
      `http://localhost/api/scheduling/schedules?from=2026-02-01T00:00:00+09:00&to=2026-02-28T23:59:59+09:00&employeeId=${employeeBId}`,
      {
        method: "GET",
        headers: employeeHeadersA
      }
    )
  );
  assert.equal(employeeCrossListDenied.status, 404, "cross-tenant schedule lookup should not leak existence");

  const auditActions = getMemoryAuditActions();
  assert.ok(auditActions.includes("scheduling.schedule.assigned"));

  const eventNames = getRuntimeMemoryDomainEvents().map((event) => event.name);
  assert.ok(eventNames.includes("scheduling.schedule.assigned.v1"));

  console.log("e2e-wi0040-scheduling.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
