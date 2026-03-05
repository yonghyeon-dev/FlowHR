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
  const closePeriodRoute = await import("../../src/app/api/payroll/runs/close-period/route.ts");

  resetMemoryDataAccess();
  runtimeEnv.FLOWHR_PAYROLL_CLOSE_PERIOD_V1 = "true";

  const adminLayoutSource = readUtf8("src", "app", "admin", "layout.tsx");
  const payrollClosePageSource = readUtf8("src", "app", "admin", "payroll-close", "page.tsx");
  const payrollCloseConsoleSource = readUtf8(
    "src",
    "components",
    "payroll-close",
    "PayrollClosePeriodConsole.tsx"
  );
  const payrollCloseCopySource = readUtf8("src", "components", "payroll-close", "copy.ts");
  const payrollApiSpec = readUtf8("specs", "payroll", "api.yaml");
  const payrollContract = readUtf8("specs", "payroll", "contract.yaml");

  assert.match(adminLayoutSource, /\/admin\/payroll-close/, "admin nav should include payroll close route");
  assert.match(
    payrollClosePageSource,
    /PayrollClosePeriodConsole/,
    "payroll close page should render dedicated console"
  );
  assert.match(
    payrollCloseConsoleSource,
    /copy\.title/,
    "payroll close console should render locale heading text via copy bundle"
  );
  assert.match(
    payrollCloseCopySource,
    /title: "Payroll Close Period"/,
    "payroll close copy should preserve default English heading"
  );
  assert.match(payrollApiSpec, /\/payroll\/runs\/close-period:/, "payroll api spec should include close-period endpoint");
  assert.match(payrollContract, /path: \/payroll\/runs\/close-period/, "payroll contract should include close-period endpoint");
  assert.match(
    payrollContract,
    /version: \d+\.\d+\.\d+/,
    "payroll contract version should remain semver-formatted"
  );

  const organization = await memoryDataAccess.organizations.create({ name: "Org Payroll Close" });
  await memoryDataAccess.employees.create({
    id: "EMP-CLOSE-1001",
    organizationId: organization.id,
    name: "Close Employee 1"
  });
  await memoryDataAccess.employees.create({
    id: "EMP-CLOSE-1002",
    organizationId: organization.id,
    name: "Close Employee 2"
  });

  const periodStart = new Date("2026-03-01T00:00:00+09:00");
  const periodEnd = new Date("2026-03-31T23:59:59+09:00");

  const confirmedRun = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-CLOSE-1001",
    periodStart,
    periodEnd,
    grossPayKrw: 100000,
    withholdingTaxKrw: 7000,
    socialInsuranceKrw: 5000,
    otherDeductionsKrw: 1000,
    totalDeductionsKrw: 13000,
    netPayKrw: 87000,
    deductionBreakdown: {
      mode: "statutory_kr_baseline",
      additional: {
        components: {
          incomeTaxKrw: 6364,
          localIncomeTaxKrw: 636,
          nationalPensionKrw: 2000,
          healthInsuranceKrw: 1600,
          longTermCareKrw: 200,
          employmentInsuranceKrw: 800,
          workersCompensationKrw: 400
        },
        insuranceBreakdown: {
          nps: 2000,
          nhi: 1600,
          ei: 800,
          wci: 400
        }
      }
    },
    sourceRecordCount: 1
  });
  await memoryDataAccess.payroll.update(confirmedRun.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-03-31T12:00:00+09:00"),
    confirmedBy: "PAY-CLOSE-1001"
  });

  const previewedRun = await memoryDataAccess.payroll.create({
    organizationId: organization.id,
    employeeId: "EMP-CLOSE-1002",
    periodStart,
    periodEnd,
    grossPayKrw: 90000,
    withholdingTaxKrw: 6000,
    socialInsuranceKrw: 4500,
    otherDeductionsKrw: 500,
    totalDeductionsKrw: 11000,
    netPayKrw: 79000,
    deductionBreakdown: {
      mode: "statutory_kr_baseline",
      additional: {
        components: {
          incomeTaxKrw: 5455,
          localIncomeTaxKrw: 545,
          nationalPensionKrw: 1800,
          healthInsuranceKrw: 1400,
          longTermCareKrw: 150,
          employmentInsuranceKrw: 700,
          workersCompensationKrw: 450
        },
        insuranceBreakdown: {
          nps: 1800,
          nhi: 1400,
          ei: 700,
          wci: 450
        }
      }
    },
    sourceRecordCount: 1
  });

  const payload = {
    periodStart: "2026-03-01T00:00:00+09:00",
    periodEnd: "2026-03-31T23:59:59+09:00",
    apply: false,
    settlement: {
      priorPaidWithholdingTaxKrw: 6000,
      priorPaidSocialInsuranceKrw: 4000,
      priorPaidNetPayKrw: 85000
    }
  };

  const previewResponse = await closePeriodRoute.POST(
    jsonRequest("POST", "/api/payroll/runs/close-period", payload, actorHeaders("payroll_operator", "PAY-CLOSE-1001", organization.id))
  );
  assert.equal(previewResponse.status, 200, "close-period preview should succeed");
  const previewBody = await readJson<{
    summary: {
      canClose: boolean;
      runStates: {
        totalRuns: number;
        confirmedRuns: number;
        previewedRuns: number;
        blockingRunIds: string[];
        blockingReasons: string[];
      };
      totalsKrw: {
        grossPayKrw: number;
        withholdingTaxKrw: number;
        withholdingBreakdownKrw: {
          incomeTaxKrw: number;
          residentTaxKrw: number;
        };
        socialInsuranceKrw: number;
        socialInsuranceBreakdownKrw: {
          nationalPensionKrw: number;
          healthInsuranceKrw: number;
          employmentInsuranceKrw: number;
          industrialAccidentKrw: number;
        };
        otherDeductionsKrw: number;
        totalDeductionsKrw: number;
        netPayKrw: number;
      };
      settlementKrw: {
        withholdingTaxDeltaKrw: number;
        socialInsuranceDeltaKrw: number;
        netPayDeltaKrw: number;
        remittanceDeltaKrw: number;
      };
    };
  }>(previewResponse);

  assert.equal(previewBody.summary.canClose, false, "preview should block close when previewed runs remain");
  assert.deepEqual(previewBody.summary.runStates, {
    totalRuns: 2,
    confirmedRuns: 1,
    previewedRuns: 1,
    blockingRunIds: [previewedRun.id],
    blockingReasons: ["all payroll runs must be confirmed before period close"]
  });
  assert.deepEqual(previewBody.summary.totalsKrw, {
    grossPayKrw: 100000,
    withholdingTaxKrw: 7000,
    withholdingBreakdownKrw: {
      incomeTaxKrw: 6364,
      residentTaxKrw: 636
    },
    socialInsuranceKrw: 5000,
    socialInsuranceBreakdownKrw: {
      nationalPensionKrw: 2000,
      healthInsuranceKrw: 1800,
      employmentInsuranceKrw: 800,
      industrialAccidentKrw: 400
    },
    otherDeductionsKrw: 1000,
    totalDeductionsKrw: 13000,
    netPayKrw: 87000
  });
  assert.deepEqual(previewBody.summary.settlementKrw, {
    priorPaidWithholdingTaxKrw: 6000,
    priorPaidSocialInsuranceKrw: 4000,
    priorPaidNetPayKrw: 85000,
    withholdingTaxDeltaKrw: 1000,
    socialInsuranceDeltaKrw: 1000,
    netPayDeltaKrw: 2000,
    remittanceDeltaKrw: 2000
  });

  const applyBlockedResponse = await closePeriodRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/close-period",
      { ...payload, apply: true },
      actorHeaders("payroll_operator", "PAY-CLOSE-1001", organization.id)
    )
  );
  assert.equal(applyBlockedResponse.status, 409, "apply should be blocked when previewed runs remain");

  await memoryDataAccess.payroll.update(previewedRun.id, {
    state: "CONFIRMED",
    confirmedAt: new Date("2026-03-31T12:30:00+09:00"),
    confirmedBy: "PAY-CLOSE-1001"
  });

  const applyResponse = await closePeriodRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/close-period",
      { ...payload, apply: true },
      actorHeaders("payroll_operator", "PAY-CLOSE-1001", organization.id)
    )
  );
  assert.equal(applyResponse.status, 200, "close-period apply should succeed when all runs are confirmed");
  const applyBody = await readJson<{
    summary: {
      canClose: boolean;
      runStates: {
        totalRuns: number;
        confirmedRuns: number;
        previewedRuns: number;
        blockingRunIds: string[];
        blockingReasons: string[];
      };
      totalsKrw: {
        grossPayKrw: number;
        withholdingTaxKrw: number;
        withholdingBreakdownKrw: {
          incomeTaxKrw: number;
          residentTaxKrw: number;
        };
        socialInsuranceKrw: number;
        socialInsuranceBreakdownKrw: {
          nationalPensionKrw: number;
          healthInsuranceKrw: number;
          employmentInsuranceKrw: number;
          industrialAccidentKrw: number;
        };
        netPayKrw: number;
      };
      settlementKrw: { withholdingTaxDeltaKrw: number; socialInsuranceDeltaKrw: number; remittanceDeltaKrw: number };
    };
  }>(applyResponse);
  assert.equal(applyBody.summary.canClose, true, "apply summary should be closable");
  assert.deepEqual(applyBody.summary.runStates, {
    totalRuns: 2,
    confirmedRuns: 2,
    previewedRuns: 0,
    blockingRunIds: [],
    blockingReasons: []
  });
  assert.equal(applyBody.summary.totalsKrw.grossPayKrw, 190000);
  assert.equal(applyBody.summary.totalsKrw.withholdingTaxKrw, 13000);
  assert.deepEqual(applyBody.summary.totalsKrw.withholdingBreakdownKrw, {
    incomeTaxKrw: 11819,
    residentTaxKrw: 1181
  });
  assert.equal(applyBody.summary.totalsKrw.socialInsuranceKrw, 9500);
  assert.deepEqual(applyBody.summary.totalsKrw.socialInsuranceBreakdownKrw, {
    nationalPensionKrw: 3800,
    healthInsuranceKrw: 3350,
    employmentInsuranceKrw: 1500,
    industrialAccidentKrw: 850
  });
  assert.equal(applyBody.summary.totalsKrw.netPayKrw, 166000);
  assert.equal(applyBody.summary.settlementKrw.withholdingTaxDeltaKrw, 7000);
  assert.equal(applyBody.summary.settlementKrw.socialInsuranceDeltaKrw, 5500);
  assert.equal(applyBody.summary.settlementKrw.remittanceDeltaKrw, 12500);

  const unauthorizedResponse = await closePeriodRoute.POST(
    jsonRequest("POST", "/api/payroll/runs/close-period", payload, actorHeaders("employee", "EMP-CLOSE-1001", organization.id))
  );
  assert.equal(unauthorizedResponse.status, 403, "employee role should not run close-period workflow");

  runtimeEnv.FLOWHR_PAYROLL_CLOSE_PERIOD_V1 = "false";
  const flagDisabledResponse = await closePeriodRoute.POST(
    jsonRequest("POST", "/api/payroll/runs/close-period", payload, actorHeaders("payroll_operator", "PAY-CLOSE-1001", organization.id))
  );
  assert.equal(flagDisabledResponse.status, 409, "close-period should be blocked when feature flag is disabled");

  const closePreviewLogs = await memoryDataAccess.audit.list({
    actions: ["payroll.period_close_previewed"],
    entityType: "PayrollPeriod"
  });
  const closeAppliedLogs = await memoryDataAccess.audit.list({
    actions: ["payroll.period_closed"],
    entityType: "PayrollPeriod"
  });
  assert.equal(closePreviewLogs.length, 1, "preview should append payroll.period_close_previewed audit log");
  assert.equal(closeAppliedLogs.length, 1, "successful apply should append payroll.period_closed audit log");
}

run()
  .then(() => {
    console.log("e2e-wi0185-payroll-withholding-close-period-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
