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

function expectClose(actual: number, expected: number, message: string) {
  assert.ok(Math.abs(actual - expected) < 0.0000001, `${message}: expected ${expected}, got ${actual}`);
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

  const payrollApiSpec = readUtf8("specs", "payroll", "api.yaml");
  const payrollContract = readUtf8("specs", "payroll", "contract.yaml");
  const payrollTestCases = readUtf8("specs", "payroll", "test-cases.md");
  assert.match(payrollApiSpec, /insurancePolicyPresetAuto/);
  assert.match(payrollContract, /insurance policy preset/i);
  assert.match(payrollTestCases, /Insurance Policy Preset Gate/);

  const organization = await memoryDataAccess.organizations.create({ name: "Org Insurance Policy Preset" });
  await memoryDataAccess.employees.create({
    id: "EMP-INS-610",
    organizationId: organization.id,
    name: "Insurance Policy Employee"
  });

  const attendanceCreateResponse = await attendanceCreateRoute.POST(
    jsonRequest(
      "POST",
      "/api/attendance/records",
      {
        employeeId: "EMP-INS-610",
        checkInAt: "2026-07-14T09:00:00+09:00",
        checkOutAt: "2026-07-14T18:00:00+09:00",
        breakMinutes: 60,
        isHoliday: false
      },
      actorHeaders("employee", "EMP-INS-610", organization.id)
    )
  );
  assert.equal(attendanceCreateResponse.status, 201);
  const attendanceCreateBody = await readJson<{ record: { id: string } }>(attendanceCreateResponse);

  const attendanceApproveResponse = await attendanceApproveRoute.POST(
    new Request(`http://localhost/api/attendance/records/${attendanceCreateBody.record.id}/approve`, {
      method: "POST",
      headers: actorHeaders("manager", "MGR-INS-610", organization.id)
    }),
    { params: Promise.resolve({ recordId: attendanceCreateBody.record.id }) } as RouteContext<{
      recordId: string;
    }>
  );
  assert.equal(attendanceApproveResponse.status, 200);

  const previewPayload = {
    periodStart: "2026-07-01T00:00:00+09:00",
    periodEnd: "2026-07-31T23:59:59+09:00",
    employeeId: "EMP-INS-610",
    hourlyRateKrw: 12000,
    settlement: {
      nonTaxableIncomeKrw: 10000,
      requireMonthlyBoundary: true,
      insurancePolicyPresetAuto: true,
      insurancePolicyAsOf: "2026-07-15T00:00:00+09:00",
      priorWithheldKrw: 0,
      priorEmployerPaidKrw: 0
    }
  };

  const previewResponse = await insuranceSettlementPreviewRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview-insurance-settlement",
      previewPayload,
      actorHeaders("payroll_operator", "PAY-INS-610", organization.id)
    )
  );
  assert.equal(previewResponse.status, 200);
  const previewBody = await readJson<{
    summary: {
      grossPayKrw: number;
      taxableBaseKrw: number;
      policyPreset: {
        id: string;
        effectiveFrom: string;
      } | null;
      policyPresetAuto: {
        enabled: boolean;
        autoSelected: boolean;
        resolvedBy: string;
        asOf: string;
      };
      policyRates: {
        nationalPensionEmployeeRate: number;
        nationalPensionEmployerRate: number;
        healthInsuranceEmployeeRate: number;
        healthInsuranceEmployerRate: number;
        longTermCareRateOnHealth: number;
        employmentInsuranceEmployeeRate: number;
        employmentInsuranceEmployerRate: number;
        industrialAccidentEmployerRate: number;
      };
      policyCapsKrw: {
        nationalPensionCapKrw: number | null;
        healthInsuranceCapKrw: number | null;
        employmentInsuranceCapKrw: number | null;
      };
      contributionBasesKrw: {
        nationalPensionBaseKrw: number;
        healthInsuranceBaseKrw: number;
        employmentInsuranceBaseKrw: number;
        industrialAccidentBaseKrw: number;
      };
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
    };
  }>(previewResponse);

  assert.equal(previewBody.summary.grossPayKrw, 96000);
  assert.equal(previewBody.summary.taxableBaseKrw, 86000);
  assert.equal(previewBody.summary.policyPreset?.id, "kr_insurance_policy_v2026_07");
  assert.equal(previewBody.summary.policyPreset?.effectiveFrom, "2026-07-01");
  assert.deepEqual(previewBody.summary.policyPresetAuto, {
    enabled: true,
    autoSelected: true,
    resolvedBy: "settlement.insurancePolicyAsOf",
    asOf: new Date("2026-07-15T00:00:00+09:00").toISOString()
  });
  expectClose(previewBody.summary.policyRates.healthInsuranceEmployeeRate, 0.0362, "policy HI rate");
  expectClose(previewBody.summary.policyRates.longTermCareRateOnHealth, 0.132, "policy LTC rate");
  expectClose(
    previewBody.summary.policyRates.employmentInsuranceEmployerRate,
    0.012,
    "policy EI employer rate"
  );
  assert.deepEqual(previewBody.summary.policyCapsKrw, {
    nationalPensionCapKrw: 90000,
    healthInsuranceCapKrw: 80000,
    employmentInsuranceCapKrw: 75000
  });
  assert.deepEqual(previewBody.summary.contributionBasesKrw, {
    nationalPensionBaseKrw: 86000,
    healthInsuranceBaseKrw: 80000,
    employmentInsuranceBaseKrw: 75000,
    industrialAccidentBaseKrw: 86000
  });
  assert.deepEqual(previewBody.summary.employeeContributionKrw, {
    nationalPensionKrw: 3870,
    healthInsuranceKrw: 2896,
    longTermCareKrw: 382,
    employmentInsuranceKrw: 713,
    totalKrw: 7861
  });
  assert.deepEqual(previewBody.summary.employerContributionKrw, {
    nationalPensionKrw: 3870,
    healthInsuranceKrw: 2896,
    longTermCareKrw: 382,
    employmentInsuranceKrw: 900,
    industrialAccidentKrw: 1333,
    totalKrw: 9381
  });

  const replayResponse = await insuranceSettlementPreviewRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview-insurance-settlement",
      previewPayload,
      actorHeaders("payroll_operator", "PAY-INS-610", organization.id)
    )
  );
  assert.equal(replayResponse.status, 200);
  const replayBody = await readJson<typeof previewBody>(replayResponse);
  assert.deepEqual(replayBody, previewBody);

  const overrideResponse = await insuranceSettlementPreviewRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview-insurance-settlement",
      {
        ...previewPayload,
        settlement: {
          ...previewPayload.settlement,
          employmentInsuranceEmployerRate: 0.013
        }
      },
      actorHeaders("payroll_operator", "PAY-INS-610", organization.id)
    )
  );
  assert.equal(overrideResponse.status, 200);
  const overrideBody = await readJson<typeof previewBody>(overrideResponse);
  expectClose(
    overrideBody.summary.policyRates.employmentInsuranceEmployerRate,
    0.013,
    "manual employer EI override"
  );
  assert.equal(
    overrideBody.summary.employerContributionKrw.employmentInsuranceKrw,
    975,
    "manual employer EI override should affect contribution"
  );

  const invalidAsOfResponse = await insuranceSettlementPreviewRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview-insurance-settlement",
      {
        ...previewPayload,
        settlement: {
          ...previewPayload.settlement,
          insurancePolicyPresetAuto: false,
          insurancePolicyAsOf: "2026-07-15T00:00:00+09:00"
        }
      },
      actorHeaders("payroll_operator", "PAY-INS-610", organization.id)
    )
  );
  assert.equal(invalidAsOfResponse.status, 400);

  const unknownPresetResponse = await insuranceSettlementPreviewRoute.POST(
    jsonRequest(
      "POST",
      "/api/payroll/runs/preview-insurance-settlement",
      {
        ...previewPayload,
        settlement: {
          ...previewPayload.settlement,
          insurancePolicyPresetAuto: false,
          insurancePolicyAsOf: undefined,
          insurancePolicyPresetId: "kr_insurance_policy_unknown"
        }
      },
      actorHeaders("payroll_operator", "PAY-INS-610", organization.id)
    )
  );
  assert.equal(unknownPresetResponse.status, 400);

  const settlementAuditLogs = await memoryDataAccess.audit.list({
    actions: ["payroll.insurance_settlement_previewed"],
    entityType: "PayrollRun"
  });
  assert.ok(settlementAuditLogs.length >= 3);
  assert.ok(
    settlementAuditLogs.some(
      (log) => (log.payload as { insurancePolicyPreset?: { id?: string } })?.insurancePolicyPreset?.id === "kr_insurance_policy_v2026_07"
    ),
    "audit logs should include resolved insurance policy preset trace"
  );
}

run()
  .then(() => {
    console.log("e2e-wi0610-payroll-insurance-policy-preset-auto-precision.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
