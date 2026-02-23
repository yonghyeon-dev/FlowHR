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

  resetMemoryDataAccess();
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_DEDUCTION_INPUT_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_FILING_EXPORT_V1 = "true";

  const yearEndConsoleSource = readUtf8("src", "components", "payroll-year-end", "PayrollYearEndConsole.tsx");
  const payrollApiSpec = readUtf8("specs", "payroll", "api.yaml");
  const payrollContract = readUtf8("specs", "payroll", "contract.yaml");
  const payrollTestCases = readUtf8("specs", "payroll", "test-cases.md");
  assert.match(yearEndConsoleSource, /Eligible/);
  assert.match(payrollApiSpec, /deduction eligibility/i);
  assert.match(payrollContract, /deduction eligibility validation guard/i);
  assert.match(payrollTestCases, /Year-End Deduction Eligibility Gate/);

  const organization = await memoryDataAccess.organizations.create({
    name: "Org Payroll Year End Deduction Eligibility"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-YDE-1001",
    organizationId: organization.id,
    name: "Year End Deduction Eligibility Employee"
  });

  const yearStart = new Date("2026-01-01T00:00:00+09:00");
  const yearEnd = new Date("2026-12-31T23:59:59+09:00");
  const runOne = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-YDE-1001",
    periodStart: yearStart,
    periodEnd: yearEnd,
    grossPayKrw: 2_400_000,
    withholdingTaxKrw: 110_000,
    socialInsuranceKrw: 90_000,
    otherDeductionsKrw: 15_000,
    totalDeductionsKrw: 215_000,
    netPayKrw: 2_185_000,
    sourceRecordCount: 1
  });
  const runTwo = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-YDE-1001",
    periodStart: yearStart,
    periodEnd: yearEnd,
    grossPayKrw: 2_100_000,
    withholdingTaxKrw: 95_000,
    socialInsuranceKrw: 82_000,
    otherDeductionsKrw: 11_000,
    totalDeductionsKrw: 188_000,
    netPayKrw: 1_912_000,
    sourceRecordCount: 1
  });
  await memoryDataAccess.payroll.update(runOne.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-31T11:00:00+09:00"),
    confirmedBy: "PAY-YDE-1001",
    payslipDistributedAt: new Date("2026-12-31T11:10:00+09:00"),
    payslipDistributedBy: "PAY-YDE-1001",
    payslipReceiptConfirmedAt: new Date("2026-12-31T11:15:00+09:00"),
    payslipReceiptConfirmedBy: "EMP-YDE-1001"
  });
  await memoryDataAccess.payroll.update(runTwo.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-31T11:00:00+09:00"),
    confirmedBy: "PAY-YDE-1001",
    payslipDistributedAt: new Date("2026-12-31T11:20:00+09:00"),
    payslipDistributedBy: "PAY-YDE-1001",
    payslipReceiptConfirmedAt: new Date("2026-12-31T11:25:00+09:00"),
    payslipReceiptConfirmedBy: "EMP-YDE-1001"
  });

  const basePayload = {
    year: 2026,
    employeeId: "EMP-YDE-1001",
    nonTaxableAnnualIncomeKrw: 0,
    additionalTaxCreditKrw: 10_000,
    annualIncomeTaxRate: 0.03,
    localIncomeTaxRate: 0.1,
    deductionItems: {
      personalPensionKrw: 0,
      insurancePremiumKrw: 0,
      medicalExpenseKrw: 0,
      educationExpenseKrw: 0,
      donationKrw: 300_000,
      housingSavingsKrw: 0
    }
  };

  const blockedRecalculationResponse = await recalculateRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/recalculate-settlement",
      {
        ...basePayload,
        deductionEligibility: {
          personalPensionEligible: true,
          insurancePremiumEligible: true,
          medicalExpenseEligible: true,
          educationExpenseEligible: true,
          donationEligible: false,
          housingSavingsEligible: true
        }
      },
      actorHeaders("payroll_operator", "PAY-YDE-1001", organization.id)
    )
  );
  assert.equal(blockedRecalculationResponse.status, 409);
  const blockedRecalculationBody = await readJson<{
    details: { blockingReasons: string[] };
  }>(blockedRecalculationResponse);
  assert.ok(
    blockedRecalculationBody.details.blockingReasons.includes(
      "donationKrw deduction is not eligible for selected employee/year"
    )
  );

  const allowedRecalculationResponse = await recalculateRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/recalculate-settlement",
      {
        ...basePayload,
        deductionEligibility: {
          personalPensionEligible: true,
          insurancePremiumEligible: true,
          medicalExpenseEligible: true,
          educationExpenseEligible: true,
          donationEligible: true,
          housingSavingsEligible: true
        }
      },
      actorHeaders("payroll_operator", "PAY-YDE-1001", organization.id)
    )
  );
  assert.equal(allowedRecalculationResponse.status, 200);
  const allowedRecalculationBody = await readJson<{
    recalculation: {
      deductionEligibility: { donationEligible: boolean };
      deductionEligibilityBlockingReasons: string[];
    };
  }>(allowedRecalculationResponse);
  assert.equal(allowedRecalculationBody.recalculation.deductionEligibility.donationEligible, true);
  assert.deepEqual(allowedRecalculationBody.recalculation.deductionEligibilityBlockingReasons, []);

  const blockedFinalizeResponse = await finalizeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/finalize-settlement",
      {
        ...basePayload,
        apply: true,
        finalizedByNote: "wi0262 eligibility guard",
        deductionEligibility: {
          personalPensionEligible: true,
          insurancePremiumEligible: true,
          medicalExpenseEligible: true,
          educationExpenseEligible: true,
          donationEligible: false,
          housingSavingsEligible: true
        }
      },
      actorHeaders("payroll_operator", "PAY-YDE-1001", organization.id)
    )
  );
  assert.equal(blockedFinalizeResponse.status, 409);
  const blockedFinalizeBody = await readJson<{
    details: { blockingReasons: string[] };
  }>(blockedFinalizeResponse);
  assert.ok(
    blockedFinalizeBody.details.blockingReasons.includes(
      "donationKrw deduction is not eligible for selected employee/year"
    )
  );
}

run()
  .then(() => {
    console.log("e2e-wi0262-payroll-year-end-deduction-eligibility-validation-guards.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
