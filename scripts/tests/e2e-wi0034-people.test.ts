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

function actorHeaders(role: string, actorId: string) {
  return {
    "content-type": "application/json",
    "x-actor-role": role,
    "x-actor-id": actorId
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

type RouteContext<TParams extends Record<string, string>> = {
  params: Promise<TParams>;
};

async function run() {
  const { resetMemoryDataAccess, getMemoryAuditActions } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const { resetRuntimeMemoryDomainEvents, getRuntimeMemoryDomainEvents } = await import(
    "../../src/features/shared/runtime-domain-event-publisher.ts"
  );

  const orgRoute = await import("../../src/app/api/people/organizations/route.ts");
  const orgByIdRoute = await import(
    "../../src/app/api/people/organizations/[organizationId]/route.ts"
  );
  const employeeRoute = await import("../../src/app/api/people/employees/route.ts");
  const employeeByIdRoute = await import("../../src/app/api/people/employees/[employeeId]/route.ts");

  resetMemoryDataAccess();
  resetRuntimeMemoryDomainEvents();

  const orgCreateDenied = await orgRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/organizations",
      { name: "FlowCoder" },
      actorHeaders("manager", "MGR-1")
    )
  );
  assert.equal(orgCreateDenied.status, 403, "non-admin cannot create organization");

  const orgCreateResponse = await orgRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/organizations",
      { name: "FlowCoder" },
      actorHeaders("admin", "A-1")
    )
  );
  assert.equal(orgCreateResponse.status, 201, "admin can create organization");
  const orgCreateBody = (await readJson(orgCreateResponse)) as { organization: { id: string; name: string } };
  assert.ok(orgCreateBody.organization.id, "organization id should exist");
  assert.equal(orgCreateBody.organization.name, "FlowCoder");
  const organizationId = orgCreateBody.organization.id;

  const orgListResponse = await orgRoute.GET(
    new Request("http://localhost/api/people/organizations", {
      method: "GET",
      headers: actorHeaders("admin", "A-1")
    })
  );
  assert.equal(orgListResponse.status, 200, "admin can list organizations");
  const orgListBody = (await readJson(orgListResponse)) as {
    organizations: Array<{ id: string; name: string }>;
  };
  assert.ok(
    orgListBody.organizations.some((org) => org.id === organizationId),
    "list should include created org"
  );

  const orgGetResponse = await orgByIdRoute.GET(
    new Request(`http://localhost/api/people/organizations/${organizationId}`, {
      method: "GET",
      headers: actorHeaders("admin", "A-1")
    }),
    { params: Promise.resolve({ organizationId }) } as RouteContext<{ organizationId: string }>
  );
  assert.equal(orgGetResponse.status, 200, "admin can get organization by id");

  const employeeCreateResponse = await employeeRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/employees",
      {
        id: "EMP-2001",
        organizationId,
        name: "Kim",
        email: "kim@example.com",
        active: true
      },
      actorHeaders("admin", "A-1")
    )
  );
  assert.equal(employeeCreateResponse.status, 201, "admin can create employee");
  const employeeCreateBody = (await readJson(employeeCreateResponse)) as {
    employee: { id: string; organizationId: string | null; active: boolean };
  };
  assert.equal(employeeCreateBody.employee.id, "EMP-2001");
  assert.equal(employeeCreateBody.employee.organizationId, organizationId);
  assert.equal(employeeCreateBody.employee.active, true);

  const duplicateEmployeeResponse = await employeeRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/employees",
      {
        id: "EMP-2001"
      },
      actorHeaders("admin", "A-1")
    )
  );
  assert.equal(duplicateEmployeeResponse.status, 409, "duplicate employee create should return 409");

  const employeeGetResponse = await employeeByIdRoute.GET(
    new Request("http://localhost/api/people/employees/EMP-2001", {
      method: "GET",
      headers: actorHeaders("admin", "A-1")
    }),
    { params: Promise.resolve({ employeeId: "EMP-2001" }) } as RouteContext<{ employeeId: string }>
  );
  assert.equal(employeeGetResponse.status, 200, "admin can get employee by id");

  const employeeUpdateResponse = await employeeByIdRoute.PATCH(
    jsonRequest(
      "PATCH",
      "/api/people/employees/EMP-2001",
      {
        active: false
      },
      actorHeaders("admin", "A-1")
    ),
    { params: Promise.resolve({ employeeId: "EMP-2001" }) } as RouteContext<{ employeeId: string }>
  );
  assert.equal(employeeUpdateResponse.status, 200, "admin can update employee");
  const employeeUpdateBody = (await readJson(employeeUpdateResponse)) as {
    employee: { id: string; active: boolean };
  };
  assert.equal(employeeUpdateBody.employee.id, "EMP-2001");
  assert.equal(employeeUpdateBody.employee.active, false);

  const employeeListActiveTrue = await employeeRoute.GET(
    new Request("http://localhost/api/people/employees?active=true", {
      method: "GET",
      headers: actorHeaders("admin", "A-1")
    })
  );
  assert.equal(employeeListActiveTrue.status, 200, "list active=true should succeed");
  const activeTrueBody = (await readJson(employeeListActiveTrue)) as {
    employees: Array<{ id: string; active: boolean }>;
  };
  assert.equal(activeTrueBody.employees.length, 0, "inactive employee should be excluded from active=true list");

  const employeeListInactive = await employeeRoute.GET(
    new Request("http://localhost/api/people/employees?active=false", {
      method: "GET",
      headers: actorHeaders("admin", "A-1")
    })
  );
  assert.equal(employeeListInactive.status, 200, "list active=false should succeed");
  const inactiveBody = (await readJson(employeeListInactive)) as {
    employees: Array<{ id: string; active: boolean }>;
  };
  assert.equal(inactiveBody.employees.length, 1);
  assert.equal(inactiveBody.employees[0].id, "EMP-2001");
  assert.equal(inactiveBody.employees[0].active, false);

  const auditActions = getMemoryAuditActions();
  assert.ok(auditActions.includes("organization.created"), "audit should include organization.created");
  assert.ok(auditActions.includes("employee.created"), "audit should include employee.created");
  assert.ok(
    auditActions.includes("employee.profile.updated"),
    "audit should include employee.profile.updated"
  );

  const eventNames = getRuntimeMemoryDomainEvents().map((event) => event.name);
  assert.ok(eventNames.includes("organization.created.v1"), "domain events include org created");
  assert.ok(eventNames.includes("employee.created.v1"), "domain events include employee created");
  assert.ok(
    eventNames.includes("employee.profile.updated.v1"),
    "domain events include employee profile updated"
  );

  console.log("e2e-wi0034-people.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

