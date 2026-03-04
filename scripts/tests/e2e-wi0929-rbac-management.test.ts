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

function resolveFetchBody(input: RequestInfo | URL, init: RequestInit | undefined) {
  if (typeof init?.body === "string") {
    return init.body;
  }
  if (init?.body instanceof Uint8Array) {
    return new TextDecoder().decode(init.body);
  }
  if (input instanceof Request && input.bodyUsed === false) {
    return "";
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
      const rawBody = resolveFetchBody(input, init);
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

    throw new Error(`unexpected fetch call in WI-0929 test: ${method} ${url.toString()}`);
  }) as typeof fetch;

  return () => {
    globalThis.fetch = originalFetch;
  };
}

async function run() {
  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const rolesRoute = await import("../../src/app/api/admin/roles/route.ts");
  const roleDetailRoute = await import("../../src/app/api/admin/roles/[roleId]/route.ts");
  const roleAssignRoute = await import("../../src/app/api/admin/roles/assign/route.ts");
  const roleAssignmentsRoute = await import("../../src/app/api/admin/roles/assignments/route.ts");

  resetMemoryDataAccess();

  const organization = await memoryDataAccess.organizations.create({
    name: "WI-0929 RBAC Management Org"
  });
  const adminHeaders = actorHeaders("admin", "ADM-WI0929-1", organization.id);
  const employeeHeaders = actorHeaders("employee", "EMP-WI0929-1001", organization.id);

  await memoryDataAccess.employees.create({
    id: "EMP-WI0929-1001",
    organizationId: organization.id,
    name: "Employee WI0929",
    email: "employee.wi0929@example.com",
    active: true
  });
  await memoryDataAccess.employees.create({
    id: "EMP-WI0929-1002",
    organizationId: organization.id,
    name: "Employee WI0929 B",
    email: "employee.wi0929b@example.com",
    active: true
  });

  const mockUsers: MockSupabaseUser[] = [
    {
      id: "00000000-0000-4000-8000-000000000001",
      app_metadata: {
        organization_id: organization.id,
        actor_id: "EMP-WI0929-1001",
        role: "employee"
      }
    },
    {
      id: "00000000-0000-4000-8000-000000000002",
      app_metadata: {
        organization_id: organization.id,
        actor_id: "EMP-WI0929-1002",
        role: "employee"
      }
    }
  ];
  const restoreFetch = installSupabaseAdminFetchMock(mockUsers);

  try {
    const createRoleResponse = await rolesRoute.POST(
      jsonRequest(
        "POST",
        "/api/admin/roles",
        {
          name: "Team Lead",
          description: "Team lead role",
          permissions: ["leave.request.list.by_employee"]
        },
        adminHeaders
      )
    );
    assert.equal(createRoleResponse.status, 201, "admin should create role");
    const createRoleBody = await readJson<{
      role: {
        id: string;
        name: string;
        permissions: string[];
      };
    }>(createRoleResponse);
    assert.equal(createRoleBody.role.id, "team_lead");
    assert.equal(createRoleBody.role.name, "Team Lead");
    assert.deepEqual(createRoleBody.role.permissions, ["leave.request.list.by_employee"]);

    const listRolesResponse = await rolesRoute.GET(
      new Request("http://localhost/api/admin/roles", {
        method: "GET",
        headers: adminHeaders
      })
    );
    assert.equal(listRolesResponse.status, 200, "admin should list roles");
    const listRolesBody = await readJson<{
      roles: Array<{ id: string; permissions: string[] }>;
    }>(listRolesResponse);
    const createdRole = listRolesBody.roles.find((role) => role.id === "team_lead");
    assert.ok(createdRole, "list should include created role");
    assert.deepEqual(createdRole?.permissions, ["leave.request.list.by_employee"]);

    const updateRoleResponse = await roleDetailRoute.PATCH(
      jsonRequest(
        "PATCH",
        "/api/admin/roles/team_lead",
        {
          description: "Updated team lead role",
          permissions: ["leave.request.list.by_employee", "attendance.record.list.by_employee"]
        },
        adminHeaders
      ),
      {
        params: Promise.resolve({ roleId: "team_lead" })
      } as RouteContext<{ roleId: string }>
    );
    assert.equal(updateRoleResponse.status, 200, "admin should update role");
    const updateRoleBody = await readJson<{
      role: {
        id: string;
        description: string | null;
        permissions: string[];
      };
    }>(updateRoleResponse);
    assert.equal(updateRoleBody.role.id, "team_lead");
    assert.equal(updateRoleBody.role.description, "Updated team lead role");
    assert.deepEqual(updateRoleBody.role.permissions, [
      "attendance.record.list.by_employee",
      "leave.request.list.by_employee"
    ]);

    const assignRoleResponse = await roleAssignRoute.POST(
      jsonRequest(
        "POST",
        "/api/admin/roles/assign",
        {
          employeeId: "EMP-WI0929-1001",
          roleName: "team_lead"
        },
        adminHeaders
      )
    );
    assert.equal(assignRoleResponse.status, 200, "admin should assign role");
    const assignRoleBody = await readJson<{
      assignment: {
        employeeId: string;
        employeeName: string;
        currentRole: string | null;
      };
    }>(assignRoleResponse);
    assert.equal(assignRoleBody.assignment.employeeId, "EMP-WI0929-1001");
    assert.equal(assignRoleBody.assignment.currentRole, "team_lead");

    const assignmentListResponse = await roleAssignmentsRoute.GET(
      new Request("http://localhost/api/admin/roles/assignments", {
        method: "GET",
        headers: adminHeaders
      })
    );
    assert.equal(assignmentListResponse.status, 200, "admin should list role assignments");
    const assignmentListBody = await readJson<{
      assignments: Array<{
        employeeId: string;
        employeeName: string;
        currentRole: string | null;
      }>;
    }>(assignmentListResponse);
    const assigned = assignmentListBody.assignments.find(
      (item) => item.employeeId === "EMP-WI0929-1001"
    );
    assert.ok(assigned, "assignment list should include target employee");
    assert.equal(assigned?.employeeName, "Employee WI0929");
    assert.equal(assigned?.currentRole, "team_lead");

    const forbiddenList = await rolesRoute.GET(
      new Request("http://localhost/api/admin/roles", {
        method: "GET",
        headers: employeeHeaders
      })
    );
    assert.equal(forbiddenList.status, 403, "employee should be forbidden from role list");

    const forbiddenCreate = await rolesRoute.POST(
      jsonRequest(
        "POST",
        "/api/admin/roles",
        {
          name: "Nope",
          permissions: []
        },
        employeeHeaders
      )
    );
    assert.equal(forbiddenCreate.status, 403, "employee should be forbidden from role create");

    const forbiddenUpdate = await roleDetailRoute.PATCH(
      jsonRequest(
        "PATCH",
        "/api/admin/roles/team_lead",
        {
          description: "forbidden update"
        },
        employeeHeaders
      ),
      {
        params: Promise.resolve({ roleId: "team_lead" })
      } as RouteContext<{ roleId: string }>
    );
    assert.equal(forbiddenUpdate.status, 403, "employee should be forbidden from role update");

    const forbiddenAssign = await roleAssignRoute.POST(
      jsonRequest(
        "POST",
        "/api/admin/roles/assign",
        {
          employeeId: "EMP-WI0929-1001",
          roleName: "team_lead"
        },
        employeeHeaders
      )
    );
    assert.equal(forbiddenAssign.status, 403, "employee should be forbidden from role assign");

    const forbiddenAssignments = await roleAssignmentsRoute.GET(
      new Request("http://localhost/api/admin/roles/assignments", {
        method: "GET",
        headers: employeeHeaders
      })
    );
    assert.equal(forbiddenAssignments.status, 403, "employee should be forbidden from assignment list");
  } finally {
    restoreFetch();
  }
}

run()
  .then(() => {
    console.log("e2e-wi0929-rbac-management.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
