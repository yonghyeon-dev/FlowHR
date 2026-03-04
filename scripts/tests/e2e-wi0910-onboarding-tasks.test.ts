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
  const onboardingTaskPatchRoute = await import("../../src/app/api/admin/onboarding/tasks/[taskId]/route.ts");

  resetMemoryDataAccess();

  const organization = await memoryDataAccess.organizations.create({ name: "WI-0910 Org" });
  const employeeId = "EMP-WI0910-1001";
  const adminId = "ADM-WI0910-1001";
  await memoryDataAccess.employees.create({ id: employeeId, organizationId: organization.id });

  const adminHeaders = actorHeaders("admin", adminId, organization.id);
  const employeeHeaders = actorHeaders("employee", employeeId, organization.id);

  const createResponse = await onboardingTasksRoute.POST(
    jsonRequest("POST", "/api/admin/onboarding/tasks", { employeeId }, adminHeaders)
  );
  assert.equal(createResponse.status, 201, "admin onboarding task create should succeed");
  const createBody = (await readJson(createResponse)) as {
    tasks: Array<{ id: string; employeeId: string; title: string; status: string; createdAt: string }>;
  };
  assert.equal(createBody.tasks.length, 5, "post should create 5 default onboarding tasks");
  assert.ok(createBody.tasks.every((task) => task.id.length > 0), "each onboarding task must have id");
  assert.ok(
    createBody.tasks.every((task) => task.employeeId === employeeId),
    "each onboarding task should belong to requested employee"
  );
  assert.ok(
    createBody.tasks.every((task) => task.status === "PENDING"),
    "each onboarding task should start at PENDING"
  );

  const listResponse = await onboardingTasksRoute.GET(
    new Request(`http://localhost/api/admin/onboarding/tasks?employeeId=${encodeURIComponent(employeeId)}`, {
      method: "GET",
      headers: adminHeaders
    })
  );
  assert.equal(listResponse.status, 200, "admin onboarding task list should succeed");
  const listBody = (await readJson(listResponse)) as {
    tasks: Array<{ id: string; employeeId: string; title: string; status: string }>;
  };
  assert.equal(listBody.tasks.length, 5, "get should return 5 onboarding tasks");
  const firstTask = listBody.tasks[0];
  assert.ok(firstTask, "onboarding task list should not be empty");

  const patchResponse = await onboardingTaskPatchRoute.PATCH(
    jsonRequest("PATCH", `/api/admin/onboarding/tasks/${firstTask.id}`, { status: "COMPLETED" }, adminHeaders),
    { params: Promise.resolve({ taskId: firstTask.id }) } as RouteContext<{ taskId: string }>
  );
  assert.equal(patchResponse.status, 200, "admin onboarding task patch should succeed");
  const patchBody = (await readJson(patchResponse)) as {
    task: { id: string; employeeId: string; status: string };
  };
  assert.equal(patchBody.task.id, firstTask.id, "patched task id should match target task");
  assert.equal(patchBody.task.employeeId, employeeId, "patched task employeeId should be unchanged");
  assert.equal(patchBody.task.status, "COMPLETED", "patched task should move to COMPLETED");

  const employeeCreateDenied = await onboardingTasksRoute.POST(
    jsonRequest("POST", "/api/admin/onboarding/tasks", { employeeId }, employeeHeaders)
  );
  assert.equal(employeeCreateDenied.status, 403, "employee role should be forbidden for onboarding task create");

  const employeeListDenied = await onboardingTasksRoute.GET(
    new Request(`http://localhost/api/admin/onboarding/tasks?employeeId=${encodeURIComponent(employeeId)}`, {
      method: "GET",
      headers: employeeHeaders
    })
  );
  assert.equal(employeeListDenied.status, 403, "employee role should be forbidden for onboarding task list");

  const employeePatchDenied = await onboardingTaskPatchRoute.PATCH(
    jsonRequest(
      "PATCH",
      `/api/admin/onboarding/tasks/${firstTask.id}`,
      { status: "COMPLETED" },
      employeeHeaders
    ),
    { params: Promise.resolve({ taskId: firstTask.id }) } as RouteContext<{ taskId: string }>
  );
  assert.equal(employeePatchDenied.status, 403, "employee role should be forbidden for onboarding task patch");
}

run()
  .then(() => {
    console.log("e2e-wi0910-onboarding-tasks.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
