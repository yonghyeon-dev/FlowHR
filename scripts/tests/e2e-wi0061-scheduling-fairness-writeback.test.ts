import assert from "node:assert/strict";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "memory";
runtimeEnv.FLOWHR_EVENT_PUBLISHER = "memory";
runtimeEnv.FLOWHR_TENANCY_V1 = "true";
runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
runtimeEnv.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.DIRECT_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";

type JsonPayload = Record<string, unknown>;

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

async function readJson<T>(response: Response) {
  return (await response.json()) as T;
}

async function run() {
  const { resetMemoryDataAccess, getMemoryAuditActions } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const { resetRuntimeMemoryDomainEvents, getRuntimeMemoryDomainEvents } = await import(
    "../../src/features/shared/runtime-domain-event-publisher.ts"
  );

  const orgRoute = await import("../../src/app/api/people/organizations/route.ts");
  const employeeRoute = await import("../../src/app/api/people/employees/route.ts");
  const templateRoute = await import("../../src/app/api/scheduling/templates/route.ts");
  const scheduleRoute = await import("../../src/app/api/scheduling/schedules/route.ts");
  const fairnessApplyRoute = await import("../../src/app/api/scheduling/rotations/fairness/apply/route.ts");

  resetMemoryDataAccess();
  resetRuntimeMemoryDomainEvents();

  const orgResponse = await orgRoute.POST(
    jsonRequest("POST", "/api/people/organizations", { name: "Org-Fairness-Apply" }, actorHeaders("system", "SYS-1"))
  );
  assert.equal(orgResponse.status, 201);
  const orgBody = await readJson<{ organization: { id: string } }>(orgResponse);
  const organizationId = orgBody.organization.id;

  const employeeIdA = "EMP-FAIR-APPLY-001";
  const employeeIdB = "EMP-FAIR-APPLY-002";
  const employeeCreateA = await employeeRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/employees",
      { id: employeeIdA, organizationId, name: "Fairness Apply Employee A" },
      actorHeaders("system", "SYS-1")
    )
  );
  assert.equal(employeeCreateA.status, 201);
  const employeeCreateB = await employeeRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/employees",
      { id: employeeIdB, organizationId, name: "Fairness Apply Employee B" },
      actorHeaders("system", "SYS-1")
    )
  );
  assert.equal(employeeCreateB.status, 201);

  const managerHeaders = actorHeaders("manager", "MGR-FAIR-APPLY-1", organizationId);
  const employeeHeaders = actorHeaders("employee", employeeIdA, organizationId);

  const templateCreateA = await templateRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/templates",
      {
        name: "apply-long",
        startMinute: 540,
        endMinute: 1080,
        breakMinutes: 60,
        isHoliday: false,
        weekdays: [1, 2, 3, 4, 5]
      },
      managerHeaders
    )
  );
  assert.equal(templateCreateA.status, 201);
  const templateA = await readJson<{ template: { id: string } }>(templateCreateA);

  const templateCreateB = await templateRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/templates",
      {
        name: "apply-short",
        startMinute: 600,
        endMinute: 900,
        breakMinutes: 30,
        isHoliday: false,
        weekdays: [1, 2, 3, 4, 5]
      },
      managerHeaders
    )
  );
  assert.equal(templateCreateB.status, 201);
  const templateB = await readJson<{ template: { id: string } }>(templateCreateB);

  const applyResponse = await fairnessApplyRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/rotations/fairness/apply",
      {
        fromDate: "2026-03-16",
        toDate: "2026-03-20",
        templateIds: [templateA.template.id, templateB.template.id],
        employeeIds: [employeeIdA, employeeIdB]
      },
      managerHeaders
    )
  );
  assert.equal(applyResponse.status, 201);
  const applyBody = await readJson<{
    result: {
      employeeCount: number;
      appliedEmployeeCount: number;
      assignments: Array<{
        employeeId: string;
        createdScheduleIds: string[];
      }>;
      totals: {
        createdSchedules: number;
      };
    };
  }>(applyResponse);

  assert.equal(applyBody.result.employeeCount, 2);
  assert.equal(applyBody.result.appliedEmployeeCount, 2);
  assert.equal(applyBody.result.assignments.length, 2);
  assert.equal(applyBody.result.totals.createdSchedules, 10);
  for (const assignment of applyBody.result.assignments) {
    assert.ok([employeeIdA, employeeIdB].includes(assignment.employeeId));
    assert.equal(assignment.createdScheduleIds.length, 5);
  }

  const listA = await scheduleRoute.GET(
    new Request(
      `http://localhost/api/scheduling/schedules?from=2026-03-01T00:00:00+09:00&to=2026-03-31T23:59:59+09:00&employeeId=${employeeIdA}`,
      { method: "GET", headers: managerHeaders }
    )
  );
  assert.equal(listA.status, 200);
  const listABody = await readJson<{ schedules: Array<{ id: string }> }>(listA);
  assert.equal(listABody.schedules.length, 5);

  const listB = await scheduleRoute.GET(
    new Request(
      `http://localhost/api/scheduling/schedules?from=2026-03-01T00:00:00+09:00&to=2026-03-31T23:59:59+09:00&employeeId=${employeeIdB}`,
      { method: "GET", headers: managerHeaders }
    )
  );
  assert.equal(listB.status, 200);
  const listBBody = await readJson<{ schedules: Array<{ id: string }> }>(listB);
  assert.equal(listBBody.schedules.length, 5);

  const employeeDenied = await fairnessApplyRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/rotations/fairness/apply",
      {
        fromDate: "2026-03-16",
        toDate: "2026-03-20",
        templateIds: [templateA.template.id, templateB.template.id],
        employeeIds: [employeeIdA]
      },
      employeeHeaders
    )
  );
  assert.equal(employeeDenied.status, 403);

  const auditActions = getMemoryAuditActions();
  assert.ok(auditActions.includes("scheduling.rotation.fairness.report.generated"));
  assert.ok(auditActions.includes("scheduling.rotation.fairness.applied"));
  assert.ok(auditActions.includes("scheduling.rotation.assigned"));

  const runtimeEvents = getRuntimeMemoryDomainEvents().filter(
    (event) => event.name === "scheduling.rotation.assigned.v1"
  );
  assert.equal(runtimeEvents.length, 2, "apply path should emit one rotation.assigned event per employee");

  console.log("e2e-wi0061-scheduling-fairness-writeback.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
