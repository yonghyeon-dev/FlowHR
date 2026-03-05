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
  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const onboardingTasksRoute = await import("../../src/app/api/admin/onboarding/tasks/route.ts");
  const employeeStatusRoute = await import("../../src/app/api/employees/[id]/status/route.ts");

  resetMemoryDataAccess();

  const organization = await memoryDataAccess.organizations.create({ name: "WI-0998 Org" });
  const adminId = "ADM-WI0998-1001";
  const employeeId = "EMP-WI0998-1001";
  await memoryDataAccess.employees.create({
    id: employeeId,
    organizationId: organization.id,
    status: "ON_LEAVE"
  });

  const adminHeaders = actorHeaders("admin", adminId, organization.id);
  const listBeforeActive = await onboardingTasksRoute.GET(
    new Request(`http://localhost/api/admin/onboarding/tasks?employeeId=${encodeURIComponent(employeeId)}`, {
      method: "GET",
      headers: adminHeaders
    })
  );
  assert.equal(listBeforeActive.status, 200, "admin should list employee onboarding tasks");
  const beforeBody = (await readJson(listBeforeActive)) as { tasks: Array<{ id: string }> };
  assert.equal(beforeBody.tasks.length, 0, "ON_LEAVE employee should not auto-receive onboarding tasks");

  const activateResponse = await employeeStatusRoute.PATCH(
    jsonRequest("PATCH", `/api/employees/${employeeId}/status`, { status: "ACTIVE" }, adminHeaders),
    { params: Promise.resolve({ id: employeeId }) } as RouteContext<{ id: string }>
  );
  assert.equal(activateResponse.status, 200, "admin should activate employee");

  const listAfterActive = await onboardingTasksRoute.GET(
    new Request(`http://localhost/api/admin/onboarding/tasks?employeeId=${encodeURIComponent(employeeId)}`, {
      method: "GET",
      headers: adminHeaders
    })
  );
  assert.equal(listAfterActive.status, 200, "admin should list onboarding tasks after activation");
  const afterBody = (await readJson(listAfterActive)) as {
    tasks: Array<{ title: string; status: "PENDING" | "COMPLETED" }>;
  };
  assert.equal(afterBody.tasks.length, 5, "ACTIVE employee should receive 5 default onboarding tasks");
  assert.ok(afterBody.tasks.every((task) => task.status === "PENDING"), "seeded tasks start as PENDING");

  const templates = await memoryDataAccess.onboardingTaskTemplates.list();
  assert.equal(templates.length, 5, "default onboarding task templates should be seeded");
}

run()
  .then(() => {
    console.log("e2e-wi0998-onboarding-default-tasks-seed.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
