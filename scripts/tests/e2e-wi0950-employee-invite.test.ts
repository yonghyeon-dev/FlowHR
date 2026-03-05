import assert from "node:assert/strict";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "memory";
runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
runtimeEnv.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.DIRECT_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";

type MockUser = {
  id: string;
  email: string;
  app_metadata: Record<string, unknown>;
  user_metadata: Record<string, unknown>;
  invited_at: string;
};

function actorHeaders(role: string, actorId: string, organizationId: string) {
  return {
    "content-type": "application/json",
    "x-actor-role": role,
    "x-actor-id": actorId,
    "x-actor-organization-id": organizationId
  };
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

function installSupabaseInviteFetchMock() {
  const originalFetch = globalThis.fetch;
  const usersByEmail = new Map<string, MockUser>();
  const usersById = new Map<string, MockUser>();
  let sequence = 1;

  const inviteCalls: Array<{
    email: string;
    data: Record<string, unknown>;
  }> = [];
  const updateCalls: Array<{
    userId: string;
    app_metadata: Record<string, unknown>;
  }> = [];

  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = resolveFetchUrl(input);
    const method = resolveFetchMethod(input, init);

    if ((url.pathname === "/auth/v1/invite" || url.pathname === "/auth/v1/admin/invite") && method === "POST") {
      const rawBody = resolveFetchBody(init);
      const payload = rawBody
        ? (JSON.parse(rawBody) as { email?: string; data?: Record<string, unknown> })
        : {};
      const email = (payload.email ?? "").trim().toLowerCase();
      if (!email) {
        return jsonResponse({ message: "email is required" }, 400);
      }
      inviteCalls.push({
        email,
        data: payload.data ?? {}
      });

      if (usersByEmail.has(email)) {
        return jsonResponse(
          {
            code: "email_exists",
            msg: "A user with this email address has already been registered"
          },
          422
        );
      }

      const user: MockUser = {
        id: `00000000-0000-4000-8000-${String(sequence).padStart(12, "0")}`,
        email,
        app_metadata: {},
        user_metadata: payload.data ?? {},
        invited_at: new Date().toISOString()
      };
      sequence += 1;
      usersByEmail.set(email, user);
      usersById.set(user.id, user);

      return jsonResponse({
        user
      });
    }

    const updateMatch = url.pathname.match(/^\/auth\/v1\/admin\/users\/([^/]+)$/);
    if (updateMatch && method === "PUT") {
      const userId = decodeURIComponent(updateMatch[1]);
      const user = usersById.get(userId);
      if (!user) {
        return jsonResponse({ message: "user not found" }, 404);
      }

      const rawBody = resolveFetchBody(init);
      const payload = rawBody ? (JSON.parse(rawBody) as { app_metadata?: Record<string, unknown> }) : {};
      user.app_metadata = payload.app_metadata ?? user.app_metadata;
      updateCalls.push({
        userId,
        app_metadata: user.app_metadata
      });

      return jsonResponse({
        user
      });
    }

    throw new Error(`unexpected fetch call in WI-0950 test: ${method} ${url.toString()}`);
  }) as typeof fetch;

  return {
    inviteCalls,
    updateCalls,
    restore() {
      globalThis.fetch = originalFetch;
    }
  };
}

async function run() {
  const { resetMemoryDataAccess } = await import("../../src/features/shared/memory-data-access.ts");
  const authInvitesRoute = await import("../../src/app/api/auth/invites/route.ts");
  const adminInvitesRoute = await import("../../src/app/api/admin/invites/route.ts");
  resetMemoryDataAccess();

  const organizationId = "ORG-WI0950-1001";
  const adminHeaders = actorHeaders("admin", "ADM-WI0950-1001", organizationId);
  const employeeHeaders = actorHeaders("employee", "EMP-WI0950-2001", organizationId);
  const fetchMock = installSupabaseInviteFetchMock();

  try {
    const inviteResponse = await authInvitesRoute.POST(
      new Request("http://localhost/api/auth/invites", {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({
          email: "employee.wi0950@example.com",
          name: "WI-0950 Employee",
          departmentId: "DEPT-WI0950-1001",
          positionId: "POS-WI0950-1001"
        })
      })
    );
    assert.equal(inviteResponse.status, 201, "admin invite should return 201");
    const inviteBody = await readJson<{
      id: string;
      email: string;
      invitedAt: string;
    }>(inviteResponse);
    assert.equal(inviteBody.email, "employee.wi0950@example.com");
    assert.ok(inviteBody.id, "invite response should include id");
    assert.ok(inviteBody.invitedAt, "invite response should include invitedAt");

    const duplicateResponse = await authInvitesRoute.POST(
      new Request("http://localhost/api/auth/invites", {
        method: "POST",
        headers: adminHeaders,
        body: JSON.stringify({
          email: "employee.wi0950@example.com"
        })
      })
    );
    assert.equal(duplicateResponse.status, 409, "duplicate email should return 409");

    const employeeInviteResponse = await authInvitesRoute.POST(
      new Request("http://localhost/api/auth/invites", {
        method: "POST",
        headers: employeeHeaders,
        body: JSON.stringify({
          email: "employee2.wi0950@example.com"
        })
      })
    );
    assert.equal(employeeInviteResponse.status, 403, "employee role should be forbidden from invite creation");

    const listResponse = await adminInvitesRoute.GET(
      new Request("http://localhost/api/admin/invites", {
        method: "GET",
        headers: adminHeaders
      })
    );
    assert.equal(listResponse.status, 200, "admin invite list should return 200");
    const listBody = await readJson<
      Array<{
        id: string;
        email: string;
        name: string | null;
        status: string;
        invitedAt: string;
      }>
    >(listResponse);
    const invitedEntry = listBody.find((item) => item.email === "employee.wi0950@example.com");
    assert.ok(invitedEntry, "list should include newly invited employee");
    assert.equal(invitedEntry?.status, "pending");
    assert.equal(invitedEntry?.name, "WI-0950 Employee");

    assert.equal(fetchMock.inviteCalls.length, 1, "supabase invite endpoint should be called once");
    assert.equal(fetchMock.inviteCalls[0].data.organizationId, organizationId);
    assert.equal(fetchMock.inviteCalls[0].data.role, "employee");
    assert.equal(fetchMock.updateCalls.length, 1, "supabase app metadata update should run once");
    assert.equal(fetchMock.updateCalls[0].app_metadata.organization_id, organizationId);
    assert.equal(fetchMock.updateCalls[0].app_metadata.role, "employee");
  } finally {
    fetchMock.restore();
  }
}

run()
  .then(() => {
    console.log("e2e-wi0950-employee-invite.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
