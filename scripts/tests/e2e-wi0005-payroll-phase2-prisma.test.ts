import assert from "node:assert/strict";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "prisma";
runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";

if (!runtimeEnv.DATABASE_URL || !runtimeEnv.DIRECT_URL) {
  console.error("DATABASE_URL and DIRECT_URL are required for Prisma phase2 e2e test.");
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
  const suffix = `${Date.now()}`;
  const employeeId = `E2E-P2-EMP-${suffix}`;
  const managerId = `E2E-P2-MGR-${suffix}`;
  const payrollId = `E2E-P2-PAY-${suffix}`;
  const markerNote = `e2e-p2-${suffix}`;

  const { prisma } = await import("../../src/lib/prisma.ts");
  const attendanceCreateRoute = await import("../../src/app/api/attendance/records/route.ts");
  const attendanceApproveRoute = await import(
    "../../src/app/api/attendance/records/[recordId]/approve/route.ts"
  );
  const payrollPreviewWithDeductionsRoute = await import(
    "../../src/app/api/payroll/runs/preview-with-deductions/route.ts"
  );
  const payrollConfirmRoute = await import(
    "../../src/app/api/payroll/runs/[runId]/confirm/route.ts"
  );

  let createdRecordId: string | null = null;
  let createdRunId: string | null = null;

  try {
    await prisma.employee.create({ data: { id: employeeId } });

    const createResponse = await attendanceCreateRoute.POST(
      jsonRequest(
        "POST",
        "/api/attendance/records",
        {
          employeeId,
          checkInAt: "2026-02-12T09:00:00+09:00",
          checkOutAt: "2026-02-12T18:00:00+09:00",
          breakMinutes: 60,
          isHoliday: false,
          notes: markerNote
        },
        actorHeaders("employee", employeeId)
      )
    );
    assert.equal(createResponse.status, 201, "attendance create should succeed");
    const createBody = await readJson<{ record: { id: string } }>(createResponse);
    createdRecordId = createBody.record.id;

    const approveResponse = await attendanceApproveRoute.POST(
      new Request(`http://localhost/api/attendance/records/${createdRecordId}/approve`, {
        method: "POST",
        headers: actorHeaders("manager", managerId)
      }),
      { params: Promise.resolve({ recordId: createdRecordId }) } as RouteContext<{ recordId: string }>
    );
    assert.equal(approveResponse.status, 200, "attendance approve should succeed");

    runtimeEnv.FLOWHR_PAYROLL_DEDUCTIONS_V1 = "off";
    const disabledResponse = await payrollPreviewWithDeductionsRoute.POST(
      jsonRequest(
        "POST",
        "/api/payroll/runs/preview-with-deductions",
        {
          periodStart: "2026-02-01T00:00:00+09:00",
          periodEnd: "2026-02-28T23:59:59+09:00",
          employeeId,
          hourlyRateKrw: 12000,
          deductions: {
            withholdingTaxKrw: 5000,
            socialInsuranceKrw: 3000,
            otherDeductionsKrw: 1000
          }
        },
        actorHeaders("payroll_operator", payrollId)
      )
    );
    assert.equal(disabledResponse.status, 409, "feature-disabled request should be blocked");

    runtimeEnv.FLOWHR_PAYROLL_DEDUCTIONS_V1 = "true";
    const previewResponse = await payrollPreviewWithDeductionsRoute.POST(
      jsonRequest(
        "POST",
        "/api/payroll/runs/preview-with-deductions",
        {
          periodStart: "2026-02-01T00:00:00+09:00",
          periodEnd: "2026-02-28T23:59:59+09:00",
          employeeId,
          hourlyRateKrw: 12000,
          deductions: {
            withholdingTaxKrw: 5000,
            socialInsuranceKrw: 3000,
            otherDeductionsKrw: 1000,
            breakdown: {
              localTaxKrw: 500
            }
          }
        },
        actorHeaders("payroll_operator", payrollId)
      )
    );
    assert.equal(previewResponse.status, 200, "phase2 preview should succeed");
    const previewBody = await readJson<{
      run: { id: string };
      summary: {
        grossPayKrw: number;
        totalDeductionsKrw: number;
        netPayKrw: number;
      };
    }>(previewResponse);

    createdRunId = previewBody.run.id;
    assert.equal(previewBody.summary.grossPayKrw, 96000);
    assert.equal(previewBody.summary.totalDeductionsKrw, 9000);
    assert.equal(previewBody.summary.netPayKrw, 87000);

    const savedRun = await prisma.payrollRun.findUnique({
      where: { id: createdRunId }
    });
    assert.ok(savedRun, "payroll run should be persisted");
    assert.equal(savedRun?.withholdingTaxKrw, 5000);
    assert.equal(savedRun?.socialInsuranceKrw, 3000);
    assert.equal(savedRun?.otherDeductionsKrw, 1000);
    assert.equal(savedRun?.totalDeductionsKrw, 9000);
    assert.equal(savedRun?.netPayKrw, 87000);
    assert.equal(
      ((savedRun?.deductionBreakdown as { additional?: { localTaxKrw?: number } } | null)?.additional
        ?.localTaxKrw ?? null),
      500
    );

    const confirmResponse = await payrollConfirmRoute.POST(
      new Request(`http://localhost/api/payroll/runs/${createdRunId}/confirm`, {
        method: "POST",
        headers: actorHeaders("payroll_operator", payrollId)
      }),
      { params: Promise.resolve({ runId: createdRunId }) } as RouteContext<{ runId: string }>
    );
    assert.equal(confirmResponse.status, 200, "phase2 payroll confirm should succeed");

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
      [
        "attendance.recorded",
        "attendance.approved",
        "payroll.preview_with_deductions.failed",
        "payroll.deductions_calculated",
        "payroll.confirmed"
      ]
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
    await prisma.employee.deleteMany({
      where: { id: employeeId }
    });
    await prisma.$disconnect();
  }
}

run()
  .then(() => {
    console.log("e2e-wi0005-payroll-phase2-prisma.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
