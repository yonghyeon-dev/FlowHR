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

  const filingConsoleSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingConsole.tsx"
  );
  const payrollApiSpec = readUtf8("specs", "payroll", "api.yaml");
  const payrollContract = readUtf8("specs", "payroll", "contract.yaml");

  assert.match(filingConsoleSource, /hometax_csv/, "filing console should expose hometax_csv option");
  assert.match(filingConsoleSource, /jsonl/, "filing console should expose jsonl option");
  assert.match(filingConsoleSource, /Validation Mode/, "filing console should expose validation mode selector");
  assert.match(payrollApiSpec, /jsonl/, "api spec should mention jsonl format");
  assert.match(payrollContract, /hometax_csv/, "contract should mention hometax_csv format");
  assert.match(payrollContract, /validation mode/i, "contract should mention validation mode");

  const organization = await memoryDataAccess.organizations.create({
    name: "Org Payroll Year End Export Formats"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-YEFX-1001",
    organizationId: organization.id,
    name: "Year End Export Employee"
  });

  const yearStart = new Date("2026-01-01T00:00:00+09:00");
  const yearEnd = new Date("2026-12-31T23:59:59+09:00");

  const runOne = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-YEFX-1001",
    periodStart: yearStart,
    periodEnd: yearEnd,
    grossPayKrw: 500000,
    withholdingTaxKrw: 25000,
    socialInsuranceKrw: 20000,
    otherDeductionsKrw: 5000,
    totalDeductionsKrw: 50000,
    netPayKrw: 450000,
    sourceRecordCount: 1
  });
  const runTwo = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-YEFX-1001",
    periodStart: yearStart,
    periodEnd: yearEnd,
    grossPayKrw: 400000,
    withholdingTaxKrw: 20000,
    socialInsuranceKrw: 16000,
    otherDeductionsKrw: 4000,
    totalDeductionsKrw: 40000,
    netPayKrw: 360000,
    sourceRecordCount: 1
  });

  await memoryDataAccess.payroll.update(runOne.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-31T09:00:00+09:00"),
    confirmedBy: "PAY-YEFX-1001",
    payslipDistributedAt: new Date("2026-12-31T09:10:00+09:00"),
    payslipDistributedBy: "PAY-YEFX-1001",
    payslipReceiptConfirmedAt: new Date("2026-12-31T09:15:00+09:00"),
    payslipReceiptConfirmedBy: "EMP-YEFX-1001"
  });
  await memoryDataAccess.payroll.update(runTwo.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-31T09:20:00+09:00"),
    confirmedBy: "PAY-YEFX-1001",
    payslipDistributedAt: new Date("2026-12-31T09:25:00+09:00"),
    payslipDistributedBy: "PAY-YEFX-1001",
    payslipReceiptConfirmedAt: new Date("2026-12-31T09:30:00+09:00"),
    payslipReceiptConfirmedBy: "EMP-YEFX-1001"
  });

  const finalizeResponse = await finalizeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/finalize-settlement",
      {
        year: 2026,
        employeeId: "EMP-YEFX-1001",
        nonTaxableAnnualIncomeKrw: 10000,
        additionalTaxCreditKrw: 3000,
        annualIncomeTaxRate: 0.03,
        localIncomeTaxRate: 0.1,
        deductionItems: {
          personalPensionKrw: 12000,
          insurancePremiumKrw: 8000,
          medicalExpenseKrw: 6000,
          educationExpenseKrw: 4000,
          donationKrw: 3000,
          housingSavingsKrw: 2000
        },
        apply: true,
        finalizedByNote: "wi0190 format baseline"
      },
      actorHeaders("payroll_operator", "PAY-YEFX-1001", organization.id)
    )
  );
  assert.equal(finalizeResponse.status, 200, "finalization should succeed before export format checks");

  const jsonlExportResponse = await exportRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/export-filing-data",
      {
        year: 2026,
        employeeId: "EMP-YEFX-1001",
        format: "jsonl",
        validationMode: "basic"
      },
      actorHeaders("payroll_operator", "PAY-YEFX-1001", organization.id)
    )
  );
  assert.equal(jsonlExportResponse.status, 200, "jsonl export should succeed");
  const jsonlBody = await readJson<{
    filingData: {
      format: "jsonl";
      validationMode: "basic";
      validation: { status: "pass" | "fail"; issues: string[] };
      artifact: {
        fileName: string;
        contentType: string;
        checksumSha256: string;
        content: string;
      };
      csv: string | null;
    };
  }>(jsonlExportResponse);
  assert.equal(jsonlBody.filingData.format, "jsonl");
  assert.equal(jsonlBody.filingData.validationMode, "basic");
  assert.equal(jsonlBody.filingData.validation.status, "pass");
  assert.equal(jsonlBody.filingData.validation.issues.length, 0);
  assert.equal(jsonlBody.filingData.artifact.contentType, "application/x-ndjson");
  assert.match(jsonlBody.filingData.artifact.fileName, /\.jsonl$/);
  assert.match(jsonlBody.filingData.artifact.checksumSha256, /^[a-f0-9]{64}$/);
  assert.ok(jsonlBody.filingData.artifact.content.includes(`"runId":"${runOne.id}"`));
  assert.equal(jsonlBody.filingData.csv, null);

  const hometaxExportResponse = await exportRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/export-filing-data",
      {
        year: 2026,
        employeeId: "EMP-YEFX-1001",
        format: "hometax_csv",
        validationMode: "strict"
      },
      actorHeaders("payroll_operator", "PAY-YEFX-1001", organization.id)
    )
  );
  assert.equal(hometaxExportResponse.status, 200, "hometax csv strict export should succeed");
  const hometaxBody = await readJson<{
    filingData: {
      format: "hometax_csv";
      validationMode: "strict";
      validation: { status: "pass" | "fail" };
      artifact: {
        fileName: string;
        checksumSha256: string;
        content: string;
      };
      csv: string | null;
    };
  }>(hometaxExportResponse);
  assert.equal(hometaxBody.filingData.format, "hometax_csv");
  assert.equal(hometaxBody.filingData.validationMode, "strict");
  assert.equal(hometaxBody.filingData.validation.status, "pass");
  assert.match(hometaxBody.filingData.artifact.fileName, /\.hometax\.csv$/);
  assert.ok(hometaxBody.filingData.artifact.content.includes("taxableAnnualIncomeKrw"));
  assert.ok(hometaxBody.filingData.csv !== null);

  const hometaxReplayResponse = await exportRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/export-filing-data",
      {
        year: 2026,
        employeeId: "EMP-YEFX-1001",
        format: "hometax_csv",
        validationMode: "strict"
      },
      actorHeaders("payroll_operator", "PAY-YEFX-1001", organization.id)
    )
  );
  assert.equal(hometaxReplayResponse.status, 200, "same payload export should remain deterministic");
  const hometaxReplayBody = await readJson<{
    filingData: {
      artifact: {
        checksumSha256: string;
        content: string;
      };
    };
  }>(hometaxReplayResponse);
  assert.equal(
    hometaxReplayBody.filingData.artifact.checksumSha256,
    hometaxBody.filingData.artifact.checksumSha256,
    "checksum should remain deterministic for same payload and format"
  );
  assert.equal(
    hometaxReplayBody.filingData.artifact.content,
    hometaxBody.filingData.artifact.content,
    "artifact content should remain deterministic for same payload and format"
  );

  const driftRun = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-YEFX-1001",
    periodStart: yearStart,
    periodEnd: yearEnd,
    grossPayKrw: 1000,
    withholdingTaxKrw: 100,
    socialInsuranceKrw: 100,
    otherDeductionsKrw: 100,
    totalDeductionsKrw: 300,
    netPayKrw: 700,
    sourceRecordCount: 1
  });
  await memoryDataAccess.payroll.update(driftRun.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-31T10:00:00+09:00"),
    confirmedBy: "PAY-YEFX-1001",
    payslipDistributedAt: new Date("2026-12-31T10:05:00+09:00"),
    payslipDistributedBy: "PAY-YEFX-1001",
    payslipReceiptConfirmedAt: new Date("2026-12-31T10:10:00+09:00"),
    payslipReceiptConfirmedBy: "EMP-YEFX-1001"
  });

  const basicFailedValidationResponse = await exportRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/export-filing-data",
      {
        year: 2026,
        employeeId: "EMP-YEFX-1001",
        format: "json",
        validationMode: "basic"
      },
      actorHeaders("payroll_operator", "PAY-YEFX-1001", organization.id)
    )
  );
  assert.equal(
    basicFailedValidationResponse.status,
    200,
    "basic mode should return export payload even when validation fails"
  );
  const basicFailedValidationBody = await readJson<{
    filingData: {
      validation: { status: "pass" | "fail"; issues: string[] };
    };
  }>(basicFailedValidationResponse);
  assert.equal(basicFailedValidationBody.filingData.validation.status, "fail");
  assert.ok(
    basicFailedValidationBody.filingData.validation.issues.includes(
      "record totals do not match finalized annual totals"
    )
  );

  const strictFailedValidationResponse = await exportRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/export-filing-data",
      {
        year: 2026,
        employeeId: "EMP-YEFX-1001",
        format: "json",
        validationMode: "strict"
      },
      actorHeaders("payroll_operator", "PAY-YEFX-1001", organization.id)
    )
  );
  assert.equal(strictFailedValidationResponse.status, 409, "strict mode should block failed validation exports");
  const strictFailedValidationBody = await readJson<{
    error: string;
    details?: { issues?: string[] };
  }>(strictFailedValidationResponse);
  assert.match(strictFailedValidationBody.error, /validation failed/i);
  assert.ok(
    strictFailedValidationBody.details?.issues?.includes("record totals do not match finalized annual totals")
  );

  const exportSuccessLogs = await memoryDataAccess.audit.list({
    actions: ["payroll.year_end.filing_data_exported"],
    entityType: "PayrollYearEnd"
  });
  const exportFailLogs = await memoryDataAccess.audit.list({
    actions: ["payroll.year_end.export_filing_data.failed"],
    entityType: "PayrollYearEnd"
  });
  assert.equal(exportSuccessLogs.length, 4, "successful exports should append audit logs");
  assert.equal(exportFailLogs.length, 1, "strict validation failure should append failure audit log");
}

run()
  .then(() => {
    console.log("e2e-wi0190-payroll-year-end-export-format-expansion-and-validation-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
