import assert from "node:assert/strict";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "memory";
runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
runtimeEnv.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.DIRECT_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.FLOWHR_EVENT_PUBLISHER = "memory";

type RouteContext<TParams extends Record<string, string>> = {
  params: Promise<TParams>;
};

function actorHeaders(role: string, actorId: string) {
  return {
    "content-type": "application/json",
    "x-actor-role": role,
    "x-actor-id": actorId
  };
}

function jsonRequest(path: string, payload: Record<string, unknown>, headers: Record<string, string>) {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });
}

async function readJson<T>(response: Response) {
  return (await response.json()) as T;
}

async function run() {
  const employeeId = "EMP-CAPTURE-1001";

  const { memoryDataAccess, resetMemoryDataAccess, getMemoryAuditEntries } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const { resetRuntimeMemoryDomainEvents, getRuntimeMemoryDomainEvents } = await import(
    "../../src/features/shared/runtime-domain-event-publisher.ts"
  );
  const attendanceCreateRoute = await import("../../src/app/api/attendance/records/route.ts");
  const attendanceUpdateRoute = await import("../../src/app/api/attendance/records/[recordId]/route.ts");

  resetMemoryDataAccess();
  resetRuntimeMemoryDomainEvents();
  await memoryDataAccess.employees.create({ id: employeeId });

  const invalidGpsCreate = await attendanceCreateRoute.POST(
    jsonRequest(
      "/api/attendance/records",
      {
        employeeId,
        checkInAt: "2026-02-16T09:00:00+09:00",
        checkOutAt: "2026-02-16T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false,
        capture: {
          channel: "GPS",
          latitude: 37.5665
        }
      },
      actorHeaders("employee", employeeId)
    )
  );
  assert.equal(invalidGpsCreate.status, 400, "GPS without coordinate pair should be rejected");

  const createResponse = await attendanceCreateRoute.POST(
    jsonRequest(
      "/api/attendance/records",
      {
        employeeId,
        checkInAt: "2026-02-16T09:00:00+09:00",
        checkOutAt: "2026-02-16T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false,
        capture: {
          channel: "GPS",
          deviceId: "DEVICE-GPS-01",
          ipAddress: "203.0.113.10",
          latitude: 37.5665,
          longitude: 126.978,
          accuracyMeters: 12
        }
      },
      actorHeaders("employee", employeeId)
    )
  );
  assert.equal(createResponse.status, 201, "capture metadata attendance create should succeed");
  const createBody = await readJson<{
    record: {
      id: string;
      captureChannel: string;
      captureDeviceId: string | null;
      captureIpAddress: string | null;
      captureLatitude: number | null;
      captureLongitude: number | null;
      captureAccuracyMeters: number | null;
    };
  }>(createResponse);

  assert.equal(createBody.record.captureChannel, "GPS");
  assert.equal(createBody.record.captureDeviceId, "DEVICE-GPS-01");
  assert.equal(createBody.record.captureIpAddress, "203.0.113.10");
  assert.equal(createBody.record.captureLatitude, 37.5665);
  assert.equal(createBody.record.captureLongitude, 126.978);
  assert.equal(createBody.record.captureAccuracyMeters, 12);

  const invalidUpdateResponse = await attendanceUpdateRoute.PATCH(
    new Request(`http://localhost/api/attendance/records/${createBody.record.id}`, {
      method: "PATCH",
      headers: actorHeaders("employee", employeeId),
      body: JSON.stringify({
        capture: {
          latitude: 37.5
        }
      })
    }),
    { params: Promise.resolve({ recordId: createBody.record.id }) } as RouteContext<{ recordId: string }>
  );
  assert.equal(invalidUpdateResponse.status, 400, "partial coordinate update should be rejected");

  const updateResponse = await attendanceUpdateRoute.PATCH(
    new Request(`http://localhost/api/attendance/records/${createBody.record.id}`, {
      method: "PATCH",
      headers: actorHeaders("employee", employeeId),
      body: JSON.stringify({
        capture: {
          channel: "QR",
          deviceId: "QR-TERMINAL-01",
          ipAddress: null,
          latitude: null,
          longitude: null,
          accuracyMeters: null
        }
      })
    }),
    { params: Promise.resolve({ recordId: createBody.record.id }) } as RouteContext<{ recordId: string }>
  );
  assert.equal(updateResponse.status, 200, "capture metadata update should succeed");
  const updateBody = await readJson<{
    record: {
      captureChannel: string;
      captureDeviceId: string | null;
      captureIpAddress: string | null;
      captureLatitude: number | null;
      captureLongitude: number | null;
      captureAccuracyMeters: number | null;
    };
  }>(updateResponse);

  assert.equal(updateBody.record.captureChannel, "QR");
  assert.equal(updateBody.record.captureDeviceId, "QR-TERMINAL-01");
  assert.equal(updateBody.record.captureIpAddress, null);
  assert.equal(updateBody.record.captureLatitude, null);
  assert.equal(updateBody.record.captureLongitude, null);
  assert.equal(updateBody.record.captureAccuracyMeters, null);

  const auditEntries = getMemoryAuditEntries();
  const recordedAudit = auditEntries.find((entry) => entry.action === "attendance.recorded");
  assert.ok(recordedAudit, "attendance.recorded audit should exist");
  assert.deepEqual(recordedAudit?.payload, {
    employeeId,
    capture: {
      channel: "GPS",
      deviceId: "DEVICE-GPS-01",
      ipAddress: "203.0.113.10",
      latitude: 37.5665,
      longitude: 126.978,
      accuracyMeters: 12
    }
  });

  const correctedAudit = auditEntries.find((entry) => entry.action === "attendance.corrected");
  assert.ok(correctedAudit, "attendance.corrected audit should exist");

  const recordedEvent = getRuntimeMemoryDomainEvents().find(
    (event) => event.name === "attendance.recorded.v1" && event.entityId === createBody.record.id
  );
  assert.ok(recordedEvent, "attendance.recorded.v1 event should exist");
  assert.deepEqual(recordedEvent?.payload, {
    employeeId,
    capture: {
      channel: "GPS",
      deviceId: "DEVICE-GPS-01",
      ipAddress: "203.0.113.10",
      latitude: 37.5665,
      longitude: 126.978,
      accuracyMeters: 12
    }
  });
}

run()
  .then(() => {
    console.log("e2e-wi0048-attendance-capture-channel.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
