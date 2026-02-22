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
  const {
    findPayrollKrIncomeSplitItemCodeDictionaryEntry,
    listPayrollKrIncomeSplitItemCodeDictionary
  } = await import("../../src/features/payroll/kr-income-split-item-code-dictionary.ts");

  const payrollContract = readUtf8("specs", "payroll", "contract.yaml");
  const payrollTestCases = readUtf8("specs", "payroll", "test-cases.md");
  const payrollRfc = readUtf8("specs", "payroll", "rfc.md");
  const adminPage = readUtf8("src", "app", "admin", "page.tsx");
  const tableComponent = readUtf8(
    "src",
    "components",
    "payroll",
    "PayrollKrIncomeSplitItemsTable.tsx"
  );
  const dictionaryModule = readUtf8(
    "src",
    "features",
    "payroll",
    "kr-income-split-item-code-dictionary.ts"
  );
  const workItem = readUtf8("work-items", "WI-0227-payroll-kr-item-code-autocomplete-ux.md");

  assert.match(payrollContract, /WI-0227/i);
  assert.match(payrollTestCases, /autocomplete/i);
  assert.match(payrollRfc, /WI-0227/);
  assert.match(adminPage, /PayrollKrIncomeSplitItemsTable/);
  assert.match(tableComponent, /list=/);
  assert.match(tableComponent, /findPayrollKrIncomeSplitItemCodeDictionaryEntry/);
  assert.match(dictionaryModule, /TX_SALARY/);
  assert.match(workItem, /autocomplete UX/i);

  const taxableDictionary = listPayrollKrIncomeSplitItemCodeDictionary("taxable");
  const nonTaxableDictionary = listPayrollKrIncomeSplitItemCodeDictionary("non_taxable");
  assert.ok(taxableDictionary.length >= 2, "taxable dictionary should include multiple options");
  assert.ok(nonTaxableDictionary.length >= 2, "non-taxable dictionary should include multiple options");
  const matchedTaxable = findPayrollKrIncomeSplitItemCodeDictionaryEntry("tx_salary", "taxable");
  const matchedNonTaxable = findPayrollKrIncomeSplitItemCodeDictionaryEntry("NT_MEAL", "non_taxable");
  assert.equal(matchedTaxable?.category, "salary");
  assert.equal(matchedNonTaxable?.category, "allowance");

  resetMemoryDataAccess();
  runtimeEnv.FLOWHR_PAYROLL_DEDUCTIONS_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_KR_BASELINE_V1 = "true";

  await memoryDataAccess.employees.create({ id: "EMP-3227" });

  const createResponse = await attendanceCreateRoute.POST(
    jsonRequest(
      "POST",
      "/api/attendance/records",
      {
        employeeId: "EMP-3227",
        checkInAt: "2026-02-16T09:00:00+09:00",
        checkOutAt: "2026-02-16T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      actorHeaders("employee", "EMP-3227")
    )
  );
  assert.equal(createResponse.status, 201);
  const createdBody = await readJson<{ record: { id: string } }>(createResponse);

  const approveResponse = await attendanceApproveRoute.POST(
    new Request(`http://localhost/api/attendance/records/${createdBody.record.id}/approve`, {
      method: "POST",
      headers: actorHeaders("manager", "MGR-3227")
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
        employeeId: "EMP-3227",
        hourlyRateKrw: 12000,
        deductionMode: "statutory_kr_baseline",
        statutory: {
          incomeTaxLookupPresetId: "kr_simple_monthly_v2026_01",
          taxableIncomeItems: [{ code: "TX_SALARY", category: "salary", amountKrw: 86000 }],
          nonTaxableIncomeItems: [{ code: "NT_MEAL", category: "allowance", amountKrw: 10000 }]
        }
      },
      actorHeaders("payroll_operator", "PAY-3227")
    )
  );
  assert.equal(successResponse.status, 200, "dictionary-backed code values should remain compatible");
}

run()
  .then(() => {
    console.log("e2e-wi0227-payroll-kr-item-code-autocomplete-ux.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
