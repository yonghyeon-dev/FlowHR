import assert from "node:assert/strict";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "memory";
runtimeEnv.FLOWHR_EVENT_PUBLISHER = "memory";
runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
runtimeEnv.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.DIRECT_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";

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

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.toString();
  }
  return input.url;
}

async function run() {
  const employeeId = "EMP-ANTI-SPOOF-MULTI-2001";
  const previousAntiSpoofingEnabled = process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_ENABLED;
  const previousAllowedChannels = process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_ALLOWED_CHANNELS;
  const previousMaxAccuracy = process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_MAX_GPS_ACCURACY_METERS;
  const previousRiskThreshold = process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_RISK_THRESHOLD;
  const previousSignalFusionEnabled = process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_SIGNAL_FUSION_ENABLED;
  const previousMinSignals = process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_SIGNAL_FUSION_MIN_SIGNALS;
  const previousReputationPenalty = process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_REPUTATION_PENALTY;
  const previousHighRiskDeviceIds = process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_HIGH_RISK_DEVICE_IDS;
  const previousHighRiskIps = process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_HIGH_RISK_IPS;
  const previousExternalReputationEnabled =
    process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_ENABLED;
  const previousExternalReputationProvider =
    process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_PROVIDER;
  const previousExternalReputationUrl =
    process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_URL;
  const previousExternalReputationUrls =
    process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_URLS;
  const previousExternalReputationAggregation =
    process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_AGGREGATION;
  const previousExternalReputationMajorityThreshold =
    process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_MAJORITY_THRESHOLD;
  const previousExternalReputationMinSuccess =
    process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_MIN_SUCCESS;
  const previousExternalReputationStrictMode =
    process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_STRICT_MODE;
  const previousExternalReputationTimeoutMs =
    process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_TIMEOUT_MS;
  const previousExternalReputationTtl =
    process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_CACHE_TTL_SECONDS;
  const previousGpsRequired = process.env.FLOWHR_ATTENDANCE_GPS_REQUIRED;
  const previousGeofenceEnabled = process.env.FLOWHR_ATTENDANCE_GEOFENCE_ENABLED;
  const previousMultiSiteEnabled = process.env.FLOWHR_ATTENDANCE_MULTI_SITE_GEOFENCE_ENABLED;
  const previousTrustedEnabled = process.env.FLOWHR_ATTENDANCE_TRUSTED_DEVICE_ENABLED;
  const previousAttestationEnabled = process.env.FLOWHR_ATTENDANCE_DEVICE_ATTESTATION_ENABLED;
  const previousFetch = global.fetch;

  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_ENABLED = "true";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_ALLOWED_CHANNELS = "GPS,WIFI";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_MAX_GPS_ACCURACY_METERS = "150";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_RISK_THRESHOLD = "1";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_SIGNAL_FUSION_ENABLED = "true";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_SIGNAL_FUSION_MIN_SIGNALS = "3";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_REPUTATION_PENALTY = "2";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_HIGH_RISK_DEVICE_IDS = "";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_HIGH_RISK_IPS = "";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_ENABLED = "true";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_PROVIDER = "remote";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_URL = "";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_URLS =
    "https://rep-a.flowhr.local/v1/signals,https://rep-b.flowhr.local/v1/signals,https://rep-c.flowhr.local/v1/signals";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_AGGREGATION = "majority";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_MAJORITY_THRESHOLD = "2";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_MIN_SUCCESS = "2";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_STRICT_MODE = "false";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_TIMEOUT_MS = "1000";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_CACHE_TTL_SECONDS = "0";
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

  let mode: "majority-safe" | "majority-block" | "strict-fail" = "majority-safe";

  try {
    global.fetch = async (input: RequestInfo | URL) => {
      const url = requestUrl(input);

      if (mode === "majority-safe") {
        if (url.includes("rep-a")) {
          return new Response(
            JSON.stringify({
              highRiskDeviceIds: ["DEVICE-MULTI-RISKY-1"],
              highRiskIpAddresses: ["198.51.100.77"]
            }),
            { status: 200, headers: { "content-type": "application/json" } }
          );
        }
        if (url.includes("rep-b")) {
          return new Response(
            JSON.stringify({ highRiskDeviceIds: [], highRiskIpAddresses: [] }),
            { status: 200, headers: { "content-type": "application/json" } }
          );
        }
        throw new Error("provider offline");
      }

      if (mode === "majority-block") {
        if (url.includes("rep-a") || url.includes("rep-b")) {
          return new Response(
            JSON.stringify({
              highRiskDeviceIds: ["DEVICE-MULTI-RISKY-1"],
              highRiskIpAddresses: ["198.51.100.77"]
            }),
            { status: 200, headers: { "content-type": "application/json" } }
          );
        }
        throw new Error("provider offline");
      }

      if (url.includes("rep-a")) {
        return new Response(
          JSON.stringify({
            highRiskDeviceIds: ["DEVICE-MULTI-RISKY-1"],
            highRiskIpAddresses: ["198.51.100.77"]
          }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }
      throw new Error("provider offline");
    };

    resetMemoryDataAccess();
    await memoryDataAccess.employees.create({ id: employeeId });

    const majoritySafeCreate = await attendanceCreateRoute.POST(
      jsonRequest(
        "/api/attendance/records",
        {
          employeeId,
          checkInAt: "2026-03-10T09:00:00+09:00",
          checkOutAt: "2026-03-10T18:00:00+09:00",
          breakMinutes: 60,
          isHoliday: false,
          capture: {
            channel: "GPS",
            deviceId: "DEVICE-MULTI-RISKY-1",
            ipAddress: "198.51.100.77",
            latitude: 37.5665,
            longitude: 126.978,
            accuracyMeters: 20
          }
        },
        actorHeaders("employee", employeeId)
      )
    );
    assert.equal(
      majoritySafeCreate.status,
      201,
      "majority mode should accept risk signal when it appears in fewer providers than threshold"
    );

    mode = "majority-block";
    const majorityBlockCreate = await attendanceCreateRoute.POST(
      jsonRequest(
        "/api/attendance/records",
        {
          employeeId,
          checkInAt: "2026-03-11T09:00:00+09:00",
          checkOutAt: "2026-03-11T18:00:00+09:00",
          breakMinutes: 60,
          isHoliday: false,
          capture: {
            channel: "GPS",
            deviceId: "DEVICE-MULTI-RISKY-1",
            ipAddress: "198.51.100.77",
            latitude: 37.5665,
            longitude: 126.978,
            accuracyMeters: 20
          }
        },
        actorHeaders("employee", employeeId)
      )
    );
    assert.equal(
      majorityBlockCreate.status,
      400,
      "majority mode should reject when risk signal reaches threshold"
    );

    const managerBypassCreate = await attendanceCreateRoute.POST(
      jsonRequest(
        "/api/attendance/records",
        {
          employeeId,
          checkInAt: "2026-03-12T09:00:00+09:00",
          checkOutAt: "2026-03-12T18:00:00+09:00",
          breakMinutes: 60,
          isHoliday: false,
          capture: {
            channel: "GPS",
            deviceId: "DEVICE-MULTI-RISKY-1",
            ipAddress: "198.51.100.77",
            latitude: 37.5665,
            longitude: 126.978,
            accuracyMeters: 20
          }
        },
        actorHeaders("manager", "MGR-ANTI-SPOOF-MULTI-1")
      )
    );
    assert.equal(managerBypassCreate.status, 201, "manager correction path should bypass multi-provider checks");

    process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_STRICT_MODE = "true";
    process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_MIN_SUCCESS = "3";
    mode = "strict-fail";

    const strictFailCreate = await attendanceCreateRoute.POST(
      jsonRequest(
        "/api/attendance/records",
        {
          employeeId,
          checkInAt: "2026-03-13T09:00:00+09:00",
          checkOutAt: "2026-03-13T18:00:00+09:00",
          breakMinutes: 60,
          isHoliday: false,
          capture: {
            channel: "GPS",
            deviceId: "DEVICE-MULTI-SAFE-1",
            ipAddress: "203.0.113.11",
            latitude: 37.5665,
            longitude: 126.978,
            accuracyMeters: 20
          }
        },
        actorHeaders("employee", employeeId)
      )
    );
    assert.equal(strictFailCreate.status, 500);
    const strictFailBody = await readJson<{ error: string }>(strictFailCreate);
    assert.equal(
      strictFailBody.error,
      "attendance anti-spoofing policy could not satisfy external reputation provider minimum-success requirement"
    );

    const safeCreate = await attendanceCreateRoute.POST(
      jsonRequest(
        "/api/attendance/records",
        {
          employeeId,
          checkInAt: "2026-03-14T09:00:00+09:00",
          checkOutAt: "2026-03-14T18:00:00+09:00",
          breakMinutes: 60,
          isHoliday: false,
          capture: {
            channel: "GPS",
            deviceId: "DEVICE-MULTI-SAFE-2",
            ipAddress: "203.0.113.12",
            latitude: 37.5665,
            longitude: 126.978,
            accuracyMeters: 20
          }
        },
        actorHeaders("manager", "MGR-ANTI-SPOOF-MULTI-2")
      )
    );
    assert.equal(safeCreate.status, 201);
    const safeBody = await readJson<{ record: { id: string } }>(safeCreate);

    process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_STRICT_MODE = "false";
    process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_MIN_SUCCESS = "2";
    mode = "majority-block";

    const blockedUpdate = await attendanceUpdateRoute.PATCH(
      new Request(`http://localhost/api/attendance/records/${safeBody.record.id}`, {
        method: "PATCH",
        headers: actorHeaders("employee", employeeId),
        body: JSON.stringify({
          capture: {
            deviceId: "DEVICE-MULTI-RISKY-1",
            ipAddress: "198.51.100.77"
          }
        })
      }),
      {
        params: Promise.resolve({ recordId: safeBody.record.id })
      } as RouteContext<{ recordId: string }>
    );
    assert.equal(blockedUpdate.status, 400, "update path should enforce multi-provider reputation scoring");
  } finally {
    global.fetch = previousFetch;

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

    if (previousExternalReputationEnabled === undefined) {
      delete process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_ENABLED;
    } else {
      process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_ENABLED = previousExternalReputationEnabled;
    }

    if (previousExternalReputationProvider === undefined) {
      delete process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_PROVIDER;
    } else {
      process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_PROVIDER = previousExternalReputationProvider;
    }

    if (previousExternalReputationUrl === undefined) {
      delete process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_URL;
    } else {
      process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_URL = previousExternalReputationUrl;
    }

    if (previousExternalReputationUrls === undefined) {
      delete process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_URLS;
    } else {
      process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_URLS = previousExternalReputationUrls;
    }

    if (previousExternalReputationAggregation === undefined) {
      delete process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_AGGREGATION;
    } else {
      process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_AGGREGATION =
        previousExternalReputationAggregation;
    }

    if (previousExternalReputationMajorityThreshold === undefined) {
      delete process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_MAJORITY_THRESHOLD;
    } else {
      process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_MAJORITY_THRESHOLD =
        previousExternalReputationMajorityThreshold;
    }

    if (previousExternalReputationMinSuccess === undefined) {
      delete process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_MIN_SUCCESS;
    } else {
      process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_MIN_SUCCESS =
        previousExternalReputationMinSuccess;
    }

    if (previousExternalReputationStrictMode === undefined) {
      delete process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_STRICT_MODE;
    } else {
      process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_STRICT_MODE =
        previousExternalReputationStrictMode;
    }

    if (previousExternalReputationTimeoutMs === undefined) {
      delete process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_TIMEOUT_MS;
    } else {
      process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_TIMEOUT_MS = previousExternalReputationTimeoutMs;
    }

    if (previousExternalReputationTtl === undefined) {
      delete process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_CACHE_TTL_SECONDS;
    } else {
      process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_CACHE_TTL_SECONDS =
        previousExternalReputationTtl;
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
    console.log("e2e-wi0064-attendance-multi-provider-reputation.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
