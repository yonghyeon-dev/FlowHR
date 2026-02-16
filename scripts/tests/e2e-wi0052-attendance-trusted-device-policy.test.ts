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
  const employeeId = "EMP-TRUST-DEVICE-1001";
  const previousTrustedEnabled = process.env.FLOWHR_ATTENDANCE_TRUSTED_DEVICE_ENABLED;
  const previousTrustedIds = process.env.FLOWHR_ATTENDANCE_TRUSTED_DEVICE_IDS;
  const previousGpsRequired = process.env.FLOWHR_ATTENDANCE_GPS_REQUIRED;
  const previousGeofenceEnabled = process.env.FLOWHR_ATTENDANCE_GEOFENCE_ENABLED;

  process.env.FLOWHR_ATTENDANCE_TRUSTED_DEVICE_ENABLED = "true";
  process.env.FLOWHR_ATTENDANCE_TRUSTED_DEVICE_IDS = "DEVICE-TRUST-01,DEVICE-TRUST-02";
  process.env.FLOWHR_ATTENDANCE_GPS_REQUIRED = "false";
  process.env.FLOWHR_ATTENDANCE_GEOFENCE_ENABLED = "false";

  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const attendanceCreateRoute = await import("../../src/app/api/attendance/records/route.ts");
  const attendanceUpdateRoute = await import("../../src/app/api/attendance/records/[recordId]/route.ts");

  try {
    resetMemoryDataAccess();
    await memoryDataAccess.employees.create({ id: employeeId });

    const missingDeviceCreate = await attendanceCreateRoute.POST(
      jsonRequest(
        "/api/attendance/records",
        {
          employeeId,
          checkInAt: "2026-02-21T09:00:00+09:00",
          checkOutAt: "2026-02-21T18:00:00+09:00",
          breakMinutes: 60,
          isHoliday: false
        },
        actorHeaders("employee", employeeId)
      )
    );
    assert.equal(missingDeviceCreate.status, 400, "missing deviceId should be rejected");
    const missingDeviceBody = await readJson<{ error: string }>(missingDeviceCreate);
    assert.equal(missingDeviceBody.error, "attendance trusted device policy requires capture deviceId");

    const untrustedDeviceCreate = await attendanceCreateRoute.POST(
      jsonRequest(
        "/api/attendance/records",
        {
          employeeId,
          checkInAt: "2026-02-21T09:00:00+09:00",
          checkOutAt: "2026-02-21T18:00:00+09:00",
          breakMinutes: 60,
          isHoliday: false,
          capture: {
            channel: "GPS",
            deviceId: "DEVICE-UNTRUSTED-99",
            latitude: 37.5665,
            longitude: 126.978
          }
        },
        actorHeaders("employee", employeeId)
      )
    );
    assert.equal(untrustedDeviceCreate.status, 400, "untrusted deviceId should be rejected");
    const untrustedBody = await readJson<{ error: string }>(untrustedDeviceCreate);
    assert.equal(untrustedBody.error, "attendance capture device is not in trusted device allowlist");

    const trustedDeviceCreate = await attendanceCreateRoute.POST(
      jsonRequest(
        "/api/attendance/records",
        {
          employeeId,
          checkInAt: "2026-02-21T09:00:00+09:00",
          checkOutAt: "2026-02-21T18:00:00+09:00",
          breakMinutes: 60,
          isHoliday: false,
          capture: {
            channel: "GPS",
            deviceId: "DEVICE-TRUST-01",
            latitude: 37.5665,
            longitude: 126.978
          }
        },
        actorHeaders("employee", employeeId)
      )
    );
    assert.equal(trustedDeviceCreate.status, 201, "trusted deviceId should be accepted");
    const trustedCreateBody = await readJson<{ record: { id: string } }>(trustedDeviceCreate);

    const untrustedUpdate = await attendanceUpdateRoute.PATCH(
      new Request(`http://localhost/api/attendance/records/${trustedCreateBody.record.id}`, {
        method: "PATCH",
        headers: actorHeaders("employee", employeeId),
        body: JSON.stringify({
          capture: {
            deviceId: "DEVICE-UNTRUSTED-99"
          }
        })
      }),
      { params: Promise.resolve({ recordId: trustedCreateBody.record.id }) } as RouteContext<{ recordId: string }>
    );
    assert.equal(untrustedUpdate.status, 400, "untrusted device update should be rejected");

    const managerBypassCreate = await attendanceCreateRoute.POST(
      jsonRequest(
        "/api/attendance/records",
        {
          employeeId,
          checkInAt: "2026-02-22T09:00:00+09:00",
          checkOutAt: "2026-02-22T18:00:00+09:00",
          breakMinutes: 60,
          isHoliday: false
        },
        actorHeaders("manager", "MGR-TRUST-DEVICE")
      )
    );
    assert.equal(
      managerBypassCreate.status,
      201,
      "manager correction path should bypass trusted device policy"
    );
  } finally {
    if (previousTrustedEnabled === undefined) {
      delete process.env.FLOWHR_ATTENDANCE_TRUSTED_DEVICE_ENABLED;
    } else {
      process.env.FLOWHR_ATTENDANCE_TRUSTED_DEVICE_ENABLED = previousTrustedEnabled;
    }
    if (previousTrustedIds === undefined) {
      delete process.env.FLOWHR_ATTENDANCE_TRUSTED_DEVICE_IDS;
    } else {
      process.env.FLOWHR_ATTENDANCE_TRUSTED_DEVICE_IDS = previousTrustedIds;
    }
    if (previousGpsRequired === undefined) {
      delete process.env.FLOWHR_ATTENDANCE_GPS_REQUIRED;
    } else {
      process.env.FLOWHR_ATTENDANCE_GPS_REQUIRED = previousGpsRequired;
    }
    if (previousGeofenceEnabled === undefined) {
      delete process.env.FLOWHR_ATTENDANCE_GEOFENCE_ENABLED;
    } else {
      process.env.FLOWHR_ATTENDANCE_GEOFENCE_ENABLED = previousGeofenceEnabled;
    }
  }
}

run()
  .then(() => {
    console.log("e2e-wi0052-attendance-trusted-device-policy.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
