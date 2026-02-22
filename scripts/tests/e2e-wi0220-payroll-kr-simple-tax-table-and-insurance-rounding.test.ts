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
  assert.match(payrollApiSpec, /incomeTaxLookupTable/);
  assert.match(payrollApiSpec, /insuranceRounding/);
  assert.match(payrollContract, /incomeTaxLookupTable/);
  assert.match(payrollContract, /insurance rounding/i);
  assert.match(payrollTestCases, /Lookup\/Rounding Gate/);

  resetMemoryDataAccess();
  runtimeEnv.FLOWHR_PAYROLL_DEDUCTIONS_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_KR_BASELINE_V1 = "true";

  await memoryDataAccess.employees.create({ id: "EMP-3220" });

  const createResponse = await attendanceCreateRoute.POST(
    jsonRequest(
      "POST",
      "/api/attendance/records",
      {
        employeeId: "EMP-3220",
        checkInAt: "2026-02-14T09:00:00+09:00",
        checkOutAt: "2026-02-14T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      actorHeaders("employee", "EMP-3220")
    )
  );
  assert.equal(createResponse.status, 201);
  const createdBody = await readJson<{ record: { id: string } }>(createResponse);

  const approveResponse = await attendanceApproveRoute.POST(
    new Request(`http://localhost/api/attendance/records/${createdBody.record.id}/approve`, {
      method: "POST",
      headers: actorHeaders("manager", "MGR-3220")
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
        employeeId: "EMP-3220",
        hourlyRateKrw: 12000,
        deductionMode: "statutory_kr_baseline",
        statutory: {
          nonTaxableIncomeKrw: 10000,
          otherDeductionsKrw: 500,
          incomeTaxLookupTable: [
            { upToKrw: 50000, taxKrw: 3000 },
            { upToKrw: 90000, taxKrw: 7000 },
            { upToKrw: null, taxKrw: 12000 }
          ],
          additionalTaxCreditKrw: 600,
          dependentCount: 1,
          dependentTaxCreditPerPersonKrw: 400,
          insuranceRounding: {
            mode: "floor",
            nationalPensionUnitKrw: 10,
            healthInsuranceUnitKrw: 10,
            longTermCareUnitKrw: 10,
            employmentInsuranceUnitKrw: 10
          }
        }
      },
      actorHeaders("payroll_operator", "PAY-3220")
    )
  );
  assert.equal(previewResponse.status, 200, "lookup-table + insurance-rounding statutory preview should succeed");
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
          selectedIncomeTaxLookupRow: { upToKrw: number | null; taxKrw: number } | null;
          insuranceRounding: {
            mode: string;
            unitsKrw: {
              nationalPensionUnitKrw: number;
              healthInsuranceUnitKrw: number;
              longTermCareUnitKrw: number;
              employmentInsuranceUnitKrw: number;
            };
          };
          rawComponentsKrw: {
            nationalPensionKrw: number;
            healthInsuranceKrw: number;
            longTermCareKrw: number;
            employmentInsuranceKrw: number;
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
  assert.equal(previewBody.summary.withholdingTaxKrw, 6600);
  assert.equal(previewBody.summary.socialInsuranceKrw, 8070);
  assert.equal(previewBody.summary.otherDeductionsKrw, 500);
  assert.equal(previewBody.summary.totalDeductionsKrw, 15170);
  assert.equal(previewBody.summary.netPayKrw, 80830);

  assert.equal(previewBody.summary.deductionBreakdown.additional.taxMethod, "simple_lookup_table");
  assert.equal(previewBody.summary.deductionBreakdown.additional.taxableBaseKrw, 86000);
  assert.deepEqual(previewBody.summary.deductionBreakdown.additional.selectedIncomeTaxLookupRow, {
    upToKrw: 90000,
    taxKrw: 7000
  });
  assert.deepEqual(previewBody.summary.deductionBreakdown.additional.insuranceRounding, {
    mode: "floor",
    unitsKrw: {
      nationalPensionUnitKrw: 10,
      healthInsuranceUnitKrw: 10,
      longTermCareUnitKrw: 10,
      employmentInsuranceUnitKrw: 10
    }
  });
  assert.deepEqual(previewBody.summary.deductionBreakdown.additional.components, {
    incomeTaxKrw: 6000,
    localIncomeTaxKrw: 600,
    nationalPensionKrw: 3870,
    healthInsuranceKrw: 3040,
    longTermCareKrw: 390,
    employmentInsuranceKrw: 770
  });
  assert.equal(previewBody.summary.deductionBreakdown.additional.rawComponentsKrw.nationalPensionKrw, 3870);
  assert.ok(
    Math.abs(previewBody.summary.deductionBreakdown.additional.rawComponentsKrw.healthInsuranceKrw - 3048.7) <
      0.0000001
  );
  assert.ok(
    Math.abs(previewBody.summary.deductionBreakdown.additional.rawComponentsKrw.longTermCareKrw - 393.68) <
      0.0000001
  );
  assert.ok(
    Math.abs(previewBody.summary.deductionBreakdown.additional.rawComponentsKrw.employmentInsuranceKrw - 774) <
      0.0000001
  );

  const conflictModeResponse = await payrollPreviewWithDeductionsRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview-with-deductions",
      {
        periodStart: "2026-02-01T00:00:00+09:00",
        periodEnd: "2026-02-28T23:59:59+09:00",
        employeeId: "EMP-3220",
        hourlyRateKrw: 12000,
        deductionMode: "statutory_kr_baseline",
        statutory: {
          incomeTaxBrackets: [
            { upToKrw: 50000, rate: 0.06 },
            { upToKrw: null, rate: 0.15 }
          ],
          incomeTaxLookupTable: [
            { upToKrw: 50000, taxKrw: 3000 },
            { upToKrw: null, taxKrw: 12000 }
          ]
        }
      },
      actorHeaders("payroll_operator", "PAY-3220")
    )
  );
  assert.equal(conflictModeResponse.status, 400, "brackets and lookup-table should be mutually exclusive");
}

run()
  .then(() => {
    console.log("e2e-wi0220-payroll-kr-simple-tax-table-and-insurance-rounding.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
