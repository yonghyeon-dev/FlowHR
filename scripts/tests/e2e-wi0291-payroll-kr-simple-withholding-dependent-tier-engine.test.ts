import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "memory";
runtimeEnv.FLOWHR_EVENT_PUBLISHER = "memory";
runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
runtimeEnv.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.DIRECT_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";

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

function jsonRequest(method: string, urlPath: string, payload: JsonPayload, headers: Record<string, string>) {
  return new Request(`http://localhost${urlPath}`, {
    method,
    headers,
    body: JSON.stringify(payload)
  });
}

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
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

  const payrollApiSpec = readUtf8("specs", "payroll", "api.yaml");
  const payrollContract = readUtf8("specs", "payroll", "contract.yaml");
  const payrollTestCases = readUtf8("specs", "payroll", "test-cases.md");
  assert.match(payrollApiSpec, /version:\s*1\.58\.0/);
  assert.match(payrollApiSpec, /dependentTaxKrw/);
  assert.match(payrollContract, /version:\s*1\.58\.0/);
  assert.match(payrollContract, /dependent-aware simple withholding lookup-tier rows/i);
  assert.match(payrollTestCases, /dependent-aware lookup tiers/i);

  resetMemoryDataAccess();
  runtimeEnv.FLOWHR_PAYROLL_DEDUCTIONS_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_KR_BASELINE_V1 = "true";

  await memoryDataAccess.employees.create({ id: "EMP-3291" });

  const createResponse = await attendanceCreateRoute.POST(
    jsonRequest(
      "POST",
      "/api/attendance/records",
      {
        employeeId: "EMP-3291",
        checkInAt: "2026-08-18T09:00:00+09:00",
        checkOutAt: "2026-08-18T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      actorHeaders("employee", "EMP-3291")
    )
  );
  assert.equal(createResponse.status, 201);
  const createdBody = await readJson<{ record: { id: string } }>(createResponse);

  const approveResponse = await attendanceApproveRoute.POST(
    new Request(`http://localhost/api/attendance/records/${createdBody.record.id}/approve`, {
      method: "POST",
      headers: actorHeaders("manager", "MGR-3291")
    }),
    { params: Promise.resolve({ recordId: createdBody.record.id }) } as RouteContext<{
      recordId: string;
    }>
  );
  assert.equal(approveResponse.status, 200);

  const basePayload = {
    periodStart: "2026-08-01T00:00:00+09:00",
    periodEnd: "2026-08-31T23:59:59+09:00",
    employeeId: "EMP-3291",
    hourlyRateKrw: 12000,
    deductionMode: "statutory_kr_baseline",
    statutory: {
      nonTaxableIncomeKrw: 10000,
      otherDeductionsKrw: 500,
      additionalTaxCreditKrw: 0,
      dependentTaxCreditPerPersonKrw: 0,
      incomeTaxLookupPresetId: "kr_simple_monthly_v2026_07"
    }
  } as const;

  const dep0Response = await payrollPreviewWithDeductionsRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview-with-deductions",
      {
        ...basePayload,
        statutory: {
          ...basePayload.statutory,
          dependentCount: 0
        }
      },
      actorHeaders("payroll_operator", "PAY-3291")
    )
  );
  assert.equal(dep0Response.status, 200);
  const dep0Body = await readJson<{
    summary: {
      withholdingTaxKrw: number;
      deductionBreakdown: {
        additional: {
          selectedIncomeTaxLookupRow: { upToKrw: number | null; taxKrw: number } | null;
          selectedIncomeTaxLookupDependentTier: { dependentCount: number; taxKrw: number } | null;
          taxCreditsKrw: {
            preCreditIncomeTaxKrw: number;
          };
        };
      };
    };
  }>(dep0Response);
  assert.deepEqual(dep0Body.summary.deductionBreakdown.additional.selectedIncomeTaxLookupRow, {
    upToKrw: 100000,
    taxKrw: 7600
  });
  assert.deepEqual(dep0Body.summary.deductionBreakdown.additional.selectedIncomeTaxLookupDependentTier, {
    dependentCount: 0,
    taxKrw: 7600
  });
  assert.equal(dep0Body.summary.deductionBreakdown.additional.taxCreditsKrw.preCreditIncomeTaxKrw, 7600);
  assert.equal(dep0Body.summary.withholdingTaxKrw, 8360);

  const dep2Response = await payrollPreviewWithDeductionsRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview-with-deductions",
      {
        ...basePayload,
        statutory: {
          ...basePayload.statutory,
          dependentCount: 2
        }
      },
      actorHeaders("payroll_operator", "PAY-3291")
    )
  );
  assert.equal(dep2Response.status, 200);
  const dep2Body = await readJson<{
    summary: {
      withholdingTaxKrw: number;
      deductionBreakdown: {
        additional: {
          selectedIncomeTaxLookupRow: { upToKrw: number | null; taxKrw: number } | null;
          selectedIncomeTaxLookupDependentTier: { dependentCount: number; taxKrw: number } | null;
          taxCreditsKrw: {
            preCreditIncomeTaxKrw: number;
          };
        };
      };
    };
  }>(dep2Response);
  assert.deepEqual(dep2Body.summary.deductionBreakdown.additional.selectedIncomeTaxLookupRow, {
    upToKrw: 100000,
    taxKrw: 7600
  });
  assert.deepEqual(dep2Body.summary.deductionBreakdown.additional.selectedIncomeTaxLookupDependentTier, {
    dependentCount: 2,
    taxKrw: 7200
  });
  assert.equal(dep2Body.summary.deductionBreakdown.additional.taxCreditsKrw.preCreditIncomeTaxKrw, 7200);
  assert.equal(dep2Body.summary.withholdingTaxKrw, 7920);
  assert.equal(dep0Body.summary.withholdingTaxKrw - dep2Body.summary.withholdingTaxKrw, 440);

  const invalidDependentTierResponse = await payrollPreviewWithDeductionsRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview-with-deductions",
      {
        ...basePayload,
        statutory: {
          ...basePayload.statutory,
          dependentCount: 2,
          incomeTaxLookupPresetId: undefined,
          incomeTaxLookupTable: [
            {
              upToKrw: 100000,
              taxKrw: 7600,
              dependentTaxKrw: [
                { dependentCount: 0, taxKrw: 7600 },
                { dependentCount: 1, taxKrw: 7700 }
              ]
            },
            {
              upToKrw: null,
              taxKrw: 31200
            }
          ]
        }
      },
      actorHeaders("payroll_operator", "PAY-3291")
    )
  );
  assert.equal(invalidDependentTierResponse.status, 400);
}

run()
  .then(() => {
    console.log("e2e-wi0291-payroll-kr-simple-withholding-dependent-tier-engine.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

