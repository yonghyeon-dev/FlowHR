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

async function createSchedule(
  scheduleRoute: typeof import("../../src/app/api/scheduling/schedules/route.ts"),
  employeeId: string,
  startAt: string,
  endAt: string,
  headers: Record<string, string>
) {
  const response = await scheduleRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/schedules",
      {
        employeeId,
        startAt,
        endAt,
        breakMinutes: 30,
        isHoliday: false
      },
      headers
    )
  );
  assert.equal(response.status, 201);
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
  const scheduleRoute = await import("../../src/app/api/scheduling/schedules/route.ts");
  const templateRoute = await import("../../src/app/api/scheduling/templates/route.ts");
  const fairnessRoute = await import("../../src/app/api/scheduling/rotations/fairness/route.ts");

  resetMemoryDataAccess();
  resetRuntimeMemoryDomainEvents();

  const orgResponse = await orgRoute.POST(
    jsonRequest("POST", "/api/people/organizations", { name: "Org-Rotation-Fairness" }, actorHeaders("system", "SYS-1"))
  );
  assert.equal(orgResponse.status, 201);
  const orgBody = await readJson<{ organization: { id: string } }>(orgResponse);
  const organizationId = orgBody.organization.id;

  const employeeIdA = "EMP-ROT-FAIR-001";
  const employeeIdB = "EMP-ROT-FAIR-002";

  const employeeCreateA = await employeeRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/employees",
      { id: employeeIdA, organizationId, name: "Rotation Fairness Employee A" },
      actorHeaders("system", "SYS-1")
    )
  );
  assert.equal(employeeCreateA.status, 201);

  const employeeCreateB = await employeeRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/employees",
      { id: employeeIdB, organizationId, name: "Rotation Fairness Employee B" },
      actorHeaders("system", "SYS-1")
    )
  );
  assert.equal(employeeCreateB.status, 201);

  const managerHeaders = actorHeaders("manager", "MGR-ROT-FAIR-1", organizationId);
  const employeeHeaders = actorHeaders("employee", employeeIdA, organizationId);

  const longTemplateCreate = await templateRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/templates",
      {
        name: "fair-long",
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
        name: "fair-short",
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

  await createSchedule(
    scheduleRoute,
    employeeIdA,
    "2026-03-16T09:00:00+09:00",
    "2026-03-16T18:00:00+09:00",
    managerHeaders
  );
  await createSchedule(
    scheduleRoute,
    employeeIdA,
    "2026-03-17T09:00:00+09:00",
    "2026-03-17T18:00:00+09:00",
    managerHeaders
  );
  await createSchedule(
    scheduleRoute,
    employeeIdB,
    "2026-03-18T09:00:00+09:00",
    "2026-03-18T18:00:00+09:00",
    managerHeaders
  );

  resetRuntimeMemoryDomainEvents();

  const payload = {
    fromDate: "2026-03-16",
    toDate: "2026-03-20",
    templateIds: [longTemplate.template.id, shortTemplate.template.id],
    employeeIds: [employeeIdA, employeeIdB]
  };

  const fairnessResponse = await fairnessRoute.POST(
    jsonRequest("POST", "/api/scheduling/rotations/fairness", payload, managerHeaders)
  );
  assert.equal(fairnessResponse.status, 200);
  const fairnessBody = await readJson<{
    report: {
      organizationId: string;
      employeeCount: number;
      summary: {
        maxWeekdayGap: number;
        maxPlannedMinutesGap: number;
        avgWeekdayGap: number;
        avgPlannedMinutesGap: number;
        grade: string;
      };
      results: Array<{
        employeeId: string;
        recommendedStartOffset: number;
        optimizedTemplateIds: string[];
        matchedDates: string[];
        score: {
          weekdayGap: number;
          plannedMinutesGap: number;
          grade: string;
        };
      }>;
    };
  }>(fairnessResponse);

  assert.equal(fairnessBody.report.organizationId, organizationId);
  assert.equal(fairnessBody.report.employeeCount, 2);
  assert.equal(fairnessBody.report.results.length, 2);
  assert.ok(["BALANCED", "MODERATE", "IMBALANCED"].includes(fairnessBody.report.summary.grade));
  assert.ok(fairnessBody.report.summary.maxWeekdayGap >= 0);
  assert.ok(fairnessBody.report.summary.maxPlannedMinutesGap >= 0);
  assert.ok(fairnessBody.report.summary.avgWeekdayGap >= 0);
  assert.ok(fairnessBody.report.summary.avgPlannedMinutesGap >= 0);
  assert.ok(
    fairnessBody.report.results[0].score.plannedMinutesGap >= fairnessBody.report.results[1].score.plannedMinutesGap
  );

  for (const result of fairnessBody.report.results) {
    assert.ok([employeeIdA, employeeIdB].includes(result.employeeId));
    assert.ok(result.recommendedStartOffset >= 0);
    assert.equal(result.optimizedTemplateIds.length, 2);
    assert.equal(result.matchedDates.length, 5);
    assert.ok(["BALANCED", "MODERATE", "IMBALANCED"].includes(result.score.grade));
  }

  const fairnessResponseRepeat = await fairnessRoute.POST(
    jsonRequest("POST", "/api/scheduling/rotations/fairness", payload, managerHeaders)
  );
  assert.equal(fairnessResponseRepeat.status, 200);
  const fairnessBodyRepeat = await readJson<{ report: unknown }>(fairnessResponseRepeat);
  assert.deepEqual(fairnessBodyRepeat.report, fairnessBody.report, "fairness report should be deterministic");

  const missingEmployeeResponse = await fairnessRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/rotations/fairness",
      {
        fromDate: "2026-03-16",
        toDate: "2026-03-20",
        templateIds: [longTemplate.template.id, shortTemplate.template.id],
        employeeIds: [employeeIdA, "EMP-NOT-FOUND"]
      },
      managerHeaders
    )
  );
  assert.equal(missingEmployeeResponse.status, 404);

  const employeeDeniedResponse = await fairnessRoute.POST(
    jsonRequest("POST", "/api/scheduling/rotations/fairness", payload, employeeHeaders)
  );
  assert.equal(employeeDeniedResponse.status, 403);

  assert.equal(
    getRuntimeMemoryDomainEvents().length,
    0,
    "rotation fairness report should not publish domain events"
  );

  const auditActions = getMemoryAuditActions();
  assert.ok(auditActions.includes("scheduling.rotation.fairness.report.generated"));

  console.log("e2e-wi0059-scheduling-rotation-fairness.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
