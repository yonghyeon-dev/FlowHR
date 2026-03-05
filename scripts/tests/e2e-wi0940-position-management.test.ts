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
  const positionsRoute = await import("../../src/app/api/people/positions/route.ts");
  const positionByIdRoute = await import("../../src/app/api/people/positions/[positionId]/route.ts");
  const employeesRoute = await import("../../src/app/api/people/employees/route.ts");

  resetMemoryDataAccess();

  const organization = await memoryDataAccess.organizations.create({
    name: "WI-0940 Position Management Org"
  });

  const adminHeaders = actorHeaders("admin", "ADM-WI0940-1", organization.id);
  const employeeHeaders = actorHeaders("employee", "EMP-WI0940-9001", organization.id);

  const createResponse = await positionsRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/positions",
      {
        title: "Software Engineer",
        grade: 3,
        description: "Builds product features"
      },
      adminHeaders
    )
  );
  assert.equal(createResponse.status, 201, "POST create position should return 201");
  const createBody = await readJson<{
    position: {
      id: string;
      title: string;
      grade: number | null;
      description: string | null;
      name: string;
    };
  }>(createResponse);
  assert.equal(createBody.position.title, "Software Engineer");
  assert.equal(createBody.position.name, "Software Engineer");
  assert.equal(createBody.position.grade, 3);
  assert.equal(createBody.position.description, "Builds product features");
  const createdPositionId = createBody.position.id;

  const listResponse = await positionsRoute.GET(
    new Request(`http://localhost/api/people/positions?organizationId=${organization.id}`, {
      method: "GET",
      headers: adminHeaders
    })
  );
  assert.equal(listResponse.status, 200, "GET list positions should return 200");
  const listBody = await readJson<{
    positions: Array<{ id: string; title: string }>;
  }>(listResponse);
  assert.ok(
    listBody.positions.some(
      (position) => position.id === createdPositionId && position.title === "Software Engineer"
    ),
    "new position should be visible in list"
  );

  const patchResponse = await positionByIdRoute.PATCH(
    jsonRequest(
      "PATCH",
      `/api/people/positions/${createdPositionId}`,
      {
        title: "Senior Software Engineer",
        grade: 4,
        description: "Owns cross-team platform delivery"
      },
      adminHeaders
    ),
    {
      params: Promise.resolve({ positionId: createdPositionId })
    } as RouteContext<{ positionId: string }>
  );
  assert.equal(patchResponse.status, 200, "PATCH update position should return 200");
  const patchBody = await readJson<{
    position: { id: string; title: string; grade: number | null; description: string | null };
  }>(patchResponse);
  assert.equal(patchBody.position.id, createdPositionId);
  assert.equal(patchBody.position.title, "Senior Software Engineer");
  assert.equal(patchBody.position.grade, 4);
  assert.equal(patchBody.position.description, "Owns cross-team platform delivery");

  const deleteNoEmployeeResponse = await positionByIdRoute.DELETE(
    new Request(`http://localhost/api/people/positions/${createdPositionId}`, {
      method: "DELETE",
      headers: adminHeaders
    }),
    {
      params: Promise.resolve({ positionId: createdPositionId })
    } as RouteContext<{ positionId: string }>
  );
  assert.equal(deleteNoEmployeeResponse.status, 200, "DELETE position with no employees should return 200");

  const guardedPositionResponse = await positionsRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/positions",
      {
        title: "People Partner",
        grade: 2
      },
      adminHeaders
    )
  );
  assert.equal(guardedPositionResponse.status, 201, "guarded delete setup position create should return 201");
  const guardedPositionBody = await readJson<{
    position: { id: string };
  }>(guardedPositionResponse);
  const guardedPositionId = guardedPositionBody.position.id;

  const employeeCreateResponse = await employeesRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/employees",
      {
        id: "EMP-WI0940-1001",
        organizationId: organization.id,
        positionId: guardedPositionId,
        name: "Guard Employee",
        email: "guard.wi0940@example.com"
      },
      adminHeaders
    )
  );
  assert.equal(employeeCreateResponse.status, 201, "employee creation for delete guard should succeed");

  const deleteWithEmployeeResponse = await positionByIdRoute.DELETE(
    new Request(`http://localhost/api/people/positions/${guardedPositionId}`, {
      method: "DELETE",
      headers: adminHeaders
    }),
    {
      params: Promise.resolve({ positionId: guardedPositionId })
    } as RouteContext<{ positionId: string }>
  );
  assert.equal(deleteWithEmployeeResponse.status, 400, "DELETE with assigned employees should return 400");
  const deleteWithEmployeeBody = await readJson<{ error: string }>(deleteWithEmployeeResponse);
  assert.equal(
    deleteWithEmployeeBody.error,
    "Position has assigned employees",
    "guard should return expected error message"
  );

  const employeePostForbiddenResponse = await positionsRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/positions",
      {
        title: "Employee Forbidden Position"
      },
      employeeHeaders
    )
  );
  assert.equal(employeePostForbiddenResponse.status, 403, "employee role should be forbidden from POST");

  const employeePatchForbiddenResponse = await positionByIdRoute.PATCH(
    jsonRequest(
      "PATCH",
      `/api/people/positions/${guardedPositionId}`,
      {
        title: "Employee Forbidden Rename"
      },
      employeeHeaders
    ),
    {
      params: Promise.resolve({ positionId: guardedPositionId })
    } as RouteContext<{ positionId: string }>
  );
  assert.equal(employeePatchForbiddenResponse.status, 403, "employee role should be forbidden from PATCH");

  const employeeDeleteForbiddenResponse = await positionByIdRoute.DELETE(
    new Request(`http://localhost/api/people/positions/${guardedPositionId}`, {
      method: "DELETE",
      headers: employeeHeaders
    }),
    {
      params: Promise.resolve({ positionId: guardedPositionId })
    } as RouteContext<{ positionId: string }>
  );
  assert.equal(employeeDeleteForbiddenResponse.status, 403, "employee role should be forbidden from DELETE");
}

run()
  .then(() => {
    console.log("e2e-wi0940-position-management.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
