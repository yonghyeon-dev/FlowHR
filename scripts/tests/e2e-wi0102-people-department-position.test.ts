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
type RouteContext<TParams extends Record<string, string>> = {
  params: Promise<TParams>;
};

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

async function run() {
  const { resetMemoryDataAccess, getMemoryAuditActions } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const { resetRuntimeMemoryDomainEvents, getRuntimeMemoryDomainEvents } = await import(
    "../../src/features/shared/runtime-domain-event-publisher.ts"
  );

  const orgRoute = await import("../../src/app/api/people/organizations/route.ts");
  const departmentRoute = await import("../../src/app/api/people/departments/route.ts");
  const departmentByIdRoute = await import(
    "../../src/app/api/people/departments/[departmentId]/route.ts"
  );
  const positionRoute = await import("../../src/app/api/people/positions/route.ts");
  const positionByIdRoute = await import(
    "../../src/app/api/people/positions/[positionId]/route.ts"
  );
  const employeeRoute = await import("../../src/app/api/people/employees/route.ts");
  const employeeByIdRoute = await import("../../src/app/api/people/employees/[employeeId]/route.ts");

  resetMemoryDataAccess();
  resetRuntimeMemoryDomainEvents();

  const managerCreateDepartment = await departmentRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/departments",
      {
        organizationId: "ORG-X",
        code: "ENG",
        name: "Engineering"
      },
      actorHeaders("manager", "MGR-1")
    )
  );
  assert.equal(managerCreateDepartment.status, 403, "non-admin cannot create department");

  const orgAResponse = await orgRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/organizations",
      { name: "FlowCoder" },
      actorHeaders("admin", "A-1")
    )
  );
  assert.equal(orgAResponse.status, 201);
  const orgABody = (await readJson(orgAResponse)) as { organization: { id: string } };
  const orgAId = orgABody.organization.id;

  const orgBResponse = await orgRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/organizations",
      { name: "FlowCoder-B" },
      actorHeaders("admin", "A-1")
    )
  );
  assert.equal(orgBResponse.status, 201);
  const orgBBody = (await readJson(orgBResponse)) as { organization: { id: string } };
  const orgBId = orgBBody.organization.id;

  const createDepartmentResponse = await departmentRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/departments",
      {
        organizationId: orgAId,
        code: "ENG",
        name: "Engineering"
      },
      actorHeaders("admin", "A-1")
    )
  );
  assert.equal(createDepartmentResponse.status, 201, "department create should succeed");
  const createDepartmentBody = (await readJson(createDepartmentResponse)) as {
    department: { id: string; code: string; organizationId: string };
  };
  assert.equal(createDepartmentBody.department.code, "ENG");
  assert.equal(createDepartmentBody.department.organizationId, orgAId);
  const departmentId = createDepartmentBody.department.id;

  const duplicateDepartmentResponse = await departmentRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/departments",
      {
        organizationId: orgAId,
        code: "eng",
        name: "Engineering Duplicate"
      },
      actorHeaders("admin", "A-1")
    )
  );
  assert.equal(duplicateDepartmentResponse.status, 409, "department code must be unique per org");

  const createPositionResponse = await positionRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/positions",
      {
        organizationId: orgAId,
        code: "SWE1",
        name: "Software Engineer I"
      },
      actorHeaders("admin", "A-1")
    )
  );
  assert.equal(createPositionResponse.status, 201, "position create should succeed");
  const createPositionBody = (await readJson(createPositionResponse)) as {
    position: { id: string; code: string; organizationId: string };
  };
  assert.equal(createPositionBody.position.code, "SWE1");
  assert.equal(createPositionBody.position.organizationId, orgAId);
  const positionId = createPositionBody.position.id;

  const updateDepartmentResponse = await departmentByIdRoute.PATCH(
    jsonRequest(
      "PATCH",
      `/api/people/departments/${departmentId}`,
      { code: "ENG-PLT", active: false },
      actorHeaders("admin", "A-1")
    ),
    { params: Promise.resolve({ departmentId }) } as RouteContext<{ departmentId: string }>
  );
  assert.equal(updateDepartmentResponse.status, 200, "department update should succeed");
  const updateDepartmentBody = (await readJson(updateDepartmentResponse)) as {
    department: { id: string; code: string; active: boolean };
  };
  assert.equal(updateDepartmentBody.department.id, departmentId);
  assert.equal(updateDepartmentBody.department.code, "ENG-PLT");
  assert.equal(updateDepartmentBody.department.active, false);

  const updatePositionResponse = await positionByIdRoute.PATCH(
    jsonRequest(
      "PATCH",
      `/api/people/positions/${positionId}`,
      { name: "Software Engineer II" },
      actorHeaders("admin", "A-1")
    ),
    { params: Promise.resolve({ positionId }) } as RouteContext<{ positionId: string }>
  );
  assert.equal(updatePositionResponse.status, 200, "position update should succeed");

  const createEmployeeResponse = await employeeRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/employees",
      {
        id: "EMP-3101",
        organizationId: orgAId,
        departmentId,
        positionId,
        name: "Kim",
        email: "kim@example.com",
        active: true
      },
      actorHeaders("admin", "A-1")
    )
  );
  assert.equal(createEmployeeResponse.status, 201, "employee create with dept/position should succeed");
  const createEmployeeBody = (await readJson(createEmployeeResponse)) as {
    employee: { departmentId: string | null; positionId: string | null };
  };
  assert.equal(createEmployeeBody.employee.departmentId, departmentId);
  assert.equal(createEmployeeBody.employee.positionId, positionId);

  const updateEmployeeMismatchResponse = await employeeByIdRoute.PATCH(
    jsonRequest(
      "PATCH",
      "/api/people/employees/EMP-3101",
      {
        organizationId: orgBId
      },
      actorHeaders("admin", "A-1")
    ),
    { params: Promise.resolve({ employeeId: "EMP-3101" }) } as RouteContext<{ employeeId: string }>
  );
  assert.equal(
    updateEmployeeMismatchResponse.status,
    409,
    "employee org update should fail when existing dept/position mismatch"
  );

  const listDepartmentsActiveFalse = await departmentRoute.GET(
    new Request(`http://localhost/api/people/departments?active=false&organizationId=${orgAId}`, {
      method: "GET",
      headers: actorHeaders("admin", "A-1")
    })
  );
  assert.equal(listDepartmentsActiveFalse.status, 200);
  const listDepartmentsActiveFalseBody = (await readJson(listDepartmentsActiveFalse)) as {
    departments: Array<{ id: string; active: boolean }>;
  };
  assert.ok(
    listDepartmentsActiveFalseBody.departments.some(
      (department) => department.id === departmentId && department.active === false
    ),
    "department list should include updated inactive department"
  );

  const listPositionsResponse = await positionRoute.GET(
    new Request(`http://localhost/api/people/positions?organizationId=${orgAId}`, {
      method: "GET",
      headers: actorHeaders("admin", "A-1")
    })
  );
  assert.equal(listPositionsResponse.status, 200);
  const listPositionsBody = (await readJson(listPositionsResponse)) as {
    positions: Array<{ id: string }>;
  };
  assert.ok(listPositionsBody.positions.some((position) => position.id === positionId));

  const auditActions = getMemoryAuditActions();
  assert.ok(auditActions.includes("department.created"), "audit should include department.created");
  assert.ok(auditActions.includes("department.updated"), "audit should include department.updated");
  assert.ok(auditActions.includes("position.created"), "audit should include position.created");
  assert.ok(auditActions.includes("position.updated"), "audit should include position.updated");
  assert.ok(auditActions.includes("employee.created"), "audit should include employee.created");

  const eventNames = getRuntimeMemoryDomainEvents().map((event) => event.name);
  assert.ok(eventNames.includes("department.created.v1"), "events should include department.created.v1");
  assert.ok(eventNames.includes("department.updated.v1"), "events should include department.updated.v1");
  assert.ok(eventNames.includes("position.created.v1"), "events should include position.created.v1");
  assert.ok(eventNames.includes("position.updated.v1"), "events should include position.updated.v1");

  console.log("e2e-wi0102-people-department-position.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
