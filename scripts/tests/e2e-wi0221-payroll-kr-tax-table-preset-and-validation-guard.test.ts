import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

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

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
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

  const payrollApiSpec = readUtf8("specs", "payroll", "api.yaml");
  const payrollContract = readUtf8("specs", "payroll", "contract.yaml");
  const payrollTestCases = readUtf8("specs", "payroll", "test-cases.md");
  assert.match(payrollApiSpec, /incomeTaxLookupPresetId/);
  assert.match(payrollContract, /incomeTaxLookupPresetId/);
  assert.match(payrollContract, /monotonic non-decreasing taxKrw/);
  assert.match(payrollTestCases, /Preset\/Validation Gate/);

  resetMemoryDataAccess();
  runtimeEnv.FLOWHR_PAYROLL_DEDUCTIONS_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_KR_BASELINE_V1 = "true";

  await memoryDataAccess.employees.create({ id: "EMP-3221" });

  const createResponse = await attendanceCreateRoute.POST(
    jsonRequest(
      "POST",
      "/api/attendance/records",
      {
        employeeId: "EMP-3221",
        checkInAt: "2026-02-14T09:00:00+09:00",
        checkOutAt: "2026-02-14T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      actorHeaders("employee", "EMP-3221")
    )
  );
  assert.equal(createResponse.status, 201);
  const createdBody = await readJson<{ record: { id: string } }>(createResponse);

  const approveResponse = await attendanceApproveRoute.POST(
    new Request(`http://localhost/api/attendance/records/${createdBody.record.id}/approve`, {
      method: "POST",
      headers: actorHeaders("manager", "MGR-3221")
    }),
    { params: Promise.resolve({ recordId: createdBody.record.id }) } as RouteContext<{
      recordId: string;
    }>
  );
  assert.equal(approveResponse.status, 200);

  const presetPreviewResponse = await payrollPreviewWithDeductionsRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview-with-deductions",
      {
        periodStart: "2026-02-01T00:00:00+09:00",
        periodEnd: "2026-02-28T23:59:59+09:00",
        employeeId: "EMP-3221",
        hourlyRateKrw: 12000,
        deductionMode: "statutory_kr_baseline",
        statutory: {
          nonTaxableIncomeKrw: 10000,
          otherDeductionsKrw: 500,
          incomeTaxLookupPresetId: "kr_simple_monthly_v2026_01",
          additionalTaxCreditKrw: 600,
          dependentCount: 1,
          dependentTaxCreditPerPersonKrw: 400
        }
      },
      actorHeaders("payroll_operator", "PAY-3221")
    )
  );
  assert.equal(presetPreviewResponse.status, 200, "preset lookup-table preview should succeed");
  const presetPreviewBody = await readJson<{
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
          selectedIncomeTaxLookupRow: { upToKrw: number | null; taxKrw: number } | null;
          incomeTaxLookupTableChecksum: string | null;
          incomeTaxLookupPreset: {
            id: string;
            label: string;
            effectiveFrom: string;
            source: string;
          } | null;
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
  }>(presetPreviewResponse);

  assert.equal(presetPreviewBody.summary.grossPayKrw, 96000);
  assert.equal(presetPreviewBody.summary.withholdingTaxKrw, 6820);
  assert.equal(presetPreviewBody.summary.socialInsuranceKrw, 8088);
  assert.equal(presetPreviewBody.summary.otherDeductionsKrw, 500);
  assert.equal(presetPreviewBody.summary.totalDeductionsKrw, 15408);
  assert.equal(presetPreviewBody.summary.netPayKrw, 80592);
  assert.equal(
    presetPreviewBody.summary.deductionBreakdown.additional.taxMethod,
    "simple_lookup_table_preset"
  );
  assert.deepEqual(presetPreviewBody.summary.deductionBreakdown.additional.selectedIncomeTaxLookupRow, {
    upToKrw: 100000,
    taxKrw: 7200
  });
  assert.equal(
    presetPreviewBody.summary.deductionBreakdown.additional.incomeTaxLookupPreset?.id,
    "kr_simple_monthly_v2026_01"
  );
  assert.match(
    presetPreviewBody.summary.deductionBreakdown.additional.incomeTaxLookupTableChecksum ?? "",
    /^[a-f0-9]{64}$/i
  );
  assert.deepEqual(presetPreviewBody.summary.deductionBreakdown.additional.components, {
    incomeTaxKrw: 6200,
    localIncomeTaxKrw: 620,
    nationalPensionKrw: 3870,
    healthInsuranceKrw: 3049,
    longTermCareKrw: 395,
    employmentInsuranceKrw: 774
  });

  const unknownPresetResponse = await payrollPreviewWithDeductionsRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview-with-deductions",
      {
        periodStart: "2026-02-01T00:00:00+09:00",
        periodEnd: "2026-02-28T23:59:59+09:00",
        employeeId: "EMP-3221",
        hourlyRateKrw: 12000,
        deductionMode: "statutory_kr_baseline",
        statutory: {
          incomeTaxLookupPresetId: "kr_unknown_preset"
        }
      },
      actorHeaders("payroll_operator", "PAY-3221")
    )
  );
  assert.equal(unknownPresetResponse.status, 400, "unknown preset should be rejected");

  const mixedPresetResponse = await payrollPreviewWithDeductionsRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview-with-deductions",
      {
        periodStart: "2026-02-01T00:00:00+09:00",
        periodEnd: "2026-02-28T23:59:59+09:00",
        employeeId: "EMP-3221",
        hourlyRateKrw: 12000,
        deductionMode: "statutory_kr_baseline",
        statutory: {
          incomeTaxLookupPresetId: "kr_simple_monthly_v2026_01",
          incomeTaxLookupTable: [
            { upToKrw: 100000, taxKrw: 7000 },
            { upToKrw: null, taxKrw: 12000 }
          ]
        }
      },
      actorHeaders("payroll_operator", "PAY-3221")
    )
  );
  assert.equal(mixedPresetResponse.status, 400, "preset and direct lookup table should be mutually exclusive");

  const malformedLookupResponse = await payrollPreviewWithDeductionsRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview-with-deductions",
      {
        periodStart: "2026-02-01T00:00:00+09:00",
        periodEnd: "2026-02-28T23:59:59+09:00",
        employeeId: "EMP-3221",
        hourlyRateKrw: 12000,
        deductionMode: "statutory_kr_baseline",
        statutory: {
          incomeTaxLookupTable: [
            { upToKrw: 100000, taxKrw: 7000 },
            { upToKrw: null, taxKrw: 6500 }
          ]
        }
      },
      actorHeaders("payroll_operator", "PAY-3221")
    )
  );
  assert.equal(malformedLookupResponse.status, 400, "non-monotonic lookup-table tax rows should be rejected");
}

run()
  .then(() => {
    console.log("e2e-wi0221-payroll-kr-tax-table-preset-and-validation-guard.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
