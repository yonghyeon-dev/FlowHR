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
  const managerOrgBHeaders = actorHeaders("manager", "MGR-B1", orgB.organization.id);

  const scheduleA1Create = await scheduleRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/schedules",
      {
        employeeId: employeeAId,
        startAt: "2026-02-15T09:00:00+09:00",
        endAt: "2026-02-15T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      managerOrgAHeaders
    )
  );
  assert.equal(scheduleA1Create.status, 201);
  const scheduleA1 = (await readJson(scheduleA1Create)) as { schedule: { id: string } };
  assert.ok(scheduleA1.schedule.id);

  const scheduleA2Create = await scheduleRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/schedules",
      {
        employeeId: employeeAId,
        startAt: "2026-02-15T18:00:00+09:00",
        endAt: "2026-02-15T22:00:00+09:00",
        breakMinutes: 0,
        isHoliday: false
      },
      managerOrgAHeaders
    )
  );
  assert.equal(scheduleA2Create.status, 201);

  const overlapPatchDenied = await scheduleByIdRoute.PATCH(
    jsonRequest(
      "PATCH",
      `/api/scheduling/schedules/${scheduleA1.schedule.id}`,
      {
        startAt: "2026-02-15T10:00:00+09:00",
        endAt: "2026-02-15T19:00:00+09:00"
      },
      managerOrgAHeaders
    ),
    { params: Promise.resolve({ scheduleId: scheduleA1.schedule.id }) }
  );
  assert.equal(overlapPatchDenied.status, 409, "schedule update must reject overlap with another schedule");

  const schedulePatchOk = await scheduleByIdRoute.PATCH(
    jsonRequest(
      "PATCH",
      `/api/scheduling/schedules/${scheduleA1.schedule.id}`,
      {
        startAt: "2026-02-15T08:00:00+09:00",
        endAt: "2026-02-15T18:00:00+09:00",
        breakMinutes: 30
      },
      managerOrgAHeaders
    ),
    { params: Promise.resolve({ scheduleId: scheduleA1.schedule.id }) }
  );
  assert.equal(schedulePatchOk.status, 200, "manager can patch schedule within tenant");
  const patchedBody = (await readJson(schedulePatchOk)) as { schedule: { startAt: string; endAt: string; breakMinutes: number } };
  assert.equal(patchedBody.schedule.breakMinutes, 30);
  assert.equal(new Date(patchedBody.schedule.startAt).toISOString(), new Date("2026-02-15T08:00:00+09:00").toISOString());
  assert.equal(new Date(patchedBody.schedule.endAt).toISOString(), new Date("2026-02-15T18:00:00+09:00").toISOString());

  const employeeHeadersA = actorHeaders("employee", employeeAId, orgA.organization.id);
  const employeePatchDenied = await scheduleByIdRoute.PATCH(
    jsonRequest(
      "PATCH",
      `/api/scheduling/schedules/${scheduleA1.schedule.id}`,
      { breakMinutes: 0 },
      employeeHeadersA
    ),
    { params: Promise.resolve({ scheduleId: scheduleA1.schedule.id }) }
  );
  assert.equal(employeePatchDenied.status, 403, "employee cannot patch schedules");

  const scheduleBCreate = await scheduleRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/schedules",
      {
        employeeId: employeeBId,
        startAt: "2026-02-15T09:00:00+09:00",
        endAt: "2026-02-15T18:00:00+09:00",
        breakMinutes: 0,
        isHoliday: false
      },
      managerOrgBHeaders
    )
  );
  assert.equal(scheduleBCreate.status, 201);
  const scheduleB = (await readJson(scheduleBCreate)) as { schedule: { id: string } };
  assert.ok(scheduleB.schedule.id);

  const crossTenantPatchDenied = await scheduleByIdRoute.PATCH(
    jsonRequest(
      "PATCH",
      `/api/scheduling/schedules/${scheduleB.schedule.id}`,
      { breakMinutes: 15 },
      managerOrgAHeaders
    ),
    { params: Promise.resolve({ scheduleId: scheduleB.schedule.id }) }
  );
  assert.equal(crossTenantPatchDenied.status, 404, "cross-tenant patch must not leak schedule existence");

  const auditActions = getMemoryAuditActions();
  const assignedCount = auditActions.filter((action) => action === "scheduling.schedule.assigned").length;
  const updatedCount = auditActions.filter((action) => action === "scheduling.schedule.updated").length;
  assert.equal(assignedCount, 3);
  assert.equal(updatedCount, 1);

  const events = getRuntimeMemoryDomainEvents().map((event) => event.name);
  const assignedEvents = events.filter((name) => name === "scheduling.schedule.assigned.v1").length;
  const updatedEvents = events.filter((name) => name === "scheduling.schedule.updated.v1").length;
  assert.equal(assignedEvents, 3);
  assert.equal(updatedEvents, 1);

  console.log("e2e-wi0042-scheduling-update.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
