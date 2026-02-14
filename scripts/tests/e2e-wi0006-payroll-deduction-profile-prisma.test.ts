import assert from "node:assert/strict";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "prisma";
runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
runtimeEnv.FLOWHR_PAYROLL_DEDUCTIONS_V1 = "true";
runtimeEnv.FLOWHR_PAYROLL_DEDUCTION_PROFILE_V1 = "true";

if (!runtimeEnv.DATABASE_URL || !runtimeEnv.DIRECT_URL) {
  console.error("DATABASE_URL and DIRECT_URL are required for Prisma WI-0006 e2e test.");
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
  const employeeId = `E2E-P2P-EMP-${suffix}`;
  const managerId = `E2E-P2P-MGR-${suffix}`;
  const payrollId = `E2E-P2P-PAY-${suffix}`;
  const markerNote = `e2e-wi0006-${suffix}`;
  const profileId = `DP-E2E-${suffix}`;

  const { prisma } = await import("../../src/lib/prisma.ts");
  const attendanceCreateRoute = await import("../../src/app/api/attendance/records/route.ts");
  const attendanceApproveRoute = await import(
    "../../src/app/api/attendance/records/[recordId]/approve/route.ts"
  );
  const deductionProfileRoute = await import(
    "../../src/app/api/payroll/deduction-profiles/[profileId]/route.ts"
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
    assert.equal(createResponse.status, 201, "attendance creation should succeed");
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

    const upsertProfileResponse = await deductionProfileRoute.PUT(
      jsonRequest(
        "PUT",
        `/api/payroll/deduction-profiles/${profileId}`,
        {
          name: "WI-0006 Test Profile",
          mode: "profile",
          withholdingRate: 0.03,
          socialInsuranceRate: 0.045,
          fixedOtherDeductionKrw: 2000,
          active: true
        },
        actorHeaders("payroll_operator", payrollId)
      ),
      { params: Promise.resolve({ profileId }) } as RouteContext<{ profileId: string }>
    );
    assert.equal(upsertProfileResponse.status, 200, "deduction profile upsert should succeed");
    const upsertBody = await readJson<{ profile: { version: number } }>(upsertProfileResponse);
    assert.equal(upsertBody.profile.version, 1);

    const secondUpsertProfileResponse = await deductionProfileRoute.PUT(
      jsonRequest(
        "PUT",
        `/api/payroll/deduction-profiles/${profileId}`,
        {
          name: "WI-0006 Test Profile v2",
          mode: "profile",
          withholdingRate: 0.031,
          socialInsuranceRate: 0.045,
          fixedOtherDeductionKrw: 2000,
          active: true
        },
        actorHeaders("payroll_operator", payrollId)
      ),
      { params: Promise.resolve({ profileId }) } as RouteContext<{ profileId: string }>
    );
    assert.equal(secondUpsertProfileResponse.status, 200, "second deduction profile upsert should succeed");
    const secondUpsertBody = await readJson<{ profile: { version: number } }>(
      secondUpsertProfileResponse
    );
    assert.equal(secondUpsertBody.profile.version, 2);

    const staleVersionPreviewResponse = await payrollPreviewWithDeductionsRoute.POST(
      jsonRequest(
        "POST",
        "/api/payroll/runs/preview-with-deductions",
        {
          periodStart: "2026-02-01T00:00:00+09:00",
          periodEnd: "2026-02-28T23:59:59+09:00",
          employeeId,
          hourlyRateKrw: 12000,
          deductionMode: "profile",
          profileId,
          expectedProfileVersion: 1
        },
        actorHeaders("payroll_operator", payrollId)
      )
    );
    assert.equal(staleVersionPreviewResponse.status, 409, "stale profile version should be rejected");
    const staleVersionBody = await readJson<{ error: string }>(staleVersionPreviewResponse);
    assert.equal(staleVersionBody.error, "deduction profile version mismatch");

    const previewResponse = await payrollPreviewWithDeductionsRoute.POST(
      jsonRequest(
        "POST",
        "/api/payroll/runs/preview-with-deductions",
        {
          periodStart: "2026-02-01T00:00:00+09:00",
          periodEnd: "2026-02-28T23:59:59+09:00",
          employeeId,
          hourlyRateKrw: 12000,
          deductionMode: "profile",
          profileId,
          expectedProfileVersion: 2
        },
        actorHeaders("payroll_operator", payrollId)
      )
    );
    assert.equal(previewResponse.status, 200, "profile mode preview should succeed");
    const previewBody = await readJson<{
      run: { id: string };
      summary: {
        deductionMode: "manual" | "profile";
        profileId: string | null;
        profileVersion: number | null;
        grossPayKrw: number;
        totalDeductionsKrw: number;
        netPayKrw: number;
      };
    }>(previewResponse);

    createdRunId = previewBody.run.id;
    assert.equal(previewBody.summary.deductionMode, "profile");
    assert.equal(previewBody.summary.profileId, profileId);
    assert.equal(previewBody.summary.profileVersion, 2);
    assert.equal(previewBody.summary.grossPayKrw, 96000);
    assert.equal(previewBody.summary.totalDeductionsKrw, 9296);
    assert.equal(previewBody.summary.netPayKrw, 86704);

    const savedRun = await prisma.payrollRun.findUnique({
      where: { id: createdRunId }
    });
    assert.ok(savedRun, "payroll run should be persisted");
    assert.equal(savedRun?.deductionProfileId, profileId);
    assert.equal(savedRun?.deductionProfileVersion, 2);

    const confirmResponse = await payrollConfirmRoute.POST(
      new Request(`http://localhost/api/payroll/runs/${createdRunId}/confirm`, {
        method: "POST",
        headers: actorHeaders("payroll_operator", payrollId)
      }),
      { params: Promise.resolve({ runId: createdRunId }) } as RouteContext<{ runId: string }>
    );
    assert.equal(confirmResponse.status, 200, "payroll confirm should succeed");

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
        "payroll.deduction_profile.updated",
        "payroll.deduction_profile.updated",
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
    await prisma.deductionProfile.deleteMany({
      where: { id: profileId }
    });
    await prisma.employee.deleteMany({
      where: { id: employeeId }
    });
    await prisma.$disconnect();
  }
}

run()
  .then(() => {
    console.log("e2e-wi0006-payroll-deduction-profile-prisma.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
