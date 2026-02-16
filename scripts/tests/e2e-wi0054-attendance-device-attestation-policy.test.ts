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
  const employeeId = "EMP-ATTEST-POLICY-1001";
  const previousAttestationEnabled = process.env.FLOWHR_ATTENDANCE_DEVICE_ATTESTATION_ENABLED;
  const previousAttestationTokens = process.env.FLOWHR_ATTENDANCE_DEVICE_ATTESTATION_TOKENS;
  const previousTrustedDeviceEnabled = process.env.FLOWHR_ATTENDANCE_TRUSTED_DEVICE_ENABLED;
  const previousTrustedDeviceIds = process.env.FLOWHR_ATTENDANCE_TRUSTED_DEVICE_IDS;
  const previousGpsRequired = process.env.FLOWHR_ATTENDANCE_GPS_REQUIRED;
  const previousGeofenceEnabled = process.env.FLOWHR_ATTENDANCE_GEOFENCE_ENABLED;
  const previousMultiSiteGeofenceEnabled = process.env.FLOWHR_ATTENDANCE_MULTI_SITE_GEOFENCE_ENABLED;

  process.env.FLOWHR_ATTENDANCE_DEVICE_ATTESTATION_ENABLED = "true";
  process.env.FLOWHR_ATTENDANCE_DEVICE_ATTESTATION_TOKENS =
    "DEVICE-ATTEST-01:ATTEST-TOKEN-01,DEVICE-ATTEST-02:ATTEST-TOKEN-02";
  process.env.FLOWHR_ATTENDANCE_TRUSTED_DEVICE_ENABLED = "false";
  process.env.FLOWHR_ATTENDANCE_TRUSTED_DEVICE_IDS = "";
  process.env.FLOWHR_ATTENDANCE_GPS_REQUIRED = "false";
  process.env.FLOWHR_ATTENDANCE_GEOFENCE_ENABLED = "false";
  process.env.FLOWHR_ATTENDANCE_MULTI_SITE_GEOFENCE_ENABLED = "false";

  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const attendanceCreateRoute = await import("../../src/app/api/attendance/records/route.ts");
  const attendanceUpdateRoute = await import("../../src/app/api/attendance/records/[recordId]/route.ts");

  try {
    resetMemoryDataAccess();
    await memoryDataAccess.employees.create({ id: employeeId });

    const missingTokenCreate = await attendanceCreateRoute.POST(
      jsonRequest(
        "/api/attendance/records",
        {
          employeeId,
          checkInAt: "2026-02-22T09:00:00+09:00",
          checkOutAt: "2026-02-22T18:00:00+09:00",
          breakMinutes: 60,
          isHoliday: false,
          capture: {
            channel: "GPS",
            deviceId: "DEVICE-ATTEST-01",
            latitude: 37.5665,
            longitude: 126.978
          }
        },
        actorHeaders("employee", employeeId)
      )
    );
    assert.equal(missingTokenCreate.status, 400, "missing attestation token should be rejected");
    const missingTokenBody = await readJson<{ error: string }>(missingTokenCreate);
    assert.equal(
      missingTokenBody.error,
      "attendance device attestation policy requires capture attestationToken"
    );

    const mismatchTokenCreate = await attendanceCreateRoute.POST(
      jsonRequest(
        "/api/attendance/records",
        {
          employeeId,
          checkInAt: "2026-02-22T09:00:00+09:00",
          checkOutAt: "2026-02-22T18:00:00+09:00",
          breakMinutes: 60,
          isHoliday: false,
          capture: {
            channel: "GPS",
            deviceId: "DEVICE-ATTEST-01",
            attestationToken: "ATTEST-TOKEN-MISMATCH",
            latitude: 37.5665,
            longitude: 126.978
          }
        },
        actorHeaders("employee", employeeId)
      )
    );
    assert.equal(mismatchTokenCreate.status, 400, "mismatched attestation token should be rejected");
    const mismatchTokenBody = await readJson<{ error: string }>(mismatchTokenCreate);
    assert.equal(mismatchTokenBody.error, "attendance capture attestation token is invalid for device");

    const mappedTokenCreate = await attendanceCreateRoute.POST(
      jsonRequest(
        "/api/attendance/records",
        {
          employeeId,
          checkInAt: "2026-02-22T09:00:00+09:00",
          checkOutAt: "2026-02-22T18:00:00+09:00",
          breakMinutes: 60,
          isHoliday: false,
          capture: {
            channel: "GPS",
            deviceId: "DEVICE-ATTEST-01",
            attestationToken: "ATTEST-TOKEN-01",
            latitude: 37.5665,
            longitude: 126.978
          }
        },
        actorHeaders("employee", employeeId)
      )
    );
    assert.equal(mappedTokenCreate.status, 201, "mapped attestation token should be accepted");
    const mappedTokenBody = await readJson<{ record: { id: string } }>(mappedTokenCreate);

    const mismatchTokenUpdate = await attendanceUpdateRoute.PATCH(
      new Request(`http://localhost/api/attendance/records/${mappedTokenBody.record.id}`, {
        method: "PATCH",
        headers: actorHeaders("employee", employeeId),
        body: JSON.stringify({
          capture: {
            deviceId: "DEVICE-ATTEST-01",
            attestationToken: "ATTEST-TOKEN-MISMATCH"
          }
        })
      }),
      {
        params: Promise.resolve({ recordId: mappedTokenBody.record.id })
      } as RouteContext<{ recordId: string }>
    );
    assert.equal(mismatchTokenUpdate.status, 400, "mismatched attestation token update should be rejected");

    const managerBypassResponse = await attendanceCreateRoute.POST(
      jsonRequest(
        "/api/attendance/records",
        {
          employeeId,
          checkInAt: "2026-02-23T09:00:00+09:00",
          checkOutAt: "2026-02-23T18:00:00+09:00",
          breakMinutes: 60,
          isHoliday: false
        },
        actorHeaders("manager", "MGR-ATTEST-1")
      )
    );
    assert.equal(
      managerBypassResponse.status,
      201,
      "manager correction path should bypass device attestation policy"
    );
  } finally {
    if (previousAttestationEnabled === undefined) {
      delete process.env.FLOWHR_ATTENDANCE_DEVICE_ATTESTATION_ENABLED;
    } else {
      process.env.FLOWHR_ATTENDANCE_DEVICE_ATTESTATION_ENABLED = previousAttestationEnabled;
    }

    if (previousAttestationTokens === undefined) {
      delete process.env.FLOWHR_ATTENDANCE_DEVICE_ATTESTATION_TOKENS;
    } else {
      process.env.FLOWHR_ATTENDANCE_DEVICE_ATTESTATION_TOKENS = previousAttestationTokens;
    }

    if (previousTrustedDeviceEnabled === undefined) {
      delete process.env.FLOWHR_ATTENDANCE_TRUSTED_DEVICE_ENABLED;
    } else {
      process.env.FLOWHR_ATTENDANCE_TRUSTED_DEVICE_ENABLED = previousTrustedDeviceEnabled;
    }

    if (previousTrustedDeviceIds === undefined) {
      delete process.env.FLOWHR_ATTENDANCE_TRUSTED_DEVICE_IDS;
    } else {
      process.env.FLOWHR_ATTENDANCE_TRUSTED_DEVICE_IDS = previousTrustedDeviceIds;
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

    if (previousMultiSiteGeofenceEnabled === undefined) {
      delete process.env.FLOWHR_ATTENDANCE_MULTI_SITE_GEOFENCE_ENABLED;
    } else {
      process.env.FLOWHR_ATTENDANCE_MULTI_SITE_GEOFENCE_ENABLED = previousMultiSiteGeofenceEnabled;
    }
  }
}

run()
  .then(() => {
    console.log("e2e-wi0054-attendance-device-attestation-policy.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
