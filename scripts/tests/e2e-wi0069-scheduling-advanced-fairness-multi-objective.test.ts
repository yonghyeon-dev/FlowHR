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
  const { resetMemoryDataAccess } = await import("../../src/features/shared/memory-data-access.ts");

  const orgRoute = await import("../../src/app/api/people/organizations/route.ts");
  const employeeRoute = await import("../../src/app/api/people/employees/route.ts");
  const scheduleRoute = await import("../../src/app/api/scheduling/schedules/route.ts");
  const templateRoute = await import("../../src/app/api/scheduling/templates/route.ts");
  const fairnessRoute = await import("../../src/app/api/scheduling/rotations/fairness/route.ts");
  const fairnessApplyRoute = await import("../../src/app/api/scheduling/rotations/fairness/apply/route.ts");

  resetMemoryDataAccess();

  const orgResponse = await orgRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/organizations",
      { name: "Org-Fairness-Advanced-Multi-Objective" },
      actorHeaders("system", "SYS-1")
    )
  );
  assert.equal(orgResponse.status, 201);
  const orgBody = await readJson<{ organization: { id: string } }>(orgResponse);
  const organizationId = orgBody.organization.id;

  const employeeId = "EMP-FAIR-ADV-001";
  const employeeCreate = await employeeRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/employees",
      { id: employeeId, organizationId, name: "Fairness Advanced Employee" },
      actorHeaders("system", "SYS-1")
    )
  );
  assert.equal(employeeCreate.status, 201);

  const managerHeaders = actorHeaders("manager", "MGR-FAIR-ADV-1", organizationId);

  const dayTemplateCreate = await templateRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/templates",
      {
        name: "advanced-day",
        startMinute: 540,
        endMinute: 1080,
        breakMinutes: 60,
        isHoliday: false,
        weekdays: [1, 2, 3, 4, 5]
      },
      managerHeaders
    )
  );
  assert.equal(dayTemplateCreate.status, 201);
  const dayTemplate = await readJson<{ template: { id: string } }>(dayTemplateCreate);

  const nightTemplateCreate = await templateRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/templates",
      {
        name: "advanced-night",
        startMinute: 1320,
        endMinute: 360,
        breakMinutes: 60,
        isHoliday: false,
        weekdays: [1, 2, 3, 4, 5]
      },
      managerHeaders
    )
  );
  assert.equal(nightTemplateCreate.status, 201);
  const nightTemplate = await readJson<{ template: { id: string } }>(nightTemplateCreate);

  // Baseline schedule before fairness window to create first-day rest-time tradeoff.
  const priorSchedule = await scheduleRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/schedules",
      {
        employeeId,
        startAt: "2026-03-15T22:00:00+09:00",
        endAt: "2026-03-16T06:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      managerHeaders
    )
  );
  assert.equal(priorSchedule.status, 201);

  const basePayload = {
    organizationId,
    fromDate: "2026-03-16",
    toDate: "2026-03-20",
    templateIds: [dayTemplate.template.id, nightTemplate.template.id],
    employeeIds: [employeeId]
  };

  const preferenceHeavyPayload = {
    ...basePayload,
    advancedConstraints: {
      preference: {
        weight: 100,
        rules: [
          {
            employeeId,
            preferredTemplateIds: [dayTemplate.template.id]
          }
        ]
      },
      laborLaw: {
        weight: 1,
        minRestMinutesBetweenShifts: 600
      }
    }
  };

  const laborHeavyPayload = {
    ...basePayload,
    advancedConstraints: {
      preference: {
        weight: 1,
        rules: [
          {
            employeeId,
            preferredTemplateIds: [dayTemplate.template.id]
          }
        ]
      },
      laborLaw: {
        weight: 100,
        minRestMinutesBetweenShifts: 600
      }
    }
  };

  const preferenceHeavyResponse = await fairnessRoute.POST(
    jsonRequest("POST", "/api/scheduling/rotations/fairness", preferenceHeavyPayload, managerHeaders)
  );
  assert.equal(preferenceHeavyResponse.status, 200);
  const preferenceHeavyBody = await readJson<{
    report: {
      advanced: {
        enabled: boolean;
        preferenceWeight: number | null;
        laborLawWeight: number | null;
        totalPreferencePenalty: number;
        totalLaborLawPenalty: number;
        totalPenalty: number;
      } | null;
      results: Array<{
        employeeId: string;
        recommendedStartOffset: number;
        advancedScore: {
          preferencePenalty: number;
          laborLawPenalty: number;
          totalPenalty: number;
          preferenceMismatchCount: number;
          minRestViolationCount: number;
        } | null;
      }>;
    };
  }>(preferenceHeavyResponse);

  assert.equal(preferenceHeavyBody.report.results.length, 1);
  const preferenceHeavyResult = preferenceHeavyBody.report.results[0];
  assert.equal(preferenceHeavyResult.employeeId, employeeId);
  assert.equal(preferenceHeavyResult.recommendedStartOffset, 0);
  assert.ok(preferenceHeavyResult.advancedScore);
  assert.equal(preferenceHeavyBody.report.advanced?.enabled, true);
  assert.equal(preferenceHeavyBody.report.advanced?.preferenceWeight, 100);
  assert.equal(preferenceHeavyBody.report.advanced?.laborLawWeight, 1);

  const laborHeavyResponse = await fairnessRoute.POST(
    jsonRequest("POST", "/api/scheduling/rotations/fairness", laborHeavyPayload, managerHeaders)
  );
  assert.equal(laborHeavyResponse.status, 200);
  const laborHeavyBody = await readJson<{
    report: {
      advanced: {
        enabled: boolean;
        totalPenalty: number;
      } | null;
      results: Array<{
        employeeId: string;
        recommendedStartOffset: number;
        advancedScore: {
          preferencePenalty: number;
          laborLawPenalty: number;
          totalPenalty: number;
          preferenceMismatchCount: number;
          minRestViolationCount: number;
        } | null;
      }>;
    };
  }>(laborHeavyResponse);

  assert.equal(laborHeavyBody.report.results.length, 1);
  const laborHeavyResult = laborHeavyBody.report.results[0];
  assert.equal(laborHeavyResult.employeeId, employeeId);
  assert.equal(laborHeavyResult.recommendedStartOffset, 1);
  assert.ok(laborHeavyResult.advancedScore);
  assert.equal(laborHeavyBody.report.advanced?.enabled, true);
  assert.ok(
    (laborHeavyResult.advancedScore?.minRestViolationCount ?? 99) <
      (preferenceHeavyResult.advancedScore?.minRestViolationCount ?? 0),
    "labor-heavy objective should choose option with fewer minRest violations"
  );

  const applyResponse = await fairnessApplyRoute.POST(
    jsonRequest("POST", "/api/scheduling/rotations/fairness/apply", laborHeavyPayload, managerHeaders)
  );
  assert.equal(applyResponse.status, 201);
  const applyBody = await readJson<{
    result: {
      appliedEmployeeCount: number;
      assignments: Array<{ employeeId: string; createdScheduleIds: string[] }>;
      totals: { createdSchedules: number };
      advanced: {
        enabled: boolean;
        totalPenalty: number;
      } | null;
    };
  }>(applyResponse);
  assert.equal(applyBody.result.appliedEmployeeCount, 1);
  assert.equal(applyBody.result.assignments.length, 1);
  assert.equal(applyBody.result.assignments[0].employeeId, employeeId);
  assert.equal(applyBody.result.assignments[0].createdScheduleIds.length, 5);
  assert.equal(applyBody.result.totals.createdSchedules, 5);
  assert.equal(applyBody.result.advanced?.enabled, true);

  const invalidPreferenceTemplateResponse = await fairnessRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/rotations/fairness",
      {
        ...basePayload,
        advancedConstraints: {
          preference: {
            weight: 50,
            rules: [
              {
                employeeId,
                preferredTemplateIds: ["WST-NOT-IN-SCOPE"]
              }
            ]
          }
        }
      },
      managerHeaders
    )
  );
  assert.equal(invalidPreferenceTemplateResponse.status, 404);

  console.log("e2e-wi0069-scheduling-advanced-fairness-multi-objective.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
