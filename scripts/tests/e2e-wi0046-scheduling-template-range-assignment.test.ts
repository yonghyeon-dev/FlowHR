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
  const templateRoute = await import("../../src/app/api/scheduling/templates/route.ts");
  const templateRangeRoute = await import("../../src/app/api/scheduling/templates/[templateId]/assign-range/route.ts");

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

  const templateCreate = await templateRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/templates",
      {
        name: "weekday-template",
        startMinute: 540,
        endMinute: 1080,
        breakMinutes: 60,
        isHoliday: false,
        weekdays: [1, 2, 3, 4, 5]
      },
      managerOrgAHeaders
    )
  );
  assert.equal(templateCreate.status, 201);
  const templateCreateBody = (await readJson(templateCreate)) as { template: { id: string } };

  const existingScheduleCreate = await scheduleRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/schedules",
      {
        employeeId: employeeAId,
        startAt: "2026-02-19T09:00:00+09:00",
        endAt: "2026-02-19T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      managerOrgAHeaders
    )
  );
  assert.equal(existingScheduleCreate.status, 201);

  const rangeOverlapDenied = await templateRangeRoute.POST(
    jsonRequest(
      "POST",
      `/api/scheduling/templates/${templateCreateBody.template.id}/assign-range`,
      {
        employeeId: employeeAId,
        fromDate: "2026-02-17",
        toDate: "2026-02-21"
      },
      managerOrgAHeaders
    ),
    { params: Promise.resolve({ templateId: templateCreateBody.template.id }) }
  );
  assert.equal(rangeOverlapDenied.status, 409, "range assignment should fail on overlap preflight");

  const schedulesAfterDenied = await scheduleRoute.GET(
    new Request(
      `http://localhost/api/scheduling/schedules?from=2026-02-01T00:00:00+09:00&to=2026-02-28T23:59:59+09:00&employeeId=${employeeAId}`,
      { method: "GET", headers: managerOrgAHeaders }
    )
  );
  assert.equal(schedulesAfterDenied.status, 200);
  const schedulesAfterDeniedBody = (await readJson(schedulesAfterDenied)) as { schedules: Array<{ id: string }> };
  assert.equal(schedulesAfterDeniedBody.schedules.length, 1, "overlap failure must not partially create schedules");

  const rangeAssignOk = await templateRangeRoute.POST(
    jsonRequest(
      "POST",
      `/api/scheduling/templates/${templateCreateBody.template.id}/assign-range`,
      {
        employeeId: employeeAId,
        fromDate: "2026-02-23",
        toDate: "2026-02-27"
      },
      managerOrgAHeaders
    ),
    { params: Promise.resolve({ templateId: templateCreateBody.template.id }) }
  );
  assert.equal(rangeAssignOk.status, 201);
  const rangeAssignBody = (await readJson(rangeAssignOk)) as {
    result: {
      matchedDates: string[];
      createdScheduleIds: string[];
    };
  };
  assert.equal(rangeAssignBody.result.matchedDates.length, 5);
  assert.equal(rangeAssignBody.result.createdScheduleIds.length, 5);

  const rangeTooLargeDenied = await templateRangeRoute.POST(
    jsonRequest(
      "POST",
      `/api/scheduling/templates/${templateCreateBody.template.id}/assign-range`,
      {
        employeeId: employeeAId,
        fromDate: "2026-01-01",
        toDate: "2026-04-10"
      },
      managerOrgAHeaders
    ),
    { params: Promise.resolve({ templateId: templateCreateBody.template.id }) }
  );
  assert.equal(rangeTooLargeDenied.status, 400);

  const employeeDenied = await templateRangeRoute.POST(
    jsonRequest(
      "POST",
      `/api/scheduling/templates/${templateCreateBody.template.id}/assign-range`,
      {
        employeeId: employeeAId,
        fromDate: "2026-03-02",
        toDate: "2026-03-06"
      },
      employeeHeadersA
    ),
    { params: Promise.resolve({ templateId: templateCreateBody.template.id }) }
  );
  assert.equal(employeeDenied.status, 403, "employee cannot assign template range");

  const crossTenantDenied = await templateRangeRoute.POST(
    jsonRequest(
      "POST",
      `/api/scheduling/templates/${templateCreateBody.template.id}/assign-range`,
      {
        employeeId: employeeBId,
        fromDate: "2026-03-02",
        toDate: "2026-03-06"
      },
      managerOrgBHeaders
    ),
    { params: Promise.resolve({ templateId: templateCreateBody.template.id }) }
  );
  assert.equal(crossTenantDenied.status, 404, "cross-tenant template access should be hidden");

  const auditActions = getMemoryAuditActions();
  assert.ok(auditActions.includes("scheduling.template.range_assigned"));

  const eventNames = getRuntimeMemoryDomainEvents().map((event) => event.name);
  assert.ok(eventNames.includes("scheduling.template.range_assigned.v1"));

  console.log("e2e-wi0046-scheduling-template-range-assignment.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
