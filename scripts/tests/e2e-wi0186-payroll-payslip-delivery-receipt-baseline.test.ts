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

type RouteContext<TParams extends Record<string, string>> = {
  params: Promise<TParams>;
};

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
  const distributeRoute = await import("../../src/app/api/payroll/payslips/distribute/route.ts");
  const acknowledgeRoute = await import(
    "../../src/app/api/payroll/payslips/[runId]/acknowledge/route.ts"
  );

  resetMemoryDataAccess();
  runtimeEnv.FLOWHR_PAYROLL_PAYSLIP_DELIVERY_V1 = "true";

  const adminLayoutSource = readUtf8("src", "app", "admin", "layout.tsx");
  const employeeLayoutSource = readUtf8("src", "app", "employee", "layout.tsx");
  const adminPageSource = readUtf8("src", "app", "admin", "payroll-payslip-delivery", "page.tsx");
  const employeePageSource = readUtf8("src", "app", "employee", "payslip-receipts", "page.tsx");
  const adminConsoleSource = readUtf8(
    "src",
    "components",
    "payroll-payslip-delivery",
    "PayrollPayslipDeliveryConsole.tsx"
  );
  const employeeConsoleSource = readUtf8(
    "src",
    "components",
    "payslip-receipts",
    "PayslipReceiptConsole.tsx"
  );
  const payrollApiSpec = readUtf8("specs", "payroll", "api.yaml");
  const payrollContract = readUtf8("specs", "payroll", "contract.yaml");

  assert.match(adminLayoutSource, /\/admin\/payroll-payslip-delivery/, "admin nav should include payslip delivery route");
  assert.match(employeeLayoutSource, /\/employee\/payslip-receipts/, "employee nav should include payslip receipt route");
  assert.match(adminPageSource, /PayrollPayslipDeliveryConsole/, "admin page should render payslip delivery console");
  assert.match(employeePageSource, /PayslipReceiptConsole/, "employee page should render payslip receipt console");
  assert.match(adminConsoleSource, /Payroll Payslip Delivery/, "admin console should include heading text");
  assert.match(employeeConsoleSource, /Payslip Receipt Confirmation/, "employee console should include heading text");
  assert.match(payrollApiSpec, /\/payroll\/payslips\/distribute:/, "api spec should include payslip distribution endpoint");
  assert.match(payrollApiSpec, /\/payroll\/payslips\/\{runId\}\/acknowledge:/, "api spec should include payslip receipt endpoint");
  assert.match(payrollContract, /path: \/payroll\/payslips\/distribute/, "contract should include payslip distribution endpoint");
  assert.match(payrollContract, /path: \/payroll\/payslips\/\{runId\}\/acknowledge/, "contract should include payslip receipt endpoint");
  assert.match(payrollContract, /version: \d+\.\d+\.\d+/, "contract version should remain semver-formatted");

  const organization = await memoryDataAccess.organizations.create({ name: "Org Payroll Payslip Delivery" });
  await memoryDataAccess.employees.create({
    id: "EMP-PS-1001",
    organizationId: organization.id,
    name: "Payslip Employee 1"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-PS-1002",
    organizationId: organization.id,
    name: "Payslip Employee 2"
  });

  const periodStart = new Date("2026-04-01T00:00:00+09:00");
  const periodEnd = new Date("2026-04-30T23:59:59+09:00");

  const runOne = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-PS-1001",
    periodStart,
    periodEnd,
    grossPayKrw: 120000,
    withholdingTaxKrw: 7000,
    socialInsuranceKrw: 5000,
    otherDeductionsKrw: 2000,
    totalDeductionsKrw: 14000,
    netPayKrw: 106000,
    sourceRecordCount: 1
  });
  const runTwo = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-PS-1002",
    periodStart,
    periodEnd,
    grossPayKrw: 100000,
    withholdingTaxKrw: 6000,
    socialInsuranceKrw: 4500,
    otherDeductionsKrw: 1500,
    totalDeductionsKrw: 12000,
    netPayKrw: 88000,
    sourceRecordCount: 1
  });
  const runPreviewed = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-PS-1002",
    periodStart,
    periodEnd,
    grossPayKrw: 90000,
    withholdingTaxKrw: 5000,
    socialInsuranceKrw: 4000,
    otherDeductionsKrw: 1000,
    totalDeductionsKrw: 10000,
    netPayKrw: 80000,
    sourceRecordCount: 1
  });

  await memoryDataAccess.payroll.update(runOne.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-04-30T12:00:00+09:00"),
    confirmedBy: "PAY-PS-1001"
  });
  await memoryDataAccess.payroll.update(runTwo.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-04-30T12:00:00+09:00"),
    confirmedBy: "PAY-PS-1001"
  });
  assert.equal(runPreviewed.state, "PREVIEWED", "fixture previewed run should remain previewed");

  const distributionPayload = {
    periodStart: "2026-04-01T00:00:00+09:00",
    periodEnd: "2026-04-30T23:59:59+09:00",
    deliveryChannel: "in_app",
    dryRun: true
  };

  const dryRunResponse = await distributeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/payslips/distribute",
      distributionPayload,
      actorHeaders("payroll_operator", "PAY-PS-1001", organization.id)
    )
  );
  assert.equal(dryRunResponse.status, 200, "distribution dry-run should succeed");
  const dryRunBody = await readJson<{
    summary: {
      runStates: { totalRuns: number; confirmedRuns: number; previewedRuns: number };
      distribution: {
        targetCount: number;
        alreadyDistributedCount: number;
        newlyDistributedCount: number;
        targetRunIds: string[];
        alreadyDistributedRunIds: string[];
        newlyDistributedRunIds: string[];
      };
    };
  }>(dryRunResponse);
  assert.deepEqual(dryRunBody.summary.runStates, {
    totalRuns: 3,
    confirmedRuns: 2,
    previewedRuns: 1
  });
  assert.equal(dryRunBody.summary.distribution.targetCount, 2);
  assert.equal(dryRunBody.summary.distribution.alreadyDistributedCount, 0);
  assert.equal(dryRunBody.summary.distribution.newlyDistributedCount, 2);
  assert.equal(dryRunBody.summary.distribution.targetRunIds.length, 2);
  assert.equal(dryRunBody.summary.distribution.alreadyDistributedRunIds.length, 0);
  assert.equal(dryRunBody.summary.distribution.newlyDistributedRunIds.length, 2);

  const dryRunStateCheck = await memoryDataAccess.payroll.findById(runOne.id);
  assert.equal(dryRunStateCheck?.payslipDistributedAt, null, "dry-run must not mutate delivery fields");

  const applyResponse = await distributeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/payslips/distribute",
      { ...distributionPayload, dryRun: false },
      actorHeaders("payroll_operator", "PAY-PS-1001", organization.id)
    )
  );
  assert.equal(applyResponse.status, 200, "distribution apply should succeed");
  const applyBody = await readJson<{
    summary: {
      distribution: { targetCount: number; alreadyDistributedCount: number; newlyDistributedCount: number };
    };
  }>(applyResponse);
  assert.equal(applyBody.summary.distribution.targetCount, 2);
  assert.equal(applyBody.summary.distribution.alreadyDistributedCount, 0);
  assert.equal(applyBody.summary.distribution.newlyDistributedCount, 2);

  const distributedRunOne = await memoryDataAccess.payroll.findById(runOne.id);
  const distributedRunTwo = await memoryDataAccess.payroll.findById(runTwo.id);
  assert.equal(distributedRunOne?.payslipDeliveryChannel, "in_app");
  assert.ok(distributedRunOne?.payslipDistributedAt instanceof Date);
  assert.equal(distributedRunOne?.payslipDistributedBy, "PAY-PS-1001");
  assert.equal(distributedRunTwo?.payslipDeliveryChannel, "in_app");
  assert.ok(distributedRunTwo?.payslipDistributedAt instanceof Date);

  const applyAgainResponse = await distributeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/payslips/distribute",
      { ...distributionPayload, dryRun: false },
      actorHeaders("payroll_operator", "PAY-PS-1001", organization.id)
    )
  );
  assert.equal(applyAgainResponse.status, 200, "re-applying distribution should remain idempotent");
  const applyAgainBody = await readJson<{
    summary: {
      distribution: { targetCount: number; alreadyDistributedCount: number; newlyDistributedCount: number };
    };
  }>(applyAgainResponse);
  assert.equal(applyAgainBody.summary.distribution.targetCount, 2);
  assert.equal(applyAgainBody.summary.distribution.alreadyDistributedCount, 2);
  assert.equal(applyAgainBody.summary.distribution.newlyDistributedCount, 0);

  const receiptResponse = await acknowledgeRoute.POST(
    new Request(`http://localhost/api/payroll/payslips/${runOne.id}/acknowledge`, {
      method: "POST",
      headers: actorHeaders("employee", "EMP-PS-1001", organization.id)
    }),
    { params: Promise.resolve({ runId: runOne.id }) } as RouteContext<{ runId: string }>
  );
  assert.equal(receiptResponse.status, 200, "employee should confirm own receipt");
  const receiptBody = await readJson<{
    receipt: { runId: string; employeeId: string; alreadyConfirmed: boolean };
  }>(receiptResponse);
  assert.equal(receiptBody.receipt.runId, runOne.id);
  assert.equal(receiptBody.receipt.employeeId, "EMP-PS-1001");
  assert.equal(receiptBody.receipt.alreadyConfirmed, false);

  const receiptIdempotentResponse = await acknowledgeRoute.POST(
    new Request(`http://localhost/api/payroll/payslips/${runOne.id}/acknowledge`, {
      method: "POST",
      headers: actorHeaders("employee", "EMP-PS-1001", organization.id)
    }),
    { params: Promise.resolve({ runId: runOne.id }) } as RouteContext<{ runId: string }>
  );
  assert.equal(receiptIdempotentResponse.status, 200, "duplicate receipt confirmation should be idempotent");
  const receiptIdempotentBody = await readJson<{ receipt: { alreadyConfirmed: boolean } }>(receiptIdempotentResponse);
  assert.equal(receiptIdempotentBody.receipt.alreadyConfirmed, true);

  const unauthorizedReceiptResponse = await acknowledgeRoute.POST(
    new Request(`http://localhost/api/payroll/payslips/${runOne.id}/acknowledge`, {
      method: "POST",
      headers: actorHeaders("employee", "EMP-PS-1002", organization.id)
    }),
    { params: Promise.resolve({ runId: runOne.id }) } as RouteContext<{ runId: string }>
  );
  assert.equal(unauthorizedReceiptResponse.status, 403, "other employee should not confirm receipt");

  const runUndistributed = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-PS-1001",
    periodStart,
    periodEnd,
    grossPayKrw: 80000,
    sourceRecordCount: 1
  });
  await memoryDataAccess.payroll.update(runUndistributed.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-04-30T12:00:00+09:00"),
    confirmedBy: "PAY-PS-1001"
  });

  const undistributedReceiptResponse = await acknowledgeRoute.POST(
    new Request(`http://localhost/api/payroll/payslips/${runUndistributed.id}/acknowledge`, {
      method: "POST",
      headers: actorHeaders("employee", "EMP-PS-1001", organization.id)
    }),
    { params: Promise.resolve({ runId: runUndistributed.id }) } as RouteContext<{ runId: string }>
  );
  assert.equal(undistributedReceiptResponse.status, 409, "receipt confirmation should require distributed run");

  runtimeEnv.FLOWHR_PAYROLL_PAYSLIP_DELIVERY_V1 = "false";
  const flagOffDistributionResponse = await distributeRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/payslips/distribute",
      distributionPayload,
      actorHeaders("payroll_operator", "PAY-PS-1001", organization.id)
    )
  );
  assert.equal(flagOffDistributionResponse.status, 409, "distribution should be blocked when feature flag is disabled");

  const flagOffReceiptResponse = await acknowledgeRoute.POST(
    new Request(`http://localhost/api/payroll/payslips/${runTwo.id}/acknowledge`, {
      method: "POST",
      headers: actorHeaders("employee", "EMP-PS-1002", organization.id)
    }),
    { params: Promise.resolve({ runId: runTwo.id }) } as RouteContext<{ runId: string }>
  );
  assert.equal(flagOffReceiptResponse.status, 409, "receipt confirmation should be blocked when feature flag is disabled");

  const distributionPreviewLogs = await memoryDataAccess.audit.list({
    actions: ["payroll.payslip_distribution_previewed"],
    entityType: "PayrollPeriod"
  });
  const distributionApplyLogs = await memoryDataAccess.audit.list({
    actions: ["payroll.payslip_distributed"],
    entityType: "PayrollPeriod"
  });
  const receiptLogs = await memoryDataAccess.audit.list({
    actions: ["payroll.payslip_receipt_confirmed"],
    entityType: "PayrollRun"
  });

  assert.equal(distributionPreviewLogs.length, 1, "dry-run should append preview audit log");
  assert.equal(distributionApplyLogs.length, 2, "apply should append audit log for each apply call");
  assert.equal(receiptLogs.length, 1, "receipt confirmation should append audit log once");
}

run()
  .then(() => {
    console.log("e2e-wi0186-payroll-payslip-delivery-receipt-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
