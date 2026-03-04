import assert from "node:assert/strict";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "memory";
runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
runtimeEnv.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.DIRECT_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";

type JsonPayload = Record<string, unknown>;
type RouteContext<TParams extends Record<string, string>> = {
  params: Promise<TParams>;
};

type MockSupabaseUser = {
  id: string;
  app_metadata: Record<string, unknown>;
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

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json"
    }
  });
}

function resolveFetchUrl(input: RequestInfo | URL) {
  if (typeof input === "string") {
    return new URL(input);
  }
  if (input instanceof URL) {
    return input;
  }
  return new URL(input.url);
}

function resolveFetchMethod(input: RequestInfo | URL, init: RequestInit | undefined) {
  if (init?.method) {
    return init.method.toUpperCase();
  }
  if (input instanceof Request) {
    return input.method.toUpperCase();
  }
  return "GET";
}

function resolveFetchBody(init: RequestInit | undefined) {
  if (typeof init?.body === "string") {
    return init.body;
  }
  if (init?.body instanceof Uint8Array) {
    return new TextDecoder().decode(init.body);
  }
  return "";
}

function installSupabaseAdminFetchMock(users: MockSupabaseUser[]) {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = resolveFetchUrl(input);
    const method = resolveFetchMethod(input, init);

    if (url.pathname === "/auth/v1/admin/users" && method === "GET") {
      const pageValue = url.searchParams.get("page");
      const perPageValue = url.searchParams.get("perPage") ?? url.searchParams.get("per_page");
      const page = Number.isInteger(Number(pageValue)) && Number(pageValue) > 0 ? Number(pageValue) : 1;
      const perPage =
        Number.isInteger(Number(perPageValue)) && Number(perPageValue) > 0 ? Number(perPageValue) : 200;

      const total = users.length;
      const start = (page - 1) * perPage;
      const end = start + perPage;
      const pagedUsers = users.slice(start, end);
      const lastPage = Math.max(1, Math.ceil(total / perPage));
      const nextPage = page < lastPage ? page + 1 : null;

      return jsonResponse({
        users: pagedUsers,
        nextPage,
        lastPage,
        total
      });
    }

    const updateMatch = url.pathname.match(/^\/auth\/v1\/admin\/users\/([^/]+)$/);
    if (updateMatch && method === "PUT") {
      const targetUserId = decodeURIComponent(updateMatch[1]);
      const rawBody = resolveFetchBody(init);
      const payload = rawBody ? (JSON.parse(rawBody) as { app_metadata?: Record<string, unknown> }) : {};
      const targetIndex = users.findIndex((user) => user.id === targetUserId);
      if (targetIndex < 0) {
        return jsonResponse({ message: "user not found" }, 404);
      }
      users[targetIndex] = {
        ...users[targetIndex],
        app_metadata: payload.app_metadata ?? users[targetIndex].app_metadata
      };
      return jsonResponse({ user: users[targetIndex] });
    }

    throw new Error(`unexpected fetch call in WI-0934 test: ${method} ${url.toString()}`);
  }) as typeof fetch;

  return () => {
    globalThis.fetch = originalFetch;
  };
}

async function run() {
  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const employeeRolesRoute = await import("../../src/app/api/admin/employees/roles/route.ts");
  const employeeRoleRoute = await import("../../src/app/api/admin/employees/[employeeId]/role/route.ts");

  resetMemoryDataAccess();

  const organization = await memoryDataAccess.organizations.create({
    name: "WI-0934 Employee Role Assignment Org"
  });

  const engineering = await memoryDataAccess.departments.create({
    organizationId: organization.id,
    code: "ENG",
    name: "Engineering"
  });
  const people = await memoryDataAccess.departments.create({
    organizationId: organization.id,
    code: "HR",
    name: "People Ops"
  });

  await memoryDataAccess.employees.create({
    id: "EMP-WI0934-1001",
    organizationId: organization.id,
    departmentId: engineering.id,
    name: "Admin Employee",
    email: "admin.wi0934@example.com",
    active: true
  });
  await memoryDataAccess.employees.create({
    id: "EMP-WI0934-1002",
    organizationId: organization.id,
    departmentId: people.id,
    name: "Manager Employee",
    email: "manager.wi0934@example.com",
    active: true
  });
  await memoryDataAccess.employees.create({
    id: "EMP-WI0934-1003",
    organizationId: organization.id,
    name: "Employee Worker",
    email: "employee.wi0934@example.com",
    active: true
  });

  const mockUsers: MockSupabaseUser[] = [
    {
      id: "00000000-0000-4000-8000-000000000101",
      app_metadata: {
        organization_id: organization.id,
        actor_id: "EMP-WI0934-1001",
        role: "admin"
      }
    },
    {
      id: "00000000-0000-4000-8000-000000000102",
      app_metadata: {
        organization_id: organization.id,
        actor_id: "EMP-WI0934-1002",
        role: "manager"
      }
    },
    {
      id: "00000000-0000-4000-8000-000000000103",
      app_metadata: {
        organization_id: organization.id,
        actor_id: "EMP-WI0934-1003",
        role: "employee"
      }
    }
  ];

  const restoreFetch = installSupabaseAdminFetchMock(mockUsers);
  const adminHeaders = actorHeaders("admin", "EMP-WI0934-1001", organization.id);
  const employeeHeaders = actorHeaders("employee", "EMP-WI0934-1003", organization.id);

  try {
    const listResponse = await employeeRolesRoute.GET(
      new Request("http://localhost/api/admin/employees/roles", {
        method: "GET",
        headers: adminHeaders
      })
    );
    assert.equal(listResponse.status, 200, "admin should list employee roles");
    const listBody = await readJson<
      Array<{
        employeeId: string;
        name: string;
        email: string | null;
        currentRole: string | null;
        departmentName: string | null;
      }>
    >(listResponse);
    assert.equal(listBody.length, 3, "list should include all employees");

    const adminItem = listBody.find((item) => item.employeeId === "EMP-WI0934-1001");
    assert.ok(adminItem, "list should include admin employee");
    assert.equal(adminItem?.name, "Admin Employee");
    assert.equal(adminItem?.email, "admin.wi0934@example.com");
    assert.equal(adminItem?.currentRole, "admin");
    assert.equal(adminItem?.departmentName, "Engineering");

    const managerItem = listBody.find((item) => item.employeeId === "EMP-WI0934-1002");
    assert.ok(managerItem, "list should include manager employee");
    assert.equal(managerItem?.currentRole, "manager");
    assert.equal(managerItem?.departmentName, "People Ops");

    const updateResponse = await employeeRoleRoute.PATCH(
      jsonRequest(
        "PATCH",
        "/api/admin/employees/EMP-WI0934-1002/role",
        {
          role: "employee"
        },
        adminHeaders
      ),
      {
        params: Promise.resolve({ employeeId: "EMP-WI0934-1002" })
      } as RouteContext<{ employeeId: string }>
    );
    assert.equal(updateResponse.status, 200, "admin should update employee role");
    const updateBody = await readJson<{
      employeeId: string;
      name: string;
      email: string | null;
      currentRole: string | null;
      departmentName: string | null;
    }>(updateResponse);
    assert.equal(updateBody.employeeId, "EMP-WI0934-1002");
    assert.equal(updateBody.currentRole, "employee");
    assert.equal(updateBody.departmentName, "People Ops");

    assert.equal(
      mockUsers[1].app_metadata.role,
      "employee",
      "supabase app metadata role should be updated"
    );

    const listAfterUpdateResponse = await employeeRolesRoute.GET(
      new Request("http://localhost/api/admin/employees/roles", {
        method: "GET",
        headers: adminHeaders
      })
    );
    assert.equal(listAfterUpdateResponse.status, 200, "admin should list updated employee roles");
    const listAfterUpdateBody = await readJson<
      Array<{ employeeId: string; currentRole: string | null }>
    >(listAfterUpdateResponse);
    const updatedManager = listAfterUpdateBody.find((item) => item.employeeId === "EMP-WI0934-1002");
    assert.equal(updatedManager?.currentRole, "employee", "updated role should be reflected in list");

    const selfChangeResponse = await employeeRoleRoute.PATCH(
      jsonRequest(
        "PATCH",
        "/api/admin/employees/EMP-WI0934-1001/role",
        {
          role: "manager"
        },
        adminHeaders
      ),
      {
        params: Promise.resolve({ employeeId: "EMP-WI0934-1001" })
      } as RouteContext<{ employeeId: string }>
    );
    assert.equal(selfChangeResponse.status, 400, "admin self role change should be blocked");

    const employeeListDenied = await employeeRolesRoute.GET(
      new Request("http://localhost/api/admin/employees/roles", {
        method: "GET",
        headers: employeeHeaders
      })
    );
    assert.equal(employeeListDenied.status, 403, "employee role should be forbidden from list");

    const employeeUpdateDenied = await employeeRoleRoute.PATCH(
      jsonRequest(
        "PATCH",
        "/api/admin/employees/EMP-WI0934-1002/role",
        {
          role: "manager"
        },
        employeeHeaders
      ),
      {
        params: Promise.resolve({ employeeId: "EMP-WI0934-1002" })
      } as RouteContext<{ employeeId: string }>
    );
    assert.equal(employeeUpdateDenied.status, 403, "employee role should be forbidden from role update");
  } finally {
    restoreFetch();
  }
}

run()
  .then(() => {
    console.log("e2e-wi0934-role-assignment.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
