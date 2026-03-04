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
  const { resetMemoryDataAccess } = await import("../../src/features/shared/memory-data-access.ts");
  const orgRoute = await import("../../src/app/api/people/organizations/route.ts");
  const employeeRoute = await import("../../src/app/api/people/employees/route.ts");
  const employeeByIdRoute = await import("../../src/app/api/people/employees/[employeeId]/route.ts");

  resetMemoryDataAccess();

  const orgCreateResponse = await orgRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/organizations",
      { name: "FlowHR" },
      actorHeaders("admin", "ADMIN-1")
    )
  );
  assert.equal(orgCreateResponse.status, 201);
  const orgCreateBody = (await readJson(orgCreateResponse)) as { organization: { id: string } };
  const organizationId = orgCreateBody.organization.id;

  const employeeAResponse = await employeeRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/employees",
      {
        id: "EMP-9101",
        organizationId,
        name: "Kim",
        email: "kim@example.com",
        active: true
      },
      actorHeaders("admin", "ADMIN-1")
    )
  );
  assert.equal(employeeAResponse.status, 201);

  const employeeBResponse = await employeeRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/employees",
      {
        id: "EMP-9102",
        organizationId,
        name: "Lee",
        email: "lee@example.com",
        active: true
      },
      actorHeaders("admin", "ADMIN-1")
    )
  );
  assert.equal(employeeBResponse.status, 201);

  const selfPatchResponse = await employeeByIdRoute.PATCH(
    jsonRequest(
      "PATCH",
      "/api/people/employees/EMP-9101",
      {
        phone: "010-1234-5678",
        address: "Seoul"
      },
      actorHeaders("employee", "EMP-9101")
    ),
    { params: Promise.resolve({ employeeId: "EMP-9101" }) } as RouteContext<{ employeeId: string }>
  );
  assert.equal(selfPatchResponse.status, 200, "employee should update own phone/address");
  const selfPatchBody = (await readJson(selfPatchResponse)) as {
    employee: { id: string; phone?: string; address?: string };
  };
  assert.equal(selfPatchBody.employee.id, "EMP-9101");
  assert.equal(selfPatchBody.employee.phone, "010-1234-5678");
  assert.equal(selfPatchBody.employee.address, "Seoul");

  const otherEmployeePatchResponse = await employeeByIdRoute.PATCH(
    jsonRequest(
      "PATCH",
      "/api/people/employees/EMP-9102",
      {
        phone: "010-9999-9999"
      },
      actorHeaders("employee", "EMP-9101")
    ),
    { params: Promise.resolve({ employeeId: "EMP-9102" }) } as RouteContext<{ employeeId: string }>
  );
  assert.equal(otherEmployeePatchResponse.status, 403, "employee cannot update other employee profile");

  const restrictedFieldPatchResponse = await employeeByIdRoute.PATCH(
    jsonRequest(
      "PATCH",
      "/api/people/employees/EMP-9101",
      {
        departmentId: "DEPT-NEW"
      },
      actorHeaders("employee", "EMP-9101")
    ),
    { params: Promise.resolve({ employeeId: "EMP-9101" }) } as RouteContext<{ employeeId: string }>
  );
  assert.equal(
    restrictedFieldPatchResponse.status,
    403,
    "employee cannot update departmentId"
  );

  const adminPatchResponse = await employeeByIdRoute.PATCH(
    jsonRequest(
      "PATCH",
      "/api/people/employees/EMP-9102",
      {
        name: "Lee Updated",
        active: false
      },
      actorHeaders("admin", "ADMIN-1")
    ),
    { params: Promise.resolve({ employeeId: "EMP-9102" }) } as RouteContext<{ employeeId: string }>
  );
  assert.equal(adminPatchResponse.status, 200, "admin can update any employee");
  const adminPatchBody = (await readJson(adminPatchResponse)) as {
    employee: { id: string; name: string | null; active: boolean };
  };
  assert.equal(adminPatchBody.employee.id, "EMP-9102");
  assert.equal(adminPatchBody.employee.name, "Lee Updated");
  assert.equal(adminPatchBody.employee.active, false);

  console.log("e2e-wi0912-self-service-profile.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
