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

function actorHeaders(role: string, actorId: string, organizationId?: string) {
  return {
    "content-type": "application/json",
    "x-actor-role": role,
    "x-actor-id": actorId,
    ...(organizationId ? { "x-actor-organization-id": organizationId } : {})
  };
}

function jsonRequest(
  method: string,
  path: string,
  payload: JsonPayload,
  headers: Record<string, string>
) {
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
  const noticesRoute = await import("../../src/app/api/notices/route.ts");

  resetMemoryDataAccess();

  const organization = await memoryDataAccess.organizations.create({ name: "WI-0908 Org" });
  const departmentA = await memoryDataAccess.departments.create({
    organizationId: organization.id,
    code: "DEPT-A",
    name: "Department A"
  });
  const departmentB = await memoryDataAccess.departments.create({
    organizationId: organization.id,
    code: "DEPT-B",
    name: "Department B"
  });

  const adminId = "ADM-WI0908-1";
  const employeeAId = "EMP-WI0908-A";
  const employeeBId = "EMP-WI0908-B";
  await memoryDataAccess.employees.create({
    id: employeeAId,
    organizationId: organization.id,
    departmentId: departmentA.id
  });
  await memoryDataAccess.employees.create({
    id: employeeBId,
    organizationId: organization.id,
    departmentId: departmentB.id
  });

  const adminHeaders = actorHeaders("admin", adminId, organization.id);
  const employeeAHeaders = actorHeaders("employee", employeeAId, organization.id);
  const employeeBHeaders = actorHeaders("employee", employeeBId, organization.id);

  const departmentTargetedResponse = await noticesRoute.POST(
    jsonRequest(
      "POST",
      "/api/notices",
      {
        organizationId: organization.id,
        title: "Dept A only notice",
        body: "This notice should be visible only to Department A.",
        audience: "employees",
        targetDepartmentIds: [departmentA.id],
        publishAt: "2026-01-01T00:00:00.000Z"
      },
      adminHeaders
    )
  );
  assert.equal(departmentTargetedResponse.status, 201, "admin should create department-targeted notice");
  const departmentTargetedBody = (await readJson(departmentTargetedResponse)) as {
    notice: { id: string; targetDepartmentIds: string[] };
  };
  assert.deepEqual(departmentTargetedBody.notice.targetDepartmentIds, [departmentA.id]);

  const employeeAListAfterTargeted = await noticesRoute.GET(
    new Request(`http://localhost/api/notices?organizationId=${encodeURIComponent(organization.id)}`, {
      method: "GET",
      headers: employeeAHeaders
    })
  );
  assert.equal(employeeAListAfterTargeted.status, 200);
  const employeeAListAfterTargetedBody = (await readJson(employeeAListAfterTargeted)) as {
    notices: Array<{ id: string }>;
  };
  assert.ok(
    employeeAListAfterTargetedBody.notices.some(
      (notice) => notice.id === departmentTargetedBody.notice.id
    ),
    "employee A should see department-targeted notice"
  );

  const employeeBListAfterTargeted = await noticesRoute.GET(
    new Request(`http://localhost/api/notices?organizationId=${encodeURIComponent(organization.id)}`, {
      method: "GET",
      headers: employeeBHeaders
    })
  );
  assert.equal(employeeBListAfterTargeted.status, 200);
  const employeeBListAfterTargetedBody = (await readJson(employeeBListAfterTargeted)) as {
    notices: Array<{ id: string }>;
  };
  assert.ok(
    employeeBListAfterTargetedBody.notices.every(
      (notice) => notice.id !== departmentTargetedBody.notice.id
    ),
    "employee B should not see department-targeted notice"
  );

  const globalNoticeResponse = await noticesRoute.POST(
    jsonRequest(
      "POST",
      "/api/notices",
      {
        organizationId: organization.id,
        title: "Global notice",
        body: "This notice should be visible to all departments.",
        audience: "employees",
        publishAt: "2026-01-01T00:00:00.000Z"
      },
      adminHeaders
    )
  );
  assert.equal(globalNoticeResponse.status, 201, "admin should create global notice");
  const globalNoticeBody = (await readJson(globalNoticeResponse)) as {
    notice: { id: string; targetDepartmentIds: string[] };
  };
  assert.deepEqual(globalNoticeBody.notice.targetDepartmentIds, []);

  const employeeAFinalList = await noticesRoute.GET(
    new Request(`http://localhost/api/notices?organizationId=${encodeURIComponent(organization.id)}`, {
      method: "GET",
      headers: employeeAHeaders
    })
  );
  assert.equal(employeeAFinalList.status, 200);
  const employeeAFinalBody = (await readJson(employeeAFinalList)) as {
    notices: Array<{ id: string }>;
  };
  assert.ok(
    employeeAFinalBody.notices.some((notice) => notice.id === globalNoticeBody.notice.id),
    "employee A should see global notice"
  );

  const employeeBFinalList = await noticesRoute.GET(
    new Request(`http://localhost/api/notices?organizationId=${encodeURIComponent(organization.id)}`, {
      method: "GET",
      headers: employeeBHeaders
    })
  );
  assert.equal(employeeBFinalList.status, 200);
  const employeeBFinalBody = (await readJson(employeeBFinalList)) as {
    notices: Array<{ id: string }>;
  };
  assert.ok(
    employeeBFinalBody.notices.some((notice) => notice.id === globalNoticeBody.notice.id),
    "employee B should see global notice"
  );
}

run()
  .then(() => {
    console.log("e2e-wi0908-notice-targeting.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
