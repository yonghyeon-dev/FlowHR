import assert from "node:assert/strict";
import { createHash } from "node:crypto";
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
  const { memoryDataAccess, resetMemoryDataAccess } = await import("../../src/features/shared/memory-data-access.ts");

  const finalizeRoute = await import("../../src/app/api/payroll/year-end/finalize-settlement/route.ts");
  const finalizedSettlementRoute = await import("../../src/app/api/payroll/year-end/finalized-settlement/route.ts");
  const contractTemplateRoute = await import("../../src/app/api/contracts/templates/route.ts");
  const contractDocumentRoute = await import("../../src/app/api/contracts/documents/route.ts");
  const contractSendRoute = await import("../../src/app/api/contracts/documents/[documentId]/send/route.ts");
  const contractRespondRoute = await import("../../src/app/api/contracts/documents/[documentId]/respond/route.ts");
  const contractSignatureEvidenceRoute = await import(
    "../../src/app/api/contracts/documents/[documentId]/signature-evidence/route.ts"
  );

  resetMemoryDataAccess();
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_DEDUCTION_INPUT_V1 = "true";
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_FILING_EXPORT_V1 = "true";

  const payrollContract = readUtf8("specs", "payroll", "contract.yaml");
  const contractsContract = readUtf8("specs", "contracts", "contract.yaml");
  assert.match(payrollContract, /input-vector hash workflow/i);
  assert.match(contractsContract, /signature evidence read\/download workflow/i);

  const organization = await memoryDataAccess.organizations.create({ name: "Org Core Journey" });
  await memoryDataAccess.employees.create({
    id: "EMP-CJ-1001",
    organizationId: organization.id,
    name: "Core Journey Employee"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-CJ-2002",
    organizationId: organization.id,
    name: "Other Employee"
  });

  const runRecord = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-CJ-1001",
    periodStart: new Date("2026-01-01T00:00:00+09:00"),
    periodEnd: new Date("2026-12-31T23:59:59+09:00"),
    grossPayKrw: 4_200_000,
    withholdingTaxKrw: 70_000,
    socialInsuranceKrw: 150_000,
    otherDeductionsKrw: 25_000,
    totalDeductionsKrw: 245_000,
    netPayKrw: 3_955_000,
    sourceRecordCount: 1
  });
  await memoryDataAccess.payroll.update(runRecord.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-31T09:00:00+09:00"),
    confirmedBy: "PAY-CJ-1001",
    payslipDistributedAt: new Date("2026-12-31T09:10:00+09:00"),
    payslipDistributedBy: "PAY-CJ-1001",
    payslipReceiptConfirmedAt: new Date("2026-12-31T09:20:00+09:00"),
    payslipReceiptConfirmedBy: "EMP-CJ-1001"
  });

  const payrollApplyResponse = await finalizeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/finalize-settlement",
      {
        year: 2026,
        employeeId: "EMP-CJ-1001",
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
        },
        apply: true,
        finalizedByNote: "wi0290 core journey finalize"
      },
      actorHeaders("payroll_operator", "PAY-CJ-1001", organization.id)
    )
  );
  assert.equal(payrollApplyResponse.status, 200);
  const payrollApplyBody = await readJson<{
    settlement: {
      settlementHash: string;
      inputVectorHash: string;
      finalizationId: string;
    };
  }>(payrollApplyResponse);
  assert.match(payrollApplyBody.settlement.settlementHash, /^[a-f0-9]{64}$/);
  assert.match(payrollApplyBody.settlement.inputVectorHash, /^[a-f0-9]{64}$/);

  const payrollFinalizedReadResponse = await finalizedSettlementRoute.GET(
    getRequest(
      "/api/payroll/year-end/finalized-settlement?year=2026&employeeId=EMP-CJ-1001",
      actorHeaders("employee", "EMP-CJ-1001", organization.id)
    )
  );
  assert.equal(payrollFinalizedReadResponse.status, 200);
  const payrollFinalizedReadBody = await readJson<{
    settlement: {
      finalizationId: string;
      settlementHash: string;
    };
  }>(payrollFinalizedReadResponse);
  assert.equal(
    payrollFinalizedReadBody.settlement.finalizationId,
    payrollApplyBody.settlement.finalizationId
  );
  assert.equal(
    payrollFinalizedReadBody.settlement.settlementHash,
    payrollApplyBody.settlement.settlementHash
  );

  const createTemplateResponse = await contractTemplateRoute.POST(
    jsonRequest(
      "POST",
      "/api/contracts/templates",
      {
        name: "Core Journey Contract",
        category: "employment",
        body: "core journey clause body",
        status: "ACTIVE"
      },
      actorHeaders("admin", "ADMIN-CJ-1001", organization.id)
    )
  );
  assert.equal(createTemplateResponse.status, 201);
  const createTemplateBody = await readJson<{
    template: {
      id: string;
    };
  }>(createTemplateResponse);

  const createDocumentResponse = await contractDocumentRoute.POST(
    jsonRequest(
      "POST",
      "/api/contracts/documents",
      {
        templateId: createTemplateBody.template.id,
        employeeId: "EMP-CJ-1001",
        title: "Core Journey Offer",
        requiresApproval: false
      },
      actorHeaders("admin", "ADMIN-CJ-1001", organization.id)
    )
  );
  assert.equal(createDocumentResponse.status, 201);
  const createDocumentBody = await readJson<{
    document: {
      id: string;
      documentHash: string;
    };
  }>(createDocumentResponse);

  const sendDocumentResponse = await contractSendRoute.POST(
    jsonRequest(
      "POST",
      `/api/contracts/documents/${createDocumentBody.document.id}/send`,
      {},
      actorHeaders("admin", "ADMIN-CJ-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        documentId: createDocumentBody.document.id
      })
    }
  );
  assert.equal(sendDocumentResponse.status, 200);

  const signResponse = await contractRespondRoute.POST(
    jsonRequest(
      "POST",
      `/api/contracts/documents/${createDocumentBody.document.id}/respond`,
      {
        action: "SIGN",
        signatureInput: "core-journey-signature",
        expectedDocumentHash: createDocumentBody.document.documentHash
      },
      actorHeaders("employee", "EMP-CJ-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        documentId: createDocumentBody.document.id
      })
    }
  );
  assert.equal(signResponse.status, 200);

  const evidenceJsonResponse = await contractSignatureEvidenceRoute.GET(
    getRequest(
      `/api/contracts/documents/${createDocumentBody.document.id}/signature-evidence?format=json`,
      actorHeaders("employee", "EMP-CJ-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        documentId: createDocumentBody.document.id
      })
    }
  );
  assert.equal(evidenceJsonResponse.status, 200);
  const evidenceJsonBody = await readJson<{
    evidence: {
      format: "json";
      fileName: string;
      content: string;
      contentSha256: string;
      signatureHash: string;
      signatureEvidenceHash: string;
    };
  }>(evidenceJsonResponse);
  assert.equal(evidenceJsonBody.evidence.format, "json");
  assert.match(evidenceJsonBody.evidence.fileName, /\.json$/);
  assert.match(evidenceJsonBody.evidence.signatureHash, /^[a-f0-9]{64}$/);
  assert.match(evidenceJsonBody.evidence.signatureEvidenceHash, /^[a-f0-9]{64}$/);
  assert.equal(
    evidenceJsonBody.evidence.contentSha256,
    createHash("sha256").update(evidenceJsonBody.evidence.content).digest("hex")
  );

  const evidenceTextResponse = await contractSignatureEvidenceRoute.GET(
    getRequest(
      `/api/contracts/documents/${createDocumentBody.document.id}/signature-evidence?format=text`,
      actorHeaders("employee", "EMP-CJ-1001", organization.id)
    ),
    {
      params: Promise.resolve({
        documentId: createDocumentBody.document.id
      })
    }
  );
  assert.equal(evidenceTextResponse.status, 200);
  const evidenceTextBody = await readJson<{
    evidence: {
      format: "text";
      fileName: string;
    };
  }>(evidenceTextResponse);
  assert.equal(evidenceTextBody.evidence.format, "text");
  assert.match(evidenceTextBody.evidence.fileName, /\.txt$/);

  const forbiddenEvidenceResponse = await contractSignatureEvidenceRoute.GET(
    getRequest(
      `/api/contracts/documents/${createDocumentBody.document.id}/signature-evidence?format=json`,
      actorHeaders("employee", "EMP-CJ-2002", organization.id)
    ),
    {
      params: Promise.resolve({
        documentId: createDocumentBody.document.id
      })
    }
  );
  assert.equal(forbiddenEvidenceResponse.status, 403);
}

run()
  .then(() => {
    console.log("e2e-wi0290-payroll-contract-core-journey-e2e-bundle.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
