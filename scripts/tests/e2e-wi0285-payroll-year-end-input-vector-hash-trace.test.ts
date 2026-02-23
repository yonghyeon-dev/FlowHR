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
  const previewRoute = await import("../../src/app/api/payroll/year-end/preview-settlement/route.ts");
  const recalculateRoute = await import("../../src/app/api/payroll/year-end/recalculate-settlement/route.ts");
  const finalizeRoute = await import("../../src/app/api/payroll/year-end/finalize-settlement/route.ts");

  resetMemoryDataAccess();
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_DEDUCTION_INPUT_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_FILING_EXPORT_V1 = "true";

  const payrollApiSpec = readUtf8("specs", "payroll", "api.yaml");
  const payrollContract = readUtf8("specs", "payroll", "contract.yaml");
  const payrollTestCases = readUtf8("specs", "payroll", "test-cases.md");
  assert.match(payrollApiSpec, /version:\s*1\.57\.0/);
  assert.match(payrollApiSpec, /inputVectorHash/i);
  assert.match(payrollContract, /version:\s*1\.57\.0/);
  assert.match(payrollContract, /input-vector hash workflow/i);
  assert.match(payrollTestCases, /inputVectorHash/);

  const organization = await memoryDataAccess.organizations.create({
    name: "Org Payroll Input Vector Hash"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-YIVH-1001",
    organizationId: organization.id,
    name: "Input Vector Employee"
  });

  const runRecord = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-YIVH-1001",
    periodStart: new Date("2026-01-01T00:00:00+09:00"),
    periodEnd: new Date("2026-12-31T23:59:59+09:00"),
    grossPayKrw: 6_000_000,
    withholdingTaxKrw: 120_000,
    socialInsuranceKrw: 210_000,
    otherDeductionsKrw: 50_000,
    totalDeductionsKrw: 380_000,
    netPayKrw: 5_620_000,
    sourceRecordCount: 1
  });
  await memoryDataAccess.payroll.update(runRecord.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-31T09:00:00+09:00"),
    confirmedBy: "PAY-YIVH-1001",
    payslipDistributedAt: new Date("2026-12-31T09:10:00+09:00"),
    payslipDistributedBy: "PAY-YIVH-1001",
    payslipReceiptConfirmedAt: new Date("2026-12-31T09:20:00+09:00"),
    payslipReceiptConfirmedBy: "EMP-YIVH-1001"
  });

  const operatorHeaders = actorHeaders("payroll_operator", "PAY-YIVH-1001", organization.id);
  const previewPayload = {
    year: 2026,
    employeeId: "EMP-YIVH-1001",
    nonTaxableAnnualIncomeKrw: 120_000,
    additionalTaxCreditKrw: 0,
    taxCredits: {
      earnedIncomeTaxCreditKrw: 250_000,
      childTaxCreditKrw: 0,
      additionalTaxCreditKrw: 0
    },
    annualIncomeTaxRate: 0.03,
    localIncomeTaxRate: 0.1
  };

  const previewResponseA = await previewRoute.POST(
    jsonRequest("POST", "/api/payroll/year-end/preview-settlement", previewPayload, operatorHeaders)
  );
  assert.equal(previewResponseA.status, 200);
  const previewBodyA = await readJson<{
    summary: {
      inputVectorHash: string;
    };
  }>(previewResponseA);
  assert.match(previewBodyA.summary.inputVectorHash, /^[a-f0-9]{64}$/);

  const previewResponseB = await previewRoute.POST(
    jsonRequest("POST", "/api/payroll/year-end/preview-settlement", previewPayload, operatorHeaders)
  );
  const previewBodyB = await readJson<{
    summary: {
      inputVectorHash: string;
    };
  }>(previewResponseB);
  assert.equal(previewBodyB.summary.inputVectorHash, previewBodyA.summary.inputVectorHash);

  const previewResponseChanged = await previewRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/preview-settlement",
      {
        ...previewPayload,
        additionalTaxCreditKrw: 10_000,
        taxCredits: {
          ...previewPayload.taxCredits,
          additionalTaxCreditKrw: 10_000
        }
      },
      operatorHeaders
    )
  );
  const previewBodyChanged = await readJson<{
    summary: {
      inputVectorHash: string;
    };
  }>(previewResponseChanged);
  assert.notEqual(previewBodyChanged.summary.inputVectorHash, previewBodyA.summary.inputVectorHash);

  const recalculationPayload = {
    ...previewPayload,
    deductionItems: {
      personalPensionKrw: 300_000,
      insurancePremiumKrw: 100_000,
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

  const recalculateResponseA = await recalculateRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/recalculate-settlement",
      recalculationPayload,
      operatorHeaders
    )
  );
  assert.equal(recalculateResponseA.status, 200);
  const recalculateBodyA = await readJson<{
    recalculation: {
      inputVectorHash: string;
    };
  }>(recalculateResponseA);
  assert.match(recalculateBodyA.recalculation.inputVectorHash, /^[a-f0-9]{64}$/);

  const recalculateResponseB = await recalculateRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/recalculate-settlement",
      recalculationPayload,
      operatorHeaders
    )
  );
  const recalculateBodyB = await readJson<{
    recalculation: {
      inputVectorHash: string;
    };
  }>(recalculateResponseB);
  assert.equal(
    recalculateBodyB.recalculation.inputVectorHash,
    recalculateBodyA.recalculation.inputVectorHash
  );

  const finalizePreviewResponse = await finalizeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/finalize-settlement",
      {
        ...recalculationPayload,
        apply: false,
        finalizedByNote: "wi0285 finalize preview"
      },
      operatorHeaders
    )
  );
  assert.equal(finalizePreviewResponse.status, 200);
  const finalizePreviewBody = await readJson<{
    settlement: {
      inputVectorHash: string;
    };
  }>(finalizePreviewResponse);
  assert.equal(
    finalizePreviewBody.settlement.inputVectorHash,
    recalculateBodyA.recalculation.inputVectorHash
  );
}

run()
  .then(() => {
    console.log("e2e-wi0285-payroll-year-end-input-vector-hash-trace.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
