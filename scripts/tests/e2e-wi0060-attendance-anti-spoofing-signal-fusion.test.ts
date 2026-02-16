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
  const employeeId = "EMP-ANTI-SPOOF-FUSION-1001";
  const previousAntiSpoofingEnabled = process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_ENABLED;
  const previousAllowedChannels = process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_ALLOWED_CHANNELS;
  const previousMaxAccuracy = process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_MAX_GPS_ACCURACY_METERS;
  const previousRiskThreshold = process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_RISK_THRESHOLD;
  const previousSignalFusionEnabled = process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_SIGNAL_FUSION_ENABLED;
  const previousMinSignals = process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_SIGNAL_FUSION_MIN_SIGNALS;
  const previousReputationPenalty = process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_REPUTATION_PENALTY;
  const previousHighRiskDeviceIds = process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_HIGH_RISK_DEVICE_IDS;
  const previousHighRiskIps = process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_HIGH_RISK_IPS;
  const previousGpsRequired = process.env.FLOWHR_ATTENDANCE_GPS_REQUIRED;
  const previousGeofenceEnabled = process.env.FLOWHR_ATTENDANCE_GEOFENCE_ENABLED;
  const previousMultiSiteEnabled = process.env.FLOWHR_ATTENDANCE_MULTI_SITE_GEOFENCE_ENABLED;
  const previousTrustedEnabled = process.env.FLOWHR_ATTENDANCE_TRUSTED_DEVICE_ENABLED;
  const previousAttestationEnabled = process.env.FLOWHR_ATTENDANCE_DEVICE_ATTESTATION_ENABLED;

  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_ENABLED = "true";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_ALLOWED_CHANNELS = "GPS,WIFI";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_MAX_GPS_ACCURACY_METERS = "150";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_RISK_THRESHOLD = "2";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_SIGNAL_FUSION_ENABLED = "true";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_SIGNAL_FUSION_MIN_SIGNALS = "3";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_REPUTATION_PENALTY = "3";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_HIGH_RISK_DEVICE_IDS = "DEVICE-RISKY-1";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_HIGH_RISK_IPS = "198.51.100.66";
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

    const riskyReputationCreate = await attendanceCreateRoute.POST(
      jsonRequest(
        "/api/attendance/records",
        {
          employeeId,
          checkInAt: "2026-03-01T09:00:00+09:00",
          checkOutAt: "2026-03-01T18:00:00+09:00",
          breakMinutes: 60,
          isHoliday: false,
          capture: {
            channel: "GPS",
            deviceId: "DEVICE-RISKY-1",
            ipAddress: "198.51.100.66",
            latitude: 37.5665,
            longitude: 126.978,
            accuracyMeters: 20
          }
        },
        actorHeaders("employee", employeeId)
      )
    );
    assert.equal(riskyReputationCreate.status, 400, "risky reputation payload should be rejected");
    const riskyReputationBody = await readJson<{ error: string }>(riskyReputationCreate);
    assert.equal(
      riskyReputationBody.error,
      "attendance anti-spoofing policy rejected capture payload (risk score 6 > threshold 2)"
    );

    const safeCreate = await attendanceCreateRoute.POST(
      jsonRequest(
        "/api/attendance/records",
        {
          employeeId,
          checkInAt: "2026-03-02T09:00:00+09:00",
          checkOutAt: "2026-03-02T18:00:00+09:00",
          breakMinutes: 60,
          isHoliday: false,
          capture: {
            channel: "GPS",
            deviceId: "DEVICE-SAFE-1",
            ipAddress: "203.0.113.7",
            latitude: 37.5665,
            longitude: 126.978,
            accuracyMeters: 20
          }
        },
        actorHeaders("employee", employeeId)
      )
    );
    assert.equal(safeCreate.status, 201, "safe fusion payload should be accepted");
    const safeCreateBody = await readJson<{ record: { id: string } }>(safeCreate);

    const riskyUpdate = await attendanceUpdateRoute.PATCH(
      new Request(`http://localhost/api/attendance/records/${safeCreateBody.record.id}`, {
        method: "PATCH",
        headers: actorHeaders("employee", employeeId),
        body: JSON.stringify({
          capture: {
            ipAddress: "198.51.100.66"
          }
        })
      }),
      {
        params: Promise.resolve({ recordId: safeCreateBody.record.id })
      } as RouteContext<{ recordId: string }>
    );
    assert.equal(riskyUpdate.status, 400, "risky reputation update should be rejected");
    const riskyUpdateBody = await readJson<{ error: string }>(riskyUpdate);
    assert.equal(
      riskyUpdateBody.error,
      "attendance anti-spoofing policy rejected capture payload (risk score 3 > threshold 2)"
    );

    const managerBypassResponse = await attendanceCreateRoute.POST(
      jsonRequest(
        "/api/attendance/records",
        {
          employeeId,
          checkInAt: "2026-03-03T09:00:00+09:00",
          checkOutAt: "2026-03-03T18:00:00+09:00",
          breakMinutes: 60,
          isHoliday: false,
          capture: {
            channel: "GPS",
            deviceId: "DEVICE-RISKY-1",
            ipAddress: "198.51.100.66",
            latitude: 37.5665,
            longitude: 126.978,
            accuracyMeters: 20
          }
        },
        actorHeaders("manager", "MGR-ANTI-SPOOF-FUSION-1")
      )
    );
    assert.equal(managerBypassResponse.status, 201, "manager correction path should bypass fusion policy");
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

    if (previousSignalFusionEnabled === undefined) {
      delete process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_SIGNAL_FUSION_ENABLED;
    } else {
      process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_SIGNAL_FUSION_ENABLED = previousSignalFusionEnabled;
    }

    if (previousMinSignals === undefined) {
      delete process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_SIGNAL_FUSION_MIN_SIGNALS;
    } else {
      process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_SIGNAL_FUSION_MIN_SIGNALS = previousMinSignals;
    }

    if (previousReputationPenalty === undefined) {
      delete process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_REPUTATION_PENALTY;
    } else {
      process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_REPUTATION_PENALTY = previousReputationPenalty;
    }

    if (previousHighRiskDeviceIds === undefined) {
      delete process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_HIGH_RISK_DEVICE_IDS;
    } else {
      process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_HIGH_RISK_DEVICE_IDS = previousHighRiskDeviceIds;
    }

    if (previousHighRiskIps === undefined) {
      delete process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_HIGH_RISK_IPS;
    } else {
      process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_HIGH_RISK_IPS = previousHighRiskIps;
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
    console.log("e2e-wi0060-attendance-anti-spoofing-signal-fusion.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
