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

  await memoryDataAccess.employees.create({ id: "EMP-3105" });

  const createResponse = await attendanceCreateRoute.POST(
    jsonRequest(
      "POST",
      "/api/attendance/records",
      {
        employeeId: "EMP-3105",
        checkInAt: "2026-02-14T09:00:00+09:00",
        checkOutAt: "2026-02-14T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      actorHeaders("employee", "EMP-3105")
    )
  );
  assert.equal(createResponse.status, 201);
  const createdBody = await readJson<{ record: { id: string } }>(createResponse);

  const approveResponse = await attendanceApproveRoute.POST(
    new Request(`http://localhost/api/attendance/records/${createdBody.record.id}/approve`, {
      method: "POST",
      headers: actorHeaders("manager", "MGR-3105")
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
        employeeId: "EMP-3105",
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
          employmentInsuranceCapKrw: 40000
        }
      },
      actorHeaders("payroll_operator", "PAY-3105")
    )
  );
  assert.equal(previewResponse.status, 200, "progressive+cap statutory preview should succeed");
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
          contributionBasesKrw: {
            nationalPensionBaseKrw: number;
            healthInsuranceBaseKrw: number;
            employmentInsuranceBaseKrw: number;
          };
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

  assert.equal(previewBody.summary.grossPayKrw, 96000);
  assert.equal(previewBody.summary.withholdingTaxKrw, 9240);
  assert.equal(previewBody.summary.socialInsuranceKrw, 5063);
  assert.equal(previewBody.summary.otherDeductionsKrw, 500);
  assert.equal(previewBody.summary.totalDeductionsKrw, 14803);
  assert.equal(previewBody.summary.netPayKrw, 81197);

  assert.equal(previewBody.summary.deductionBreakdown.additional.taxMethod, "progressive_brackets");
  assert.equal(previewBody.summary.deductionBreakdown.additional.taxableBaseKrw, 86000);
  assert.deepEqual(previewBody.summary.deductionBreakdown.additional.contributionBasesKrw, {
    nationalPensionBaseKrw: 60000,
    healthInsuranceBaseKrw: 50000,
    employmentInsuranceBaseKrw: 40000
  });
  assert.deepEqual(previewBody.summary.deductionBreakdown.additional.components, {
    incomeTaxKrw: 8400,
    localIncomeTaxKrw: 840,
    nationalPensionKrw: 2700,
    healthInsuranceKrw: 1773,
    longTermCareKrw: 230,
    employmentInsuranceKrw: 360
  });

  const invalidBracketsResponse = await payrollPreviewWithDeductionsRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview-with-deductions",
      {
        periodStart: "2026-02-01T00:00:00+09:00",
        periodEnd: "2026-02-28T23:59:59+09:00",
        employeeId: "EMP-3105",
        hourlyRateKrw: 12000,
        deductionMode: "statutory_kr_baseline",
        statutory: {
          incomeTaxBrackets: [
            { upToKrw: 60000, rate: 0.06 },
            { upToKrw: 50000, rate: 0.15 }
          ]
        }
      },
      actorHeaders("payroll_operator", "PAY-3105")
    )
  );
  assert.equal(invalidBracketsResponse.status, 400, "invalid bracket ordering should be rejected");
}

run()
  .then(() => {
    console.log("e2e-wi0105-payroll-kr-progressive-cap.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
