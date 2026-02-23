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

function getRequest(urlPath: string, headers: Record<string, string>) {
  return new Request(`http://localhost${urlPath}`, {
    method: "GET",
    headers
  });
}

async function readJson<T>(response: Response) {
  return (await response.json()) as T;
}

async function run() {
  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const finalizedSettlementRoute = await import(
    "../../src/app/api/payroll/year-end/finalized-settlement/route.ts"
  );
  const finalizeRoute = await import("../../src/app/api/payroll/year-end/finalize-settlement/route.ts");

  resetMemoryDataAccess();
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_DEDUCTION_INPUT_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_FILING_EXPORT_V1 = "true";

  const payrollApiSpec = readUtf8("specs", "payroll", "api.yaml");
  const payrollContract = readUtf8("specs", "payroll", "contract.yaml");
  const payrollTestCases = readUtf8("specs", "payroll", "test-cases.md");
  assert.match(payrollApiSpec, /\/payroll\/year-end\/finalized-settlement/);
  assert.match(payrollContract, /finalized settlement self-service read workflow/i);
  assert.match(payrollTestCases, /Finalized year-end settlement read API/i);

  const organization = await memoryDataAccess.organizations.create({
    name: "Org Payroll Finalized Settlement"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-YFS-1001",
    organizationId: organization.id,
    name: "Finalized Settlement Employee"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-YFS-2002",
    organizationId: organization.id,
    name: "Other Employee"
  });

  const yearStart = new Date("2026-01-01T00:00:00+09:00");
  const yearEnd = new Date("2026-12-31T23:59:59+09:00");
  const runRecord = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-YFS-1001",
    periodStart: yearStart,
    periodEnd: yearEnd,
    grossPayKrw: 3_000_000,
    withholdingTaxKrw: 110_000,
    socialInsuranceKrw: 140_000,
    otherDeductionsKrw: 20_000,
    totalDeductionsKrw: 270_000,
    netPayKrw: 2_730_000,
    sourceRecordCount: 1
  });

  await memoryDataAccess.payroll.update(runRecord.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-31T09:00:00+09:00"),
    confirmedBy: "PAY-YFS-1001",
    payslipDistributedAt: new Date("2026-12-31T09:10:00+09:00"),
    payslipDistributedBy: "PAY-YFS-1001",
    payslipReceiptConfirmedAt: new Date("2026-12-31T09:20:00+09:00"),
    payslipReceiptConfirmedBy: "EMP-YFS-1001"
  });

  const missingResponse = await finalizedSettlementRoute.GET(
    getRequest(
      "/api/payroll/year-end/finalized-settlement?year=2026&employeeId=EMP-YFS-1001",
      actorHeaders("employee", "EMP-YFS-1001", organization.id)
    )
  );
  assert.equal(missingResponse.status, 404);

  const finalizeResponse = await finalizeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/finalize-settlement",
      {
        year: 2026,
        employeeId: "EMP-YFS-1001",
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
        finalizedByNote: "wi0275 finalize"
      },
      actorHeaders("payroll_operator", "PAY-YFS-1001", organization.id)
    )
  );
  assert.equal(finalizeResponse.status, 200);
  const finalizeBody = await readJson<{
    settlement: {
      finalizationId: string;
      settlementHash: string;
      finalizedAt: string;
      settlementKrw: {
        annualTaxLiabilityKrw: number;
      };
    };
  }>(finalizeResponse);

  const ownReadResponse = await finalizedSettlementRoute.GET(
    getRequest(
      "/api/payroll/year-end/finalized-settlement?year=2026&employeeId=EMP-YFS-1001",
      actorHeaders("employee", "EMP-YFS-1001", organization.id)
    )
  );
  assert.equal(ownReadResponse.status, 200);
  const ownReadBody = await readJson<{
    settlement: {
      finalizationId: string;
      finalizedAt: string;
      settlementHash: string;
      settlementKrw: {
        annualTaxLiabilityKrw: number;
      };
      runStates: {
        confirmedRuns: number;
        previewedRuns: number;
      };
    };
  }>(ownReadResponse);
  assert.equal(ownReadBody.settlement.finalizationId, finalizeBody.settlement.finalizationId);
  assert.equal(ownReadBody.settlement.settlementHash, finalizeBody.settlement.settlementHash);
  assert.equal(ownReadBody.settlement.finalizedAt, finalizeBody.settlement.finalizedAt);
  assert.equal(
    ownReadBody.settlement.settlementKrw.annualTaxLiabilityKrw,
    finalizeBody.settlement.settlementKrw.annualTaxLiabilityKrw
  );
  assert.equal(ownReadBody.settlement.runStates.confirmedRuns, 1);
  assert.equal(ownReadBody.settlement.runStates.previewedRuns, 0);

  const forbiddenOtherEmployeeResponse = await finalizedSettlementRoute.GET(
    getRequest(
      "/api/payroll/year-end/finalized-settlement?year=2026&employeeId=EMP-YFS-1001",
      actorHeaders("employee", "EMP-YFS-2002", organization.id)
    )
  );
  assert.equal(forbiddenOtherEmployeeResponse.status, 403);

  const otherYearNotFoundResponse = await finalizedSettlementRoute.GET(
    getRequest(
      "/api/payroll/year-end/finalized-settlement?year=2025&employeeId=EMP-YFS-1001",
      actorHeaders("employee", "EMP-YFS-1001", organization.id)
    )
  );
  assert.equal(otherYearNotFoundResponse.status, 404);
}

run()
  .then(() => {
    console.log("e2e-wi0275-payroll-year-end-finalized-settlement-self-service.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
