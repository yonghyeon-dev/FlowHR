import assert from "node:assert/strict";
import {
  getRuntimeDomainEventPublisher,
  resetRuntimeMemoryDomainEvents
} from "../../src/features/shared/runtime-domain-event-publisher.ts";

const ENV_KEYS = [
  "FLOWHR_EVENT_PUBLISHER",
  "FLOWHR_EVENT_HTTP_URL",
  "FLOWHR_EVENT_HTTP_TOKEN",
  "FLOWHR_EVENT_HTTP_TIMEOUT_MS",
  "FLOWHR_EVENT_HTTP_RETRY_COUNT",
  "FLOWHR_EVENT_HTTP_FAIL_OPEN"
] as const;

function setEnv(key: (typeof ENV_KEYS)[number], value: string | undefined) {
  if (value === undefined) {
    delete process.env[key];
    return;
  }
  process.env[key] = value;
}

async function run() {
  const before = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]])) as Record<
    (typeof ENV_KEYS)[number],
    string | undefined
  >;
  const originalFetch = globalThis.fetch;
  const originalConsoleError = console.error;

  try {
    // case 1: http transport success path
    const calls: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    globalThis.fetch = (async (input, init) => {
      calls.push({ input, init });
      return new Response(null, { status: 202 });
    }) as typeof fetch;

    setEnv("FLOWHR_EVENT_PUBLISHER", "http");
    setEnv("FLOWHR_EVENT_HTTP_URL", "https://events.example.internal/ingest");
    setEnv("FLOWHR_EVENT_HTTP_TOKEN", "token-123");
    setEnv("FLOWHR_EVENT_HTTP_TIMEOUT_MS", "1000");
    setEnv("FLOWHR_EVENT_HTTP_RETRY_COUNT", "0");
    setEnv("FLOWHR_EVENT_HTTP_FAIL_OPEN", "false");
    resetRuntimeMemoryDomainEvents();

    await getRuntimeDomainEventPublisher().publish({
      name: "attendance.recorded.v1",
      occurredAt: "2026-02-13T00:00:00.000Z",
      entityType: "AttendanceRecord",
      entityId: "AR-1",
      actorRole: "employee",
      actorId: "EMP-1",
      payload: { employeeId: "EMP-1" }
    });

    assert.equal(calls.length, 1, "http transport should send one request");
    assert.equal(String(calls[0].input), "https://events.example.internal/ingest");
    assert.equal(calls[0].init?.method, "POST");
    assert.equal(calls[0].init?.headers instanceof Object, true);

    // case 2: fail-open true should swallow errors
    globalThis.fetch = (async () => {
      throw new Error("network failure");
    }) as typeof fetch;

    setEnv("FLOWHR_EVENT_HTTP_FAIL_OPEN", "true");
    resetRuntimeMemoryDomainEvents();
    const failOpenErrors: string[] = [];
    console.error = ((message?: unknown) => {
      failOpenErrors.push(String(message ?? ""));
    }) as typeof console.error;
    await getRuntimeDomainEventPublisher().publish({
      name: "payroll.calculated.v1",
      occurredAt: "2026-02-13T00:00:00.000Z",
      entityType: "PayrollRun",
      entityId: "PR-1"
    });
    assert.equal(failOpenErrors.length, 1, "fail-open should log one delivery error");
    assert.match(failOpenErrors[0], /external event transport failed/);
    console.error = originalConsoleError;

    // case 3: fail-open false should throw
    setEnv("FLOWHR_EVENT_HTTP_FAIL_OPEN", "false");
    resetRuntimeMemoryDomainEvents();
    await assert.rejects(
      getRuntimeDomainEventPublisher().publish({
        name: "leave.approved.v1",
        occurredAt: "2026-02-13T00:00:00.000Z",
        entityType: "LeaveRequest",
        entityId: "LR-1"
      }),
      /external event transport failed/
    );
  } finally {
    for (const key of ENV_KEYS) {
      setEnv(key, before[key]);
    }
    globalThis.fetch = originalFetch;
    console.error = originalConsoleError;
    resetRuntimeMemoryDomainEvents();
  }
}

run()
  .then(() => {
    console.log("event-transport-http.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
