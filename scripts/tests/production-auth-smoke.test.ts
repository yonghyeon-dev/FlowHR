import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    throw new Error(`missing required env: ${name}`);
  }
  return value.trim();
}

async function readResponseBody(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

async function run() {
  const baseUrl = requireEnv("SMOKE_BASE_URL").replace(/\/+$/, "");
  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  requireEnv("DATABASE_URL");
  requireEnv("DIRECT_URL");

  const prisma = new PrismaClient();
  const admin = createClient(supabaseUrl, serviceRoleKey);
  const client = createClient(supabaseUrl, anonKey);

  const suffix = `${Date.now()}`;
  const email = `prod-smoke-${suffix}@flowhr.local`;
  const password = "Flowhr!12345";
  const employeeId = `PROD-SMOKE-EMP-${suffix}`;

  let createdUserId: string | null = null;
  let runId: string | null = null;

  try {
    const created = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: {
        role: "payroll_operator"
      }
    });
    if (created.error || !created.data.user?.id) {
      throw new Error(`createUser failed: ${created.error?.message ?? "unknown"}`);
    }
    createdUserId = created.data.user.id;

    const signedIn = await client.auth.signInWithPassword({ email, password });
    if (signedIn.error || !signedIn.data.session?.access_token) {
      throw new Error(`signInWithPassword failed: ${signedIn.error?.message ?? "unknown"}`);
    }
    const token = signedIn.data.session.access_token;

    const previewResponse = await fetch(`${baseUrl}/api/payroll/runs/preview-with-deductions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        periodStart: "2026-02-01T00:00:00+09:00",
        periodEnd: "2026-02-28T23:59:59+09:00",
        employeeId,
        hourlyRateKrw: 12000,
        deductions: {
          withholdingTaxKrw: 0,
          socialInsuranceKrw: 0,
          otherDeductionsKrw: 0
        }
      })
    });
    const previewBody = await readResponseBody(previewResponse);
    assert.equal(
      previewResponse.status,
      200,
      `preview-with-deductions failed: ${JSON.stringify(previewBody)}`
    );
    if (
      !previewBody ||
      typeof previewBody !== "object" ||
      !("run" in previewBody) ||
      !previewBody.run ||
      typeof previewBody.run !== "object" ||
      !("id" in previewBody.run) ||
      typeof previewBody.run.id !== "string"
    ) {
      throw new Error(`preview response missing run id: ${JSON.stringify(previewBody)}`);
    }
    runId = previewBody.run.id;

    const confirmResponse = await fetch(`${baseUrl}/api/payroll/runs/${runId}/confirm`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`
      }
    });
    const confirmBody = await readResponseBody(confirmResponse);
    assert.equal(confirmResponse.status, 200, `confirm failed: ${JSON.stringify(confirmBody)}`);

    console.log(
      JSON.stringify({
        ok: true,
        baseUrl,
        runId,
        previewStatus: previewResponse.status,
        confirmStatus: confirmResponse.status
      })
    );
  } finally {
    if (runId) {
      await prisma.auditLog.deleteMany({
        where: {
          entityType: "PayrollRun",
          entityId: runId
        }
      });
      await prisma.payrollRun.deleteMany({
        where: { id: runId }
      });
    }

    if (createdUserId) {
      await admin.auth.admin.deleteUser(createdUserId);
    }

    await prisma.$disconnect();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
