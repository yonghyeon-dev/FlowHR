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
  const scheduleByIdRoute = await import("../../src/app/api/scheduling/schedules/[scheduleId]/route.ts");

  resetMemoryDataAccess();
  resetRuntimeMemoryDomainEvents();

  const orgAResponse = await orgRoute.POST(
    jsonRequest("POST", "/api/people/organizations", { name: "OrgA" }, actorHeaders("system", "SYS-1"))
  );
  assert.equal(orgAResponse.status, 201);
  const orgA = (await readJson(orgAResponse)) as { organization: { id: string } };

  const orgBResponse = await orgRoute.POST(
    jsonRequest("POST", "/api/people/organizations", { name: "OrgB" }, actorHeaders("system", "SYS-1"))
  );
  assert.equal(orgBResponse.status, 201);
  const orgB = (await readJson(orgBResponse)) as { organization: { id: string } };

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
  const managerOrgBHeaders = actorHeaders("manager", "MGR-B1", orgB.organization.id);
  const employeeHeadersA = actorHeaders("employee", employeeAId, orgA.organization.id);

  const scheduleAResponse = await scheduleRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/schedules",
      {
        employeeId: employeeAId,
        startAt: "2026-02-16T09:00:00+09:00",
        endAt: "2026-02-16T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      managerOrgAHeaders
    )
  );
  assert.equal(scheduleAResponse.status, 201);
  const scheduleA = (await readJson(scheduleAResponse)) as { schedule: { id: string } };

  const scheduleBResponse = await scheduleRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/schedules",
      {
        employeeId: employeeBId,
        startAt: "2026-02-16T09:00:00+09:00",
        endAt: "2026-02-16T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      managerOrgBHeaders
    )
  );
  assert.equal(scheduleBResponse.status, 201);
  const scheduleB = (await readJson(scheduleBResponse)) as { schedule: { id: string } };

  const employeeDeleteDenied = await scheduleByIdRoute.DELETE(
    new Request(`http://localhost/api/scheduling/schedules/${scheduleA.schedule.id}`, {
      method: "DELETE",
      headers: employeeHeadersA
    }),
    { params: Promise.resolve({ scheduleId: scheduleA.schedule.id }) }
  );
  assert.equal(employeeDeleteDenied.status, 403);

  const crossTenantDeleteDenied = await scheduleByIdRoute.DELETE(
    new Request(`http://localhost/api/scheduling/schedules/${scheduleB.schedule.id}`, {
      method: "DELETE",
      headers: managerOrgAHeaders
    }),
    { params: Promise.resolve({ scheduleId: scheduleB.schedule.id }) }
  );
  assert.equal(crossTenantDeleteDenied.status, 404);

  const managerDeleteOk = await scheduleByIdRoute.DELETE(
    new Request(`http://localhost/api/scheduling/schedules/${scheduleA.schedule.id}`, {
      method: "DELETE",
      headers: managerOrgAHeaders
    }),
    { params: Promise.resolve({ scheduleId: scheduleA.schedule.id }) }
  );
  assert.equal(managerDeleteOk.status, 200, "manager can delete schedule within tenant");

  const managerDeleteMissing = await scheduleByIdRoute.DELETE(
    new Request(`http://localhost/api/scheduling/schedules/${scheduleA.schedule.id}`, {
      method: "DELETE",
      headers: managerOrgAHeaders
    }),
    { params: Promise.resolve({ scheduleId: scheduleA.schedule.id }) }
  );
  assert.equal(managerDeleteMissing.status, 404, "deleting missing schedule should return 404");

  const managerListAfterDelete = await scheduleRoute.GET(
    new Request(
      `http://localhost/api/scheduling/schedules?from=2026-02-01T00:00:00+09:00&to=2026-02-28T23:59:59+09:00&employeeId=${employeeAId}`,
      {
        method: "GET",
        headers: managerOrgAHeaders
      }
    )
  );
  assert.equal(managerListAfterDelete.status, 200);
  const managerListBody = (await readJson(managerListAfterDelete)) as { schedules: Array<{ id: string }> };
  assert.equal(managerListBody.schedules.length, 0, "deleted schedule should not appear in list");

  const auditActions = getMemoryAuditActions();
  const deletedCount = auditActions.filter((action) => action === "scheduling.schedule.deleted").length;
  assert.equal(deletedCount, 1, "delete audit should be emitted exactly once");

  const eventNames = getRuntimeMemoryDomainEvents().map((event) => event.name);
  const deletedEventCount = eventNames.filter((name) => name === "scheduling.schedule.deleted.v1").length;
  assert.equal(deletedEventCount, 1, "delete event should be emitted exactly once");

  console.log("e2e-wi0043-scheduling-delete.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

