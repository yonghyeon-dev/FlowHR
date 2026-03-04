import assert from "node:assert/strict";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "memory";
runtimeEnv.FLOWHR_EVENT_PUBLISHER = "memory";
runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
runtimeEnv.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.DIRECT_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";

type JsonPayload = Record<string, unknown>;
type RouteContext<TParams extends Record<string, string>> = {
  params: Promise<TParams>;
};

function actorHeaders(role: string, actorId: string, organizationId: string) {
  return {
    "content-type": "application/json",
    "x-actor-role": role,
    "x-actor-id": actorId,
    "x-actor-organization-id": organizationId
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

async function run() {
  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const departmentsRoute = await import("../../src/app/api/people/departments/route.ts");
  const departmentByIdRoute = await import("../../src/app/api/people/departments/[departmentId]/route.ts");
  const employeesRoute = await import("../../src/app/api/people/employees/route.ts");

  resetMemoryDataAccess();

  const organization = await memoryDataAccess.organizations.create({
    name: "WI-0938 Department Management Org"
  });

  const adminHeaders = actorHeaders("admin", "ADM-WI0938-1", organization.id);
  const employeeHeaders = actorHeaders("employee", "EMP-WI0938-9001", organization.id);

  const createResponse = await departmentsRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/departments",
      {
        name: "Engineering"
      },
      adminHeaders
    )
  );
  assert.equal(createResponse.status, 201, "POST create department should return 201");
  const createBody = await readJson<{
    department: { id: string; name: string; parentId: string | null; managerId: string | null };
  }>(createResponse);
  assert.equal(createBody.department.name, "Engineering");
  assert.equal(createBody.department.parentId, null);
  assert.equal(createBody.department.managerId, null);
  const createdDepartmentId = createBody.department.id;

  const listResponse = await departmentsRoute.GET(
    new Request(`http://localhost/api/people/departments?organizationId=${organization.id}`, {
      method: "GET",
      headers: adminHeaders
    })
  );
  assert.equal(listResponse.status, 200, "GET list departments should return 200");
  const listBody = await readJson<{
    departments: Array<{ id: string; name: string }>;
  }>(listResponse);
  assert.ok(
    listBody.departments.some(
      (department) => department.id === createdDepartmentId && department.name === "Engineering"
    ),
    "new department should be visible in list"
  );

  const patchResponse = await departmentByIdRoute.PATCH(
    jsonRequest(
      "PATCH",
      `/api/people/departments/${createdDepartmentId}`,
      {
        name: "Engineering Platform"
      },
      adminHeaders
    ),
    {
      params: Promise.resolve({ departmentId: createdDepartmentId })
    } as RouteContext<{ departmentId: string }>
  );
  assert.equal(patchResponse.status, 200, "PATCH update department should return 200");
  const patchBody = await readJson<{
    department: { id: string; name: string };
  }>(patchResponse);
  assert.equal(patchBody.department.id, createdDepartmentId);
  assert.equal(patchBody.department.name, "Engineering Platform");

  const deleteNoEmployeeResponse = await departmentByIdRoute.DELETE(
    new Request(`http://localhost/api/people/departments/${createdDepartmentId}`, {
      method: "DELETE",
      headers: adminHeaders
    }),
    {
      params: Promise.resolve({ departmentId: createdDepartmentId })
    } as RouteContext<{ departmentId: string }>
  );
  assert.equal(deleteNoEmployeeResponse.status, 200, "DELETE department with no employees should return 200");

  const guardedDepartmentResponse = await departmentsRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/departments",
      {
        name: "People Ops"
      },
      adminHeaders
    )
  );
  assert.equal(guardedDepartmentResponse.status, 201, "guarded delete setup department create should return 201");
  const guardedDepartmentBody = await readJson<{
    department: { id: string };
  }>(guardedDepartmentResponse);
  const guardedDepartmentId = guardedDepartmentBody.department.id;

  const employeeCreateResponse = await employeesRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/employees",
      {
        id: "EMP-WI0938-1001",
        organizationId: organization.id,
        departmentId: guardedDepartmentId,
        name: "Guard Employee",
        email: "guard.wi0938@example.com"
      },
      adminHeaders
    )
  );
  assert.equal(employeeCreateResponse.status, 201, "employee creation for delete guard should succeed");

  const deleteWithEmployeeResponse = await departmentByIdRoute.DELETE(
    new Request(`http://localhost/api/people/departments/${guardedDepartmentId}`, {
      method: "DELETE",
      headers: adminHeaders
    }),
    {
      params: Promise.resolve({ departmentId: guardedDepartmentId })
    } as RouteContext<{ departmentId: string }>
  );
  assert.equal(deleteWithEmployeeResponse.status, 400, "DELETE with assigned employees should return 400");
  const deleteWithEmployeeBody = await readJson<{ error: string }>(deleteWithEmployeeResponse);
  assert.equal(
    deleteWithEmployeeBody.error,
    "Department has assigned employees",
    "guard should return expected error message"
  );

  const employeePostForbiddenResponse = await departmentsRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/departments",
      {
        name: "Employee Forbidden Department"
      },
      employeeHeaders
    )
  );
  assert.equal(employeePostForbiddenResponse.status, 403, "employee role should be forbidden from POST");

  const employeePatchForbiddenResponse = await departmentByIdRoute.PATCH(
    jsonRequest(
      "PATCH",
      `/api/people/departments/${guardedDepartmentId}`,
      {
        name: "Employee Forbidden Rename"
      },
      employeeHeaders
    ),
    {
      params: Promise.resolve({ departmentId: guardedDepartmentId })
    } as RouteContext<{ departmentId: string }>
  );
  assert.equal(employeePatchForbiddenResponse.status, 403, "employee role should be forbidden from PATCH");

  const employeeDeleteForbiddenResponse = await departmentByIdRoute.DELETE(
    new Request(`http://localhost/api/people/departments/${guardedDepartmentId}`, {
      method: "DELETE",
      headers: employeeHeaders
    }),
    {
      params: Promise.resolve({ departmentId: guardedDepartmentId })
    } as RouteContext<{ departmentId: string }>
  );
  assert.equal(employeeDeleteForbiddenResponse.status, 403, "employee role should be forbidden from DELETE");
}

run()
  .then(() => {
    console.log("e2e-wi0938-department-management.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
