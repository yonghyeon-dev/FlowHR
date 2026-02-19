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

function jsonRequest(
  method: string,
  path: string,
  payload: JsonPayload,
  headers: Record<string, string>
) {
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
  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const attendanceCreateRoute = await import("../../src/app/api/attendance/records/route.ts");
  const attendanceApproveRoute = await import(
    "../../src/app/api/attendance/records/[recordId]/approve/route.ts"
  );
  const payrollPreviewWithDeductionsRoute = await import(
    "../../src/app/api/payroll/runs/preview-with-deductions/route.ts"
  );

  resetMemoryDataAccess();
  runtimeEnv.FLOWHR_PAYROLL_DEDUCTIONS_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_KR_BASELINE_V1 = "true";

  await memoryDataAccess.employees.create({ id: "EMP-3106" });

  const createResponse = await attendanceCreateRoute.POST(
    jsonRequest(
      "POST",
      "/api/attendance/records",
      {
        employeeId: "EMP-3106",
        checkInAt: "2026-02-14T09:00:00+09:00",
        checkOutAt: "2026-02-14T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      actorHeaders("employee", "EMP-3106")
    )
  );
  assert.equal(createResponse.status, 201);
  const createdBody = await readJson<{ record: { id: string } }>(createResponse);

  const approveResponse = await attendanceApproveRoute.POST(
    new Request(`http://localhost/api/attendance/records/${createdBody.record.id}/approve`, {
      method: "POST",
      headers: actorHeaders("manager", "MGR-3106")
    }),
    { params: Promise.resolve({ recordId: createdBody.record.id }) } as RouteContext<{
      recordId: string;
    }>
  );
  assert.equal(approveResponse.status, 200);

  const previewResponse = await payrollPreviewWithDeductionsRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview-with-deductions",
      {
        periodStart: "2026-02-01T00:00:00+09:00",
        periodEnd: "2026-02-28T23:59:59+09:00",
        employeeId: "EMP-3106",
        hourlyRateKrw: 12000,
        deductionMode: "statutory_kr_baseline",
        statutory: {
          nonTaxableIncomeKrw: 10000,
          otherDeductionsKrw: 500,
          incomeTaxBrackets: [
            { upToKrw: 50000, rate: 0.06 },
            { upToKrw: null, rate: 0.15 }
          ],
          nationalPensionCapKrw: 60000,
          healthInsuranceCapKrw: 50000,
          employmentInsuranceCapKrw: 40000,
          additionalTaxCreditKrw: 1500,
          dependentCount: 2,
          dependentTaxCreditPerPersonKrw: 1000,
          requireMonthlyBoundary: true
        }
      },
      actorHeaders("payroll_operator", "PAY-3106")
    )
  );
  assert.equal(previewResponse.status, 200, "tax-credit + boundary statutory preview should succeed");

  const previewBody = await readJson<{
    summary: {
      grossPayKrw: number;
      withholdingTaxKrw: number;
      socialInsuranceKrw: number;
      otherDeductionsKrw: number;
      totalDeductionsKrw: number;
      netPayKrw: number;
      deductionBreakdown: {
        additional: {
          taxMethod: string;
          taxableBaseKrw: number;
          components: {
            incomeTaxKrw: number;
            localIncomeTaxKrw: number;
            nationalPensionKrw: number;
            healthInsuranceKrw: number;
            longTermCareKrw: number;
            employmentInsuranceKrw: number;
          };
          taxCreditsKrw: {
            preCreditIncomeTaxKrw: number;
            additionalTaxCreditKrw: number;
            dependentCount: number;
            dependentTaxCreditPerPersonKrw: number;
            dependentTaxCreditKrw: number;
            totalTaxCreditKrw: number;
          };
          monthlyBoundary: {
            required: boolean;
            validated: boolean;
            periodStartSeoul: string;
            periodEndSeoul: string;
          };
        };
      };
    };
  }>(previewResponse);

  assert.equal(previewBody.summary.grossPayKrw, 96000);
  assert.equal(previewBody.summary.withholdingTaxKrw, 5390);
  assert.equal(previewBody.summary.socialInsuranceKrw, 5063);
  assert.equal(previewBody.summary.otherDeductionsKrw, 500);
  assert.equal(previewBody.summary.totalDeductionsKrw, 10953);
  assert.equal(previewBody.summary.netPayKrw, 85047);
  assert.equal(previewBody.summary.deductionBreakdown.additional.taxMethod, "progressive_brackets");
  assert.equal(previewBody.summary.deductionBreakdown.additional.taxableBaseKrw, 86000);
  assert.deepEqual(previewBody.summary.deductionBreakdown.additional.components, {
    incomeTaxKrw: 4900,
    localIncomeTaxKrw: 490,
    nationalPensionKrw: 2700,
    healthInsuranceKrw: 1773,
    longTermCareKrw: 230,
    employmentInsuranceKrw: 360
  });
  assert.deepEqual(previewBody.summary.deductionBreakdown.additional.taxCreditsKrw, {
    preCreditIncomeTaxKrw: 8400,
    additionalTaxCreditKrw: 1500,
    dependentCount: 2,
    dependentTaxCreditPerPersonKrw: 1000,
    dependentTaxCreditKrw: 2000,
    totalTaxCreditKrw: 3500
  });
  assert.equal(previewBody.summary.deductionBreakdown.additional.monthlyBoundary.required, true);
  assert.equal(previewBody.summary.deductionBreakdown.additional.monthlyBoundary.validated, true);
  assert.equal(
    previewBody.summary.deductionBreakdown.additional.monthlyBoundary.periodStartSeoul,
    "2026-02-01 00:00:00 (Asia/Seoul)"
  );
  assert.equal(
    previewBody.summary.deductionBreakdown.additional.monthlyBoundary.periodEndSeoul,
    "2026-02-28 23:59:59 (Asia/Seoul)"
  );

  const invalidBoundaryResponse = await payrollPreviewWithDeductionsRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview-with-deductions",
      {
        periodStart: "2026-02-02T00:00:00+09:00",
        periodEnd: "2026-02-28T23:59:59+09:00",
        employeeId: "EMP-3106",
        hourlyRateKrw: 12000,
        deductionMode: "statutory_kr_baseline",
        statutory: {
          requireMonthlyBoundary: true
        }
      },
      actorHeaders("payroll_operator", "PAY-3106")
    )
  );
  assert.equal(
    invalidBoundaryResponse.status,
    400,
    "non-month-boundary range should be rejected when requireMonthlyBoundary=true"
  );
}

run()
  .then(() => {
    console.log("e2e-wi0106-payroll-tax-credit-boundary.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
