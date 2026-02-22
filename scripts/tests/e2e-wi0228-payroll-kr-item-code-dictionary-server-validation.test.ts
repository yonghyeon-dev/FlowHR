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
  const payrollRfc = readUtf8("specs", "payroll", "rfc.md");
  const payrollService = readUtf8("src", "features", "payroll", "service.ts");
  const payrollSchemas = readUtf8("src", "features", "payroll", "schemas.ts");
  const workItem = readUtf8(
    "work-items",
    "WI-0228-payroll-kr-item-code-dictionary-server-validation.md"
  );

  assert.match(payrollApiSpec, /dictionary validation guard/i);
  assert.match(payrollContract, /dictionary validation guard/i);
  assert.match(payrollTestCases, /dictionary validation guard/i);
  assert.match(payrollRfc, /WI-0228/);
  assert.match(payrollService, /code is not supported by dictionary/);
  assert.match(payrollSchemas, /findPayrollKrIncomeSplitItemCodeDictionaryEntry/);
  assert.match(workItem, /server validation guard/i);

  resetMemoryDataAccess();
  runtimeEnv.FLOWHR_PAYROLL_DEDUCTIONS_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_KR_BASELINE_V1 = "true";

  await memoryDataAccess.employees.create({ id: "EMP-3228" });

  const createResponse = await attendanceCreateRoute.POST(
    jsonRequest(
      "POST",
      "/api/attendance/records",
      {
        employeeId: "EMP-3228",
        checkInAt: "2026-02-16T09:00:00+09:00",
        checkOutAt: "2026-02-16T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      actorHeaders("employee", "EMP-3228")
    )
  );
  assert.equal(createResponse.status, 201);
  const createdBody = await readJson<{ record: { id: string } }>(createResponse);

  const approveResponse = await attendanceApproveRoute.POST(
    new Request(`http://localhost/api/attendance/records/${createdBody.record.id}/approve`, {
      method: "POST",
      headers: actorHeaders("manager", "MGR-3228")
    }),
    { params: Promise.resolve({ recordId: createdBody.record.id }) } as RouteContext<{
      recordId: string;
    }>
  );
  assert.equal(approveResponse.status, 200);

  const successResponse = await payrollPreviewWithDeductionsRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview-with-deductions",
      {
        periodStart: "2026-02-01T00:00:00+09:00",
        periodEnd: "2026-02-28T23:59:59+09:00",
        employeeId: "EMP-3228",
        hourlyRateKrw: 12000,
        deductionMode: "statutory_kr_baseline",
        statutory: {
          incomeTaxLookupPresetId: "kr_simple_monthly_v2026_01",
          taxableIncomeItems: [{ code: "tx_salary", category: "salary", amountKrw: 86000 }],
          nonTaxableIncomeItems: [{ code: "nt_meal", category: "allowance", amountKrw: 10000 }]
        }
      },
      actorHeaders("payroll_operator", "PAY-3228")
    )
  );
  assert.equal(successResponse.status, 200, "dictionary-backed code casing variation should be accepted");
  const successBody = await readJson<{
    summary: {
      deductionBreakdown: {
        additional: {
          incomeSplitItems: {
            taxableIncomeItems: Array<{ code: string; category: string }>;
            nonTaxableIncomeItems: Array<{ code: string; category: string }>;
          };
        };
      };
    };
  }>(successResponse);
  assert.equal(
    successBody.summary.deductionBreakdown.additional.incomeSplitItems.taxableIncomeItems[0]?.code,
    "TX_SALARY"
  );
  assert.equal(
    successBody.summary.deductionBreakdown.additional.incomeSplitItems.nonTaxableIncomeItems[0]
      ?.code,
    "NT_MEAL"
  );

  const unsupportedCodeResponse = await payrollPreviewWithDeductionsRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview-with-deductions",
      {
        periodStart: "2026-02-01T00:00:00+09:00",
        periodEnd: "2026-02-28T23:59:59+09:00",
        employeeId: "EMP-3228",
        hourlyRateKrw: 12000,
        deductionMode: "statutory_kr_baseline",
        statutory: {
          taxableIncomeItems: [{ code: "TX_UNKNOWN", category: "salary", amountKrw: 86000 }],
          nonTaxableIncomeItems: [{ code: "NT_MEAL", category: "allowance", amountKrw: 10000 }]
        }
      },
      actorHeaders("payroll_operator", "PAY-3228")
    )
  );
  assert.equal(unsupportedCodeResponse.status, 400, "unsupported dictionary code should be rejected");
  const unsupportedCodeBody = await readJson<{
    error: string;
    details?: { formErrors?: string[]; fieldErrors?: Record<string, string[]> };
  }>(unsupportedCodeResponse);
  assert.equal(unsupportedCodeBody.error, "invalid payload");
  assert.match(
    JSON.stringify(unsupportedCodeBody.details ?? {}),
    /code is not supported by dictionary/i
  );

  const categoryMismatchResponse = await payrollPreviewWithDeductionsRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview-with-deductions",
      {
        periodStart: "2026-02-01T00:00:00+09:00",
        periodEnd: "2026-02-28T23:59:59+09:00",
        employeeId: "EMP-3228",
        hourlyRateKrw: 12000,
        deductionMode: "statutory_kr_baseline",
        statutory: {
          taxableIncomeItems: [{ code: "TX_SALARY", category: "bonus", amountKrw: 86000 }],
          nonTaxableIncomeItems: [{ code: "NT_MEAL", category: "allowance", amountKrw: 10000 }]
        }
      },
      actorHeaders("payroll_operator", "PAY-3228")
    )
  );
  assert.equal(categoryMismatchResponse.status, 400, "category mismatch should be rejected");
  const categoryMismatchBody = await readJson<{
    error: string;
    details?: { formErrors?: string[]; fieldErrors?: Record<string, string[]> };
  }>(categoryMismatchResponse);
  assert.equal(categoryMismatchBody.error, "invalid payload");
  assert.match(
    JSON.stringify(categoryMismatchBody.details ?? {}),
    /category must match dictionary category/i
  );
}

run()
  .then(() => {
    console.log("e2e-wi0228-payroll-kr-item-code-dictionary-server-validation.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
