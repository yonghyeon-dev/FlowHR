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
  const { resetMemoryDataAccess, getMemoryAuditActions } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const { resetRuntimeMemoryDomainEvents, getRuntimeMemoryDomainEvents } = await import(
    "../../src/features/shared/runtime-domain-event-publisher.ts"
  );
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

  resetMemoryDataAccess();
  resetRuntimeMemoryDomainEvents();

  const createResponse = await attendanceCreateRoute.POST(
    jsonRequest(
      "POST",
      "/api/attendance/records",
      {
        employeeId: "EMP-2001",
        checkInAt: "2026-02-11T09:00:00+09:00",
        checkOutAt: "2026-02-11T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      actorHeaders("employee", "EMP-2001")
    )
  );
  assert.equal(createResponse.status, 201, "attendance creation should succeed");
  const createdBody = await readJson<{ record: { id: string } }>(createResponse);

  const approveResponse = await attendanceApproveRoute.POST(
    new Request(`http://localhost/api/attendance/records/${createdBody.record.id}/approve`, {
      method: "POST",
      headers: actorHeaders("manager", "MGR-2001")
    }),
    { params: Promise.resolve({ recordId: createdBody.record.id }) } as RouteContext<{
      recordId: string;
    }>
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
        employeeId: "EMP-2001",
        hourlyRateKrw: 12000,
        deductions: {
          withholdingTaxKrw: 5000,
          socialInsuranceKrw: 3000,
          otherDeductionsKrw: 1000
        }
      },
      actorHeaders("payroll_operator", "PAY-2001")
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
        employeeId: "EMP-2001",
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
      actorHeaders("payroll_operator", "PAY-2001")
    )
  );
  assert.equal(previewResponse.status, 200, "deduction preview should succeed");
  const previewBody = await readJson<{
    run: {
      id: string;
      grossPayKrw: number;
      withholdingTaxKrw: number | null;
      socialInsuranceKrw: number | null;
      otherDeductionsKrw: number | null;
      totalDeductionsKrw: number | null;
      netPayKrw: number | null;
      deductionBreakdown: Record<string, unknown> | null;
    };
    summary: {
      sourceRecordCount: number;
      totals: {
        regular: number;
        overtime: number;
        night: number;
        holiday: number;
      };
      grossPayKrw: number;
      withholdingTaxKrw: number;
      socialInsuranceKrw: number;
      otherDeductionsKrw: number;
      totalDeductionsKrw: number;
      netPayKrw: number;
      deductionBreakdown: Record<string, unknown>;
    };
  }>(previewResponse);

  assert.equal(previewBody.summary.sourceRecordCount, 1);
  assert.deepEqual(previewBody.summary.totals, {
    regular: 480,
    overtime: 0,
    night: 0,
    holiday: 0
  });
  assert.equal(previewBody.summary.grossPayKrw, 96000);
  assert.equal(previewBody.summary.withholdingTaxKrw, 5000);
  assert.equal(previewBody.summary.socialInsuranceKrw, 3000);
  assert.equal(previewBody.summary.otherDeductionsKrw, 1000);
  assert.equal(previewBody.summary.totalDeductionsKrw, 9000);
  assert.equal(previewBody.summary.netPayKrw, 87000);
  assert.equal(previewBody.run.totalDeductionsKrw, 9000);
  assert.equal(previewBody.run.netPayKrw, 87000);
  const additional = previewBody.run.deductionBreakdown?.additional as
    | Record<string, unknown>
    | undefined;
  assert.equal(additional?.localTaxKrw, 500);

  const confirmResponse = await payrollConfirmRoute.POST(
    new Request(`http://localhost/api/payroll/runs/${previewBody.run.id}/confirm`, {
      method: "POST",
      headers: actorHeaders("payroll_operator", "PAY-2001")
    }),
    { params: Promise.resolve({ runId: previewBody.run.id }) } as RouteContext<{ runId: string }>
  );
  assert.equal(confirmResponse.status, 200, "payroll confirm should succeed");

  assert.deepEqual(getMemoryAuditActions(), [
    "attendance.recorded",
    "attendance.approved",
    "payroll.preview_with_deductions.failed",
    "payroll.deductions_calculated",
    "payroll.confirmed"
  ]);
  assert.deepEqual(
    getRuntimeMemoryDomainEvents().map((event) => event.name),
    [
      "attendance.recorded.v1",
      "attendance.approved.v1",
      "payroll.deductions.calculated.v1",
      "payroll.confirmed.v1"
    ]
  );
}

run()
  .then(() => {
    console.log("e2e-wi0005-payroll-phase2.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
