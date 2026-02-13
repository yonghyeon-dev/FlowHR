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

type JsonPayload = Record<string, unknown>;
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

function jsonRequest(method: string, path: string, payload: JsonPayload, headers: Record<string, string>) {
  return new Request(`http://localhost${path}`, {
    method,
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
  const employeeId = `E2E-PRISMA-EMP-${nowTag}`;
  const managerId = `E2E-PRISMA-MGR-${nowTag}`;
  const payrollId = `E2E-PRISMA-PAY-${nowTag}`;
  const markerNote = `e2e-prisma-${nowTag}`;

  const { prisma } = await import("../../src/lib/prisma.ts");
  const attendanceCreateRoute = await import("../../src/app/api/attendance/records/route.ts");
  const attendanceApproveRoute = await import(
    "../../src/app/api/attendance/records/[recordId]/approve/route.ts"
  );
  const payrollPreviewRoute = await import("../../src/app/api/payroll/runs/preview/route.ts");
  const payrollConfirmRoute = await import(
    "../../src/app/api/payroll/runs/[runId]/confirm/route.ts"
  );

  let createdRecordId: string | null = null;
  let createdRunId: string | null = null;

  try {
    const createResponse = await attendanceCreateRoute.POST(
      jsonRequest(
        "POST",
        "/api/attendance/records",
        {
          employeeId,
          checkInAt: "2026-02-10T09:00:00+09:00",
          checkOutAt: "2026-02-10T18:00:00+09:00",
          breakMinutes: 60,
          isHoliday: false,
          notes: markerNote
        },
        actorHeaders("employee", employeeId)
      )
    );
    assert.equal(createResponse.status, 201, "attendance create should succeed");
    const createBody = await readJson<{ record: { id: string; state: string } }>(createResponse);
    createdRecordId = createBody.record.id;
    assert.equal(createBody.record.state, "PENDING");

    const approveResponse = await attendanceApproveRoute.POST(
      new Request(`http://localhost/api/attendance/records/${createdRecordId}/approve`, {
        method: "POST",
        headers: actorHeaders("manager", managerId)
      }),
      { params: Promise.resolve({ recordId: createdRecordId }) } as RouteContext<{ recordId: string }>
    );
    assert.equal(approveResponse.status, 200, "attendance approve should succeed");

    const previewResponse = await payrollPreviewRoute.POST(
      jsonRequest(
        "POST",
        "/api/payroll/runs/preview",
        {
          periodStart: "2026-02-01T00:00:00+09:00",
          periodEnd: "2026-02-28T23:59:59+09:00",
          employeeId,
          hourlyRateKrw: 12000
        },
        actorHeaders("payroll_operator", payrollId)
      )
    );
    assert.equal(previewResponse.status, 200, "payroll preview should succeed");
    const previewBody = await readJson<{
      run: { id: string };
      summary: {
        sourceRecordCount: number;
        totals: { regular: number; overtime: number; night: number; holiday: number };
        grossPayKrw: number;
      };
    }>(previewResponse);

    createdRunId = previewBody.run.id;
    assert.equal(previewBody.summary.sourceRecordCount, 1);
    assert.deepEqual(previewBody.summary.totals, {
      regular: 480,
      overtime: 0,
      night: 0,
      holiday: 0
    });
    assert.equal(previewBody.summary.grossPayKrw, 96000);

    const confirmResponse = await payrollConfirmRoute.POST(
      new Request(`http://localhost/api/payroll/runs/${createdRunId}/confirm`, {
        method: "POST",
        headers: actorHeaders("payroll_operator", payrollId)
      }),
      { params: Promise.resolve({ runId: createdRunId }) } as RouteContext<{ runId: string }>
    );
    assert.equal(confirmResponse.status, 200, "payroll confirmation should succeed");
    const confirmBody = await readJson<{ run: { state: string } }>(confirmResponse);
    assert.equal(confirmBody.run.state, "CONFIRMED");

    const auditActions = await prisma.auditLog.findMany({
      where: {
        createdAt: { gte: startedAt },
        actorId: { in: [employeeId, managerId, payrollId] }
      },
      orderBy: { createdAt: "asc" },
      select: { action: true }
    });

    assert.deepEqual(
      auditActions.map((row: { action: string }) => row.action),
      ["attendance.recorded", "attendance.approved", "payroll.calculated", "payroll.confirmed"]
    );
  } finally {
    await prisma.auditLog.deleteMany({
      where: {
        createdAt: { gte: startedAt },
        actorId: { in: [employeeId, managerId, payrollId] }
      }
    });
    await prisma.payrollRun.deleteMany({
      where: { employeeId }
    });
    await prisma.attendanceRecord.deleteMany({
      where: {
        employeeId,
        notes: markerNote
      }
    });
    await prisma.$disconnect();
  }
}

run()
  .then(() => {
    console.log("e2e-wi0001-prisma.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
