import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "memory";
runtimeEnv.FLOWHR_EVENT_PUBLISHER = "memory";
runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
runtimeEnv.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.DIRECT_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";

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
  const { memoryDataAccess, resetMemoryDataAccess } = await import("../../src/features/shared/memory-data-access.ts");
  const finalizeRoute = await import("../../src/app/api/payroll/year-end/finalize-settlement/route.ts");

  resetMemoryDataAccess();
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_DEDUCTION_INPUT_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_FILING_EXPORT_V1 = "true";

  const payrollContract = readUtf8("specs", "payroll", "contract.yaml");
  const payrollTestCases = readUtf8("specs", "payroll", "test-cases.md");
  assert.match(payrollContract, /duplicate apply conflict guard workflow/i);
  assert.match(payrollTestCases, /duplicate `apply=true`/i);

  const organization = await memoryDataAccess.organizations.create({
    name: "Org Payroll Finalize Reapply Guard"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-YFRG-1001",
    organizationId: organization.id,
    name: "Finalize Guard Employee"
  });
  const runRecord = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-YFRG-1001",
    periodStart: new Date("2026-01-01T00:00:00+09:00"),
    periodEnd: new Date("2026-12-31T23:59:59+09:00"),
    grossPayKrw: 4_800_000,
    withholdingTaxKrw: 80_000,
    socialInsuranceKrw: 150_000,
    otherDeductionsKrw: 30_000,
    totalDeductionsKrw: 260_000,
    netPayKrw: 4_540_000,
    sourceRecordCount: 1
  });
  await memoryDataAccess.payroll.update(runRecord.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-31T09:00:00+09:00"),
    confirmedBy: "PAY-YFRG-1001",
    payslipDistributedAt: new Date("2026-12-31T09:10:00+09:00"),
    payslipDistributedBy: "PAY-YFRG-1001",
    payslipReceiptConfirmedAt: new Date("2026-12-31T09:20:00+09:00"),
    payslipReceiptConfirmedBy: "EMP-YFRG-1001"
  });

  const operatorHeaders = actorHeaders("payroll_operator", "PAY-YFRG-1001", organization.id);
  const basePayload = {
    year: 2026,
    employeeId: "EMP-YFRG-1001",
    nonTaxableAnnualIncomeKrw: 0,
    additionalTaxCreditKrw: 0,
    annualIncomeTaxRate: 0.03,
    localIncomeTaxRate: 0.1,
    taxCredits: {
      earnedIncomeTaxCreditKrw: 0,
      childTaxCreditKrw: 0,
      additionalTaxCreditKrw: 0
    },
    deductionItems: {
      personalPensionKrw: 0,
      insurancePremiumKrw: 0,
      medicalExpenseKrw: 0,
      educationExpenseKrw: 0,
      donationKrw: 0,
      housingSavingsKrw: 0
    },
    deductionEligibility: {
      personalPensionEligible: true,
      insurancePremiumEligible: true,
      medicalExpenseEligible: true,
      educationExpenseEligible: true,
      donationEligible: true,
      housingSavingsEligible: true
    }
  };

  const applyFirstResponse = await finalizeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/finalize-settlement",
      {
        ...basePayload,
        apply: true,
        finalizedByNote: "wi0286 first apply"
      },
      operatorHeaders
    )
  );
  assert.equal(applyFirstResponse.status, 200);
  const applyFirstBody = await readJson<{
    settlement: {
      settlementHash: string;
    };
  }>(applyFirstResponse);
  assert.match(applyFirstBody.settlement.settlementHash, /^[a-f0-9]{64}$/);

  const applySameResponse = await finalizeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/finalize-settlement",
      {
        ...basePayload,
        apply: true,
        finalizedByNote: "wi0286 same hash reapply",
        expectedSettlementHash: applyFirstBody.settlement.settlementHash
      },
      operatorHeaders
    )
  );
  assert.equal(applySameResponse.status, 409);
  const applySameBody = await readJson<{
    error: string;
    details?: {
      settlementHash?: string;
      latestFinalizationId?: string;
    };
  }>(applySameResponse);
  assert.match(applySameBody.error, /already finalized/i);
  assert.equal(applySameBody.details?.settlementHash, applyFirstBody.settlement.settlementHash);
  assert.ok((applySameBody.details?.latestFinalizationId ?? "").startsWith("YEF-"));

  const changedPreviewResponse = await finalizeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/finalize-settlement",
      {
        ...basePayload,
        apply: false,
        additionalTaxCreditKrw: 15_000,
        taxCredits: {
          ...basePayload.taxCredits,
          additionalTaxCreditKrw: 15_000
        },
        finalizedByNote: "wi0286 changed preview"
      },
      operatorHeaders
    )
  );
  assert.equal(changedPreviewResponse.status, 200);
  const changedPreviewBody = await readJson<{
    settlement: {
      settlementHash: string;
    };
  }>(changedPreviewResponse);
  assert.match(changedPreviewBody.settlement.settlementHash, /^[a-f0-9]{64}$/);
  assert.notEqual(changedPreviewBody.settlement.settlementHash, applyFirstBody.settlement.settlementHash);

  const changedApplyResponse = await finalizeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/finalize-settlement",
      {
        ...basePayload,
        apply: true,
        additionalTaxCreditKrw: 15_000,
        taxCredits: {
          ...basePayload.taxCredits,
          additionalTaxCreditKrw: 15_000
        },
        expectedSettlementHash: changedPreviewBody.settlement.settlementHash,
        finalizedByNote: "wi0286 changed apply"
      },
      operatorHeaders
    )
  );
  assert.equal(changedApplyResponse.status, 200);
}

run()
  .then(() => {
    console.log("e2e-wi0286-payroll-year-end-finalization-reapply-conflict-guard.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
