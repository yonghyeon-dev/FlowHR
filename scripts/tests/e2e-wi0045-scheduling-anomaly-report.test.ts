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

async function readJson(response: Response) {
  return (await response.json()) as unknown;
}

async function run() {
  const { resetMemoryDataAccess, getMemoryAuditActions } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );

  const orgRoute = await import("../../src/app/api/people/organizations/route.ts");
  const employeeRoute = await import("../../src/app/api/people/employees/route.ts");
  const scheduleRoute = await import("../../src/app/api/scheduling/schedules/route.ts");
  const attendanceRoute = await import("../../src/app/api/attendance/records/route.ts");
  const anomalyRoute = await import("../../src/app/api/scheduling/anomalies/route.ts");

  resetMemoryDataAccess();

  const orgAResponse = await orgRoute.POST(
    jsonRequest("POST", "/api/people/organizations", { name: "OrgA" }, actorHeaders("system", "SYS-1"))
  );
  assert.equal(orgAResponse.status, 201);
  const orgA = (await readJson(orgAResponse)) as { organization: { id: string } };
  assert.ok(orgA.organization.id);

  const orgBResponse = await orgRoute.POST(
    jsonRequest("POST", "/api/people/organizations", { name: "OrgB" }, actorHeaders("system", "SYS-1"))
  );
  assert.equal(orgBResponse.status, 201);
  const orgB = (await readJson(orgBResponse)) as { organization: { id: string } };
  assert.ok(orgB.organization.id);

  const employeeAId = "EMP-A1";
  const employeeBId = "EMP-B1";

  const employeeACreate = await employeeRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/employees",
      { id: employeeAId, organizationId: orgA.organization.id, name: "A1" },
      actorHeaders("system", "SYS-1")
    )
  );
  assert.equal(employeeACreate.status, 201);

  const employeeBCreate = await employeeRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/employees",
      { id: employeeBId, organizationId: orgB.organization.id, name: "B1" },
      actorHeaders("system", "SYS-1")
    )
  );
  assert.equal(employeeBCreate.status, 201);

  const managerOrgAHeaders = actorHeaders("manager", "MGR-A1", orgA.organization.id);
  const employeeOrgAHeaders = actorHeaders("employee", employeeAId, orgA.organization.id);

  const schedule1Create = await scheduleRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/schedules",
      {
        employeeId: employeeAId,
        startAt: "2026-02-16T09:00:00+09:00",
        endAt: "2026-02-16T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      managerOrgAHeaders
    )
  );
  assert.equal(schedule1Create.status, 201);
  const schedule1 = (await readJson(schedule1Create)) as { schedule: { id: string } };

  const schedule2Create = await scheduleRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/schedules",
      {
        employeeId: employeeAId,
        startAt: "2026-02-17T09:00:00+09:00",
        endAt: "2026-02-17T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      managerOrgAHeaders
    )
  );
  assert.equal(schedule2Create.status, 201);
  const schedule2 = (await readJson(schedule2Create)) as { schedule: { id: string } };

  const schedule3Create = await scheduleRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/schedules",
      {
        employeeId: employeeAId,
        startAt: "2026-02-18T09:00:00+09:00",
        endAt: "2026-02-18T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      managerOrgAHeaders
    )
  );
  assert.equal(schedule3Create.status, 201);
  const schedule3 = (await readJson(schedule3Create)) as { schedule: { id: string } };

  const attendanceLate = await attendanceRoute.POST(
    jsonRequest(
      "POST",
      "/api/attendance/records",
      {
        employeeId: employeeAId,
        checkInAt: "2026-02-16T09:20:00+09:00",
        checkOutAt: "2026-02-16T18:05:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      managerOrgAHeaders
    )
  );
  assert.equal(attendanceLate.status, 201);

  const attendanceOnTime = await attendanceRoute.POST(
    jsonRequest(
      "POST",
      "/api/attendance/records",
      {
        employeeId: employeeAId,
        checkInAt: "2026-02-18T08:55:00+09:00",
        checkOutAt: "2026-02-18T18:10:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      managerOrgAHeaders
    )
  );
  assert.equal(attendanceOnTime.status, 201);

  const managerAnomalyReport = await anomalyRoute.GET(
    new Request(
      `http://localhost/api/scheduling/anomalies?from=2026-02-16T00:00:00+09:00&to=2026-02-19T00:00:00+09:00&employeeId=${employeeAId}&lateThresholdMinutes=10`,
      {
        method: "GET",
        headers: managerOrgAHeaders
      }
    )
  );
  assert.equal(managerAnomalyReport.status, 200);
  const managerReportBody = (await readJson(managerAnomalyReport)) as {
    report: {
      counts: { evaluatedSchedules: number; anomalies: number; late: number; noShow: number };
      anomalies: Array<{
        scheduleId: string;
        anomalyType: "LATE" | "NO_SHOW";
        lateMinutes: number | null;
        attendanceRecordId: string | null;
      }>;
    };
  };
  assert.equal(managerReportBody.report.counts.evaluatedSchedules, 3);
  assert.equal(managerReportBody.report.counts.anomalies, 2);
  assert.equal(managerReportBody.report.counts.late, 1);
  assert.equal(managerReportBody.report.counts.noShow, 1);

  const lateAnomaly = managerReportBody.report.anomalies.find((item) => item.anomalyType === "LATE");
  assert.ok(lateAnomaly);
  assert.equal(lateAnomaly.scheduleId, schedule1.schedule.id);
  assert.equal(lateAnomaly.lateMinutes, 20);
  assert.ok(lateAnomaly.attendanceRecordId);

  const noShowAnomaly = managerReportBody.report.anomalies.find((item) => item.anomalyType === "NO_SHOW");
  assert.ok(noShowAnomaly);
  assert.equal(noShowAnomaly.scheduleId, schedule2.schedule.id);
  assert.equal(noShowAnomaly.lateMinutes, null);
  assert.equal(noShowAnomaly.attendanceRecordId, null);
  assert.ok(
    !managerReportBody.report.anomalies.some((item) => item.scheduleId === schedule3.schedule.id),
    "on-time schedule must not produce anomaly"
  );

  const managerMissingEmployeeId = await anomalyRoute.GET(
    new Request("http://localhost/api/scheduling/anomalies?from=2026-02-16T00:00:00+09:00&to=2026-02-19T00:00:00+09:00", {
      method: "GET",
      headers: managerOrgAHeaders
    })
  );
  assert.equal(managerMissingEmployeeId.status, 400, "manager query requires employeeId");

  const employeeOwnReport = await anomalyRoute.GET(
    new Request("http://localhost/api/scheduling/anomalies?from=2026-02-16T00:00:00+09:00&to=2026-02-19T00:00:00+09:00", {
      method: "GET",
      headers: employeeOrgAHeaders
    })
  );
  assert.equal(employeeOwnReport.status, 200, "employee can query own anomaly report");

  const employeeCrossTenantDenied = await anomalyRoute.GET(
    new Request(
      `http://localhost/api/scheduling/anomalies?from=2026-02-16T00:00:00+09:00&to=2026-02-19T00:00:00+09:00&employeeId=${employeeBId}`,
      {
        method: "GET",
        headers: employeeOrgAHeaders
      }
    )
  );
  assert.equal(employeeCrossTenantDenied.status, 404, "cross-tenant anomaly query should not leak employee existence");

  const auditActions = getMemoryAuditActions().filter((action) => action === "scheduling.anomaly.report.generated");
  assert.equal(auditActions.length, 2, "successful report queries should append audit logs");

  console.log("e2e-wi0045-scheduling-anomaly-report.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
