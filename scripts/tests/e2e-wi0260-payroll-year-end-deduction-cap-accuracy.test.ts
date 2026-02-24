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
  const recalculateRoute = await import(
    "../../src/app/api/payroll/year-end/recalculate-settlement/route.ts"
  );
  const finalizeRoute = await import("../../src/app/api/payroll/year-end/finalize-settlement/route.ts");
  const exportRoute = await import("../../src/app/api/payroll/year-end/export-filing-data/route.ts");

  resetMemoryDataAccess();
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_DEDUCTION_INPUT_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_FILING_EXPORT_V1 = "true";

  const yearEndConsoleSource = readUtf8("src", "components", "payroll-year-end", "PayrollYearEndConsole.tsx");
  const payrollApiSpec = readUtf8("specs", "payroll", "api.yaml");
  const payrollContract = readUtf8("specs", "payroll", "contract.yaml");
  const payrollTestCases = readUtf8("specs", "payroll", "test-cases.md");
  assert.match(yearEndConsoleSource, /copy\.cappedDeductionLabel/);
  assert.match(payrollApiSpec, /deduction cap/i);
  assert.match(payrollContract, /year-end deduction item caps/i);
  assert.match(payrollTestCases, /Year-end deduction item caps/i);

  const organization = await memoryDataAccess.organizations.create({
    name: "Org Payroll Year End Deduction Cap"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-YEC-1001",
    organizationId: organization.id,
    name: "Year End Deduction Cap Employee"
  });

  const yearStart = new Date("2026-01-01T00:00:00+09:00");
  const yearEnd = new Date("2026-12-31T23:59:59+09:00");
  const runOne = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-YEC-1001",
    periodStart: yearStart,
    periodEnd: yearEnd,
    grossPayKrw: 2_500_000,
    withholdingTaxKrw: 120_000,
    socialInsuranceKrw: 100_000,
    otherDeductionsKrw: 20_000,
    totalDeductionsKrw: 240_000,
    netPayKrw: 2_260_000,
    sourceRecordCount: 1
  });
  const runTwo = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-YEC-1001",
    periodStart: yearStart,
    periodEnd: yearEnd,
    grossPayKrw: 2_000_000,
    withholdingTaxKrw: 90_000,
    socialInsuranceKrw: 80_000,
    otherDeductionsKrw: 10_000,
    totalDeductionsKrw: 180_000,
    netPayKrw: 1_820_000,
    sourceRecordCount: 1
  });
  await memoryDataAccess.payroll.update(runOne.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-31T11:00:00+09:00"),
    confirmedBy: "PAY-YEC-1001",
    payslipDistributedAt: new Date("2026-12-31T11:10:00+09:00"),
    payslipDistributedBy: "PAY-YEC-1001",
    payslipReceiptConfirmedAt: new Date("2026-12-31T11:15:00+09:00"),
    payslipReceiptConfirmedBy: "EMP-YEC-1001"
  });
  await memoryDataAccess.payroll.update(runTwo.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-31T11:00:00+09:00"),
    confirmedBy: "PAY-YEC-1001",
    payslipDistributedAt: new Date("2026-12-31T11:20:00+09:00"),
    payslipDistributedBy: "PAY-YEC-1001",
    payslipReceiptConfirmedAt: new Date("2026-12-31T11:25:00+09:00"),
    payslipReceiptConfirmedBy: "EMP-YEC-1001"
  });

  const highDeductionPayload = {
    year: 2026,
    employeeId: "EMP-YEC-1001",
    nonTaxableAnnualIncomeKrw: 0,
    additionalTaxCreditKrw: 2000,
    annualIncomeTaxRate: 0.03,
    localIncomeTaxRate: 0.1,
    deductionItems: {
      personalPensionKrw: 12_000_000,
      insurancePremiumKrw: 2_500_000,
      medicalExpenseKrw: 20_000_000,
      educationExpenseKrw: 15_000_000,
      donationKrw: 20_000_000,
      housingSavingsKrw: 8_000_000
    }
  };

  const recalcResponse = await recalculateRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/recalculate-settlement",
      highDeductionPayload,
      actorHeaders("payroll_operator", "PAY-YEC-1001", organization.id)
    )
  );
  assert.equal(recalcResponse.status, 200, "year-end recalculation should succeed");
  const recalcBody = await readJson<{
    recalculation: {
      annualTotalsKrw: { grossPayKrw: number; withholdingTaxKrw: number };
      deductionItemsKrw: {
        totalIncomeDeductionKrw: number;
        cappedIncomeDeductionKrw: number;
        appliedIncomeDeductionKrw: number;
        taxableAnnualIncomeBeforeDeductionKrw: number;
        taxableAnnualIncomeAfterDeductionKrw: number;
        capRulesKrw: {
          personalPensionKrw: number;
          insurancePremiumKrw: number;
          medicalExpenseKrw: number;
          educationExpenseKrw: number;
          donationKrw: number;
          housingSavingsKrw: number;
        };
        capAppliedByItemKrw: Record<
          string,
          { inputKrw: number; capKrw: number; appliedKrw: number; capped: boolean }
        >;
      };
      recalculatedSettlementKrw: {
        annualTaxLiabilityKrw: number;
        withholdingDeltaKrw: number;
        taxableAnnualIncomeKrw: number;
      };
    };
  }>(recalcResponse);

  assert.equal(recalcBody.recalculation.annualTotalsKrw.grossPayKrw, 4_500_000);
  assert.equal(recalcBody.recalculation.annualTotalsKrw.withholdingTaxKrw, 210_000);
  assert.equal(recalcBody.recalculation.deductionItemsKrw.totalIncomeDeductionKrw, 77_500_000);
  assert.equal(recalcBody.recalculation.deductionItemsKrw.cappedIncomeDeductionKrw, 46_000_000);
  assert.equal(recalcBody.recalculation.deductionItemsKrw.appliedIncomeDeductionKrw, 4_500_000);
  assert.equal(recalcBody.recalculation.deductionItemsKrw.taxableAnnualIncomeBeforeDeductionKrw, 4_500_000);
  assert.equal(recalcBody.recalculation.deductionItemsKrw.taxableAnnualIncomeAfterDeductionKrw, 0);
  assert.deepEqual(recalcBody.recalculation.deductionItemsKrw.capRulesKrw, {
    personalPensionKrw: 7_000_000,
    insurancePremiumKrw: 1_000_000,
    medicalExpenseKrw: 15_000_000,
    educationExpenseKrw: 9_000_000,
    donationKrw: 10_000_000,
    housingSavingsKrw: 4_000_000
  });
  assert.equal(recalcBody.recalculation.deductionItemsKrw.capAppliedByItemKrw.personalPensionKrw.capped, true);
  assert.equal(recalcBody.recalculation.deductionItemsKrw.capAppliedByItemKrw.donationKrw.appliedKrw, 10_000_000);
  assert.equal(recalcBody.recalculation.recalculatedSettlementKrw.taxableAnnualIncomeKrw, 0);
  assert.equal(recalcBody.recalculation.recalculatedSettlementKrw.annualTaxLiabilityKrw, 0);
  assert.equal(recalcBody.recalculation.recalculatedSettlementKrw.withholdingDeltaKrw, -210_000);

  const recalcReplayResponse = await recalculateRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/recalculate-settlement",
      highDeductionPayload,
      actorHeaders("payroll_operator", "PAY-YEC-1001", organization.id)
    )
  );
  assert.equal(recalcReplayResponse.status, 200);
  const recalcReplayBody = await readJson<typeof recalcBody>(recalcReplayResponse);
  assert.deepEqual(recalcReplayBody, recalcBody, "same payload should remain deterministic");

  const finalizeResponse = await finalizeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/finalize-settlement",
      {
        ...highDeductionPayload,
        apply: true,
        finalizedByNote: "wi0260 deduction cap accuracy"
      },
      actorHeaders("payroll_operator", "PAY-YEC-1001", organization.id)
    )
  );
  assert.equal(finalizeResponse.status, 200, "year-end finalization should succeed");
  const finalizeBody = await readJson<{
    settlement: {
      finalized: boolean;
      deductionItemsKrw: {
        cappedIncomeDeductionKrw: number;
        capAppliedByItemKrw: Record<string, { capped: boolean }>;
      };
    };
  }>(finalizeResponse);
  assert.equal(finalizeBody.settlement.finalized, true);
  assert.equal(finalizeBody.settlement.deductionItemsKrw.cappedIncomeDeductionKrw, 46_000_000);
  assert.equal(finalizeBody.settlement.deductionItemsKrw.capAppliedByItemKrw.housingSavingsKrw.capped, true);

  const exportResponse = await exportRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/export-filing-data",
      {
        year: 2026,
        employeeId: "EMP-YEC-1001",
        format: "json",
        validationMode: "strict"
      },
      actorHeaders("payroll_operator", "PAY-YEC-1001", organization.id)
    )
  );
  assert.equal(exportResponse.status, 200, "year-end export should keep deduction cap breakdown");
  const exportBody = await readJson<{
    filingData: {
      deductionItemsKrw: {
        cappedIncomeDeductionKrw: number;
        capAppliedByItemKrw: Record<string, { capKrw: number; appliedKrw: number }>;
      };
    };
  }>(exportResponse);
  assert.equal(exportBody.filingData.deductionItemsKrw.cappedIncomeDeductionKrw, 46_000_000);
  assert.equal(exportBody.filingData.deductionItemsKrw.capAppliedByItemKrw.insurancePremiumKrw.capKrw, 1_000_000);
  assert.equal(
    exportBody.filingData.deductionItemsKrw.capAppliedByItemKrw.insurancePremiumKrw.appliedKrw,
    1_000_000
  );
}

run()
  .then(() => {
    console.log("e2e-wi0260-payroll-year-end-deduction-cap-accuracy.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
