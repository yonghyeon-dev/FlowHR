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
  const attendanceRoute = await import("../../src/app/api/attendance/records/route.ts");
  const anomalyCockpitRoute = await import("../../src/app/api/scheduling/anomalies/cockpit/route.ts");

  resetMemoryDataAccess();

  const orgResponse = await orgRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/organizations",
      { name: "Org-Anomaly-Cockpit" },
      actorHeaders("system", "SYS-1")
    )
  );
  assert.equal(orgResponse.status, 201);
  const orgBody = await readJson<{ organization: { id: string } }>(orgResponse);
  const organizationId = orgBody.organization.id;

  const employeeAId = "EMP-COCKPIT-001";
  const employeeBId = "EMP-COCKPIT-002";

  const employeeCreateA = await employeeRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/employees",
      { id: employeeAId, organizationId, name: "Cockpit Employee A" },
      actorHeaders("system", "SYS-1")
    )
  );
  assert.equal(employeeCreateA.status, 201);

  const employeeCreateB = await employeeRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/employees",
      { id: employeeBId, organizationId, name: "Cockpit Employee B" },
      actorHeaders("system", "SYS-1")
    )
  );
  assert.equal(employeeCreateB.status, 201);

  const managerHeaders = actorHeaders("manager", "MGR-COCKPIT-1", organizationId);
  const employeeHeaders = actorHeaders("employee", employeeAId, organizationId);

  const scheduleA1 = await scheduleRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/schedules",
      {
        employeeId: employeeAId,
        startAt: "2026-04-01T09:00:00+09:00",
        endAt: "2026-04-01T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      managerHeaders
    )
  );
  assert.equal(scheduleA1.status, 201);

  const scheduleA2 = await scheduleRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/schedules",
      {
        employeeId: employeeAId,
        startAt: "2026-04-02T09:00:00+09:00",
        endAt: "2026-04-02T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      managerHeaders
    )
  );
  assert.equal(scheduleA2.status, 201);

  const scheduleB1 = await scheduleRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/schedules",
      {
        employeeId: employeeBId,
        startAt: "2026-04-01T09:00:00+09:00",
        endAt: "2026-04-01T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      managerHeaders
    )
  );
  assert.equal(scheduleB1.status, 201);

  const attendanceB = await attendanceRoute.POST(
    jsonRequest(
      "POST",
      "/api/attendance/records",
      {
        employeeId: employeeBId,
        checkInAt: "2026-04-01T09:25:00+09:00",
        checkOutAt: "2026-04-01T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      managerHeaders
    )
  );
  assert.equal(attendanceB.status, 201);

  const cockpitResponse = await anomalyCockpitRoute.GET(
    new Request(
      "http://localhost/api/scheduling/anomalies/cockpit?from=2026-04-01T00:00:00+09:00&to=2026-04-03T00:00:00+09:00&lateThresholdMinutes=10&topN=2",
      {
        method: "GET",
        headers: managerHeaders
      }
    )
  );
  assert.equal(cockpitResponse.status, 200);

  const cockpitBody = await readJson<{
    report: {
      counts: {
        evaluatedSchedules: number;
        anomalies: number;
        late: number;
        noShow: number;
      };
      severities: {
        minor: number;
        major: number;
        critical: number;
      };
      employees: Array<{
        employeeId: string;
        anomalies: number;
        late: number;
        noShow: number;
        severity: "MINOR" | "MAJOR" | "CRITICAL";
      }>;
      queue: Array<{
        scheduleId: string;
        employeeId: string;
        anomalyType: "LATE" | "NO_SHOW";
        severity: "MINOR" | "MAJOR" | "CRITICAL";
        recommendedAction: string;
      }>;
    };
  }>(cockpitResponse);

  assert.equal(cockpitBody.report.counts.evaluatedSchedules, 3);
  assert.equal(cockpitBody.report.counts.anomalies, 3);
  assert.equal(cockpitBody.report.counts.late, 1);
  assert.equal(cockpitBody.report.counts.noShow, 2);

  assert.equal(cockpitBody.report.employees.length, 2);
  assert.equal(cockpitBody.report.employees[0].employeeId, employeeAId);
  assert.equal(cockpitBody.report.employees[0].severity, "CRITICAL");
  assert.equal(cockpitBody.report.employees[0].noShow, 2);

  const employeeBEntry = cockpitBody.report.employees.find((entry) => entry.employeeId === employeeBId);
  assert.ok(employeeBEntry);
  assert.equal(employeeBEntry?.severity, "MINOR");
  assert.equal(employeeBEntry?.late, 1);

  assert.equal(cockpitBody.report.queue.length, 2, "queue should respect topN filter");
  assert.equal(cockpitBody.report.queue[0].severity, "CRITICAL");
  assert.ok(cockpitBody.report.queue[0].recommendedAction.length > 0);

  assert.equal(cockpitBody.report.severities.critical, 1);
  assert.equal(cockpitBody.report.severities.minor, 1);

  const employeeDenied = await anomalyCockpitRoute.GET(
    new Request(
      "http://localhost/api/scheduling/anomalies/cockpit?from=2026-04-01T00:00:00+09:00&to=2026-04-03T00:00:00+09:00",
      {
        method: "GET",
        headers: employeeHeaders
      }
    )
  );
  assert.equal(employeeDenied.status, 403, "employee should not access anomaly cockpit endpoint");

  const auditActions = getMemoryAuditActions();
  assert.ok(auditActions.includes("scheduling.anomaly.cockpit.generated"));

  console.log("e2e-wi0065-scheduling-anomaly-cockpit-dashboard.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
