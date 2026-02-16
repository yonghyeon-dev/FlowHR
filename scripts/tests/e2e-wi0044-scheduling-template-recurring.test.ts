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
  const templateAssignRoute = await import("../../src/app/api/scheduling/templates/[templateId]/assign/route.ts");

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

  const employeeTemplateDenied = await templateRoute.POST(
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
      employeeHeadersA
    )
  );
  assert.equal(employeeTemplateDenied.status, 403, "employee cannot create template");

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
        weekdays: [1, 2, 3, 4, 5],
        notes: "weekdays baseline"
      },
      managerOrgAHeaders
    )
  );
  assert.equal(templateCreate.status, 201);
  const templateCreateBody = (await readJson(templateCreate)) as { template: { id: string } };
  assert.ok(templateCreateBody.template.id);

  const templateList = await templateRoute.GET(
    new Request("http://localhost/api/scheduling/templates", { method: "GET", headers: managerOrgAHeaders })
  );
  assert.equal(templateList.status, 200);
  const templateListBody = (await readJson(templateList)) as { templates: Array<{ id: string }> };
  assert.equal(templateListBody.templates.length, 1);
  assert.equal(templateListBody.templates[0].id, templateCreateBody.template.id);

  const templateAssignOk = await templateAssignRoute.POST(
    jsonRequest(
      "POST",
      `/api/scheduling/templates/${templateCreateBody.template.id}/assign`,
      {
        employeeId: employeeAId,
        date: "2026-02-16"
      },
      managerOrgAHeaders
    ),
    { params: Promise.resolve({ templateId: templateCreateBody.template.id }) }
  );
  assert.equal(templateAssignOk.status, 201, "manager can assign template to employee");
  const assignedBody = (await readJson(templateAssignOk)) as { schedule: { id: string; startAt: string; endAt: string } };
  assert.ok(assignedBody.schedule.id);
  assert.equal(new Date(assignedBody.schedule.startAt).toISOString(), new Date("2026-02-16T09:00:00+09:00").toISOString());
  assert.equal(new Date(assignedBody.schedule.endAt).toISOString(), new Date("2026-02-16T18:00:00+09:00").toISOString());

  const templateAssignWeekdayMismatch = await templateAssignRoute.POST(
    jsonRequest(
      "POST",
      `/api/scheduling/templates/${templateCreateBody.template.id}/assign`,
      {
        employeeId: employeeAId,
        date: "2026-02-15"
      },
      managerOrgAHeaders
    ),
    { params: Promise.resolve({ templateId: templateCreateBody.template.id }) }
  );
  assert.equal(templateAssignWeekdayMismatch.status, 409, "template weekday mismatch should be rejected");

  const crossTenantAssign = await templateAssignRoute.POST(
    jsonRequest(
      "POST",
      `/api/scheduling/templates/${templateCreateBody.template.id}/assign`,
      {
        employeeId: employeeBId,
        date: "2026-02-16"
      },
      managerOrgBHeaders
    ),
    { params: Promise.resolve({ templateId: templateCreateBody.template.id }) }
  );
  assert.equal(crossTenantAssign.status, 404, "cross-tenant template access should be hidden");

  const scheduleList = await scheduleRoute.GET(
    new Request(
      `http://localhost/api/scheduling/schedules?from=2026-02-01T00:00:00+09:00&to=2026-02-28T23:59:59+09:00&employeeId=${employeeAId}`,
      { method: "GET", headers: managerOrgAHeaders }
    )
  );
  assert.equal(scheduleList.status, 200);
  const scheduleListBody = (await readJson(scheduleList)) as { schedules: Array<{ id: string }> };
  assert.equal(scheduleListBody.schedules.length, 1);
  assert.equal(scheduleListBody.schedules[0].id, assignedBody.schedule.id);

  const auditActions = getMemoryAuditActions();
  assert.ok(auditActions.includes("scheduling.template.created"));
  assert.ok(auditActions.includes("scheduling.template.assigned"));
  assert.ok(auditActions.includes("scheduling.schedule.assigned"));

  const eventNames = getRuntimeMemoryDomainEvents().map((event) => event.name);
  assert.ok(eventNames.includes("scheduling.template.created.v1"));
  assert.ok(eventNames.includes("scheduling.template.assigned.v1"));
  assert.ok(eventNames.includes("scheduling.schedule.assigned.v1"));

  console.log("e2e-wi0044-scheduling-template-recurring.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

