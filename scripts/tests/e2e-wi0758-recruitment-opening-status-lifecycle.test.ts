import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

function readUtf8(...parts: string[]) {
  return readFileSync(join(process.cwd(), ...parts), "utf8");
}

async function run() {
  const statusRoute = readUtf8(
    "src",
    "app",
    "api",
    "recruitment",
    "openings",
    "[openingId]",
    "status",
    "route.ts"
  );
  const schemas = readUtf8("src", "features", "recruitment", "schemas.ts");
  const store = readUtf8("src", "features", "recruitment", "store.ts");
  const adminWorkspace = readUtf8("src", "components", "recruitment", "AdminRecruitmentWorkspace.tsx");
  const adminWorkspaceView = readUtf8(
    "src",
    "components",
    "recruitment",
    "AdminRecruitmentWorkspaceView.tsx"
  );
  const workItem = readUtf8("work-items", "WI-0758-recruitment-opening-status-lifecycle.md");
  const roadmap = readUtf8("ROADMAP.md");

  assert.match(schemas, /export const updateRecruitmentOpeningStatusSchema = z\.object\(/);
  assert.match(store, /export function updateRecruitmentOpeningStatus\(/);
  assert.match(statusRoute, /recruitment\.opening\.status\.forbidden/);
  assert.match(statusRoute, /updateRecruitmentOpeningStatusSchema/);
  assert.match(statusRoute, /await updateRecruitmentOpeningStatus\(/);
  assert.match(adminWorkspace, /\/api\/recruitment\/openings\/\$\{encodeURIComponent\(openingId\)\}\/status/);
  assert.match(adminWorkspaceView, /onUpdateOpeningStatus\(opening\.id, opening\.status === "OPEN" \? "CLOSED" : "OPEN"\)/);

  const recruitmentStore = await import("../../src/features/recruitment/store.ts");
  const memoryModule = await import("../../src/features/shared/memory-data-access.ts");
  const { memoryDataAccess, resetMemoryDataAccess } = memoryModule;

  resetMemoryDataAccess();
  const organization = await memoryDataAccess.organizations.create({ name: "Org Recruitment Status" });

  const created = await recruitmentStore.createRecruitmentOpening(
    {
      organizationId: organization.id,
      title: "QA Engineer",
      department: "Product",
      employmentType: "Full-time",
      status: "OPEN"
    },
    { dataAccess: memoryDataAccess }
  );
  assert.equal(created.status, "OPEN");

  const closed = await recruitmentStore.updateRecruitmentOpeningStatus(
    {
      openingId: created.id,
      status: "CLOSED",
      organizationId: organization.id
    },
    { dataAccess: memoryDataAccess }
  );
  assert.equal(closed?.status, "CLOSED");

  const openOnly = await recruitmentStore.listRecruitmentOpenings(
    {
      organizationId: organization.id,
      status: "OPEN"
    },
    { dataAccess: memoryDataAccess }
  );
  assert.equal(openOnly.length, 0);

  const all = await recruitmentStore.listRecruitmentOpenings(
    {
      organizationId: organization.id,
      status: "all"
    },
    { dataAccess: memoryDataAccess }
  );
  assert.equal(all.length, 1);
  assert.equal(all[0]?.status, "CLOSED");

  assert.match(workItem, /WI-0758/i);
  assert.match(workItem, /recruitment|opening|status|lifecycle|core journey/i);
  assert.match(roadmap, /WI-0758/i);
}

run()
  .then(() => {
    console.log("e2e-wi0758-recruitment-opening-status-lifecycle.test passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
