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
  const employeeId = "EMP-ANTI-SPOOF-1001";
  const previousAntiSpoofingEnabled = process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_ENABLED;
  const previousAllowedChannels = process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_ALLOWED_CHANNELS;
  const previousMaxAccuracy = process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_MAX_GPS_ACCURACY_METERS;
  const previousRiskThreshold = process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_RISK_THRESHOLD;
  const previousGpsRequired = process.env.FLOWHR_ATTENDANCE_GPS_REQUIRED;
  const previousGeofenceEnabled = process.env.FLOWHR_ATTENDANCE_GEOFENCE_ENABLED;
  const previousMultiSiteEnabled = process.env.FLOWHR_ATTENDANCE_MULTI_SITE_GEOFENCE_ENABLED;
  const previousTrustedEnabled = process.env.FLOWHR_ATTENDANCE_TRUSTED_DEVICE_ENABLED;
  const previousAttestationEnabled = process.env.FLOWHR_ATTENDANCE_DEVICE_ATTESTATION_ENABLED;

  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_ENABLED = "true";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_ALLOWED_CHANNELS = "GPS,WIFI";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_MAX_GPS_ACCURACY_METERS = "150";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_RISK_THRESHOLD = "2";
  process.env.FLOWHR_ATTENDANCE_GPS_REQUIRED = "false";
  process.env.FLOWHR_ATTENDANCE_GEOFENCE_ENABLED = "false";
  process.env.FLOWHR_ATTENDANCE_MULTI_SITE_GEOFENCE_ENABLED = "false";
  process.env.FLOWHR_ATTENDANCE_TRUSTED_DEVICE_ENABLED = "false";
  process.env.FLOWHR_ATTENDANCE_DEVICE_ATTESTATION_ENABLED = "false";

  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const attendanceCreateRoute = await import("../../src/app/api/attendance/records/route.ts");
  const attendanceUpdateRoute = await import("../../src/app/api/attendance/records/[recordId]/route.ts");

  try {
    resetMemoryDataAccess();
    await memoryDataAccess.employees.create({ id: employeeId });

    const highRiskCreate = await attendanceCreateRoute.POST(
      jsonRequest(
        "/api/attendance/records",
        {
          employeeId,
          checkInAt: "2026-02-25T09:00:00+09:00",
          checkOutAt: "2026-02-25T18:00:00+09:00",
          breakMinutes: 60,
          isHoliday: false
        },
        actorHeaders("employee", employeeId)
      )
    );
    assert.equal(highRiskCreate.status, 400, "high-risk capture payload should be rejected");
    const highRiskBody = await readJson<{ error: string }>(highRiskCreate);
    assert.equal(
      highRiskBody.error,
      "attendance anti-spoofing policy rejected capture payload (risk score 4 > threshold 2)"
    );

    const lowRiskCreate = await attendanceCreateRoute.POST(
      jsonRequest(
        "/api/attendance/records",
        {
          employeeId,
          checkInAt: "2026-02-25T09:00:00+09:00",
          checkOutAt: "2026-02-25T18:00:00+09:00",
          breakMinutes: 60,
          isHoliday: false,
          capture: {
            channel: "GPS",
            deviceId: "DEVICE-ANTI-01",
            ipAddress: "203.0.113.50",
            latitude: 37.5665,
            longitude: 126.978,
            accuracyMeters: 25
          }
        },
        actorHeaders("employee", employeeId)
      )
    );
    assert.equal(lowRiskCreate.status, 201, "low-risk capture payload should be accepted");
    const lowRiskBody = await readJson<{ record: { id: string } }>(lowRiskCreate);

    const highRiskUpdate = await attendanceUpdateRoute.PATCH(
      new Request(`http://localhost/api/attendance/records/${lowRiskBody.record.id}`, {
        method: "PATCH",
        headers: actorHeaders("employee", employeeId),
        body: JSON.stringify({
          capture: {
            channel: "DEVICE",
            deviceId: "DEVICE-ANTI-01",
            ipAddress: null
          }
        })
      }),
      {
        params: Promise.resolve({ recordId: lowRiskBody.record.id })
      } as RouteContext<{ recordId: string }>
    );
    assert.equal(highRiskUpdate.status, 400, "high-risk update should be rejected by anti-spoofing policy");

    const managerBypassResponse = await attendanceCreateRoute.POST(
      jsonRequest(
        "/api/attendance/records",
        {
          employeeId,
          checkInAt: "2026-02-26T09:00:00+09:00",
          checkOutAt: "2026-02-26T18:00:00+09:00",
          breakMinutes: 60,
          isHoliday: false
        },
        actorHeaders("manager", "MGR-ANTI-SPOOF-1")
      )
    );
    assert.equal(managerBypassResponse.status, 201, "manager correction path should bypass anti-spoofing policy");
  } finally {
    if (previousAntiSpoofingEnabled === undefined) {
      delete process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_ENABLED;
    } else {
      process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_ENABLED = previousAntiSpoofingEnabled;
    }

    if (previousAllowedChannels === undefined) {
      delete process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_ALLOWED_CHANNELS;
    } else {
      process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_ALLOWED_CHANNELS = previousAllowedChannels;
    }

    if (previousMaxAccuracy === undefined) {
      delete process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_MAX_GPS_ACCURACY_METERS;
    } else {
      process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_MAX_GPS_ACCURACY_METERS = previousMaxAccuracy;
    }

    if (previousRiskThreshold === undefined) {
      delete process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_RISK_THRESHOLD;
    } else {
      process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_RISK_THRESHOLD = previousRiskThreshold;
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

    if (previousMultiSiteEnabled === undefined) {
      delete process.env.FLOWHR_ATTENDANCE_MULTI_SITE_GEOFENCE_ENABLED;
    } else {
      process.env.FLOWHR_ATTENDANCE_MULTI_SITE_GEOFENCE_ENABLED = previousMultiSiteEnabled;
    }

    if (previousTrustedEnabled === undefined) {
      delete process.env.FLOWHR_ATTENDANCE_TRUSTED_DEVICE_ENABLED;
    } else {
      process.env.FLOWHR_ATTENDANCE_TRUSTED_DEVICE_ENABLED = previousTrustedEnabled;
    }

    if (previousAttestationEnabled === undefined) {
      delete process.env.FLOWHR_ATTENDANCE_DEVICE_ATTESTATION_ENABLED;
    } else {
      process.env.FLOWHR_ATTENDANCE_DEVICE_ATTESTATION_ENABLED = previousAttestationEnabled;
    }
  }
}

run()
  .then(() => {
    console.log("e2e-wi0056-attendance-anti-spoofing-policy.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
