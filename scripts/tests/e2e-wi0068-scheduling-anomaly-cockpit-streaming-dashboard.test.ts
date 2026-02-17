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

type SseEvent = {
  event: string;
  data: string;
};

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

function parseSseEvents(raw: string) {
  const blocks = raw.split(/\r?\n\r?\n/g).filter((block) => block.trim().length > 0);
  const events: SseEvent[] = [];
  for (const block of blocks) {
    let eventName = "message";
    let data = "";
    for (const line of block.split(/\r?\n/g)) {
      if (line.startsWith("event:")) {
        eventName = line.slice("event:".length).trim();
        continue;
      }
      if (line.startsWith("data:")) {
        data += line.slice("data:".length).trim();
      }
    }
    events.push({ event: eventName, data });
  }
  return events;
}

async function run() {
  const previousTicketFlag = process.env.FLOWHR_SCHEDULING_ANOMALY_TICKET_AUTOMATION_ENABLED;
  const previousTicketMinSeverity = process.env.FLOWHR_SCHEDULING_ANOMALY_TICKET_MIN_SEVERITY;
  const previousTicketMaxPerRun = process.env.FLOWHR_SCHEDULING_ANOMALY_TICKET_MAX_PER_RUN;

  const { resetMemoryDataAccess, getMemoryAuditEntries } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const { resetRuntimeMemoryDomainEvents, getRuntimeMemoryDomainEvents } = await import(
    "../../src/features/shared/runtime-domain-event-publisher.ts"
  );

  const orgRoute = await import("../../src/app/api/people/organizations/route.ts");
  const employeeRoute = await import("../../src/app/api/people/employees/route.ts");
  const scheduleRoute = await import("../../src/app/api/scheduling/schedules/route.ts");
  const attendanceRoute = await import("../../src/app/api/attendance/records/route.ts");
  const anomalyCockpitStreamRoute = await import("../../src/app/api/scheduling/anomalies/cockpit/stream/route.ts");

  try {
    resetMemoryDataAccess();
    resetRuntimeMemoryDomainEvents();

    const orgResponse = await orgRoute.POST(
      jsonRequest(
        "POST",
        "/api/people/organizations",
        { name: "Org-Anomaly-Cockpit-Stream" },
        actorHeaders("system", "SYS-1")
      )
    );
    assert.equal(orgResponse.status, 201);
    const orgBody = await readJson<{ organization: { id: string } }>(orgResponse);
    const organizationId = orgBody.organization.id;

    const employeeAId = "EMP-STREAM-001";
    const employeeBId = "EMP-STREAM-002";

    const employeeCreateA = await employeeRoute.POST(
      jsonRequest(
        "POST",
        "/api/people/employees",
        { id: employeeAId, organizationId, name: "Stream Employee A" },
        actorHeaders("system", "SYS-1")
      )
    );
    assert.equal(employeeCreateA.status, 201);

    const employeeCreateB = await employeeRoute.POST(
      jsonRequest(
        "POST",
        "/api/people/employees",
        { id: employeeBId, organizationId, name: "Stream Employee B" },
        actorHeaders("system", "SYS-1")
      )
    );
    assert.equal(employeeCreateB.status, 201);

    const managerHeaders = actorHeaders("manager", "MGR-STREAM-1", organizationId);
    const employeeHeaders = actorHeaders("employee", employeeAId, organizationId);

    const scheduleA1 = await scheduleRoute.POST(
      jsonRequest(
        "POST",
        "/api/scheduling/schedules",
        {
          employeeId: employeeAId,
          startAt: "2026-04-20T09:00:00+09:00",
          endAt: "2026-04-20T18:00:00+09:00",
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
          startAt: "2026-04-21T09:00:00+09:00",
          endAt: "2026-04-21T18:00:00+09:00",
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
          startAt: "2026-04-20T09:00:00+09:00",
          endAt: "2026-04-20T18:00:00+09:00",
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
          checkInAt: "2026-04-20T09:25:00+09:00",
          checkOutAt: "2026-04-20T18:00:00+09:00",
          breakMinutes: 60,
          isHoliday: false
        },
        managerHeaders
      )
    );
    assert.equal(attendanceB.status, 201);

    process.env.FLOWHR_SCHEDULING_ANOMALY_TICKET_AUTOMATION_ENABLED = "true";
    process.env.FLOWHR_SCHEDULING_ANOMALY_TICKET_MIN_SEVERITY = "MINOR";
    process.env.FLOWHR_SCHEDULING_ANOMALY_TICKET_MAX_PER_RUN = "10";

    const streamResponse = await anomalyCockpitStreamRoute.GET(
      new Request(
        "http://localhost/api/scheduling/anomalies/cockpit/stream?from=2026-04-20T00:00:00+09:00&to=2026-04-22T00:00:00+09:00&lateThresholdMinutes=10&topN=2&intervalSeconds=0&sampleCount=2",
        {
          method: "GET",
          headers: managerHeaders
        }
      )
    );
    assert.equal(streamResponse.status, 200);
    assert.match(streamResponse.headers.get("content-type") ?? "", /text\/event-stream/);

    const streamText = await streamResponse.text();
    const events = parseSseEvents(streamText);
    const snapshotEvents = events.filter((event) => event.event === "cockpit-snapshot");
    assert.equal(snapshotEvents.length, 2, "expected two cockpit snapshots");

    const firstSnapshot = JSON.parse(snapshotEvents[0].data) as {
      sequence: number;
      sampleCount: number;
      report: {
        counts: {
          anomalies: number;
        };
        queue: unknown[];
      };
    };
    assert.equal(firstSnapshot.sequence, 1);
    assert.equal(firstSnapshot.sampleCount, 2);
    assert.equal(firstSnapshot.report.counts.anomalies, 3);
    assert.equal(firstSnapshot.report.queue.length, 2);

    const secondSnapshot = JSON.parse(snapshotEvents[1].data) as {
      sequence: number;
      sampleCount: number;
    };
    assert.equal(secondSnapshot.sequence, 2);
    assert.equal(secondSnapshot.sampleCount, 2);

    const streamEnd = events.find((event) => event.event === "stream-end");
    assert.ok(streamEnd, "expected stream-end event");

    const runtimeEvents = getRuntimeMemoryDomainEvents().map((event) => event.name);
    assert.ok(
      !runtimeEvents.includes("scheduling.anomaly.ticket.requested.v1"),
      "stream endpoint should suppress ticket request automation side-effects"
    );

    const auditEntries = getMemoryAuditEntries();
    const auditActions = auditEntries.map((entry) => entry.action);
    assert.ok(auditActions.includes("scheduling.anomaly.cockpit.stream.opened"));
    const cockpitGeneratedCount = auditActions.filter(
      (action) => action === "scheduling.anomaly.cockpit.generated"
    ).length;
    assert.ok(cockpitGeneratedCount >= 2, "expected cockpit.generated audit for each streamed snapshot");

    const employeeDenied = await anomalyCockpitStreamRoute.GET(
      new Request(
        "http://localhost/api/scheduling/anomalies/cockpit/stream?from=2026-04-20T00:00:00+09:00&to=2026-04-22T00:00:00+09:00&intervalSeconds=0&sampleCount=1",
        {
          method: "GET",
          headers: employeeHeaders
        }
      )
    );
    assert.equal(employeeDenied.status, 403, "employee should not access anomaly cockpit stream endpoint");

    const invalidQuery = await anomalyCockpitStreamRoute.GET(
      new Request(
        "http://localhost/api/scheduling/anomalies/cockpit/stream?from=2026-04-20T00:00:00+09:00&to=2026-04-22T00:00:00+09:00&sampleCount=0",
        {
          method: "GET",
          headers: managerHeaders
        }
      )
    );
    assert.equal(invalidQuery.status, 400, "sampleCount=0 should fail query validation");
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
    console.log("e2e-wi0068-scheduling-anomaly-cockpit-streaming-dashboard.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
