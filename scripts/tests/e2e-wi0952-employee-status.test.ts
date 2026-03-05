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

type RouteContext<TParams extends Record<string, string>> = {
  params: Promise<TParams>;
};

async function run() {
  const { resetMemoryDataAccess, memoryDataAccess } = await import("../../src/features/shared/memory-data-access.ts");
  const employeesRoute = await import("../../src/app/api/people/employees/route.ts");
  const employeesAliasRoute = await import("../../src/app/api/employees/route.ts");
  const employeeStatusRoute = await import("../../src/app/api/employees/[id]/status/route.ts");

  resetMemoryDataAccess();

  const organization = await memoryDataAccess.organizations.create({
    name: "WI-0952 Org"
  });
  const organizationId = organization.id;
  const adminHeaders = actorHeaders("admin", "ADM-WI0952-1001", organizationId);

  const createPrimaryResponse = await employeesRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/employees",
      {
        id: "EMP-WI0952-1001",
        organizationId,
        name: "Primary Employee"
      },
      adminHeaders
    )
  );
  assert.equal(createPrimaryResponse.status, 201, "employee create should succeed");

  const activeToOnLeave = await employeeStatusRoute.PATCH(
    jsonRequest(
      "PATCH",
      "/api/employees/EMP-WI0952-1001/status",
      {
        status: "ON_LEAVE",
        reason: "medical leave",
        effectiveDate: "2026-03-05"
      },
      adminHeaders
    ),
    { params: Promise.resolve({ id: "EMP-WI0952-1001" }) } as RouteContext<{ id: string }>
  );
  assert.equal(activeToOnLeave.status, 200, "ACTIVE -> ON_LEAVE should return 200");

  const onLeaveToActive = await employeeStatusRoute.PATCH(
    jsonRequest(
      "PATCH",
      "/api/employees/EMP-WI0952-1001/status",
      {
        status: "ACTIVE",
        reason: "returned",
        effectiveDate: "2026-03-06"
      },
      adminHeaders
    ),
    { params: Promise.resolve({ id: "EMP-WI0952-1001" }) } as RouteContext<{ id: string }>
  );
  assert.equal(onLeaveToActive.status, 200, "ON_LEAVE -> ACTIVE should return 200");

  const activeToResigned = await employeeStatusRoute.PATCH(
    jsonRequest(
      "PATCH",
      "/api/employees/EMP-WI0952-1001/status",
      {
        status: "RESIGNED",
        reason: "left company",
        effectiveDate: "2026-03-07"
      },
      adminHeaders
    ),
    { params: Promise.resolve({ id: "EMP-WI0952-1001" }) } as RouteContext<{ id: string }>
  );
  assert.equal(activeToResigned.status, 200, "ACTIVE -> RESIGNED should return 200");

  const resignedToActive = await employeeStatusRoute.PATCH(
    jsonRequest(
      "PATCH",
      "/api/employees/EMP-WI0952-1001/status",
      {
        status: "ACTIVE"
      },
      adminHeaders
    ),
    { params: Promise.resolve({ id: "EMP-WI0952-1001" }) } as RouteContext<{ id: string }>
  );
  assert.equal(resignedToActive.status, 400, "RESIGNED -> ACTIVE should return 400");
  const resignedToActiveBody = await readJson<{ error: string }>(resignedToActive);
  assert.equal(resignedToActiveBody.error, "cannot transition from RESIGNED");

  const createOnLeaveResponse = await employeesRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/employees",
      {
        id: "EMP-WI0952-1002",
        organizationId,
        name: "On Leave Employee",
        status: "ON_LEAVE"
      },
      adminHeaders
    )
  );
  assert.equal(createOnLeaveResponse.status, 201, "ON_LEAVE seed employee create should succeed");

  const createActiveResponse = await employeesRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/employees",
      {
        id: "EMP-WI0952-1003",
        organizationId,
        name: "Active Employee",
        status: "ACTIVE"
      },
      adminHeaders
    )
  );
  assert.equal(createActiveResponse.status, 201, "ACTIVE seed employee create should succeed");

  const statusFilteredList = await employeesAliasRoute.GET(
    new Request("http://localhost/api/employees?status=ON_LEAVE", {
      method: "GET",
      headers: adminHeaders
    })
  );
  assert.equal(statusFilteredList.status, 200, "list employees with status filter should return 200");
  const statusFilteredBody = await readJson<{
    employees: Array<{ id: string; status: "ACTIVE" | "ON_LEAVE" | "RESIGNED" }>;
  }>(statusFilteredList);
  assert.equal(statusFilteredBody.employees.length, 1, "ON_LEAVE filter should return one employee");
  assert.equal(statusFilteredBody.employees[0]?.id, "EMP-WI0952-1002");
  assert.equal(statusFilteredBody.employees[0]?.status, "ON_LEAVE");

  const invalidTransition = await employeeStatusRoute.PATCH(
    jsonRequest(
      "PATCH",
      "/api/employees/EMP-WI0952-1003/status",
      {
        status: "ACTIVE"
      },
      adminHeaders
    ),
    { params: Promise.resolve({ id: "EMP-WI0952-1003" }) } as RouteContext<{ id: string }>
  );
  assert.equal(invalidTransition.status, 400, "invalid transition should return 400");
  const invalidTransitionBody = await readJson<{ error: string }>(invalidTransition);
  assert.match(
    invalidTransitionBody.error,
    /invalid transition: ACTIVE -> ACTIVE/,
    "invalid transition should return a clear error message"
  );

  console.log("e2e-wi0952-employee-status.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
