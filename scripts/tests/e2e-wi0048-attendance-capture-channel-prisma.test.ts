import assert from "node:assert/strict";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "prisma";
runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";

if (!runtimeEnv.DATABASE_URL || !runtimeEnv.DIRECT_URL) {
  console.error("DATABASE_URL and DIRECT_URL are required for Prisma e2e test.");
  process.exit(1);
}

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
  const startedAt = new Date();
  const nowTag = `${Date.now()}`;
  const employeeId = `E2E-CAPTURE-EMP-${nowTag}`;
  const markerNote = `e2e-wi0048-${nowTag}`;

  const { prisma } = await import("../../src/lib/prisma.ts");
  const attendanceCreateRoute = await import("../../src/app/api/attendance/records/route.ts");
  const attendanceUpdateRoute = await import("../../src/app/api/attendance/records/[recordId]/route.ts");

  let recordId: string | null = null;

  try {
    await prisma.employee.create({ data: { id: employeeId } });

    const invalidGpsCreate = await attendanceCreateRoute.POST(
      jsonRequest(
        "/api/attendance/records",
        {
          employeeId,
          checkInAt: "2026-02-16T09:00:00+09:00",
          checkOutAt: "2026-02-16T18:00:00+09:00",
          breakMinutes: 60,
          isHoliday: false,
          notes: markerNote,
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
          notes: markerNote,
          capture: {
            channel: "GPS",
            deviceId: "DEVICE-GPS-PRISMA-01",
            ipAddress: "203.0.113.20",
            latitude: 37.5665,
            longitude: 126.978,
            accuracyMeters: 8
          }
        },
        actorHeaders("employee", employeeId)
      )
    );
    assert.equal(createResponse.status, 201, "attendance create with capture metadata should succeed");
    const createBody = await readJson<{ record: { id: string } }>(createResponse);
    recordId = createBody.record.id;

    const invalidUpdateResponse = await attendanceUpdateRoute.PATCH(
      new Request(`http://localhost/api/attendance/records/${recordId}`, {
        method: "PATCH",
        headers: actorHeaders("employee", employeeId),
        body: JSON.stringify({
          capture: {
            latitude: 37.5
          }
        })
      }),
      { params: Promise.resolve({ recordId }) } as RouteContext<{ recordId: string }>
    );
    assert.equal(invalidUpdateResponse.status, 400, "partial coordinate update should be rejected");

    const updateResponse = await attendanceUpdateRoute.PATCH(
      new Request(`http://localhost/api/attendance/records/${recordId}`, {
        method: "PATCH",
        headers: actorHeaders("employee", employeeId),
        body: JSON.stringify({
          capture: {
            channel: "WIFI",
            deviceId: "WIFI-AP-01",
            ipAddress: "203.0.113.21",
            latitude: null,
            longitude: null,
            accuracyMeters: null
          }
        })
      }),
      { params: Promise.resolve({ recordId }) } as RouteContext<{ recordId: string }>
    );
    assert.equal(updateResponse.status, 200, "attendance capture metadata update should succeed");

    const storedRecord = await prisma.attendanceRecord.findUnique({
      where: { id: recordId }
    });
    assert.ok(storedRecord, "stored attendance record should exist");
    assert.equal(storedRecord?.captureChannel, "WIFI");
    assert.equal(storedRecord?.captureDeviceId, "WIFI-AP-01");
    assert.equal(storedRecord?.captureIpAddress, "203.0.113.21");
    assert.equal(storedRecord?.captureLatitude, null);
    assert.equal(storedRecord?.captureLongitude, null);
    assert.equal(storedRecord?.captureAccuracyMeters, null);

    const recordedAudit = await prisma.auditLog.findFirst({
      where: {
        createdAt: { gte: startedAt },
        action: "attendance.recorded",
        actorId: employeeId
      },
      select: { payload: true }
    });
    assert.ok(recordedAudit, "attendance.recorded audit payload should exist");
    assert.deepEqual(recordedAudit?.payload, {
      employeeId,
      capture: {
        channel: "GPS",
        deviceId: "DEVICE-GPS-PRISMA-01",
        ipAddress: "203.0.113.20",
        latitude: 37.5665,
        longitude: 126.978,
        accuracyMeters: 8
      }
    });
  } finally {
    await prisma.auditLog.deleteMany({
      where: {
        createdAt: { gte: startedAt },
        actorId: employeeId
      }
    });
    if (recordId) {
      await prisma.attendanceRecord.deleteMany({
        where: { id: recordId }
      });
    }
    await prisma.employee.deleteMany({
      where: { id: employeeId }
    });
    await prisma.$disconnect();
  }
}

run()
  .then(() => {
    console.log("e2e-wi0048-attendance-capture-channel-prisma.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
