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

  const orgRoute = await import("../../src/app/api/people/organizations/route.ts");
  const employeeRoute = await import("../../src/app/api/people/employees/route.ts");
  const scheduleRoute = await import("../../src/app/api/scheduling/schedules/route.ts");
  const templateRoute = await import("../../src/app/api/scheduling/templates/route.ts");
  const rotationOptimizeRoute = await import("../../src/app/api/scheduling/rotations/optimize/route.ts");

  resetMemoryDataAccess();

  const orgResponse = await orgRoute.POST(
    jsonRequest("POST", "/api/people/organizations", { name: "Org-Rotation-Optimize" }, actorHeaders("system", "SYS-1"))
  );
  assert.equal(orgResponse.status, 201);
  const orgBody = await readJson<{ organization: { id: string } }>(orgResponse);

  const employeeId = "EMP-ROT-OPT-001";
  const employeeCreate = await employeeRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/employees",
      { id: employeeId, organizationId: orgBody.organization.id, name: "Rotation Optimize Employee" },
      actorHeaders("system", "SYS-1")
    )
  );
  assert.equal(employeeCreate.status, 201);

  const managerHeaders = actorHeaders("manager", "MGR-ROT-OPT-1", orgBody.organization.id);

  const longTemplateCreate = await templateRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/templates",
      {
        name: "long-shift",
        startMinute: 540,
        endMinute: 1080,
        breakMinutes: 60,
        isHoliday: false,
        weekdays: [1, 2, 3, 4, 5]
      },
      managerHeaders
    )
  );
  assert.equal(longTemplateCreate.status, 201);
  const longTemplate = await readJson<{ template: { id: string } }>(longTemplateCreate);

  const shortTemplateCreate = await templateRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/templates",
      {
        name: "short-shift",
        startMinute: 600,
        endMinute: 900,
        breakMinutes: 30,
        isHoliday: false,
        weekdays: [1, 2, 3, 4, 5]
      },
      managerHeaders
    )
  );
  assert.equal(shortTemplateCreate.status, 201);
  const shortTemplate = await readJson<{ template: { id: string } }>(shortTemplateCreate);

  const existingSchedule = await scheduleRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/schedules",
      {
        employeeId,
        startAt: "2026-03-02T05:00:00+09:00",
        endAt: "2026-03-02T10:00:00+09:00",
        breakMinutes: 0,
        isHoliday: false
      },
      managerHeaders
    )
  );
  assert.equal(existingSchedule.status, 201);

  const optimizeDryRun = await rotationOptimizeRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/rotations/optimize",
      {
        employeeId,
        fromDate: "2026-03-02",
        toDate: "2026-03-06",
        templateIds: [longTemplate.template.id, shortTemplate.template.id],
        apply: false
      },
      managerHeaders
    )
  );
  assert.equal(optimizeDryRun.status, 201);
  const optimizeDryRunBody = await readJson<{
    result: {
      dryRun: boolean;
      recommendedStartOffset: number;
      optimizedTemplateIds: string[];
      matchedDates: string[];
      score: {
        weekdayGap: number;
        plannedMinutesGap: number;
        grade: string;
      };
      createdScheduleIds: string[];
    };
  }>(optimizeDryRun);
  assert.equal(optimizeDryRunBody.result.dryRun, true);
  assert.equal(optimizeDryRunBody.result.recommendedStartOffset, 1);
  assert.equal(optimizeDryRunBody.result.optimizedTemplateIds[0], shortTemplate.template.id);
  assert.equal(optimizeDryRunBody.result.matchedDates.length, 5);
  assert.equal(optimizeDryRunBody.result.score.weekdayGap, 1);
  assert.equal(optimizeDryRunBody.result.score.plannedMinutesGap, 300);
  assert.equal(optimizeDryRunBody.result.score.grade, "MODERATE");
  assert.equal(optimizeDryRunBody.result.createdScheduleIds.length, 0);

  const schedulesAfterDryRun = await scheduleRoute.GET(
    new Request(
      `http://localhost/api/scheduling/schedules?from=2026-03-01T00:00:00+09:00&to=2026-03-31T23:59:59+09:00&employeeId=${employeeId}`,
      { method: "GET", headers: managerHeaders }
    )
  );
  assert.equal(schedulesAfterDryRun.status, 200);
  const schedulesAfterDryRunBody = await readJson<{ schedules: Array<{ id: string }> }>(schedulesAfterDryRun);
  assert.equal(schedulesAfterDryRunBody.schedules.length, 1, "dry-run should not create schedules");

  const optimizeApply = await rotationOptimizeRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/rotations/optimize",
      {
        employeeId,
        fromDate: "2026-03-09",
        toDate: "2026-03-13",
        templateIds: [longTemplate.template.id, shortTemplate.template.id],
        apply: true
      },
      managerHeaders
    )
  );
  assert.equal(optimizeApply.status, 201);
  const optimizeApplyBody = await readJson<{
    result: {
      dryRun: boolean;
      matchedDates: string[];
      createdScheduleIds: string[];
    };
  }>(optimizeApply);
  assert.equal(optimizeApplyBody.result.dryRun, false);
  assert.equal(optimizeApplyBody.result.matchedDates.length, 5);
  assert.equal(optimizeApplyBody.result.createdScheduleIds.length, 5);

  const schedulesAfterApply = await scheduleRoute.GET(
    new Request(
      `http://localhost/api/scheduling/schedules?from=2026-03-01T00:00:00+09:00&to=2026-03-31T23:59:59+09:00&employeeId=${employeeId}`,
      { method: "GET", headers: managerHeaders }
    )
  );
  assert.equal(schedulesAfterApply.status, 200);
  const schedulesAfterApplyBody = await readJson<{ schedules: Array<{ id: string }> }>(schedulesAfterApply);
  assert.equal(schedulesAfterApplyBody.schedules.length, 6, "apply=true should create optimized schedules");

  const auditActions = getMemoryAuditActions();
  assert.ok(auditActions.includes("scheduling.rotation.optimization.generated"));
  assert.ok(auditActions.includes("scheduling.rotation.assigned"));

  console.log("e2e-wi0058-scheduling-rotation-optimization.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
