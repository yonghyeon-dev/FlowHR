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
  const previousTicketFlag = process.env.FLOWHR_SCHEDULING_ANOMALY_TICKET_AUTOMATION_ENABLED;
  const previousTicketMinSeverity = process.env.FLOWHR_SCHEDULING_ANOMALY_TICKET_MIN_SEVERITY;
  const previousTicketMaxPerRun = process.env.FLOWHR_SCHEDULING_ANOMALY_TICKET_MAX_PER_RUN;

  const { resetMemoryDataAccess, getMemoryAuditActions, getMemoryAuditEntries } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const { resetRuntimeMemoryDomainEvents, getRuntimeMemoryDomainEvents } = await import(
    "../../src/features/shared/runtime-domain-event-publisher.ts"
  );

  const orgRoute = await import("../../src/app/api/people/organizations/route.ts");
  const employeeRoute = await import("../../src/app/api/people/employees/route.ts");
  const scheduleRoute = await import("../../src/app/api/scheduling/schedules/route.ts");
  const anomalyCockpitRoute = await import("../../src/app/api/scheduling/anomalies/cockpit/route.ts");

  try {
    resetMemoryDataAccess();
    resetRuntimeMemoryDomainEvents();

    const orgResponse = await orgRoute.POST(
      jsonRequest(
        "POST",
        "/api/people/organizations",
        { name: "Org-Ticket-Automation" },
        actorHeaders("system", "SYS-1")
      )
    );
    assert.equal(orgResponse.status, 201);
    const orgBody = await readJson<{ organization: { id: string } }>(orgResponse);
    const organizationId = orgBody.organization.id;

    const employeeAId = "EMP-TICKET-001";
    const employeeBId = "EMP-TICKET-002";

    const employeeCreateA = await employeeRoute.POST(
      jsonRequest(
        "POST",
        "/api/people/employees",
        { id: employeeAId, organizationId, name: "Ticket Employee A" },
        actorHeaders("system", "SYS-1")
      )
    );
    assert.equal(employeeCreateA.status, 201);

    const employeeCreateB = await employeeRoute.POST(
      jsonRequest(
        "POST",
        "/api/people/employees",
        { id: employeeBId, organizationId, name: "Ticket Employee B" },
        actorHeaders("system", "SYS-1")
      )
    );
    assert.equal(employeeCreateB.status, 201);

    const managerHeaders = actorHeaders("manager", "MGR-TICKET-1", organizationId);

    const scheduleCreateA1 = await scheduleRoute.POST(
      jsonRequest(
        "POST",
        "/api/scheduling/schedules",
        {
          employeeId: employeeAId,
          startAt: "2026-04-10T09:00:00+09:00",
          endAt: "2026-04-10T18:00:00+09:00",
          breakMinutes: 60,
          isHoliday: false
        },
        managerHeaders
      )
    );
    assert.equal(scheduleCreateA1.status, 201);

    const scheduleCreateA2 = await scheduleRoute.POST(
      jsonRequest(
        "POST",
        "/api/scheduling/schedules",
        {
          employeeId: employeeAId,
          startAt: "2026-04-11T09:00:00+09:00",
          endAt: "2026-04-11T18:00:00+09:00",
          breakMinutes: 60,
          isHoliday: false
        },
        managerHeaders
      )
    );
    assert.equal(scheduleCreateA2.status, 201);

    const scheduleCreateB1 = await scheduleRoute.POST(
      jsonRequest(
        "POST",
        "/api/scheduling/schedules",
        {
          employeeId: employeeBId,
          startAt: "2026-04-10T09:00:00+09:00",
          endAt: "2026-04-10T18:00:00+09:00",
          breakMinutes: 60,
          isHoliday: false
        },
        managerHeaders
      )
    );
    assert.equal(scheduleCreateB1.status, 201);

    process.env.FLOWHR_SCHEDULING_ANOMALY_TICKET_AUTOMATION_ENABLED = "true";
    process.env.FLOWHR_SCHEDULING_ANOMALY_TICKET_MIN_SEVERITY = "MAJOR";
    process.env.FLOWHR_SCHEDULING_ANOMALY_TICKET_MAX_PER_RUN = "1";

    const cockpitWithTicket = await anomalyCockpitRoute.GET(
      new Request(
        "http://localhost/api/scheduling/anomalies/cockpit?from=2026-04-10T00:00:00+09:00&to=2026-04-12T00:00:00+09:00&topN=10",
        {
          method: "GET",
          headers: managerHeaders
        }
      )
    );
    assert.equal(cockpitWithTicket.status, 200);

    const cockpitBody = await readJson<{
      report: {
        counts: {
          anomalies: number;
        };
      };
    }>(cockpitWithTicket);
    assert.equal(cockpitBody.report.counts.anomalies, 3, "expected NO_SHOW anomalies for all schedules");

    const eventsWithTicket = getRuntimeMemoryDomainEvents();
    const ticketEvent = eventsWithTicket.find((event) => event.name === "scheduling.anomaly.ticket.requested.v1");
    assert.ok(ticketEvent, "ticket automation should emit scheduling.anomaly.ticket.requested.v1");

    const ticketPayload = ticketEvent?.payload as
      | {
          minSeverity?: string;
          maxPerRun?: number;
          requestedCount?: number;
          tickets?: Array<{
            severity?: string;
          }>;
        }
      | undefined;
    assert.equal(ticketPayload?.minSeverity, "MAJOR");
    assert.equal(ticketPayload?.maxPerRun, 1);
    assert.equal(ticketPayload?.requestedCount, 1);
    assert.equal(ticketPayload?.tickets?.length, 1);
    assert.equal(ticketPayload?.tickets?.[0]?.severity, "CRITICAL");

    const auditActions = getMemoryAuditActions();
    assert.ok(auditActions.includes("scheduling.anomaly.cockpit.generated"));
    assert.ok(auditActions.includes("scheduling.anomaly.ticket.requested"));

    resetRuntimeMemoryDomainEvents();
    process.env.FLOWHR_SCHEDULING_ANOMALY_TICKET_AUTOMATION_ENABLED = "false";

    const cockpitWithoutTicket = await anomalyCockpitRoute.GET(
      new Request(
        "http://localhost/api/scheduling/anomalies/cockpit?from=2026-04-10T00:00:00+09:00&to=2026-04-12T00:00:00+09:00&topN=10",
        {
          method: "GET",
          headers: managerHeaders
        }
      )
    );
    assert.equal(cockpitWithoutTicket.status, 200);

    const eventNamesWithoutTicket = getRuntimeMemoryDomainEvents().map((event) => event.name);
    assert.ok(
      !eventNamesWithoutTicket.includes("scheduling.anomaly.ticket.requested.v1"),
      "ticket automation disabled should not emit scheduling.anomaly.ticket.requested.v1"
    );

    resetRuntimeMemoryDomainEvents();
    process.env.FLOWHR_SCHEDULING_ANOMALY_TICKET_AUTOMATION_ENABLED = "true";
    process.env.FLOWHR_SCHEDULING_ANOMALY_TICKET_MIN_SEVERITY = "INVALID";

    const cockpitWithInvalidConfig = await anomalyCockpitRoute.GET(
      new Request(
        "http://localhost/api/scheduling/anomalies/cockpit?from=2026-04-10T00:00:00+09:00&to=2026-04-12T00:00:00+09:00&topN=10",
        {
          method: "GET",
          headers: managerHeaders
        }
      )
    );
    assert.equal(cockpitWithInvalidConfig.status, 200, "invalid automation config must not break cockpit response");

    const eventNamesWithInvalidConfig = getRuntimeMemoryDomainEvents().map((event) => event.name);
    assert.ok(
      !eventNamesWithInvalidConfig.includes("scheduling.anomaly.ticket.requested.v1"),
      "invalid ticket config should not emit ticket request event"
    );

    const failedTicketAudit = getMemoryAuditEntries().find(
      (entry) => entry.action === "scheduling.anomaly.ticket.request.failed"
    );
    assert.ok(failedTicketAudit, "invalid ticket config should append failure audit log");
  } finally {
    if (previousTicketFlag === undefined) {
      delete process.env.FLOWHR_SCHEDULING_ANOMALY_TICKET_AUTOMATION_ENABLED;
    } else {
      process.env.FLOWHR_SCHEDULING_ANOMALY_TICKET_AUTOMATION_ENABLED = previousTicketFlag;
    }

    if (previousTicketMinSeverity === undefined) {
      delete process.env.FLOWHR_SCHEDULING_ANOMALY_TICKET_MIN_SEVERITY;
    } else {
      process.env.FLOWHR_SCHEDULING_ANOMALY_TICKET_MIN_SEVERITY = previousTicketMinSeverity;
    }

    if (previousTicketMaxPerRun === undefined) {
      delete process.env.FLOWHR_SCHEDULING_ANOMALY_TICKET_MAX_PER_RUN;
    } else {
      process.env.FLOWHR_SCHEDULING_ANOMALY_TICKET_MAX_PER_RUN = previousTicketMaxPerRun;
    }
  }
}

run()
  .then(() => {
    console.log("e2e-wi0067-scheduling-anomaly-cockpit-ticket-automation.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
