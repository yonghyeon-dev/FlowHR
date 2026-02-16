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
  const employeeId = "EMP-GEOFENCE-1001";
  const previousGpsRequired = process.env.FLOWHR_ATTENDANCE_GPS_REQUIRED;
  const previousGeofenceEnabled = process.env.FLOWHR_ATTENDANCE_GEOFENCE_ENABLED;
  const previousGeofenceLat = process.env.FLOWHR_ATTENDANCE_GEOFENCE_LAT;
  const previousGeofenceLng = process.env.FLOWHR_ATTENDANCE_GEOFENCE_LNG;
  const previousGeofenceRadius = process.env.FLOWHR_ATTENDANCE_GEOFENCE_RADIUS_METERS;

  process.env.FLOWHR_ATTENDANCE_GPS_REQUIRED = "false";
  process.env.FLOWHR_ATTENDANCE_GEOFENCE_ENABLED = "true";
  process.env.FLOWHR_ATTENDANCE_GEOFENCE_LAT = "37.5665";
  process.env.FLOWHR_ATTENDANCE_GEOFENCE_LNG = "126.9780";
  process.env.FLOWHR_ATTENDANCE_GEOFENCE_RADIUS_METERS = "300";

  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const attendanceCreateRoute = await import("../../src/app/api/attendance/records/route.ts");
  const attendanceUpdateRoute = await import("../../src/app/api/attendance/records/[recordId]/route.ts");

  try {
    resetMemoryDataAccess();
    await memoryDataAccess.employees.create({ id: employeeId });

    const outsideCreateResponse = await attendanceCreateRoute.POST(
      jsonRequest(
        "/api/attendance/records",
        {
          employeeId,
          checkInAt: "2026-02-18T09:00:00+09:00",
          checkOutAt: "2026-02-18T18:00:00+09:00",
          breakMinutes: 60,
          isHoliday: false,
          capture: {
            channel: "GPS",
            latitude: 37.575,
            longitude: 126.978
          }
        },
        actorHeaders("employee", employeeId)
      )
    );
    assert.equal(outsideCreateResponse.status, 400, "outside geofence create should be rejected");
    const outsideCreateBody = await readJson<{ error: string }>(outsideCreateResponse);
    assert.equal(outsideCreateBody.error, "attendance capture location is outside allowed geofence");

    const insideCreateResponse = await attendanceCreateRoute.POST(
      jsonRequest(
        "/api/attendance/records",
        {
          employeeId,
          checkInAt: "2026-02-18T09:00:00+09:00",
          checkOutAt: "2026-02-18T18:00:00+09:00",
          breakMinutes: 60,
          isHoliday: false,
          capture: {
            channel: "GPS",
            latitude: 37.5666,
            longitude: 126.9781
          }
        },
        actorHeaders("employee", employeeId)
      )
    );
    assert.equal(insideCreateResponse.status, 201, "inside geofence create should succeed");
    const insideCreateBody = await readJson<{ record: { id: string } }>(insideCreateResponse);

    const outsideUpdateResponse = await attendanceUpdateRoute.PATCH(
      new Request(`http://localhost/api/attendance/records/${insideCreateBody.record.id}`, {
        method: "PATCH",
        headers: actorHeaders("employee", employeeId),
        body: JSON.stringify({
          capture: {
            channel: "GPS",
            latitude: 37.576,
            longitude: 126.978
          }
        })
      }),
      {
        params: Promise.resolve({ recordId: insideCreateBody.record.id })
      } as RouteContext<{ recordId: string }>
    );
    assert.equal(outsideUpdateResponse.status, 400, "outside geofence update should be rejected");

    const managerBypassResponse = await attendanceCreateRoute.POST(
      jsonRequest(
        "/api/attendance/records",
        {
          employeeId,
          checkInAt: "2026-02-19T09:00:00+09:00",
          checkOutAt: "2026-02-19T18:00:00+09:00",
          breakMinutes: 60,
          isHoliday: false
        },
        actorHeaders("manager", "MGR-GEOFENCE-1")
      )
    );
    assert.equal(managerBypassResponse.status, 201, "manager correction path should bypass geofence policy");
  } finally {
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

    if (previousGeofenceLat === undefined) {
      delete process.env.FLOWHR_ATTENDANCE_GEOFENCE_LAT;
    } else {
      process.env.FLOWHR_ATTENDANCE_GEOFENCE_LAT = previousGeofenceLat;
    }

    if (previousGeofenceLng === undefined) {
      delete process.env.FLOWHR_ATTENDANCE_GEOFENCE_LNG;
    } else {
      process.env.FLOWHR_ATTENDANCE_GEOFENCE_LNG = previousGeofenceLng;
    }

    if (previousGeofenceRadius === undefined) {
      delete process.env.FLOWHR_ATTENDANCE_GEOFENCE_RADIUS_METERS;
    } else {
      process.env.FLOWHR_ATTENDANCE_GEOFENCE_RADIUS_METERS = previousGeofenceRadius;
    }
  }
}

run()
  .then(() => {
    console.log("e2e-wi0050-attendance-geofence-policy.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
