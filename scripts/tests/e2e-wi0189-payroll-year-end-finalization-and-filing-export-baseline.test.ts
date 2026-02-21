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

  const adminLayoutSource = readUtf8("src", "app", "admin", "layout.tsx");
  const filingPageSource = readUtf8("src", "app", "admin", "payroll-year-end-filing", "page.tsx");
  const filingConsoleSource = readUtf8(
    "src",
    "components",
    "payroll-year-end-filing",
    "PayrollYearEndFilingConsole.tsx"
  );
  const payrollApiSpec = readUtf8("specs", "payroll", "api.yaml");
  const payrollContract = readUtf8("specs", "payroll", "contract.yaml");

  assert.match(
    adminLayoutSource,
    /\/admin\/payroll-year-end-filing/,
    "admin nav should include payroll year-end filing route"
  );
  assert.match(
    filingPageSource,
    /PayrollYearEndFilingConsole/,
    "admin filing page should render payroll year-end filing console"
  );
  assert.match(
    filingConsoleSource,
    /Payroll Year-End Finalization/,
    "filing console should include heading text"
  );
  assert.match(
    payrollApiSpec,
    /\/payroll\/year-end\/finalize-settlement:/,
    "api spec should include year-end finalization endpoint"
  );
  assert.match(
    payrollApiSpec,
    /\/payroll\/year-end\/export-filing-data:/,
    "api spec should include year-end filing export endpoint"
  );
  assert.match(
    payrollContract,
    /path: \/payroll\/year-end\/finalize-settlement/,
    "contract should include year-end finalization endpoint"
  );
  assert.match(
    payrollContract,
    /path: \/payroll\/year-end\/export-filing-data/,
    "contract should include year-end filing export endpoint"
  );
  assert.match(
    payrollContract,
    /payroll_year_end_filing_export_v1/,
    "contract should include year-end filing export feature flag"
  );

  const organization = await memoryDataAccess.organizations.create({
    name: "Org Payroll Year End Finalization"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-YEF-1001",
    organizationId: organization.id,
    name: "Year End Filing Employee"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-YEF-1002",
    organizationId: organization.id,
    name: "Year End Filing Other Employee"
  });

  const yearStart = new Date("2026-01-01T00:00:00+09:00");
  const yearEnd = new Date("2026-12-31T23:59:59+09:00");

  const confirmedRunOne = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-YEF-1001",
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
    employeeId: "EMP-YEF-1001",
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
    employeeId: "EMP-YEF-1001",
    periodStart: yearStart,
    periodEnd: yearEnd,
    grossPayKrw: 60000,
    sourceRecordCount: 1
  });

  await memoryDataAccess.payroll.update(confirmedRunOne.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-31T11:00:00+09:00"),
    confirmedBy: "PAY-YEF-1001",
    payslipDistributedAt: new Date("2026-12-31T11:20:00+09:00"),
    payslipDistributedBy: "PAY-YEF-1001",
    payslipReceiptConfirmedAt: new Date("2026-12-31T11:40:00+09:00"),
    payslipReceiptConfirmedBy: "EMP-YEF-1001"
  });
  await memoryDataAccess.payroll.update(confirmedRunTwo.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-31T11:00:00+09:00"),
    confirmedBy: "PAY-YEF-1001",
    payslipDistributedAt: new Date("2026-12-31T11:35:00+09:00"),
    payslipDistributedBy: "PAY-YEF-1001"
  });
  assert.equal(previewedRun.state, "PREVIEWED", "fixture previewed run should remain previewed");

  const basePayload = {
    year: 2026,
    employeeId: "EMP-YEF-1001",
    nonTaxableAnnualIncomeKrw: 10000,
    additionalTaxCreditKrw: 2000,
    annualIncomeTaxRate: 0.03,
    localIncomeTaxRate: 0.1,
    deductionItems: {
      personalPensionKrw: 20000,
      insurancePremiumKrw: 10000,
      medicalExpenseKrw: 8000,
      educationExpenseKrw: 7000,
      donationKrw: 3000,
      housingSavingsKrw: 2000
    }
  };

  const previewResponse = await finalizeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/finalize-settlement",
      { ...basePayload, apply: false, finalizedByNote: "preview" },
      actorHeaders("payroll_operator", "PAY-YEF-1001", organization.id)
    )
  );
  assert.equal(previewResponse.status, 200, "year-end finalization preview should succeed");
  const previewBody = await readJson<{
    settlement: {
      canFinalize: boolean;
      finalized: boolean;
      runStates: { previewedRuns: number; pendingReceiptRuns: number };
      blockingReasons: string[];
    };
  }>(previewResponse);
  assert.equal(previewBody.settlement.canFinalize, false);
  assert.equal(previewBody.settlement.finalized, false);
  assert.equal(previewBody.settlement.runStates.previewedRuns, 1);
  assert.equal(previewBody.settlement.runStates.pendingReceiptRuns, 1);
  assert.ok(
    previewBody.settlement.blockingReasons.includes(
      "all payroll runs must be confirmed before year-end finalization"
    )
  );

  const blockedFinalizeResponse = await finalizeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/finalize-settlement",
      { ...basePayload, apply: true, finalizedByNote: "apply blocked" },
      actorHeaders("payroll_operator", "PAY-YEF-1001", organization.id)
    )
  );
  assert.equal(blockedFinalizeResponse.status, 409, "finalization apply should be blocked while prerequisites remain");

  const blockedExportResponse = await exportRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/export-filing-data",
      { year: 2026, employeeId: "EMP-YEF-1001", format: "csv" },
      actorHeaders("payroll_operator", "PAY-YEF-1001", organization.id)
    )
  );
  assert.equal(blockedExportResponse.status, 409, "filing export should be blocked before finalization");

  await memoryDataAccess.payroll.update(confirmedRunTwo.id, {
    payslipReceiptConfirmedAt: new Date("2026-12-31T12:20:00+09:00"),
    payslipReceiptConfirmedBy: "EMP-YEF-1001"
  });
  await memoryDataAccess.payroll.update(previewedRun.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-31T11:50:00+09:00"),
    confirmedBy: "PAY-YEF-1001",
    payslipDistributedAt: new Date("2026-12-31T12:10:00+09:00"),
    payslipDistributedBy: "PAY-YEF-1001",
    payslipReceiptConfirmedAt: new Date("2026-12-31T12:30:00+09:00"),
    payslipReceiptConfirmedBy: "EMP-YEF-1001"
  });

  const finalizeResponse = await finalizeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/finalize-settlement",
      { ...basePayload, apply: true, finalizedByNote: "apply finalization" },
      actorHeaders("payroll_operator", "PAY-YEF-1001", organization.id)
    )
  );
  assert.equal(finalizeResponse.status, 200, "year-end finalization apply should succeed");
  const finalizeBody = await readJson<{
    settlement: {
      canFinalize: boolean;
      finalized: boolean;
      finalizationId: string;
      finalizedAt: string | null;
      runStates: { totalRuns: number; confirmedRuns: number; previewedRuns: number };
    };
  }>(finalizeResponse);
  assert.equal(finalizeBody.settlement.canFinalize, true);
  assert.equal(finalizeBody.settlement.finalized, true);
  assert.match(finalizeBody.settlement.finalizationId, /^YEF-2026-EMP-YEF-1001$/);
  assert.ok(finalizeBody.settlement.finalizedAt !== null);
  assert.equal(finalizeBody.settlement.runStates.totalRuns, 3);
  assert.equal(finalizeBody.settlement.runStates.confirmedRuns, 3);
  assert.equal(finalizeBody.settlement.runStates.previewedRuns, 0);

  const exportResponse = await exportRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/export-filing-data",
      { year: 2026, employeeId: "EMP-YEF-1001", format: "csv" },
      actorHeaders("payroll_operator", "PAY-YEF-1001", organization.id)
    )
  );
  assert.equal(exportResponse.status, 200, "filing export should succeed after finalization");
  const exportBody = await readJson<{
    filingData: {
      format: "json" | "csv";
      records: Array<{ runId: string }>;
      csv: string | null;
      runStates: { totalRuns: number; confirmedRuns: number; previewedRuns: number };
    };
  }>(exportResponse);
  assert.equal(exportBody.filingData.format, "csv");
  assert.equal(exportBody.filingData.records.length, 3);
  assert.ok(exportBody.filingData.records.some((row) => row.runId === previewedRun.id));
  assert.equal(exportBody.filingData.runStates.totalRuns, 3);
  assert.equal(exportBody.filingData.runStates.confirmedRuns, 3);
  assert.equal(exportBody.filingData.runStates.previewedRuns, 0);
  assert.ok(exportBody.filingData.csv !== null);
  assert.ok(exportBody.filingData.csv!.includes("finalizationId"));
  assert.ok(exportBody.filingData.csv!.includes(previewedRun.id));

  const unauthorizedFinalizeResponse = await finalizeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/finalize-settlement",
      { ...basePayload, apply: false, finalizedByNote: "unauthorized" },
      actorHeaders("employee", "EMP-YEF-1001", organization.id)
    )
  );
  assert.equal(unauthorizedFinalizeResponse.status, 403, "employee should not finalize year-end settlement");

  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_FILING_EXPORT_V1 = "false";
  const flagOffExportResponse = await exportRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/export-filing-data",
      { year: 2026, employeeId: "EMP-YEF-1001", format: "json" },
      actorHeaders("payroll_operator", "PAY-YEF-1001", organization.id)
    )
  );
  assert.equal(flagOffExportResponse.status, 409, "filing export should be blocked when feature flag is disabled");

  const previewLogs = await memoryDataAccess.audit.list({
    actions: ["payroll.year_end.settlement_finalize_previewed"],
    entityType: "PayrollYearEnd"
  });
  const finalizedLogs = await memoryDataAccess.audit.list({
    actions: ["payroll.year_end.settlement_finalized"],
    entityType: "PayrollYearEnd"
  });
  const exportLogs = await memoryDataAccess.audit.list({
    actions: ["payroll.year_end.filing_data_exported"],
    entityType: "PayrollYearEnd"
  });
  assert.equal(previewLogs.length, 1, "finalization preview should append audit log");
  assert.equal(finalizedLogs.length, 1, "finalization apply should append audit log");
  assert.equal(exportLogs.length, 1, "filing export should append audit log");
}

run()
  .then(() => {
    console.log("e2e-wi0189-payroll-year-end-finalization-and-filing-export-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
