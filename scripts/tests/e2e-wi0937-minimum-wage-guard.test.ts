import assert from "node:assert/strict";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "memory";
runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
runtimeEnv.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.DIRECT_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";

type RouteContext<TParams extends Record<string, string>> = {
  params: Promise<TParams>;
};

type JsonPayload = Record<string, unknown>;

function actorHeaders(role: string, actorId: string, organizationId: string) {
  return {
    "content-type": "application/json",
    "x-actor-role": role,
    "x-actor-id": actorId,
    "x-actor-organization-id": organizationId
  };
}

function jsonRequest(path: string, payload: JsonPayload, headers: Record<string, string>) {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload)
  });
}

async function readJson<T>(response: Response) {
  return (await response.json()) as T;
}

async function run() {
  const { memoryDataAccess, resetMemoryDataAccess, getMemoryAuditEntries } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const payrollPreviewRoute = await import("../../src/app/api/payroll/runs/preview/route.ts");
  const payrollConfirmRoute = await import(
    "../../src/app/api/payroll/runs/[runId]/confirm/route.ts"
  );
  const minimumWageRoute = await import(
    "../../src/app/api/admin/payroll/minimum-wage/route.ts"
  );

  resetMemoryDataAccess();

  const organization = await memoryDataAccess.organizations.create({
    name: "WI-0937 Minimum Wage Org"
  });
  await memoryDataAccess.organizations.update(organization.id, {
    workHoursPerDay: 1,
    workDays: [1]
  });

  const employeeId = "EMP-WI0937-1001";
  await memoryDataAccess.employees.create({
    id: employeeId,
    organizationId: organization.id
  });

  const attendance = await memoryDataAccess.attendance.create({
    employeeId,
    checkInAt: new Date("2026-02-02T09:00:00+09:00"),
    checkOutAt: new Date("2026-02-02T17:00:00+09:00"),
    breakMinutes: 0,
    isHoliday: false
  });
  await memoryDataAccess.attendance.update(attendance.id, {
    state: "APPROVED",
    approvedAt: new Date("2026-02-02T18:00:00+09:00"),
    approvedBy: "MGR-WI0937-1001"
  });

  const payrollHeaders = actorHeaders("payroll_operator", "PAY-WI0937-1001", organization.id);
  const adminHeaders = actorHeaders("admin", "ADMIN-WI0937-1001", organization.id);

  const lowPreviewResponse = await payrollPreviewRoute.POST(
    jsonRequest(
      "/api/payroll/runs/preview",
      {
        periodStart: "2026-02-01T00:00:00+09:00",
        periodEnd: "2026-02-28T23:59:59+09:00",
        employeeId,
        hourlyRateKrw: 2500
      },
      payrollHeaders
    )
  );
  assert.equal(lowPreviewResponse.status, 200, "below-minimum preview should succeed");
  const lowPreviewBody = await readJson<{
    run: { id: string };
    warnings: Array<{
      employeeId: string;
      type: "BELOW_MINIMUM_WAGE";
      effectiveRate: number;
      minimumRate: number;
    }>;
  }>(lowPreviewResponse);
  assert.equal(lowPreviewBody.warnings.length, 1, "below-minimum preview should emit warning");
  assert.equal(lowPreviewBody.warnings[0]?.employeeId, employeeId);
  assert.equal(lowPreviewBody.warnings[0]?.type, "BELOW_MINIMUM_WAGE");
  assert.equal(lowPreviewBody.warnings[0]?.minimumRate, 10630);
  assert.ok(
    (lowPreviewBody.warnings[0]?.effectiveRate ?? Number.POSITIVE_INFINITY) < 10630,
    "effective rate should be below minimum wage"
  );

  const blockedConfirmResponse = await payrollConfirmRoute.POST(
    new Request(`http://localhost/api/payroll/runs/${lowPreviewBody.run.id}/confirm`, {
      method: "POST",
      headers: payrollHeaders
    }),
    {
      params: Promise.resolve({ runId: lowPreviewBody.run.id })
    } as RouteContext<{ runId: string }>
  );
  assert.equal(blockedConfirmResponse.status, 400, "confirm should require warning acknowledgment");
  const blockedConfirmBody = await readJson<{
    error: string;
    details?: {
      warnings?: Array<{
        employeeId: string;
        type: "BELOW_MINIMUM_WAGE";
      }>;
    };
  }>(blockedConfirmResponse);
  assert.equal(blockedConfirmBody.error, "minimum wage warning must be acknowledged");
  assert.equal(blockedConfirmBody.details?.warnings?.[0]?.type, "BELOW_MINIMUM_WAGE");

  const confirmedWithAckResponse = await payrollConfirmRoute.POST(
    new Request(
      `http://localhost/api/payroll/runs/${lowPreviewBody.run.id}/confirm?acknowledgeMinWageWarning=true`,
      {
        method: "POST",
        headers: payrollHeaders
      }
    ),
    {
      params: Promise.resolve({ runId: lowPreviewBody.run.id })
    } as RouteContext<{ runId: string }>
  );
  assert.equal(confirmedWithAckResponse.status, 200, "confirm with acknowledgement should succeed");
  const confirmedWithAckBody = await readJson<{ run: { state: string } }>(confirmedWithAckResponse);
  assert.equal(confirmedWithAckBody.run.state, "CONFIRMED");

  const minimumWageAudit = getMemoryAuditEntries().find(
    (entry) =>
      entry.action === "payroll.minimum_wage_warning_acknowledged" &&
      entry.entityId === lowPreviewBody.run.id
  );
  assert.ok(minimumWageAudit, "warning acknowledgement should append audit log");

  const highPreviewResponse = await payrollPreviewRoute.POST(
    jsonRequest(
      "/api/payroll/runs/preview",
      {
        periodStart: "2026-02-01T00:00:00+09:00",
        periodEnd: "2026-02-28T23:59:59+09:00",
        employeeId,
        hourlyRateKrw: 12000
      },
      payrollHeaders
    )
  );
  assert.equal(highPreviewResponse.status, 200, "above-minimum preview should succeed");
  const highPreviewBody = await readJson<{
    warnings: Array<{
      employeeId: string;
      type: "BELOW_MINIMUM_WAGE";
    }>;
  }>(highPreviewResponse);
  assert.equal(highPreviewBody.warnings.length, 0, "above-minimum preview should not emit warning");

  const minimumWageResponse = await minimumWageRoute.GET(
    new Request("http://localhost/api/admin/payroll/minimum-wage", {
      method: "GET",
      headers: adminHeaders
    })
  );
  assert.equal(minimumWageResponse.status, 200, "admin should read minimum wage policy");
  const minimumWageBody = await readJson<{
    hourlyRate: number;
    effectiveDate: string;
    currency: string;
  }>(minimumWageResponse);
  assert.equal(minimumWageBody.hourlyRate, 10630);
  assert.equal(minimumWageBody.effectiveDate, "2026-01-01");
  assert.equal(minimumWageBody.currency, "KRW");
}

run()
  .then(() => {
    console.log("e2e-wi0937-minimum-wage-guard.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
