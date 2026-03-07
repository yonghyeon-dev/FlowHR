import assert from "node:assert/strict";

const runtimeEnv = process.env as Record<string, string | undefined>;
runtimeEnv.NODE_ENV = "test";
runtimeEnv.FLOWHR_DATA_ACCESS = "memory";

async function run() {
  const { ensureOrganizationRecord, resolveRecoveredOrganizationName } = await import(
    "../../src/features/auth/callback-organization-recovery.ts"
  );
  const { memoryDataAccess, resetMemoryDataAccess } = await import(
    "../../src/features/shared/memory-data-access.ts"
  );

  resetMemoryDataAccess();

  const recovered = await ensureOrganizationRecord({
    dataAccess: memoryDataAccess,
    organizationId: "org_admin_missing",
    organizationName: "Recovered Admin Org",
    email: "admin@example.com"
  });
  assert.equal(recovered.id, "org_admin_missing", "recovery should preserve metadata organization id");
  assert.equal(recovered.name, "Recovered Admin Org", "recovery should prefer metadata organization name");

  const existing = await ensureOrganizationRecord({
    dataAccess: memoryDataAccess,
    organizationId: "org_admin_missing",
    organizationName: "Different Name",
    email: "other@example.com"
  });
  assert.equal(existing.id, "org_admin_missing", "existing organization should be reused");
  assert.equal(existing.name, "Recovered Admin Org", "existing organization should not be replaced");

  assert.equal(
    resolveRecoveredOrganizationName({
      email: "cyh@flow-coder.com",
      organizationId: "org_fallback"
    }),
    "flow-coder.com",
    "email domain should provide fallback organization name"
  );

  assert.equal(
    resolveRecoveredOrganizationName({
      organizationId: "org_fallback"
    }),
    "Organization fallback",
    "organization id suffix should provide stable final fallback"
  );

  console.log("e2e-wi1025-admin-org-not-found-fix.test passed");
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
