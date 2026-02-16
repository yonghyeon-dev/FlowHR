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
  const employeeId = "EMP-GPS-POLICY-1001";
  const previousPolicy = process.env.FLOWHR_ATTENDANCE_GPS_REQUIRED;
  process.env.FLOWHR_ATTENDANCE_GPS_REQUIRED = "true";

  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const attendanceCreateRoute = await import("../../src/app/api/attendance/records/route.ts");
  const attendanceUpdateRoute = await import("../../src/app/api/attendance/records/[recordId]/route.ts");

  try {
    resetMemoryDataAccess();
    await memoryDataAccess.employees.create({ id: employeeId });

    const employeeManualCreate = await attendanceCreateRoute.POST(
      jsonRequest(
        "/api/attendance/records",
        {
          employeeId,
          checkInAt: "2026-02-17T09:00:00+09:00",
          checkOutAt: "2026-02-17T18:00:00+09:00",
          breakMinutes: 60,
          isHoliday: false
        },
        actorHeaders("employee", employeeId)
      )
    );
    assert.equal(employeeManualCreate.status, 400, "employee manual channel should be blocked when GPS policy is on");
    const employeeManualBody = await readJson<{ error: string }>(employeeManualCreate);
    assert.equal(employeeManualBody.error, "attendance capture policy requires GPS channel with coordinates");

    const employeeGpsCreate = await attendanceCreateRoute.POST(
      jsonRequest(
        "/api/attendance/records",
        {
          employeeId,
          checkInAt: "2026-02-17T09:00:00+09:00",
          checkOutAt: "2026-02-17T18:00:00+09:00",
          breakMinutes: 60,
          isHoliday: false,
          capture: {
            channel: "GPS",
            latitude: 37.5665,
            longitude: 126.978
          }
        },
        actorHeaders("employee", employeeId)
      )
    );
    assert.equal(employeeGpsCreate.status, 201, "employee GPS create should be allowed under policy");
    const employeeGpsBody = await readJson<{ record: { id: string } }>(employeeGpsCreate);

    const employeeDowngradeUpdate = await attendanceUpdateRoute.PATCH(
      new Request(`http://localhost/api/attendance/records/${employeeGpsBody.record.id}`, {
        method: "PATCH",
        headers: actorHeaders("employee", employeeId),
        body: JSON.stringify({
          capture: {
            channel: "QR"
          }
        })
      }),
      {
        params: Promise.resolve({ recordId: employeeGpsBody.record.id })
      } as RouteContext<{ recordId: string }>
    );
    assert.equal(
      employeeDowngradeUpdate.status,
      400,
      "employee should not downgrade GPS channel while policy is enabled"
    );

    const managerManualCreate = await attendanceCreateRoute.POST(
      jsonRequest(
        "/api/attendance/records",
        {
          employeeId,
          checkInAt: "2026-02-18T09:00:00+09:00",
          checkOutAt: "2026-02-18T18:00:00+09:00",
          breakMinutes: 60,
          isHoliday: false
        },
        actorHeaders("manager", "MGR-GPS-POLICY")
      )
    );
    assert.equal(
      managerManualCreate.status,
      201,
      "manager correction path remains allowed while employee policy is enabled"
    );
  } finally {
    if (previousPolicy === undefined) {
      delete process.env.FLOWHR_ATTENDANCE_GPS_REQUIRED;
    } else {
      process.env.FLOWHR_ATTENDANCE_GPS_REQUIRED = previousPolicy;
    }
  }
}

run()
  .then(() => {
    console.log("e2e-wi0049-attendance-gps-policy-enforcement.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
