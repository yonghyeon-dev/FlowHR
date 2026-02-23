import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "memory";
runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
runtimeEnv.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.DIRECT_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.FLOWHR_EVENT_PUBLISHER = "memory";

function readUtf8(...parts: string[]) {
  return fs.readFileSync(path.resolve(process.cwd(), ...parts), "utf8");
}

function actorHeaders(role: string, actorId: string, organizationId?: string) {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-actor-role": role,
    "x-actor-id": actorId
  };
  if (organizationId) {
    headers["x-actor-organization-id"] = organizationId;
  }
  return headers;
}

function jsonRequest(method: string, urlPath: string, payload: unknown, headers: Record<string, string>) {
  return new Request(`http://localhost${urlPath}`, {
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
  const finalizeRoute = await import("../../src/app/api/payroll/year-end/finalize-settlement/route.ts");
  const exportRoute = await import("../../src/app/api/payroll/year-end/export-filing-data/route.ts");

  resetMemoryDataAccess();
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_DEDUCTION_INPUT_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_FILING_EXPORT_V1 = "true";

  const payrollApiSpec = readUtf8("specs", "payroll", "api.yaml");
  const payrollContract = readUtf8("specs", "payroll", "contract.yaml");
  const payrollTestCases = readUtf8("specs", "payroll", "test-cases.md");
  assert.match(payrollApiSpec, /expectedSettlementHash/);
  assert.match(payrollApiSpec, /settlementHash/);
  assert.match(payrollContract, /expectedSettlementHash/);
  assert.match(payrollContract, /settlementHash trace/i);
  assert.match(payrollTestCases, /Year-End Export Settlement Hash Gate/);

  const organization = await memoryDataAccess.organizations.create({
    name: "Org Payroll Year End Export Settlement Hash Guard"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-YEX-1001",
    organizationId: organization.id,
    name: "Year End Export Hash Employee"
  });

  const yearStart = new Date("2026-01-01T00:00:00+09:00");
  const yearEnd = new Date("2026-12-31T23:59:59+09:00");

  const runOne = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-YEX-1001",
    periodStart: yearStart,
    periodEnd: yearEnd,
    grossPayKrw: 1_000_000,
    withholdingTaxKrw: 40_000,
    socialInsuranceKrw: 35_000,
    otherDeductionsKrw: 5_000,
    totalDeductionsKrw: 80_000,
    netPayKrw: 920_000,
    sourceRecordCount: 1
  });
  const runTwo = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-YEX-1001",
    periodStart: yearStart,
    periodEnd: yearEnd,
    grossPayKrw: 1_100_000,
    withholdingTaxKrw: 50_000,
    socialInsuranceKrw: 36_000,
    otherDeductionsKrw: 4_000,
    totalDeductionsKrw: 90_000,
    netPayKrw: 1_010_000,
    sourceRecordCount: 1
  });

  await memoryDataAccess.payroll.update(runOne.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-31T09:00:00+09:00"),
    confirmedBy: "PAY-YEX-1001",
    payslipDistributedAt: new Date("2026-12-31T09:10:00+09:00"),
    payslipDistributedBy: "PAY-YEX-1001",
    payslipReceiptConfirmedAt: new Date("2026-12-31T09:20:00+09:00"),
    payslipReceiptConfirmedBy: "EMP-YEX-1001"
  });
  await memoryDataAccess.payroll.update(runTwo.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-31T09:00:00+09:00"),
    confirmedBy: "PAY-YEX-1001",
    payslipDistributedAt: new Date("2026-12-31T09:10:00+09:00"),
    payslipDistributedBy: "PAY-YEX-1001",
    payslipReceiptConfirmedAt: new Date("2026-12-31T09:20:00+09:00"),
    payslipReceiptConfirmedBy: "EMP-YEX-1001"
  });

  const finalizeResponse = await finalizeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/finalize-settlement",
      {
        year: 2026,
        employeeId: "EMP-YEX-1001",
        nonTaxableAnnualIncomeKrw: 0,
        additionalTaxCreditKrw: 0,
        annualIncomeTaxRate: 0.03,
        localIncomeTaxRate: 0.1,
        deductionItems: {
          personalPensionKrw: 0,
          insurancePremiumKrw: 0,
          medicalExpenseKrw: 0,
          educationExpenseKrw: 0,
          donationKrw: 0,
          housingSavingsKrw: 0
        },
        apply: true,
        finalizedByNote: "wi0266 finalize"
      },
      actorHeaders("payroll_operator", "PAY-YEX-1001", organization.id)
    )
  );
  assert.equal(finalizeResponse.status, 200);
  const finalizeBody = await readJson<{
    settlement: {
      finalized: boolean;
      settlementHash: string;
    };
  }>(finalizeResponse);
  assert.equal(finalizeBody.settlement.finalized, true);
  assert.match(finalizeBody.settlement.settlementHash, /^[a-f0-9]{64}$/);

  const exportWithExpectedResponse = await exportRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/export-filing-data",
      {
        year: 2026,
        employeeId: "EMP-YEX-1001",
        format: "json",
        validationMode: "strict",
        expectedSettlementHash: finalizeBody.settlement.settlementHash.toUpperCase()
      },
      actorHeaders("payroll_operator", "PAY-YEX-1001", organization.id)
    )
  );
  assert.equal(exportWithExpectedResponse.status, 200);
  const exportWithExpectedBody = await readJson<{
    filingData: {
      settlementHash: string;
      validation: {
        status: "pass" | "fail";
      };
    };
  }>(exportWithExpectedResponse);
  assert.equal(exportWithExpectedBody.filingData.validation.status, "pass");
  assert.equal(
    exportWithExpectedBody.filingData.settlementHash,
    finalizeBody.settlement.settlementHash
  );

  const exportMismatchResponse = await exportRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/export-filing-data",
      {
        year: 2026,
        employeeId: "EMP-YEX-1001",
        format: "json",
        validationMode: "strict",
        expectedSettlementHash: "f".repeat(64)
      },
      actorHeaders("payroll_operator", "PAY-YEX-1001", organization.id)
    )
  );
  assert.equal(exportMismatchResponse.status, 409);
  const exportMismatchBody = await readJson<{
    details: {
      expectedSettlementHash: string;
      computedSettlementHash: string;
    };
  }>(exportMismatchResponse);
  assert.equal(exportMismatchBody.details.expectedSettlementHash, "f".repeat(64));
  assert.equal(
    exportMismatchBody.details.computedSettlementHash,
    finalizeBody.settlement.settlementHash
  );
}

run()
  .then(() => {
    console.log("e2e-wi0266-payroll-year-end-export-settlement-hash-guard.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
