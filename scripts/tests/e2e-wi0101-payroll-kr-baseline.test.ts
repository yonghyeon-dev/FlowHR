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
  const { memoryDataAccess, resetMemoryDataAccess, getMemoryAuditActions } = await import(
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

  resetMemoryDataAccess();
  resetRuntimeMemoryDomainEvents();

  await memoryDataAccess.employees.create({ id: "EMP-3101" });

  const createResponse = await attendanceCreateRoute.POST(
    jsonRequest(
      "POST",
      "/api/attendance/records",
      {
        employeeId: "EMP-3101",
        checkInAt: "2026-02-14T09:00:00+09:00",
        checkOutAt: "2026-02-14T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      actorHeaders("employee", "EMP-3101")
    )
  );
  assert.equal(createResponse.status, 201, "attendance creation should succeed");
  const createdBody = await readJson<{ record: { id: string } }>(createResponse);

  const approveResponse = await attendanceApproveRoute.POST(
    new Request(`http://localhost/api/attendance/records/${createdBody.record.id}/approve`, {
      method: "POST",
      headers: actorHeaders("manager", "MGR-3101")
    }),
    { params: Promise.resolve({ recordId: createdBody.record.id }) } as RouteContext<{
      recordId: string;
    }>
  );
  assert.equal(approveResponse.status, 200, "attendance approve should succeed");

  runtimeEnv.FLOWHR_PAYROLL_DEDUCTIONS_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_KR_BASELINE_V1 = "off";

  const featureDisabledResponse = await payrollPreviewWithDeductionsRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview-with-deductions",
      {
        periodStart: "2026-02-01T00:00:00+09:00",
        periodEnd: "2026-02-28T23:59:59+09:00",
        employeeId: "EMP-3101",
        hourlyRateKrw: 12000,
        deductionMode: "statutory_kr_baseline"
      },
      actorHeaders("payroll_operator", "PAY-3101")
    )
  );
  assert.equal(featureDisabledResponse.status, 409, "kr baseline feature flag should gate request");

  runtimeEnv.FLOWHR_PAYROLL_KR_BASELINE_V1 = "true";

  const previewResponse = await payrollPreviewWithDeductionsRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview-with-deductions",
      {
        periodStart: "2026-02-01T00:00:00+09:00",
        periodEnd: "2026-02-28T23:59:59+09:00",
        employeeId: "EMP-3101",
        hourlyRateKrw: 12000,
        deductionMode: "statutory_kr_baseline",
        statutory: {
          nonTaxableIncomeKrw: 10000,
          otherDeductionsKrw: 1000
        }
      },
      actorHeaders("payroll_operator", "PAY-3101")
    )
  );
  assert.equal(previewResponse.status, 200, "statutory baseline preview should succeed");
  const previewBody = await readJson<{
    summary: {
      deductionMode: "manual" | "profile" | "statutory_kr_baseline";
      grossPayKrw: number;
      withholdingTaxKrw: number;
      socialInsuranceKrw: number;
      otherDeductionsKrw: number;
      totalDeductionsKrw: number;
      netPayKrw: number;
      deductionBreakdown: {
        additional: {
          taxableBaseKrw: number;
          components: {
            incomeTaxKrw: number;
            localIncomeTaxKrw: number;
            nationalPensionKrw: number;
            healthInsuranceKrw: number;
            longTermCareKrw: number;
            employmentInsuranceKrw: number;
          };
        };
      };
    };
  }>(previewResponse);

  assert.equal(previewBody.summary.deductionMode, "statutory_kr_baseline");
  assert.equal(previewBody.summary.grossPayKrw, 96000);
  assert.equal(previewBody.summary.withholdingTaxKrw, 2838);
  assert.equal(previewBody.summary.socialInsuranceKrw, 8088);
  assert.equal(previewBody.summary.otherDeductionsKrw, 1000);
  assert.equal(previewBody.summary.totalDeductionsKrw, 11926);
  assert.equal(previewBody.summary.netPayKrw, 84074);
  assert.equal(previewBody.summary.deductionBreakdown.additional.taxableBaseKrw, 86000);
  assert.deepEqual(previewBody.summary.deductionBreakdown.additional.components, {
    incomeTaxKrw: 2580,
    localIncomeTaxKrw: 258,
    nationalPensionKrw: 3870,
    healthInsuranceKrw: 3049,
    longTermCareKrw: 395,
    employmentInsuranceKrw: 774
  });

  assert.deepEqual(getMemoryAuditActions(), [
    "attendance.recorded",
    "attendance.approved",
    "payroll.preview_with_deductions.failed",
    "payroll.deductions_calculated"
  ]);
  assert.deepEqual(
    getRuntimeMemoryDomainEvents().map((event) => event.name),
    ["attendance.recorded.v1", "attendance.approved.v1", "payroll.deductions.calculated.v1"]
  );
}

run()
  .then(() => {
    console.log("e2e-wi0101-payroll-kr-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
