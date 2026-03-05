import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "memory";
runtimeEnv.NEXT_PUBLIC_SUPABASE_URL ??= "https://example.supabase.co";
runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY ??= "test-anon-key";
runtimeEnv.SUPABASE_SERVICE_ROLE_KEY ??= "test-service-role-key";
runtimeEnv.DATABASE_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";
runtimeEnv.DIRECT_URL ??= "postgresql://postgres:postgres@localhost:5432/postgres";

type JsonPayload = Record<string, unknown>;

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

function actorHeaders(role: string, actorId: string, organizationId: string) {
  return {
    "content-type": "application/json",
    "x-actor-role": role,
    "x-actor-id": actorId,
    "x-actor-organization-id": organizationId
  };
}

function jsonRequest(method: string, path: string, payload: JsonPayload, headers: Record<string, string>) {
  return new Request(`http://localhost${path}`, {
    method,
    headers,
    body: JSON.stringify(payload)
  });
}

async function readJson<T>(response: Response) {
  return (await response.json()) as T;
}

async function run() {
  const pageSource = readUtf8("src", "app", "admin", "settings", "page.tsx");
  assert.match(pageSource, /조직 설정 관리자/);
  assert.match(pageSource, /회계연도 시작월/);
  assert.match(pageSource, /표준 근무시간\(일\)/);
  assert.match(pageSource, /초과근무 기준\(시간\)/);
  assert.match(pageSource, /급여 주기/);
  assert.match(pageSource, /타임존/);
  assert.match(pageSource, /통화 코드/);
  assert.match(pageSource, /\/api\/admin\/settings/);
  assert.match(pageSource, /method: "GET"/);
  assert.match(pageSource, /method: "PATCH"/);

  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );
  const route = await import("../../src/app/api/admin/settings/route.ts");

  resetMemoryDataAccess();

  const organization = await memoryDataAccess.organizations.create({ name: "WI-0961 Org" });
  const adminHeaders = actorHeaders("admin", "ADM-WI0961-1001", organization.id);

  const getBeforePatchResponse = await route.GET(
    new Request("http://localhost/api/admin/settings", {
      method: "GET",
      headers: adminHeaders
    })
  );
  assert.equal(getBeforePatchResponse.status, 200, "admin should read org settings");

  const patchResponse = await route.PATCH(
    jsonRequest(
      "PATCH",
      "/api/admin/settings",
      {
        fiscalYearStartMonth: 4,
        standardWorkHoursPerDay: 7.5,
        standardWorkDaysPerWeek: 5,
        overtimeThresholdHours: 10,
        payPeriod: "BIWEEKLY",
        timezone: "Asia/Seoul",
        currency: "usd"
      },
      adminHeaders
    )
  );
  assert.equal(patchResponse.status, 200, "valid patch should return 200");

  const patchBody = await readJson<{
    fiscalYearStartMonth: number;
    standardWorkHoursPerDay: number;
    standardWorkDaysPerWeek: number;
    overtimeThresholdHours: number;
    payPeriod: "MONTHLY" | "BIWEEKLY";
    timezone: string | null;
    currency: string;
  }>(patchResponse);

  assert.equal(patchBody.fiscalYearStartMonth, 4);
  assert.equal(patchBody.standardWorkHoursPerDay, 7.5);
  assert.equal(patchBody.standardWorkDaysPerWeek, 5);
  assert.equal(patchBody.overtimeThresholdHours, 10);
  assert.equal(patchBody.payPeriod, "BIWEEKLY");
  assert.equal(patchBody.timezone, "Asia/Seoul");
  assert.equal(patchBody.currency, "USD");
}

run()
  .then(() => {
    console.log("e2e-wi0961-org-settings-ui.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
