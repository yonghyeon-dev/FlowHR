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
  const { resetMemoryDataAccess } = await import("../../src/features/shared/memory-data-access.ts");

  const orgRoute = await import("../../src/app/api/people/organizations/route.ts");
  const employeeRoute = await import("../../src/app/api/people/employees/route.ts");
  const scheduleRoute = await import("../../src/app/api/scheduling/schedules/route.ts");
  const anomalyCockpitStreamRoute = await import("../../src/app/api/scheduling/anomalies/cockpit/stream/route.ts");

  resetMemoryDataAccess();

  const orgResponse = await orgRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/organizations",
      { name: "Org-Anomaly-Cockpit-Stream-Automation" },
      actorHeaders("system", "SYS-1")
    )
  );
  assert.equal(orgResponse.status, 201);
  const orgBody = await readJson<{ organization: { id: string } }>(orgResponse);
  const organizationId = orgBody.organization.id;

  const employeeAId = "EMP-STREAM-AUTO-001";
  const employeeBId = "EMP-STREAM-AUTO-002";

  const employeeCreateA = await employeeRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/employees",
      { id: employeeAId, organizationId, name: "Stream Auto Employee A" },
      actorHeaders("system", "SYS-1")
    )
  );
  assert.equal(employeeCreateA.status, 201);

  const employeeCreateB = await employeeRoute.POST(
    jsonRequest(
      "POST",
      "/api/people/employees",
      { id: employeeBId, organizationId, name: "Stream Auto Employee B" },
      actorHeaders("system", "SYS-1")
    )
  );
  assert.equal(employeeCreateB.status, 201);

  const managerHeaders = actorHeaders("manager", "MGR-STREAM-AUTO-1", organizationId);

  const scheduleA1 = await scheduleRoute.POST(
    jsonRequest(
      "POST",
      "/api/scheduling/schedules",
      {
        employeeId: employeeAId,
        startAt: "2026-04-25T09:00:00+09:00",
        endAt: "2026-04-25T18:00:00+09:00",
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
        startAt: "2026-04-26T09:00:00+09:00",
        endAt: "2026-04-26T18:00:00+09:00",
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
        startAt: "2026-04-25T09:00:00+09:00",
        endAt: "2026-04-25T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      managerHeaders
    )
  );
  assert.equal(scheduleB1.status, 201);

  const streamResponse = await anomalyCockpitStreamRoute.GET(
    new Request(
      "http://localhost/api/scheduling/anomalies/cockpit/stream?from=2026-04-25T00:00:00+09:00&to=2026-04-27T00:00:00+09:00&lateThresholdMinutes=10&topN=3&intervalSeconds=0&sampleCount=3&incidentAutomation=true&incidentSeverity=MINOR&incidentCooldownSeconds=3600",
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
  const incidentEvents = events.filter((event) => event.event === "incident-automation");
  const streamEnd = events.find((event) => event.event === "stream-end");

  assert.equal(snapshotEvents.length, 3, "expected three cockpit snapshots");
  assert.ok(streamEnd, "stream-end event should be present");
  assert.equal(
    incidentEvents.length,
    1,
    "incident automation should be rate-limited by cooldown across snapshots"
  );

  const incidentPayload = JSON.parse(incidentEvents[0].data) as {
    sequence: number;
    thresholdSeverity: string;
    matchedCount: number;
    recommendedAction: string;
    queue: unknown[];
  };
  assert.equal(incidentPayload.sequence, 1);
  assert.equal(incidentPayload.thresholdSeverity, "MINOR");
  assert.ok(incidentPayload.matchedCount > 0);
  assert.equal(incidentPayload.recommendedAction, "TRIGGER_TICKET_AUTOMATION");
  assert.ok(incidentPayload.queue.length > 0);

  console.log("e2e-wi0071-scheduling-anomaly-cockpit-stream-incident-automation.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
