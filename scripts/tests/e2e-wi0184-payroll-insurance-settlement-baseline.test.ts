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
  const attendanceCreateRoute = await import("../../src/app/api/attendance/records/route.ts");
  const attendanceApproveRoute = await import(
    "../../src/app/api/attendance/records/[recordId]/approve/route.ts"
  );
  const insuranceSettlementPreviewRoute = await import(
    "../../src/app/api/payroll/runs/preview-insurance-settlement/route.ts"
  );

  resetMemoryDataAccess();
  runtimeEnv.FLOWHR_PAYROLL_KR_INSURANCE_SETTLEMENT_V1 = "true";

  const adminLayoutSource = readUtf8("src", "app", "admin", "layout.tsx");
  const payrollInsurancePageSource = readUtf8("src", "app", "admin", "payroll-insurance", "page.tsx");
  const payrollInsuranceConsoleSource = readUtf8(
    "src",
    "components",
    "payroll-insurance",
    "PayrollInsuranceSettlementConsole.tsx"
  );
  const payrollApiSpec = readUtf8("specs", "payroll", "api.yaml");
  const payrollContract = readUtf8("specs", "payroll", "contract.yaml");

  assert.match(
    adminLayoutSource,
    /\/admin\/payroll-insurance/,
    "admin navigation should include payroll insurance route"
  );
  assert.match(
    payrollInsurancePageSource,
    /PayrollInsuranceSettlementConsole/,
    "payroll insurance page should render dedicated console"
  );
  assert.match(
    payrollInsuranceConsoleSource,
    /Payroll Insurance Settlement/,
    "payroll insurance console should include heading text"
  );
  assert.match(
    payrollApiSpec,
    /\/payroll\/runs\/preview-insurance-settlement:/,
    "payroll api spec should document preview-insurance-settlement endpoint"
  );
  assert.match(
    payrollContract,
    /path: \/payroll\/runs\/preview-insurance-settlement/,
    "payroll contract should include preview-insurance-settlement endpoint"
  );
  assert.match(
    payrollContract,
    /version: \d+\.\d+\.\d+/,
    "payroll contract version should remain semver-formatted"
  );

  const organization = await memoryDataAccess.organizations.create({ name: "Org Payroll Insurance" });
  await memoryDataAccess.employees.create({
    id: "EMP-INS-1001",
    organizationId: organization.id,
    name: "Insurance Employee"
  });

  const attendanceCreateResponse = await attendanceCreateRoute.POST(
    jsonRequest(
      "POST",
      "/api/attendance/records",
      {
        employeeId: "EMP-INS-1001",
        checkInAt: "2026-02-14T09:00:00+09:00",
        checkOutAt: "2026-02-14T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      actorHeaders("employee", "EMP-INS-1001", organization.id)
    )
  );
  assert.equal(attendanceCreateResponse.status, 201, "attendance record should be created");
  const attendanceCreateBody = await readJson<{ record: { id: string } }>(attendanceCreateResponse);

  const attendanceApproveResponse = await attendanceApproveRoute.POST(
    new Request(`http://localhost/api/attendance/records/${attendanceCreateBody.record.id}/approve`, {
      method: "POST",
      headers: actorHeaders("manager", "MGR-INS-1001", organization.id)
    }),
    { params: Promise.resolve({ recordId: attendanceCreateBody.record.id }) } as RouteContext<{
      recordId: string;
    }>
  );
  assert.equal(attendanceApproveResponse.status, 200, "attendance record should be approved");

  const previewPayload = {
    periodStart: "2026-02-01T00:00:00+09:00",
    periodEnd: "2026-02-28T23:59:59+09:00",
    employeeId: "EMP-INS-1001",
    hourlyRateKrw: 12000,
    settlement: {
      nonTaxableIncomeKrw: 10000,
      requireMonthlyBoundary: true,
      nationalPensionCapKrw: 60000,
      healthInsuranceCapKrw: 50000,
      employmentInsuranceCapKrw: 40000,
      priorWithheldKrw: 4000,
      priorEmployerPaidKrw: 7000
    }
  };

  const previewResponse = await insuranceSettlementPreviewRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview-insurance-settlement",
      previewPayload,
      actorHeaders("payroll_operator", "PAY-INS-1001", organization.id)
    )
  );
  assert.equal(previewResponse.status, 200, "insurance settlement preview should succeed");
  const previewBody = await readJson<{
    summary: {
      sourceRecordCount: number;
      grossPayKrw: number;
      taxableBaseKrw: number;
      employeeContributionKrw: {
        nationalPensionKrw: number;
        healthInsuranceKrw: number;
        longTermCareKrw: number;
        employmentInsuranceKrw: number;
        totalKrw: number;
      };
      employerContributionKrw: {
        nationalPensionKrw: number;
        healthInsuranceKrw: number;
        longTermCareKrw: number;
        employmentInsuranceKrw: number;
        industrialAccidentKrw: number;
        totalKrw: number;
      };
      contributionBasesKrw: {
        nationalPensionBaseKrw: number;
        healthInsuranceBaseKrw: number;
        employmentInsuranceBaseKrw: number;
        industrialAccidentBaseKrw: number;
      };
      settlementKrw: {
        priorWithheldKrw: number;
        priorEmployerPaidKrw: number;
        employeeDeltaKrw: number;
        employerDeltaKrw: number;
        totalDeltaKrw: number;
      };
    };
  }>(previewResponse);

  assert.equal(previewBody.summary.sourceRecordCount, 1, "summary should include one approved attendance record");
  assert.equal(previewBody.summary.grossPayKrw, 96000, "gross pay should be derived from approved attendance");
  assert.equal(previewBody.summary.taxableBaseKrw, 86000, "taxable base should subtract non-taxable income");
  assert.deepEqual(previewBody.summary.employeeContributionKrw, {
    nationalPensionKrw: 2700,
    healthInsuranceKrw: 1773,
    longTermCareKrw: 230,
    employmentInsuranceKrw: 360,
    totalKrw: 5063
  });
  assert.deepEqual(previewBody.summary.employerContributionKrw, {
    nationalPensionKrw: 2700,
    healthInsuranceKrw: 1773,
    longTermCareKrw: 230,
    employmentInsuranceKrw: 460,
    industrialAccidentKrw: 1290,
    totalKrw: 6453
  });
  assert.deepEqual(previewBody.summary.contributionBasesKrw, {
    nationalPensionBaseKrw: 60000,
    healthInsuranceBaseKrw: 50000,
    employmentInsuranceBaseKrw: 40000,
    industrialAccidentBaseKrw: 86000
  });
  assert.deepEqual(previewBody.summary.settlementKrw, {
    priorWithheldKrw: 4000,
    priorEmployerPaidKrw: 7000,
    employeeDeltaKrw: 1063,
    employerDeltaKrw: -547,
    totalDeltaKrw: 516
  });

  const settlementAuditLogs = await memoryDataAccess.audit.list({
    actions: ["payroll.insurance_settlement_previewed"],
    entityType: "PayrollRun"
  });
  assert.equal(settlementAuditLogs.length, 1, "successful preview should append audit log");
  assert.equal(
    settlementAuditLogs[0]?.organizationId,
    organization.id,
    "audit log should preserve organization scope"
  );

  const unauthorizedResponse = await insuranceSettlementPreviewRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview-insurance-settlement",
      previewPayload,
      actorHeaders("employee", "EMP-INS-1001", organization.id)
    )
  );
  assert.equal(unauthorizedResponse.status, 403, "employee role should be blocked from settlement preview");

  runtimeEnv.FLOWHR_PAYROLL_KR_INSURANCE_SETTLEMENT_V1 = "false";
  const flagDisabledResponse = await insuranceSettlementPreviewRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview-insurance-settlement",
      previewPayload,
      actorHeaders("payroll_operator", "PAY-INS-1001", organization.id)
    )
  );
  assert.equal(flagDisabledResponse.status, 409, "feature flag off should block settlement preview");

  runtimeEnv.FLOWHR_PAYROLL_KR_INSURANCE_SETTLEMENT_V1 = "true";
  const invalidBoundaryResponse = await insuranceSettlementPreviewRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview-insurance-settlement",
      {
        ...previewPayload,
        periodStart: "2026-02-02T00:00:00+09:00",
        periodEnd: "2026-02-28T23:59:59+09:00",
        settlement: {
          ...previewPayload.settlement,
          requireMonthlyBoundary: true
        }
      },
      actorHeaders("payroll_operator", "PAY-INS-1001", organization.id)
    )
  );
  assert.equal(
    invalidBoundaryResponse.status,
    400,
    "monthly-boundary validation should reject non-monthly period"
  );
}

run()
  .then(() => {
    console.log("e2e-wi0184-payroll-insurance-settlement-baseline.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
