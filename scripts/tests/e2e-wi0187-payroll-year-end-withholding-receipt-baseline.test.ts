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
  const receiptRoute = await import("../../src/app/api/payroll/year-end/withholding-receipts/route.ts");

  resetMemoryDataAccess();
  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_V1 = "true";

  const adminLayoutSource = readUtf8("src", "app", "admin", "layout.tsx");
  const employeeLayoutSource = readUtf8("src", "app", "employee", "layout.tsx");
  const adminPageSource = readUtf8("src", "app", "admin", "payroll-year-end", "page.tsx");
  const employeePageSource = readUtf8("src", "app", "employee", "withholding-receipt", "page.tsx");
  const adminConsoleSource = readUtf8("src", "components", "payroll-year-end", "PayrollYearEndConsole.tsx");
  const yearEndCopySource = readUtf8("src", "components", "payroll-year-end", "copy.ts");
  const employeeConsoleSource = readUtf8(
    "src",
    "components",
    "withholding-receipt",
    "WithholdingReceiptConsole.tsx"
  );
  const withholdingCopySource = readUtf8(
    "src",
    "components",
    "withholding-receipt",
    "copy-runtime.ts"
  );
  const payrollApiSpec = readUtf8("specs", "payroll", "api.yaml");
  const payrollContract = readUtf8("specs", "payroll", "contract.yaml");

  assert.match(adminLayoutSource, /\/admin\/payroll-year-end/, "admin nav should include payroll year-end route");
  assert.match(
    employeeLayoutSource,
    /\/employee\/withholding-receipt/,
    "employee nav should include withholding receipt route"
  );
  assert.match(adminPageSource, /PayrollYearEndConsole/, "admin page should render payroll year-end console");
  assert.match(
    employeePageSource,
    /WithholdingReceiptConsole/,
    "employee page should render withholding receipt console"
  );
  assert.match(
    adminConsoleSource,
    /payrollYearEndCopyByLocale/,
    "year-end console should wire locale copy map"
  );
  assert.match(
    adminConsoleSource,
    /const copy = payrollYearEndCopyByLocale\[locale\];/,
    "year-end console should resolve runtime copy bundle"
  );
  assert.match(
    yearEndCopySource,
    /title: "Payroll Year-End and Withholding Receipt"/,
    "year-end copy should include english heading text"
  );
  assert.match(
    employeeConsoleSource,
    /withholdingReceiptCopyByLocale/,
    "employee console should resolve locale copy at runtime"
  );
  assert.match(
    withholdingCopySource,
    /title: "Withholding Receipt"/,
    "withholding receipt copy should include english heading text"
  );
  assert.match(
    payrollApiSpec,
    /\/payroll\/year-end\/preview-settlement:/,
    "api spec should include year-end settlement endpoint"
  );
  assert.match(
    payrollApiSpec,
    /\/payroll\/year-end\/withholding-receipts:/,
    "api spec should include withholding receipt endpoint"
  );
  assert.match(
    payrollContract,
    /path: \/payroll\/year-end\/preview-settlement/,
    "contract should include year-end settlement endpoint"
  );
  assert.match(
    payrollContract,
    /path: \/payroll\/year-end\/withholding-receipts/,
    "contract should include withholding receipt endpoint"
  );
  assert.match(payrollContract, /version: \d+\.\d+\.\d+/, "contract version should remain semver-formatted");

  const organization = await memoryDataAccess.organizations.create({ name: "Org Payroll Year End" });
  await memoryDataAccess.employees.create({
    id: "EMP-YE-1001",
    organizationId: organization.id,
    name: "Year End Employee"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-YE-1002",
    organizationId: organization.id,
    name: "Year End Other Employee"
  });

  const yearStart = new Date("2026-01-01T00:00:00+09:00");
  const yearEnd = new Date("2026-12-31T23:59:59+09:00");

  const confirmedRunOne = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-YE-1001",
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
    employeeId: "EMP-YE-1001",
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
    employeeId: "EMP-YE-1001",
    periodStart: yearStart,
    periodEnd: yearEnd,
    grossPayKrw: 60000,
    sourceRecordCount: 1
  });

  await memoryDataAccess.payroll.update(confirmedRunOne.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-31T11:00:00+09:00"),
    confirmedBy: "PAY-YE-1001",
    payslipDistributedAt: new Date("2026-12-31T11:30:00+09:00"),
    payslipDistributedBy: "PAY-YE-1001",
    payslipReceiptConfirmedAt: new Date("2026-12-31T12:00:00+09:00"),
    payslipReceiptConfirmedBy: "EMP-YE-1001"
  });
  await memoryDataAccess.payroll.update(confirmedRunTwo.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-31T11:00:00+09:00"),
    confirmedBy: "PAY-YE-1001",
    payslipDistributedAt: new Date("2026-12-31T11:40:00+09:00"),
    payslipDistributedBy: "PAY-YE-1001"
  });
  assert.equal(previewedRun.state, "PREVIEWED", "fixture previewed run should remain previewed");

  const settlementPayload = {
    year: 2026,
    employeeId: "EMP-YE-1001",
    nonTaxableAnnualIncomeKrw: 10000,
    additionalTaxCreditKrw: 2000,
    annualIncomeTaxRate: 0.03,
    localIncomeTaxRate: 0.1
  };

  const settlementResponse = await settlementRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/preview-settlement",
      settlementPayload,
      actorHeaders("payroll_operator", "PAY-YE-1001", organization.id)
    )
  );
  assert.equal(settlementResponse.status, 200, "year-end settlement preview should succeed");
  const settlementBody = await readJson<{
    summary: {
      runStates: { totalRuns: number; confirmedRuns: number; previewedRuns: number; previewedRunIds: string[] };
      annualTotalsKrw: { grossPayKrw: number; withholdingTaxKrw: number; socialInsuranceKrw: number; netPayKrw: number };
      settlementKrw: {
        taxableAnnualIncomeKrw: number;
        annualIncomeTaxBeforeCreditKrw: number;
        annualIncomeTaxAfterCreditKrw: number;
        annualLocalIncomeTaxKrw: number;
        annualTaxLiabilityKrw: number;
        priorWithheldTaxKrw: number;
        withholdingDeltaKrw: number;
      };
    };
  }>(settlementResponse);

  assert.deepEqual(settlementBody.summary.runStates, {
    totalRuns: 3,
    confirmedRuns: 2,
    previewedRuns: 1,
    previewedRunIds: [previewedRun.id]
  });
  assert.equal(settlementBody.summary.annualTotalsKrw.grossPayKrw, 180000);
  assert.equal(settlementBody.summary.annualTotalsKrw.withholdingTaxKrw, 12000);
  assert.equal(settlementBody.summary.annualTotalsKrw.socialInsuranceKrw, 9000);
  assert.equal(settlementBody.summary.annualTotalsKrw.netPayKrw, 157000);
  assert.equal(settlementBody.summary.settlementKrw.taxableAnnualIncomeKrw, 170000);
  assert.equal(settlementBody.summary.settlementKrw.annualIncomeTaxBeforeCreditKrw, 5100);
  assert.equal(settlementBody.summary.settlementKrw.annualIncomeTaxAfterCreditKrw, 3100);
  assert.equal(settlementBody.summary.settlementKrw.annualLocalIncomeTaxKrw, 310);
  assert.equal(settlementBody.summary.settlementKrw.annualTaxLiabilityKrw, 3410);
  assert.equal(settlementBody.summary.settlementKrw.priorWithheldTaxKrw, 12000);
  assert.equal(settlementBody.summary.settlementKrw.withholdingDeltaKrw, -8590);

  const receiptPreviewPayload = {
    year: 2026,
    employeeId: "EMP-YE-1001",
    issue: false
  };
  const receiptPreviewResponse = await receiptRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/withholding-receipts",
      receiptPreviewPayload,
      actorHeaders("employee", "EMP-YE-1001", organization.id)
    )
  );
  assert.equal(receiptPreviewResponse.status, 200, "employee should preview own withholding receipt");
  const receiptPreviewBody = await readJson<{
    receipt: {
      canIssue: boolean;
      issued: boolean;
      runStates: { previewedRuns: number; pendingReceiptRuns: number };
      blockingReasons: string[];
    };
  }>(receiptPreviewResponse);
  assert.equal(receiptPreviewBody.receipt.canIssue, false);
  assert.equal(receiptPreviewBody.receipt.issued, false);
  assert.equal(receiptPreviewBody.receipt.runStates.previewedRuns, 1);
  assert.equal(receiptPreviewBody.receipt.runStates.pendingReceiptRuns, 1);
  assert.ok(
    receiptPreviewBody.receipt.blockingReasons.includes(
      "all payroll runs must be confirmed before withholding receipt issue"
    )
  );

  const issueBlockedResponse = await receiptRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/withholding-receipts",
      { ...receiptPreviewPayload, issue: true, issuerName: "payroll-team" },
      actorHeaders("payroll_operator", "PAY-YE-1001", organization.id)
    )
  );
  assert.equal(issueBlockedResponse.status, 409, "issue should be blocked while prerequisites are not met");

  await memoryDataAccess.payroll.update(confirmedRunTwo.id, {
    payslipReceiptConfirmedAt: new Date("2026-12-31T12:20:00+09:00"),
    payslipReceiptConfirmedBy: "EMP-YE-1001"
  });
  await memoryDataAccess.payroll.update(previewedRun.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-12-31T11:50:00+09:00"),
    confirmedBy: "PAY-YE-1001",
    payslipDistributedAt: new Date("2026-12-31T12:10:00+09:00"),
    payslipDistributedBy: "PAY-YE-1001",
    payslipReceiptConfirmedAt: new Date("2026-12-31T12:30:00+09:00"),
    payslipReceiptConfirmedBy: "EMP-YE-1001"
  });

  const issueSuccessResponse = await receiptRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/withholding-receipts",
      { ...receiptPreviewPayload, issue: true, issuerName: "payroll-team" },
      actorHeaders("payroll_operator", "PAY-YE-1001", organization.id)
    )
  );
  assert.equal(issueSuccessResponse.status, 200, "issue should succeed after prerequisites are met");
  const issueSuccessBody = await readJson<{
    receipt: { canIssue: boolean; issued: boolean; issuerName: string; issuedAt: string | null };
  }>(issueSuccessResponse);
  assert.equal(issueSuccessBody.receipt.canIssue, true);
  assert.equal(issueSuccessBody.receipt.issued, true);
  assert.equal(issueSuccessBody.receipt.issuerName, "payroll-team");
  assert.ok(issueSuccessBody.receipt.issuedAt !== null);

  const unauthorizedIssueResponse = await receiptRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/withholding-receipts",
      { ...receiptPreviewPayload, issue: true },
      actorHeaders("employee", "EMP-YE-1002", organization.id)
    )
  );
  assert.equal(unauthorizedIssueResponse.status, 403, "employee should not issue withholding receipt");

  runtimeEnv.FLOWHR_PAYROLL_YEAR_END_V1 = "false";
  const flagOffSettlementResponse = await settlementRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/preview-settlement",
      settlementPayload,
      actorHeaders("payroll_operator", "PAY-YE-1001", organization.id)
    )
  );
  assert.equal(flagOffSettlementResponse.status, 409, "year-end settlement should be blocked when flag is disabled");

  const flagOffReceiptResponse = await receiptRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/year-end/withholding-receipts",
      receiptPreviewPayload,
      actorHeaders("employee", "EMP-YE-1001", organization.id)
    )
  );
  assert.equal(flagOffReceiptResponse.status, 409, "withholding receipt should be blocked when flag is disabled");

  const settlementLogs = await memoryDataAccess.audit.list({
    actions: ["payroll.year_end.settlement_previewed"],
    entityType: "PayrollYearEnd"
  });
  const receiptPreviewLogs = await memoryDataAccess.audit.list({
    actions: ["payroll.year_end.withholding_receipt_previewed"],
    entityType: "PayrollYearEnd"
  });
  const receiptIssuedLogs = await memoryDataAccess.audit.list({
    actions: ["payroll.year_end.withholding_receipt_issued"],
    entityType: "PayrollYearEnd"
  });
  assert.equal(settlementLogs.length, 1, "year-end settlement preview should append audit log");
  assert.equal(receiptPreviewLogs.length, 1, "withholding receipt preview should append audit log");
  assert.equal(receiptIssuedLogs.length, 1, "withholding receipt issue should append audit log");
}

run()
  .then(() => {
    console.log("e2e-wi0187-payroll-year-end-withholding-receipt-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
