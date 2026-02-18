import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "memory";
runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
runtimeEnv.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.DIRECT_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.FLOWHR_EVENT_PUBLISHER = "memory";

type JsonPayload = Record<string, unknown>;

type RouteContext<TParams extends Record<string, string>> = {
  params: Promise<TParams>;
};

type TimedStep = { label: string; ms: number };

function actorHeaders(role: string, actorId: string) {
  return {
    "content-type": "application/json",
    "x-actor-role": role,
    "x-actor-id": actorId
  };
}

function jsonRequest(
  method: string,
  requestPath: string,
  payload: JsonPayload | null,
  headers: Record<string, string>
) {
  return new Request(`http://localhost${requestPath}`, {
    method,
    headers,
    body: payload ? JSON.stringify(payload) : undefined
  });
}

function queryUrl(basePath: string, params: Record<string, string | undefined>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) {
      continue;
    }
    search.set(key, value);
  }
  const qs = search.toString();
  return `http://localhost${basePath}${qs.length > 0 ? `?${qs}` : ""}`;
}

async function readJson(response: Response) {
  return (await response.json()) as unknown;
}

function nowMs() {
  return performance.now();
}

async function timed<T>(label: string, fn: () => Promise<T>) {
  const startedAt = nowMs();
  const result = await fn();
  return { label, ms: nowMs() - startedAt, result };
}

function median(values: number[]) {
  if (values.length === 0) {
    return 0;
  }
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[mid] ?? 0;
  }
  return ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2;
}

async function runEmployeeJourney(options: {
  employeeId: string;
  from: string;
  to: string;
}) {
  const { employeeId } = options;
  const steps: TimedStep[] = [];
  const journeyStart = nowMs();

  const leaveCreate = await timed("employee.leave.create", async () => {
    const leaveRequestsRoute = await import("../../src/app/api/leave/requests/route.ts");
    return leaveRequestsRoute.POST(
      jsonRequest(
        "POST",
        "/api/leave/requests",
        {
          employeeId,
          leaveType: "ANNUAL",
          startDate: "2026-02-10T09:00:00+09:00",
          endDate: "2026-02-10T18:00:00+09:00",
          reason: "ui-journey"
        },
        actorHeaders("employee", employeeId)
      )
    );
  });
  steps.push({ label: leaveCreate.label, ms: leaveCreate.ms });
  assert.equal(leaveCreate.result.status, 201, "leave create should succeed");
  const leaveCreateBody = (await readJson(leaveCreate.result)) as {
    request?: { id?: string; state?: string };
  };
  const requestId = leaveCreateBody.request?.id ?? "";
  assert.ok(requestId, "leave request id should exist");

  const attendanceCreate = await timed("employee.attendance.create", async () => {
    const attendanceRecordsRoute = await import("../../src/app/api/attendance/records/route.ts");
    return attendanceRecordsRoute.POST(
      jsonRequest(
        "POST",
        "/api/attendance/records",
        {
          employeeId,
          checkInAt: "2026-02-11T09:00:00+09:00",
          checkOutAt: "2026-02-11T18:00:00+09:00",
          breakMinutes: 60,
          isHoliday: false,
          notes: "ui-journey"
        },
        actorHeaders("employee", employeeId)
      )
    );
  });
  steps.push({ label: attendanceCreate.label, ms: attendanceCreate.ms });
  assert.equal(attendanceCreate.result.status, 201, "attendance create should succeed");
  const attendanceCreateBody = (await readJson(attendanceCreate.result)) as {
    record?: { id?: string };
  };
  const recordId = attendanceCreateBody.record?.id ?? "";
  assert.ok(recordId, "attendance record id should exist");

  const attendanceCorrection = await timed("employee.attendance.correction", async () => {
    const attendanceRecordRoute = await import("../../src/app/api/attendance/records/[recordId]/route.ts");
    return attendanceRecordRoute.PATCH(
      jsonRequest(
        "PATCH",
        `/api/attendance/records/${recordId}`,
        {
          checkOutAt: "2026-02-11T19:00:00+09:00",
          notes: "ui-journey-correction"
        },
        actorHeaders("employee", employeeId)
      ),
      { params: Promise.resolve({ recordId }) } as RouteContext<{ recordId: string }>
    );
  });
  steps.push({ label: attendanceCorrection.label, ms: attendanceCorrection.ms });
  assert.equal(attendanceCorrection.result.status, 200, "attendance correction should succeed");

  const leaveCancel = await timed("employee.leave.cancel", async () => {
    const leaveCancelRoute = await import("../../src/app/api/leave/requests/[requestId]/cancel/route.ts");
    return leaveCancelRoute.POST(
      jsonRequest(
        "POST",
        `/api/leave/requests/${requestId}/cancel`,
        { reason: "ui-journey-cancel" },
        actorHeaders("employee", employeeId)
      ),
      { params: Promise.resolve({ requestId }) } as RouteContext<{ requestId: string }>
    );
  });
  steps.push({ label: leaveCancel.label, ms: leaveCancel.ms });
  assert.equal(leaveCancel.result.status, 200, "leave cancel should succeed");

  const journeyMs = nowMs() - journeyStart;
  return { journeyMs, steps };
}

async function runAdminJourney(options: { employeeId: string; from: string; to: string }) {
  const { employeeId, from, to } = options;
  const steps: TimedStep[] = [];
  const journeyStart = nowMs();

  const attendanceCreate = await timed("admin.seed.attendance.pending", async () => {
    const attendanceRecordsRoute = await import("../../src/app/api/attendance/records/route.ts");
    return attendanceRecordsRoute.POST(
      jsonRequest(
        "POST",
        "/api/attendance/records",
        {
          employeeId,
          checkInAt: "2026-02-12T09:00:00+09:00",
          checkOutAt: "2026-02-12T18:00:00+09:00",
          breakMinutes: 60,
          isHoliday: false
        },
        actorHeaders("employee", employeeId)
      )
    );
  });
  steps.push({ label: attendanceCreate.label, ms: attendanceCreate.ms });
  assert.equal(attendanceCreate.result.status, 201, "attendance seed should succeed");
  const attendanceCreateBody = (await readJson(attendanceCreate.result)) as {
    record?: { id?: string; state?: string };
  };
  const recordId = attendanceCreateBody.record?.id ?? "";
  assert.ok(recordId, "seeded attendance record id should exist");

  const leaveCreate = await timed("admin.seed.leave.pending", async () => {
    const leaveRequestsRoute = await import("../../src/app/api/leave/requests/route.ts");
    return leaveRequestsRoute.POST(
      jsonRequest(
        "POST",
        "/api/leave/requests",
        {
          employeeId,
          leaveType: "ANNUAL",
          startDate: "2026-02-13T09:00:00+09:00",
          endDate: "2026-02-13T18:00:00+09:00",
          reason: "ui-admin-journey"
        },
        actorHeaders("employee", employeeId)
      )
    );
  });
  steps.push({ label: leaveCreate.label, ms: leaveCreate.ms });
  assert.equal(leaveCreate.result.status, 201, "leave seed should succeed");
  const leaveCreateBody = (await readJson(leaveCreate.result)) as { request?: { id?: string } };
  const requestId = leaveCreateBody.request?.id ?? "";
  assert.ok(requestId, "seeded leave request id should exist");

  const payrollPreview = await timed("admin.seed.payroll.preview", async () => {
    const payrollPreviewRoute = await import("../../src/app/api/payroll/runs/preview/route.ts");
    return payrollPreviewRoute.POST(
      jsonRequest(
        "POST",
        "/api/payroll/runs/preview",
        {
          periodStart: from,
          periodEnd: to,
          employeeId,
          hourlyRateKrw: 12000
        },
        actorHeaders("payroll_operator", "PAY-1001")
      )
    );
  });
  steps.push({ label: payrollPreview.label, ms: payrollPreview.ms });
  assert.equal(payrollPreview.result.status, 200, "payroll preview should succeed");
  const payrollPreviewBody = (await readJson(payrollPreview.result)) as { run?: { id?: string } };
  const runId = payrollPreviewBody.run?.id ?? "";
  assert.ok(runId, "seeded payroll run id should exist");

  const queueRefresh = await timed("admin.queue.refresh", async () => {
    const attendanceRecordsRoute = await import("../../src/app/api/attendance/records/route.ts");
    const leaveRequestsRoute = await import("../../src/app/api/leave/requests/route.ts");
    const payrollRunsRoute = await import("../../src/app/api/payroll/runs/route.ts");

    const headers = actorHeaders("payroll_operator", "PAY-1001");
    const [attendanceRes, leaveRes, payrollRes] = await Promise.all([
      attendanceRecordsRoute.GET(
        new Request(
          queryUrl("/api/attendance/records", {
            from,
            to,
            employeeId,
            state: "PENDING"
          }),
          { method: "GET", headers }
        )
      ),
      leaveRequestsRoute.GET(
        new Request(
          queryUrl("/api/leave/requests", {
            from,
            to,
            employeeId,
            state: "PENDING"
          }),
          { method: "GET", headers }
        )
      ),
      payrollRunsRoute.GET(
        new Request(
          queryUrl("/api/payroll/runs", {
            from,
            to,
            employeeId,
            state: "PREVIEWED"
          }),
          { method: "GET", headers }
        )
      )
    ]);

    assert.equal(attendanceRes.status, 200, "queue attendance list should succeed");
    assert.equal(leaveRes.status, 200, "queue leave list should succeed");
    assert.equal(payrollRes.status, 200, "queue payroll list should succeed");

    const attendanceBody = (await readJson(attendanceRes)) as { records?: unknown[] };
    const leaveBody = (await readJson(leaveRes)) as { requests?: unknown[] };
    const payrollBody = (await readJson(payrollRes)) as { runs?: unknown[] };

    const pendingAttendance = attendanceBody.records?.length ?? 0;
    const pendingLeave = leaveBody.requests?.length ?? 0;
    const pendingPayroll = payrollBody.runs?.length ?? 0;

    assert.ok(pendingAttendance >= 1, "queue should have at least 1 pending attendance");
    assert.ok(pendingLeave >= 1, "queue should have at least 1 pending leave");
    assert.ok(pendingPayroll >= 1, "queue should have at least 1 previewed payroll run");
  });
  steps.push({ label: queueRefresh.label, ms: queueRefresh.ms });

  const attendanceApprove = await timed("admin.attendance.approve", async () => {
    const attendanceApproveRoute = await import(
      "../../src/app/api/attendance/records/[recordId]/approve/route.ts"
    );
    return attendanceApproveRoute.POST(
      jsonRequest("POST", `/api/attendance/records/${recordId}/approve`, null, actorHeaders("manager", "MGR-1001")),
      { params: Promise.resolve({ recordId }) } as RouteContext<{ recordId: string }>
    );
  });
  steps.push({ label: attendanceApprove.label, ms: attendanceApprove.ms });
  assert.equal(attendanceApprove.result.status, 200, "attendance approve should succeed");

  const leaveApprove = await timed("admin.leave.approve", async () => {
    const leaveApproveRoute = await import("../../src/app/api/leave/requests/[requestId]/approve/route.ts");
    return leaveApproveRoute.POST(
      jsonRequest("POST", `/api/leave/requests/${requestId}/approve`, null, actorHeaders("manager", "MGR-1001")),
      { params: Promise.resolve({ requestId }) } as RouteContext<{ requestId: string }>
    );
  });
  steps.push({ label: leaveApprove.label, ms: leaveApprove.ms });
  assert.equal(leaveApprove.result.status, 200, "leave approve should succeed");

  const payrollConfirm = await timed("admin.payroll.confirm", async () => {
    const payrollConfirmRoute = await import("../../src/app/api/payroll/runs/[runId]/confirm/route.ts");
    return payrollConfirmRoute.POST(
      jsonRequest("POST", `/api/payroll/runs/${runId}/confirm`, null, actorHeaders("payroll_operator", "PAY-1001")),
      { params: Promise.resolve({ runId }) } as RouteContext<{ runId: string }>
    );
  });
  steps.push({ label: payrollConfirm.label, ms: payrollConfirm.ms });
  assert.equal(payrollConfirm.result.status, 200, "payroll confirm should succeed");

  const journeyMs = nowMs() - journeyStart;
  return { journeyMs, steps };
}

async function run() {
  // Minimal UI regressions: ensure key pages still exist and include expected headings.
  const homeSource = fs.readFileSync(path.resolve(process.cwd(), "src", "app", "page.tsx"), "utf8");
  const employeeSource = fs.readFileSync(
    path.resolve(process.cwd(), "src", "app", "employee", "page.tsx"),
    "utf8"
  );
  assert.match(homeSource, /운영 우선순위 콘솔/, "home page should keep the command center heading");
  assert.match(employeeSource, /직원 셀프서비스/, "employee page should keep the employee portal heading");

  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const { resetRuntimeMemoryDomainEvents } = await import(
    "../../src/features/shared/runtime-domain-event-publisher.ts"
  );

  const employeeId = "EMP-1001";
  const from = "2026-02-01T00:00:00+09:00";
  const to = "2026-02-28T23:59:59+09:00";

  resetMemoryDataAccess();
  resetRuntimeMemoryDomainEvents();
  await memoryDataAccess.employees.create({ id: employeeId });

  const employeeJourney = await runEmployeeJourney({ employeeId, from, to });

  resetMemoryDataAccess();
  resetRuntimeMemoryDomainEvents();
  await memoryDataAccess.employees.create({ id: employeeId });

  const adminJourney = await runAdminJourney({ employeeId, from, to });

  const artifactDir = path.resolve(process.cwd(), ".tmp-ui-journey");
  fs.mkdirSync(artifactDir, { recursive: true });
  const artifactPath = path.join(artifactDir, "ui-journey-baseline.json");

  const employeeSeconds = employeeJourney.journeyMs / 1000;
  const adminSeconds = adminJourney.journeyMs / 1000;

  const artifact = {
    createdAt: new Date().toISOString(),
    journeys: {
      employee: {
        totalMs: Math.round(employeeJourney.journeyMs),
        steps: employeeJourney.steps.map((step) => ({ ...step, ms: Math.round(step.ms) }))
      },
      admin: {
        totalMs: Math.round(adminJourney.journeyMs),
        steps: adminJourney.steps.map((step) => ({ ...step, ms: Math.round(step.ms) }))
      }
    },
    kpi: {
      employee_journey_median_seconds: Number(median([employeeSeconds]).toFixed(3)),
      admin_journey_median_seconds: Number(median([adminSeconds]).toFixed(3))
    }
  };

  fs.writeFileSync(artifactPath, JSON.stringify(artifact, null, 2), "utf8");
  console.log(`ui-journey baseline written: ${path.relative(process.cwd(), artifactPath)}`);
  console.log(
    `ui-journey KPI: employee_median_seconds=${artifact.kpi.employee_journey_median_seconds}, admin_median_seconds=${artifact.kpi.admin_journey_median_seconds}`
  );
}

run()
  .then(() => {
    console.log("e2e-wi0083-ui-journey.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

