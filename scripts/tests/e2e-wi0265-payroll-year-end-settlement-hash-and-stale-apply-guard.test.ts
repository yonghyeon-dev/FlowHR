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

  resetMemoryDataAccess();
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_DEDUCTION_INPUT_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_FILING_EXPORT_V1 = "true";

  const payrollApiSpec = readUtf8("specs", "payroll", "api.yaml");
  const payrollContract = readUtf8("specs", "payroll", "contract.yaml");
  const payrollTestCases = readUtf8("specs", "payroll", "test-cases.md");
  assert.match(payrollApiSpec, /settlementHash|settlement hash/i);
  assert.match(payrollContract, /settlement hash/i);
  assert.match(payrollTestCases, /Year-End Settlement Hash Gate/);

  const organization = await memoryDataAccess.organizations.create({
    name: "Org Payroll Year End Settlement Hash"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-YSH-1001",
    organizationId: organization.id,
    name: "Year End Settlement Hash Employee"
  });

  const yearStart = new Date("2026-01-01T00:00:00+09:00");
  const yearEnd = new Date("2026-12-31T23:59:59+09:00");
  const runOne = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-YSH-1001",
    periodStart: yearStart,
    periodEnd: yearEnd,
    grossPayKrw: 2_000_000,
    withholdingTaxKrw: 80_000,
    socialInsuranceKrw: 70_000,
    otherDeductionsKrw: 10_000,
    totalDeductionsKrw: 160_000,
    netPayKrw: 1_840_000,
    sourceRecordCount: 1
  });
  const runTwo = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-YSH-1001",
    periodStart: yearStart,
    periodEnd: yearEnd,
    grossPayKrw: 2_000_000,
    withholdingTaxKrw: 60_000,
    socialInsuranceKrw: 70_000,
    otherDeductionsKrw: 10_000,
    totalDeductionsKrw: 140_000,
    netPayKrw: 1_860_000,
    sourceRecordCount: 1
  });
  await memoryDataAccess.payroll.update(runOne.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-31T09:00:00+09:00"),
    confirmedBy: "PAY-YSH-1001",
    payslipDistributedAt: new Date("2026-12-31T09:10:00+09:00"),
    payslipDistributedBy: "PAY-YSH-1001",
    payslipReceiptConfirmedAt: new Date("2026-12-31T09:20:00+09:00"),
    payslipReceiptConfirmedBy: "EMP-YSH-1001"
  });
  await memoryDataAccess.payroll.update(runTwo.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-31T09:00:00+09:00"),
    confirmedBy: "PAY-YSH-1001",
    payslipDistributedAt: new Date("2026-12-31T09:10:00+09:00"),
    payslipDistributedBy: "PAY-YSH-1001",
    payslipReceiptConfirmedAt: new Date("2026-12-31T09:20:00+09:00"),
    payslipReceiptConfirmedBy: "EMP-YSH-1001"
  });

  const payload = {
    year: 2026,
    employeeId: "EMP-YSH-1001",
    nonTaxableAnnualIncomeKrw: 0,
    additionalTaxCreditKrw: 0,
    annualIncomeTaxRate: 0.03,
    localIncomeTaxRate: 0.1,
    deductionEligibility: {
      personalPensionEligible: true,
      insurancePremiumEligible: true,
      medicalExpenseEligible: true,
      educationExpenseEligible: true,
      donationEligible: true,
      housingSavingsEligible: true
    },
    deductionItems: {
      personalPensionKrw: 0,
      insurancePremiumKrw: 0,
      medicalExpenseKrw: 0,
      educationExpenseKrw: 0,
      donationKrw: 0,
      housingSavingsKrw: 0
    },
    apply: false,
    finalizedByNote: "wi0265 settlement hash preview"
  };

  const previewResponse = await finalizeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/finalize-settlement",
      payload,
      actorHeaders("payroll_operator", "PAY-YSH-1001", organization.id)
    )
  );
  assert.equal(previewResponse.status, 200);
  const previewBody = await readJson<{
    settlement: {
      finalized: boolean;
      settlementHash: string;
    };
  }>(previewResponse);
  assert.equal(previewBody.settlement.finalized, false);
  assert.match(previewBody.settlement.settlementHash, /^[a-f0-9]{64}$/);

  const replayPreviewResponse = await finalizeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/finalize-settlement",
      payload,
      actorHeaders("payroll_operator", "PAY-YSH-1001", organization.id)
    )
  );
  assert.equal(replayPreviewResponse.status, 200);
  const replayPreviewBody = await readJson<typeof previewBody>(replayPreviewResponse);
  assert.equal(replayPreviewBody.settlement.settlementHash, previewBody.settlement.settlementHash);

  const mismatchApplyResponse = await finalizeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/finalize-settlement",
      {
        ...payload,
        apply: true,
        finalizedByNote: "wi0265 settlement hash mismatch apply",
        expectedSettlementHash: "0".repeat(64)
      },
      actorHeaders("payroll_operator", "PAY-YSH-1001", organization.id)
    )
  );
  assert.equal(mismatchApplyResponse.status, 409);
  const mismatchApplyBody = await readJson<{
    details: {
      expectedSettlementHash: string;
      computedSettlementHash: string;
    };
  }>(mismatchApplyResponse);
  assert.equal(mismatchApplyBody.details.expectedSettlementHash, "0".repeat(64));
  assert.equal(mismatchApplyBody.details.computedSettlementHash, previewBody.settlement.settlementHash);

  const applyResponse = await finalizeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/finalize-settlement",
      {
        ...payload,
        apply: true,
        finalizedByNote: "wi0265 settlement hash apply",
        expectedSettlementHash: previewBody.settlement.settlementHash
      },
      actorHeaders("payroll_operator", "PAY-YSH-1001", organization.id)
    )
  );
  assert.equal(applyResponse.status, 200);
  const applyBody = await readJson<{
    settlement: {
      finalized: boolean;
      settlementHash: string;
      finalizedAt: string | null;
    };
  }>(applyResponse);
  assert.equal(applyBody.settlement.finalized, true);
  assert.equal(applyBody.settlement.settlementHash, previewBody.settlement.settlementHash);
  assert.ok(applyBody.settlement.finalizedAt);
}

run()
  .then(() => {
    console.log("e2e-wi0265-payroll-year-end-settlement-hash-and-stale-apply-guard.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
