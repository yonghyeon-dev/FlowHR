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
  const previousAlertFlag = process.env.FLOWHR_SCHEDULING_ANOMALY_ALERTS_ENABLED;

  const { resetMemoryDataAccess, getMemoryAuditActions } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const { resetRuntimeMemoryDomainEvents, getRuntimeMemoryDomainEvents } = await import(
    "../../src/features/shared/runtime-domain-event-publisher.ts"
  );

  const orgRoute = await import("../../src/app/api/people/organizations/route.ts");
  const employeeRoute = await import("../../src/app/api/people/employees/route.ts");
  const scheduleRoute = await import("../../src/app/api/scheduling/schedules/route.ts");
  const anomalyRoute = await import("../../src/app/api/scheduling/anomalies/route.ts");

  try {
    resetMemoryDataAccess();
    resetRuntimeMemoryDomainEvents();

    const orgResponse = await orgRoute.POST(
      jsonRequest("POST", "/api/people/organizations", { name: "Org-Alert" }, actorHeaders("system", "SYS-1"))
    );
    assert.equal(orgResponse.status, 201);
    const orgBody = await readJson<{ organization: { id: string } }>(orgResponse);

    const employeeId = "EMP-ALERT-001";
    const employeeResponse = await employeeRoute.POST(
      jsonRequest(
        "POST",
        "/api/people/employees",
        { id: employeeId, organizationId: orgBody.organization.id, name: "Alert Employee" },
        actorHeaders("system", "SYS-1")
      )
    );
    assert.equal(employeeResponse.status, 201);

    const managerHeaders = actorHeaders("manager", "MGR-ALERT-1", orgBody.organization.id);

    const scheduleCreate = await scheduleRoute.POST(
      jsonRequest(
        "POST",
        "/api/scheduling/schedules",
        {
          employeeId,
          startAt: "2026-02-20T09:00:00+09:00",
          endAt: "2026-02-20T18:00:00+09:00",
          breakMinutes: 60,
          isHoliday: false
        },
        managerHeaders
      )
    );
    assert.equal(scheduleCreate.status, 201);

    process.env.FLOWHR_SCHEDULING_ANOMALY_ALERTS_ENABLED = "true";
    const anomalyWithAlert = await anomalyRoute.GET(
      new Request(
        `http://localhost/api/scheduling/anomalies?from=2026-02-20T00:00:00+09:00&to=2026-02-21T00:00:00+09:00&employeeId=${employeeId}`,
        {
          method: "GET",
          headers: managerHeaders
        }
      )
    );
    assert.equal(anomalyWithAlert.status, 200);
    const reportWithAlert = await readJson<{ report: { counts: { anomalies: number } } }>(anomalyWithAlert);
    assert.equal(reportWithAlert.report.counts.anomalies, 1, "expected NO_SHOW anomaly");

    const eventNamesWithAlert = getRuntimeMemoryDomainEvents().map((event) => event.name);
    assert.ok(
      eventNamesWithAlert.includes("scheduling.anomaly.detected.v1"),
      "alert-enabled anomaly report should emit scheduling.anomaly.detected.v1"
    );

    const auditActions = getMemoryAuditActions();
    assert.ok(auditActions.includes("scheduling.anomaly.report.generated"));
    assert.ok(auditActions.includes("scheduling.anomaly.alert.triggered"));

    resetRuntimeMemoryDomainEvents();
    process.env.FLOWHR_SCHEDULING_ANOMALY_ALERTS_ENABLED = "false";
    const anomalyWithoutAlert = await anomalyRoute.GET(
      new Request(
        `http://localhost/api/scheduling/anomalies?from=2026-02-20T00:00:00+09:00&to=2026-02-21T00:00:00+09:00&employeeId=${employeeId}`,
        {
          method: "GET",
          headers: managerHeaders
        }
      )
    );
    assert.equal(anomalyWithoutAlert.status, 200);

    const eventNamesWithoutAlert = getRuntimeMemoryDomainEvents().map((event) => event.name);
    assert.ok(
      !eventNamesWithoutAlert.includes("scheduling.anomaly.detected.v1"),
      "alert-disabled anomaly report should not emit scheduling.anomaly.detected.v1"
    );
  } finally {
    if (previousAlertFlag === undefined) {
      delete process.env.FLOWHR_SCHEDULING_ANOMALY_ALERTS_ENABLED;
    } else {
      process.env.FLOWHR_SCHEDULING_ANOMALY_ALERTS_ENABLED = previousAlertFlag;
    }
  }
}

run()
  .then(() => {
    console.log("e2e-wi0051-scheduling-anomaly-alert-automation.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
