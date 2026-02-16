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

type FairnessResult = {
  employeeId: string;
  optimizedTemplateIds: string[];
  matchedDates: string[];
  recommendedStartOffset: number;
};

function calculateDailyGap(
  results: FairnessResult[],
  templatePlannedMinutesById: Map<string, number>
): number {
  const dailyTotals = new Map<string, number>();
  for (const result of results) {
    for (let index = 0; index < result.matchedDates.length; index += 1) {
      const date = result.matchedDates[index];
      const templateId = result.optimizedTemplateIds[index % result.optimizedTemplateIds.length];
      const plannedMinutes = templatePlannedMinutesById.get(templateId) ?? 0;
      dailyTotals.set(date, (dailyTotals.get(date) ?? 0) + plannedMinutes);
    }
  }

  const values = Array.from(dailyTotals.values());
  if (values.length === 0) {
    return 0;
  }
  return Math.max(...values) - Math.min(...values);
}

async function run() {
  const { resetMemoryDataAccess } = await import("../../src/features/shared/memory-data-access.ts");

  const orgRoute = await import("../../src/app/api/people/organizations/route.ts");
  const employeeRoute = await import("../../src/app/api/people/employees/route.ts");
  const templateRoute = await import("../../src/app/api/scheduling/templates/route.ts");
  const fairnessRoute = await import("../../src/app/api/scheduling/rotations/fairness/route.ts");
  const fairnessApplyRoute = await import("../../src/app/api/scheduling/rotations/fairness/apply/route.ts");

  resetMemoryDataAccess();

  const orgResponse = await orgRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/organizations",
      { name: "Org-Fairness-Global-Constraints" },
      actorHeaders("system", "SYS-1")
    )
  );
  assert.equal(orgResponse.status, 201);
  const orgBody = await readJson<{ organization: { id: string } }>(orgResponse);
  const organizationId = orgBody.organization.id;

  const employeeIds = ["EMP-FAIR-GLOBAL-001", "EMP-FAIR-GLOBAL-002", "EMP-FAIR-GLOBAL-003"];
  for (const employeeId of employeeIds) {
    const response = await employeeRoute.POST(
      jsonRequest(
        "POST",
        "/api/people/employees",
        { id: employeeId, organizationId, name: `Fairness Global ${employeeId}` },
        actorHeaders("system", "SYS-1")
      )
    );
    assert.equal(response.status, 201);
  }

  const managerHeaders = actorHeaders("manager", "MGR-FAIR-GLOBAL-1", organizationId);

  const longTemplateCreate = await templateRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/templates",
      {
        name: "global-long",
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
        name: "global-short",
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

  const templatePlannedMinutesById = new Map<string, number>([
    [longTemplate.template.id, 480],
    [shortTemplate.template.id, 270]
  ]);

  const basePayload = {
    fromDate: "2026-03-16",
    toDate: "2026-03-20",
    templateIds: [longTemplate.template.id, shortTemplate.template.id],
    employeeIds
  };

  const baselineReportResponse = await fairnessRoute.POST(
    jsonRequest("POST", "/api/scheduling/rotations/fairness", basePayload, managerHeaders)
  );
  assert.equal(baselineReportResponse.status, 200);
  const baselineBody = await readJson<{
    report: {
      global: null;
      results: FairnessResult[];
    };
  }>(baselineReportResponse);
  assert.equal(baselineBody.report.global, null);
  assert.ok(
    baselineBody.report.results.every((result) => result.recommendedStartOffset === 0),
    "without global constraints, tie should pick offset 0 for all employees"
  );

  const constrainedPayload = {
    ...basePayload,
    globalConstraints: {
      objective: "MINIMIZE_DAILY_PLANNED_MINUTES_GAP",
      maxDailyPlannedMinutesGap: 500
    }
  };

  const constrainedReportResponse = await fairnessRoute.POST(
    jsonRequest("POST", "/api/scheduling/rotations/fairness", constrainedPayload, managerHeaders)
  );
  assert.equal(constrainedReportResponse.status, 200);
  const constrainedBody = await readJson<{
    report: {
      global: {
        objective: string;
        dailyPlannedMinutesGap: number;
        maxDailyPlannedMinutesGap: number | null;
        thresholdBreached: boolean;
        dailyPlannedMinutes: Array<{ date: string; plannedMinutes: number }>;
      };
      results: FairnessResult[];
    };
  }>(constrainedReportResponse);

  assert.equal(constrainedBody.report.global.objective, "MINIMIZE_DAILY_PLANNED_MINUTES_GAP");
  assert.equal(constrainedBody.report.global.maxDailyPlannedMinutesGap, 500);
  assert.equal(constrainedBody.report.global.thresholdBreached, false);
  assert.ok(constrainedBody.report.global.dailyPlannedMinutesGap <= 500);
  assert.equal(constrainedBody.report.global.dailyPlannedMinutes.length, 5);

  const constrainedOffsets = new Set(
    constrainedBody.report.results.map((result) => result.recommendedStartOffset)
  );
  assert.ok(constrainedOffsets.size >= 2, "global constraints should diversify employee offsets");

  const baselineGap = calculateDailyGap(baselineBody.report.results, templatePlannedMinutesById);
  const constrainedGap = calculateDailyGap(constrainedBody.report.results, templatePlannedMinutesById);
  assert.ok(constrainedGap <= baselineGap, "global constraints should not worsen daily planned-minute gap");

  const applyResponse = await fairnessApplyRoute.POST(
    jsonRequest("POST", "/api/scheduling/rotations/fairness/apply", constrainedPayload, managerHeaders)
  );
  assert.equal(applyResponse.status, 201);
  const applyBody = await readJson<{
    result: {
      global: {
        dailyPlannedMinutesGap: number;
        thresholdBreached: boolean;
      };
      assignments: Array<{ employeeId: string; createdScheduleIds: string[] }>;
      totals: {
        createdSchedules: number;
      };
    };
  }>(applyResponse);

  assert.equal(applyBody.result.assignments.length, 3);
  assert.equal(applyBody.result.totals.createdSchedules, 15);
  for (const assignment of applyBody.result.assignments) {
    assert.equal(assignment.createdScheduleIds.length, 5);
  }
  assert.equal(applyBody.result.global.thresholdBreached, false);
  assert.ok(applyBody.result.global.dailyPlannedMinutesGap <= 500);

  const strictApplyResponse = await fairnessApplyRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/rotations/fairness/apply",
      {
        ...basePayload,
        globalConstraints: {
          objective: "MINIMIZE_DAILY_PLANNED_MINUTES_GAP",
          maxDailyPlannedMinutesGap: 200
        }
      },
      managerHeaders
    )
  );
  assert.equal(strictApplyResponse.status, 409);
  const strictApplyBody = await readJson<{ error: string }>(strictApplyResponse);
  assert.equal(strictApplyBody.error, "global fairness constraint threshold exceeded");

  console.log("e2e-wi0063-scheduling-global-fairness-constraints.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
