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
  const settlementRoute = await import("../../src/app/api/payroll/year-end/preview-settlement/route.ts");
  const recalculationRoute = await import(
    "../../src/app/api/payroll/year-end/recalculate-settlement/route.ts"
  );

  resetMemoryDataAccess();
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_DEDUCTION_INPUT_V1 = "true";

  const adminNavSource = readUtf8("src", "app", "admin", "admin-shell-navigation.ts");
  const adminConsoleSource = readUtf8("src", "components", "payroll-year-end", "PayrollYearEndConsole.tsx");
  const recalculationRouteSource = readUtf8(
    "src",
    "app",
    "api",
    "payroll",
    "year-end",
    "recalculate-settlement",
    "route.ts"
  );
  const payrollApiSpec = readUtf8("specs", "payroll", "api.yaml");
  const payrollContract = readUtf8("specs", "payroll", "contract.yaml");

  assert.match(adminNavSource, /\/admin\/payroll-year-end/, "admin nav should include payroll year-end route");
  assert.match(
    adminConsoleSource,
    /copy\.recalculateSettlementAction/,
    "payroll year-end console should expose recalculation action via locale copy"
  );
  assert.match(
    recalculationRouteSource,
    /recalculatePayrollYearEndSettlementSchema/,
    "recalculation route should validate payload with schema"
  );
  assert.match(
    payrollApiSpec,
    /\/payroll\/year-end\/recalculate-settlement:/,
    "api spec should include year-end recalculation endpoint"
  );
  assert.match(
    payrollContract,
    /path: \/payroll\/year-end\/recalculate-settlement/,
    "contract should include year-end recalculation endpoint"
  );
  assert.match(
    payrollContract,
    /payroll_year_end_deduction_input_v1/,
    "contract should include year-end deduction input feature flag"
  );

  const organization = await memoryDataAccess.organizations.create({ name: "Org Payroll Year End Recalculation" });
  await memoryDataAccess.employees.create({
    id: "EMP-YER-1001",
    organizationId: organization.id,
    name: "Year End Recalculation Employee"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-YER-1002",
    organizationId: organization.id,
    name: "Year End Recalculation Other Employee"
  });

  const yearStart = new Date("2026-01-01T00:00:00+09:00");
  const yearEnd = new Date("2026-12-31T23:59:59+09:00");

  const confirmedRunOne = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-YER-1001",
    periodStart: yearStart,
    periodEnd: yearEnd,
    grossPayKrw: 100000,
    withholdingTaxKrw: 7000,
    socialInsuranceKrw: 5000,
    otherDeductionsKrw: 1000,
    totalDeductionsKrw: 13000,
    netPayKrw: 87000,
    sourceRecordCount: 1
  });
  const confirmedRunTwo = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-YER-1001",
    periodStart: yearStart,
    periodEnd: yearEnd,
    grossPayKrw: 80000,
    withholdingTaxKrw: 5000,
    socialInsuranceKrw: 4000,
    otherDeductionsKrw: 1000,
    totalDeductionsKrw: 10000,
    netPayKrw: 70000,
    sourceRecordCount: 1
  });
  const previewedRun = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-YER-1001",
    periodStart: yearStart,
    periodEnd: yearEnd,
    grossPayKrw: 60000,
    sourceRecordCount: 1
  });

  await memoryDataAccess.payroll.update(confirmedRunOne.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-31T11:00:00+09:00"),
    confirmedBy: "PAY-YER-1001"
  });
  await memoryDataAccess.payroll.update(confirmedRunTwo.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-31T11:00:00+09:00"),
    confirmedBy: "PAY-YER-1001"
  });
  assert.equal(previewedRun.state, "PREVIEWED", "fixture previewed run should remain previewed");

  const basePayload = {
    year: 2026,
    employeeId: "EMP-YER-1001",
    nonTaxableAnnualIncomeKrw: 10000,
    additionalTaxCreditKrw: 2000,
    annualIncomeTaxRate: 0.03,
    localIncomeTaxRate: 0.1
  };

  const settlementResponse = await settlementRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/preview-settlement",
      basePayload,
      actorHeaders("payroll_operator", "PAY-YER-1001", organization.id)
    )
  );
  assert.equal(settlementResponse.status, 200, "year-end settlement preview should succeed");
  const settlementBody = await readJson<{
    summary: { settlementKrw: { annualTaxLiabilityKrw: number; withholdingDeltaKrw: number } };
  }>(settlementResponse);
  assert.equal(settlementBody.summary.settlementKrw.annualTaxLiabilityKrw, 3410);
  assert.equal(settlementBody.summary.settlementKrw.withholdingDeltaKrw, -8590);

  const recalculationResponse = await recalculationRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/recalculate-settlement",
      {
        ...basePayload,
        deductionItems: {
          personalPensionKrw: 20000,
          insurancePremiumKrw: 10000,
          medicalExpenseKrw: 8000,
          educationExpenseKrw: 7000,
          donationKrw: 3000,
          housingSavingsKrw: 2000
        }
      },
      actorHeaders("payroll_operator", "PAY-YER-1001", organization.id)
    )
  );
  assert.equal(recalculationResponse.status, 200, "year-end recalculation should succeed");
  const recalculationBody = await readJson<{
    recalculation: {
      runStates: { totalRuns: number; confirmedRuns: number; previewedRuns: number; previewedRunIds: string[] };
      deductionItemsKrw: {
        totalIncomeDeductionKrw: number;
        appliedIncomeDeductionKrw: number;
        taxableAnnualIncomeBeforeDeductionKrw: number;
        taxableAnnualIncomeAfterDeductionKrw: number;
      };
      baselineSettlementKrw: { annualTaxLiabilityKrw: number; withholdingDeltaKrw: number };
      recalculatedSettlementKrw: { annualTaxLiabilityKrw: number; withholdingDeltaKrw: number };
      deltaKrw: { annualTaxLiabilityDeltaKrw: number; withholdingDeltaChangeKrw: number; taxableIncomeReductionKrw: number };
    };
  }>(recalculationResponse);

  assert.deepEqual(recalculationBody.recalculation.runStates, {
    totalRuns: 3,
    confirmedRuns: 2,
    previewedRuns: 1,
    previewedRunIds: [previewedRun.id]
  });
  assert.equal(recalculationBody.recalculation.deductionItemsKrw.totalIncomeDeductionKrw, 50000);
  assert.equal(recalculationBody.recalculation.deductionItemsKrw.appliedIncomeDeductionKrw, 50000);
  assert.equal(recalculationBody.recalculation.deductionItemsKrw.taxableAnnualIncomeBeforeDeductionKrw, 170000);
  assert.equal(recalculationBody.recalculation.deductionItemsKrw.taxableAnnualIncomeAfterDeductionKrw, 120000);
  assert.equal(recalculationBody.recalculation.baselineSettlementKrw.annualTaxLiabilityKrw, 3410);
  assert.equal(recalculationBody.recalculation.recalculatedSettlementKrw.annualTaxLiabilityKrw, 1760);
  assert.equal(recalculationBody.recalculation.baselineSettlementKrw.withholdingDeltaKrw, -8590);
  assert.equal(recalculationBody.recalculation.recalculatedSettlementKrw.withholdingDeltaKrw, -10240);
  assert.equal(recalculationBody.recalculation.deltaKrw.annualTaxLiabilityDeltaKrw, -1650);
  assert.equal(recalculationBody.recalculation.deltaKrw.withholdingDeltaChangeKrw, -1650);
  assert.equal(recalculationBody.recalculation.deltaKrw.taxableIncomeReductionKrw, 50000);

  const unauthorizedRecalculationResponse = await recalculationRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/recalculate-settlement",
      {
        ...basePayload,
        deductionItems: {
          personalPensionKrw: 1,
          insurancePremiumKrw: 0,
          medicalExpenseKrw: 0,
          educationExpenseKrw: 0,
          donationKrw: 0,
          housingSavingsKrw: 0
        }
      },
      actorHeaders("employee", "EMP-YER-1001", organization.id)
    )
  );
  assert.equal(
    unauthorizedRecalculationResponse.status,
    403,
    "employee should not trigger year-end recalculation"
  );

  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_DEDUCTION_INPUT_V1 = "false";
  const flagOffRecalculationResponse = await recalculationRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/recalculate-settlement",
      {
        ...basePayload,
        deductionItems: {
          personalPensionKrw: 1,
          insurancePremiumKrw: 0,
          medicalExpenseKrw: 0,
          educationExpenseKrw: 0,
          donationKrw: 0,
          housingSavingsKrw: 0
        }
      },
      actorHeaders("payroll_operator", "PAY-YER-1001", organization.id)
    )
  );
  assert.equal(
    flagOffRecalculationResponse.status,
    409,
    "year-end recalculation should be blocked when deduction input flag is disabled"
  );

  const recalculationLogs = await memoryDataAccess.audit.list({
    actions: ["payroll.year_end.settlement_recalculated"],
    entityType: "PayrollYearEnd"
  });
  assert.equal(recalculationLogs.length, 1, "year-end recalculation should append audit log");
}

run()
  .then(() => {
    console.log("e2e-wi0188-payroll-year-end-deduction-input-and-recalculation-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
