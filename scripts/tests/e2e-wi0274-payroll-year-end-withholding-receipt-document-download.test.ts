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
  const withholdingReceiptRoute = await import(
    "../../src/app/api/payroll/year-end/withholding-receipts/route.ts"
  );

  resetMemoryDataAccess();
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_V1 = "true";

  const payrollApiSpec = readUtf8("specs", "payroll", "api.yaml");
  const payrollContract = readUtf8("specs", "payroll", "contract.yaml");
  const payrollTestCases = readUtf8("specs", "payroll", "test-cases.md");
  assert.match(payrollApiSpec, /Get issued withholding receipt document/i);
  assert.match(payrollContract, /issued withholding receipt document read\/download workflow/i);
  assert.match(payrollTestCases, /issued withholding receipt document/i);

  const organization = await memoryDataAccess.organizations.create({
    name: "Org Payroll Withholding Document"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-WDOC-1001",
    organizationId: organization.id,
    name: "Withholding Document Employee"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-WDOC-2002",
    organizationId: organization.id,
    name: "Other Employee"
  });

  const yearStart = new Date("2026-01-01T00:00:00+09:00");
  const yearEnd = new Date("2026-12-31T23:59:59+09:00");
  const runRecord = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-WDOC-1001",
    periodStart: yearStart,
    periodEnd: yearEnd,
    grossPayKrw: 3_200_000,
    withholdingTaxKrw: 120_000,
    socialInsuranceKrw: 150_000,
    otherDeductionsKrw: 20_000,
    totalDeductionsKrw: 290_000,
    netPayKrw: 2_910_000,
    sourceRecordCount: 1
  });

  await memoryDataAccess.payroll.update(runRecord.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-31T09:00:00+09:00"),
    confirmedBy: "PAY-WDOC-1001",
    payslipDistributedAt: new Date("2026-12-31T09:10:00+09:00"),
    payslipDistributedBy: "PAY-WDOC-1001",
    payslipReceiptConfirmedAt: new Date("2026-12-31T09:20:00+09:00"),
    payslipReceiptConfirmedBy: "EMP-WDOC-1001"
  });

  const notFoundDocumentResponse = await withholdingReceiptRoute.GET(
    getRequest(
      "/api/payroll/year-end/withholding-receipts?year=2026&employeeId=EMP-WDOC-1001&format=json",
      actorHeaders("employee", "EMP-WDOC-1001", organization.id)
    )
  );
  assert.equal(notFoundDocumentResponse.status, 404);

  const issueResponse = await withholdingReceiptRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/withholding-receipts",
      {
        year: 2026,
        employeeId: "EMP-WDOC-1001",
        issue: true,
        issuerName: "payroll-team"
      },
      actorHeaders("payroll_operator", "PAY-WDOC-1001", organization.id)
    )
  );
  assert.equal(issueResponse.status, 200);

  const documentJsonResponse = await withholdingReceiptRoute.GET(
    getRequest(
      "/api/payroll/year-end/withholding-receipts?year=2026&employeeId=EMP-WDOC-1001&format=json",
      actorHeaders("employee", "EMP-WDOC-1001", organization.id)
    )
  );
  assert.equal(documentJsonResponse.status, 200);
  const documentJsonBody = await readJson<{
    document: {
      fileName: string;
      format: "json" | "text";
      contentType: string;
      contentSha256: string;
      issuedAt: string;
      receipt: {
        receiptNumber: string;
      };
      content: string;
    };
  }>(documentJsonResponse);
  assert.equal(documentJsonBody.document.format, "json");
  assert.equal(documentJsonBody.document.fileName, "withholding-receipt-2026-EMP-WDOC-1001.json");
  assert.equal(documentJsonBody.document.contentType, "application/json; charset=utf-8");
  assert.match(documentJsonBody.document.contentSha256, /^[a-f0-9]{64}$/);
  assert.match(documentJsonBody.document.issuedAt, /^2026-/);
  assert.match(documentJsonBody.document.content, /\"receiptNumber\": \"WR-2026-EMP-WDOC-1001\"/);

  const documentTextResponse = await withholdingReceiptRoute.GET(
    getRequest(
      "/api/payroll/year-end/withholding-receipts?year=2026&employeeId=EMP-WDOC-1001&format=text",
      actorHeaders("employee", "EMP-WDOC-1001", organization.id)
    )
  );
  assert.equal(documentTextResponse.status, 200);
  const documentTextBody = await readJson<{
    document: {
      fileName: string;
      format: "json" | "text";
      contentType: string;
      content: string;
    };
  }>(documentTextResponse);
  assert.equal(documentTextBody.document.format, "text");
  assert.equal(documentTextBody.document.fileName, "withholding-receipt-2026-EMP-WDOC-1001.txt");
  assert.equal(documentTextBody.document.contentType, "text/plain; charset=utf-8");
  assert.match(documentTextBody.document.content, /^FlowHR Withholding Receipt/m);

  const forbiddenOtherEmployeeResponse = await withholdingReceiptRoute.GET(
    getRequest(
      "/api/payroll/year-end/withholding-receipts?year=2026&employeeId=EMP-WDOC-1001&format=json",
      actorHeaders("employee", "EMP-WDOC-2002", organization.id)
    )
  );
  assert.equal(forbiddenOtherEmployeeResponse.status, 403);
}

run()
  .then(() => {
    console.log("e2e-wi0274-payroll-year-end-withholding-receipt-document-download.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
