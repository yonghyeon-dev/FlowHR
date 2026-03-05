import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

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

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

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
  const pageSource = readUtf8("src", "app", "employee", "onboarding", "page.tsx");
  const employeeLayout = readUtf8("src", "app", "employee", "layout.tsx");
  const messages = readUtf8("src", "lib", "i18n", "messages.ts");
  const workItem = readUtf8("work-items", "WI-0966-employee-onboarding-checklist.md");

  assert.match(pageSource, /내 온보딩 체크리스트/);
  assert.match(pageSource, /api\/admin\/onboarding\/tasks\?employeeId=/);
  assert.match(pageSource, /status:\s*"COMPLETED"/);
  assert.match(pageSource, /진행률/);

  assert.match(employeeLayout, /href: "\/employee\/onboarding"/);
  assert.match(messages, /"employee\.nav\.onboardingChecklist": "온보딩 체크리스트"/);
  assert.match(messages, /"employee\.nav\.onboardingChecklist": "Onboarding Checklist"/);

  assert.match(workItem, /WI-0966/i);
  assert.match(workItem, /온보딩 체크리스트/);
  assert.match(workItem, /직원 본인/);

  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const onboardingTasksRoute = await import("../../src/app/api/admin/onboarding/tasks/route.ts");
  const onboardingTaskPatchRoute = await import("../../src/app/api/admin/onboarding/tasks/[taskId]/route.ts");

  resetMemoryDataAccess();

  const organization = await memoryDataAccess.organizations.create({ name: "WI-0966 Org" });
  const adminId = "ADM-WI0966-1001";
  const employeeA = "EMP-WI0966-1001";
  const employeeB = "EMP-WI0966-1002";
  await memoryDataAccess.employees.create({ id: employeeA, organizationId: organization.id });
  await memoryDataAccess.employees.create({ id: employeeB, organizationId: organization.id });

  const adminHeaders = actorHeaders("admin", adminId, organization.id);
  const employeeAHeaders = actorHeaders("employee", employeeA, organization.id);
  const employeeBHeaders = actorHeaders("employee", employeeB, organization.id);

  const createResponse = await onboardingTasksRoute.POST(
    jsonRequest("POST", "/api/admin/onboarding/tasks", { employeeId: employeeA }, adminHeaders)
  );
  assert.equal(createResponse.status, 201, "admin should create onboarding tasks");
  const createdBody = (await readJson(createResponse)) as {
    tasks: Array<{ id: string; employeeId: string; status: string }>;
  };
  assert.equal(createdBody.tasks.length, 5, "default onboarding task count should be 5");

  const firstTaskId = createdBody.tasks[0]?.id;
  assert.ok(firstTaskId, "created onboarding task should have id");

  const employeeOwnListResponse = await onboardingTasksRoute.GET(
    new Request(`http://localhost/api/admin/onboarding/tasks?employeeId=${encodeURIComponent(employeeA)}`, {
      method: "GET",
      headers: employeeAHeaders
    })
  );
  assert.equal(employeeOwnListResponse.status, 200, "employee should list own onboarding tasks");

  const employeeOwnPatchResponse = await onboardingTaskPatchRoute.PATCH(
    jsonRequest(
      "PATCH",
      `/api/admin/onboarding/tasks/${firstTaskId}`,
      { status: "COMPLETED" },
      employeeAHeaders
    ),
    { params: Promise.resolve({ taskId: firstTaskId }) } as RouteContext<{ taskId: string }>
  );
  assert.equal(employeeOwnPatchResponse.status, 200, "employee should complete own onboarding task");
  const employeeOwnPatchBody = (await readJson(employeeOwnPatchResponse)) as {
    task: { status: string };
  };
  assert.equal(employeeOwnPatchBody.task.status, "COMPLETED", "own task should become COMPLETED");

  const employeeOtherListDenied = await onboardingTasksRoute.GET(
    new Request(`http://localhost/api/admin/onboarding/tasks?employeeId=${encodeURIComponent(employeeB)}`, {
      method: "GET",
      headers: employeeAHeaders
    })
  );
  assert.equal(employeeOtherListDenied.status, 403, "employee should not list other employee tasks");

  const employeeOtherPatchDenied = await onboardingTaskPatchRoute.PATCH(
    jsonRequest(
      "PATCH",
      `/api/admin/onboarding/tasks/${firstTaskId}`,
      { status: "COMPLETED" },
      employeeBHeaders
    ),
    { params: Promise.resolve({ taskId: firstTaskId }) } as RouteContext<{ taskId: string }>
  );
  assert.equal(employeeOtherPatchDenied.status, 403, "employee should not update other employee task");

  const employeeCreateDenied = await onboardingTasksRoute.POST(
    jsonRequest("POST", "/api/admin/onboarding/tasks", { employeeId: employeeA }, employeeAHeaders)
  );
  assert.equal(employeeCreateDenied.status, 403, "employee should not create onboarding tasks");
}

run()
  .then(() => {
    console.log("e2e-wi0966-employee-onboarding-checklist.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
