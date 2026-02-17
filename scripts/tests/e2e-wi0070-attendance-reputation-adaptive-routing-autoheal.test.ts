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

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.toString();
  }
  return input.url;
}

async function readJson<T>(response: Response) {
  return (await response.json()) as T;
}

async function run() {
  const employeeId = "EMP-ANTI-SPOOF-ADAPT-4001";
  const previousFetch = global.fetch;
  const previousDateNow = Date.now;

  const envKeys = [
    "FLOWHR_ATTENDANCE_ANTI_SPOOFING_ENABLED",
    "FLOWHR_ATTENDANCE_ANTI_SPOOFING_ALLOWED_CHANNELS",
    "FLOWHR_ATTENDANCE_ANTI_SPOOFING_MAX_GPS_ACCURACY_METERS",
    "FLOWHR_ATTENDANCE_ANTI_SPOOFING_RISK_THRESHOLD",
    "FLOWHR_ATTENDANCE_ANTI_SPOOFING_SIGNAL_FUSION_ENABLED",
    "FLOWHR_ATTENDANCE_ANTI_SPOOFING_SIGNAL_FUSION_MIN_SIGNALS",
    "FLOWHR_ATTENDANCE_ANTI_SPOOFING_REPUTATION_PENALTY",
    "FLOWHR_ATTENDANCE_ANTI_SPOOFING_HIGH_RISK_DEVICE_IDS",
    "FLOWHR_ATTENDANCE_ANTI_SPOOFING_HIGH_RISK_IPS",
    "FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_ENABLED",
    "FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_PROVIDER",
    "FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_URLS",
    "FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_AGGREGATION",
    "FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_MIN_SUCCESS",
    "FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_STRICT_MODE",
    "FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_TIMEOUT_MS",
    "FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_CACHE_TTL_SECONDS",
    "FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_CIRCUIT_BREAKER_ENABLED",
    "FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_FAILURE_THRESHOLD",
    "FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_COOLDOWN_SECONDS",
    "FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_ADAPTIVE_ROUTING_ENABLED",
    "FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_AUTO_HEAL_ENABLED",
    "FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_AUTO_HEAL_PROBE_INTERVAL_SECONDS",
    "FLOWHR_ATTENDANCE_GPS_REQUIRED",
    "FLOWHR_ATTENDANCE_GEOFENCE_ENABLED",
    "FLOWHR_ATTENDANCE_MULTI_SITE_GEOFENCE_ENABLED",
    "FLOWHR_ATTENDANCE_TRUSTED_DEVICE_ENABLED",
    "FLOWHR_ATTENDANCE_DEVICE_ATTESTATION_ENABLED"
  ] as const;
  const previousEnv = new Map<string, string | undefined>(
    envKeys.map((key) => [key, process.env[key]])
  );

  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_ENABLED = "true";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_ALLOWED_CHANNELS = "GPS,WIFI";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_MAX_GPS_ACCURACY_METERS = "150";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_RISK_THRESHOLD = "2";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_SIGNAL_FUSION_ENABLED = "true";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_SIGNAL_FUSION_MIN_SIGNALS = "3";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_REPUTATION_PENALTY = "2";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_HIGH_RISK_DEVICE_IDS = "";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_HIGH_RISK_IPS = "";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_ENABLED = "true";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_PROVIDER = "remote";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_URLS =
    "https://rep-a.flowhr.local/v1/signals,https://rep-b.flowhr.local/v1/signals";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_AGGREGATION = "union";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_MIN_SUCCESS = "1";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_STRICT_MODE = "false";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_TIMEOUT_MS = "1000";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_CACHE_TTL_SECONDS = "0";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_CIRCUIT_BREAKER_ENABLED = "true";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_FAILURE_THRESHOLD = "1";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_COOLDOWN_SECONDS = "300";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_ADAPTIVE_ROUTING_ENABLED = "true";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_AUTO_HEAL_ENABLED = "true";
  process.env.FLOWHR_ATTENDANCE_ANTI_SPOOFING_EXTERNAL_REPUTATION_AUTO_HEAL_PROBE_INTERVAL_SECONDS = "10";
  process.env.FLOWHR_ATTENDANCE_GPS_REQUIRED = "false";
  process.env.FLOWHR_ATTENDANCE_GEOFENCE_ENABLED = "false";
  process.env.FLOWHR_ATTENDANCE_MULTI_SITE_GEOFENCE_ENABLED = "false";
  process.env.FLOWHR_ATTENDANCE_TRUSTED_DEVICE_ENABLED = "false";
  process.env.FLOWHR_ATTENDANCE_DEVICE_ATTESTATION_ENABLED = "false";

  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const attendanceCreateRoute = await import("../../src/app/api/attendance/records/route.ts");

  const providerCallOrderByRequest = new Map<string, string[]>();
  let activeRequestKey = "r0";
  let providerAFailureBudget = 1;

  let now = Date.parse("2026-03-20T00:00:00.000Z");
  Date.now = () => now;

  function beginRequest(key: string) {
    activeRequestKey = key;
    providerCallOrderByRequest.set(key, []);
  }

  async function createAttendanceRecord(checkInAt: string, checkOutAt: string) {
    const response = await attendanceCreateRoute.POST(
      jsonRequest(
        "/api/attendance/records",
        {
          employeeId,
          checkInAt,
          checkOutAt,
          breakMinutes: 60,
          isHoliday: false,
          capture: {
            channel: "GPS",
            deviceId: `DEVICE-${checkInAt}`,
            ipAddress: "203.0.113.50",
            latitude: 37.5665,
            longitude: 126.978,
            accuracyMeters: 20
          }
        },
        actorHeaders("employee", employeeId)
      )
    );
    return response;
  }

  try {
    global.fetch = async (input: RequestInfo | URL) => {
      const url = requestUrl(input);
      const callOrder = providerCallOrderByRequest.get(activeRequestKey);
      if (!callOrder) {
        throw new Error("missing active request key");
      }

      if (url.includes("rep-a")) {
        callOrder.push("A");
        if (providerAFailureBudget > 0) {
          providerAFailureBudget -= 1;
          throw new Error("provider a outage");
        }
        return new Response(
          JSON.stringify({ highRiskDeviceIds: [], highRiskIpAddresses: [] }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }

      if (url.includes("rep-b")) {
        callOrder.push("B");
        return new Response(
          JSON.stringify({ highRiskDeviceIds: [], highRiskIpAddresses: [] }),
          { status: 200, headers: { "content-type": "application/json" } }
        );
      }

      throw new Error("unknown provider url");
    };

    resetMemoryDataAccess();
    await memoryDataAccess.employees.create({ id: employeeId });

    beginRequest("r1");
    const firstAttempt = await createAttendanceRecord(
      "2026-03-20T09:00:00+09:00",
      "2026-03-20T18:00:00+09:00"
    );
    assert.equal(firstAttempt.status, 201);
    assert.deepEqual(providerCallOrderByRequest.get("r1"), ["A", "B"]);

    now += 1_000;
    beginRequest("r2");
    const secondAttempt = await createAttendanceRecord(
      "2026-03-21T09:00:00+09:00",
      "2026-03-21T18:00:00+09:00"
    );
    assert.equal(secondAttempt.status, 201);
    assert.deepEqual(
      providerCallOrderByRequest.get("r2"),
      ["B"],
      "adaptive routing should prioritize healthy provider and skip open circuit provider"
    );

    now += 11_000;
    beginRequest("r3");
    const thirdAttempt = await createAttendanceRecord(
      "2026-03-22T09:00:00+09:00",
      "2026-03-22T18:00:00+09:00"
    );
    assert.equal(thirdAttempt.status, 201);
    assert.deepEqual(
      providerCallOrderByRequest.get("r3"),
      ["B", "A"],
      "auto-heal probe should retry open provider after probe interval"
    );

    now += 1_000;
    beginRequest("r4");
    const fourthAttempt = await createAttendanceRecord(
      "2026-03-23T09:00:00+09:00",
      "2026-03-23T18:00:00+09:00"
    );
    assert.equal(fourthAttempt.status, 201);
    const fourthCallOrder = providerCallOrderByRequest.get("r4") ?? [];
    assert.ok(
      fourthCallOrder.includes("A"),
      "healed provider should stay closed and be called again even before next probe interval"
    );

    const firstBody = await readJson<{ record: { id: string } }>(firstAttempt);
    assert.ok(firstBody.record.id);
  } finally {
    global.fetch = previousFetch;
    Date.now = previousDateNow;
    for (const key of envKeys) {
      const value = previousEnv.get(key);
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

run()
  .then(() => {
    console.log("e2e-wi0070-attendance-reputation-adaptive-routing-autoheal.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
