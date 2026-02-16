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
  const employeeId = "EMP-MULTISITE-GEOFENCE-1001";
  const previousGpsRequired = process.env.FLOWHR_ATTENDANCE_GPS_REQUIRED;
  const previousGeofenceEnabled = process.env.FLOWHR_ATTENDANCE_GEOFENCE_ENABLED;
  const previousMultiSiteEnabled = process.env.FLOWHR_ATTENDANCE_MULTI_SITE_GEOFENCE_ENABLED;
  const previousMultiSiteConfig = process.env.FLOWHR_ATTENDANCE_MULTI_SITE_GEOFENCE_SITES;

  process.env.FLOWHR_ATTENDANCE_GPS_REQUIRED = "false";
  process.env.FLOWHR_ATTENDANCE_GEOFENCE_ENABLED = "false";
  process.env.FLOWHR_ATTENDANCE_MULTI_SITE_GEOFENCE_ENABLED = "true";
  process.env.FLOWHR_ATTENDANCE_MULTI_SITE_GEOFENCE_SITES =
    "SEOUL_HQ:37.5665:126.9780:250;BUSAN_HQ:35.1796:129.0756:250";

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
          checkInAt: "2026-02-20T09:00:00+09:00",
          checkOutAt: "2026-02-20T18:00:00+09:00",
          breakMinutes: 60,
          isHoliday: false,
          capture: {
            channel: "GPS",
            latitude: 35.8714,
            longitude: 128.6014
          }
        },
        actorHeaders("employee", employeeId)
      )
    );
    assert.equal(
      outsideCreateResponse.status,
      400,
      "outside all configured site geofences should be rejected"
    );
    const outsideCreateBody = await readJson<{ error: string }>(outsideCreateResponse);
    assert.equal(
      outsideCreateBody.error,
      "attendance capture location is outside allowed multi-site geofence"
    );

    const insideCreateResponse = await attendanceCreateRoute.POST(
      jsonRequest(
        "/api/attendance/records",
        {
          employeeId,
          checkInAt: "2026-02-20T09:00:00+09:00",
          checkOutAt: "2026-02-20T18:00:00+09:00",
          breakMinutes: 60,
          isHoliday: false,
          capture: {
            channel: "GPS",
            latitude: 35.1797,
            longitude: 129.0757
          }
        },
        actorHeaders("employee", employeeId)
      )
    );
    assert.equal(insideCreateResponse.status, 201, "inside one configured site geofence should succeed");
    const insideCreateBody = await readJson<{ record: { id: string } }>(insideCreateResponse);

    const outsideUpdateResponse = await attendanceUpdateRoute.PATCH(
      new Request(`http://localhost/api/attendance/records/${insideCreateBody.record.id}`, {
        method: "PATCH",
        headers: actorHeaders("employee", employeeId),
        body: JSON.stringify({
          capture: {
            channel: "GPS",
            latitude: 35.8714,
            longitude: 128.6014
          }
        })
      }),
      {
        params: Promise.resolve({ recordId: insideCreateBody.record.id })
      } as RouteContext<{ recordId: string }>
    );
    assert.equal(
      outsideUpdateResponse.status,
      400,
      "employee update outside all configured site geofences should be rejected"
    );

    const managerBypassResponse = await attendanceCreateRoute.POST(
      jsonRequest(
        "/api/attendance/records",
        {
          employeeId,
          checkInAt: "2026-02-21T09:00:00+09:00",
          checkOutAt: "2026-02-21T18:00:00+09:00",
          breakMinutes: 60,
          isHoliday: false
        },
        actorHeaders("manager", "MGR-MULTISITE-GEOFENCE-1")
      )
    );
    assert.equal(
      managerBypassResponse.status,
      201,
      "manager correction path should bypass multi-site geofence policy"
    );
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

    if (previousMultiSiteEnabled === undefined) {
      delete process.env.FLOWHR_ATTENDANCE_MULTI_SITE_GEOFENCE_ENABLED;
    } else {
      process.env.FLOWHR_ATTENDANCE_MULTI_SITE_GEOFENCE_ENABLED = previousMultiSiteEnabled;
    }

    if (previousMultiSiteConfig === undefined) {
      delete process.env.FLOWHR_ATTENDANCE_MULTI_SITE_GEOFENCE_SITES;
    } else {
      process.env.FLOWHR_ATTENDANCE_MULTI_SITE_GEOFENCE_SITES = previousMultiSiteConfig;
    }
  }
}

run()
  .then(() => {
    console.log("e2e-wi0053-attendance-multisite-geofence-policy.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
