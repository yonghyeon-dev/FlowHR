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

function asIso(input: string) {
  return new Date(input).toISOString();
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
  const templateRoute = await import("../../src/app/api/scheduling/templates/route.ts");
  const rotationRoute = await import("../../src/app/api/scheduling/rotations/assign/route.ts");

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

  const dayTemplateCreate = await templateRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/templates",
      {
        name: "day-shift",
        startMinute: 540,
        endMinute: 1080,
        breakMinutes: 60,
        isHoliday: false,
        weekdays: [1, 2, 3, 4, 5]
      },
      managerOrgAHeaders
    )
  );
  assert.equal(dayTemplateCreate.status, 201);
  const dayTemplate = (await readJson(dayTemplateCreate)) as { template: { id: string } };

  const nightTemplateCreate = await templateRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/templates",
      {
        name: "night-shift",
        startMinute: 840,
        endMinute: 1320,
        breakMinutes: 60,
        isHoliday: false,
        weekdays: [1, 2, 3, 4, 5]
      },
      managerOrgAHeaders
    )
  );
  assert.equal(nightTemplateCreate.status, 201);
  const nightTemplate = (await readJson(nightTemplateCreate)) as { template: { id: string } };

  const weekendTemplateCreate = await templateRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/templates",
      {
        name: "weekend-shift",
        startMinute: 600,
        endMinute: 900,
        breakMinutes: 30,
        isHoliday: false,
        weekdays: [6, 7]
      },
      managerOrgAHeaders
    )
  );
  assert.equal(weekendTemplateCreate.status, 201);
  const weekendTemplate = (await readJson(weekendTemplateCreate)) as { template: { id: string } };

  const existingScheduleCreate = await scheduleRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/schedules",
      {
        employeeId: employeeAId,
        startAt: "2026-03-05T09:00:00+09:00",
        endAt: "2026-03-05T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      managerOrgAHeaders
    )
  );
  assert.equal(existingScheduleCreate.status, 201);

  const overlapDenied = await rotationRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/rotations/assign",
      {
        employeeId: employeeAId,
        fromDate: "2026-03-02",
        toDate: "2026-03-06",
        templateIds: [dayTemplate.template.id, nightTemplate.template.id]
      },
      managerOrgAHeaders
    )
  );
  assert.equal(overlapDenied.status, 409, "rotation should fail on overlap preflight");

  const schedulesAfterDenied = await scheduleRoute.GET(
    new Request(
      `http://localhost/api/scheduling/schedules?from=2026-03-01T00:00:00+09:00&to=2026-03-31T23:59:59+09:00&employeeId=${employeeAId}`,
      { method: "GET", headers: managerOrgAHeaders }
    )
  );
  assert.equal(schedulesAfterDenied.status, 200);
  const schedulesAfterDeniedBody = (await readJson(schedulesAfterDenied)) as { schedules: Array<{ id: string }> };
  assert.equal(schedulesAfterDeniedBody.schedules.length, 1, "overlap conflict must not create partial schedules");

  const weekdayMismatchDenied = await rotationRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/rotations/assign",
      {
        employeeId: employeeAId,
        fromDate: "2026-03-09",
        toDate: "2026-03-13",
        templateIds: [dayTemplate.template.id, weekendTemplate.template.id]
      },
      managerOrgAHeaders
    )
  );
  assert.equal(weekdayMismatchDenied.status, 409, "rotation templates must share weekday set");

  const rotationAssignOk = await rotationRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/rotations/assign",
      {
        employeeId: employeeAId,
        fromDate: "2026-03-09",
        toDate: "2026-03-13",
        templateIds: [dayTemplate.template.id, nightTemplate.template.id]
      },
      managerOrgAHeaders
    )
  );
  assert.equal(rotationAssignOk.status, 201);
  const rotationAssignBody = (await readJson(rotationAssignOk)) as {
    result: {
      matchedDates: string[];
      createdScheduleIds: string[];
    };
  };
  assert.equal(rotationAssignBody.result.matchedDates.length, 5);
  assert.equal(rotationAssignBody.result.createdScheduleIds.length, 5);

  const employeeDenied = await rotationRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/rotations/assign",
      {
        employeeId: employeeAId,
        fromDate: "2026-03-16",
        toDate: "2026-03-20",
        templateIds: [dayTemplate.template.id, nightTemplate.template.id]
      },
      employeeHeadersA
    )
  );
  assert.equal(employeeDenied.status, 403);

  const crossTenantDenied = await rotationRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/rotations/assign",
      {
        employeeId: employeeBId,
        fromDate: "2026-03-16",
        toDate: "2026-03-20",
        templateIds: [dayTemplate.template.id, nightTemplate.template.id]
      },
      managerOrgBHeaders
    )
  );
  assert.equal(crossTenantDenied.status, 404, "cross-tenant template access should be hidden");

  const schedulesAfterOk = await scheduleRoute.GET(
    new Request(
      `http://localhost/api/scheduling/schedules?from=2026-03-01T00:00:00+09:00&to=2026-03-31T23:59:59+09:00&employeeId=${employeeAId}`,
      { method: "GET", headers: managerOrgAHeaders }
    )
  );
  assert.equal(schedulesAfterOk.status, 200);
  const schedulesAfterOkBody = (await readJson(schedulesAfterOk)) as {
    schedules: Array<{ startAt: string; endAt: string }>;
  };
  assert.equal(schedulesAfterOkBody.schedules.length, 6);

  const isoStarts = schedulesAfterOkBody.schedules.map((item) => new Date(item.startAt).toISOString());
  assert.ok(isoStarts.includes(asIso("2026-03-09T09:00:00+09:00")));
  assert.ok(isoStarts.includes(asIso("2026-03-10T14:00:00+09:00")));
  assert.ok(isoStarts.includes(asIso("2026-03-11T09:00:00+09:00")));
  assert.ok(isoStarts.includes(asIso("2026-03-12T14:00:00+09:00")));
  assert.ok(isoStarts.includes(asIso("2026-03-13T09:00:00+09:00")));

  const auditActions = getMemoryAuditActions();
  assert.ok(auditActions.includes("scheduling.rotation.assigned"));

  const eventNames = getRuntimeMemoryDomainEvents().map((event) => event.name);
  assert.ok(eventNames.includes("scheduling.rotation.assigned.v1"));

  console.log("e2e-wi0047-scheduling-rotation-assignment.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
